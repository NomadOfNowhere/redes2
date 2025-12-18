package org;
import java.io.Serializable;

public class Message implements Serializable {
    private static final long serialVersionUID = 1L;
    // Action types
    public enum Type { START, JOIN, TEXT, DM, LEAVE, FILE, USERS, ROOMS, MYROOMS, EXIT }
    public Type type;
    public String sender;
    public String room;
    public String content;
    public String receiver;
    public byte[] data;

    public Message(Type type, String sender, String room, String content) {
        this.type = type;
        this.sender = sender;
        this.room = room;
        this.content = content;
    }
}