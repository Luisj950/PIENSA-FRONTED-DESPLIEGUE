// src/pages/AgendaPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, type Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';
import { ModalCrearCita } from '../components/ModalCrearCita';
import { ModalVerCita } from '../components/ModalVerCita';
import './AgendaPage.css';

// --- Interfaces ---
interface Veterinario {
  id: number;
  nombres: string;
  apellidos: string;
}

interface CitaAPI {
  id: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  tipo: string;
  estado: string;
  mascota: {
    nombre: string;
  };
}

// --- Configuración del Calendario ---
const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AgendaPage = () => {
  const { token } = useAuth();
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [citas, setCitas] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ start: Date; end: Date } | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<CalendarEvent | null>(null);

  // Obtiene la lista de veterinarios
  useEffect(() => {
    if (!token) return;
    const fetchVeterinarios = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/contacts`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de contactos.');
        }
        const data: Veterinario[] = await response.json();
        setVeterinarios(data);
        if (data.length > 0) {
          setSelectedVetId(String(data[0].id));
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al obtener veterinarios:", error);
        setLoading(false);
      }
    };
    fetchVeterinarios();
  }, [token]);

  // Obtiene las citas del veterinario seleccionado
  const fetchCitas = useCallback(async () => {
    if (!selectedVetId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // ✅ CAMBIO: La URL ahora coincide con la ruta del backend (/citas/veterinario/:id)
      const response = await fetch(`${API_BASE_URL}/citas/veterinario/${selectedVetId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data: CitaAPI[] = await response.json();
      const eventosFormateados = data.map(cita => ({
        title: `${cita.tipo.replace(/_/g, ' ')} - ${cita.mascota.nombre}`,
        start: new Date(cita.fechaHoraInicio),
        end: new Date(cita.fechaHoraFin),
        resource: cita,
      }));
      setCitas(eventosFormateados);
    } catch (error) {
      console.error("Error al obtener las citas:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedVetId, token]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSlotSeleccionado({ start, end });
    setModalCrearAbierto(true);
  }, []);

  const handleSelectEvent = useCallback((evento: CalendarEvent) => {
    setEventoSeleccionado(evento);
    setModalVerAbierto(true);
  }, []);

  const handleCitaCreada = (nuevaCitaAPI: CitaAPI) => {
    const nuevoEvento = {
      title: `${nuevaCitaAPI.tipo.replace(/_/g, ' ')} - ${nuevaCitaAPI.mascota.nombre}`,
      start: new Date(nuevaCitaAPI.fechaHoraInicio),
      end: new Date(nuevaCitaAPI.fechaHoraFin),
      resource: nuevaCitaAPI,
    };
    setCitas(prevCitas => [...prevCitas, nuevoEvento]);
    setModalCrearAbierto(false);
  };

  const handleCancelarCita = async (citaId: number) => {
    if (!token) return;
    try {
      // ✅ CAMBIO: La URL ahora coincide con la ruta del backend (/citas/:id/cancelar)
      const response = await fetch(`${API_BASE_URL}/citas/${citaId}/cancelar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      if (!response.ok) {
        throw new Error('No se pudo cancelar la cita.');
      }
      fetchCitas(); 
      setModalVerAbierto(false);
    } catch (error) {
      console.error("Error al cancelar la cita:", error);
      alert('Ocurrió un error al intentar cancelar la cita.');
    }
  };

  return (
    <div className="agenda-container">
      <div className="agenda-header">
        <h1>Agenda de Citas</h1>
        <div className="filtro-veterinario">
          <label htmlFor="vet-select">Seleccionar Veterinario:</label>
          <select 
            id="vet-select"
            value={selectedVetId} 
            onChange={(e) => setSelectedVetId(e.target.value)}
          >
            {veterinarios.map(vet => (
              <option key={vet.id} value={vet.id}>
                {vet.nombres} {vet.apellidos}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <p>Cargando agenda...</p>
      ) : (
        <Calendar
          localizer={localizer}
          events={citas}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh' }}
          culture="es"
          messages={{
            next: "Siguiente", previous: "Anterior", today: "Hoy",
            month: "Mes", week: "Semana", day: "Día",
          }}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {slotSeleccionado && (
        <ModalCrearCita
          isOpen={modalCrearAbierto}
          onRequestClose={() => setModalCrearAbierto(false)}
          onCitaCreada={handleCitaCreada}
          fechaInicio={slotSeleccionado.start}
          veterinarioId={Number(selectedVetId)}
        />
      )}
      {eventoSeleccionado && (
        <ModalVerCita
          isOpen={modalVerAbierto}
          onRequestClose={() => setModalVerAbierto(false)}
          evento={eventoSeleccionado}
          onCancelarCita={handleCancelarCita}
        />
      )}
    </div>
  );
};

export default AgendaPage;