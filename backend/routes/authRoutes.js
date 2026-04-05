const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");
const { verificarToken } = require("../middleware/authMiddleware");

// Cuando Angular haga un POST a /api/auth/login, se ejecutará nuestra función
router.post("/login", login);

// Ruta PRIVADA: Solo entras si el guardia (verificarToken) te deja pasar
router.get("/perfil", verificarToken, (req, res) => {
  // Si el código llega hasta aquí, es que el guardia lo dejó pasar
  // y nos dejó los datos del usuario en req.usuario
  res.json({
    mensaje: "¡Has entrado a la zona VIP!",
    datosUsuario: req.usuario,
  });
});

module.exports = router;
