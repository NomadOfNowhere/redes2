import type { Message, Room, User } from "../types";

export const USERS: User[] = [
    { id: 1, name: 'Usuario1', status: 'online' },
    { id: 2, name: 'Usuario2', status: 'online' },
    { id: 3, name: 'Usuario3', status: 'away' },
    { id: 4, name: 'Usuario4', status: 'online' }
];

export const MESSAGES: Message[] = [
    { id: 1, user: 'Usuario1', text: 'Hola a todos!', time: '10:30', isOwn: false },
    { id: 2, user: 'Usuario2', text: 'Hey! Qué tal?', time: '10:31', isOwn: false },
    { id: 3, user: 'Tú', text: 'Todo bien, gracias', time: '10:32', isOwn: true },
    { id: 4, user: 'Usuario3', text: 'Alguien tiene el archivo de ayer?', time: '10:33', isOwn: false },
];