require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const ftp     = require('basic-ftp');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Carpeta temporal para guardar el archivo antes de subirlo al FTP
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ── Multer: solo acepta archivos .html, máximo 10 MB
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req,  file, cb) => cb(null, 'index.html'),   // siempre sobreescribe index.html
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Solo se permiten archivos HTML (.html o .htm)'));
  },
});

// ── Archivos estáticos (el frontend)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── POST /upload → recibe el HTML y lo sube al FTP de Hostinger
app.post('/upload', upload.single('htmlFile'), async (req, res) => {
  // Verificar contraseña de acceso
  const { password } = req.body;
  if (!process.env.UPLOAD_PASSWORD || password !== process.env.UPLOAD_PASSWORD) {
    return res.status(401).json({ ok: false, message: 'Contraseña incorrecta.' });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, message: 'No se recibió ningún archivo.' });
  }

  const localPath  = req.file.path;
  const remoteDir  = process.env.FTP_REMOTE_DIR  || '/public_html';
  const remotePath = `${remoteDir}/index.html`;

  const client = new ftp.Client();
  client.ftp.verbose = false;   // ponlo en true para depuración

  try {
    await client.access({
      host:     process.env.FTP_HOST,
      port:     parseInt(process.env.FTP_PORT || '21', 10),
      user:     process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure:   false,           // Hostinger básico usa FTP plano; cambia a true para FTPS
    });

    await client.uploadFrom(localPath, remotePath);
    client.close();

    // Borrar el temporal
    fs.unlink(localPath, () => {});

    return res.json({
      ok: true,
      message: '¡Archivo subido con éxito! Tu web ya está actualizada.',
    });

  } catch (err) {
    client.close();
    fs.unlink(localPath, () => {});
    console.error('[FTP ERROR]', err.message);
    return res.status(500).json({
      ok: false,
      message: `Error al conectar con el servidor: ${err.message}`,
    });
  }
});

// ── Error handler de multer
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ ok: false, message: err.message });
  }
  res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔑  Contraseña cargada: ${process.env.UPLOAD_PASSWORD ? '✅' : '❌  (falta UPLOAD_PASSWORD en .env)'}`);
  console.log(`📡  FTP host: ${process.env.FTP_HOST || '❌  (falta FTP_HOST en .env)'}\n`);
});
