import type { ConnectionStatusData, Room, User, Message } from "./types";

export {};

declare global {
  interface Window {
    electronAPI: {
      startClient: (name: string) => void;
      stopJava: () => void;
      sendToJava: (msg: string) => void;
      onJavaLog: (callback: (msg: string) => void) => void;
      onJavaFinished: (callback: (code: number) => void) => () => void;
      onRoomsUpdated: (callback: (rooms: Room[]) => void) => () => void;
      onMyRoomsUpdated:  (callback: (rooms: Room[]) => void) => () => void;
      onUserlistUpdated: (callback: (rooms: User[]) => void) => () => void;
      onConnectionSuccess:  (callback: () => void) => () => void;
      onConnectionStatus:  (callback: (data: ConnectionStatusData) => void) => () => void;
      onMessageReceived:  (callback: (msg: Message) => void) => () => void;
      getFilePath: (file: File) => string; 
    };
  }
}