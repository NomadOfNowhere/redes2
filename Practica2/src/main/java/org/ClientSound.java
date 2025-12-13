package org;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketTimeoutException;
import java.nio.ByteBuffer;
import java.io.File; // Importar File
import java.io.FileInputStream; // Importar FileInputStream
import java.io.FileOutputStream;
import javazoom.jl.player.Player;
// mvn exec:java -Dexec.mainClass="org.ClientSound"

public class ClientSound {
    private static final int PORT = 10000;
    private static final int PACKET_SIZE = 2048;

    public static void main(String[] args) {
        try {
            DatagramSocket socket = new DatagramSocket(PORT);
            socket.setSoTimeout(5000); // Timeout para saber cuándo termina

            byte[] receiveData = new byte[PACKET_SIZE];
            System.out.println("Client waiting for packets...");

            File tempFile = File.createTempFile("temp", ".mp3");
            // tempFile.deleteOnExit();
            FileOutputStream fileOutputStream = new FileOutputStream(tempFile);
            
            int expectedSeq = 0;
            boolean transferStarted = false;

            // --- FASE DE RECEPCIÓN ---
            while(true) {
                try {
                    DatagramPacket packet = new DatagramPacket(receiveData, receiveData.length);
                    socket.receive(packet);
                    transferStarted = true;

                    byte[] data = packet.getData();
                    if (packet.getLength() < 4) continue;

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
                        if (dataLength > 0) {
                            fileOutputStream.write(data, 4, dataLength);
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
            fileOutputStream.close();

            System.out.println("STATUS:FILE_READY:" + tempFile.getAbsolutePath());
            
            // --- FASE DE REPRODUCCIÓN ---
            System.out.println("Preparando reproducción desde archivo...");
            System.out.println("Tamaño total del archivo en disco: " + tempFile.length() + " bytes");
            
            FileInputStream fis = new FileInputStream(tempFile);

            // 4. Iniciar el reproductor
            Player player = new Player(fis);
            System.out.println("Reproduciendo música...");
            player.play(); // Esto detendrá el programa hasta que termine la canción
            
            System.out.println("Reproducción terminada.");
            fis.close();

            System.out.println("Programa terminado exitosamente.");
            System.exit(0);
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