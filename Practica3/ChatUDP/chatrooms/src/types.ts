export interface Room {
  name: string;
  users: number;
}

export interface Message {
  sender: string;
  content: string;
  room: string;
  receiver?: string;
  isPrivate?: boolean;
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