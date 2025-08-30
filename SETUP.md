# 🚀 Configuración Rápida - Clima Minimalista

## ⚡ Inicio Rápido (5 minutos)

### 1. 📋 Obtener API Key GRATUITA

1. Ve a: **https://openweathermap.org/api**
2. Haz clic en **"Sign Up"** (es gratis)
3. Rellena el formulario de registro
4. Confirma tu email
5. Ve a **"My API Keys"** en tu perfil
6. Copia tu API key (algo como: `abc123def456789...`)

⚠️ **IMPORTANTE**: La API key tarda **2 horas** en activarse después del registro.

### 2. 🔧 Configurar la Aplicación

1. Abre el archivo `config.js`
2. Busca esta línea:
   ```javascript
   const OPENWEATHER_API_KEY = 'TU_API_KEY_AQUI';
   ```
3. Reemplaza `TU_API_KEY_AQUI` con tu clave:
   ```javascript
   const OPENWEATHER_API_KEY = 'tu_clave_real_aqui';
   ```
4. Guarda el archivo

### 3. 🌐 Ejecutar la Aplicación

#### Opción A: Navegador Local
- Abre `index.html` directamente en tu navegador
- Permite el acceso a la ubicación cuando te lo pida

#### Opción B: Servidor Local (Recomendado)
```bash
# Con Node.js
npx serve . -p 3000

# Con Python
python -m http.server 8000

# Luego abre: http://localhost:3000 o http://localhost:8000
```

## 🐛 Solución de Problemas

### ❌ "API Key no configurada"
- Verifica que cambiaste `TU_API_KEY_AQUI` por tu clave real
- Asegúrate de que guardaste el archivo `config.js`

### ❌ "API Key inválida"
- Tu clave aún no está activa (espera 2 horas)
- Verifica que copiaste la clave completa
- Revisa que no hay espacios extra al inicio/final

### ❌ "No se pudo obtener tu ubicación"
- Permite el acceso a la ubicación en tu navegador
- Si no quieres compartir ubicación, la app usará Madrid por defecto

### ❌ "Sin conexión a internet"
- Verifica tu conexión
- Algunos navegadores bloquean requests desde `file://`, usa un servidor local

## 📊 Límites de la API Gratuita

- **1000 llamadas/día** (más que suficiente)
- **60 llamadas/minuto**
- Datos actualizados cada 10 minutos
- Sin límite de tiempo

## 🔒 Seguridad

⚠️ **NO subas tu API key a repositorios públicos**

Si usas Git:
```bash
# El archivo config.js ya está en .gitignore
# Pero por seguridad, puedes crear una copia:
cp config.js config.local.js
# Y trabajar en config.local.js
```

## 🆘 ¿Necesitas Ayuda?

1. **Revisa la consola del navegador** (F12 → Console) para ver errores detallados
2. **Verifica tu API key** en https://openweathermap.org/api_keys
3. **Prueba en modo incógnito** para descartar problemas de cache

## ✅ Todo Funcionando

Si ves tu temperatura y ubicación actuales, ¡felicitaciones! 🎉

La aplicación ahora:
- ✅ Detecta tu ubicación automáticamente
- ✅ Muestra clima actual y pronóstico
- ✅ Se actualiza automáticamente cada 10 minutos
- ✅ Funciona offline (con datos en caché)
- ✅ Tiene efectos visuales según el clima

---

**¿Problemas? Abre un [issue](https://github.com/Joncarre/weather_web_app/issues) en GitHub**
