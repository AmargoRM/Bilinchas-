# Fabrica el ícono de la app y las imágenes de la tienda a partir de
# assets/origen/icono-referencia.png (la bolincha sobre fondo verde).
# Uso: python3 herramientas/iconos.py   (necesita Pillow: pip install pillow)
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'assets/origen/icono-referencia.png'
RES = RAIZ / 'android/app/src/main/res'
TIENDA = RAIZ / 'tienda'

# Dónde está la bolincha en la imagen original (medido a mano).
CX, CY, RADIO = 621, 590, 369
LADO = 1400  # lienzo grande: la bolincha ocupa ~53 % (zona segura del ícono adaptable)
FONDO_CENTRO = (4, 54, 46)
FONDO_BORDE = (2, 30, 26)


def degradado(lado, centro, borde):
    # Fondo verde oscuro, más claro al medio, como el de la imagen original.
    chico = Image.new('RGB', (256, 256))
    px = chico.load()
    for y in range(256):
        for x in range(256):
            d = min(1.0, (((x - 128) ** 2 + (y - 120) ** 2) ** 0.5) / 181)
            px[x, y] = tuple(round(c + (b - c) * d) for c, b in zip(centro, borde))
    return chico.resize((lado, lado), Image.BICUBIC)


def compuesto():
    original = Image.open(ORIGEN).convert('RGB')
    lienzo = degradado(LADO, FONDO_CENTRO, FONDO_BORDE)
    # Recorte redondo alrededor de la bolincha (con su reflejo en el piso), borde difuminado.
    r = 480
    caja = (CX - r, CY - r + 20, CX + r, CY + r + 20)
    recorte = original.crop(caja)
    mascara = Image.new('L', recorte.size, 0)
    ImageDraw.Draw(mascara).ellipse((70, 70, 2 * r - 70, 2 * r - 70), fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(45))
    x0 = LADO // 2 - r
    y0 = LADO // 2 - r - 20
    lienzo.paste(recorte, (x0, y0), mascara)
    return lienzo


def recortar_centro(im, fraccion):
    lado = round(im.width * fraccion)
    m = (im.width - lado) // 2
    return im.crop((m, m, m + lado, m + lado))


def monocromo(im):
    # Silueta para los íconos temáticos de Android 13+: el disco con la veta calada.
    lado = im.width
    alfa = Image.new('L', (lado, lado), 0)
    rr = RADIO * lado / LADO
    c = lado / 2
    ImageDraw.Draw(alfa).ellipse((c - rr, c - rr, c + rr, c + rr), fill=255)
    # La veta: los píxeles más saturados (amarillo y rojo) quedan calados.
    hsv = im.convert('HSV')
    s = hsv.getchannel('S').point(lambda v: 255 if v > 200 else 0)
    h = hsv.getchannel('H').point(lambda v: 255 if v < 45 else 0)
    veta = ImageChops.multiply(s, h).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(lado / 60))
    veta = veta.point(lambda v: 255 if v > 110 else 0)
    # Solo la veta del medio (no los reflejos del borde).
    dentro = Image.new('L', (lado, lado), 0)
    ImageDraw.Draw(dentro).ellipse((c - rr * 0.8, c - rr * 0.8, c + rr * 0.8, c + rr * 0.8), fill=255)
    veta = ImageChops.multiply(veta, dentro)
    alfa = ImageChops.subtract(alfa, veta)
    blanco = Image.new('RGBA', (lado, lado), (255, 255, 255, 0))
    blanco.putalpha(alfa)
    return blanco


def guardar(im, ruta, lado, modo='RGB'):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    im.convert(modo).resize((lado, lado), Image.LANCZOS).save(ruta, optimize=True)


def redondo(im):
    mascara = Image.new('L', im.size, 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, im.width - 1, im.height - 1), fill=255)
    salida = im.convert('RGBA')
    salida.putalpha(mascara)
    return salida


VERDE_JUEGO = (12, 36, 34)  # #0c2422, el fondo de la app


def guardar_arranque(grande, ruta, ancho, alto):
    lienzo = Image.new('RGB', (ancho, alto), VERDE_JUEGO)
    lado = round(min(ancho, alto) * 0.55)
    bolincha = grande.resize((lado, lado), Image.LANCZOS)
    mascara = Image.new('L', (lado, lado), 0)
    m = lado * 0.16
    ImageDraw.Draw(mascara).ellipse((m, m, lado - m, lado - m), fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(lado / 25))
    lienzo.paste(bolincha, ((ancho - lado) // 2, (alto - lado) // 2), mascara)
    lienzo.save(ruta, optimize=True)


def principal():
    grande = compuesto()
    apretado = recortar_centro(grande, 0.70)  # para íconos sin máscara: la bolincha más grande
    densidades = {'ldpi': 0.75, 'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    mono = monocromo(grande)
    for nombre, f in densidades.items():
        carpeta = RES / f'mipmap-{nombre}'
        # Ícono adaptable (Android 8+): 108 dp, Android recorta la forma.
        guardar(grande, carpeta / 'ic_launcher_foreground.png', round(108 * f))
        guardar(mono, carpeta / 'ic_launcher_monochrome.png', round(108 * f), 'RGBA')
        # Íconos viejos (Android 7): 48 dp, cuadrado y redondo.
        guardar(recortar_centro(grande, 0.80), carpeta / 'ic_launcher.png', round(48 * f))
        guardar(redondo(recortar_centro(grande, 0.80)), carpeta / 'ic_launcher_round.png', round(48 * f), 'RGBA')
    # Google Play: ícono de 512 × 512 (Google le redondea las puntas solo).
    guardar(apretado, TIENDA / 'icono-512.png', 512)
    # Pantallas de arranque: la bolincha sola sobre el verde del juego, en cada tamaño que ya existe.
    for ruta in RES.glob('drawable*/splash.png'):
        ancho, alto = Image.open(ruta).size
        guardar_arranque(grande, ruta, ancho, alto)
    # Imagen de partida para la pantalla de arranque y para el resto de herramientas.
    guardar(grande, RAIZ / 'assets/icono-grande.png', 1024)
    print('Íconos listos.')


if __name__ == '__main__':
    principal()
