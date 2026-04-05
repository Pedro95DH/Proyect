const express = require("express");
const router = express.Router();
const { crearEmpleado } = require("../controllers/usuarioController");
const { verificarToken } = require("../middleware/authMiddleware");

// Ruta PRIVADA: Solo pasas si tienes Token (verificarToken).
// Luego el controlador se encargará de comprobar si además de Token, eres ADMIN.
router.post("/crear", verificarToken, crearEmpleado);

module.exports = router;
