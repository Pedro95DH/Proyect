const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Comprueba las credenciales y devuelve un token JWT si son correctas
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscamos el usuario por email en la base de datos
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado en el sistema." });
    }

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: "Tu cuenta está dada de baja. Contacta con RRHH." });
    }

    // Comparamos la contraseña con el hash guardado en la BD
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas." });
    }

    // Generamos el token con el id y el rol del usuario, válido 8 horas
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      mensaje: "¡Login exitoso!",
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos || '',
        email: usuario.email,
        rol: usuario.rol,
        debeCambiarPassword: usuario.debeCambiarPassword,
        fotoPerfil: usuario.fotoPerfil || '',
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Permite al usuario autenticado cambiar su nombre de perfil
const cambiarNombre = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ mensaje: "El nombre debe tener al menos 2 caracteres." });
    }
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { nombre: nombre.trim() },
      { new: true, select: "-password" }
    );
    res.json({ mensaje: "Nombre actualizado correctamente.", usuario });
  } catch (error) {
    console.error("Error al cambiar nombre:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Permite al usuario autenticado cambiar su contraseña
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordNueva || passwordNueva.length < 6) {
      return res.status(400).json({ mensaje: "La nueva contraseña debe tener al menos 6 caracteres." });
    }

    const usuario = await Usuario.findById(req.usuario.id);

    // Si debeCambiarPassword es true, es el primer acceso: no pedimos la contraseña actual
    if (!usuario.debeCambiarPassword) {
      if (!passwordActual) {
        return res.status(400).json({ mensaje: "Debes proporcionar la contraseña actual." });
      }
      const correcta = await bcrypt.compare(passwordActual, usuario.password);
      if (!correcta) {
        return res.status(401).json({ mensaje: "La contraseña actual no es correcta." });
      }
    }

    usuario.password = passwordNueva;
    usuario.debeCambiarPassword = false;
    await usuario.save(); // el pre-save hook hashea la contraseña automáticamente

    res.json({ mensaje: "Contraseña cambiada correctamente." });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Permite al usuario autenticado cambiar su email, comprobando que no esté en uso
const cambiarEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ mensaje: "Email no válido." });
    }
    const emailExistente = await Usuario.findOne({ email, _id: { $ne: req.usuario.id } });
    if (emailExistente) {
      return res.status(409).json({ mensaje: "Ese email ya está en uso por otro usuario." });
    }
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { email: email.trim().toLowerCase() },
      { new: true, select: "-password" }
    );
    res.json({ mensaje: "Email actualizado correctamente.", email: usuario.email });
  } catch (error) {
    console.error("Error al cambiar email:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Recibe la imagen con multer, borra la foto anterior si había, y guarda la nueva
const subirFotoPerfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se ha enviado ninguna imagen." });
    }
    const fs = require('fs');
    const path = require('path');

    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado." });

    // Si el usuario ya tenía foto, la borramos del disco antes de guardar la nueva
    if (usuario.fotoPerfil) {
      const rutaAntigua = path.join(__dirname, '../uploads/fotos', usuario.fotoPerfil);
      if (fs.existsSync(rutaAntigua)) fs.unlinkSync(rutaAntigua);
    }

    usuario.fotoPerfil = req.file.filename;
    await usuario.save();

    res.json({ mensaje: "Foto de perfil actualizada.", fotoPerfil: usuario.fotoPerfil });
  } catch (error) {
    console.error("Error al subir foto de perfil:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { login, cambiarNombre, cambiarEmail, cambiarPassword, subirFotoPerfil };
    