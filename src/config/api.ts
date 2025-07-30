// src/config/api.ts

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://backend-final-despliegue.vercel.app' // 🔁 Cambia esto por tu URL real de backend desplegado
    : 'http://127.0.0.1:3000'; // Localhost para desarrollo
