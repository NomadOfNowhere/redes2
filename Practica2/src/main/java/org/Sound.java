package org;

import java.io.File;
import java.io.FileInputStream;

import javazoom.jl.player.Player;

public class Sound {
    public static void main(String[] args) {
        // Cambia esto por el nombre real de tu archivo
        String mp3Path = "sabrina.mp3"; 

        try {
            File file = new File(mp3Path);
            if (!file.exists()) {
                System.err.println("❌ Error: No encuentro el archivo: " + file.getAbsolutePath());
                return;
            }

            System.out.println("📂 Archivo encontrado. Tamaño: " + file.length() + " bytes");
            System.out.println("🎵 Intentando reproducir con JLayer...");

            FileInputStream fis = new FileInputStream(file);
            Player player = new Player(fis);
            
            System.out.println("▶️ Reproduciendo... (Si no escuchas nada, revisa la configuración de Java)");
            player.play();
            
            System.out.println("✅ Fin de reproducción.");

        } catch (Exception e) {
            System.err.println("❌ ERROR AL REPRODUCIR:");
            e.printStackTrace();
            System.out.println("\n--- DIAGNÓSTICO RÁPIDO ---");
            System.out.println("1. Si dice 'No line matching interface': Estás usando Java Headless o faltan drivers ALSA.");
            System.out.println("2. Si dice 'ArrayIndexOutOfBounds': El MP3 está corrupto.");
        }
    }
}
