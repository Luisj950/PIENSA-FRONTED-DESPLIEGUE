// src/socket.ts
import { io, Socket } from 'socket.io-client';

// URL del servidor de sockets, configurada en .env o en Vercel
const URL = import.meta.env.VITE_SOCKET_URL;

// Exporta una instancia de socket que se conecta solo cuando tú lo llamas (autoConnect: false)
export const socket: Socket = io(URL, {
  autoConnect: false,
});
