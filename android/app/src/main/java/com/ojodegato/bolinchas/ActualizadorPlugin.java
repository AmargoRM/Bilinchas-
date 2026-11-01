package com.ojodegato.bolinchas;

// Actualizador de las versiones de PRUEBA (no se usa en la versión de Google Play).
// - descargar: baja el APK nuevo en segundo plano, sin salir del juego, a la carpeta
//   privada de la app (nadie más la ve). Avisa el avance con el evento "progreso".
// - instalar: abre el instalador de Android con ese archivo. Android muestra su propia
//   pantalla y SOLO acepta el APK si está firmado con la misma llave que el instalado.
// - limpiar: borra APKs viejos que hayan quedado bajados.

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "Actualizador")
public class ActualizadorPlugin extends Plugin {

    private volatile boolean bajando = false;

    private File carpeta() {
        File c = new File(getContext().getCacheDir(), "actualizacion");
        if (!c.exists()) c.mkdirs();
        return c;
    }

    private File archivoDe(int numero) {
        return new File(carpeta(), "ojo-de-gato-" + numero + ".apk");
    }

    // Borra todos los APK bajados menos el de "conservar" (0 = todos).
    private void borrarViejos(int conservar) {
        File[] archivos = carpeta().listFiles();
        if (archivos == null) return;
        String queda = conservar > 0 ? archivoDe(conservar).getName() : "";
        for (File f : archivos) {
            if (!f.getName().equals(queda)) f.delete();
        }
    }

    @PluginMethod
    public void limpiar(PluginCall call) {
        borrarViejos(0);
        call.resolve();
    }

    @PluginMethod
    public void descargar(PluginCall call) {
        final String direccion = call.getString("url");
        final int numero = call.getInt("numero", 0);
        if (direccion == null || !direccion.startsWith("https://") || numero <= 0) {
            call.reject("Datos de descarga inválidos");
            return;
        }
        final File destino = archivoDe(numero);
        if (destino.exists() && destino.length() > 0) {
            JSObject r = new JSObject();
            r.put("listo", true);
            call.resolve(r);
            return;
        }
        if (bajando) {
            call.reject("Ya se está bajando");
            return;
        }
        bajando = true;
        new Thread(() -> {
            File parcial = new File(carpeta(), "bajando.tmp");
            HttpURLConnection conexion = null;
            try {
                borrarViejos(0);
                // GitHub manda a otra dirección (también https): se siguen hasta 5 saltos.
                URL url = new URL(direccion);
                for (int saltos = 0; ; saltos++) {
                    conexion = (HttpURLConnection) url.openConnection();
                    conexion.setInstanceFollowRedirects(false);
                    conexion.setConnectTimeout(20000);
                    conexion.setReadTimeout(30000);
                    int codigo = conexion.getResponseCode();
                    if (codigo >= 300 && codigo < 400 && saltos < 5) {
                        String siguiente = conexion.getHeaderField("Location");
                        conexion.disconnect();
                        url = new URL(url, siguiente);
                        if (!"https".equals(url.getProtocol())) throw new Exception("Dirección no segura");
                        continue;
                    }
                    if (codigo != 200) throw new Exception("Respuesta " + codigo);
                    break;
                }
                long total = conexion.getContentLengthLong();
                long llevo = 0;
                int ultimo = -1;
                try (InputStream entrada = conexion.getInputStream(); OutputStream salida = new FileOutputStream(parcial)) {
                    byte[] trozo = new byte[64 * 1024];
                    int n;
                    while ((n = entrada.read(trozo)) != -1) {
                        salida.write(trozo, 0, n);
                        llevo += n;
                        if (total > 0) {
                            int porcentaje = (int) (llevo * 100 / total);
                            if (porcentaje != ultimo) {
                                ultimo = porcentaje;
                                JSObject p = new JSObject();
                                p.put("porcentaje", porcentaje);
                                notifyListeners("progreso", p);
                            }
                        }
                    }
                }
                if (total > 0 && llevo != total) throw new Exception("Descarga incompleta");
                if (!parcial.renameTo(destino)) throw new Exception("No se pudo guardar");
                JSObject r = new JSObject();
                r.put("listo", true);
                call.resolve(r);
            } catch (Exception e) {
                parcial.delete();
                call.reject("No se pudo bajar: " + e.getMessage());
            } finally {
                if (conexion != null) conexion.disconnect();
                bajando = false;
            }
        }).start();
    }

    @PluginMethod
    public void instalar(PluginCall call) {
        int numero = call.getInt("numero", 0);
        File archivo = archivoDe(numero);
        if (!archivo.exists()) {
            call.reject("No está bajada");
            return;
        }
        // Desde Android 8, la persona tiene que dar permiso una vez a esta app para instalar.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent permiso = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            permiso.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(permiso);
            JSObject r = new JSObject();
            r.put("faltaPermiso", true);
            call.resolve(r);
            return;
        }
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", archivo);
        Intent instalar = new Intent(Intent.ACTION_VIEW);
        instalar.setDataAndType(uri, "application/vnd.android.package-archive");
        instalar.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(instalar);
        JSObject r = new JSObject();
        r.put("faltaPermiso", false);
        call.resolve(r);
    }
}
