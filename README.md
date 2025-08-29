# 🌤️ Clima Minimalista

Una aplicación web del clima responsive y minimalista, optimizada para móviles y diseñada especialmente para personas mayores. Sin anuncios, sin complicaciones.

## ✨ Características Principales

- 📱 **100% Responsive** - Diseño mobile-first optimizado
- 🎨 **Diseño Minimalista** - Colores pasteles suaves y tipografía clara
- 🌍 **Geolocalización Automática** - Detecta tu ubicación al instante
- 🔄 **Actualización en Tiempo Real** - Datos siempre actualizados
- ♿ **Accesible** - Optimizado para personas mayores
- 🚫 **Sin Anuncios** - Experiencia limpia y sin distracciones

## 🚀 Funcionalidades

### Clima Actual
- Temperatura actual y sensación térmica
- Descripción detallada del clima
- Humedad y velocidad del viento
- Presión atmosférica
- Índice UV
- Visibilidad
- Hora de salida y puesta del sol

### Pronóstico Extendido
- Pronóstico de 7 días
- Temperaturas máximas y mínimas
- Probabilidad de precipitación
- Iconos representativos

### Efectos Visuales
- Fondos dinámicos según condición climática
- Iconos animados del clima
- Efectos CSS para lluvia, nieve y otros fenómenos
- Transiciones suaves y micro-interacciones

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5 + JavaScript Vanilla
- **Estilos**: Tailwind CSS + CSS personalizado
- **API**: OpenWeatherMap (gratuita)
- **Iconos**: Lucide Icons
- **Geolocalización**: API Geolocation del navegador

## 🔧 Instalación y Configuración

### Prerrequisitos
- Navegador web moderno
- Conexión a internet
- API Key de OpenWeatherMap (gratuita)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Joncarre/weather_web_app.git
cd weather_web_app
```

2. **Obtener API Key de OpenWeatherMap**
   - Regístrate en [OpenWeatherMap](https://openweathermap.org/api)
   - Obtén tu API key gratuita
   - Límite: 1000 llamadas/día

3. **Configurar API Key**
   - Abre `script.js`
   - Busca la línea: `API_KEY: ''`
   - Añade tu API key: `API_KEY: 'tu_api_key_aqui'`

4. **Ejecutar la aplicación**
   - Abre `index.html` en tu navegador
   - O usa un servidor local:
   ```bash
   # Con Python
   python -m http.server 8000
   
   # Con Node.js
   npx serve .
   ```

## 📁 Estructura del Proyecto

```
weather_web_app/
├── index.html              # Estructura principal HTML
├── styles.css              # Estilos personalizados
├── script.js               # Lógica de la aplicación
├── assets/                 # Recursos estáticos
│   ├── icons/             # Iconos personalizados del clima
│   └── backgrounds/       # Fondos opcionales
├── .gitignore             # Archivos ignorados por Git
└── README.md              # Este archivo
```

## 🎨 Guía de Diseño

### Paleta de Colores
- **Primario**: `#E8F4FD` (Azul muy claro)
- **Secundario**: `#FFE5CC` (Melocotón suave)
- **Acentos**: `#D4F1F4`, `#F5E6FF`, `#FFE5E5`
- **Texto**: `#4A5568` (principal), `#718096` (secundario)

### Principios de Diseño
- Bordes redondeados suaves
- Transparencias con backdrop-blur
- Sombras difusas y elegantes
- Animaciones sutiles de 200ms
- Tipografía clara y legible

## 📱 Compatibilidad

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ✅ Dispositivos móviles iOS/Android

## 🔮 Roadmap de Desarrollo

- [x] **Fase 1**: Configuración y estructura base
- [ ] **Fase 2**: Diseño y sistema de colores
- [ ] **Fase 3**: Integración API y geolocalización
- [ ] **Fase 4**: Clima actual
- [ ] **Fase 5**: Pronóstico extendido
- [ ] **Fase 6**: Efectos visuales y animaciones
- [ ] **Fase 7**: Optimización UX personas mayores
- [ ] **Fase 8**: Responsive y cross-browser
- [ ] **Fase 9**: Testing y debugging
- [ ] **Fase 10**: Deploy y documentación final

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:
- 🐛 [Reportar bug](https://github.com/Joncarre/weather_web_app/issues)
- 💡 [Sugerir mejora](https://github.com/Joncarre/weather_web_app/issues)

---

**Desarrollado con ❤️ para una experiencia de clima simple y accesible**
