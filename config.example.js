/**
 * CONFIGURACIÓN PÚBLICA DE LA APLICACIÓN DEL CLIMA
 * ⚠️ ESTE ARCHIVO SÍ SE SUBE AL REPOSITORIO - NO PONGAS API KEYS AQUÍ
 * 
 * Para usar la aplicación:
 * 1. Copia este archivo como 'config.js'
 * 2. Añade tu API key en config.js
 * 3. config.js está protegido en .gitignore
 */

// 👇 EJEMPLO - NO PONGAS TU API KEY REAL AQUÍ 👇
const OPENWEATHER_API_KEY = 'TU_API_KEY_AQUI';

// ========================================================================
// CONFIGURACIÓN PÚBLICA (OK para repositorio)
// ========================================================================

const APP_CONFIG = {
    // API Configuration
    API_KEY: OPENWEATHER_API_KEY,
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric', // 'metric' = Celsius, 'imperial' = Fahrenheit
    LANG: 'es',
    
    // Default Settings
    DEFAULT_CITY: 'Madrid',
    UPDATE_INTERVAL: 10 * 60 * 1000, // 10 minutos
    
    // Geolocation Settings
    GEO_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 15000, // 15 segundos
        maximumAge: 300000 // 5 minutos
    },
    
    // Performance Settings
    ANIMATION_DURATION: 300,
    LOADING_MIN_TIME: 1000,
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutos
    
    // Advanced Settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    MIN_REQUEST_INTERVAL: 1000
};

// ========================================================================
// VALIDACIÓN DE CONFIGURACIÓN
// ========================================================================

function validateConfig() {
    const issues = [];
    
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'TU_API_KEY_AQUI') {
        issues.push('❌ API Key no configurada - copia config.example.js como config.js y añade tu clave');
    }
    
    if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY.length < 20) {
        issues.push('⚠️ API Key parece ser inválida (muy corta)');
    }
    
    if (issues.length > 0) {
        console.warn('🔧 Problemas de configuración detectados:');
        issues.forEach(issue => console.warn(issue));
        return false;
    }
    
    console.log('✅ Configuración válida');
    return true;
}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG, validateConfig };
}

// Auto-validar al cargar
if (typeof window !== 'undefined') {
    validateConfig();
}
