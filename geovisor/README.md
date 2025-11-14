# 🌍 GeoVisor - Sistema de Información Geográfica

GeoVisor es una aplicación web moderna y futurista para visualización de datos geoespaciales, construida con Leaflet y diseñada para trabajar con capas de GeoServer.

## ✨ Características

### 🗺️ **Visualización de Mapas**
- Múltiples capas base (OpenStreetMap, Satélite, Modo Oscuro)
- Integración con GeoServer para capas WMS
- Control de capas intuitivo
- Minimapa para navegación contextual

### 🔍 **Búsqueda**
- Búsqueda geocodificada de ubicaciones
- Resultados con marcadores y popups informativos
- Powered by OpenStreetMap Nominatim

### 📏 **Herramientas de Medición**
- Medición de distancias (líneas)
- Medición de áreas (polígonos)
- Resultados en metros, kilómetros, hectáreas
- Limpiar mediciones con un clic

### 🖨️ **Impresión**
- Exportar mapa a imagen
- Múltiples tamaños (Current, A4 Portrait, A4 Landscape)
- Plugin Leaflet EasyPrint integrado

### 🎨 **Diseño Moderno y Futurista**
- Paleta de colores cyan/magenta/púrpura
- Efectos glow y gradientes
- Fuentes Orbitron y Rajdhani
- Animaciones suaves
- Interfaz responsive

## 🚀 Instalación

### Requisitos Previos
- Un servidor web (Apache, Nginx, o un servidor local simple)
- GeoServer instalado y configurado (opcional, para capas de datos)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tuusuario/primerRepo.git
   cd primerRepo/geovisor
   ```

2. **Abrir con un servidor local:**

   Con Python 3:
   ```bash
   python -m http.server 8000
   ```

   Con Node.js (http-server):
   ```bash
   npx http-server -p 8000
   ```

   Con PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Acceder a la aplicación:**
   Abre tu navegador y ve a: `http://localhost:8000`

## 🔧 Configuración de GeoServer

### Configurar URL de GeoServer

1. En el menú lateral, localiza la sección **"Capas de Datos"**
2. Ingresa la URL de tu servidor GeoServer en el campo de texto:
   ```
   http://tu-servidor:8080/geoserver/wms
   ```
   o para un workspace específico:
   ```
   http://tu-servidor:8080/geoserver/tu_workspace/wms
   ```

3. Haz clic en el botón **"Cargar Capas"**

4. Las capas disponibles aparecerán en la lista
5. Marca/desmarca las capas para mostrarlas/ocultarlas en el mapa

### Ejemplo de URLs de GeoServer

- **Local:** `http://localhost:8080/geoserver/wms`
- **Remoto:** `http://demo.geoserver.org/geoserver/wms`
- **Con workspace:** `http://localhost:8080/geoserver/mi_workspace/wms`

## 📖 Uso

### Cambiar Capa Base
En el menú lateral, sección "Capas Base", selecciona una de las opciones:
- 🗺️ OpenStreetMap
- 🛰️ Satélite
- 🌙 Modo Oscuro

### Buscar Ubicaciones
1. Escribe el nombre de una ubicación en la barra de búsqueda del header
2. Presiona Enter o haz clic en el botón de búsqueda
3. El mapa se centrará en la ubicación encontrada

### Medir Distancias
1. Haz clic en el botón **"Distancia"** en la sección de Herramientas
2. Haz clic en el mapa para crear puntos
3. Haz doble clic para finalizar
4. La distancia total se mostrará en un popup

### Medir Áreas
1. Haz clic en el botón **"Área"** en la sección de Herramientas
2. Haz clic en el mapa para crear vértices del polígono
3. Haz clic en el primer punto o doble clic para finalizar
4. El área total se mostrará en un popup

### Imprimir el Mapa
1. Haz clic en el botón **"Imprimir"** en la sección de Herramientas
2. Selecciona el tamaño deseado
3. El mapa se exportará como imagen

### Ver Coordenadas
1. Haz clic en el botón de coordenadas (🎯) en el header
2. Mueve el cursor sobre el mapa para ver las coordenadas en tiempo real
3. Formato: Lat/Lng con 6 decimales

### Pantalla Completa
Haz clic en el botón de pantalla completa (⛶) en el header para expandir la aplicación.

## 🏗️ Estructura del Proyecto

```
geovisor/
├── index.html          # Estructura HTML principal
├── css/
│   └── styles.css      # Estilos modernos y futuristas
├── js/
│   └── map.js          # Lógica de la aplicación
├── config/
│   └── (archivos de configuración opcionales)
└── README.md           # Este archivo
```

## 🛠️ Tecnologías Utilizadas

- **Leaflet 1.9.4** - Biblioteca de mapas interactivos
- **Leaflet.draw** - Herramientas de dibujo y medición
- **Leaflet MiniMap** - Control de minimapa
- **Leaflet EasyPrint** - Exportación e impresión
- **Font Awesome 6.4** - Iconos
- **Google Fonts** - Tipografías Orbitron y Rajdhani

## 🎨 Personalización

### Cambiar Colores
Edita las variables CSS en `css/styles.css`:

```css
:root {
    --primary-color: #00f7ff;      /* Color primario (cyan) */
    --secondary-color: #7b2cbf;    /* Color secundario (púrpura) */
    --accent-color: #ff006e;       /* Color de acento (magenta) */
    --dark-bg: #0a0e27;            /* Fondo oscuro */
    --darker-bg: #050816;          /* Fondo más oscuro */
}
```

### Cambiar Ubicación Inicial
Edita en `js/map.js`, método `initMap()`:

```javascript
this.map.setView([latitud, longitud], zoom);
```

### Añadir Más Capas Base
En `js/map.js`, método `initBaseLayers()`:

```javascript
this.baseLayers.miCapa = L.tileLayer('URL_DEL_TILE_LAYER', {
    attribution: 'Atribución',
    maxZoom: 19
});
```

## 🐛 Solución de Problemas

### Las capas de GeoServer no se cargan
- Verifica que la URL de GeoServer sea correcta
- Asegúrate de que GeoServer esté en ejecución
- Revisa la consola del navegador para errores CORS
- Configura CORS en GeoServer si es necesario

### El minimapa no aparece
- Verifica que todos los scripts estén cargados correctamente
- Revisa la consola del navegador para errores

### Las mediciones no funcionan
- Asegúrate de que Leaflet.draw esté cargado
- Verifica que no haya conflictos con otros plugins

## 📝 Licencia

Este proyecto es de código abierto. Puedes usarlo, modificarlo y distribuirlo libremente.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas, sugerencias o reportar bugs, abre un issue en el repositorio.

---

**Desarrollado con 💙 usando Leaflet y tecnologías web modernas**
