package org;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Scanner;
// mvn exec:java -Dexec.mainClass="org.Client"
public class ClientGUI{
    private static final String SERVER_IP = "127.0.0.1";
    private static final int SERVER_PORT = 10000;
    private static final int BUFFER_SIZE = 65535;

    private DatagramSocket socket;
    private InetAddress serverAddress;
    private String username;
    private String currentRoom = "General";
    private volatile boolean connected = false;

    public ClientGUI(String username){
        this.username = username;
        try {
            // Init socket on random port (available)
            this.socket = new DatagramSocket();
            this.serverAddress = InetAddress.getByName(SERVER_IP);

            System.out.println("MENSAJE DESDE JAVA");
            // Thread to receive messages in background
            Thread listener = new Thread(new MessageReceiver(socket));
            listener.start();

            // Input loop
            handleInput();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleInput(){
        Scanner scanner = new Scanner(System.in);

        int cnt = 0;
        // Bucle de reintento: Envía y espera, si no responde, envía de nuevo.
        while (!connected && cnt < 20) {
            sendMessage(new Message(Message.Type.START, username, currentRoom, null));      
            try {
                Thread.sleep(1000); 
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            if (!connected) {
                // Construimos un JSON simple: { "type": "retry", "msg": "..." }
                String msg = String.format("Sin respuesta. Reintentando (%d/%d)...", ++cnt, 20);
                System.out.println("CMD:STATUS:{\"type\":\"info\", \"message\":\"" + msg + "\"}");
            }
        }
        if (!connected) {
            String errorMsg = "ERROR: ¡No se pudo conectar al servidor!";
            System.out.println("CMD:STATUS:{\"type\":\"error\", \"message\":\"" + errorMsg + "\"}");
            System.exit(1);
        }

        while(true){
            String input = scanner.nextLine();
            if(input.startsWith("/")) {
                handleCommand(input);
            }
            else {
                Message msg = new Message(Message.Type.TEXT, username, currentRoom, input);
                sendMessage(msg);
            }
        }
    }

    private void handleCommand(String input){
        String[] parts = input.split(" ", 3);
        String cmd = parts[0];

        switch(cmd) {
            case "/join":
                if(parts.length > 1){
                    currentRoom = parts[1];
                    // Notify server
                    Message msg = new Message(Message.Type.JOIN, username, currentRoom, null);
                    sendMessage(msg);
                }
                break;
           
           case "/switch":
                if(parts.length > 1){
                    currentRoom = parts[1];
                }
                break;

            case "/text":
                if(parts.length > 1){
                    String text = input.substring(input.indexOf(" ") + 1);
                    Message msg = new Message(Message.Type.TEXT, username, currentRoom, text);
                    sendMessage(msg);
                    
                    // Eco local para react
                    String json = String.format(
                        "{\"sender\":\"%s\",\"content\":\"%s\",\"room\":\"%s\"}", 
                        username, text, currentRoom
                    );
                    System.out.println("CMD:MSG:" + json);
                }
                break;

            case "/dm":
                if(parts.length > 2) {
                    String to = parts[1];
                    String text = parts[2];
                    Message msg = new Message(Message.Type.DM, username, currentRoom, text);
                    msg.receiver = to;
                    sendMessage(msg);
                }
                break;

            case "/file":
                if(parts.length > 1){
                    // sendFile(parts[1]);
                }
                break;

            case "/dmfile":
                break;

            case "/leave": {
                    Message msg = new Message(Message.Type.LEAVE, username, parts.length > 1 ? parts[1] : currentRoom, null);
                    sendMessage(msg);
                    System.out.println("Leaving room..." + (parts.length > 1 ? parts[1] : currentRoom));
                    currentRoom = "General";
                }
                break;
            
            case "/who": {
                    Message msg = new Message(Message.Type.USERS, username, parts.length > 1 ? parts[1] : currentRoom, null);
                    sendMessage(msg);
                }
                break;
            
            case "/rooms": {
                    Message msg = new Message(Message.Type.ROOMS, username, null, null);
                    sendMessage(msg);
                }
                break;
            
            case "/myrooms": {
                    Message msg = new Message(Message.Type.MYROOMS, username, null, null);
                    sendMessage(msg);
                }
                break;

            default:
                System.out.println("Unknown command. Try again!");
        }
    }

    class MessageReceiver implements Runnable {
        private DatagramSocket socket;

        public MessageReceiver(DatagramSocket socket){
            this.socket = socket;
        }

        @Override
        public void run(){
            byte[] buffer = new byte[BUFFER_SIZE];

            while (true) { 
                try {
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    socket.receive(packet);    // Blocking wait until a UDP packet is received

                    // Get packet data
                    ByteArrayInputStream b = new ByteArrayInputStream(packet.getData());
                    ObjectInputStream obj = new ObjectInputStream(b);
                    Message msg = (Message)obj.readObject();

                    showMessage(msg);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private void showMessage(Message msg){
        switch(msg.type) {
            case START:
                connected = true;
                System.out.println("CMD:CONNECTED:{}");
                break;
            case TEXT: case LEAVE: case USERS: case JOIN: case DM:
                System.out.println(msg.content);
                break;
            case FILE:
                System.out.println("[" + msg.room + "] " + msg.sender + " sent a file/sticker.");
                // saveFile(msg);
                break;
            default:
                throw new AssertionError();
        }
    }

    // Send a Message object as UDP packet
    private void sendMessage(Message msg){
        try {
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            ObjectOutputStream obj = new ObjectOutputStream(b);
            obj.writeObject(msg);
            byte[] data = b.toByteArray();

            DatagramPacket packet = new DatagramPacket(data, data.length, serverAddress, SERVER_PORT);
            socket.send(packet);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // private void saveFile(Message msg){*/
    //     try {
    //         // String filename = "received_" + System.currentTimeMillis();
    //     } catch (IOException e) {
    //         System.out.println("Error saving file: " + e.getMessage());
    //     }
    // }

    private void sendFile(String path) {

    }

    public static void main(String[] args) {
        String name = "Guest";

        if(args.length > 0 && args[0] != null && !args[0].isEmpty()) {
            name = args[0];
        }

        ClientGUI client = new ClientGUI(name);
        Message msg = new Message(Message.Type.LEAVE, client.username, client.currentRoom, null);
        client.sendMessage(msg);
    }
}