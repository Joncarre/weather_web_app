/**
 * CLIMA MINIMALISTA - JavaScript Core
 * Aplicación del clima responsive y optimizada para personas mayores
 */

// ========================================================================
// CONFIGURACIÓN Y CONSTANTES
// ========================================================================

// ========================================================================
// CONFIGURACIÓN Y CONSTANTES MEJORADAS
// ========================================================================

// ========================================================================
// CONFIGURACIÓN Y CONSTANTES MEJORADAS
// ========================================================================

// Usar configuración externa si está disponible, sino usar defaults
const CONFIG = typeof APP_CONFIG !== 'undefined' ? {
    API_KEY: APP_CONFIG.API_KEY,
    BASE_URL: APP_CONFIG.BASE_URL,
    UNITS: APP_CONFIG.UNITS,
    LANG: APP_CONFIG.LANG,
    DEFAULT_CITY: APP_CONFIG.DEFAULT_CITY,
    
    // Configuración de caché
    CACHE_DURATION: APP_CONFIG.CACHE_DURATION || 10 * 60 * 1000,
    
    // Configuración de geolocalización
    GEO_OPTIONS: APP_CONFIG.GEO_OPTIONS || {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000
    },
    
    // Rate limiting
    MIN_REQUEST_INTERVAL: APP_CONFIG.MIN_REQUEST_INTERVAL || 1000,
    
    // Retry configuration
    MAX_RETRIES: APP_CONFIG.MAX_RETRIES || 3,
    RETRY_DELAY: APP_CONFIG.RETRY_DELAY || 2000
} : {
    // Fallback configuration
    API_KEY: 'TU_API_KEY_AQUI',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric',
    LANG: 'es',
    DEFAULT_CITY: 'Madrid',
    CACHE_DURATION: 10 * 60 * 1000,
    GEO_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000
    },
    MIN_REQUEST_INTERVAL: 1000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
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
// ESTADO GLOBAL DE LA APLICACIÓN MEJORADO
// ========================================================================

const appState = {
    currentLocation: null,
    weatherData: null,
    forecastData: null,
    lastUpdate: null,
    isLoading: false,
    hasError: false,
    retryCount: 0,
    
    // Cache simple
    cache: new Map(),
    
    // Rate limiting
    lastRequestTime: 0,
    
    // Tema automático
    currentTheme: 'light',
    sunriseTime: null,
    sunsetTime: null
};

// ========================================================================
// FUNCIONES DE UTILIDAD MEJORADAS
// ========================================================================

/**
 * Genera una clave de caché para las requests
 */
function getCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params).sort().map(key => `${key}:${params[key]}`).join('|');
    return `${endpoint}|${sortedParams}`;
}

/**
 * Verifica si los datos en caché siguen siendo válidos
 */
function isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return (Date.now() - cacheEntry.timestamp) < CONFIG.CACHE_DURATION;
}

/**
 * Implementa rate limiting para las requests
 */
function shouldWaitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - appState.lastRequestTime;
    return timeSinceLastRequest < CONFIG.MIN_REQUEST_INTERVAL;
}

/**
 * Espera el tiempo necesario para respetar rate limiting
 */
async function waitForRateLimit() {
    if (shouldWaitForRateLimit()) {
        const waitTime = CONFIG.MIN_REQUEST_INTERVAL - (Date.now() - appState.lastRequestTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    appState.lastRequestTime = Date.now();
}

/**
 * Muestra un mensaje de error mejorado al usuario
 */
function showError(message, isRetryable = true) {
    console.error('❌ Error:', message);
    appState.hasError = true;
    appState.isLoading = false;
    
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.remove('hidden');
    elements.loadingScreen.classList.add('hidden');
    
    // Mostrar/ocultar botón de retry
    if (isRetryable && appState.retryCount < CONFIG.MAX_RETRIES) {
        elements.retryButton.style.display = 'block';
    } else {
        elements.retryButton.style.display = 'none';
        elements.errorMessage.textContent += ' Por favor, recarga la página.';
    }
}

/**
 * Oculta el modal de error y resetea el estado
 */
function hideError() {
    elements.errorModal.classList.add('hidden');
    appState.hasError = false;
}

/**
 * Actualiza el estado de carga con mensaje personalizado
 */
function updateLoadingState(message = 'Obteniendo tu clima...') {
    appState.isLoading = true;
    elements.loadingScreen.querySelector('p').textContent = message;
}

// ========================================================================
// SISTEMA DE TEMA AUTOMÁTICO
// ========================================================================

/**
 * Aplica un tema (light o dark) al documento
 */
function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }
    
    appState.currentTheme = theme;
    console.log(`🎨 Tema aplicado automáticamente: ${theme}`);
}

/**
 * Determina si debe ser modo oscuro basado en la hora actual y datos de sol
 */
function shouldUseDarkMode() {
    if (!appState.sunriseTime || !appState.sunsetTime) {
        // Fallback: usar horario básico si no hay datos de sol
        const hour = new Date().getHours();
        return hour < 6 || hour >= 19; // 7 PM - 6 AM
    }
    
    const now = Date.now() / 1000; // Convertir a timestamp Unix
    
    // Si es después del ocaso o antes del amanecer, usar modo oscuro
    return now > appState.sunsetTime || now < appState.sunriseTime;
}

/**
 * Actualiza el tema automáticamente basado en la hora
 */
function updateThemeBasedOnTime() {
    const shouldBeDark = shouldUseDarkMode();
    const newTheme = shouldBeDark ? 'dark' : 'light';
    
    if (newTheme !== appState.currentTheme) {
        console.log(`⏰ Cambio automático de tema: ${appState.currentTheme} → ${newTheme}`);
        applyTheme(newTheme);
    }
}

/**
 * Extrae los datos de amanecer y ocaso de la respuesta de la API
 */
function extractSunTimes(weatherData) {
    if (weatherData.sys && weatherData.sys.sunrise && weatherData.sys.sunset) {
        appState.sunriseTime = weatherData.sys.sunrise;
        appState.sunsetTime = weatherData.sys.sunset;
        
        // Formatear horas para debug
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('es-ES');
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('es-ES');
        
        console.log(`🌅 Amanecer: ${sunrise}`);
        console.log(`🌇 Ocaso: ${sunset}`);
        
        return true;
    }
    return false;
}

/**
 * Inicializa el sistema de tema automático
 */
function initThemeSystem() {
    // Aplicar tema inicial basado en la hora actual
    updateThemeBasedOnTime();
    
    // Actualizar tema automáticamente cada minuto
    setInterval(updateThemeBasedOnTime, 60000);
    
    console.log('🎨 Sistema de tema automático inicializado');
    console.log('🌅 El tema cambiará automáticamente con el amanecer y ocaso');
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
 * Capitaliza solo la primera letra de una frase completa
 */
function capitalize(str) {
    if (!str) return '';
    // Convertir todo a minúsculas primero, luego capitalizar solo la primera letra
    return str.toLowerCase().charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

/**
 * Calcula el porcentaje de precipitación basado en los datos del clima
 */
function getPrecipitationChance(data) {
    // Si hay datos de lluvia o nieve actuales
    let precipitationMm = 0;
    
    // Lluvia en la última hora
    if (data.rain && data.rain['1h']) {
        precipitationMm += data.rain['1h'];
    }
    
    // Nieve en la última hora
    if (data.snow && data.snow['1h']) {
        precipitationMm += data.snow['1h'];
    }
    
    // Si hay precipitación activa, mostrar cantidad
    if (precipitationMm > 0) {
        return `${precipitationMm.toFixed(1)} mm/h`;
    }
    
    // Calcular probabilidad basada en humedad y tipo de clima
    const humidity = data.main.humidity;
    const weatherMain = data.weather[0].main.toLowerCase();
    
    let chance = 0;
    
    switch (weatherMain) {
        case 'rain':
        case 'drizzle':
            chance = Math.min(90 + (humidity - 70), 95);
            break;
        case 'snow':
            chance = Math.min(85 + (humidity - 65), 95);
            break;
        case 'thunderstorm':
            chance = Math.min(95 + (humidity - 75), 98);
            break;
        case 'clouds':
            if (humidity > 80) chance = Math.min(30 + (humidity - 80) * 2, 70);
            else if (humidity > 60) chance = Math.min(10 + (humidity - 60), 30);
            break;
        case 'clear':
            if (humidity > 90) chance = 15;
            else if (humidity > 80) chance = 5;
            break;
        default:
            chance = Math.max(0, (humidity - 70) / 2);
    }
    
    return `${Math.round(Math.max(0, chance))}%`;
}

/**
 * Obtiene el índice UV (requiere una llamada adicional a la API)
 */
async function getUVIndex(lat, lon) {
    try {
        await waitForRateLimit();
        
        const response = await fetch(
            `${CONFIG.BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`
        );
        
        if (!response.ok) {
            console.warn('⚠️ No se pudo obtener datos UV');
            return null;
        }
        
        const uvData = await response.json();
        return uvData.value || null;
    } catch (error) {
        console.warn('⚠️ Error obteniendo UV index:', error);
        return null;
    }
}

/**
 * Obtiene datos de clima ampliados incluyendo UV
 */
async function getCurrentWeatherExtended(lat, lon) {
    updateLoadingState('🌡️ Obteniendo temperatura actual...');
    
    // Obtener datos básicos del clima
    const weatherData = await apiCall('weather', { 
        lat: lat.toFixed(6), 
        lon: lon.toFixed(6) 
    });
    
    // Validar datos recibidos
    if (!weatherData.main || !weatherData.weather || !weatherData.weather[0]) {
        throw new Error('📊 Datos del clima incompletos. Inténtalo de nuevo.');
    }
    
    // Intentar obtener índice UV por separado
    try {
        updateLoadingState('☀️ Obteniendo índice UV...');
        const uvIndex = await getUVIndex(lat, lon);
        if (uvIndex !== null) {
            weatherData.uvi = uvIndex;
        }
    } catch (error) {
        console.warn('⚠️ UV index no disponible:', error);
        // Continuar sin UV index
    }
    
    return weatherData;
}

// ========================================================================
// GEOLOCALIZACIÓN MEJORADA
// ========================================================================

/**
 * Obtiene la ubicación del usuario con retry y mejor manejo de errores
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('❌ La geolocalización no está soportada en este navegador. Usa un navegador moderno.'));
            return;
        }

        updateLoadingState('📍 Detectando tu ubicación...');

        // Función de éxito
        const onSuccess = (position) => {
            const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            appState.currentLocation = coords;
            console.log('✅ Ubicación obtenida:', coords);
            resolve(coords);
        };

        // Función de error mejorada
        const onError = (error) => {
            console.error('❌ Error de geolocalización:', error);
            let message = 'No se pudo obtener tu ubicación. ';
            let isRetryable = true;
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Permite el acceso a la ubicación en tu navegador y recarga la página.';
                    isRetryable = false;
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Tu ubicación no está disponible. Verifica tu GPS o conexión.';
                    break;
                case error.TIMEOUT:
                    message += 'Se agotó el tiempo de espera. Inténtalo de nuevo.';
                    break;
                default:
                    message += 'Error desconocido al obtener la ubicación.';
                    break;
            }
            
            // Fallback a ubicación por defecto si está disponible
            if (error.code === error.PERMISSION_DENIED) {
                message += ` Mostrando clima de ${CONFIG.DEFAULT_CITY}.`;
                getLocationFromCity(CONFIG.DEFAULT_CITY)
                    .then(coords => resolve(coords))
                    .catch(() => reject(new Error(message)));
            } else {
                reject(new Error(message));
            }
        };

        // Hacer la request de geolocalización
        navigator.geolocation.getCurrentPosition(onSuccess, onError, CONFIG.GEO_OPTIONS);
    });
}

/**
 * Obtiene coordenadas a partir del nombre de una ciudad (fallback)
 */
async function getLocationFromCity(cityName) {
    try {
        await waitForRateLimit();
        
        const response = await fetch(
            `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`
        );
        
        if (!response.ok) {
            throw new Error(`Error al obtener datos de ${cityName}`);
        }
        
        const data = await response.json();
        return {
            lat: data.coord.lat,
            lon: data.coord.lon,
            fromCity: true
        };
    } catch (error) {
        throw new Error(`No se pudo obtener la ubicación de ${cityName}: ${error.message}`);
    }
}

/**
 * Verifica si el usuario ha cambiado de ubicación significativamente
 */
function hasLocationChanged(newCoords, oldCoords, threshold = 0.01) {
    if (!oldCoords) return true;
    
    const latDiff = Math.abs(newCoords.lat - oldCoords.lat);
    const lonDiff = Math.abs(newCoords.lon - oldCoords.lon);
    
    return latDiff > threshold || lonDiff > threshold;
}

// ========================================================================
// API DEL CLIMA MEJORADA CON CACHE Y RETRY
// ========================================================================

/**
 * Realiza una llamada a la API con cache, retry y rate limiting
 */
async function apiCall(endpoint, params = {}, useCache = true) {
    // Verificar API key
    if (!CONFIG.API_KEY || CONFIG.API_KEY === 'TU_API_KEY_AQUI') {
        throw new Error('⚠️ API Key no configurada. Ve a script.js línea 17 y añade tu clave de OpenWeatherMap.\n\nPuedes obtener una gratis en: https://openweathermap.org/api');
    }

    // Verificar caché
    const cacheKey = getCacheKey(endpoint, params);
    if (useCache && isCacheValid(appState.cache.get(cacheKey))) {
        console.log('📦 Usando datos en caché para:', endpoint);
        return appState.cache.get(cacheKey).data;
    }

    // Rate limiting
    await waitForRateLimit();

    const url = new URL(`${CONFIG.BASE_URL}/${endpoint}`);
    url.searchParams.append('appid', CONFIG.API_KEY);
    url.searchParams.append('units', CONFIG.UNITS);
    url.searchParams.append('lang', CONFIG.LANG);
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    let lastError;

    // Implementar retry logic
    for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`🌐 API Request (intento ${attempt + 1}/${CONFIG.MAX_RETRIES + 1}):`, url.toString());
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // Timeout personalizado
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 401) {
                    throw new Error('🔑 API Key inválida o expirada. Verifica tu clave de OpenWeatherMap.');
                } else if (response.status === 404) {
                    throw new Error('📍 Ubicación no encontrada. Inténtalo con otra ubicación.');
                } else if (response.status === 429) {
                    throw new Error('⏳ Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.');
                } else if (response.status >= 500) {
                    throw new Error(`🔧 Error del servidor de OpenWeatherMap (${response.status}). Inténtalo más tarde.`);
                } else {
                    throw new Error(`❌ Error de API: ${response.status} - ${errorData.message || 'Error desconocido'}`);
                }
            }
            
            const data = await response.json();
            
            // Guardar en caché
            appState.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            console.log('✅ Datos obtenidos exitosamente:', endpoint);
            return data;
            
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Intento ${attempt + 1} falló:`, error.message);
            
            // Si es el último intento, lanzar el error
            if (attempt === CONFIG.MAX_RETRIES) {
                break;
            }
            
            // Esperar antes del próximo intento
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (attempt + 1)));
        }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    if (lastError.name === 'AbortError') {
        throw new Error('⏱️ Conexión muy lenta. Verifica tu internet e inténtalo de nuevo.');
    } else if (lastError instanceof TypeError) {
        throw new Error('🌐 Sin conexión a internet. Verifica tu conectividad.');
    } else {
        throw lastError;
    }
}

/**
 * Obtiene los datos del clima actual con validación mejorada
 */
async function getCurrentWeather(lat, lon) {
    updateLoadingState('🌡️ Obteniendo temperatura actual...');
    
    const data = await apiCall('weather', { 
        lat: lat.toFixed(6), 
        lon: lon.toFixed(6) 
    });
    
    // Validar datos recibidos
    if (!data.main || !data.weather || !data.weather[0]) {
        throw new Error('📊 Datos del clima incompletos. Inténtalo de nuevo.');
    }
    
    return data;
}

/**
 * Obtiene el pronóstico de 5 días con validación
 */
async function getForecast(lat, lon) {
    updateLoadingState('📅 Obteniendo pronóstico...');
    
    const data = await apiCall('forecast', { 
        lat: lat.toFixed(6), 
        lon: lon.toFixed(6) 
    });
    
    // Validar datos recibidos
    if (!data.list || data.list.length === 0) {
        throw new Error('📊 Datos del pronóstico incompletos. Inténtalo de nuevo.');
    }
    
    return data;
}

/**
 * Limpia el cache antiguo para evitar memory leaks
 */
function cleanupCache() {
    const now = Date.now();
    for (const [key, value] of appState.cache.entries()) {
        if (now - value.timestamp > CONFIG.CACHE_DURATION) {
            appState.cache.delete(key);
        }
    }
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
    // Extraer datos de amanecer y ocaso para el sistema de tema
    extractSunTimes(data);
    
    // Actualizar tema basado en los nuevos datos de sol
    updateThemeBasedOnTime();
    
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

    // Inicializar y activar efectos de clima
    initializeWeatherEffects(data.weather[0].description);
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
            icon: '☀️',
            label: 'Índice UV',
            value: data.uvi ? Math.round(data.uvi) : 'N/A',
            lucideIcon: 'sun'
        },
        {
            icon: '🌧️',
            label: 'Precipitación',
            value: getPrecipitationChance(data),
            lucideIcon: 'cloud-rain'
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
    if (!data.list || data.list.length === 0) {
        elements.forecastContainer.innerHTML = `
            <div class="text-center text-slate-600 py-8">
                <div class="text-4xl mb-2">📅</div>
                <p>No hay datos de pronóstico disponibles</p>
            </div>
        `;
        return;
    }
    
    // Mapeo de iconos
    const iconMap = {
        'cielo claro': '☀️',
        'algo nuboso': '⛅',
        'nubes dispersas': '☁️',
        'nubes': '☁️',
        'muy nuboso': '☁️',
        'lluvia ligera': '🌦️',
        'lluvia': '🌧️',
        'lluvia intensa': '🌧️',
        'tormenta': '⛈️',
        'nieve': '🌨️',
        'niebla': '🌫️',
        'default': '☀️'
    };
    
    // Procesar datos por días - agrupar para obtener máximas y mínimas reales
    const dailyData = [];
    const dailyMap = new Map();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                date: date,
                temps: [],
                precipitation: [],
                weather: item.weather[0],
                icon: iconMap[item.weather[0].description] || iconMap['default']
            });
        }
        
        const dayData = dailyMap.get(dateKey);
        dayData.temps.push(item.main.temp);
        dayData.precipitation.push(item.pop * 100);
        
        // Usar el icono del mediodía si está disponible (12:00)
        const hour = date.getHours();
        if (hour >= 11 && hour <= 13) {
            dayData.weather = item.weather[0];
            dayData.icon = iconMap[item.weather[0].description] || iconMap['default'];
        }
    });
    
    // Convertir a array y calcular estadísticas reales
    const processedDaily = Array.from(dailyMap.values()).slice(0, 7).map(day => ({
        date: day.date,
        tempMax: Math.round(Math.max(...day.temps)),
        tempMin: Math.round(Math.min(...day.temps)),
        weather: day.weather,
        icon: day.icon,
        precipitation: Math.round(day.precipitation.reduce((a, b) => a + b, 0) / day.precipitation.length)
    }));
    
    const today = new Date();
    
    elements.forecastContainer.innerHTML = processedDaily.map((dayData, index) => {
        const date = dayData.date;
        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
        let dayLabel;
        if (isToday) dayLabel = 'Hoy';
        else if (isTomorrow) dayLabel = 'Mañana';
        else dayLabel = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
        
        const tempMax = dayData.tempMax;
        const tempMin = dayData.tempMin;
        const icon = dayData.icon;
        const precipitation = dayData.precipitation;
        
        return `
            <div class="forecast-day-card min-w-28 p-3 text-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                <div class="text-xs font-semibold text-slate-600 mb-2">${dayLabel.toUpperCase()}</div>
                <div class="text-2xl mb-2">${icon}</div>
                <div class="space-y-1">
                    <div class="font-bold text-slate-800">${tempMax}°</div>
                    <div class="text-sm text-slate-500">${tempMin}°</div>
                    <div class="text-xs text-blue-600 flex items-center justify-center gap-1">
                        <i data-lucide="cloud-rain" class="w-3 h-3"></i>
                        <span>${precipitation}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Recrear iconos después de actualizar el DOM
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Guardar datos del pronóstico en localStorage para la página de gráficas
    try {
        localStorage.setItem('forecastData', JSON.stringify(data));
        console.log('📊 Datos del pronóstico guardados en localStorage');
    } catch (error) {
        console.warn('⚠️ Error guardando datos del pronóstico:', error);
    }
    
    // NO añadir evento de click al contenedor - solo mostrar información
    const forecastSection = document.getElementById('forecast');
    if (forecastSection && !forecastSection.hasAttribute('data-info-updated')) {
        // Solo actualizar el título sin hacer clickeable
        const title = forecastSection.querySelector('.title-section');
        if (title) {
            title.innerHTML = `Próximos 7 días`;
            lucide.createIcons();
        }
        forecastSection.setAttribute('data-info-updated', 'true');
    }
}

/**
 * Función para ir a la página de gráfica desde la página principal
 */
function goToForecastChart() {
    // Obtener los datos actuales del clima y pronóstico
    const weatherData = localStorage.getItem('weatherData');
    const forecastData = localStorage.getItem('forecastData');
    
    if (weatherData) {
        // Guardar datos para la página de pronóstico
        localStorage.setItem('chartData', forecastData || weatherData);
        localStorage.setItem('forecastData', forecastData || weatherData);
        
        console.log('📊 Navegando a página de pronóstico con datos guardados');
        // Navegar a la página de pronóstico extendido
        window.location.href = 'forecast.html';
    } else {
        // Si no hay datos, mostrar mensaje de error
        console.error('❌ No hay datos disponibles para mostrar el pronóstico');
        alert('Primero necesitamos cargar los datos del clima. Por favor espera un momento.');
    }
}

// ========================================================================
// APLICACIÓN DE EFECTOS VISUALES
// ========================================================================

/**
 * Aplica efectos visuales mejorados según el clima con prioridad
 */
function applyWeatherEffects(weatherCode, main, weatherData) {
    // Remover todas las clases de clima anteriores
    const weatherClasses = [
        'weather-sunny', 'weather-partly-cloudy', 'weather-cloudy', 
        'weather-rainy', 'weather-stormy', 'weather-snowy', 
        'weather-foggy', 'weather-sunset'
    ];
    
    document.body.classList.remove(...weatherClasses, 'rain-effect', 'snow-effect');
    
    // Determinar el efecto basado en prioridad
    let weatherClass = 'weather-sunny'; // default
    let shouldApplyEffect = false;
    let effectDescription = '';
    
    const mainWeather = main.toLowerCase();
    const windSpeed = weatherData && weatherData.wind ? (weatherData.wind.speed * 3.6) : 0; // Convertir m/s a km/h
    
    // Prioridad 1: Nieve (máxima prioridad)
    if (mainWeather === 'snow') {
        weatherClass = 'weather-snowy';
        shouldApplyEffect = true;
        effectDescription = 'nieve';
        document.body.classList.add('snow-effect');
    }
    // Prioridad 2: Tormenta
    else if (mainWeather === 'thunderstorm') {
        weatherClass = 'weather-stormy';
        shouldApplyEffect = true;
        effectDescription = 'tormenta';
    }
    // Prioridad 3: Lluvia
    else if (mainWeather === 'rain' || mainWeather === 'drizzle') {
        weatherClass = 'weather-rainy';
        shouldApplyEffect = true;
        effectDescription = 'lluvia';
        document.body.classList.add('rain-effect');
    }
    // Prioridad 4: Viento (solo si > 30 km/h)
    else if (windSpeed > 30) {
        weatherClass = 'weather-cloudy'; // Mantener fondo base
        shouldApplyEffect = true;
        effectDescription = `viento fuerte (${Math.round(windSpeed)} km/h)`;
    }
    // Otros casos: no aplicar efectos especiales
    else {
        switch(mainWeather) {
            case 'clear':
                weatherClass = 'weather-sunny';
                break;
            case 'clouds':
                weatherClass = weatherCode >= 803 ? 'weather-cloudy' : 'weather-partly-cloudy';
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                weatherClass = 'weather-foggy';
                break;
        }
    }
    
    // Aplicar efectos de partículas si corresponde
    if (shouldApplyEffect && window.simpleWeatherEffects) {
        try {
            // Convertir tipo para el sistema de efectos
            let effectType = '';
            if (mainWeather === 'snow') effectType = 'snow';
            else if (mainWeather === 'thunderstorm') effectType = 'thunderstorm';
            else if (mainWeather === 'rain' || mainWeather === 'drizzle') effectType = 'rain';
            else if (windSpeed > 30) effectType = 'wind';
            
            window.simpleWeatherEffects.showEffect(effectType);
            console.log(`🌦️ Aplicando efecto: ${effectDescription}`);
        } catch (error) {
            console.warn('⚠️ Error aplicando efecto visual:', error);
        }
    }
    
    // Aplicar la clase con una transición suave
    setTimeout(() => {
        document.body.classList.add(weatherClass);
    }, 100);
}

// ========================================================================
// FUNCIONES PRINCIPALES MEJORADAS
// ========================================================================

/**
 * Carga todos los datos del clima con mejor manejo de errores
 */
async function loadWeatherData(forceRefresh = false) {
    try {
        // Evitar múltiples requests simultáneas
        if (appState.isLoading && !forceRefresh) {
            console.log('⚠️ Ya hay una carga en progreso...');
            return;
        }

        appState.isLoading = true;
        appState.hasError = false;
        
        // Limpiar cache antiguo
        cleanupCache();

        // Obtener ubicación
        updateLoadingState('📍 Obteniendo tu ubicación...');
        const coords = await getCurrentLocation();
        
        // Verificar si necesitamos actualizar los datos
        const needsUpdate = forceRefresh || 
                           hasLocationChanged(coords, appState.currentLocation) ||
                           !appState.lastUpdate || 
                           (Date.now() - appState.lastUpdate) > CONFIG.CACHE_DURATION;

        if (!needsUpdate && appState.weatherData && appState.forecastData) {
            console.log('📦 Usando datos existentes (no hay cambios significativos)');
            showMainContent();
            return;
        }

        // Obtener datos del clima actual y pronóstico en paralelo
        updateLoadingState('🌡️ Cargando datos del clima...');
        const [weatherData, forecastData] = await Promise.all([
            getCurrentWeatherExtended(coords.lat, coords.lon),
            getForecast(coords.lat, coords.lon)
        ]);

        // Guardar en el estado
        appState.weatherData = weatherData;
        appState.forecastData = forecastData;
        appState.lastUpdate = Date.now();
        appState.retryCount = 0; // Reset retry count on success

        console.log('✅ Todos los datos cargados:', { weatherData, forecastData });

        // Renderizar datos con animación
        updateLoadingState('🎨 Preparando la interfaz...');
        await renderAllData(weatherData, forecastData);

        // Mostrar contenido principal
        showMainContent();

        console.log('🎉 ¡Aplicación cargada exitosamente!');

    } catch (error) {
        console.error('❌ Error cargando datos del clima:', error);
        appState.retryCount++;
        showError(error.message, appState.retryCount < CONFIG.MAX_RETRIES);
    } finally {
        appState.isLoading = false;
    }
}

/**
 * Renderiza todos los datos con orden específico
 */
async function renderAllData(weatherData, forecastData) {
    // Renderizar en orden para mejor UX
    updateLocation(weatherData);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    renderCurrentWeather(weatherData);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    renderAdditionalInfo(weatherData);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    renderForecast(forecastData);
    
    // Actualizar modo oscuro basado en horario solar
    updateDarkModeBasedOnSunTimes(weatherData);
    
    // Aplicar efectos visuales al final
    applyWeatherEffects(weatherData.weather[0].id, weatherData.weather[0].main, weatherData);
}

/**
 * Actualiza los datos si han pasado más de X minutos
 */
async function refreshIfNeeded() {
    if (!appState.lastUpdate || (Date.now() - appState.lastUpdate) > CONFIG.CACHE_DURATION) {
        console.log('🔄 Actualizando datos automáticamente...');
        await loadWeatherData(true);
    }
}

/**
 * Inicializa la aplicación con mejor manejo de estados
 */
async function initApp() {
    console.log('🚀 Inicializando Clima Minimalista v2.0...');
    
    // Verificar compatibilidad del navegador
    if (!window.fetch) {
        showError('❌ Tu navegador no es compatible. Usa un navegador moderno como Chrome, Firefox o Safari.', false);
        return;
    }
    
    // Inicializar sistema de tema automático
    initThemeSystem();
    
    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('✅ Iconos de Lucide inicializados');
    } else {
        console.warn('⚠️ Lucide Icons no disponible');
    }
    
    // Cargar datos del clima
    await loadWeatherData();
    
    // Configurar auto-refresh cada 10 minutos
    setInterval(refreshIfNeeded, CONFIG.CACHE_DURATION);
}

// ========================================================================
// EVENT LISTENERS MEJORADOS
// ========================================================================

// Event Listener para el botón de reintentar
elements.retryButton.addEventListener('click', async () => {
    console.log('🔄 Reintentando cargar datos...');
    hideError();
    elements.loadingScreen.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
    
    // Esperar un poco para mostrar el loading
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadWeatherData(true);
});

// Event Listener para refresh manual con teclado
document.addEventListener('keydown', async (event) => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        console.log('⌨️ Refresh manual detectado');
        
        if (!appState.isLoading) {
            elements.loadingScreen.classList.remove('hidden');
            elements.mainContent.classList.add('hidden');
            await new Promise(resolve => setTimeout(resolve, 300));
            await loadWeatherData(true);
        }
    }
});

// Event listener para detectar cambios de conectividad
window.addEventListener('online', async () => {
    console.log('🌐 Conexión restaurada');
    if (appState.hasError) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadWeatherData(true);
    }
});

window.addEventListener('offline', () => {
    console.log('📡 Conexión perdida');
    showError('🌐 Sin conexión a internet. Los datos mostrados pueden no estar actualizados.', true);
});

// Event listener para visibilidad de la página (actualizar cuando vuelve el usuario)
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && !appState.isLoading) {
        // Si el usuario vuelve después de más de 10 minutos, actualizar
        if (appState.lastUpdate && (Date.now() - appState.lastUpdate) > CONFIG.CACHE_DURATION) {
            console.log('👁️ Usuario regresó - actualizando datos...');
            await loadWeatherData(true);
        }
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
            id: 803,
            main: 'Clouds',
            description: 'algo de nubes',
            icon: '03d'
        }],
        wind: { speed: 3.2 },
        uvi: 6.5, // Índice UV de prueba
        rain: null, // Sin lluvia actualmente
        snow: null  // Sin nieve actualmente
    };

    setTimeout(() => {
        updateLocation(mockWeatherData);
        renderCurrentWeather(mockWeatherData);
        renderAdditionalInfo(mockWeatherData);
        renderForecast({ list: [] });
        showMainContent();
    }, 2000);
}

// ========================================================================
// INTEGRACIÓN DE EFECTOS DE CLIMA
// ========================================================================

/**
 * Inicializa los efectos de clima
 */
async function initializeWeatherEffects(weatherCondition) {
    try {
        // Inicializar los efectos si no están inicializados
        if (window.weatherEffects && !window.weatherEffects.isInitialized) {
            await window.weatherEffects.init();
        }
        
        // Cambiar a los efectos correspondientes
        if (window.weatherEffects && window.weatherEffects.isInitialized) {
            window.weatherEffects.changeWeather(weatherCondition);
        }
    } catch (error) {
        console.warn('No se pudieron inicializar los efectos de clima:', error);
    }
}

/**
 * Función para probar los efectos de clima (temporal)
 */
window.testWeatherEffect = async function(weatherType) {
    try {
        console.log('🎯 Iniciando prueba de efecto:', weatherType);
        
        // Probar primero con efectos simplificados
        if (window.simpleWeatherEffects) {
            if (!window.simpleWeatherEffects.isInitialized) {
                console.log('🔄 Inicializando Simple Weather Effects...');
                await window.simpleWeatherEffects.init();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (window.simpleWeatherEffects.isInitialized) {
                console.log('🌤️ Aplicando efecto simple:', weatherType);
                window.simpleWeatherEffects.changeWeather(weatherType);
                
                // Feedback visual
                const button = event?.target;
                if (button) {
                    const originalText = button.textContent;
                    button.textContent = '✅ ' + originalText.substring(2);
                    button.style.background = '#10B981';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.background = '';
                    }, 1500);
                }
                return;
            }
        }
        
        // Fallback a efectos originales
        console.log('📋 Verificando elementos DOM...');
        const card = document.getElementById('current-weather');
        console.log('Card encontrado:', !!card);
        
        if (!window.weatherEffects) {
            console.warn('⚠️ WeatherEffects no está disponible');
            return;
        }
        
        // Inicializar efectos originales si es necesario
        if (!window.weatherEffects.isInitialized) {
            console.log('🔄 Inicializando WeatherEffects...');
            await window.weatherEffects.init();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Cambiar efectos
        if (window.weatherEffects.isInitialized) {
            console.log('🌤️ Cambiando a efecto:', weatherType);
            window.weatherEffects.changeWeather(weatherType);
        }
        
    } catch (error) {
        console.error('💥 Error al probar efectos:', error);
        
        // Mostrar error al usuario
        const button = event?.target;
        if (button) {
            const originalText = button.textContent;
            button.textContent = '❌ Error';
            button.style.background = '#EF4444';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }
    }
};

/**
 * Inicializar efectos manualmente (para debug)
 */
window.initWeatherEffectsManually = async function() {
    try {
        console.log('🔧 Inicializando efectos manualmente...');
        
        // Probar efectos simplificados primero
        if (window.simpleWeatherEffects) {
            await window.simpleWeatherEffects.init();
            console.log('✅ Efectos simplificados inicializados');
        }
        
        // También inicializar efectos complejos
        if (window.weatherEffects) {
            await window.weatherEffects.init();
            console.log('✅ Efectos complejos inicializados');
        }
        
    } catch (error) {
        console.error('💥 Error inicializando efectos:', error);
    }
};

/**
 * Mostrar información de debug
 */
window.showDebugInfo = function() {
    const info = {
        simpleEffects: {
            available: !!window.simpleWeatherEffects,
            initialized: window.simpleWeatherEffects?.isInitialized || false,
            currentWeather: window.simpleWeatherEffects?.currentWeather?.type || 'none'
        },
        weatherEffects: {
            available: !!window.weatherEffects,
            initialized: window.weatherEffects?.isInitialized || false,
            currentWeather: window.weatherEffects?.currentWeather?.type || 'none'
        },
        dependencies: {
            jQuery: typeof $ !== 'undefined',
            Snap: typeof Snap !== 'undefined',
            GSAP: typeof gsap !== 'undefined'
        },
        elements: {
            card: !!document.getElementById('current-weather'),
            outerSVG: !!document.getElementById('weather-effects-outer'),
            innerSVG: !!document.getElementById('weather-effects-inner'),
            canvas: !!document.getElementById('weather-canvas')
        }
    };
    
    console.table(info);
    console.log('📊 Información de debug completa:', info);
    alert('Info de debug mostrada en la consola (F12)');
};

// ========================================================================
// MODO OSCURO
// ========================================================================

/**
 * Estado del modo oscuro
 */
let isDarkMode = false;

/**
 * Alternar modo oscuro
 */
window.toggleDarkMode = function() {
    try {
        isDarkMode = !isDarkMode;
        const body = document.body;
        const button = document.getElementById('dark-mode-btn');
        
        if (isDarkMode) {
            // Activar modo oscuro
            body.classList.add('dark-mode');
            button.textContent = '☀️ Modo Claro';
            button.className = 'px-3 py-2 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors ml-2';
            
            // Actualizar efectos de clima para modo oscuro
            updateWeatherEffectsForDarkMode(true);
            
            console.log('🌙 Modo oscuro activado');
        } else {
            // Desactivar modo oscuro
            body.classList.remove('dark-mode');
            button.textContent = '🌙 Modo Oscuro';
            button.className = 'px-3 py-2 text-xs bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors ml-2';
            
            // Restaurar efectos de clima para modo claro
            updateWeatherEffectsForDarkMode(false);
            
            console.log('☀️ Modo claro activado');
        }
        
        // Guardar preferencia en localStorage
        localStorage.setItem('darkMode', isDarkMode.toString());
        
    } catch (error) {
        console.error('❌ Error al alternar modo oscuro:', error);
    }
};

/**
 * Actualizar colores de efectos de clima para modo oscuro
 */
function updateWeatherEffectsForDarkMode(darkMode) {
    if (!window.simpleWeatherEffects || !window.simpleWeatherEffects.currentWeather) return;
    
    // Re-aplicar el efecto actual para usar los colores correctos
    const currentWeatherType = window.simpleWeatherEffects.currentWeather.type;
    if (currentWeatherType) {
        // Esperar un poco para que las transiciones CSS se apliquen
        setTimeout(() => {
            window.simpleWeatherEffects.applyBackground();
        }, 100);
    }
}

/**
 * Inicializar modo oscuro basado en horario solar
 */
function initializeDarkMode() {
    try {
        // Verificar si hay datos de clima disponibles para obtener sunrise/sunset
        const lastWeatherData = JSON.parse(localStorage.getItem('weatherData') || 'null');
        
        if (lastWeatherData && lastWeatherData.sys && lastWeatherData.sys.sunrise && lastWeatherData.sys.sunset) {
            const now = Date.now() / 1000; // Timestamp actual en segundos
            const sunrise = lastWeatherData.sys.sunrise;
            const sunset = lastWeatherData.sys.sunset;
            
            // Activar modo oscuro si es de noche (después del ocaso o antes del amanecer)
            const shouldBeDark = now < sunrise || now > sunset;
            
            if (shouldBeDark && !isDarkMode) {
                toggleDarkMode();
                console.log('🌙 Modo oscuro activado automáticamente (es de noche)');
            } else if (!shouldBeDark && isDarkMode) {
                toggleDarkMode();
                console.log('☀️ Modo claro activado automáticamente (es de día)');
            }
        } else {
            // Fallback: usar preferencia guardada si no hay datos de clima
            const savedDarkMode = localStorage.getItem('darkMode');
            if (savedDarkMode === 'true' && !isDarkMode) {
                toggleDarkMode();
            }
        }
        
        console.log('🎨 Modo oscuro inicializado:', isDarkMode ? 'Activado' : 'Desactivado');
    } catch (error) {
        console.warn('⚠️ No se pudo cargar configuración de modo oscuro:', error);
    }
}

/**
 * Actualizar modo oscuro basado en horario solar cuando se obtienen nuevos datos
 */
function updateDarkModeBasedOnSunTimes(weatherData) {
    try {
        if (!weatherData || !weatherData.sys) return;
        
        const now = Date.now() / 1000;
        const sunrise = weatherData.sys.sunrise;
        const sunset = weatherData.sys.sunset;
        
        const shouldBeDark = now < sunrise || now > sunset;
        
        if (shouldBeDark && !isDarkMode) {
            toggleDarkMode();
            console.log('🌙 Cambiando a modo oscuro (ocaso)');
        } else if (!shouldBeDark && isDarkMode) {
            toggleDarkMode();
            console.log('☀️ Cambiando a modo claro (amanecer)');
        }
    } catch (error) {
        console.warn('⚠️ Error al actualizar modo oscuro automático:', error);
    }
}

// Inicializar modo oscuro cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeDarkMode);

// Testing con datos de prueba (comentado para usar API real):
// document.addEventListener('DOMContentLoaded', loadMockData);
