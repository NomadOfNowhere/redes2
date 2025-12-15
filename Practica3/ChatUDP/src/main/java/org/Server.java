package org;

import java.net.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class Server {
    private static final int PORT = 10000;
    private static final int BUFFER_SIZE = 65535;

    private static Map<String, Map<String, Client>> rooms = new ConcurrentHashMap<>();
    public static void main(String[] args) {
        

    }

    static class Client {
        InetAddress ip;
        int port;
        public Client(InetAddress ip, int port) { this.ip = ip; this.port = port; }
    }
}