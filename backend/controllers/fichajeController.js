const Fichaje = require("../models/Fichaje");

// Registra la hora de entrada del empleado autenticado
const ficharEntrada = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Calculamos el inicio y fin del día de hoy para buscar fichajes de hoy
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    // Comprobamos si ya existe un fichaje abierto (sin hora de salida) de hoy
    const fichajeAbierto = await Fichaje.findOne({
      usuario: usuarioId,
      horaEntrada: { $gte: inicioDia, $lte: finDia },
      horaSalida: { $exists: false },
    });

    if (fichajeAbierto) {
      return res.status(400).json({
        mensaje: "Ya tienes un fichaje abierto. Debes fichar la salida antes de registrar una nueva entrada.",
      });
    }

    // Creamos el fichaje con la hora actual como entrada
    const nuevoFichaje = new Fichaje({
      usuario: usuarioId,
      horaEntrada: new Date(),
    });

    await nuevoFichaje.save();

    res.status(201).json({
      mensaje: "¡Entrada fichada correctamente!",
      fichaje: nuevoFichaje,
    });
  } catch (error) {
    console.error("Error al fichar entrada:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Busca el fichaje abierto de hoy y le añade la hora de salida
const ficharSalida = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    // Buscamos el fichaje de hoy que aún no tenga hora de salida
    const fichajeAbierto = await Fichaje.findOne({
      usuario: usuarioId,
      horaEntrada: { $gte: inicioDia, $lte: finDia },
      horaSalida: { $exists: false },
    });

    if (!fichajeAbierto) {
      return res.status(404).json({
        mensaje: "No se encontró un fichaje de entrada abierto para hoy. ¿Has fichado la entrada?",
      });
    }

    fichajeAbierto.horaSalida = new Date();
    await fichajeAbierto.save();

    // Calculamos las horas trabajadas restando entrada y salida para mostrarlas en la respuesta
    const msTrabajados = fichajeAbierto.horaSalida - fichajeAbierto.horaEntrada;
    const horasTrabajadas = (msTrabajados / (1000 * 60 * 60)).toFixed(2);

    res.json({
      mensaje: "¡Salida fichada correctamente!",
      fichaje: fichajeAbierto,
      horasTrabajadas: `${horasTrabajadas} horas`,
    });
  } catch (error) {
    console.error("Error al fichar salida:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Devuelve el historial de fichajes del empleado autenticado, con filtro opcional por mes y año
const obtenerMisFichajes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Parámetros opcionales de filtro: ?mes=5&anio=2025
    const { mes, anio } = req.query;

    const filtro = { usuario: usuarioId };

    // Si se pasan mes y año, filtramos por ese período concreto
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const inicioPeriodo = new Date(anioNum, mesNum - 1, 1);
      const finPeriodo = new Date(anioNum, mesNum, 0, 23, 59, 59);
      filtro.horaEntrada = { $gte: inicioPeriodo, $lte: finPeriodo };
    }

    const fichajes = await Fichaje.find(filtro)
      .sort({ horaEntrada: -1 })
      .limit(50);

    // Calculamos las horas trabajadas de cada fichaje para incluirlas en la respuesta
    const fichajesConHoras = fichajes.map((f) => {
      let horasTrabajadas = null;
      if (f.horaSalida) {
        const ms = f.horaSalida - f.horaEntrada;
        horasTrabajadas = (ms / (1000 * 60 * 60)).toFixed(2);
      }
      return {
        _id: f._id,
        horaEntrada: f.horaEntrada,
        horaSalida: f.horaSalida || null,
        horasTrabajadas: horasTrabajadas ? `${horasTrabajadas}h` : "En curso",
        createdAt: f.createdAt,
      };
    });

    res.json({
      total: fichajesConHoras.length,
      fichajes: fichajesConHoras,
    });
  } catch (error) {
    console.error("Error al obtener fichajes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Devuelve los fichajes de todos los empleados, accesible solo por RRHH y ADMIN
const obtenerTodosFichajes = async (req, res) => {
  try {
    const { mes, anio, usuarioId } = req.query;

    const filtro = {};

    // Permite filtrar por empleado concreto si se pasa el id por query
    if (usuarioId) {
      filtro.usuario = usuarioId;
    }

    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const inicioPeriodo = new Date(anioNum, mesNum - 1, 1);
      const finPeriodo = new Date(anioNum, mesNum, 0, 23, 59, 59);
      filtro.horaEntrada = { $gte: inicioPeriodo, $lte: finPeriodo };
    }

    // Hacemos populate para incluir nombre, dni y email del empleado en cada fichaje
    const fichajes = await Fichaje.find(filtro)
      .populate("usuario", "nombre dni email")
      .sort({ horaEntrada: -1 })
      .limit(200);

    const fichajesConHoras = fichajes.map((f) => {
      let horasTrabajadas = null;
      if (f.horaSalida) {
        const ms = f.horaSalida - f.horaEntrada;
        horasTrabajadas = (ms / (1000 * 60 * 60)).toFixed(2);
      }
      return {
        _id: f._id,
        usuario: f.usuario,
        horaEntrada: f.horaEntrada,
        horaSalida: f.horaSalida || null,
        horasTrabajadas: horasTrabajadas ? `${horasTrabajadas}h` : "En curso",
        createdAt: f.createdAt,
      };
    });

    res.json({ total: fichajesConHoras.length, fichajes: fichajesConHoras });
  } catch (error) {
    console.error("Error al obtener todos los fichajes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Elimina un fichaje de la BD de forma definitiva, accesible solo por RRHH
const hardDeleteFichaje = async (req, res) => {
  try {
    const { id } = req.params;

    const fichaje = await Fichaje.findByIdAndDelete(id);
    if (!fichaje) {
      return res.status(404).json({ mensaje: "Fichaje no encontrado." });
    }

    res.json({ mensaje: "Fichaje eliminado definitivamente." });
  } catch (error) {
    console.error("Error en hard delete de fichaje:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { ficharEntrada, ficharSalida, obtenerMisFichajes, obtenerTodosFichajes, hardDeleteFichaje };
  