const mongoose = require("mongoose");

const fichajeSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    horaEntrada: {
      type: Date,
      required: true,
      default: Date.now,
    },

    horaSalida: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Fichaje", fichajeSchema);
