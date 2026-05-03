const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  listarEmpleados,
  crearEmpleado,
  editarEmpleado,
  bajaLogica,
  reactivarEmpleado,
  hardDeleteUsuario,
} = require("../controllers/usuarioController");

const { verificarToken } = require("../middleware/authMiddleware");
const { esRRHHoAdmin, esAdmin } = require("../middleware/roleMiddleware");

// Configuración de multer para fotos de perfil (máximo 2 MB, solo imágenes)
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

// Rutas de gestión de plantilla, accesibles para RRHH y ADMIN
router.get("/", verificarToken, esRRHHoAdmin, listarEmpleados);
router.post("/crear", verificarToken, esRRHHoAdmin, uploadFoto.single("foto"), crearEmpleado);
router.put("/:id", verificarToken, esRRHHoAdmin, uploadFoto.single("foto"), editarEmpleado);
router.patch("/:id/baja", verificarToken, esRRHHoAdmin, bajaLogica);
router.patch("/:id/reactivar", verificarToken, esRRHHoAdmin, reactivarEmpleado);

// Borrado físico, solo disponible para ADMIN
router.delete("/:id", verificarToken, esAdmin, hardDeleteUsuario);

module.exports = router;
