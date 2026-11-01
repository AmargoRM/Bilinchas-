package com.ojodegato.bolinchas;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Complemento propio: baja e instala las versiones de prueba sin salir del juego.
        registerPlugin(ActualizadorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
