package org;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.SSLSocketFactory;

public class Client {
    private static final int THREAD_POOL_SIZE = 10;
    private static Scanner scanner = new Scanner(System.in);
    private static Set<String> processedUrls = new HashSet<>();
    private static ExecutorService executor;

    public static void main(String[] args) {
        if (args.length == 0) {
            printUsage();
            return;
        }

        String url = null;
        String outputDir = null;
        boolean recursive = false;
        int maxDepth = 0;

        try {
            for (int i = 0; i < args.length; i++) {
                switch (args[i]) {
                    case "-p":
                        if (i + 1 < args.length) outputDir = args[++i];
                        break;
                    case "--r":
                        recursive = true;
                        break;
                    case "-d":
                        if (i + 1 < args.length) maxDepth = Integer.parseInt(args[++i]);
                        break;
                    case "--help":
                        break;
                    default:
                        // Asumimos que cualquier argumento suelto es la URL
                        if (url == null) url = args[i];
                        break;
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing arguments: " + e.getMessage());
            printUsage();
            return;
        }

        if (url == null) {
            System.err.println("Error: Missing URL.");
            printUsage();
            return;
        }

        if (!url.toLowerCase().startsWith("http://") && !url.toLowerCase().startsWith("https://")) {
            url = "https://" + url;
        }

        if (outputDir == null) {
            try {
                URI tempUri = new URI(url);
                String host = tempUri.getHost();
                if (host != null) {
                    String safeHost = host.replaceAll("[:\\\\/*?|<>]", "_");
                    outputDir = Paths.get("resources", safeHost).toString();
                } else {
                    outputDir = "resources/unknown";
                }
            } catch (URISyntaxException e) {
                outputDir = "resources/unknown";
            }
        }

        System.out.println("Target URL: " + url);
        System.out.println("Output Directory: " + outputDir);

        if (recursive) {
            System.out.println("Mode: Recursive (Depth: " + maxDepth + ")");
            executeRecursiveDownload(url, outputDir, maxDepth);
        } else {
            System.out.println("Mode: Single File");
            executeSingleDownload(url, outputDir);
        }
    }

    private static void executeSingleDownload(String url, String outputDir) {
        try {
            // Parse URL
            URI parsedUri = new URI(url);
            String host = parsedUri.getHost();
            int port = parsedUri.getPort();
            String path = parsedUri.getPath().isEmpty() ? "/" : parsedUri.getPath();

            // Extract filename from path
            String fileName = path.substring(path.lastIndexOf('/') + 1);
            if (fileName.isEmpty()) fileName = "index.html";

            // Default port (HTTPS/HTTP)
            if (port == -1) port = "https".equalsIgnoreCase(parsedUri.getScheme()) ? 443 : 80;

            // Create destination directory
            Path dirPath = Paths.get(outputDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
                System.out.println("Directory created: " + dirPath.toAbsolutePath());
            }
            
            String outputPath = Paths.get(outputDir, fileName).toString();
            System.out.println("\nConnecting to " + host + (port != 80 && port != 443 ? ":" + port : ""));
            System.out.println("Requesting resource: " + path);

            downloadFile(host, port, path, outputPath);
        } catch (URISyntaxException e) {
            System.err.println("Invalid URL. Correct format: http://host:port/path");
        } catch (IOException e) {
            System.err.println("I/O Error: " + e.getMessage());
        }
    }

    private static void downloadFile(String host, int port, String path, String outputPath) throws IOException {
        Socket socket = null;
        try {
            // Socket SSL/normal
            if(port == 443) {    // for HTTPS
                SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
                socket = factory.createSocket(host, port);
            }
            else {               // for HTTP
                socket = new Socket(host, port);
            }
            socket.setSoTimeout(10000);

            OutputStream out = socket.getOutputStream();
            InputStream in = new BufferedInputStream(socket.getInputStream());

            // Send HTTP Request
            String request = requestBody(path, host);
            out.write(request.getBytes());
            out.flush();
            System.out.println("Request sent, waiting for response...");

            // Read headers
            String statusLine = readLine(in);
            if(statusLine == null) throw new IOException("No response from server");

            System.out.println("Response: " + statusLine);
            if (!statusLine.contains("200")) throw new IOException("HTTP Error: " + statusLine);

            // Parse Headers
            Map<String, String> headers = new HashMap<>();
            String line;
            while ((line = readLine(in)) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon > 0) {
                    headers.put(line.substring(0, colon).trim().toLowerCase(), 
                                line.substring(colon + 1).trim());
                }
            }

            // Get Content-Length if available
            long contentLength = -1;
            if (headers.containsKey("content-length")) {
                try { contentLength = Long.parseLong(headers.get("content-length")); } catch (Exception e) {}
            }
            if (contentLength != -1) System.out.println("File size: " + formatFileSize(contentLength));

            // Read body and save file
            try (FileOutputStream fileOut = new FileOutputStream(outputPath)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                long totalBytesRead = 0;
                long startTime = System.currentTimeMillis();

                System.out.println("Downloading to: " + outputPath);

                while ((bytesRead = in.read(buffer)) != -1) {
                    fileOut.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;

                    // Show progress
                    if (contentLength > 0) {
                        double progress = (double) totalBytesRead / contentLength * 100;
                        System.out.printf("\rProgress: %.1f%%", progress);
                    } else {
                        System.out.printf("\rBytes: %s", formatFileSize(totalBytesRead));
                    }
                    
                    if (contentLength > 0 && totalBytesRead >= contentLength) break;
                }
                
                long time = System.currentTimeMillis() - startTime;
                System.out.println("\nDownload complete in " + (time/1000.0) + "s");
            }
        } finally {
            if (socket != null && !socket.isClosed()) socket.close(); 
        }
    }    

    private static void executeRecursiveDownload(String urlBase, String outputDir, int maxDepth) {
        System.out.println("\nRECURSIVE FILE DOWNLOAD");
        try {
            if (maxDepth < 0) {
                System.out.println("Level must be >= 0. Defaulting to 0.");
                maxDepth = 0;
            }
        } catch (NumberFormatException e) {
            System.out.println("Invalid level. Defaulting to 0.");
        }

        // Initialize Thread Pool
        executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        processedUrls.clear();

        try {
            // Parse URI
            URI parsedUri = new URI(urlBase);
            String host = parsedUri.getHost();
            int port = parsedUri.getPort();
            String path = parsedUri.getPath().isEmpty() ? "/" : parsedUri.getPath();

            // Default port (HTTPS/HTTP)
            if (port == -1) port = "https".equalsIgnoreCase(parsedUri.getScheme()) ? 443 : 80;

            // Build base URL with original port
            String baseUrl = parsedUri.getScheme() + "://" + host;
            if (port != 80 && port != 443) baseUrl += ":" + port;

            // Create destination directory
            Path dirPath = Paths.get(outputDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
                System.out.println("Directory created: " + dirPath.toAbsolutePath());
            }

            System.out.println("\nStarting recursive download from " + urlBase);
            System.out.println("Max depth: " + maxDepth);
            System.out.println("Using " + THREAD_POOL_SIZE + " threads");

            // Start recursion with a latch
            CountDownLatch latch = new CountDownLatch(1);
            recursiveDownloadTask(baseUrl, path, outputDir, 0, maxDepth, latch);

            // Wait for all downloads
            latch.await();
            System.out.println("\nWaiting for threads to finish...");
            executor.shutdown();
            executor.awaitTermination(1, TimeUnit.HOURS);
            System.out.println("\nRecursive download complete. Processed " + processedUrls.size() + " URLs.");
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        } 
    }

    private static void recursiveDownloadTask(String baseUrl, String path, String outputDir,
                                              int currentDepth, int maxDepth, CountDownLatch parentLatch) {
        String fullUrl = path.startsWith("http") ? path : baseUrl + path;

        // Avoid duplicate processing
        synchronized (processedUrls) {
            if (processedUrls.contains(fullUrl)) {
                parentLatch.countDown();
                return;
            }
            processedUrls.add(fullUrl);
        }

        executor.submit(() -> {
            try {
                // URI Parsing inside thread
                URI uri = new URI(baseUrl);
                String host = uri.getHost();
                int port = uri.getPort();

                String fileName = path.substring(path.lastIndexOf('/') + 1);
                if (fileName.isEmpty()) fileName = "index.html";

                // Create subdirectory logic
                String relativePath = "";
                if (path.contains("/")) {
                    relativePath = path.substring(0, path.lastIndexOf('/'));
                    if (relativePath.startsWith("/")) {
                        relativePath = relativePath.substring(1);
                    }
                }

                String subDir = outputDir;
                if (!relativePath.isEmpty()) {
                    subDir = Paths.get(outputDir, relativePath).toString();
                    Files.createDirectories(Paths.get(subDir));
                }

                String outputPath = Paths.get(subDir, fileName).toString();

                if (port == -1) port = "https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;

                System.out.println("[Depth " + currentDepth + "] Downloading: " + fullUrl + " -> " + outputPath);

                // Download Content bytes
                byte[] content = downloadContentBytes(host, port, path, outputPath);

                // Extract links for recursion
                List<String> links = new ArrayList<>();

                // Level 1 logic: Download everything in base dir
                if (currentDepth == 0 && maxDepth >= 1 && isHtmlFile(fileName, content)) {
                    links.addAll(extractLinks(new String(content, "UTF-8")));

                    if (path.equals("/") || path.endsWith("/index.html")) {
                        for (String link : new ArrayList<>(links)) {
                            if (link.startsWith("/") ||
                                    (!link.contains("://") && !link.startsWith("mailto:") &&
                                     !link.startsWith("javascript:") && !link.startsWith("#"))) {
                                continue; 
                            }
                        }
                    }
                }

                // Level > 2 logic
                if (currentDepth >= 1 && currentDepth < maxDepth && isHtmlFile(fileName, content)) {
                    links.addAll(extractLinks(new String(content, "UTF-8")));
                }

                if (!links.isEmpty()) {
                    CountDownLatch childLatch = new CountDownLatch(links.size());

                    for (String link : links) {
                        // Normalize link
                        if (link.startsWith("http")) {
                            try {
                                URI linkUri = new URI(link);
                                String linkHost = linkUri.getHost();
                                int linkPort = linkUri.getPort();

                                if (linkPort == -1) linkPort = "https".equalsIgnoreCase(linkUri.getScheme()) ? 443 : 80;

                                String linkPath = linkUri.getPath().isEmpty() ? "/" : linkUri.getPath();
                                String linkBaseUrl;
                                if (linkUri.getPort() == -1) {
                                    linkBaseUrl = linkUri.getScheme() + "://" + linkHost;
                                } else {
                                    linkBaseUrl = linkUri.getScheme() + "://" + linkHost + ":" + linkPort;
                                }

                                // Only process links from same domain
                                if (linkHost.equals(host)) {
                                    int nextLevel = (currentDepth == 0) ? 1 : currentDepth + 1;
                                    recursiveDownloadTask(linkBaseUrl, linkPath, outputDir,
                                            nextLevel, maxDepth, childLatch);
                                } else {
                                    childLatch.countDown();
                                }
                            } catch (URISyntaxException e) {
                                childLatch.countDown();
                            }
                        } else {
                            // Relative URL
                            String linkPath;
                            if (link.startsWith("/")) {
                                linkPath = link;
                            } else {
                                String currentPath = path;
                                if (currentPath.endsWith("/")) {
                                    linkPath = currentPath + link;
                                } else {
                                    if (currentPath.contains("/")) {
                                        currentPath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                                    } else {
                                        currentPath = "/";
                                    }
                                    linkPath = currentPath + link;
                                }
                            }

                            linkPath = normalizePath(linkPath);
                            int nextLevel = (currentDepth == 0) ? 1 : currentDepth + 1;
                            recursiveDownloadTask(baseUrl, linkPath, outputDir,
                                    nextLevel, maxDepth, childLatch);
                        }
                    }

                    try {
                        childLatch.await();
                    } catch (InterruptedException e) {
                        System.err.println("Interrupted: " + e.getMessage());
                    }
                }

            } catch (Exception e) {
                System.err.println("Error processing " + fullUrl + ": " + e.getMessage());
            } finally {
                parentLatch.countDown();
            }
        });
    }
    
    private static byte[] downloadContentBytes(String host, int port, String path, String outputPath) throws IOException {
        Socket socket = null;
        // Socket SSL/normal
        try {
            // HTTPS
            if(port == 443) {
                SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
                socket = factory.createSocket(host, port);
            }
            else {
                socket = new Socket(host, port);
            }
            socket.setSoTimeout(10000);

            OutputStream out = socket.getOutputStream();
            InputStream in = new BufferedInputStream(socket.getInputStream());

            String request = requestBody(path, host);
            out.write(request.getBytes());
            out.flush();

            // Read headers
            String status = readLine(in);
            if (status == null || !status.contains("200")) throw new IOException("HTTP Error: " + status);

            while (true) { 
                String line = readLine(in);
                if(line == null || line.isEmpty()) break;
            }

            // Read body and save file
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[8192];
            int n;
            while ((n = in.read(data)) != -1) {
                buffer.write(data, 0, n);
            }
            
            byte[] bytes = buffer.toByteArray();
            try (FileOutputStream fos = new FileOutputStream(outputPath)) {
                fos.write(bytes);
            }
            return bytes;
        } finally {
            if (socket != null) socket.close();
        }
    }

    // ***  AUXILIARY FUNCTIONS  ***
    private static String requestBody(String path, String host) {
        return "GET " + path + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "User-Agent: HTTPClient-Java/1.0\r\n" +
               "Connection: close\r\n" +
               "\r\n";
    }

    private static boolean isHtmlFile(String fileName, byte[] content) {
        if (fileName.toLowerCase().endsWith(".html") || fileName.toLowerCase().endsWith(".htm")) return true;
        try {
            String start = new String(content, 0, Math.min(content.length, 500), "UTF-8").toLowerCase();
            return start.contains("<!doctype html") || start.contains("<html") ||
                   start.contains("<head") || start.contains("<body");
        } catch (Exception e) { return false; }
    }

    private static String formatFileSize(long bytes) {
        if(bytes < 1024) return bytes + " B";
        int exp = (int)(Math.log(bytes) / Math.log(1024));
        String prefix = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), prefix);
    }


    private static List<String> extractLinks(String html) {
        // Grupo 1: href o src
        // Grupo 2: La comilla usada ( ' o " ) -> \1 referencia a este grupo para cerrar igual
        // Grupo 3: El enlace (lo que queremos)
        List<String> links = new ArrayList<>();
        Pattern p = Pattern.compile("(href|src)\\s*=\\s*([\"'])(.*?)\\2", Pattern.CASE_INSENSITIVE);
    
        Matcher m = p.matcher(html);
        while (m.find()) {
            String link = m.group(3); // El enlace está en el grupo 3
            
            if (!link.startsWith("#") && 
                !link.startsWith("javascript:") && 
                !link.startsWith("mailto:")) {
                links.add(link);
            }
        }
        return links;
    }

    private static String normalizePath(String path) {
        if (!path.contains("./")) {
            return path;
        }

        String[] segments = path.split("/");
        List<String> normalizedSegments = new ArrayList<>();

        for (String segment : segments) {
            if (segment.equals("..")) {
                if (!normalizedSegments.isEmpty()) {
                    normalizedSegments.remove(normalizedSegments.size() - 1);
                }
            } else if (!segment.equals(".") && !segment.isEmpty()) {
                normalizedSegments.add(segment);
            }
        }

        StringBuilder normalizedPath = new StringBuilder();
        if (path.startsWith("/")) {
            normalizedPath.append("/");
        }

        for (int i = 0; i < normalizedSegments.size(); i++) {
            normalizedPath.append(normalizedSegments.get(i));
            if (i < normalizedSegments.size() - 1) {
                normalizedPath.append("/");
            }
        }

        return normalizedPath.toString();
    }

        private static void printUsage() {
        System.out.println("\nUsage:");
        System.out.println("  uget <url>                     Download single file to default folder");
        System.out.println("  uget -P <dir> <url>            Download to specific directory");
        System.out.println("  uget --r <url>                 Recursive download (default depth 0)");
        System.out.println("  uget --r -d <n> <url>          Recursive download with depth n");
        System.out.println("\nExamples:");
        System.out.println("  java org.Client codeforces.com");
        System.out.println("  java org.Client --r -d 1 codeforces.com");
        System.out.print("Recursion depth [0-n]: ");
        System.out.println("\n Level 0: Only specified file");
        System.out.println("  Level 1: All files in the base URL directory");
        System.out.println("   Level > 2: Everything referenced from files");
    }

    private static int readOption() {
        try {
            return Integer.parseInt(scanner.nextLine().trim());
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private static String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break; 
            if (b != '\r') baos.write(b);
        }
        if (baos.size() == 0 && b == -1) return null;
        return baos.toString("UTF-8");
    }
}




/*

Download single file
uget link 

Specify dir
uget -P /path file

Recursive 0 download
uget --r file
uget --r file -d n file
uget --r -p file -d n file

*/
