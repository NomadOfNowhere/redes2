package org;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.concurrent.ConcurrentHashMap;

// mvn exec:java -Dexec.mainClass="org.Server"
public class ServerGUI {
    private static final int PORT = 10000;
    private static final int BUFFER_SIZE = 65535;
    private static final Map<String, Map<String, Client>> rooms = new ConcurrentHashMap<>();
    private static final Map<String, String> privateRooms = new ConcurrentHashMap<>();
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
                    case START:
                        handleStart(msg, senderIP, senderPort);
                        break;
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
                        handleLeave(msg, senderIP, senderPort);
                        break;
                    case USERS:
                        handleListUsers(msg, senderIP, senderPort, false);
                        break;
                    case ROOMS:
                        handleListRooms(senderIP, senderPort, false);
                        break;
                    case MYROOMS:
                        handleListMyRooms(msg.sender, senderIP, senderPort);
                        break;
                    case EXIT:
                        handleLeaveAll(msg, senderIP, senderPort);
                        break;
                    default:
                        System.out.println("Unknown message. Try again!");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void handleStart(Message msg, InetAddress senderIP, int senderPort) {
        Message res = new Message(Message.Type.START, "Server", null, null);
        sendPacket(res, senderIP, senderPort);
        handleJoin(msg, senderIP, senderPort);
    }

    private void handleJoin(Message msg, InetAddress senderIP, int senderPort) {
        // Create room if doesn't exist and add user
        rooms.computeIfAbsent(msg.room, aux -> new ConcurrentHashMap<>())
             .put(msg.sender, new Client(senderIP, senderPort));
        Message alert = new Message(Message.Type.TEXT, "Server", msg.room, msg.sender + " has joined the chat.");
        handleBroadcast(alert);
        handleListUsers(msg, null, 0, true);
        handleListRooms(null, 0, true);   // broadcast new list
        broadcastMyRoomList(msg.room);
    }

    // Send message to all users in the room except sender
    private void handleBroadcast(Message msg) {
        Map<String, Client> users = rooms.get(msg.room);
        if(users == null) return;

        // Escapar caracteres para no romper el JSON
        String safeContent = msg.content
            .replace("\\", "\\\\")
            .replace("\"", "\\\"");

        // JSON: {"sender":"Juan", "content":"Hola", "room":"General"}
        String jsonString = String.format(
            "{\"sender\":\"%s\",\"content\":\"%s\",\"room\":\"%s\"}",
            msg.sender,
            safeContent,
            msg.room
        );
        
        jsonString = "CMD:MSG:" + jsonString;
        Message jsonMsg = new Message(Message.Type.TEXT, msg.sender, msg.room, jsonString);

        users.forEach((username, data) -> {
            if(!username.equals(msg.sender)) {
                sendPacket(jsonMsg, data.ip, data.port);
            }
        });
    }

    // Send list of users in the room
    private void handleListUsers(Message msg, InetAddress senderIP, int senderPort, boolean broadcastList) {
        Map<String, Client> users = rooms.get(msg.room);
        if(users == null) return;

        StringJoiner joiner = new StringJoiner(",", "CMD:USERS:[", "]");
        int idx = 0;
        for(String user : users.keySet()) {
            // Build JSON object: {"user":"nombre"}
            joiner.add(String.format("{\"id\":%d,\"name\":\"%s\",\"status\":\"online\"}", idx++, user));
        }

        Message res = new Message(Message.Type.USERS, "Server", null, joiner.toString());
        if(broadcastList) {
            users.forEach((u, client) -> {
                sendPacket(res, client.ip, client.port);
            });
        }
        else {
            sendPacket(res, senderIP, senderPort);
        }
    }

    // Send list of rooms
    private void handleListRooms(InetAddress senderIP, int senderPort, boolean broadcastList) {
        StringJoiner joiner = new StringJoiner(",", "CMD:ROOMS:[", "]");

        rooms.forEach((room, users) -> {
            // Build JSON object: {"id":x, "name":"nombre", "users":y}
            joiner.add(String.format("{\"name\":\"%s\",\"users\":%d}", room, users.size()));
        });
        System.out.println(joiner);
        Message res = new Message(Message.Type.JOIN, "Server", null, joiner.toString());
        if(broadcastList) {
            rooms.forEach((roomName, userMap) -> {
                userMap.forEach((username, client) -> {
                    sendPacket(res, client.ip, client.port);
                });
            });
        }
        else {
            sendPacket(res, senderIP, senderPort);
        }
    }

    // Send list of rooms
    private void handleListMyRooms(String username, InetAddress senderIP, int senderPort) {
        StringJoiner joiner = new StringJoiner(",", "CMD:MYROOMS:[", "]");
        rooms.forEach((room, users) -> {
            if(users.containsKey(username)) {
                joiner.add(String.format("{\"name\":\"%s\",\"users\":%d}", room, users.size()));
            }
        });
        Message res = new Message(Message.Type.JOIN, "Server", null, joiner.toString());
        sendPacket(res, senderIP, senderPort);
    }

    private void broadcastMyRoomList(String room) {
        Map<String, Client> userlist = rooms.get(room);
        if(userlist == null) return;

        userlist.forEach((user, to) -> {
            handleListMyRooms(user, to.ip, to.port);
        });
    }

    // // Send direct message to specific user
    // private void handleDM(Message msg){
    //     Map<String, Client> users = rooms.get(msg.room);
    //     if(users != null && users.containsKey(msg.receiver)) {
    //         Client to = users.get(msg.receiver);
    //         sendPacket(msg, to.ip, to.port);
    //     }
    // }

    private void handleDM(Message msg){
        Map<String, Client> users = rooms.get(msg.room);
        
        // Verificamos si el usuario destino está en la misma sala
        if(users != null && users.containsKey(msg.receiver)) {
            Client to = users.get(msg.receiver);
            Client from = users.get(msg.sender); // Necesitamos al remitente también para enviarle copia

            // 1. Escapar contenido para JSON
            String safeContent = msg.content
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");

            // 2. Construir JSON con una propiedad extra "isPrivate": true
            String jsonString = String.format(
                "{\"sender\":\"%s\",\"receiver\":\"%s\",\"content\":\"%s\",\"room\":\"%s\",\"isPrivate\":true}",
                msg.sender,
                msg.receiver,
                safeContent,
                msg.room
            );
            
            // 3. Empaquetar con la etiqueta CMD:MSG:
            String finalPayload = "CMD:MSG:" + jsonString;
            Message jsonMsg = new Message(Message.Type.DM, msg.sender, msg.room, finalPayload);

            sendPacket(jsonMsg, to.ip, to.port);
            if (from != null) {
                sendPacket(jsonMsg, from.ip, from.port);
            }
        }
    }

    // Handle user leaving the room
    private void handleLeave(Message msg, InetAddress senderIP, int senderPort) {
        if(rooms.containsKey(msg.room)) {
            rooms.get(msg.room).remove(msg.sender);

            if(rooms.get(msg.room).isEmpty()) {
                rooms.remove(msg.room); // Remove room if empty
            }
            else {
                Message alert = new Message(Message.Type.TEXT, "Server", msg.room, msg.sender + " has left the chat.");
                handleBroadcast(alert);
                handleListUsers(msg, null, 0, true);   // broadcast new userlist
                broadcastMyRoomList(msg.room);
            }
            handleListRooms(null, 0, true);   // broadcast new roomlist
            handleListMyRooms(msg.sender, senderIP, senderPort);
        }
    }

    private void handleLeaveAll(Message msg, InetAddress senderIP, int senderPort) {
        List<String> userRooms = new ArrayList<>();

        rooms.forEach((room, users) -> {
            if (users.containsKey(msg.sender)) {
                userRooms.add(room);
            }
        });

        for (String room : userRooms) {
            Message leaveMsg = new Message(Message.Type.LEAVE, msg.sender, room, null);
            handleLeave(leaveMsg, senderIP, senderPort);
        }
        // rooms.forEach((room, users) -> {
        //     if(users.containsKey(msg.sender)) {
        //         Message newMsg = new Message(Message.Type.LEAVE, msg.sender, room, null);
        //         handleLeave(newMsg, senderIP, senderPort);
        //     }
        // });
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