/**
 * CLIMA MINIMALISTA - JavaScript Core
 * Aplicación del clima responsive y optimizada para personas mayores
 */

// ========================================================================
// CONFIGURACIÓN Y CONSTANTES
// ========================================================================

const CONFIG = {
    API_KEY: '', // TODO: Añadir tu API key de OpenWeatherMap
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric',
    LANG: 'es',
    DEFAULT_CITY: 'Madrid'
};

// Elementos DOM principales
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    mainContent: document.getElementById('main-content'),
    location: document.getElementById('location'),
    currentWeather: document.getElementById('current-weather'),
    additionalInfo: document.getElementById('additional-info'),
    forecastContainer: document.getElementById('forecast-container'),
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    retryButton: document.getElementById('retry-button')
};

// ========================================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ========================================================================

const appState = {
    currentLocation: null,
    weatherData: null,
    forecastData: null,
    lastUpdate: null
};

// ========================================================================
// FUNCIONES DE UTILIDAD
// ========================================================================

/**
 * Muestra un mensaje de error al usuario
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.remove('hidden');
    elements.loadingScreen.classList.add('hidden');
}

/**
 * Oculta el modal de error
 */
function hideError() {
    elements.errorModal.classList.add('hidden');
}

/**
 * Muestra el contenido principal con animaciones escalonadas
 */
function showMainContent() {
    elements.loadingScreen.classList.add('hidden');
    elements.mainContent.classList.remove('hidden');
    
    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Aplicar animaciones escalonadas
    setTimeout(() => {
        elements.mainContent.classList.add('fade-in');
    }, 50);
}

/**
 * Formatea la fecha para mostrar
 */
function formatDate(timestamp, options = {}) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        ...options
    });
}

/**
 * Formatea la hora para mostrar
 */
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Capitaliza la primera letra de un string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================================================
// GEOLOCALIZACIÓN
// ========================================================================

/**
 * Obtiene la ubicación del usuario
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('La geolocalización no está soportada en este navegador'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                appState.currentLocation = coords;
                resolve(coords);
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                let message = 'No se pudo obtener tu ubicación. ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Permite el acceso a la ubicación para continuar.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'La ubicación no está disponible.';
                        break;
                    case error.TIMEOUT:
                        message += 'Se agotó el tiempo de espera.';
                        break;
                    default:
                        message += 'Error desconocido.';
                        break;
                }
                
                reject(new Error(message));
            },
            options
        );
    });
}

// ========================================================================
// API DEL CLIMA
// ========================================================================

/**
 * Realiza una llamada a la API de OpenWeatherMap
 */
async function apiCall(endpoint, params = {}) {
    if (!CONFIG.API_KEY) {
        throw new Error('API Key no configurada. Por favor, añade tu clave de OpenWeatherMap.');
    }

    const url = new URL(`${CONFIG.BASE_URL}/${endpoint}`);
    url.searchParams.append('appid', CONFIG.API_KEY);
    url.searchParams.append('units', CONFIG.UNITS);
    url.searchParams.append('lang', CONFIG.LANG);
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('API Key inválida. Verifica tu clave de OpenWeatherMap.');
            } else if (response.status === 404) {
                throw new Error('Ubicación no encontrada.');
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        }
        
        return await response.json();
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('Sin conexión a internet. Verifica tu conexión.');
        }
        throw error;
    }
}

/**
 * Obtiene los datos del clima actual
 */
async function getCurrentWeather(lat, lon) {
    return await apiCall('weather', { lat, lon });
}

/**
 * Obtiene el pronóstico de 7 días
 */
async function getForecast(lat, lon) {
    return await apiCall('forecast', { lat, lon });
}

// ========================================================================
// RENDERIZADO DE DATOS
// ========================================================================

/**
 * Actualiza la información de ubicación con mejor estilo
 */
function updateLocation(data) {
    const locationText = `${data.name}, ${data.sys.country}`;
    elements.location.innerHTML = `
        <i data-lucide="map-pin" class="w-4 h-4"></i>
        <span>${locationText}</span>
    `;
    
    // Recrear iconos de Lucide después de actualizar el DOM
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Renderiza el clima actual con el nuevo sistema de diseño
 */
function renderCurrentWeather(data) {
    const iconMap = {
        'clear sky': '☀️',
        'few clouds': '🌤️',
        'scattered clouds': '⛅',
        'broken clouds': '☁️',
        'shower rain': '🌦️',
        'rain': '🌧️',
        'thunderstorm': '⛈️',
        'snow': '🌨️',
        'mist': '🌫️',
        'default': '🌤️'
    };

    const weatherIcon = iconMap[data.weather[0].description] || iconMap['default'];
    
    elements.currentWeather.innerHTML = `
        <div class="text-center">
            <div class="weather-icon pulse-gentle mb-4">${weatherIcon}</div>
            <div class="temperature-main mb-2">${Math.round(data.main.temp)}°</div>
            <p class="weather-description mb-4">${capitalize(data.weather[0].description)}</p>
            <div class="flex justify-center items-center gap-6 text-sm">
                <div class="flex items-center gap-1">
                    <i data-lucide="thermometer" class="w-4 h-4 text-blue-400"></i>
                    <span class="data-label">Sensación</span>
                    <span class="data-value">${Math.round(data.main.feels_like)}°</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza información adicional con el nuevo diseño
 */
function renderAdditionalInfo(data) {
    const additionalData = [
        {
            icon: '💧',
            label: 'Humedad',
            value: `${data.main.humidity}%`,
            lucideIcon: 'droplets'
        },
        {
            icon: '💨',
            label: 'Viento',
            value: `${Math.round(data.wind.speed)} km/h`,
            lucideIcon: 'wind'
        },
        {
            icon: '�',
            label: 'Presión',
            value: `${data.main.pressure} hPa`,
            lucideIcon: 'gauge'
        },
        {
            icon: '👁️',
            label: 'Visibilidad',
            value: data.visibility ? `${Math.round(data.visibility / 1000)} km` : 'N/A',
            lucideIcon: 'eye'
        }
    ];

    elements.additionalInfo.innerHTML = additionalData.map((item, index) => `
        <div class="info-card glass-card-hover fade-in-delay-${index + 1}">
            <div class="info-icon">${item.icon}</div>
            <div class="info-label">${item.label}</div>
            <div class="info-value">${item.value}</div>
        </div>
    `).join('');
}

/**
 * Renderiza el pronóstico (placeholder por ahora)
 */
function renderForecast(data) {
    // TODO: Implementar en Fase 5
    elements.forecastContainer.innerHTML = `
        <div class="text-center text-slate-600 py-8">
            <div class="text-4xl mb-2">📅</div>
            <p>Pronóstico de 7 días<br><small>Próximamente disponible</small></p>
        </div>
    `;
}

// ========================================================================
// APLICACIÓN DE EFECTOS VISUALES
// ========================================================================

/**
 * Aplica efectos visuales mejorados según el clima
 */
function applyWeatherEffects(weatherCode, main) {
    // Remover todas las clases de clima anteriores
    const weatherClasses = [
        'weather-sunny', 'weather-partly-cloudy', 'weather-cloudy', 
        'weather-rainy', 'weather-stormy', 'weather-snowy', 
        'weather-foggy', 'weather-sunset'
    ];
    
    document.body.classList.remove(...weatherClasses, 'rain-effect', 'snow-effect');
    
    // Aplicar nueva clase según el código del clima
    let weatherClass = 'weather-sunny'; // default
    
    switch(main.toLowerCase()) {
        case 'clear':
            weatherClass = 'weather-sunny';
            break;
        case 'clouds':
            // Distinguir entre parcialmente nublado y nublado
            weatherClass = weatherCode >= 803 ? 'weather-cloudy' : 'weather-partly-cloudy';
            break;
        case 'rain':
        case 'drizzle':
            weatherClass = 'weather-rainy';
            document.body.classList.add('rain-effect');
            break;
        case 'thunderstorm':
            weatherClass = 'weather-stormy';
            break;
        case 'snow':
            weatherClass = 'weather-snowy';
            document.body.classList.add('snow-effect');
            break;
        case 'mist':
        case 'fog':
        case 'haze':
            weatherClass = 'weather-foggy';
            break;
    }
    
    // Aplicar la clase con una transición suave
    setTimeout(() => {
        document.body.classList.add(weatherClass);
    }, 100);
}

// ========================================================================
// FUNCIONES PRINCIPALES
// ========================================================================

/**
 * Carga todos los datos del clima
 */
async function loadWeatherData() {
    try {
        // Obtener ubicación
        const coords = await getCurrentLocation();
        
        // Obtener datos del clima actual y pronóstico
        const [weatherData, forecastData] = await Promise.all([
            getCurrentWeather(coords.lat, coords.lon),
            getForecast(coords.lat, coords.lon)
        ]);

        // Guardar en el estado
        appState.weatherData = weatherData;
        appState.forecastData = forecastData;
        appState.lastUpdate = Date.now();

        // Renderizar datos
        updateLocation(weatherData);
        renderCurrentWeather(weatherData);
        renderAdditionalInfo(weatherData);
        renderForecast(forecastData);
        
        // Aplicar efectos visuales
        applyWeatherEffects(weatherData.weather[0].id, weatherData.weather[0].main);

        // Mostrar contenido principal
        showMainContent();

        console.log('✅ Datos del clima cargados exitosamente');

    } catch (error) {
        console.error('❌ Error cargando datos del clima:', error);
        showError(error.message);
    }
}

/**
 * Inicializa la aplicación
 */
async function initApp() {
    console.log('🚀 Inicializando Clima Minimalista...');
    
    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Cargar datos del clima
    await loadWeatherData();
}

// ========================================================================
// EVENT LISTENERS
// ========================================================================

// Event Listener para el botón de reintentar
elements.retryButton.addEventListener('click', () => {
    hideError();
    elements.loadingScreen.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
    loadWeatherData();
});

// Event Listener para refresh manual (opcional)
document.addEventListener('keydown', (event) => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        location.reload();
    }
});

// ========================================================================
// INICIALIZACIÓN
// ========================================================================

// Iniciar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initApp);

// Manejo de errores globales
window.addEventListener('error', (event) => {
    console.error('❌ Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rechazada:', event.reason);
});

// ========================================================================
// FUNCIONES DE DESARROLLO (Temporal para testing)
// ========================================================================

/**
 * Función temporal para testing sin API key
 */
function loadMockData() {
    console.log('⚠️ Cargando datos de prueba (sin API)');
    
    const mockWeatherData = {
        name: 'Madrid',
        sys: { country: 'ES' },
        main: {
            temp: 24,
            feels_like: 26,
            humidity: 65
        },
        weather: [{
            id: 800,
            main: 'Clear',
            description: 'cielo despejado',
            icon: '01d'
        }],
        wind: { speed: 3.2 }
    };

    setTimeout(() => {
        updateLocation(mockWeatherData);
        renderCurrentWeather(mockWeatherData);
        renderAdditionalInfo(mockWeatherData);
        renderForecast({ list: [] });
        showMainContent();
    }, 2000);
}

// Testing con datos de prueba (descomenta para probar sin API):
document.addEventListener('DOMContentLoaded', loadMockData);
