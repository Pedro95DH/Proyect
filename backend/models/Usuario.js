const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
  {
    dni: {
      type: String,
      required: function () {
        return this.rol !== "ADMIN";
      },
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    rol: {
      type: String,
      enum: ["EMPLEADO", "RRHH", "ADMIN"],
      default: "EMPLEADO",
    },
    activo: {
      type: Boolean,
      default: true,
    },
    debeCambiarPassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

usuarioSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Usuario", usuarioSchema);
