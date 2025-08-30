/**
 * PRONÓSTICO EXTENDIDO - JavaScript
 * Página dedicada para mostrar pronóstico de 7 días con gráficas
 */

// ========================================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ========================================================================

// Usar la misma configuración del archivo principal
const CONFIG = typeof APP_CONFIG !== 'undefined' ? {
    API_KEY: APP_CONFIG.API_KEY,
    BASE_URL: APP_CONFIG.BASE_URL,
    UNITS: APP_CONFIG.UNITS,
    LANG: APP_CONFIG.LANG,
    DEFAULT_CITY: APP_CONFIG.DEFAULT_CITY
} : {
    API_KEY: 'TU_API_KEY_AQUI',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric',
    LANG: 'es',
    DEFAULT_CITY: 'Madrid'
};

// Estado de la aplicación
let forecastData = null;
let isDarkMode = false;

// Mapeo de iconos del clima
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

// ========================================================================
// FUNCIONES DE INICIALIZACIÓN
// ========================================================================

/**
 * Inicializa la página de pronóstico
 */
async function initializeForecastPage() {
    try {
        console.log('🚀 Inicializando página de pronóstico extendido...');
        
        // Inicializar modo oscuro
        initializeDarkMode();
        
        // Obtener ubicación y datos
        const position = await getCurrentPosition();
        const data = await fetchExtendedForecast(position.coords.latitude, position.coords.longitude);
        
        // Renderizar contenido
        await renderForecastData(data);
        
        // Ocultar loading
        hideLoading();
        
        console.log('✅ Página de pronóstico inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando pronóstico:', error);
        showErrorMessage('No se pudieron cargar los datos del pronóstico');
    }
}

/**
 * Obtiene la posición actual del usuario
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5 * 60 * 1000
        });
    });
}

/**
 * Obtiene datos extendidos del pronóstico
 */
async function fetchExtendedForecast(lat, lon) {
    try {
        const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Datos de pronóstico obtenidos:', data);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error obteniendo pronóstico:', error);
        throw error;
    }
}

// ========================================================================
// FUNCIONES DE RENDERIZADO
// ========================================================================

/**
 * Renderiza todos los datos del pronóstico
 */
async function renderForecastData(data) {
    try {
        // Procesar datos por días
        const dailyData = processDailyData(data.list);
        
        // Actualizar ubicación
        updateLocationDisplay(data.city);
        
        // Renderizar cards diarias
        renderDailyCards(dailyData);
        
        // Renderizar información detallada
        renderDetailedInfo(dailyData);
        
        // Guardar datos globalmente y en localStorage para la gráfica
        forecastData = dailyData;
        localStorage.setItem('chartData', JSON.stringify(dailyData));
        
        console.log('📊 Datos del pronóstico guardados para gráfica');
        
    } catch (error) {
        console.error('❌ Error renderizando datos:', error);
        throw error;
    }
}

/**
 * Procesa los datos de la API en formato diario
 */
function processDailyData(forecastList) {
    const dailyMap = new Map();
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                date: date,
                temps: [],
                precipitation: [],
                wind: [],
                weather: item.weather[0],
                humidity: [],
                pressure: []
            });
        }
        
        const dayData = dailyMap.get(dateKey);
        dayData.temps.push(item.main.temp);
        dayData.precipitation.push(item.pop * 100);
        dayData.wind.push(item.wind.speed * 3.6); // Convertir a km/h
        dayData.humidity.push(item.main.humidity);
        dayData.pressure.push(item.main.pressure);
    });
    
    // Convertir a array y calcular estadísticas
    return Array.from(dailyMap.values()).slice(0, 7).map(day => ({
        date: day.date,
        tempMax: Math.round(Math.max(...day.temps)),
        tempMin: Math.round(Math.min(...day.temps)),
        tempAvg: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
        precipitationAvg: Math.round(day.precipitation.reduce((a, b) => a + b, 0) / day.precipitation.length),
        precipitationMax: Math.round(Math.max(...day.precipitation)),
        windAvg: Math.round(day.wind.reduce((a, b) => a + b, 0) / day.wind.length),
        windMax: Math.round(Math.max(...day.wind)),
        humidityAvg: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
        pressureAvg: Math.round(day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length),
        weather: day.weather,
        icon: iconMap[day.weather.description] || iconMap['default']
    }));
}

/**
 * Actualiza la información de ubicación
 */
function updateLocationDisplay(cityData) {
    const locationElement = document.getElementById('location-display');
    if (locationElement) {
        locationElement.innerHTML = `
            <i data-lucide="map-pin" class="w-4 h-4 inline mr-1"></i>
            <span>${cityData.name}, ${cityData.country}</span>
        `;
        lucide.createIcons();
    }
}

/**
 * Renderiza las cards diarias
 */
function renderDailyCards(dailyData) {
    const container = document.getElementById('daily-cards-container');
    if (!container) return;
    
    const today = new Date();
    
    container.innerHTML = dailyData.map((day, index) => {
        const isToday = day.date.toDateString() === today.toDateString();
        const isTomorrow = day.date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
        let dayLabel;
        if (isToday) dayLabel = 'Hoy';
        else if (isTomorrow) dayLabel = 'Mañana';
        else dayLabel = day.date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
        
        return `
            <div class="daily-card fade-in-forecast fade-in-delay-${index + 1}">
                <div class="daily-date">${dayLabel}</div>
                <div class="daily-icon">${day.icon}</div>
                <div class="daily-temps">
                    <span class="temp-max">${day.tempMax}°</span>
                    <span class="temp-min">${day.tempMin}°</span>
                </div>
                <div class="daily-precipitation">
                    <i data-lucide="cloud-rain" class="w-3 h-3"></i>
                    <span>${day.precipitationAvg}%</span>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

/**
 * Renderiza la información detallada de cada día
 */
function renderDetailedInfo(dailyData) {
    const container = document.getElementById('detailed-info-container');
    if (!container) return;
    
    container.innerHTML = dailyData.map((day, index) => {
        const dayName = getDayName(day.date);
        
        return `
            <div class="detailed-day-card fade-in-forecast fade-in-delay-${index + 1}">
                <div class="detailed-day-header">
                    <div>
                        <div class="detailed-day-title">${dayName}</div>
                        <div class="text-sm text-slate-500">${day.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>
                    </div>
                    <div class="detailed-day-icon">${day.icon}</div>
                </div>
                
                <div class="detailed-day-stats">
                    <div class="detailed-stat-item">
                        <div class="detailed-stat-label">Máxima</div>
                        <div class="detailed-stat-value">${day.tempMax}°C</div>
                    </div>
                    <div class="detailed-stat-item">
                        <div class="detailed-stat-label">Mínima</div>
                        <div class="detailed-stat-value">${day.tempMin}°C</div>
                    </div>
                    <div class="detailed-stat-item">
                        <div class="detailed-stat-label">Lluvia</div>
                        <div class="detailed-stat-value">${day.precipitationAvg}%</div>
                    </div>
                    <div class="detailed-stat-item">
                        <div class="detailed-stat-label">Viento</div>
                        <div class="detailed-stat-value">${day.windAvg} km/h</div>
                    </div>
                    <div class="detailed-stat-item">
                        <div class="detailed-stat-label">Humedad</div>
                        <div class="detailed-stat-value">${day.humidityAvg}%</div>
                    </div>
                    <div class="detailed-stat-item">
                        <div class="detailed-stat-label">Presión</div>
                        <div class="detailed-stat-value">${day.pressureAvg} hPa</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================================================
// FUNCIONES DE UTILIDAD
// ========================================================================

/**
 * Obtiene el nombre del día en español
 */
function getDayName(date) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Mañana';
    } else {
        return date.toLocaleDateString('es-ES', { weekday: 'long' });
    }
}

/**
 * Selecciona un día específico en la vista
 */
function selectDay(dayIndex) {
    // Remover selección anterior
    document.querySelectorAll('.daily-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Añadir selección al día clickeado
    const selectedCard = document.querySelectorAll('.daily-card')[dayIndex];
    if (selectedCard) {
        selectedCard.classList.add('selected');
        
        // Scroll suave hacia la información detallada
        const detailedSection = document.getElementById('detailed-info');
        if (detailedSection) {
            detailedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

/**
 * Función para volver a la página principal
 */
function goBack() {
    window.history.back();
}

/**
 * Función para ir a la página de gráfica
 */
function goToChart() {
    // Asegurarse de que los datos estén guardados en localStorage
    if (forecastData) {
        localStorage.setItem('chartData', JSON.stringify(forecastData));
        console.log('📊 Datos guardados para gráfica:', forecastData);
    }
    
    // Navegar a la página de gráfica
    window.location.href = 'chart.html';
}

/**
 * Oculta la pantalla de carga
 */
function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen && mainContent) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.classList.remove('hidden');
            
            // Aplicar animaciones de entrada
            setTimeout(() => {
                document.querySelectorAll('.fade-in-forecast').forEach((element, index) => {
                    setTimeout(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }, 100);
        }, 300);
    }
}

/**
 * Muestra mensaje de error
 */
function showErrorMessage(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="weather-main-card p-8 text-center">
                <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500"></i>
                <h3 class="text-xl font-bold mb-2 text-red-700">Error</h3>
                <p class="weather-description text-slate-600 mb-4">${message}</p>
                <button onclick="window.location.reload()" class="glass-button px-6 py-2">
                    <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
        lucide.createIcons();
    }
}

// ========================================================================
// MODO OSCURO
// ========================================================================

/**
 * Inicializa el modo oscuro basado en horario solar
 */
function initializeDarkMode() {
    try {
        // Verificar datos de clima del localStorage para obtener sunrise/sunset
        const weatherData = JSON.parse(localStorage.getItem('weatherData') || 'null');
        
        if (weatherData && weatherData.sys && weatherData.sys.sunrise && weatherData.sys.sunset) {
            const now = Date.now() / 1000;
            const sunrise = weatherData.sys.sunrise;
            const sunset = weatherData.sys.sunset;
            
            const shouldBeDark = now < sunrise || now > sunset;
            
            if (shouldBeDark) {
                isDarkMode = true;
                document.body.classList.add('dark-mode');
                updateDarkModeButton();
            }
        }
        
        console.log('🎨 Modo oscuro inicializado:', isDarkMode ? 'Activado' : 'Desactivado');
    } catch (error) {
        console.warn('⚠️ Error inicializando modo oscuro:', error);
    }
}

/**
 * Toggle del modo oscuro
 */
window.toggleDarkMode = function() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    updateDarkModeButton();
    
    localStorage.setItem('darkMode', isDarkMode.toString());
};

/**
 * Actualiza el botón de modo oscuro
 */
function updateDarkModeButton() {
    const button = document.getElementById('dark-mode-btn');
    if (button) {
        button.innerHTML = isDarkMode 
            ? '<i data-lucide="sun" class="w-5 h-5"></i>'
            : '<i data-lucide="moon" class="w-5 h-5"></i>';
        lucide.createIcons();
    }
}

// ========================================================================
// INICIALIZACIÓN
// ========================================================================

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeForecastPage);
