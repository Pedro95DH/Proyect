// Herramientas que instalamos
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const usuarioRoutes = require("./routes/usuarioRoutes");
const fichajeRoutes = require("./routes/fichajeRoutes");
const nominaRoutes = require("./routes/nominaRoutes");
require("dotenv").config();

const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (fotos de perfil)
app.use("/uploads/fotos", express.static(path.join(__dirname, "uploads/fotos")));
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/fichajes", fichajeRoutes);
app.use("/api/nominas", nominaRoutes);
// Conexión a la Base de Datos

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("🟢 Conectado a la base de datos MongoDB con éxito"))
  .catch((error) => console.error("🔴 Error al conectar a MongoDB:", error));

// Ruta de prueba para ver que funciona
app.get("/", (_req, res) => {
  res.send("¡El motor del TFG está en marcha!");
});

// Encendemos el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

console.log("¡Hola! El backend del TFG está listo para recibir solicitudes.");
