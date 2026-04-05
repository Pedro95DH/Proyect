require("dotenv").config();
const mongoose = require("mongoose");
const Usuario = require("./models/Usuario");

const crearAdmin = async () => {
  try {
    console.log("⏳ Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🟢 Conectado. Buscando si ya hay un Admin...");

    // 1. Buscamos si existe
    const adminExiste = await Usuario.findOne({ email: "admin@empresa.com" });

    // 2. Si existe, avisamos y nos vamos SIN borrar nada
    if (adminExiste) {
      console.log(
        "⚠️ El usuario Administrador ya existe en la base de datos (y está seguro).",
      );
      process.exit(0);
    }

    // 3. Si no existe, lo creamos. ¡El modelo se encargará de encriptarlo por debajo!
    const nuevoAdmin = new Usuario({
      nombre: "Administrador del Sistema",
      email: "admin@empresa.com",
      password: "Admin1234!",
      rol: "ADMIN",
      debeCambiarPassword: false,
    });

    await nuevoAdmin.save();
    console.log(
      "🌱 ¡ÉXITO! Usuario Administrador creado y ENCRIPTADO correctamente.",
    );

    process.exit(0);
  } catch (error) {
    console.error("🔴 Error al crear la semilla:", error);
    process.exit(1);
  }
};

crearAdmin();
