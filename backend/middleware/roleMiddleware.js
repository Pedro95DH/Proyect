// Middlewares de control de roles, se aplican después de verificarToken
// que ya ha guardado los datos del usuario en req.usuario

// Solo permite el acceso al rol ADMIN (usado en borrados físicos)
const esAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === "ADMIN") {
    return next();
  }
  return res.status(403).json({
    mensaje: "Acceso denegado. Se requiere rol de ADMIN.",
  });
};

// Permite el acceso a RRHH y ADMIN (gestión de plantilla, editar empleados, etc.)
const esRRHHoAdmin = (req, res, next) => {
  const rolesPermitidos = ["RRHH", "ADMIN"];
  if (req.usuario && rolesPermitidos.includes(req.usuario.rol)) {
    return next();
  }
  return res.status(403).json({
    mensaje: "Acceso denegado. Se requiere rol de RRHH o ADMIN.",
  });
};

// Permite el acceso solo a RRHH; el ADMIN no puede usar rutas operativas de nóminas y auditoría
const soloRRHH = (req, res, next) => {
  if (req.usuario && req.usuario.rol === "RRHH") {
    return next();
  }
  if (req.usuario && req.usuario.rol === "ADMIN") {
    return res.status(403).json({
      mensaje:
        "Acceso denegado. El rol ADMIN no realiza operaciones de fichaje ni nómina.",
    });
  }
  return res.status(403).json({
    mensaje: "Acceso denegado. Se requiere rol de RRHH.",
  });
};

// Permite el acceso a EMPLEADO y RRHH, bloqueando al ADMIN (fichar, ver nóminas propias, etc.)
const soloNoAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol !== "ADMIN") {
    return next();
  }
  return res.status(403).json({
    mensaje:
      "Acceso denegado. El rol ADMIN no realiza operaciones de fichaje ni nómina.",
  });
};

// Permite el acceso a cualquier usuario con un rol válido del sistema
const esEmpleado = (req, res, next) => {
  const rolesValidos = ["EMPLEADO", "RRHH", "ADMIN"];
  if (req.usuario && rolesValidos.includes(req.usuario.rol)) {
    return next();
  }
  return res.status(403).json({
    mensaje: "Acceso denegado. Rol no reconocido.",
  });
};

// Alias de esRRHHoAdmin para no romper código existente
const esRRHH = esRRHHoAdmin;

module.exports = { esAdmin, esRRHH, esRRHHoAdmin, soloRRHH, soloNoAdmin, esEmpleado };
