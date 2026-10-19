# Publicar Ojo de Gato en Google Play: lista de lo que hace falta

## 1. Imágenes de la ficha (carpeta `tienda/`)

| Qué pide Google Play | Tamaño exigido | Archivo |
|---|---|---|
| Ícono de la app | 512 × 512 px, PNG, máx. 1 MB | `tienda/icono-512.png` |
| Imagen destacada | 1024 × 500 px, PNG o JPG sin transparencia | `tienda/imagen-destacada-1024x500.png` |
| Capturas de teléfono | de 2 a 8; lados entre 320 y 3840 px; proporción 9:16 | `tienda/capturas/*.png` (1080 × 1920) |

- El ícono, el ícono de la app instalada y la pantalla de arranque se fabrican
  con `python3 herramientas/iconos.py` a partir de `assets/origen/icono-referencia.png`.
- Las capturas y la imagen destacada se sacan del juego real con
  `node herramientas/capturas-tienda.mjs` (ver instrucciones dentro del archivo).
  Google exige que las capturas muestren el juego como es de verdad: hay que
  volver a sacarlas después de cada cambio grande de pantallas.

## 2. Textos de la ficha (propuesta)

- **Nombre** (máx. 30): Ojo de Gato: Bolinchas
- **Descripción corta** (máx. 80): El juego de bolinchas del barrio: saca del círculo y gana la carrera del caño.
- **Descripción completa** (máx. 4000):

  > Vuelve al patio de la escuela. Ojo de Gato es el juego de bolinchas (canicas,
  > metras, bolitas, chibolas…) de toda la vida, con física real en 3D.
  >
  > • Círculo: saca las bolinchas de la tiza. Las que saques son tuyas.
  > • Caño: corre por el caño con esquinas, piedras y huecos, y atrasa a los rivales.
  > • De 2 a 4 jugadores en el mismo teléfono, mezclando personas y computadora.
  > • Sube de nivel, de Bolichita a Bolichón, y colecciona bolinchas nuevas.
  > • Habla como en tu país: elige el país y el juego usa sus palabras.
  > • Funciona sin internet. Sin publicidad. Sin compras. No recoge ningún dato.

- **Categoría**: Juegos › Casual (o Deportes).
- **Política de privacidad (dirección pública)**:
  `https://github.com/AmargoRM/Bilinchas-/blob/HEAD/docs/politica-de-privacidad.md`
  (funciona porque el repositorio es público; si el repositorio pasa a privado,
  hay que publicar la política en otro lado). **Antes de usarla, hay que poner
  un correo de contacto** donde dice `[CORREO DE CONTACTO]`.

## 3. Formulario "Seguridad de los datos" (Data safety)

Respuestas que corresponden al juego tal como está hoy:

- ¿La app recoge o comparte datos de usuario? **No.**
- (Al responder "No", el resto del formulario no se pide.)
- Eliminación de datos: no hay cuenta ni datos en servidores; todo se borra
  al desinstalar.

Si algún día se agrega juego en línea, publicidad o estadísticas, **estas
respuestas dejan de ser ciertas** y hay que actualizar el formulario y la
política antes de publicar esa versión. Mentir en este formulario puede
terminar con la app retirada de la tienda.

## 4. Clasificación por edades (cuestionario IARC)

- Violencia, miedo, lenguaje, drogas, sexo, apuestas: **No**.
- Interacción entre usuarios, compras, ubicación: **No**.
- Resultado esperable: apto para todo público (PEGI 3 / E).

## 5. Público objetivo — decisión pendiente

Si se marca que el juego es **también para menores de 13 años**, Google aplica
su "Política de familias": no se pueden agregar nunca anuncios o
estadísticas comunes, ni pedir datos. Hoy el juego ya cumple todo eso. La
decisión es del dueño de la app; se puede cambiar después, pero bajar la edad
más adelante obliga a cumplir esas reglas en ese momento.

## 6. Lo técnico que falta (no hecho todavía, a propósito)

- **Llave de firma** y versión de publicación: ver `docs/app-android.md`.
  Es irreversible si se pierde la llave.
- Google Play pide el formato **AAB** (no APK) para apps nuevas: se agrega al
  proceso automático cuando exista la llave.
- Cada versión subida necesita un `versionCode` mayor que la anterior
  (en `android/app/build.gradle`).

## 7. Revisión de seguridad y privacidad (hecha el 19-10-2026)

- La app de Android **no tiene ningún permiso**: se quitó el de internet que
  Capacitor trae por defecto.
- El juego armado lleva una regla de seguridad (CSP) que solo deja cargar sus
  propios archivos y bloquea cualquier conexión a internet.
- No se usan datos de quien juega en ningún texto armado como HTML
  (los nombres de jugadores son fijos), así que no hay forma de inyectar código.
- Copia de seguridad de Android activada (`allowBackup`): guarda el progreso en
  la copia de Google de la propia persona; no es acceso del creador.
- El proceso automático de GitHub tiene permiso solo de lectura del código.
- Herramientas: se quitó `@capacitor/assets` (traía librerías con fallas de
  seguridad conocidas) y se actualizó `tar`. Quedan 3 avisos "moderados" en una
  librería de iPhone (`uuid` dentro de `xcode`) que este proyecto no usa
  y que no va dentro de la app.
- El repositorio es **público**: cualquiera puede ver el código. No tiene
  contraseñas ni llaves, y **nunca** deben subirse ahí (en especial la llave
  de firma).
