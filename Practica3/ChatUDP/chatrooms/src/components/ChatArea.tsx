import React, { useState, useEffect, useRef } from 'react';
import { Hash, LogOut, Send, Paperclip, X, FileText, File, Check, Loader2, MessageCircle } from 'lucide-react';

interface Message {
  sender: string;
  content: string;
  room: string;
  isFile?: boolean;
  fileName?: string;
  fileSize?: number;
  isPrivate?: boolean;
  receiver?: string;
}

interface ChatAreaProps {
  activeTarget: string;
  isDmMode: boolean;
  messages: Message[];
  username: string;
  onLeaveRoom: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ activeTarget, isDmMode, messages, username, onLeaveRoom }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{file: File, path: string} | null>(null);
  const [sendingFile, setSendingFile] = useState(false);
  const [fileLoadingStates, setFileLoadingStates] = useState<Record<number, 'loading' | 'ready'>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtrar mensajes según el modo (DM o Sala)
  const filteredMessages = messages.filter(msg => {
    if (isDmMode) {
        // MODO DM: Mostrar si es privado Y (yo soy el sender y target es receiver O viceversa)
        return msg.isPrivate && (
            (msg.sender === username && msg.receiver === activeTarget) ||
            (msg.sender === activeTarget && msg.receiver === username)
        );
    } else {
        // MODO SALA: Mostrar si NO es privado Y coincide la sala
        return !msg.isPrivate && msg.room === activeTarget;
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Iniciar animación de carga para mensajes de archivo nuevos
    filteredMessages.forEach((msg, index) => {
      if (msg.isFile && !fileLoadingStates[index]) {
        setFileLoadingStates(prev => ({ ...prev, [index]: 'loading' }));
        
        setTimeout(() => {
          setFileLoadingStates(prev => ({ ...prev, [index]: 'ready' }));
        }, 1000);
      }
    });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (isDmMode) {
        // ENVIAR DM: /dm Usuario Mensaje
        window.electronAPI.sendToJava(`/dm ${activeTarget} ${inputText}`);
    } else {
        // ENVIAR TEXTO A SALA: /text Mensaje
        window.electronAPI.sendToJava("/text " + inputText);
    }
    setInputText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const filepath = window.electronAPI.getFilePath(file);
      console.log("Ruta recuperada:", filepath);
      setSelectedFile({ file, path: filepath }); 
    }
  };

  const handleSendFile = () => {
    if (selectedFile) {
      console.log("Enviando archivo desde: ", selectedFile.path);
      setSendingFile(true);
      
      window.electronAPI.sendToJava("/file " + selectedFile.path);
      
      setTimeout(() => {
        setSendingFile(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    
    switch(ext) {
      case 'pdf':
        return { icon: FileText, color: '#e74c3c' };
      case 'doc': case 'docx':
        return { icon: FileText, color: '#2980b9' };
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg':
        return { icon: File, color: '#9b59b6' };
      case 'mp3': case 'wav': case 'ogg':
        return { icon: File, color: '#f39c12' };
      case 'mp4': case 'avi': case 'mkv':
        return { icon: File, color: '#e67e22' };
      case 'zip': case 'rar': case '7z':
        return { icon: File, color: '#95a5a6' };
      default:
        return { icon: File, color: '#5865F2' };
    }
  };

  return (
    <div className="col-md-6 d-flex flex-column p-0"
      style={{ height: '100vh', maxHeight: '100vh' }} 
    >
      <div className="chat-header p-3" style={{ flexShrink: 0 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              {isDmMode ? (
                <>
                  <MessageCircle size={20} className="me-2 room-icon" />
                  {activeTarget || "Selecciona un chat"}
                </>
              ) : (
                <>
                  <Hash size={20} className="me-2 room-icon" />
                  {activeTarget || "Selecciona una sala"}
                </>
              )}
            </h5>
            <small className="text-muted">
              {isDmMode ? "Chat Privado" : "Sala Pública"}
            </small>
          </div>
          {!isDmMode && (
            <button className="btn btn-danger btn-sm" onClick={onLeaveRoom}>
              <LogOut size={16} className="me-2" />
              Salir
            </button>
          )}
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
        {filteredMessages.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center text-muted">
              {isDmMode ? (
                <MessageCircle size={48} className="mb-3" style={{ opacity: 0.3 }} />
              ) : (
                <Hash size={48} className="mb-3" style={{ opacity: 0.3 }} />
              )}
              <h5 className="mb-2">Empieza a chatear</h5>
              <p className="mb-0" style={{ fontSize: '14px' }}>
                {isDmMode 
                  ? `No hay mensajes con ${activeTarget}` 
                  : `No hay mensajes en #${activeTarget || '...'}`
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {filteredMessages.map((msg, index) => {
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
                
                {/* Mensaje de archivo - DISEÑO MEJORADO */}
                {msg.isFile ? (
                  <div className={`file-message-card ${isOwn ? 'own' : ''}`}>
                    <div className="d-flex align-items-center gap-3">
                      {/* Icono del archivo con fondo circular */}
                      <div 
                        className="file-icon-wrapper"
                        style={{ 
                          backgroundColor: getFileIcon(msg.fileName || '').color + '20',
                          color: getFileIcon(msg.fileName || '').color
                        }}
                      >
                        {React.createElement(getFileIcon(msg.fileName || '').icon, { 
                          size: 28,
                          strokeWidth: 2
                        })}
                      </div>
                      
                      {/* Información del archivo */}
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="file-name" title={msg.fileName}>
                          {msg.fileName || 'Archivo'}
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <small className="file-size">
                            {msg.fileSize ? formatFileSize(msg.fileSize) : 'Tamaño desconocido'}
                          </small>
                          <span style={{ 
                            fontSize: '12px', 
                            color: isOwn ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' 
                          }}>•</span>
                          <small className="file-status">
                            {msg.content}
                          </small>
                        </div>
                      </div>
                      
                      {/* ANIMACIÓN DE CARGANDO Y LUEGO LISTO */}
                      <div className="file-check-btn">
                        {fileLoadingStates[index] === 'loading' ? (
                          <Loader2 size={18} className="spin-animation" />
                        ) : (
                          <Check size={18} />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mensaje de texto normal */
                  <div>{msg.content}</div>
                )}
                
                <div className="text-end mt-1 message-time">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* PREVIEW DE ARCHIVO SELECCIONADO */}
      {selectedFile && (
        <div className="px-3 py-2" style={{ 
          backgroundColor: 'rgba(88, 101, 242, 0.1)',
          borderTop: '1px solid rgba(88, 101, 242, 0.3)',
          flexShrink: 0
        }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Paperclip size={16} className="text-primary" />
              <span className="text-truncate" style={{ maxWidth: '300px' }}>
                {selectedFile.file.name}
              </span>
              <small className="text-muted">
                {formatFileSize(selectedFile.file.size)}
              </small>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-purple"
                onClick={handleSendFile}
                disabled={sendingFile}
              >
                {sendingFile ? 'Enviando...' : 'Enviar'}
              </button>
              <button 
                className="btn btn-sm btn-dark-custom"
                onClick={handleCancelFile}
                disabled={sendingFile}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT AREA */}
      <div className="p-3 message-input-container" style={{ flexShrink: 0 }}>
        <div className="input-group">
          <input 
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button 
            className="btn btn-dark-custom"
            onClick={handleFileClick}
            disabled={!activeTarget}
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            className="form-control message-input" 
            placeholder={isDmMode 
              ? `Mensaje a ${activeTarget}` 
              : `Mensaje en #${activeTarget || '...'}`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!activeTarget}
          />
          <button className="btn btn-purple" onClick={handleSend} disabled={!activeTarget}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;