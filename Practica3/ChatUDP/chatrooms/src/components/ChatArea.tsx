import React, { useState, useEffect, useRef } from 'react';
import { Hash, LogOut, Send, Paperclip } from 'lucide-react';
// Asegúrate de importar el tipo correcto que definimos antes
import type { Room, Message } from '../types';

interface ChatAreaProps {
  room?: Room;
  messages: Message[]; // Usamos el nuevo tipo que viene de Java
  username: string;        // Necesitamos saber quién soy para pintar los mensajes a la derecha
  onLeaveRoom: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ room, messages, username, onLeaveRoom }) => {
  // 1. Estado para el texto del input
  const [inputText, setInputText] = useState('');
  
  // Ref para el auto-scroll al fondo
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cada vez que llegan mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Función para enviar mensaje
  const handleSend = () => {
    if (inputText.trim()) {
      // Enviamos el comando a Java. Java se encarga de formatearlo y mandarlo al Server
      window.electronAPI.sendToJava("/text " + inputText);
      setInputText(''); // Limpiamos el input
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Filtramos solo los mensajes de la sala actual
  const currentRoomMessages = messages.filter(m => m.room === room?.name);

  return (
    <div className="col-md-6 d-flex flex-column p-0"
      style={{ height: '100vh', maxHeight: '100vh' }} 
    >
      <div className="chat-header p-3" style={{ flexShrink: 0 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <Hash size={20} className="me-2 room-icon" />
              {room?.name || "Selecciona o únete a una sala"}
            </h5>
            <small className="text-muted">
              {room?.users || 0} usuarios conectados
            </small>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onLeaveRoom}>
            <LogOut size={16} className="me-2" />
            Salir
          </button>
        </div>
      </div>

      {/* AREA DE MENSAJES */}
      <div className="flex-grow-1 p-3 overflow-auto chat-messages hide-scrollbar"
        style={{ 
            overflowY: 'auto', 
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}
      >
        {currentRoomMessages.map((msg, index) => {
          // Calculamos isOwn
          const isOwn = msg.sender === username;
          
          return (
            <div key={index} className="mb-3 d-flex" style={{ 
              justifyContent: isOwn ? 'flex-end' : 'flex-start' 
            }}>
              <div className={`message-bubble p-3 ${isOwn ? 'own' : ''}`}>
                {!isOwn && (
                  <div className="fw-bold mb-1 message-user">
                    {msg.sender}
                  </div>
                )}
                <div>{msg.content}</div>
                
                {/* Tiempo agregado con ts */}
                <div className="text-end mt-1 message-time">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        {/* Div invisible para el scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 message-input-container" style={{ flexShrink: 0 }}>
        <div className="input-group">
          <button className="btn btn-dark-custom">
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            className="form-control message-input" 
            placeholder={`Mensaje en #${room?.name || '...'}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!room} // Deshabilitar si no hay sala
          />
          <button className="btn btn-purple" onClick={handleSend} disabled={!room}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;