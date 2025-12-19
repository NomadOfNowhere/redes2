export interface Room {
  name: string;
  users: number;
}

export interface Message {
  sender: string;
  content: string;
  room: string;
  // receiver?: string;
  // isPrivate?: boolean;
  // isFile?: boolean;
  // fileName?: string;

  isPrivate?: boolean;

  receiver?: string;
  isFile?: boolean;        // NUEVO: Indica si es un archivo
  fileName?: string;       // NUEVO: Nombre del archivo
  fileSize?: number;
  // id: number;
  // user: string;
  // text: string;
  // time: string;
  // isOwn: boolean;
}

export interface User {
  id: number;
  name: string;
  status: 'online' | 'away';
}

export type ConnectionStatusData = {
  type: 'info' | 'error';
  message: string;
};