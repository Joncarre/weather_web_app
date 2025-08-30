/**
 * EFECTOS DE CLIMA SIMPLIFICADOS
 * Versión simplificada para debugging
 */

class SimpleWeatherEffects {
    constructor() {
        this.isInitialized = false;
        this.currentWeather = null;
        this.animationId = null;
        this.particles = [];
    }

    /**
     * Inicializa los efectos de clima
     */
    async init() {
        try {
            console.log('🔄 Inicializando Simple Weather Effects...');
            
            // Verificar dependencias básicas
            if (typeof $ === 'undefined') {
                throw new Error('jQuery no está disponible');
            }
            
            // Verificar elementos DOM
            const card = $('#current-weather');
            const outerSVG = $('#weather-effects-outer');
            const innerSVG = $('#weather-effects-inner');
            
            if (!card.length || !outerSVG.length || !innerSVG.length) {
                throw new Error('Elementos DOM no encontrados');
            }
            
            this.elements = { card, outerSVG, innerSVG };
            
            // Configurar canvas para efectos simples
            this.setupCanvas();
            
            this.isInitialized = true;
            console.log('✅ Simple Weather Effects inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando Simple Weather Effects:', error);
        }
    }

    /**
     * Configura el canvas para efectos
     */
    setupCanvas() {
        const card = this.elements.card;
        
        // Crear canvas para efectos
        if (!document.getElementById('weather-canvas')) {
            const canvas = $('<canvas id="weather-canvas" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; border-radius: inherit;"></canvas>');
            card.append(canvas);
            
            this.canvas = canvas[0];
            this.ctx = this.canvas.getContext('2d');
            
            // Configurar tamaño
            this.resizeCanvas();
            $(window).on('resize', () => this.resizeCanvas());
        }
    }

    /**
     * Ajusta el tamaño del canvas
     */
    resizeCanvas() {
        if (!this.canvas || !this.elements.card.length) return;
        
        const card = this.elements.card;
        
        // Obtener dimensiones completas incluyendo padding
        const cardElement = card[0];
        const computedStyle = window.getComputedStyle(cardElement);
        
        // Obtener dimensiones internas (sin padding)
        const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
        const paddingRight = parseInt(computedStyle.paddingRight) || 0;
        const paddingTop = parseInt(computedStyle.paddingTop) || 0;
        const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
        
        // Usar dimensiones completas del elemento
        const fullWidth = card.outerWidth();
        const fullHeight = card.outerHeight();
        
        // Configurar canvas para ocupar todo el espacio
        this.canvas.width = fullWidth;
        this.canvas.height = fullHeight;
        this.canvas.style.width = fullWidth + 'px';
        this.canvas.style.height = fullHeight + 'px';
        
        // Posicionar el canvas para que cubra toda la tarjeta
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        
        console.log('Canvas redimensionado:', {
            width: fullWidth,
            height: fullHeight,
            padding: { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft }
        });
    }

    /**
     * Cambia los efectos según el tipo de clima
     */
    changeWeather(weatherCondition) {
        if (!this.isInitialized) {
            console.warn('⚠️ Effects no inicializados');
            return;
        }

        console.log('🌤️ Cambiando efecto a:', weatherCondition);
        
        this.currentWeather = this.mapWeatherCondition(weatherCondition);
        
        // Limpiar efectos anteriores
        this.clearEffects();
        
        // Aplicar nuevo fondo
        this.applyBackground();
        
        // Iniciar nuevos efectos
        this.startEffects();
        
        console.log('✅ Efecto aplicado:', this.currentWeather.type);
    }

    /**
     * Mapea condiciones de clima
     */
    mapWeatherCondition(condition) {
        const conditionLower = condition.toLowerCase();
        
        if (conditionLower.includes('rain') || conditionLower.includes('lluvia') || conditionLower.includes('drizzle')) {
            return {type: 'rain', name: 'Lluvia', color: '#1565C0', particleCount: 50};
        } else if (conditionLower.includes('thunder') || conditionLower.includes('storm') || conditionLower.includes('tormenta')) {
            return {type: 'thunder', name: 'Tormenta', color: '#424242', particleCount: 80};
        } else if (conditionLower.includes('snow') || conditionLower.includes('nieve')) {
            return {type: 'snow', name: 'Nieve', color: '#FFFFFF', particleCount: 30};
        } else if (conditionLower.includes('wind') || conditionLower.includes('viento')) {
            return {type: 'wind', name: 'Viento', color: '#2E7D32', particleCount: 15};
        }
        
        return {type: 'clear', name: 'Despejado', color: '#FFD700', particleCount: 0};
    }

    /**
     * Aplica el fondo según el clima
     */
    applyBackground() {
        const card = this.elements.card;
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Remover clases anteriores
        card.removeClass('rain-bg thunder-bg snow-bg wind-bg clear-bg');
        
        // Para "Despejado" no aplicamos fondo especial, solo la clase
        if (this.currentWeather.type === 'clear') {
            card.addClass('clear-bg');
            // Limpiar cualquier fondo inline para usar el natural
            card.css('background', '');
            return;
        }
        
        // Aplicar nueva clase para otros efectos
        card.addClass(this.currentWeather.type + '-bg');
        
        // Aplicar color de fondo directo según el modo
        const bgColors = isDarkMode ? {
            rain: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            thunder: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            snow: 'linear-gradient(135deg, #312e81 0%, #3730a3 100%)',
            wind: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
        } : {
            rain: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
            thunder: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
            snow: 'linear-gradient(135deg, #F3E5F5 0%, #E8EAF6 100%)',
            wind: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E8 100%)'
        };
        
        card.css('background', bgColors[this.currentWeather.type] || '');
    }

    /**
     * Limpia efectos anteriores
     */
    clearEffects() {
        this.particles = [];
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Inicia los efectos
     */
    startEffects() {
        if (!this.ctx || this.currentWeather.particleCount === 0) return;
        
        // Crear partículas
        for (let i = 0; i < this.currentWeather.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
        
        // Iniciar animación
        this.animate();
    }

    /**
     * Crea una partícula
     */
    createParticle() {
        const particle = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * -100,
            speed: Math.random() * 3 + 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.6 + 0.4
        };

        if (this.currentWeather.type === 'wind') {
            particle.speedX = Math.random() * 2 + 1;
            particle.speedY = Math.random() * 1 + 0.5;
        } else if (this.currentWeather.type === 'snow') {
            particle.speedX = Math.random() * 1 - 0.5;
            particle.speed = Math.random() * 1 + 0.5;
        }

        return particle;
    }

    /**
     * Anima las partículas
     */
    animate() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Actualizar y dibujar partículas
        this.particles.forEach((particle, index) => {
            this.updateParticle(particle);
            this.drawParticle(particle);
            
            // Remover partículas fuera de pantalla
            if (particle.y > this.canvas.height + 10 || 
                (this.currentWeather.type === 'wind' && particle.x > this.canvas.width + 10)) {
                this.particles[index] = this.createParticle();
            }
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Actualiza una partícula
     */
    updateParticle(particle) {
        if (this.currentWeather.type === 'wind') {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
        } else if (this.currentWeather.type === 'snow') {
            particle.x += particle.speedX;
            particle.y += particle.speed;
            particle.speedX += Math.random() * 0.02 - 0.01; // Drift
        } else {
            particle.y += particle.speed;
        }
    }

    /**
     * Dibuja una partícula
     */
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity;
        
        // Ajustar colores según el modo oscuro
        const isDarkMode = document.body.classList.contains('dark-mode');
        let particleColor = this.currentWeather.color;
        
        if (isDarkMode) {
            // Colores más brillantes para modo oscuro
            const darkModeColors = {
                '#1565C0': '#42A5F5', // Lluvia - azul más brillante
                '#424242': '#E0E0E0', // Tormenta - gris claro
                '#FFFFFF': '#FFFFFF', // Nieve - mantener blanco
                '#2E7D32': '#66BB6A'  // Viento - verde más brillante
            };
            particleColor = darkModeColors[particleColor] || particleColor;
        }
        
        if (this.currentWeather.type === 'rain' || this.currentWeather.type === 'thunder') {
            // Dibujar línea para lluvia
            this.ctx.strokeStyle = particleColor;
            this.ctx.lineWidth = particle.size;
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(particle.x, particle.y + 10);
            this.ctx.stroke();
        } else {
            // Dibujar círculo para nieve/viento
            this.ctx.fillStyle = particleColor;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
}

// Crear instancia global
window.simpleWeatherEffects = new SimpleWeatherEffects();
