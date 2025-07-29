import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Icono para la página de registro
const UserPlusIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    color="var(--color-primary)"
    style={{ verticalAlign: 'bottom', marginRight: '8px' }} // Estilo para alinear mejor con el texto
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="22" x2="22" y1="8" y2="14" />
    <line x1="19" x2="25" y1="11" y2="11" />
  </svg>
);


const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/auth/register', formData);
      alert('¡Registro exitoso! Ahora por favor inicia sesión.');
      navigate('/login');
    } catch (err: any) {
      // Extrae los mensajes de error del array si el backend los envía así
      const messages = err.response?.data?.message;
      const errorMessage = Array.isArray(messages) ? messages.join(', ') : messages;
      setError(errorMessage || 'Error en el registro.');
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">
          <UserPlusIcon />
          Crear Cuenta
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombres">Nombres:</label>
            <input id="nombres" name="nombres" type="text" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="apellidos">Apellidos:</label>
            <input id="apellidos" name="apellidos" type="text" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico:</label>
            <input id="email" name="email" type="email" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="telefono">Teléfono (opcional):</label>
            <input id="telefono" name="telefono" type="text" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input id="password" name="password" type="password" minLength={8} onChange={handleChange} required />
          </div>
          <button type="submit" className="submit-button">Registrarse</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;