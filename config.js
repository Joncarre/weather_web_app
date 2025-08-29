/**
 * CONFIGURACIÓN DE LA APLICACIÓN DEL CLIMA
 * 
 * INSTRUCCIONES:
 * 1. Regístrate en https://openweathermap.org/api
 * 2. Obtén tu API key gratuita (1000 llamadas/día)
 * 3. Reemplaza 'TU_API_KEY_AQUI' con tu clave real
 * 4. Guarda este archivo (NO lo subas a repositorios públicos)
 */

// Para testing local, descomenta la siguiente línea y añade tu API key:
// const OPENWEATHER_API_KEY = 'TU_API_KEY_AQUI';

// Configuración de la aplicación
const APP_CONFIG = {
    // API Configuration
    API_KEY: typeof OPENWEATHER_API_KEY !== 'undefined' ? OPENWEATHER_API_KEY : '',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric',
    LANG: 'es',
    
    // Default Settings
    DEFAULT_CITY: 'Madrid',
    UPDATE_INTERVAL: 10 * 60 * 1000, // 10 minutos
    
    // Geolocation Settings
    GEO_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
    },
    
    // UI Settings
    ANIMATION_DURATION: 200,
    LOADING_MIN_TIME: 1500 // Tiempo mínimo de loading para UX
};

// Exportar configuración (para uso futuro con módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
