import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UserList from './components/UserList';
import type { Room, User, ConnectionStatusData, Message } from './types';

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<string>('General');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [userlist, setUserlist] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('mine');
  
  // Configuración de listeners (puente js-java)
  useEffect(() => {
    // Java envió CMD:CONNECTED
    const removeSuccessListener = window.electronAPI.onConnectionSuccess(async () => {
      console.log("Conectado al server");
      setConnectionStatus({ type: 'info', message: '¡Conexión exitosa!' });

      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      setConnectionStatus(null);
      setIsLoggedIn(true);

      // Pedimos datos iniciales una vez conectados
      window.electronAPI.sendToJava("/myrooms");
      window.electronAPI.sendToJava("/who");
    });

    // Java envió CMD:STATUS
    const removeStatusListener = window.electronAPI.onConnectionStatus((data) => {
      setConnectionStatus(data);
    });

    // Broadcast de salas: CMD:ROOMS
    const removeRoomsListener = window.electronAPI.onRoomsUpdated((newRooms) => {
      setRooms(newRooms);
    });

    // Broadcast de salas: CMD:MYROOMS
    const removeMyRoomsListener = window.electronAPI.onMyRoomsUpdated((myRooms) => {
      setMyRooms(myRooms);
    });

    // Broadcast de lista de usuarios: CMD:USERS
    const removeUsersListener = window.electronAPI.onUserlistUpdated((newUserlist) => {
      setUserlist(newUserlist);
    }); 

    // Programa java cerró
    const removeJavaStopListener = window.electronAPI.onJavaFinished(async (code) => {
      console.log(`El proceso Java terminó con código: ${code}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearData();
    });

    // Broadcast de mensajes: CMD:MSG
    const removeMsgListener = window.electronAPI.onMessageReceived((newMsg) => {
      console.log("Nuevo mensaje recibido:", newMsg);
      
      // Agregamos el mensaje nuevo a la lista existente
      setMessages((prevMessages) => [...prevMessages, newMsg]);
    });


    // Limpieza al desmontar
    return () => {
      console.log("Limpiando listeners antiguos...");
      removeSuccessListener();
      removeStatusListener();
      removeRoomsListener();
      removeUsersListener();
      removeJavaStopListener();
      removeMyRoomsListener();
      removeMsgListener();
    };
  }, [username]);

  // Actualizar lista de usuarios al cambiar de sala
  useEffect(() => {
    if(isLoggedIn) {
      window.electronAPI.sendToJava("/switch " + activeRoom);
      window.electronAPI.sendToJava("/who");
      console.log("Cambiando a sala: " + activeRoom);
    }
  }, [activeRoom, isLoggedIn]);

  // Iniciar/cerrar sesión
  const handleLogin = async (name: string) => {
    setUsername(name);
    setConnectionStatus({ type: 'info', message: 'Iniciando conexión al servidor...' });
    setLoading(true);
    console.log(`Iniciando sesión y cliente java como ${name}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.electronAPI.startClient(name);
  };
  const handleLogout = async () => {
    console.log("Cerrando sesión. Deteniendo cliente java...")
    setConnectionStatus({ type: 'info', message: 'Cerrando sesión...' });
    setLoading(true);
    window.electronAPI.sendToJava("/exit");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const handleLeaveRoom = () => {
    window.electronAPI.sendToJava("/leave " + activeRoom);
    const availableRooms = myRooms.filter(r => r.name !== activeRoom);
    const nextRoom = availableRooms.length > 0 ? availableRooms[0].name : '';
    setActiveRoom(nextRoom);
  }
  const clearData = () => {
    setLoading(false);
    setIsLoggedIn(false);
    setRooms([]);
    setMyRooms([]);
    setUserlist([]);
    setConnectionStatus(null);
    setUsername('');
  }
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <span>{connectionStatus?.message || "Cargando..."}</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeRoomData = rooms.find(r => r.name === activeRoom);
  const roomsDisplay = viewMode === 'all' ? rooms : myRooms;
  
  return (
    <div className="chat-app">
      <div className="container-fluid h-100">
        <div className="row h-100">
          <Sidebar 
            rooms={roomsDisplay}
            activeRoom={activeRoom}
            username={username}
            onRoomChange={setActiveRoom}
            viewMode={viewMode}
            onLogout={handleLogout}
            onToggleMode={() => setViewMode(prev => prev === 'all' ? 'mine' : 'all')}
          />
          
          <ChatArea 
            room={activeRoomData}
            messages={messages}
            username={username}
            onLeaveRoom={handleLeaveRoom}
          />
          
          <UserList users={userlist} />
        </div>
      </div>
    </div>
  );
};

export default App;