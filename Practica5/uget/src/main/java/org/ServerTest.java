package org;
import java.net.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.nio.file.*;

public class ServerTest
{
	public static final int PUERTO = 8000;
	public static final int MAX_CLIENTS = 10; // Maximum number of concurrent clients
	private ServerSocket ss;
	private ExecutorService threadPool;
	
	private static final Map<String, String> MIME_TYPES = new HashMap<>();
	
	static {
		MIME_TYPES.put("html", "text/html");
		MIME_TYPES.put("htm", "text/html");
		MIME_TYPES.put("txt", "text/plain");
		MIME_TYPES.put("css", "text/css");
		MIME_TYPES.put("js", "application/javascript");
		MIME_TYPES.put("jpg", "image/jpeg");
		MIME_TYPES.put("jpeg", "image/jpeg");
		MIME_TYPES.put("png", "image/png");
		MIME_TYPES.put("gif", "image/gif");
		MIME_TYPES.put("ico", "image/x-icon");
		MIME_TYPES.put("json", "application/json");
		MIME_TYPES.put("pdf", "application/pdf");
		MIME_TYPES.put("xml", "application/xml");
	}
	
	class Manejador extends Thread
	{
		protected Socket socket;
		protected PrintWriter pw;
		protected BufferedOutputStream bos;
		protected BufferedReader br;
		protected String FileName;
		
		public Manejador(Socket _socket) throws Exception
		{
			this.socket = _socket;
		}
		
		public void run()
		{
			try {
				br = new BufferedReader(new InputStreamReader(socket.getInputStream()));
				bos = new BufferedOutputStream(socket.getOutputStream());
				pw = new PrintWriter(new OutputStreamWriter(bos));
				
					String requestLine = br.readLine();
				
				if(requestLine == null) {
					sendErrorResponse(400, "Peticion incorrecta - Linea de solicitud nula");
					return;
				}
				
				System.out.println("\nCliente Conectado desde: " + socket.getInetAddress());
				System.out.println("Por el puerto: " + socket.getPort());
				System.out.println("Datos: " + requestLine + "\r\n");
				
				StringTokenizer tokenizer = new StringTokenizer(requestLine);
				if (tokenizer.countTokens() < 3) {
					sendErrorResponse(400, "Peticion incorrecta - Linea de solicitud incompleta");
					return;
				}
				
				// Extract HTTP method, URI, and version
				String method = tokenizer.nextToken().toUpperCase();
				String uri = tokenizer.nextToken();				String httpVersion = tokenizer.nextToken();
				
				// Verify HTTP version
				if (!httpVersion.startsWith("HTTP/1.")) {
					sendErrorResponse(505, "Version HTTP no soportada - Solo se soporta HTTP/1.0 y HTTP/1.1");
					return;
				}
				
				// Read headers
				Map<String, String> headers = new HashMap<>();
				String headerLine;
				while ((headerLine = br.readLine()) != null && !headerLine.isEmpty()) {
					int colonPos = headerLine.indexOf(':');
					if (colonPos > 0) {
						String headerName = headerLine.substring(0, colonPos).trim();
						String headerValue = headerLine.substring(colonPos + 1).trim();
						headers.put(headerName.toLowerCase(), headerValue);
					}
				}
				
				// Read request body if present
				StringBuilder requestBody = new StringBuilder();
				if (headers.containsKey("content-length")) {
					int contentLength = Integer.parseInt(headers.get("content-length"));
					char[] buffer = new char[1024];
					int bytesRead;
					int totalBytesRead = 0;
					
					while (totalBytesRead < contentLength && 
						  (bytesRead = br.read(buffer, 0, Math.min(buffer.length, contentLength - totalBytesRead))) != -1) {
						requestBody.append(buffer, 0, bytesRead);
						totalBytesRead += bytesRead;
					}
				}
				
				// Handle request based on HTTP method
				switch (method) {
					case "GET":
						handleGetRequest(uri, headers);
						break;
					case "POST":
						handlePostRequest(uri, headers, requestBody.toString());
						break;
					case "PUT":
						handlePutRequest(uri, headers, requestBody.toString());
						break;
					case "DELETE":
						handleDeleteRequest(uri);
						break;
					default:
						sendErrorResponse(501, "No implementado - Metodo HTTP no soportado");
						break;
				}
			}
			catch(Exception e) {
				e.printStackTrace();
				try {
					sendErrorResponse(500, "Error del Servidor - Excepcion no controlada");
				} catch (Exception ex) {
					ex.printStackTrace();
				}
			}
			finally {
				try {
					socket.close();
				}
				catch(Exception e) {
					e.printStackTrace();
				}
			}
		}
		
		private void handleGetRequest(String uri, Map<String, String> headers) throws IOException {
			if (uri.contains("?")) {				// Handle query parameters
				String[] parts = uri.split("\\?", 2);
				// We don't use the path part here as we're just showing the query parameters
				String query = parts[1];
				
				// Log the query parameters
				System.out.println("Query parameters: " + query);
				
				pw.println("HTTP/1.1 200 OK");
				pw.println("Server: ServidorWEB/1.1");
				pw.println("Date: " + new Date());
				pw.println("Content-Type: text/html");
				pw.println("Connection: close");
				pw.println();
				pw.flush();
				
				pw.print("<html><head><title>SERVIDOR WEB</title></head>");
				pw.print("<body bgcolor=\"#2cb794\"><center><h1><br>Parametros Obtenidos..</br></h1>");
				pw.print("<h3><b>" + query + "</b></h3>");
				pw.print("</center></body></html>");
				pw.flush();
			} else {
				// Serve a file
				String filePath = uri.substring(1);
				
				// If no resource is specified, default to index.html
				if (filePath.isEmpty() || filePath.equals("/")) {
					filePath = "index.html";
				}
				
				serveFile(filePath);
			}
		}
		
		private void handlePostRequest(String uri, Map<String, String> headers, String requestBody) throws IOException {
			// Extract the path from the URI
			String path = uri.substring(1);
			
			if (path.isEmpty()) {
				sendErrorResponse(400, "Ruta invalida - No se especifico un recurso");
				return;
			}
			
			// Handle form submission or other POST data
			pw.println("HTTP/1.1 200 OK");
			pw.println("Server: ServidorWEB/1.1");
			pw.println("Date: " + new Date());
			pw.println("Content-Type: text/html");
			pw.println("Connection: close");
			pw.println();
			pw.flush();
			
			pw.print("<html><head><title>Peticion POST procesada</title></head>");
			pw.print("<body bgcolor=\"#2cb794\"><center>");
			pw.print("<h1>Peticion POST procesada exitosamente</h1>");
			pw.print("<h3>Recurso: " + path + "</h3>");
			pw.print("<h3>Cuerpo de la peticion:</h3>");
			pw.print("<pre>" + requestBody + "</pre>");
			pw.print("</center></body></html>");
			pw.flush();
		}
		
		private void handlePutRequest(String uri, Map<String, String> headers, String requestBody) throws IOException {
			// Extract the path from the URI
			String path = uri.substring(1);
			
			if (path.isEmpty()) {
				sendErrorResponse(400, "Ruta invalida - No se especifico un recurso");
				return;
			}
			
			File file = new File(path);
			
			// Check if the directory exists, if not try to create it
			File parentDir = file.getParentFile();
			if (parentDir != null && !parentDir.exists()) {
				if (!parentDir.mkdirs()) {
					sendErrorResponse(500, "Error del Servidor - No se pudo crear el directorio");
					return;
				}
			}
			
			// Check if we have permission to write to the file
			if (file.exists() && !file.canWrite()) {
				sendErrorResponse(403, "No se puede escribir en el recurso - Permiso denegado");
				return;
			}
			
			// Create or update the file with the request body
			try {
				Files.write(file.toPath(), requestBody.getBytes());
				
				// Send a success response
				pw.println("HTTP/1.1 201 Created");
				pw.println("Server: ServidorWEB/1.1");
				pw.println("Date: " + new Date());
				pw.println("Content-Type: text/html");
				pw.println("Connection: close");
				pw.println();
				pw.flush();
				
				pw.print("<html><head><title>Archivo Creado/Actualizado</title></head>");
				pw.print("<body bgcolor=\"#2cb794\"><center>");
				pw.print("<h1>Archivo Creado/Actualizado exitosamente</h1>");
				pw.print("<h3>Recurso: " + path + "</h3>");
				pw.print("</center></body></html>");
				pw.flush();
			} catch (IOException e) {
				e.printStackTrace();
				sendErrorResponse(500, "Error del Servidor - No se pudo crear/actualizar el archivo");
			}
		}
		
		private void handleDeleteRequest(String uri) throws IOException {
			// Extract the path from the URI
			String path = uri.substring(1);
			
			if (path.isEmpty()) {
				sendErrorResponse(400, "Ruta invalida - No se especifico un recurso");
				return;
			}
			
			File file = new File(path);
			
			// Check if the file exists
			if (!file.exists()) {
				sendErrorResponse(404, "No se encontro el recurso solicitado");
				return;
			}
			
			// Check if we have permission to delete the file
			if (!file.canWrite()) {
				sendErrorResponse(403, "No se puede eliminar el recurso - Permiso denegado");
				return;
			}
			
			// Try to delete the file
			if (file.delete()) {
				// Send a success response
				pw.println("HTTP/1.1 200 OK");
				pw.println("Server: ServidorWEB/1.1");
				pw.println("Date: " + new Date());
				pw.println("Content-Type: text/html");
				pw.println("Connection: close");
				pw.println();
				pw.flush();
				
				pw.print("<html><head><title>Archivo Eliminado</title></head>");
				pw.print("<body bgcolor=\"#2cb794\"><center>");
				pw.print("<h1>Archivo Eliminado Exitosamente</h1>");
				pw.print("<h3>Recurso: " + path + "</h3>");
				pw.print("</center></body></html>");
				pw.flush();
			} else {
				sendErrorResponse(500, "Error del Servidor - No se pudo eliminar el archivo");
			}
		}
		
		private void serveFile(String fileName) {
			try {
				File file = new File(fileName);
				
				if (!file.exists() || !file.isFile()) {
					sendErrorResponse(404, "No se encontro el recurso solicitado");
					return;
				}
				
				if (!file.canRead()) {
					sendErrorResponse(403, "No se puede leer el recurso - Permiso denegado");
					return;
				}
				
				// Determine the MIME type
				String contentType = getMimeType(fileName);
				
				// Prepare and send the response header
				StringBuilder header = new StringBuilder();
				header.append("HTTP/1.1 200 OK\r\n");
				header.append("Server: ServidorWEB/1.1\r\n");
				header.append("Fecha: ").append(new Date()).append("\r\n");
				header.append("Content-Type: ").append(contentType).append("\r\n");
				header.append("Content-Length: ").append(file.length()).append("\r\n");
				header.append("Conexion: close\r\n");
				header.append("\r\n");
				
				bos.write(header.toString().getBytes());
				
				// Send the file content
				BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file));
				byte[] buffer = new byte[4096];
				int bytesRead;
				
				while ((bytesRead = bis.read(buffer)) != -1) {
					bos.write(buffer, 0, bytesRead);
				}
				
				bos.flush();
				bis.close();
			} catch (Exception e) {
				e.printStackTrace();
				try {
					sendErrorResponse(500, "Error del Servidor - Excepcion al servir el archivo");
				} catch (Exception ex) {
					ex.printStackTrace();
				}
			}
		}
		
		private String getMimeType(String fileName) {
			String extension = "";
			int i = fileName.lastIndexOf('.');
			if (i > 0) {
				extension = fileName.substring(i + 1).toLowerCase();
			}
			
			String mimeType = MIME_TYPES.get(extension);
			if (mimeType == null) {
				// Default to binary data if MIME type is unknown
				mimeType = "application/octet-stream";
			}
			
			return mimeType;
		}
		
		private void sendErrorResponse(int statusCode, String statusMessage) throws IOException {
			pw.println("HTTP/1.1 " + statusCode + " " + statusMessage);
			pw.println("Server: ServidorWEB/1.1");
			pw.println("Fecha: " + new Date());
			pw.println("Content-Type: text/html");
			pw.println("Conexion: close");
			pw.println();
			pw.flush();
			
			pw.print("<html><head><title>Error " + statusCode + "</title></head>");
			pw.print("<body bgcolor=\"#2cb794\"><center>");
			pw.print("<h1>Error " + statusCode + ": " + statusMessage + "</h1>");
			pw.print("</center></body></html>");
			pw.flush();
		}
	}
	
	public ServerTest() throws Exception
	{
		System.out.println("Iniciando Servidor.......");
		this.ss = new ServerSocket(PUERTO);
		this.threadPool = Executors.newFixedThreadPool(MAX_CLIENTS);
		System.out.println("Servidor iniciado:---OK");
		System.out.println("Esperando por Cliente....");
		System.out.println("Maximo de clientes concurrentes: " + MAX_CLIENTS);
		
		for (;;) {
			Socket clientSocket = ss.accept();
			// Instead of creating a new thread directly, submit the task to the thread pool
			threadPool.submit(() -> {
				try {
					new Manejador(clientSocket).run();
				} catch (Exception e) {
					e.printStackTrace();
				}
			});
		}
	}
		public static void main(String[] args) throws Exception {
		new ServerTest();
	}
}