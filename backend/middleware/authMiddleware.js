const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  console.log("🛡️ GUARDIA: 1. Alguien intenta entrar. Revisando cabeceras...");

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("🛡️ GUARDIA: 2. Bloqueado. No trae Token.");
    return res
      .status(403)
      .json({ mensaje: "Acceso denegado. No tienes un pase VIP." });
  }

  try {
    console.log(
      "🛡️ GUARDIA: 3. Token detectado. Comprobando si es falso o caducado...",
    );
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = decodificado;
    console.log(
      "🛡️ GUARDIA: 4. Token válido. ¡Es el usuario " +
        decodificado.rol +
        "! Abriendo la puerta...",
    );

    // 🚨 ESTA ES LA LÍNEA CRÍTICA: Si falta next(), la petición se queda colgada para siempre
    next();
  } catch (error) {
    console.log("🛡️ GUARDIA: 5. Error al verificar el token:", error.message);
    return res.status(401).json({ mensaje: "Token inválido o ha caducado." });
  }
};

module.exports = { verificarToken };
