// ========================================
// GeoVisor - Sistema de Información Geográfica
// ========================================

class GeoVisor {
    constructor() {
        this.map = null;
        this.baseLayers = {};
        this.currentBaseLayer = null;
        this.dataLayers = {};
        this.drawnItems = null;
        this.measurementLayers = L.layerGroup();
        this.miniMap = null;

        this.init();
    }

    // ========================================
    // Inicialización
    // ========================================
    init() {
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
        // Crear el mapa centrado en una ubicación predeterminada
        this.map = L.map('map', {
            center: [0, 0],
            zoom: 3,
            zoomControl: true,
            minZoom: 2,
            maxZoom: 22  // Permitir más zoom
        });

        // Intentar obtener la geolocalización del usuario
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.map.setView([position.coords.latitude, position.coords.longitude], 13);
                },
                (error) => {
                    console.log('No se pudo obtener la geolocalización:', error);
                    // Centro por defecto (ejemplo: España)
                    this.map.setView([40.416775, -3.703790], 6);
                }
            );
        } else {
            this.map.setView([40.416775, -3.703790], 6);
        }

        // Personalizar controles de zoom
        this.map.zoomControl.setPosition('topright');
    }

    // ========================================
    // Capas Base
    // ========================================
    initBaseLayers() {
        // OpenStreetMap - Máximo zoom 19
        this.baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        });

        // CartoDB Positron - Excelente calidad hasta zoom 20
        this.baseLayers.cartodb = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        });

        // Google Satellite con Calles y Límites superpuestos
        const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 21,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });

        const streetsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: ' | © Esri',
            maxZoom: 20
        });

        // Combinar satélite + calles en un layerGroup
        this.baseLayers.satellite = L.layerGroup([satelliteLayer, streetsLayer]);

        // Stamen Terrain - Terreno con relieve
        this.baseLayers.terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            maxZoom: 18
        });

        // CartoDB Dark Matter - Modo oscuro
        this.baseLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        });

        // Añadir la capa base por defecto
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
    // Display de Coordenadas
    // ========================================
    initCoordinatesDisplay() {
        const coordsDisplay = document.getElementById('mouseCoords');

        this.map.on('mousemove', (e) => {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            coordsDisplay.textContent = `Lat: ${lat}, Lng: ${lng}`;
        });

        // Toggle display de coordenadas
        document.getElementById('coordinatesBtn').addEventListener('click', () => {
            const display = document.getElementById('coordinatesDisplay');
            display.classList.toggle('hidden');
        });
    }

    // ========================================
    // Event Listeners
    // ========================================
    initEventListeners() {
        // Toggle Sidebar
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-chevron-left';
            }

            // Invalidar tamaño del mapa después de toggle
            setTimeout(() => {
                this.map.invalidateSize();
            }, 300);
        });

        // Cambiar capa base
        document.querySelectorAll('input[name="baseLayer"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeBaseLayer(e.target.value);
            });
        });

        // Cargar capas de GeoServer
        document.getElementById('loadLayersBtn').addEventListener('click', () => {
            this.loadGeoServerLayers();
        });

        // Herramientas de medición
        document.getElementById('measureDistanceBtn').addEventListener('click', () => {
            this.activateMeasureTool('distance');
        });

        document.getElementById('measureAreaBtn').addEventListener('click', () => {
            this.activateMeasureTool('area');
        });

        document.getElementById('clearMeasurementsBtn').addEventListener('click', () => {
            this.clearMeasurements();
        });

        // Búsqueda
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Pantalla completa
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Imprimir
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printMap();
        });
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
    // Cargar Capas de GeoServer
    // ========================================
    async loadGeoServerLayers() {
        const geoserverUrl = document.getElementById('geoserverUrl').value;
        const loadingSpinner = document.getElementById('loadingSpinner');

        if (!geoserverUrl) {
            this.showNotification('Por favor, ingresa una URL de GeoServer', 'warning');
            return;
        }

        loadingSpinner.classList.add('active');

        try {
            // Obtener capacidades WMS
            const capabilitiesUrl = `${geoserverUrl}?service=WMS&version=1.1.0&request=GetCapabilities`;
            const response = await fetch(capabilitiesUrl);
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Parsear capas
            const layers = xml.querySelectorAll('Layer > Layer');
            const dataLayersList = document.getElementById('dataLayersList');
            dataLayersList.innerHTML = '';

            if (layers.length === 0) {
                this.showNotification('No se encontraron capas en el servidor', 'warning');
                loadingSpinner.classList.remove('active');
                return;
            }

            layers.forEach((layerNode, index) => {
                const nameNode = layerNode.querySelector('Name');
                const titleNode = layerNode.querySelector('Title');

                if (nameNode) {
                    const layerName = nameNode.textContent;
                    const layerTitle = titleNode ? titleNode.textContent : layerName;

                    // Crear elemento de capa
                    const layerItem = document.createElement('label');
                    layerItem.className = 'list-group-item list-group-item-action';
                    layerItem.innerHTML = `
                        <input class="form-check-input me-2" type="checkbox" id="layer-${index}" value="${layerName}">
                        <i class="fas fa-layer-group me-2 text-primary"></i>${layerTitle}
                    `;

                    // Event listener para toggle de capa
                    const checkbox = layerItem.querySelector('input');
                    checkbox.addEventListener('change', (e) => {
                        this.toggleDataLayer(layerName, e.target.checked, geoserverUrl);
                    });

                    dataLayersList.appendChild(layerItem);
                }
            });

            this.showNotification(`${layers.length} capas cargadas exitosamente`, 'success');

        } catch (error) {
            console.error('Error al cargar capas:', error);
            this.showNotification('Error al conectar con GeoServer. Verifica la URL.', 'danger');
        } finally {
            loadingSpinner.classList.remove('active');
        }
    }

    // ========================================
    // Toggle Data Layer
    // ========================================
    toggleDataLayer(layerName, show, geoserverUrl) {
        if (show) {
            // Añadir capa WMS
            const wmsLayer = L.tileLayer.wms(geoserverUrl, {
                layers: layerName,
                format: 'image/png',
                transparent: true,
                version: '1.1.0',
                attribution: 'GeoServer'
            });

            wmsLayer.addTo(this.map);
            this.dataLayers[layerName] = wmsLayer;
        } else {
            // Remover capa
            if (this.dataLayers[layerName]) {
                this.map.removeLayer(this.dataLayers[layerName]);
                delete this.dataLayers[layerName];
            }
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
        document.querySelectorAll('.btn-outline-primary, .btn-outline-secondary').forEach(btn => {
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
    }

    // ========================================
    // Limpiar Mediciones
    // ========================================
    clearMeasurements() {
        this.measurementLayers.clearLayers();
        this.drawnItems.clearLayers();

        // Remover estado activo de botones
        document.querySelectorAll('.btn-outline-primary, .btn-outline-secondary').forEach(btn => {
            btn.classList.remove('active');
        });

        this.showNotification('Mediciones eliminadas', 'info');
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

        const loadingSpinner = document.getElementById('loadingSpinner');
        loadingSpinner.classList.add('active');

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
        } finally {
            loadingSpinner.classList.remove('active');
        }
    }

    // ========================================
    // Pantalla Completa
    // ========================================
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.getElementById('fullscreenBtn').querySelector('i').className = 'fas fa-compress';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                document.getElementById('fullscreenBtn').querySelector('i').className = 'fas fa-expand';
            }
        }
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
    // Mostrar Notificación con Bootstrap
    // ========================================
    showNotification(message, type = 'info') {
        // Mapear tipos a clases de Bootstrap
        const typeMap = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'danger': 'danger',
            'error': 'danger'
        };

        const bootstrapType = typeMap[type] || 'info';

        // Crear elemento de notificación con Bootstrap Toast
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
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);

        // Inicializar y mostrar el toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });

        bsToast.show();

        // Remover el contenedor después de que se oculte
        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }

    // ========================================
    // Inicializar Categorías de Capas (Expandir/Colapsar)
    // ========================================
    initLayerCategories() {
        const categories = document.querySelectorAll('.layer-category');

        categories.forEach(category => {
            const title = category.querySelector('.layer-category-title');
            const subcategories = category.nextElementSibling;

            if (title && subcategories && subcategories.classList.contains('layer-subcategories')) {
                title.addEventListener('click', () => {
                    // Toggle expanded class
                    category.classList.toggle('expanded');

                    // Toggle subcategories visibility
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
        const geoserverUrl = 'http://localhost:8080/geoserver';  // URL base

        wfsCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const layerName = e.target.dataset.layer;
                const isChecked = e.target.checked;

                if (isChecked) {
                    this.addWFSLayer(layerName, geoserverUrl);
                } else {
                    this.removeWFSLayer(layerName);
                }
            });
        });
    }

    // ========================================
    // Añadir Capa WFS
    // ========================================
    addWFSLayer(layerName, geoserverUrl) {
        try {
            // Crear capa WMS (más eficiente que WFS para visualización)
            const wmsLayer = L.tileLayer.wms(`${geoserverUrl}/wms`, {
                layers: `cite:${layerName}`,  // Ajustar el workspace según configuración
                format: 'image/png',
                transparent: true,
                version: '1.1.1',
                attribution: `Layer: ${layerName}`
            });

            wmsLayer.addTo(this.map);
            this.dataLayers[layerName] = wmsLayer;

            console.log(`Capa ${layerName} añadida`);
        } catch (error) {
            console.error(`Error al añadir capa ${layerName}:`, error);
            this.showNotification(`Error al cargar la capa ${layerName}`, 'danger');
        }
    }

    // ========================================
    // Remover Capa WFS
    // ========================================
    removeWFSLayer(layerName) {
        if (this.dataLayers[layerName]) {
            this.map.removeLayer(this.dataLayers[layerName]);
            delete this.dataLayers[layerName];
            console.log(`Capa ${layerName} removida`);
        }
    }
}

// ========================================
// Inicializar GeoVisor cuando el DOM esté listo
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.geovisor = new GeoVisor();
});
