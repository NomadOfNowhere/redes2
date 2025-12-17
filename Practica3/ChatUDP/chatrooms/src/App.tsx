import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UserList from './components/UserList';
import { MESSAGES } from './data/data';
import type { Room, User } from './types';

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<string>('General');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userlist, setUserlist] = useState<User[]>([]);

  useEffect(() => {
    const removeListener = window.electronAPI.onRoomsUpdated((newRooms) => {
      setRooms(newRooms);
    });

    return () => {
      removeListener(); 
    };
  }, []);

  useEffect(() => {
    const removeListener = window.electronAPI.onUserlistUpdated((newUserlist) => {
      setUserlist(newUserlist);
    });

    return () => {
      removeListener(); 
    };
  }, []);

  useEffect(() => {
    window.electronAPI.sendToJava("/switch " + activeRoom);
    window.electronAPI.sendToJava("/who");
    console.log(activeRoom);
  }, [activeRoom]);

  const handleLogin = (name: string) => {
    setUsername(name);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    const manageConnection = async () => {
      if (!isLoggedIn) {
        console.log("Deteniendo cliente java...");
        window.electronAPI.stopJava();
        setRooms([]);
      }
      else {
        console.log(`Iniciando cliente java como ${username}...`);
        window.electronAPI.startClient(username);
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.electronAPI.sendToJava("/rooms");
        window.electronAPI.sendToJava("/who");
      }
    };
    manageConnection();
  }, [isLoggedIn, username]);

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeRoomData = rooms.find(r => r.name === activeRoom);

  return (
    <div className="chat-app">
      <div className="container-fluid h-100">
        <div className="row h-100">
          <Sidebar 
            rooms={rooms}
            activeRoom={activeRoom}
            username={username}
            onRoomChange={setActiveRoom}
          />
          
          <ChatArea 
            room={activeRoomData}
            messages={MESSAGES}
            onLogout={() => setIsLoggedIn(false)}
          />
          
          <UserList users={userlist} />
        </div>
      </div>
    </div>
  );
};

export default App;