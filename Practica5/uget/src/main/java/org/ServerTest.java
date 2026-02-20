package org;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Date;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// mvn exec:java -Dexec.mainClass="org.ServerTest"
// mvn exec:java -Dexec.mainClass="org.Client"
public class ServerTest {

    public static final int PORT = 10000;
    public static final int MAX_WORKERS = 10;
    private ServerSocket serverSocket;
    private ExecutorService threadPool;

    // MIME Types dictionary for correct browser/client rendering
    private static final Map<String, String> MIME_TYPES = Map.of(
		"html", "text/html",
		"htm", "text/html",
		"txt", "text/plain",
		"css", "text/css",
		"jpg", "image/jpeg",
		"png", "image/png",
		"gif", "image/gif",
		"pdf", "application/pdf",
		"js", "application/javascript",
		"json", "application/json"
    );

    public ServerTest() throws IOException {
        this.serverSocket = new ServerSocket(PORT);
        this.threadPool = Executors.newFixedThreadPool(MAX_WORKERS);
        System.out.println("Starting server. Listening on port " + PORT);

        while (true) {
            try {
                Socket clientSocket = serverSocket.accept();
                threadPool.submit(new HttpHandler(clientSocket));
            } catch (Exception e) {
                System.err.println("Accept error: " + e.getMessage());
            }
        }
    }

    public class HttpHandler implements Runnable {

        Socket socket;

        public HttpHandler(Socket socket) {
            this.socket = socket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream())); BufferedOutputStream out = new BufferedOutputStream(socket.getOutputStream()); PrintWriter writer = new PrintWriter(out)) {

                String requestLine = in.readLine();
                if (requestLine == null) {
                    return;
                }

                System.out.println("Request: " + requestLine + " from " + socket.getInetAddress() + ":" + socket.getPort());

                StringTokenizer tokenizer = new StringTokenizer(requestLine);
                if (tokenizer.countTokens() < 2) {
                    return;
                }

                String method = tokenizer.nextToken().toUpperCase();
                String uri = tokenizer.nextToken();

                // Only allow GET method
                if (method.equals("GET")) {
                    handleGet(uri, writer, out);
                } else {
                    sendError(writer, 405, "Method Not Allowed");
                }
            } catch (Exception e) {
                System.err.println("Handler error: " + e.getMessage());
            } finally {
                try {
                    socket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        private void handleGet(String uri, PrintWriter writer, BufferedOutputStream out) throws IOException {
            // Remove query parameters for file searching
            String path = uri.contains("?") ? uri.split("\\?")[0] : uri;

            // Default file
            if (path.equals("/")) {
                path = "/index.html";
            }

            // Remove leading slash
            File file = new File(path.substring(1));
            if (!file.exists() || !file.isFile()) {
                sendError(writer, 404, "Not Found");
                return;
            }

            // Send headers
            writer.println("HTTP/1.1 200 OK");
            writer.println("Server: Server/1.1");
            writer.println("Date: " + new Date());
            writer.println("Content-Type: " + getMimeType(file.getName()));
            writer.println("Content-Length: " + file.length());
            writer.println("Connection: closed");
            writer.println();
            writer.flush();

            // Send file content (binary)
            try (FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                out.flush();
            }
        }

        private String getMimeType(String fileName) {
            String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            return MIME_TYPES.getOrDefault(ext, "application/octet-stream");
        }

        private void sendError(PrintWriter writer, int code, String msg) {
            writer.println("HTTP/1.1 " + code + " " + msg);
            writer.println("Server: Server/1.1");
            writer.println("Date: " + new Date());
            writer.println("Content-Type: text/html");
            writer.println("Connection: closed");
            writer.println();
            writer.println("<html><body><h1>" + code + " " + msg + "</h1></body></html>");
            writer.flush();
        }
    }

    public static void main(String args[]) throws Exception {
        ServerTest server = new ServerTest();
    }
}
