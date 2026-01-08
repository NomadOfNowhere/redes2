import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');

  const handleSubmit = () => {
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container p-5">
        <div className="text-center mb-4">
          <div className="mb-3">
            <MessageCircle size={64} className="login-icon" />
          </div>
          <h2 className="login-title">Bienvenido</h2>
          <p>Ingresa tu nombre de usuario para continuar</p>
        </div>
        
        <div className="mb-4">
          <label className="form-label login-label">Usuario</label>
          <input 
            type="text" 
            className="form-control form-control-lg input-login" 
            placeholder="Escribe tu nombre..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <button 
          className="btn btn-purple btn-lg w-100"
          onClick={handleSubmit}
        >
          Continuar
        </button>

        <div className="text-center mt-4">
          <small className="text-white" style={{ opacity: 0.7 }}>
            Al continuar, aceptas unirte a las salas de chat públicas
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginView;