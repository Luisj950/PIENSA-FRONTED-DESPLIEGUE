// src/config/api.ts

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://backend-final-despliegue.onrender.com' // ✅ URL real del backend en Render
    : 'http://127.0.0.1:3000'; // ✅ localhost para desarrollo
