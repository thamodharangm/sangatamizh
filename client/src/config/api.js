import axios from 'axios';

// Create an axios instance
const api = axios.create({
  // In development (vite), '/api' is proxied to localhost:3002 via vite.config.js
  // In production, set VITE_API_URL env var to your backend URL (e.g., https://my-backend.railway.app/api)
  baseURL: import.meta.env.VITE_API_URL || '/api', 
});

export default api;
