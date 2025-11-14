// ========================================
// GeoVisor Professional - Sistema de Información Geográfica
// ========================================

class GeoVisor {
    constructor() {
        this.map = null;
        this.baseLayers = {};
        this.currentBaseLayer = null;
        this.dataLayers = {};
        this.clusterGroups = {};
        this.drawnItems = null;
        this.measurementLayers = L.layerGroup();
        this.miniMap = null;
        this.drawControl = null;

        // Configuración de GeoServer
        this.geoserverUrl = 'http://localhost:8080/geoserver';
        this.workspace = 'cite'; // Ajustar según configuración

        // Configuración de proyección UTM
        this.setupProjection();

        // Coordenadas de inicio (ajustar según necesidad)
        this.defaultCenter = [-12.0464, -77.0428]; // Lima, Perú
        this.defaultZoom = 13;

        this.init();
    }

    // ========================================
    // Configurar Proyección UTM
    // ========================================
    setupProjection() {
        // Definir proyección UTM (ejemplo: UTM Zone 18S para Perú)
        if (typeof proj4 !== 'undefined') {
            proj4.defs("EPSG:32718", "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs");
        }
    }

    // ========================================
    // Inicialización
    // ========================================
    init() {
        // Ocultar loader cuando todo esté listo
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('page-loader').classList.add('hidden');
            }, 500);
        });

        this.initMap();
        this.initBaseLayers();
        this.initMiniMap();
        this.initDrawControls();
        this.initPrintControl();
        this.initEventListeners();
        this.initCoordinatesDisplay();
        this.initLayerCategories();
        this.initWFSLayers();
    }

    // ========================================
    // Inicializar Mapa
    // ========================================
    initMap() {
        // Crear el mapa con Canvas renderer para mejor performance
        this.map = L.map('map', {
            center: this.defaultCenter,
            zoom: this.defaultZoom,
            zoomControl: true,
            minZoom: 2,
            maxZoom: 22
        });

        // Posicionar controles de zoom
        this.map.zoomControl.setPosition('topright');

        // Intentar obtener geolocalización
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.map.setView([position.coords.latitude, position.coords.longitude], 13);
                },
                (error) => {
                    console.log('Geolocalización no disponible:', error);
                }
            );
        }
    }

    // ========================================
    // Inicializar Capas Base
    // ========================================
    initBaseLayers() {
        // OpenStreetMap
        this.baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        });

        // Google Satellite
        this.baseLayers.satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 22,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });

        // Google Hybrid (Satellite + Streets)
        const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 22
        });

        const streetsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 20
        });

        this.baseLayers.hybrid = L.layerGroup([satelliteLayer, streetsLayer]);

        // CartoDB Positron (Claro)
        this.baseLayers.positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 20
        });

        // CartoDB Dark Matter (Oscuro)
        this.baseLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 20
        });

        // ESRI Satellite
        this.baseLayers.esri_satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 22
        });

        // Topográfico
        this.baseLayers.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap © OpenTopoMap',
            maxZoom: 17
        });

        // Añadir capa base por defecto
        this.currentBaseLayer = this.baseLayers.osm;
        this.currentBaseLayer.addTo(this.map);
    }

    // ========================================
    // Mini Mapa
    // ========================================
    initMiniMap() {
        const miniMapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap, © CARTO'
        });

        this.miniMap = new L.Control.MiniMap(miniMapLayer, {
            toggleDisplay: true,
            minimized: false,
            position: 'bottomright',
            width: 150,
            height: 150,
            zoomLevelOffset: -5
        }).addTo(this.map);
    }

    // ========================================
    // Controles de Dibujo/Medición
    // ========================================
    initDrawControls() {
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);
        this.map.addLayer(this.measurementLayers);

        // Configurar opciones de dibujo
        this.drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polyline: {
                    shapeOptions: {
                        color: '#0d6efd',
                        weight: 3
                    },
                    metric: true,
                    feet: false,
                    showLength: true
                },
                polygon: {
                    shapeOptions: {
                        color: '#198754',
                        weight: 3
                    },
                    showArea: true,
                    metric: true
                },
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: this.drawnItems,
                remove: true
            }
        });

        // Eventos de dibujo
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            const type = e.layerType;

            if (type === 'polyline') {
                const distance = this.calculateDistance(layer);
                layer.bindPopup(`<div class="p-2"><strong>Distancia:</strong><br>${distance}</div>`).openPopup();
            } else if (type === 'polygon') {
                const area = this.calculateArea(layer);
                layer.bindPopup(`<div class="p-2"><strong>Área:</strong><br>${area}</div>`).openPopup();
            }

            this.measurementLayers.addLayer(layer);
        });
    }

    // ========================================
    // Calcular Distancia
    // ========================================
    calculateDistance(layer) {
        const latlngs = layer.getLatLngs();
        let distance = 0;

        for (let i = 0; i < latlngs.length - 1; i++) {
            distance += latlngs[i].distanceTo(latlngs[i + 1]);
        }

        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(2)} km`;
        } else {
            return `${distance.toFixed(2)} m`;
        }
    }

    // ========================================
    // Calcular Área
    // ========================================
    calculateArea(layer) {
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);

        if (area >= 1000000) {
            return `${(area / 1000000).toFixed(2)} km²`;
        } else if (area >= 10000) {
            return `${(area / 10000).toFixed(2)} ha`;
        } else {
            return `${area.toFixed(2)} m²`;
        }
    }

    // ========================================
    // Control de Impresión
    // ========================================
    initPrintControl() {
        L.easyPrint({
            title: 'Imprimir Mapa',
            position: 'topright',
            sizeModes: ['Current', 'A4Portrait', 'A4Landscape'],
            filename: 'geovisor_map',
            exportOnly: true,
            hideControlContainer: true
        }).addTo(this.map);
    }

    // ========================================
    // Event Listeners
    // ========================================
    initEventListeners() {
        // Cambiar capa base
        document.querySelectorAll('input[name="baseLayer"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeBaseLayer(e.target.value);
            });
        });

        // Herramientas de medición
        const measureDistanceBtn = document.getElementById('measureDistanceBtn');
        const measureAreaBtn = document.getElementById('measureAreaBtn');
        const clearMeasurementsBtn = document.getElementById('clearMeasurementsBtn');
        const printBtn = document.getElementById('printBtn');

        if (measureDistanceBtn) {
            measureDistanceBtn.addEventListener('click', () => {
                this.activateMeasureTool('distance');
            });
        }

        if (measureAreaBtn) {
            measureAreaBtn.addEventListener('click', () => {
                this.activateMeasureTool('area');
            });
        }

        if (clearMeasurementsBtn) {
            clearMeasurementsBtn.addEventListener('click', () => {
                this.clearMeasurements();
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printMap();
            });
        }

        // Botones de la barra superior
        const btnSuministro = document.getElementById('btnSuministro');
        const btnTabla = document.getElementById('btnTabla');

        if (btnSuministro) {
            btnSuministro.addEventListener('click', () => {
                this.showNotification('Funcionalidad de Suministro en desarrollo', 'info');
            });
        }

        if (btnTabla) {
            btnTabla.addEventListener('click', () => {
                this.showNotification('Vista de tabla en desarrollo', 'info');
            });
        }

        // Búsqueda en el header
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
    }

    // ========================================
    // Cambiar Capa Base
    // ========================================
    changeBaseLayer(layerName) {
        if (this.currentBaseLayer) {
            this.map.removeLayer(this.currentBaseLayer);
        }
        this.currentBaseLayer = this.baseLayers[layerName];
        this.currentBaseLayer.addTo(this.map);
    }

    // ========================================
    // Inicializar Categorías de Capas
    // ========================================
    initLayerCategories() {
        const categories = document.querySelectorAll('.layer-category');

        categories.forEach(category => {
            const title = category.querySelector('.layer-category-title');
            const subcategories = category.nextElementSibling;

            if (title && subcategories && subcategories.classList.contains('layer-subcategories')) {
                title.addEventListener('click', () => {
                    category.classList.toggle('expanded');
                    subcategories.classList.toggle('show');
                });
            }
        });
    }

    // ========================================
    // Inicializar Capas WFS
    // ========================================
    initWFSLayers() {
        const wfsCheckboxes = document.querySelectorAll('.layer-toggle-wfs');

        wfsCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const layerName = e.target.dataset.layer;
                const isChecked = e.target.checked;

                if (isChecked) {
                    this.loadWFSLayer(layerName);
                } else {
                    this.removeWFSLayer(layerName);
                }
            });
        });
    }

    // ========================================
    // Cargar Capa WFS
    // ========================================
    async loadWFSLayer(layerName) {
        try {
            const url = `${this.geoserverUrl}/wfs?service=WFS&version=1.1.0&request=GetFeature&typename=${this.workspace}:${layerName}&outputFormat=application/json`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error al cargar capa ${layerName}: ${response.status}`);
            }

            const data = await response.json();

            if (!data.features || data.features.length === 0) {
                this.showNotification(`La capa ${layerName} no tiene datos`, 'warning');
                return;
            }

            // Crear grupo de cluster para puntos
            const clusterGroup = L.markerClusterGroup({
                showCoverageOnHover: false,
                maxClusterRadius: 50
            });

            // Procesar features
            const geoJsonLayer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    return this.createMarker(feature, latlng, layerName);
                },
                onEachFeature: (feature, layer) => {
                    this.bindPopup(feature, layer, layerName);
                },
                style: (feature) => {
                    return this.getLayerStyle(layerName);
                }
            });

            // Añadir a cluster si es punto, sino directamente al mapa
            if (data.features[0].geometry.type === 'Point') {
                clusterGroup.addLayer(geoJsonLayer);
                this.map.addLayer(clusterGroup);
                this.clusterGroups[layerName] = clusterGroup;
            } else {
                this.map.addLayer(geoJsonLayer);
                this.dataLayers[layerName] = geoJsonLayer;
            }

            this.showNotification(`Capa ${layerName} cargada: ${data.features.length} elementos`, 'success');

        } catch (error) {
            console.error(`Error al cargar capa WFS ${layerName}:`, error);
            this.showNotification(`Error al cargar capa ${layerName}. Verifica GeoServer.`, 'danger');
        }
    }

    // ========================================
    // Crear Marcador Personalizado
    // ========================================
    createMarker(feature, latlng, layerName) {
        const color = this.getLayerColor(layerName);

        return L.circleMarker(latlng, {
            radius: 6,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
    }

    // ========================================
    // Obtener Color por Capa
    // ========================================
    getLayerColor(layerName) {
        const colors = {
            'ficha_comercial': '#cc0066',
            'pozos_produccion': '#0066cc',
            'tanque_reservorio': '#00cc66',
            'lineas_agua': '#0099ff',
            'tuberias': '#0066ff',
            'linea_abandonada': '#999999',
            'hidrante': '#ff0000',
            'valvula_compuerta': '#cc6600',
            'valvula_aire': '#ffcc00',
            'acometida_hidrante': '#ff6600',
            'macromedidor': '#9933cc',
            'accesorios_red': '#666666',
            'camara_inspeccion': '#663300',
            'redes_gravedad': '#996633',
            'red_presurizada': '#cc9966',
            'ssfitting': '#ff9900',
            'ssstructure': '#cc6600',
            'estacion_bombeo': '#990000',
            'planta_tratamiento': '#006600',
            'control_geodesico': '#ff0000',
            'calicata': '#ffcc00',
            'vias': '#333333',
            'manzana': '#666666',
            'esquinas': '#0066cc',
            'lotes': '#999999',
            'conexion_desague': '#996600'
        };
        return colors[layerName] || '#0d6efd';
    }

    // ========================================
    // Obtener Estilo por Capa
    // ========================================
    getLayerStyle(layerName) {
        const color = this.getLayerColor(layerName);
        return {
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.5
        };
    }

    // ========================================
    // Bind Popup a Feature
    // ========================================
    bindPopup(feature, layer, layerName) {
        const props = feature.properties;

        let popupContent = `
            <div class="feature-popup">
                <div class="popup-header">${this.formatLayerName(layerName)}</div>
                <div class="popup-body">
                    <table>
        `;

        // Agregar propiedades
        for (const [key, value] of Object.entries(props)) {
            if (value && key !== 'imagen' && key !== 'foto' && !key.startsWith('geom')) {
                popupContent += `
                    <tr>
                        <td>${this.formatFieldName(key)}</td>
                        <td>${value}</td>
                    </tr>
                `;
            }
        }

        popupContent += `</table>`;

        // Agregar imagen si existe
        if (props.imagen || props.foto) {
            const imageUrl = props.imagen || props.foto;
            popupContent += `
                <img src="${imageUrl}" class="popup-image"
                     onerror="this.style.display='none'"
                     onclick="window.open('${imageUrl}', '_blank')">
            `;
        }

        popupContent += `</div></div>`;

        layer.bindPopup(popupContent, {
            maxWidth: 400,
            className: 'custom-popup'
        });
    }

    // ========================================
    // Formatear Nombre de Capa
    // ========================================
    formatLayerName(layerName) {
        const names = {
            'ficha_comercial': 'Ficha Comercial',
            'pozos_produccion': 'Pozo de Producción',
            'tanque_reservorio': 'Tanque Reservorio',
            'lineas_agua': 'Línea de Agua',
            'tuberias': 'Tubería',
            'hidrante': 'Hidrante',
            'valvula_compuerta': 'Válvula de Compuerta',
            'valvula_aire': 'Válvula de Aire',
            'camara_inspeccion': 'Cámara de Inspección',
            'estacion_bombeo': 'Estación de Bombeo',
            'planta_tratamiento': 'Planta de Tratamiento'
        };
        return names[layerName] || layerName.replace(/_/g, ' ').toUpperCase();
    }

    // ========================================
    // Formatear Nombre de Campo
    // ========================================
    formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // ========================================
    // Remover Capa WFS
    // ========================================
    removeWFSLayer(layerName) {
        if (this.dataLayers[layerName]) {
            this.map.removeLayer(this.dataLayers[layerName]);
            delete this.dataLayers[layerName];
        }
        if (this.clusterGroups[layerName]) {
            this.map.removeLayer(this.clusterGroups[layerName]);
            delete this.clusterGroups[layerName];
        }
    }

    // ========================================
    // Activar Herramienta de Medición
    // ========================================
    activateMeasureTool(type) {
        // Remover controles de dibujo anteriores si existen
        if (this.map._toolbarContainer) {
            this.map.removeControl(this.drawControl);
        }

        // Actualizar estilos de botones
        document.querySelectorAll('#measureDistanceBtn, #measureAreaBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (type === 'distance') {
            document.getElementById('measureDistanceBtn').classList.add('active');

            // Activar herramienta de línea
            this.map.addControl(this.drawControl);
            new L.Draw.Polyline(this.map, this.drawControl.options.draw.polyline).enable();

        } else if (type === 'area') {
            document.getElementById('measureAreaBtn').classList.add('active');

            // Activar herramienta de polígono
            this.map.addControl(this.drawControl);
            new L.Draw.Polygon(this.map, this.drawControl.options.draw.polygon).enable();
        }

        this.showNotification(`Herramienta de medición de ${type === 'distance' ? 'distancia' : 'área'} activada`, 'info');
    }

    // ========================================
    // Limpiar Mediciones
    // ========================================
    clearMeasurements() {
        this.measurementLayers.clearLayers();
        this.drawnItems.clearLayers();

        // Remover estado activo de botones
        document.querySelectorAll('#measureDistanceBtn, #measureAreaBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.showNotification('Mediciones eliminadas', 'info');
    }

    // ========================================
    // Imprimir Mapa
    // ========================================
    printMap() {
        // Trigger del plugin EasyPrint
        const printBtn = document.querySelector('.leaflet-control-easyPrint-button');
        if (printBtn) {
            printBtn.click();
        } else {
            // Fallback a imprimir la ventana
            window.print();
        }
    }

    // ========================================
    // Búsqueda de Ubicación
    // ========================================
    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();

        if (!query) {
            this.showNotification('Por favor, ingresa una ubicación para buscar', 'warning');
            return;
        }

        try {
            // Usar Nominatim de OpenStreetMap para geocodificación
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

                // Centrar el mapa en el resultado
                this.map.setView([lat, lon], 15);

                // Añadir marcador
                const marker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'custom-search-marker',
                        html: '<i class="fas fa-map-marker-alt text-danger" style="font-size: 2rem;"></i>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    })
                }).addTo(this.map);

                marker.bindPopup(`<div class="p-2"><strong>${result.display_name}</strong></div>`).openPopup();

                this.showNotification('Ubicación encontrada', 'success');
            } else {
                this.showNotification('No se encontraron resultados', 'warning');
            }

        } catch (error) {
            console.error('Error en la búsqueda:', error);
            this.showNotification('Error al realizar la búsqueda', 'danger');
        }
    }

    // ========================================
    // Display de Coordenadas
    // ========================================
    initCoordinatesDisplay() {
        const coordsDisplay = document.getElementById('mouse-coords');

        if (!coordsDisplay) {
            console.warn('Elemento mouse-coords no encontrado');
            return;
        }

        // Actualizar coordenadas cuando el mouse se mueve sobre el mapa
        this.map.on('mousemove', (e) => {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            coordsDisplay.textContent = `Lat: ${lat}, Lng: ${lng}`;
        });

        // Resetear cuando el mouse sale del mapa
        this.map.on('mouseout', () => {
            coordsDisplay.textContent = 'Lat: --, Lng: --';
        });
    }

    // ========================================
    // Mostrar Notificación
    // ========================================
    showNotification(message, type = 'info') {
        const typeMap = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'danger': 'danger',
            'error': 'danger'
        };

        const bootstrapType = typeMap[type] || 'info';

        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${bootstrapType} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);

        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 4000
        });

        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }
}

// ========================================
// Inicializar GeoVisor
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.geovisor = new GeoVisor();
});
