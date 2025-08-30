/**
 * GRÁFICA DEL CLIMA - JavaScript
 * Página dedicada para mostrar gráfica de evolución de 7 días
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
let mainChart = null;
let isDarkMode = false;

// ========================================================================
// FUNCIONES DE INICIALIZACIÓN
// ========================================================================

/**
 * Inicializa la página de gráfica
 */
async function initializeChartPage() {
    try {
        console.log('📊 Inicializando página de gráfica...');
        
        // Inicializar modo oscuro
        initializeDarkMode();
        
        // Obtener datos del pronóstico (desde localStorage o API)
        const data = await getForecastData();
        
        // Renderizar contenido
        await renderChartData(data);
        
        // Ocultar loading
        hideLoading();
        
        console.log('✅ Página de gráfica inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando gráfica:', error);
        showErrorMessage('No se pudieron cargar los datos para la gráfica');
    }
}

/**
 * Obtiene los datos del pronóstico
 */
async function getForecastData() {
    try {
        // Primero intentar obtener datos del localStorage (chartData es el más reciente)
        let savedData = localStorage.getItem('chartData');
        if (!savedData) {
            savedData = localStorage.getItem('forecastData');
        }
        
        if (savedData) {
            console.log('📦 Usando datos guardados del pronóstico');
            return JSON.parse(savedData);
        }
        
        // Si no hay datos guardados, obtener de la API
        console.log('🌐 Obteniendo datos frescos de la API...');
        const position = await getCurrentPosition();
        return await fetchExtendedForecast(position.coords.latitude, position.coords.longitude);
        
    } catch (error) {
        console.error('❌ Error obteniendo datos:', error);
        throw error;
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
 * Obtiene datos extendidos del pronóstico de la API
 */
async function fetchExtendedForecast(lat, lon) {
    try {
        const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('❌ Error obteniendo pronóstico de API:', error);
        throw error;
    }
}

// ========================================================================
// FUNCIONES DE RENDERIZADO
// ========================================================================

/**
 * Renderiza todos los datos de la gráfica
 */
async function renderChartData(data) {
    try {
        // Procesar datos por días
        const dailyData = processDailyData(data.list);
        
        // Actualizar ubicación
        updateLocationDisplay(data.city);
        
        // Renderizar gráfica principal
        renderMainChart(dailyData);
        
        // Renderizar estadísticas rápidas
        renderQuickStats(dailyData);
        
        // Guardar datos globalmente
        forecastData = dailyData;
        
    } catch (error) {
        console.error('❌ Error renderizando gráfica:', error);
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
                weather: item.weather[0]
            });
        }
        
        const dayData = dailyMap.get(dateKey);
        dayData.temps.push(item.main.temp);
        dayData.precipitation.push(item.pop * 100);
        dayData.wind.push(item.wind.speed * 3.6); // Convertir a km/h
    });
    
    // Convertir a array y calcular estadísticas
    return Array.from(dailyMap.values()).slice(0, 7).map(day => ({
        date: day.date,
        tempMax: Math.round(Math.max(...day.temps)),
        tempMin: Math.round(Math.min(...day.temps)),
        precipitationAvg: Math.round(day.precipitation.reduce((a, b) => a + b, 0) / day.precipitation.length),
        windAvg: Math.round(day.wind.reduce((a, b) => a + b, 0) / day.wind.length),
        weather: day.weather
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
 * Renderiza la gráfica principal grande
 */
function renderMainChart(dailyData) {
    const canvas = document.getElementById('main-weather-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfica anterior si existe
    if (mainChart) {
        mainChart.destroy();
    }
    
    const labels = dailyData.map(day => {
        const today = new Date();
        const isToday = day.date.toDateString() === today.toDateString();
        const isTomorrow = day.date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
        if (isToday) return 'Hoy';
        if (isTomorrow) return 'Mañana';
        return day.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    });
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: isDarkMode ? '#f1f5f9' : '#1e293b',
                bodyColor: isDarkMode ? '#f1f5f9' : '#475569',
                borderColor: isDarkMode ? 'rgba(100, 116, 139, 0.4)' : 'rgba(203, 213, 225, 0.4)',
                borderWidth: 1,
                cornerRadius: 12,
                bodyFont: { size: 14 },
                titleFont: { size: 16, weight: 'bold' }
            }
        },
        scales: {
            x: {
                grid: {
                    color: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(203, 213, 225, 0.3)',
                    lineWidth: 1
                },
                ticks: {
                    color: isDarkMode ? '#f1f5f9' : '#64748b',
                    font: { size: 14, weight: '500' }
                }
            },
            y: {
                grid: {
                    color: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(203, 213, 225, 0.3)',
                    lineWidth: 1
                },
                ticks: {
                    color: isDarkMode ? '#f1f5f9' : '#64748b',
                    font: { size: 14, weight: '500' }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        elements: {
            point: {
                radius: 6,
                hoverRadius: 8
            },
            line: {
                borderWidth: 4,
                tension: 0.4
            }
        }
    };
    
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperatura Máxima (°C)',
                    data: dailyData.map(day => day.tempMax),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3
                },
                {
                    label: 'Temperatura Mínima (°C)',
                    data: dailyData.map(day => day.tempMin),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3
                },
                {
                    label: 'Probabilidad de lluvia (%)',
                    data: dailyData.map(day => day.precipitationAvg),
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: false,
                    pointBackgroundColor: '#06b6d4',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3
                },
                {
                    label: 'Velocidad del viento (km/h)',
                    data: dailyData.map(day => day.windAvg),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3
                }
            ]
        },
        options: chartOptions
    });
}

/**
 * Renderiza estadísticas rápidas
 */
function renderQuickStats(dailyData) {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    // Calcular estadísticas
    const allTempsMax = dailyData.map(d => d.tempMax);
    const allTempsMin = dailyData.map(d => d.tempMin);
    const allPrecipitation = dailyData.map(d => d.precipitationAvg);
    const allWind = dailyData.map(d => d.windAvg);
    
    const stats = {
        tempMax: Math.max(...allTempsMax),
        tempMin: Math.min(...allTempsMin),
        precipitationMax: Math.max(...allPrecipitation),
        windMax: Math.max(...allWind)
    };
    
    container.innerHTML = `
        <div class="info-card">
            <div class="info-icon">🔥</div>
            <div class="info-label">Temp. más alta</div>
            <div class="info-value">${stats.tempMax}°C</div>
        </div>
        <div class="info-card">
            <div class="info-icon">❄️</div>
            <div class="info-label">Temp. más baja</div>
            <div class="info-value">${stats.tempMin}°C</div>
        </div>
        <div class="info-card">
            <div class="info-icon">🌧️</div>
            <div class="info-label">Máx. probabilidad lluvia</div>
            <div class="info-value">${stats.precipitationMax}%</div>
        </div>
        <div class="info-card">
            <div class="info-icon">💨</div>
            <div class="info-label">Viento más fuerte</div>
            <div class="info-value">${stats.windMax} km/h</div>
        </div>
    `;
}

// ========================================================================
// FUNCIONES DE NAVEGACIÓN
// ========================================================================

/**
 * Función para volver a la página anterior
 */
function goBack() {
    window.history.back();
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
    
    // Actualizar gráfica si existe
    if (mainChart && forecastData) {
        mainChart.destroy();
        renderMainChart(forecastData);
    }
    
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
document.addEventListener('DOMContentLoaded', initializeChartPage);
