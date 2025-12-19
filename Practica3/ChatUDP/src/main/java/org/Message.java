package org;
import java.io.Serializable;

public class Message implements Serializable {
    private static final long serialVersionUID = 1L;
    // Action types
    public enum Type { START, JOIN, TEXT, DM, LEAVE, FILE, USERS, ROOMS, MYROOMS, EXIT, DMFILE }
    public Type type;
    public String sender;
    public String room;
    public String content;
    public byte[] data;

    // Field for dm
    public boolean isPrivate;
    public String receiver;

    // Fields for files
    public String fileId;      // id para identificar a qué archivo pertenece este pedazo
    public byte[] fileData;    // Los bytes del pedazo actual
    public int chunkIndex;     // Número de pedazo (0, 1, 2...)
    public int totalChunks;    // Total de pedazos

    public Message(Type type, String sender, String room, String content) {
        this.type = type;
        this.sender = sender;
        this.room = room;
        this.content = content;
    }
}