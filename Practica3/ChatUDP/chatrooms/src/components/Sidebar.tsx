import React, { useState } from 'react';
import { Hash, Plus, Users, X, LogOut } from 'lucide-react';
import type { Room } from '../types';

interface SidebarProps {
  rooms: Room[];
  activeRoom: string;
  username: string;
  onRoomChange: (roomId: string) => void;
  onCreateRoom?: (roomName: string) => void;
  onLogout?: () => void;
  viewMode: 'all' | 'mine';
  onToggleMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  rooms, 
  activeRoom, 
  username, 
  onRoomChange,
  onCreateRoom,
  onLogout,
  viewMode, 
  onToggleMode,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleMode = () => {
      onToggleMode();
      if (viewMode === 'mine') {
          window.electronAPI.sendToJava("/rooms");
      } else {
          window.electronAPI.sendToJava("/myrooms");
      }
  };

  const handleCreateRoom = () => {
    const name = newRoomName.trim();
    if(name) {
      onCreateRoom?.(name);
      window.electronAPI.sendToJava("/join " + newRoomName.trim());
      window.electronAPI.sendToJava("/myrooms");
      onRoomChange(name);
      setNewRoomName('');
      setShowModal(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateRoom();
    }
  };

  return (
    <>
      {/* SECCIÓN SUPERIOR */}
      <div 
        className="col-md-3 sidebar p-3 d-flex flex-column"
        style={{ height: '100vh', maxHeight: '100vh' }} 
      >
        <div className="mb-4" style={{ flexShrink: 0 }}>
          <h4 className="mb-3 sidebar-title">
            <Hash size={24} className="me-2" />
            Salas de Chat
          </h4>
          <button 
            className="btn btn-purple w-100 mb-3"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} className="me-2" />
            Unirse/Crear Sala
          </button>
        </div>

        {/* LISTA DE SALAS */}
        <div className="flex-grow-1 overflow-auto hide-scrollbar">
          {rooms.map(room => (
            <div 
              key={room.name}
              className={`room-item p-3 mb-2 rounded ${activeRoom === room.name ? 'active' : ''}`}
              onClick={() => onRoomChange(room.name)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-truncate" style={{ maxWidth: '80%' }}>
                  <Hash size={16} className="me-2 room-icon" />
                  <span className="fw-bold">{room.name}</span>
                </div>
                <span className="badge bg-secondary">{room.users}</span>
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN INFERIOR */}
        <div className="mt-3" style={{ flexShrink: 0 }}>
          <button className="btn btn-dark-custom w-100 mb-2" onClick={handleMode}>
            <Users size={18} className="me-2" />
            {viewMode === 'all' ? "Ver Todas las Salas" : "Ver Mis Salas"}
          </button>

          <div className="text-center mt-3 pt-3 user-info">
            <small className="text-muted d-block mb-1">Conectado como</small>
            <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
              <strong className="username-display">{username}</strong>
              <button 
                className="btn-logout-small"
                onClick={onLogout}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear sala */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <Hash size={20} className="me-2" />
                Unirse o crear nueva sala
              </h5>
              <button 
                className="btn-close-modal"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <label className="form-label modal-label">Nombre de la sala</label>
              <input 
                type="text"
                className="form-control input-modal"
                placeholder="Ej: Programación, Música, Deportes..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-dark-custom"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-purple"
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;