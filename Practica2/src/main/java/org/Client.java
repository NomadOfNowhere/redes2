package org;

import java.io.*;
import java.net.*;
import java.nio.ByteBuffer;
import javazoom.jl.player.Player; // Librería JLayer
import java.net.DatagramSocket;

public class Client {
    private static final int PORT = 10000;
    private static final int PACKET_SIZE = 2048;

    public static void main(String[] args) {
        try {
            DatagramSocket socket = new DatagramSocket(PORT);
            byte[] receiveData = new byte[PACKET_SIZE];
            System.out.println("Client waiting for packets...");

            // Output file
            ByteArrayOutputStream memoryBuffer = new ByteArrayOutputStream();
            int expectedSeq = 0;

            while(true) {
                DatagramPacket packet = new DatagramPacket(receiveData, receiveData.length);
                socket.receive(packet);

                byte[] data = packet.getData();
                int seq = ByteBuffer.wrap(data, 0, 4).getInt();
                int dataLength = packet.getLength() - 4;

                InetAddress serverAddress = packet.getAddress();
                int serverPort = packet.getPort();

                // 1. VERIFICAR SI ES EL PAQUETE DE FIN
                if (seq == -1 || dataLength == 0) {
                    System.out.println("Recibida señal de fin de archivo.");
                    break; // Rompe el bucle
                }

                if(seq == expectedSeq) {
                    if (dataLength > 0) {
                        memoryBuffer.write(data, 4, dataLength);
                    }
                    System.out.println("Received correct: " + seq);

                    sendAck(socket, seq, serverAddress, serverPort);
                    expectedSeq++;
                }
                else {
                    System.out.println();
                    sendAck(socket, expectedSeq - 1, serverAddress, serverPort);
                }
            }
            byte[] audioCompleto = memoryBuffer.toByteArray();
            System.out.println("Descarga finalizada. Tamaño en memoria: " + audioCompleto.length + " bytes");

            socket.close();
            memoryBuffer.close();
        }
        catch (Exception e) {
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