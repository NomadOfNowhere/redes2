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
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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

    // {id, {idxChunk, data}}
    private final Map<String, java.util.Map<Integer, byte[]>> incomingFiles = new ConcurrentHashMap<>();

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
                    String filePath = parts[1];
                    sendFile(filePath);
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
            
            case "/exit": {
                    Message msg = new Message(Message.Type.EXIT, username, null, null);
                    sendMessage(msg);
                    try { Thread.sleep(500); } catch (InterruptedException e) {}
                    System.exit(0);
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
                handleIncomingFile(msg);
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

    // New thread preventing Blocking wait
    private void saveFileToDisk(String originalName, String fileId, int totalChunks, String sender, String room) {
        try {
            // Crear la ruta compleja
            String directoryPath = ".." + java.io.File.separator + 
                                   "media" + java.io.File.separator + 
                                   username + java.io.File.separator + 
                                   "files";
            
            java.io.File directory = new java.io.File(directoryPath);

            // 2. CREAR TODA LA ESTRUCTURA DE CARPETAS SI NO EXISTE
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                if (!created && !directory.exists()) {
                    System.err.println("ERROR CRÍTICO: No se pudo crear la ruta: " + directory.getAbsolutePath());
                }
            }

            java.io.File outFile = new java.io.File(directory, "recibido_" + originalName);
            
            long fileSize = 0;

            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(outFile)) {
                java.util.Map<Integer, byte[]> chunks = incomingFiles.get(fileId);

                for (int i = 0; i < totalChunks; i++) {
                    if (chunks.containsKey(i)) {
                        byte[] chunkData = chunks.get(i);
                        fos.write(chunkData);
                        fileSize += chunkData.length;
                    } else {
                        System.err.println("Error: Archivo corrupto, faltó el pedazo " + i);
                    }
                }
            }
            
            // Obtener la ruta absoluta del archivo guardado
            String absolutePath = outFile.getAbsolutePath();
            System.out.println("Archivo guardado: " + absolutePath);
            incomingFiles.remove(fileId);

            // Escapar caracteres especiales
            String safeFileName = originalName.replace("\\", "\\\\").replace("\"", "\\\"");
            String safePath = absolutePath.replace("\\", "\\\\").replace("\"", "\\\"");
            
            // INCLUIR LA RUTA DEL ARCHIVO EN EL JSON
            String json = String.format(
                "{\"sender\":\"%s\",\"content\":\"%s\",\"room\":\"%s\",\"isFile\":true,\"fileName\":\"%s\",\"fileSize\":%d,\"filePath\":\"%s\"}",
                sender,
                "Recibió un archivo",
                room,
                safeFileName,
                fileSize,
                safePath  // NUEVO: Ruta absoluta del archivo
            );
            
            System.out.println("CMD:MSG:" + json);

        } catch (IOException e) {
            System.err.println("Error guardando archivo: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // También actualizar sendFile para incluir la ruta (para el sender)
    private void sendFile(String filePath) {
        new Thread(() -> {  
            try {
                java.io.File file = new java.io.File(filePath);
                if (!file.exists()) {
                    System.out.println("Error: Archivo no encontrado: " + filePath);
                    return;
                }

                String fileId = java.util.UUID.randomUUID().toString();
                int chunkSize = 50 * 1024;
                
                java.io.FileInputStream f = new java.io.FileInputStream(file);
                byte[] allBytes = f.readAllBytes();
                f.close();

                int totalChunks = (int) Math.ceil((double) allBytes.length / chunkSize);
                System.out.println("Enviando archivo: " + file.getName() + " (" + totalChunks + " partes)");

                for (int i = 0; i < totalChunks; i++) {
                    int start = i * chunkSize;
                    int length = Math.min(allBytes.length - start, chunkSize);
                    
                    byte[] chunk = new byte[length];
                    System.arraycopy(allBytes, start, chunk, 0, length);

                    Message msg = new Message(Message.Type.FILE, username, currentRoom, file.getName());
                    msg.fileId = fileId;
                    msg.fileData = chunk;
                    msg.chunkIndex = i;
                    msg.totalChunks = totalChunks;

                    sendMessage(msg);
                    Thread.sleep(10);
                    
                    if (i % 10 == 0) System.out.println("Enviando parte " + i + "/" + totalChunks);
                }
                
                System.out.println("Archivo enviado completamente.");
                
                // Escapar caracteres
                String safeFileName = file.getName().replace("\\", "\\\\").replace("\"", "\\\"");
                String safePath = file.getAbsolutePath().replace("\\", "\\\\").replace("\"", "\\\"");
                
                // Eco local para React - INCLUIR RUTA
                String json = String.format(
                    "{\"sender\":\"%s\",\"content\":\"%s\",\"room\":\"%s\",\"isFile\":true,\"fileName\":\"%s\",\"fileSize\":%d,\"filePath\":\"%s\"}", 
                    username,
                    "Envió un archivo",
                    currentRoom,
                    safeFileName,
                    file.length(),
                    safePath  // NUEVO: Ruta del archivo original
                );
                System.out.println("CMD:MSG:" + json);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
    private void handleIncomingFile(Message msg) {
        // 1. Crear el mapa para este archivo si es el primer pedazo que llega
        incomingFiles.putIfAbsent(msg.fileId, new ConcurrentHashMap<>());
        java.util.Map<Integer, byte[]> chunks = incomingFiles.get(msg.fileId);

        // 2. Guardar el pedazo actual
        chunks.put(msg.chunkIndex, msg.fileData);

        // 3. Verificar si ya tenemos TODOS los pedazos
        if (chunks.size() == msg.totalChunks) {
            System.out.println("Archivo completo recibido: " + msg.content + " (" + msg.totalChunks + " partes)");
            saveFileToDisk(msg.content, msg.fileId, msg.totalChunks, msg.sender, msg.room);
        } else {
            // Debug: mostrar progreso
            System.out.println("Recibido chunk " + msg.chunkIndex + "/" + msg.totalChunks + " del archivo " + msg.content);
        }
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