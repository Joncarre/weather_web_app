# Aplicación web del tiempo

Mi madre no para de pedirme que le instale la aplicación del tiempo. Que si no le funciona a veces, que si le salen anuncios, que si no sabe cómo funciona, etc. Así que he decidido crear una aplicación web, comprar un dominio y ponerla como un acceso a través de un icono desde su móvil. De esa forma, no es necesario que sea una app móvil.

En resumen: una aplicación web del tiempo que es responsive y minimalista, optimizada para móviles y diseñada especialmente para personas mayores como mi madre. Sin anuncios, sin complicaciones.

## Características Principales

- **100% Responsive** - Diseño mobile-first optimizado
- **Diseño minimalista** - Colores pasteles suaves y tipografía clara
- **Modo oscuro automático** - A partir del ocaso, la aplicación pasa a modo oscuro
- **Geolocalización automática** - Detecta tu ubicación al instante
- **Actualización en tiempo real** - Datos siempre actualizados
- **Accesible** - Optimizado para personas mayores
- **Sin anuncios** - Experiencia limpia y sin distracciones

En la siguiente imagen se puede ver la temperatura actual, localización y hora.

<div align="center">
    <img src="assets/images/im1.png" alt="Temperatura actual, localización y hora" style="width:30%; border-radius:16px;">
</div>

Ahora vemos la información que muestra. ¿Para qué más? Con esto ya tenemos toda la información que necesitamos para salir a la calle.

<div align="center">
    <img src="assets/images/im2.png" alt="Información adicional del clima" style="width:30%; border-radius:16px;">
</div>

Y por último, también podemos ver la predicción de los próximos 7 días, y una gráfica lineal (esto falta por terminar) donde se verán cuatro parámetros: temperatura máxima, mínima, velocidad de viento y probabilidad de lluvia.

<div align="center">
    <img src="assets/images/im3.png" alt="Pronóstico de 7 días" style="width:30%; border-radius:16px;">
</div>

## Funcionalidades

### Clima actual
- Temperatura actual y sensación térmica
- Humedad y velocidad del viento
- Índice UV
- Hora de salida y puesta del sol

### Pronóstico extendido
- Pronóstico de 7 días
- Temperaturas máximas y mínimas
- Probabilidad de precipitación
- Iconos y esas cosas bonitas

## Estructura del Proyecto

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

---
*Created by Jonathan Carrero*
