package org;

import java.io.*;
import java.net.*;
import java.nio.ByteBuffer;
import javazoom.jl.player.Player; // Asegúrate de importar esto

public class Client {
    private static final int PORT = 10000;
    private static final int PACKET_SIZE = 2048;

    public static void main(String[] args) {
        try {
            DatagramSocket socket = new DatagramSocket(PORT);
            socket.setSoTimeout(5000); // Timeout para saber cuándo termina

            byte[] receiveData = new byte[PACKET_SIZE];
            System.out.println("Client waiting for packets...");

            // 1. Buffer en memoria RAM
            ByteArrayOutputStream memoryBuffer = new ByteArrayOutputStream();
            
            int expectedSeq = 0;
            boolean transferStarted = false;

            // --- FASE DE RECEPCIÓN ---
            while(true) {
                try {
                    DatagramPacket packet = new DatagramPacket(receiveData, receiveData.length);
                    socket.receive(packet);
                    transferStarted = true;

                    byte[] data = packet.getData();
                    int seq = ByteBuffer.wrap(data, 0, 4).getInt();
                    int dataLength = packet.getLength() - 4;
                    InetAddress serverAddress = packet.getAddress();
                    int serverPort = packet.getPort();

                    // Detectar fin (paquete vacío o código -1)
                    if (seq == -1 || dataLength == 0) {
                        System.out.println("Fin de transmisión recibido.");
                        break;
                    }

                    if(seq == expectedSeq) {
                        // Guardar en RAM
                        if (dataLength > 0) {
                            memoryBuffer.write(data, 4, dataLength);
                        }
                        // Opcional: imprimir cada X paquetes para no saturar la consola
                        if (seq % 100 == 0) System.out.println("Received correct: " + seq);
                        
                        sendAck(socket, seq, serverAddress, serverPort);
                        expectedSeq++;
                    }
                    else {
                        sendAck(socket, expectedSeq - 1, serverAddress, serverPort);
                    }

                } catch (SocketTimeoutException e) {
                    if (transferStarted) {
                        System.out.println("Timeout: Transmisión finalizada.");
                        break;
                    }
                }
            }

            // Cerrar recursos de red
            socket.close();
            
            // --- FASE DE REPRODUCCIÓN ---
            System.out.println("Preparando reproducción...");
            
            // 2. Convertir el buffer a un array de bytes estático
            byte[] audioData = memoryBuffer.toByteArray();
            System.out.println("Tamaño total del archivo en RAM: " + audioData.length + " bytes");

            // 3. Crear un InputStream desde los bytes para que JLayer pueda leerlo
            ByteArrayInputStream bis = new ByteArrayInputStream(audioData);

            // 4. Iniciar el reproductor
            Player player = new Player(bis);
            System.out.println("Reproduciendo música...");
            player.play(); // Esto detendrá el programa hasta que termine la canción
            
            System.out.println("Reproducción terminada.");
            memoryBuffer.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void sendAck(DatagramSocket socket, int seq, InetAddress address, int port) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(4);
        buffer.putInt(seq);
        byte[] ackBytes = buffer.array();
        DatagramPacket ackPacket = new DatagramPacket(ackBytes, ackBytes.length, address, port);
        socket.send(ackPacket);
    }
}