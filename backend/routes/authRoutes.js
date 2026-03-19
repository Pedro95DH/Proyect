const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { login, cambiarNombre, cambiarEmail, cambiarPassword, subirFotoPerfil } = require("../controllers/authController");
const { verificarToken } = require("../middleware/authMiddleware");

// Configuración de multer para guardar fotos de perfil en uploads/fotos
const storageFoto = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/fotos"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `foto-${Date.now()}${ext}`);
  },
});

const filtroImagen = (req, file, cb) => {
  const tipos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (tipos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP)."), false);
  }
};

const uploadFoto = multer({
  storage: storageFoto, 
  fileFilter: filtroImagen,
  limits: { fileSize: 2 * 1024 * 1024 },
}); 

// Rutas de autenticación y perfil propio (requieren token excepto el login)
router.post("/login", login);
router.put("/cambiar-nombre", verificarToken, cambiarNombre);
router.put("/cambiar-email", verificarToken, cambiarEmail);
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.put("/foto-perfil", verificarToken, uploadFoto.single("foto"), subirFotoPerfil);

module.exports = router;
  