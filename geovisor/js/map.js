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
            maxZoom: 20
        });

        // Intentar obtener la geolocalización del usuario
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.map.setView([position.coords.latitude, position.coords.longitude], 10);
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
        // OpenStreetMap
        this.baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        // Satélite (Esri World Imagery)
        this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
        });

        // Modo Oscuro (CartoDB Dark Matter)
        this.baseLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap, © CartoDB',
            maxZoom: 19
        });

        // Añadir la capa base por defecto
        this.currentBaseLayer = this.baseLayers.osm;
        this.currentBaseLayer.addTo(this.map);
    }

    // ========================================
    // Mini Mapa
    // ========================================
    initMiniMap() {
        const miniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
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
                        color: '#00f7ff',
                        weight: 3
                    },
                    metric: true,
                    feet: false,
                    showLength: true
                },
                polygon: {
                    shapeOptions: {
                        color: '#ff006e',
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
                layer.bindPopup(`<strong>Distancia:</strong> ${distance}`).openPopup();
            } else if (type === 'polygon') {
                const area = this.calculateArea(layer);
                layer.bindPopup(`<strong>Área:</strong> ${area}`).openPopup();
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
            display.style.display = display.style.display === 'none' ? 'block' : 'none';
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
            this.showNotification('Por favor, ingresa una URL de GeoServer', 'error');
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
                    const layerItem = document.createElement('div');
                    layerItem.className = 'layer-item';
                    layerItem.innerHTML = `
                        <input type="checkbox" id="layer-${index}" value="${layerName}">
                        <label for="layer-${index}">
                            <i class="fas fa-layer-group"></i> ${layerTitle}
                        </label>
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
            this.showNotification('Error al conectar con GeoServer. Verifica la URL.', 'error');
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
        document.querySelectorAll('.tool-btn').forEach(btn => {
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
        document.querySelectorAll('.tool-btn').forEach(btn => {
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
                this.map.setView([lat, lon], 13);

                // Añadir marcador
                const marker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'custom-search-marker',
                        html: '<i class="fas fa-map-marker-alt" style="color: #ff006e; font-size: 2rem;"></i>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    })
                }).addTo(this.map);

                marker.bindPopup(`<strong>${result.display_name}</strong>`).openPopup();

                this.showNotification('Ubicación encontrada', 'success');
            } else {
                this.showNotification('No se encontraron resultados', 'warning');
            }

        } catch (error) {
            console.error('Error en la búsqueda:', error);
            this.showNotification('Error al realizar la búsqueda', 'error');
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
    // Mostrar Notificación
    // ========================================
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#ff006e' : type === 'success' ? '#00f7ff' : type === 'warning' ? '#ffd700' : '#7b2cbf'};
            color: ${type === 'warning' ? '#000' : '#fff'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// ========================================
// Animaciones CSS para notificaciones
// ========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========================================
// Inicializar GeoVisor cuando el DOM esté listo
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.geovisor = new GeoVisor();
});
