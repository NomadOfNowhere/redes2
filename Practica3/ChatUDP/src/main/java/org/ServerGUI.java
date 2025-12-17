package org;

import java.net.*;
import java.io.*;
import java.nio.channels.DatagramChannel;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// mvn exec:java -Dexec.mainClass="org.Server"
public class ServerGUI {
    private static final int PORT = 10000;
    private static final int BUFFER_SIZE = 65535;
    private static Map<String, Map<String, Client>> rooms = new ConcurrentHashMap<>();
    private static Map<String, String> clients = new ConcurrentHashMap<>();
    private DatagramSocket socket;

    public ServerGUI() {
        try{
            socket = new DatagramSocket(PORT);
            System.out.println("UDP Server started on port: " + PORT);
            listen();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void listen() {
        while(true){
            try {
                byte[] buffer = new byte[BUFFER_SIZE];
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet);          // Blocking wait until a UDP packet is received

                new Thread(new PacketHandler(socket, packet)).start();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    static class Client {
        InetAddress ip;
        int port;
        public Client(InetAddress ip, int port) { this.ip = ip; this.port = port; }
    }

    // Process individual packets
    class PacketHandler implements Runnable{
        DatagramSocket socket;
        DatagramPacket packet;

        public PacketHandler(DatagramSocket s, DatagramPacket p) {
            this.socket = s;
            this.packet = p;
        }

        @Override
        public void run() {
            try {
                // Get packet data
                ByteArrayInputStream b = new ByteArrayInputStream(packet.getData(), 0, packet.getLength());
                ObjectInputStream obj = new ObjectInputStream(b);
                Message msg = (Message)obj.readObject();

                // Identify sender
                InetAddress senderIP = packet.getAddress();
                int senderPort = packet.getPort();
                System.out.println(senderPort);

                switch(msg.type){
                    case JOIN:
                        handleJoin(msg, senderIP, senderPort);
                        break;
                    case TEXT: case FILE:
                        handleBroadcast(msg);
                        break;
                    case DM:
                        handleDM(msg);
                        break;
                    case LEAVE:
                        handleLeave(msg);
                        break;
                    case USERS:
                        handleListUsers(msg);
                        break;
                    case ROOMS:
                        handleListRooms(msg, senderIP, senderPort);
                        break;
                    case MYROOMS:
                        handleListMyRooms(msg, senderIP, senderPort);
                        break;
                    default:
                        System.out.println("Unknown message. Try again!");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void handleJoin(Message msg, InetAddress ip, int port) {
        // Create room if doesn't exist and add user
        rooms.computeIfAbsent(msg.room, aux -> new ConcurrentHashMap<>())
             .put(msg.sender, new Client(ip, port));
        System.out.println(msg.sender + " joined room: " + msg.room);

        Message alert = new Message(Message.Type.TEXT, "Server", msg.room, msg.sender + " has joined the chat.");
        handleBroadcast(alert);
    }

    // Send message to all users in the room except sender
    private void handleBroadcast(Message msg) {
        Map<String, Client> users = rooms.get(msg.room);
        if(users == null) return;

        users.forEach((username, data) -> {
            if(!username.equals(msg.sender)) {
                sendPacket(msg, data.ip, data.port);
            }
        });
    }

    // Send list of users in the room
    private void handleListUsers(Message msg) {
        Map<String, Client> users = rooms.get(msg.room);
        if(users == null) return;

        StringJoiner joiner = new StringJoiner(",", "CMD:USERS:[", "]");
        int idx = 0;
        for(String user : users.keySet()) {
            // Build JSON object: {"user":"nombre"}
            joiner.add(String.format("{\"id\":%d,\"name\":\"%s\",\"status\":\"online\"}", idx++, user));
        }

        Message res = new Message(Message.Type.USERS, "Server", msg.room, joiner.toString());
        Client to = users.get(msg.sender);
        sendPacket(res, to.ip, to.port);
    }

    // Send list of rooms
    private void handleListRooms(Message msg, InetAddress senderIP, int senderPort) {
        StringJoiner joiner = new StringJoiner(",", "CMD:ROOMS:[", "]");

        rooms.forEach((room, users) -> {
            // Build JSON object: {"id":x, "name":"nombre", "users":y}
            joiner.add(String.format("{\"name\":\"%s\",\"users\":%d}", room, users.size()));
        });
        System.out.println(joiner);
        Message res = new Message(Message.Type.JOIN, "Server", null, joiner.toString());
        sendPacket(res, senderIP, senderPort);
    }

    // Send list of rooms
    private void handleListMyRooms(Message msg, InetAddress senderIP, int senderPort) {
        StringJoiner joiner = new StringJoiner(",", "CMD:MYROOMS:[", "]");
        rooms.forEach((room, users) -> {
            if(users.containsKey(msg.sender)) {
                joiner.add(String.format("{\"name\":\"%s\",\"users\":%d}", room, users.size()));
            }
        });
        System.out.println(joiner);
        Message res = new Message(Message.Type.JOIN, "Server", null, joiner.toString());
        sendPacket(res, senderIP, senderPort);
    }

    // Send direct message to specific user
    private void handleDM(Message msg){
        Map<String, Client> users = rooms.get(msg.room);
        if(users != null && users.containsKey(msg.receiver)) {
            Client to = users.get(msg.receiver);
            sendPacket(msg, to.ip, to.port);
        }
    }

    // Handle user leaving the room
    private void handleLeave(Message msg) {
        if(rooms.containsKey(msg.room)) {
            rooms.get(msg.room).remove(msg.sender);
            if(rooms.get(msg.room).isEmpty()) {
                rooms.remove(msg.room); // Remove room if empty
                System.out.println("Room " + msg.room + " removed.");
            }
            else {
                System.out.println(msg.sender + " left room: " + msg.room);
                Message alert = new Message(Message.Type.TEXT, "Server", msg.room, msg.sender + " has left the chat.");
                handleBroadcast(alert);
            }
        }
    }

    // Send a Message object as UDP packet
    private void sendPacket(Message msg, InetAddress ip, int port) {
        try {
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            ObjectOutputStream obj = new ObjectOutputStream(b);
            obj.writeObject(msg);
            byte[] data = b.toByteArray();

            DatagramPacket newPacket = new DatagramPacket(data, data.length, ip, port);
            socket.send(newPacket);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        ServerGUI server = new ServerGUI();
    }
}