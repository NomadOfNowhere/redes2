import type { Room, User } from "./types";

export {};

declare global {
  interface Window {
    electronAPI: {
      startClient: (name: string) => void;
      stopJava: () => void;
      sendToJava: (msg: string) => void;
      onJavaLog: (callback: (msg: string) => void) => void;
      onJavaFinished: (callback: (code: number) => void) => void;
      onRoomsUpdated: (callback: (rooms: Room[]) => void) => () => void;
      onUserlistUpdated: (callback: (rooms: User[]) => void) => () => void;
    };
  }
}