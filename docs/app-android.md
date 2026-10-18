# La app de Android de Ojo de Gato

El juego web se empaqueta como app de Android con **Capacitor**. La carpeta
`android/` es el proyecto de la app; la app muestra adentro el mismo juego
que se arma con `npm run build` (carpeta `dist/`).

## Cómo se fabrica el APK de prueba

Cada vez que se suben cambios a GitHub, el proceso automático
`.github/workflows/android.yml` fabrica el APK:

1. En GitHub, abrir la pestaña **Actions** del repositorio.
2. Entrar a la ejecución más reciente de **App Android (APK de prueba)**.
3. Abajo, en **Artifacts**, descargar **ojo-de-gato-apk** (viene en un .zip).
4. Abrir el .zip en el teléfono: adentro está `app-debug.apk`.

En una computadora con Android Studio también se puede fabricar a mano:
`npm run android` y después abrir la carpeta `android/` en Android Studio.

## Cómo instalarlo en el teléfono

Android no deja instalar apps que no vienen de Google Play hasta que uno le
da permiso a la app con la que se abre el archivo (el navegador o "Archivos").

- Al tocar el APK, Android avisa y ofrece ir a **Ajustes**: ahí se activa
  **Permitir de esta fuente** solo para esa app.
- **Después de instalar, conviene volver a desactivarlo.** Ese permiso deja
  instalar cualquier APK que llegue por esa app, y los APK de lugares
  desconocidos pueden ser dañinos. Este es seguro porque lo fabrica GitHub a
  partir del código de este proyecto.
- Es una versión **de prueba** ("debug"): sirve para probar, no para la tienda.

## Antes de publicar en Google Play (no hecho todavía, a propósito)

Para publicar hace falta una **llave de firma** (un archivo `.jks` o
`.keystore` con su contraseña). Google Play la usa para saber que cada
actualización viene de la misma persona.

**Esto es irreversible y hay que hacerlo con cuidado:**

- Si la llave se pierde o se olvida la contraseña, **no se puede volver a
  actualizar la app** en Google Play: habría que publicar otra app nueva,
  con otro nombre de paquete, y la gente perdería la anterior.
  (Con "Play App Signing" Google guarda una copia y permite cambiar la llave
  de subida, pero el trámite es lento y depende de Google.)
- La llave **nunca** se sube a GitHub ni se comparte: con ella, otra persona
  podría publicar versiones falsas de la app.
- Hay que guardar dos copias en lugares distintos (por ejemplo, un pendrive
  y un gestor de contraseñas), con la contraseña anotada aparte.

También hace falta una cuenta de desarrollador de Google Play (pago único) y
completar la ficha de la tienda: descripción, capturas, clasificación por
edades y política de privacidad.

## Identificación de la app

- Nombre: **Ojo de Gato**
- Paquete: `com.ojodegato.bolinchas` (en `capacitor.config.json`).
  **Una vez publicada, el paquete no se puede cambiar.** Si se quiere otro,
  hay que decidirlo antes de la primera publicación.
- Ícono y pantalla de arranque: se dibujan con `herramientas/icono.html`,
  quedan en `assets/` y se convierten con
  `npx @capacitor/assets generate --android`.
