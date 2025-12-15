package org;

import java.io.File;
import java.io.FileInputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketTimeoutException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

public class Server {
    // Attributes
    private static final int PORT = 10000;
    private static final String CLIENT_IP = "localhost";
    private static final int M = 1024;        // Packet size
    private static final int K = 5;           // Window size
    private static final int TIMEOUT = 100;   // Milliseconds

    public static void main(String[] args) {
        try {
            DatagramSocket socket = new DatagramSocket();
            InetAddress address = InetAddress.getByName(CLIENT_IP);

            String filepath = "/serverGUI/resources/songs/My Man on Willpower.mp3";    // default test mp3

            // Read MP3 file to memory
            if (args.length > 0 && args[0] != null && !args[0].isEmpty()) {
                filepath = args[0];
            }

            File file = new File(filepath);
            FileInputStream f = new FileInputStream(file);
            byte[] fileBytes = f.readAllBytes();
            f.close();

            // Split into packets
            List<byte[]> packets = new ArrayList<>();
            int totalPackets = (int)Math.ceil((double)fileBytes.length / M);

            for(int i=0; i<totalPackets; i++) {
                int start = i * M;
                int end = Math.min(fileBytes.length, (i+1) * M);
                int len = end - start;

                // Build packet: Header (4 bytes) + Data
                ByteBuffer buffer = ByteBuffer.allocate(4 + len);
                buffer.putInt(i);
                buffer.put(fileBytes, start, len);
                packets.add(buffer.array());
            }

            int base = 0;
            int nextSeq = 0;
            socket.setSoTimeout(TIMEOUT);
            System.out.println("Starting transmission. Total packets: " + totalPackets);

            while(base < totalPackets) {
                // 1. Send packets within the available window
                while(nextSeq < base + K && nextSeq < totalPackets) {
                    byte[] data = packets.get(nextSeq);
                    DatagramPacket packet = new DatagramPacket(data, data.length, address, PORT);
                    socket.send(packet);
                    System.err.println("Sent seq: " + nextSeq);
                    nextSeq++;
                }

                // 2. Wait for ACKs
                try {
                    byte[] ackBuffer = new byte[4];
                    DatagramPacket ackPacket = new DatagramPacket(ackBuffer, ackBuffer.length);
                    socket.receive(ackPacket);

                    int ackNum = ByteBuffer.wrap(ackPacket.getData()).getInt();
                    System.err.println("Received ACK: " + ackNum);

                    if(ackNum >= base)
                        base = ackNum + 1;
                } 
                catch (SocketTimeoutException e) {
                    System.out.println("Timeout! Resending window from " + base);
                    nextSeq = base;
                }
            }
            System.out.println("Transferencia completada. Enviando paquete de FIN.");

            // Crear paquete vacío (Solo header, sin datos)
            ByteBuffer finBuffer = ByteBuffer.allocate(4);
            finBuffer.putInt(-1); // Usamos -1 como código de "FIN"
            byte[] finBytes = finBuffer.array();

            DatagramPacket finPacket = new DatagramPacket(finBytes, finBytes.length, address, PORT);
            socket.send(finPacket);

            System.out.println("Transfer completed!");
            socket.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}