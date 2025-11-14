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
        this.measurementLayers = L.layerGroup();
        this.currentMeasureTool = null;

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
        this.initEventListeners();
        this.initLayerCategories();
        this.initWFSLayers();
        this.initToolButtons();
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
            preferCanvas: true,
            renderer: L.canvas()
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

        // Agregar capa de mediciones
        this.map.addLayer(this.measurementLayers);
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
        this.baseLayers.hybrid = L.layerGroup([
            L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 22
            }),
            L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 20
            })
        ]);

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
        const icon = this.getLayerIcon(layerName);

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
    // Obtener Icono por Capa
    // ========================================
    getLayerIcon(layerName) {
        const icons = {
            'ficha_comercial': 'fa-home',
            'pozos_produccion': 'fa-circle',
            'hidrante': 'fa-fire-extinguisher',
            'macromedidor': 'fa-tachometer-alt',
            'estacion_bombeo': 'fa-industry',
            'planta_tratamiento': 'fa-industry',
            'control_geodesico': 'fa-crosshairs'
        };
        return icons[layerName] || 'fa-circle';
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
        // Desactivar herramienta anterior
        if (this.currentMeasureTool) {
            this.map.off('click');
            this.currentMeasureTool = null;
        }

        // Actualizar estilos de botones
        document.querySelectorAll('#measureDistanceBtn, #measureAreaBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (type === 'distance') {
            document.getElementById('measureDistanceBtn').classList.add('active');
            this.startDistanceMeasurement();
        } else if (type === 'area') {
            document.getElementById('measureAreaBtn').classList.add('active');
            this.startAreaMeasurement();
        }

        this.currentMeasureTool = type;
    }

    // ========================================
    // Medición de Distancia
    // ========================================
    startDistanceMeasurement() {
        let points = [];
        let polyline = null;
        let markers = [];

        const measureClick = (e) => {
            points.push(e.latlng);

            // Añadir marcador
            const marker = L.circleMarker(e.latlng, {
                radius: 5,
                color: '#0d6efd',
                fillColor: '#fff',
                fillOpacity: 1
            }).addTo(this.measurementLayers);
            markers.push(marker);

            // Actualizar línea
            if (polyline) {
                this.measurementLayers.removeLayer(polyline);
            }

            if (points.length > 1) {
                polyline = L.polyline(points, {
                    color: '#0d6efd',
                    weight: 3
                }).addTo(this.measurementLayers);

                const distance = this.calculateDistance(points);
                polyline.bindPopup(`<strong>Distancia:</strong> ${distance}`).openPopup();
            }
        };

        const measureDblClick = () => {
            this.map.off('click', measureClick);
            this.map.off('dblclick', measureDblClick);
            document.getElementById('measureDistanceBtn').classList.remove('active');
            this.currentMeasureTool = null;
            points = [];
            markers = [];
        };

        this.map.on('click', measureClick);
        this.map.on('dblclick', measureDblClick);

        this.showNotification('Haz clic en el mapa para medir distancia. Doble clic para finalizar.', 'info');
    }

    // ========================================
    // Medición de Área
    // ========================================
    startAreaMeasurement() {
        let points = [];
        let polygon = null;
        let markers = [];

        const measureClick = (e) => {
            points.push(e.latlng);

            // Añadir marcador
            const marker = L.circleMarker(e.latlng, {
                radius: 5,
                color: '#198754',
                fillColor: '#fff',
                fillOpacity: 1
            }).addTo(this.measurementLayers);
            markers.push(marker);

            // Actualizar polígono
            if (polygon) {
                this.measurementLayers.removeLayer(polygon);
            }

            if (points.length > 2) {
                polygon = L.polygon(points, {
                    color: '#198754',
                    weight: 3,
                    fillOpacity: 0.2
                }).addTo(this.measurementLayers);

                const area = this.calculateArea(points);
                polygon.bindPopup(`<strong>Área:</strong> ${area}`).openPopup();
            }
        };

        const measureDblClick = () => {
            this.map.off('click', measureClick);
            this.map.off('dblclick', measureDblClick);
            document.getElementById('measureAreaBtn').classList.remove('active');
            this.currentMeasureTool = null;
            points = [];
            markers = [];
        };

        this.map.on('click', measureClick);
        this.map.on('dblclick', measureDblClick);

        this.showNotification('Haz clic en el mapa para medir área. Doble clic para finalizar.', 'info');
    }

    // ========================================
    // Calcular Distancia
    // ========================================
    calculateDistance(points) {
        let distance = 0;
        for (let i = 0; i < points.length - 1; i++) {
            distance += points[i].distanceTo(points[i + 1]);
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
    calculateArea(points) {
        const polygon = L.polygon(points);
        const area = L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0]);

        if (area >= 1000000) {
            return `${(area / 1000000).toFixed(2)} km²`;
        } else if (area >= 10000) {
            return `${(area / 10000).toFixed(2)} ha`;
        } else {
            return `${area.toFixed(2)} m²`;
        }
    }

    // ========================================
    // Limpiar Mediciones
    // ========================================
    clearMeasurements() {
        this.measurementLayers.clearLayers();

        if (this.currentMeasureTool) {
            this.map.off('click');
            this.map.off('dblclick');
            this.currentMeasureTool = null;
        }

        document.querySelectorAll('#measureDistanceBtn, #measureAreaBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.showNotification('Mediciones eliminadas', 'info');
    }

    // ========================================
    // Imprimir Mapa
    // ========================================
    printMap() {
        window.print();
    }

    // ========================================
    // Inicializar Botones del Panel Derecho
    // ========================================
    initToolButtons() {
        // Botón Home
        const btnHome = document.getElementById('btnHome');
        if (btnHome) {
            btnHome.addEventListener('click', () => {
                this.map.setView(this.defaultCenter, this.defaultZoom);
            });
        }

        // Botón Google Maps
        const btnGoogleMaps = document.getElementById('btnGoogleMaps');
        if (btnGoogleMaps) {
            btnGoogleMaps.addEventListener('click', () => {
                const center = this.map.getCenter();
                const zoom = this.map.getZoom();
                const url = `https://www.google.com/maps/@${center.lat},${center.lng},${zoom}z`;
                window.open(url, '_blank');
            });
        }

        // Botón Búsqueda
        const btnSearch = document.getElementById('btnSearch');
        const searchModal = new bootstrap.Modal(document.getElementById('searchModal'));

        if (btnSearch) {
            btnSearch.addEventListener('click', () => {
                searchModal.show();
            });
        }

        // Ejecutar búsqueda
        const btnDoSearch = document.getElementById('btnDoSearch');
        if (btnDoSearch) {
            btnDoSearch.addEventListener('click', () => {
                this.performAdvancedSearch();
            });
        }

        // Enter en input de búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performAdvancedSearch();
                }
            });
        }
    }

    // ========================================
    // Realizar Búsqueda Avanzada
    // ========================================
    async performAdvancedSearch() {
        const searchType = document.getElementById('searchType').value;
        const searchInput = document.getElementById('searchInput').value.trim();

        if (!searchInput) {
            this.showNotification('Ingrese un término de búsqueda', 'warning');
            return;
        }

        // En un sistema real, esto haría una consulta al servidor
        // Por ahora, mostramos un mensaje
        this.showNotification(`Buscando ${searchType}: ${searchInput}...`, 'info');

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('searchModal'));
        modal.hide();
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
