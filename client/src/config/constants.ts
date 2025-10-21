// constants.ts
const getEnv = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not defined. Using default: ${defaultValue}`);
    return defaultValue;
  }
  return value;
};

// Detección más robusta del entorno
const getBackendURL = () => {
  const hostname = window.location.hostname;
  
  // Desarrollo local
  if (['localhost', '127.0.0.1'].includes(hostname)) {
    return {
      backend1: getEnv("VITE_BACKEND1_URL_LOCAL", "http://localhost:3001"),
      backend2: getEnv("VITE_BACKEND2_URL_LOCAL", "http://localhost:5000")
    };
  }
  
  // Producción en sitio
  if (hostname.includes('onrender.com')) {
    return {
      backend1: getEnv("VITE_BACKEND1_URL_LAN", "Link de produccion"),
      backend2: getEnv("VITE_BACKEND2_URL_LAN", "Link de produccion")
    };
  }
  
  // Red local/LAN
  return {
    backend1: getEnv("VITE_BACKEND1_URL_LAN", "http://192.168.43.62:3001"),
    backend2: getEnv("VITE_BACKEND2_URL_LAN", "http://192.168.43.62:5000")
  };
};

const backendURLs = getBackendURL();

export const API_CONFIG = {
  BACKEND1_URL: backendURLs.backend1,
  BACKEND2_URL: backendURLs.backend2,
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 15000,
};

console.log('API Configuration:', API_CONFIG);