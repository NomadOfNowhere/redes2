import React, { useState } from 'react';
import { Users, MessageCircle } from 'lucide-react';
import type { User } from '../types';

interface UserPanelProps {
  users: User[];
  onUserClick?: (username: string) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ users, onUserClick }) => {
  const [hoveredUser, setHoveredUser] = useState<number | null>(null);

  const handleUserAction = (username: string) => {
    console.log("hola");
    onUserClick?.(username);
  };

  return (
    <div className="col-md-3 sidebar p-3">
      <h5 className="mb-3 users-title">
        <Users size={20} className="me-2" />
        Usuarios en Sala
      </h5>
      <div className="overflow-auto">
        {users.map(user => (
          <div 
            key={user.id} 
            className="user-item p-2 mb-2 rounded"
            onMouseEnter={() => setHoveredUser(user.id)}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <span className={`status-dot status-${user.status} me-2`}></span>
                <span>{user.name}</span>
              </div>
              
              {hoveredUser === user.id && (
                <button 
                  className="btn-user-action"
                  onClick={() => handleUserAction(user.name)}
                  title="Enviar mensaje"
                >
                  <MessageCircle size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPanel;