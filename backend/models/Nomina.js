const mongoose = require("mongoose");

const nominaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    mes: {
      type: Number,
      required: true, 
      min: 1,
      max: 12,
    },
    anio: {
      type: Number,
      required: true,
    },
    rutaArchivo: { 
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Nomina", nominaSchema);

     