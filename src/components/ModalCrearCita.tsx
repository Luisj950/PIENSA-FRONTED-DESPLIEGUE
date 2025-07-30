// src/components/ModalCrearCita.tsx

import { useState, useEffect, type FormEvent } from 'react';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';

// ✅ Se define la URL base de la API usando la variable de entorno.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TIPOS_DE_CITA = {
  CONSULTA_GENERAL: 'consulta_general',
  CIRUGIA: 'cirugia',
  VACUNACION: 'vacunacion',
  SEGUIMIENTO: 'seguimiento',
  URGENCIA: 'urgencia',
} as const;

type TipoCita = typeof TIPOS_DE_CITA[keyof typeof TIPOS_DE_CITA];

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onCitaCreada: (nuevaCita: any) => void;
  fechaInicio: Date;
  veterinarioId: number;
}

interface Mascota {
  id: number;
  nombre: string;
}

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '450px', borderRadius: '8px', padding: '2rem',
    border: 'none',
  },
};

Modal.setAppElement('#root');

export const ModalCrearCita = ({ isOpen, onRequestClose, onCitaCreada, fechaInicio, veterinarioId }: ModalProps) => {
  const { user, token } = useAuth();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selectedMascota, setSelectedMascota] = useState('');
  const [tipoCita, setTipoCita] = useState<TipoCita>(TIPOS_DE_CITA.CONSULTA_GENERAL);
  const [duracion, setDuracion] = useState(30);

  useEffect(() => {
    if (!token || !user) return;
    
    // ✅ CAMBIO: Se usa la variable de entorno para la URL.
    fetch(`${API_BASE_URL}/mascotas/propietario/${user.sub}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            setMascotas(data);
        }
    })
    .catch(console.error);
  }, [token, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMascota) {
        alert("Por favor, selecciona una mascota.");
        return;
    }

    const payload = {
      fechaHoraInicio: fechaInicio.toISOString(),
      duracionMinutos: Number(duracion),
      tipo: tipoCita,
      mascotaId: Number(selectedMascota),
      veterinarioId: veterinarioId,
    };

    try {
      // ✅ CAMBIO: Se usa la variable de entorno para la URL.
      const response = await fetch(`${API_BASE_URL}/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la cita.');
      }

      const nuevaCita = await response.json();
      onCitaCreada(nuevaCita);
      onRequestClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles} contentLabel="Agendar Nueva Cita">
      <h2>Agendar Nueva Cita</h2>
      <p><strong>Fecha:</strong> {fechaInicio.toLocaleString('es-EC')}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mascota:</label>
          <select value={selectedMascota} onChange={e => setSelectedMascota(e.target.value)} required>
            <option value="" disabled>Selecciona una mascota</option>
            {mascotas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Tipo de Cita:</label>
          <select value={tipoCita} onChange={e => setTipoCita(e.target.value as TipoCita)}>
            {Object.values(TIPOS_DE_CITA).map((tipo) => <option key={tipo} value={tipo}>{tipo.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Duración (minutos):</label>
          <input type="number" value={duracion} onChange={e => setDuracion(Number(e.target.value))} min="15" step="15" />
        </div>
        <div className="form-actions">
          <button type="submit" className="button-primary">Confirmar Cita</button>
          <button type="button" onClick={onRequestClose} className="button-secondary">Cancelar</button>
        </div>
      </form>
    </Modal>
  );
};