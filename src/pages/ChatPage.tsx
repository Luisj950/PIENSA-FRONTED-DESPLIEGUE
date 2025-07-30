// src/pages/ChatPage.tsx

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

interface Mensaje {
  id: number;
  mensaje: string;
  emisor: {
    id: number;
    nombres: string;
  };
  fechaEnvio: string;
}

interface ReceptorInfo {
  nombres: string;
  apellidos: string;
}

// ✅ Se define la URL base de la API usando la variable de entorno.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ChatPage = () => {
  const { user, token } = useAuth();
  const { receptorId: receptorIdFromUrl } = useParams();
  const receptorId = receptorIdFromUrl ? Number(receptorIdFromUrl) : null;
  
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [receptorInfo, setReceptorInfo] = useState<ReceptorInfo | null>(null);

  useEffect(() => {
    if (!receptorId || !token) return;

    const fetchReceptorData = async () => {
      try {
        // ✅ CAMBIO: Se usa la variable de entorno para la URL.
        const response = await fetch(`${API_BASE_URL}/users/${receptorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('No se pudo obtener la información del usuario.');
        }
        const data = await response.json();
        setReceptorInfo(data);
      } catch (error) {
        console.error("Error al obtener datos del receptor:", error);
      }
    };

    fetchReceptorData();
  }, [receptorId, token]);

  useEffect(() => {
    if (!user || !token || !receptorId) return;

    socket.auth = { token };
    socket.connect();
    socket.emit('unirseAChat', { receptorId });

    socket.on('cargarHistorial', (historial: Mensaje[]) => {
      setMensajes(historial);
    });

    socket.on('nuevoMensaje', (mensaje: Mensaje) => {
      setMensajes((mensajesAnteriores) => [...mensajesAnteriores, mensaje]);
    });

    return () => {
      socket.off('cargarHistorial');
      socket.off('nuevoMensaje');
      socket.disconnect();
    };
  }, [user, token, receptorId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (nuevoMensaje.trim() && user && receptorId) {
      socket.emit('enviarMensaje', {
        mensaje: nuevoMensaje,
        receptorId: receptorId,
      });
      setNuevoMensaje('');
    }
  };

  if (!receptorId) {
    return <div>Error: URL de chat no válida. Falta el ID del receptor.</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        Chateando con {receptorInfo ? `${receptorInfo.nombres} ${receptorInfo.apellidos}` : `Usuario #${receptorId}`}
      </div>
      
      <div className="messages-list">
        {mensajes.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-item ${msg.emisor.id === user?.sub ? 'sent' : 'received'}`}
          >
            {msg.emisor.id !== user?.sub && (
              <div className="message-sender">{msg.emisor.nombres}</div>
            )}
            <div className="message-content">
              {msg.mensaje}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="message-input"
          autoComplete="off"
        />
        <button type="submit" className="send-button">
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ChatPage;