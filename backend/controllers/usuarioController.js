const Usuario = require("../models/Usuario");

const crearEmpleado = async (req, res) => {
  try {
    console.log("➡️ 1. Entrando al controlador crearEmpleado...");

    if (req.usuario.rol !== "ADMIN") {
      console.log("❌ Bloqueado: El usuario no es ADMIN");
      return res.status(403).json({ mensaje: "Acceso denegado." });
    }

    const { nombre, dni, email, password } = req.body;
    console.log("📦 2. Datos recibidos:", { nombre, dni, email });

    console.log("🔍 3. Buscando si ya existe en la base de datos...");
    const usuarioExistente = await Usuario.findOne({
      $or: [{ email }, { dni }],
    });

    if (usuarioExistente) {
      console.log("⚠️ Bloqueado: El usuario ya existe.");
      return res
        .status(400)
        .json({ mensaje: "Ya existe un usuario con ese email o DNI." });
    }

    console.log("🏗️ 4. Construyendo el molde del nuevo empleado...");
    const nuevoEmpleado = new Usuario({
      nombre,
      dni,
      email,
      password,
      rol: "EMPLEADO",
      debeCambiarPassword: true,
    });

    console.log(
      "💾 5. Guardando en MongoDB (aquí se ejecuta la encriptación)...",
    );
    await nuevoEmpleado.save();

    console.log("✅ 6. ¡Guardado con éxito! Enviando respuesta...");
    res.status(201).json({
      mensaje: "Empleado creado correctamente.",
      empleado: { nombre: nuevoEmpleado.nombre, email: nuevoEmpleado.email },
    });
  } catch (error) {
    console.error("🔴 Error interno al crear empleado:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { crearEmpleado };
