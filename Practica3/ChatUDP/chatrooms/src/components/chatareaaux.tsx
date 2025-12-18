import React from 'react';
import { Hash, LogOut, Send, Paperclip } from 'lucide-react';
import type { Room, Message } from '../types';

interface ChatAreaProps {
  room?: Room;
  messages: Message[];
  onLogout: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ room, messages, onLogout }) => {
  return (
    <div className="col-md-6 d-flex flex-column p-0">
      <div className="chat-header p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <Hash size={20} className="me-2 room-icon" />
              {room?.name}
            </h5>
            <small className="text-muted">
              {room?.users} usuarios conectados
            </small>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            <LogOut size={16} className="me-2" />
            Salir
          </button>
        </div>
      </div>

      {/* <div className="flex-grow-1 p-3 overflow-auto chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className="mb-3 d-flex" style={{ 
            justifyContent: msg.isOwn ? 'flex-end' : 'flex-start' 
          }}>
            <div className={`message-bubble p-3 ${msg.isOwn ? 'own' : ''}`}>
              {!msg.isOwn && (
                <div className="fw-bold mb-1 message-user">
                  {msg.user}
                </div>
              )}
              <div>{msg.text}</div>
              <div className="text-end mt-1 message-time">
                {msg.time}
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {/* <div className="flex-grow-1 p-3 overflow-auto chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className="mb-3 d-flex" style={{ 
            justifyContent: msg.isOwn ? 'flex-end' : 'flex-start' 
          }}>
            <div className={`message-bubble p-3 ${msg.isOwn ? 'own' : ''}`}>
              {!msg.isOwn && (
                <div className="fw-bold mb-1 message-user">
                  {msg.user}
                </div>
              )}
              <div>{msg.text}</div>
              <div className="text-end mt-1 message-time">
                {msg.time}
              </div>
            </div>
          </div>
        ))}
      </div> */}

      <div className="p-3 message-input-container">
        <div className="input-group">
          <button className="btn btn-dark-custom">
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            className="form-control message-input" 
            placeholder="Escribe un mensaje..."
          />
          <button className="btn btn-purple">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;