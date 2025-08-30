/**
 * EFECTOS DE CLIMA DINÁMICOS
 * Sistema de efectos visuales para la aplicación del clima
 * DESHABILITADO - Usando efectos simplificados
 */

class WeatherEffects {
    constructor() {
        this.isInitialized = false;
        this.currentWeather = null;
    }

    /**
     * Inicializa los efectos de clima - DESHABILITADO
     */
    async init() {
        console.log('⚠️ Weather Effects SVG deshabilitado - usando efectos simplificados');
        this.isInitialized = false;
        return false;
    }

    /**
     * Cambia los efectos según el tipo de clima - DESHABILITADO
     */
    changeWeather(weatherCondition) {
        console.log('⚠️ Weather Effects SVG deshabilitado para', weatherCondition);
        return false;
    }
}

// Instancia global de efectos de clima (deshabilitada)
window.weatherEffects = new WeatherEffects();
