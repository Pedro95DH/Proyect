// Herramientas que instalamos
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Conexión a la Base de Datos

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("🟢 Conectado a la base de datos MongoDB con éxito"))
  .catch((error) => console.error("🔴 Error al conectar a MongoDB:", error));

// Ruta de prueba para ver que funciona
app.get("/", (req, res) => {
  res.send("¡El motor del TFG está en marcha!");
});

// Encendemos el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

console.log("¡Hola! El backend del TFG está listo para recibir solicitudes.");
