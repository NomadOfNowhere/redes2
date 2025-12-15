export interface Room {
  id: string;
  name: string;
  users: number;
}

export interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  isOwn: boolean;
}

export interface User {
  id: number;
  name: string;
  status: 'online' | 'away';
}