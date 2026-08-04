# CatrachoGo Mobile

App móvil nativa (React Native + Expo) de **CatrachoGo**, la plataforma de ride-hailing para Honduras. Implementa la misma funcionalidad de [`catrachogo-web`](../catrachogo-web) contra el mismo backend (`catrachogo-api`), adaptada a una experiencia nativa gestos, permisos de cámara/ubicación, navegación por drawer — para los **3 roles**: pasajero, conductor y administrador.

## Stack

- **React Native + Expo** (managed workflow) + TypeScript, con [Expo Router](https://docs.expo.dev/router/introduction/) para navegación basada en archivos.
- `react-native-maps`, `expo-location`, `expo-image-picker`, `expo-secure-store`, `expo-notifications`, `@react-navigation/drawer`, `@gorhom/bottom-sheet`.
- Backend: el mismo `catrachogo-api` (NestJS) que ya consume `catrachogo-web` — sin endpoints exclusivos de mobile salvo que se documente lo contrario.

## Requisitos previos

- Node.js 20 o superior (LTS recomendado) y npm.
- La app [Expo Go](https://expo.dev/go) en tu teléfono, **o** un dev client / emulador configurado (Android Studio / Xcode).
- `catrachogo-api` corriendo en local (ver ese repo para instrucciones) esta app no funciona sin el backend.

## Instalación

```bash
git clone <url-del-repo>
cd catrachogo-mobile
npm install
cp .env.example .env
```

Completa `.env` con tus valores — cada variable está documentada con un comentario en [`.env.example`](./.env.example) (API keys de Google Maps/Places, Cloudinary, PayPal, Google Sign-In, etc.). La única obligatoria para levantar la app en modo básico es `EXPO_PUBLIC_API_URL`:

- **Web / iOS Simulator:** `http://localhost:3000` funciona tal cual.
- **Emulador Android:** usar `http://10.0.2.2:3000` (`localhost` del emulador no apunta a la máquina host).
- **Dispositivo físico (Expo Go / dev client):** usar la IP de red local de la máquina, ej. `http://192.168.1.50:3000` — cambia si tu router reasigna IPs por DHCP.

Expo solo lee variables de entorno al iniciar el servidor de desarrollo, no con Fast Refresh — **reinicia `npm start` después de cualquier cambio en `.env`.**

## Ejecutar

```bash
npm start        # abre el menú de Expo (escanea el QR con Expo Go, o presiona a/i/w)
npm run android  # abre directo en un emulador/dispositivo Android
npm run ios      # abre directo en un simulador iOS (requiere macOS)
npm run web      # abre en el navegador
```

## Estructura del proyecto

```
app/          Rutas de Expo Router, agrupadas por rol: (auth)/, (passenger)/, (driver)/, (admin)/
components/   Componentes compartidos entre pantallas — components/ui/ es el kit visual base (Button, Card, TextField, ModalCard, ScreenHeader, SegmentedTabs)
constants/    Colores, tipografía y mapeos de etiquetas/íconos por tipo o estado
lib/          Cliente de API, autenticación, tema claro/oscuro, notificaciones push, hooks de navegación y red
assets/       Fuentes, íconos y logo de la app
```

## Calidad

```bash
npx tsc --noEmit     # type-check
npm run lint         # eslint
npm run format       # prettier (usa format:check en CI/pre-commit)
```

## Build de prueba (EAS)

El proyecto **no se publica en tiendas oficiales** (Play Store / App Store) — solo se generan builds internos de prueba, vía [EAS Build](https://docs.expo.dev/build/introduction/) (perfiles ya configurados en [`eas.json`](./eas.json)):

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile preview --platform ios
```
