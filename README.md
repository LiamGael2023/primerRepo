# Chavimochic App

Aplicación Flutter con splash screen y sistema de login moderno.

## Características

- ✨ Splash Screen animado con fondo blanco y logo
- 🔐 Pantalla de login con diseño moderno y validación
- 📱 Interfaz responsive y Material Design 3
- 🎨 Gradientes y animaciones suaves
- 🏠 Pantalla principal con navegación

## Estructura del Proyecto

```
lib/
├── main.dart              # Punto de entrada de la aplicación
└── screens/
    ├── splash_screen.dart # Splash screen con logo
    ├── login_screen.dart  # Pantalla de login
    └── home_screen.dart   # Pantalla principal
```

## Configuración

### Logo

El logo debe colocarse en `assets/images/logoPECH.png`.

Para obtener el logo:
1. Descarga el logo desde: https://www.chavimochic.gob.pe/SGRHI_app/assets/images/logo/logoPECH.png
2. Guárdalo en la carpeta `assets/images/`

Si no tienes el logo, la aplicación mostrará un placeholder temporal.

### Instalación

1. Asegúrate de tener Flutter instalado
2. Clona este repositorio
3. Ejecuta:

```bash
flutter pub get
flutter run
```

## Uso

1. La aplicación inicia con un splash screen de 3 segundos
2. Luego te redirige al login
3. Ingresa cualquier usuario y contraseña (mínimo 4 caracteres)
4. Accederás a la pantalla principal

## Personalización

### Cambiar colores

Edita el `theme` en `lib/main.dart`:

```dart
colorScheme: ColorScheme.fromSeed(
  seedColor: const Color(0xFF1976D2), // Cambia este color
),
```

### Modificar tiempo del splash

En `lib/screens/splash_screen.dart`, cambia la duración:

```dart
Timer(const Duration(seconds: 3), () { // Cambia los segundos aquí
  // ...
});
```

## Requisitos

- Flutter SDK >=3.0.0
- Dart >=3.0.0

## Licencia

CHAVIMOCHIC © 2024