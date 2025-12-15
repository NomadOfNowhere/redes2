import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UserList from './components/UserList';
import { ROOMS, MESSAGES, USERS } from './data/data';

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<string>('general');

  const handleLogin = (name: string) => {
    setUsername(name);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      console.log("Deteniendo cliente java...");
      window.electronAPI.stopJava();
    }
    else {
      console.log(`Iniciando cliente java como ${username}...`);
      window.electronAPI.startClient(username);
    }
  }, [isLoggedIn, username]);

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeRoomData = ROOMS.find(r => r.id === activeRoom);

  return (
    <div className="chat-app">
      <div className="container-fluid h-100">
        <div className="row h-100">
          <Sidebar 
            rooms={ROOMS}
            activeRoom={activeRoom}
            username={username}
            onRoomChange={setActiveRoom}
          />
          
          <ChatArea 
            room={activeRoomData}
            messages={MESSAGES}
            onLogout={() => setIsLoggedIn(false)}
          />
          
          <UserList users={USERS} />
        </div>
      </div>
    </div>
  );
};

export default App;