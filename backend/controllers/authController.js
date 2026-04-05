const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res
        .status(404)
        .json({ mensaje: "Usuario no encontrado en el sistema." });
    }

    const passwordCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecta) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas." });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      mensaje: "¡Login exitoso!",
      token: token,
      usuario: {
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { login };
