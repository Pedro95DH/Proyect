const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  subirNomina,
  obtenerMisNominas,
  descargarNomina,
  obtenerTodasNominas,
  hardDeleteNomina,
} = require("../controllers/nominaController");

const { verificarToken } = require("../middleware/authMiddleware");
const { soloNoAdmin, soloRRHH, esAdmin } = require("../middleware/roleMiddleware");

// Configuración de multer para PDFs de nóminas (máximo 5 MB, solo PDF)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/nominas"));
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, nombreUnico);
  },
});

const filtroPDF = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else { 
    cb(new Error("Solo se permiten archivos PDF."), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filtroPDF,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Rutas de nóminas propias, disponibles para EMPLEADO y RRHH (el ADMIN no descarga nóminas)
router.get("/mis-nominas", verificarToken, soloNoAdmin, obtenerMisNominas); 
router.get("/descargar/:nominaId", verificarToken, soloNoAdmin, descargarNomina);

// Gestión de nóminas de todos los empleados, accesible solo por RRHH 
router.get("/todas", verificarToken, soloRRHH, obtenerTodasNominas);
router.post("/subir", verificarToken, soloRRHH, upload.single("archivo"), subirNomina);

// Borrado físico de nómina y PDF del disco, accesible solo por RRHH
router.delete("/:id", verificarToken, soloRRHH, hardDeleteNomina);

module.exports = router;


