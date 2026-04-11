const Usuario = require("../models/Usuario");

// Devuelve todos los usuarios de la BD sin el campo password, ordenados por nombre
const listarEmpleados = async (req, res) => {
  try {
    console.log(`[listarEmpleados] Solicitante: ${req.usuario?.rol} (id: ${req.usuario?.id})`);
    const empleados = await Usuario.find({}, "-password").sort({ nombre: 1 });
    console.log(`[listarEmpleados] Devueltos: ${empleados.length} usuarios`);
    res.json({ total: empleados.length, empleados });
  } catch (error) {
    console.error("Error al listar empleados:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Crea un nuevo empleado con los datos del formulario y lo guarda en la BD
const crearEmpleado = async (req, res) => {
  try {
    const { nombre, apellidos, dni, email, telefono, cargo, direccion, password, rol } = req.body;

    // Comprobamos que no exista ya un usuario con ese email o DNI
    const usuarioExistente = await Usuario.findOne({ $or: [{ email }, { dni }] });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "Ya existe un usuario con ese email o DNI." });
    }

    // RRHH puede crear EMPLEADO o RRHH, solo ADMIN puede asignar rol ADMIN
    let rolAsignado = "EMPLEADO";
    if (req.usuario.rol === "ADMIN" && rol) {
      rolAsignado = rol;
    } else if (req.usuario.rol === "RRHH" && rol === "RRHH") {
      rolAsignado = "RRHH";
    }

    // Solo puede existir un ADMIN en el sistema, lo comprobamos antes de crear
    if (rolAsignado === "ADMIN") {
      const adminExistente = await Usuario.findOne({ rol: "ADMIN" });
      if (adminExistente) {
        return res.status(400).json({ mensaje: "Ya existe un administrador. Solo puede haber uno en el sistema." });
      }
    }

    console.log(`[crearEmpleado] Solicitante: ${req.usuario.rol} | Rol solicitado: ${rol} | Rol asignado: ${rolAsignado}`);

    const nuevoEmpleado = new Usuario({
      nombre, apellidos, dni, email,
      telefono, cargo, direccion,
      password,
      rol: rolAsignado,
      debeCambiarPassword: true,
      fotoPerfil: req.file ? req.file.filename : '',
    });

    await nuevoEmpleado.save();

    res.status(201).json({
      mensaje: "Empleado creado correctamente.",
      empleado: {
        _id: nuevoEmpleado._id,
        nombre: nuevoEmpleado.nombre,
        email: nuevoEmpleado.email,
        rol: nuevoEmpleado.rol,
      },
    });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Actualiza los datos de un empleado existente; RRHH no puede tocar cuentas ADMIN
const editarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, email, telefono, cargo, direccion, rol, password } = req.body;

    const empleado = await Usuario.findById(id);
    if (!empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    // RRHH no puede escalar privilegios ni modificar a un usuario con rol ADMIN
    if (req.usuario.rol === "RRHH") {
      if (rol === "ADMIN" || empleado.rol === "ADMIN") {
        return res.status(403).json({
          mensaje: "No tienes permiso para modificar usuarios con rol ADMIN o asignar dicho rol.",
        });
      }
    }

    if (dni) empleado.dni = dni;
    if (email) empleado.email = email;
    if (telefono !== undefined) empleado.telefono = telefono;
    if (cargo !== undefined) empleado.cargo = cargo;
    if (direccion !== undefined) empleado.direccion = direccion;
    if (rol) empleado.rol = rol;

    // Si se envía nueva contraseña, el pre-save la hashea y fuerza cambio en el próximo acceso
    if (password) {
      empleado.password = password;
      empleado.debeCambiarPassword = true;
    }

    // Si se sube una nueva foto, borramos la anterior del disco
    if (req.file) {
      if (empleado.fotoPerfil) {
        const fs = require('fs');
        const path = require('path');
        const rutaAntigua = path.join(__dirname, '../uploads/fotos', empleado.fotoPerfil);
        if (fs.existsSync(rutaAntigua)) fs.unlinkSync(rutaAntigua);
      }
      empleado.fotoPerfil = req.file.filename;
    }

    await empleado.save();

    res.json({
      mensaje: "Empleado actualizado correctamente.",
      empleado: {
        _id: empleado._id,
        nombre: empleado.nombre,
        email: empleado.email,
        dni: empleado.dni,
        rol: empleado.rol,
        activo: empleado.activo,
      },
    });
  } catch (error) {
    console.error("Error al editar empleado:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Marca el empleado como inactivo (activo: false) sin borrar el documento de la BD
const bajaLogica = async (req, res) => {
  try {
    const { id } = req.params;

    const empleado = await Usuario.findById(id);
    if (!empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    // No se puede dar de baja a la cuenta de administrador del sistema
    if (empleado.rol === "ADMIN") {
      return res.status(403).json({
        mensaje: "No se puede dar de baja a la cuenta de administrador del sistema.",
      });
    }

    if (!empleado.activo) {
      return res.status(400).json({ mensaje: "El empleado ya está dado de baja." });
    }

    empleado.activo = false;
    await empleado.save();

    res.json({
      mensaje: `Empleado ${empleado.nombre} dado de baja correctamente (baja lógica).`,
      empleado: { _id: empleado._id, nombre: empleado.nombre, activo: empleado.activo },
    });
  } catch (error) {
    console.error("Error en baja lógica:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Vuelve a poner activo: true en un empleado que estaba dado de baja
const reactivarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    const empleado = await Usuario.findById(id);
    if (!empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    if (empleado.activo) {
      return res.status(400).json({ mensaje: "El empleado ya está activo." });
    }

    empleado.activo = true;
    await empleado.save();

    res.json({
      mensaje: `Empleado ${empleado.nombre} reactivado correctamente.`,
      empleado: { _id: empleado._id, nombre: empleado.nombre, activo: empleado.activo },
    });
  } catch (error) {
    console.error("Error al reactivar empleado:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Elimina el documento del usuario de la BD de forma definitiva (solo ADMIN)
const hardDeleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Un admin no puede borrarse a sí mismo
    if (id === req.usuario.id) {
      return res.status(400).json({ mensaje: "No puedes eliminar tu propia cuenta." });
    }

    // Tampoco se puede eliminar a otro ADMIN
    const empleadoABorrar = await Usuario.findById(id);
    if (empleadoABorrar && empleadoABorrar.rol === "ADMIN") {
      return res.status(403).json({ mensaje: "No se puede eliminar la cuenta de administrador del sistema." });
    }

    const empleado = await Usuario.findByIdAndDelete(id);
    if (!empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado." });
    }

    res.json({
      mensaje: `Usuario ${empleado.nombre} eliminado definitivamente de la base de datos.`,
    });
  } catch (error) {
    console.error("Error en hard delete de usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

module.exports = {
  listarEmpleados,
  crearEmpleado,
  editarEmpleado,
  bajaLogica,
  reactivarEmpleado,
  hardDeleteUsuario,
};
       