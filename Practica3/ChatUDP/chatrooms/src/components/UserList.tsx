import React from 'react';
import { Users } from 'lucide-react';

interface User {
  id: number;
  name: string;
  status: 'online' | 'away';
}

interface UserPanelProps {
  users: User[];
}

const UserPanel: React.FC<UserPanelProps> = ({ users }) => {
  return (
    <div className="col-md-3 sidebar p-3">
      <h5 className="mb-3 users-title">
        <Users size={20} className="me-2" />
        Usuarios en Sala
      </h5>
      <div className="overflow-auto">
        {users.map(user => (
          <div key={user.id} className="user-item p-2 mb-2 rounded">
            <div className="d-flex align-items-center">
              <span className={`status-dot status-${user.status} me-2`}></span>
              <span>{user.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPanel;