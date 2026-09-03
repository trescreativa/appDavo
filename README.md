# 🌐 AppDavo — Interfaz de actualización web

Permite que tu cliente suba su propio `index.html` desde el navegador y lo despliega automáticamente en Hostinger vía FTP, sin que el cliente necesite saber nada de servidores.

---

## ¿Cómo funciona?

```
Cliente sube HTML → Servidor Node.js → FTP Hostinger → Web actualizada
```

---

## Configuración inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el archivo `.env`

Copia el archivo de ejemplo y rellena tus datos:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Hostinger:

```env
FTP_HOST=files.000webhost.com       # o el hostname FTP de tu panel
FTP_PORT=21
FTP_USER=tu_usuario_ftp
FTP_PASSWORD=tu_contraseña_ftp
FTP_REMOTE_DIR=/public_html         # ruta donde vive tu web
UPLOAD_PASSWORD=pon_una_contraseña_segura
PORT=3000
```

> **¿Dónde encuentro mis datos FTP de Hostinger?**
> Panel de Hostinger → Hosting → Administrar → **Cuentas FTP**

### 3. Arrancar el servidor

```bash
npm start
```

La interfaz queda disponible en `http://localhost:3000`.

---

## Estructura del proyecto

```
appdavo/
├── public/
│   └── index.html     ← Frontend (interfaz del cliente)
├── uploads/           ← Temporal (se vacía tras cada subida)
├── server.js          ← Backend Express + FTP
├── .env               ← Credenciales (NO subir a git)
├── .env.example       ← Plantilla de variables
└── package.json
```

---

## Despliegue en Hostinger (el servidor Node.js)

Si también quieres alojar **este servidor** en Hostinger:

1. Sube todos los archivos (excepto `.env` y `node_modules`) vía FTP o Git.
2. En el panel de Hostinger → **Node.js** → crea una app apuntando a `server.js`.
3. Crea el `.env` directamente en el servidor con tus credenciales.
4. Reinicia la aplicación.

---

## Seguridad

- La interfaz pide una **contraseña** antes de permitir cualquier subida.
- Solo se aceptan archivos `.html` / `.htm`.
- El archivo temporal se elimina del servidor Node después de cada subida.
- Nunca subas `.env` al repositorio (ya está en `.gitignore`).
