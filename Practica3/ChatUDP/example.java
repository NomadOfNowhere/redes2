 
    private void sendFile(String path) {
        try {
            File file = new File(path);
            if (!file.exists()) {
                System.out.println("File not found.");
                return;
            }
            
            // Read file into bytes
            byte[] content = Files.readAllBytes(file.toPath());
            
            // NOTE: UDP packets are limited (~64KB). Large files need chunking.
            // For this basic example, we assume small files (stickers/short audio).
            if (content.length > 60000) {
                System.out.println("File is too large for a single UDP packet!");
                return;
            }

            Message msg = new Message(Message.Type.FILE, username, currentRoom, "File sent: " + file.getName());
            msg.data = content; // Attach bytes
            
            sendMessage(msg);
            System.out.println("File sent successfully.");
            
        } catch (IOException e) {
            System.out.println("Error reading file: " + e.getMessage());
        }
    }


}

        private void saveFile(Message msg) {
            // Automatically save received files
            try {
                // Generate a unique name to avoid overwriting
                String fileName = "received_" + System.currentTimeMillis() + ".dat"; 
                // Hint: In a real app, you would send the extension in msg.content
                
                FileOutputStream fos = new FileOutputStream(fileName);
                fos.write(msg.data);
                fos.close();
                System.out.println("Saved file as: " + fileName);
        }
    }
