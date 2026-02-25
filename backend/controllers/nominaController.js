const Nomina = require("../models/Nomina");
const Usuario = require("../models/Usuario");
const path = require("path");
const fs = require("fs");

// Guarda el PDF de una nómina en el servidor y registra el documento en la BD
const subirNomina = async (req, res) => {
  try {
    // El archivo ya fue procesado por multer y está disponible en req.file
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se ha enviado ningún archivo PDF." });
    }

    const { usuarioId, mes, anio } = req.body;

    // Comprobamos que el empleado destinatario existe antes de guardar el archivo
    const empleado = await Usuario.findById(usuarioId);
    if (!empleado) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ mensaje: "El empleado destinatario no existe." });
    }

    // Evitamos duplicados: si ya existe nómina para ese empleado, mes y año, devolvemos error
    const nominaExistente = await Nomina.findOne({
      usuario: usuarioId,
      mes: parseInt(mes),
      anio: parseInt(anio),
    });

    if (nominaExistente) {
      fs.unlinkSync(req.file.path);
      return res.status(409).json({
        mensaje: `Ya existe una nómina para ${empleado.nombre} del mes ${mes}/${anio}.`,
      });
    }

    // Guardamos el registro en la BD con el nombre del archivo (no la ruta completa)
    const nuevaNomina = new Nomina({
      usuario: usuarioId,
      mes: parseInt(mes),
      anio: parseInt(anio),
      rutaArchivo: req.file.filename,
    });

    await nuevaNomina.save();

    res.status(201).json({
      mensaje: "Nómina subida correctamente.",
      nomina: {
        id: nuevaNomina._id,
        empleado: empleado.nombre,
        mes: nuevaNomina.mes,
        anio: nuevaNomina.anio,
      },
    });
  } catch (error) {
    console.error("Error al subir nómina:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Devuelve el listado de nóminas del empleado autenticado, ordenadas de más reciente a más antigua
const obtenerMisNominas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const nominas = await Nomina.find({ usuario: usuarioId }).sort({ anio: -1, mes: -1 });

    res.json({ total: nominas.length, nominas });
  } catch (error) {
    console.error("Error al obtener nóminas:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Envía el PDF de una nómina; un empleado solo puede descargar las suyas propias
const descargarNomina = async (req, res) => {
  try {
    const { nominaId } = req.params;
    const usuarioSolicitante = req.usuario;

    const nomina = await Nomina.findById(nominaId);
    if (!nomina) {
      return res.status(404).json({ mensaje: "Nómina no encontrada." });
    }

    // Si el solicitante es EMPLEADO, comprobamos que la nómina sea suya
    if (
      usuarioSolicitante.rol === "EMPLEADO" &&
      nomina.usuario.toString() !== usuarioSolicitante.id
    ) {
      return res.status(403).json({ mensaje: "No tienes permiso para ver esta nómina." });
    }

    // Construimos la ruta absoluta del archivo PDF en el servidor
    const rutaArchivo = path.join(__dirname, "../uploads/nominas", nomina.rutaArchivo);

    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ mensaje: "El archivo PDF no se encuentra en el servidor." });
    }

    res.download(rutaArchivo, `nomina_${nomina.mes}_${nomina.anio}.pdf`);
  } catch (error) {
    console.error("Error al descargar nómina:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Lista todas las nóminas del sistema con populate del empleado, accesible solo por RRHH y ADMIN
const obtenerTodasNominas = async (req, res) => {
  try {
    const { anio } = req.query;
    const filtro = anio ? { anio: parseInt(anio) } : {};

    const nominas = await Nomina.find(filtro)
      .populate("usuario", "nombre dni email")
      .sort({ anio: -1, mes: -1 });

    res.json({ total: nominas.length, nominas });
  } catch (error) {
    console.error("Error al listar nóminas:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Borra la nómina de la BD y elimina también el archivo PDF del disco
const hardDeleteNomina = async (req, res) => {
  try {
    const { id } = req.params;

    const nomina = await Nomina.findByIdAndDelete(id);
    if (!nomina) {
      return res.status(404).json({ mensaje: "Nómina no encontrada." });
    }

    // Intentamos borrar el PDF del servidor si todavía existe
    const rutaArchivo = path.join(__dirname, "../uploads/nominas", nomina.rutaArchivo);
    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }

    res.json({ mensaje: "Nómina y archivo PDF eliminados definitivamente." });
  } catch (error) {
    console.error("Error en hard delete de nómina:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = { subirNomina, obtenerMisNominas, descargarNomina, obtenerTodasNominas, hardDeleteNomina };
       