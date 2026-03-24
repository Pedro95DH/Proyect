const express = require("express");
const router = express.Router();

const {
  ficharEntrada,
  ficharSalida,
  obtenerMisFichajes,
  obtenerTodosFichajes,
  hardDeleteFichaje,
} = require("../controllers/fichajeController");

const { verificarToken } = require("../middleware/authMiddleware");
const { soloNoAdmin, soloRRHH, esAdmin } = require("../middleware/roleMiddleware");

// Rutas operativas de fichaje, disponibles para EMPLEADO y RRHH (el ADMIN no puede fichar)
router.post("/entrada", verificarToken, soloNoAdmin, ficharEntrada);
router.put("/salida", verificarToken, soloNoAdmin, ficharSalida);
router.get("/mis-fichajes", verificarToken, soloNoAdmin, obtenerMisFichajes);

// Auditoría de todos los fichajes, accesible solo por RRHH 
router.get("/todos", verificarToken, soloRRHH, obtenerTodosFichajes);

// Borrado físico de un fichaje, accesible solo por RRHH
router.delete("/:id", verificarToken, soloRRHH, hardDeleteFichaje);

module.exports = router;
 