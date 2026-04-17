# SGFN - Sistema de Gestión de Fichajes y Nóminas

SGFN es una solución web integral **Full-Stack** diseñada para la digitalización del registro de la jornada laboral y la gestión administrativa de empleados en PYMES. La plataforma garantiza el cumplimiento del **Real Decreto-ley 8/2019** mediante un sistema inmutable de fichajes en tiempo real.

## 🚀 Características Principales

- **Registro Horario Inmutable:** Control de entradas y salidas con captura de tiempo del servidor para evitar fraudes.

- **Gestión de Nóminas:** Carga de recibos salariales en PDF por parte de RRHH y descarga segura para el empleado.

- **Seguridad Avanzada:** Autenticación _stateless_ mediante **JSON Web Tokens (JWT)** y cifrado de contraseñas con **Bcrypt**.

- **Control de Acceso (RBAC):** Paneles diferenciados para perfiles de Administrador, RRHH y Empleado.

- **Interfaz Reactiva:** Uso de **Angular Signals** para la actualización eficiente del cronómetro de jornada y notificaciones.

- **Diseño Responsive:** Totalmente adaptado para su uso en tablets y dispositivos móviles mediante Angular Material.

## 🛠️ Stack Tecnológico (MEAN)

- **Frontend:** Angular 17+ (Signals, Standalone Components) y Angular Material.

- **Backend:** Node.js y Express.js.

- **Base de Datos:** MongoDB Atlas (NoSQL) con modelado mediante Mongoose.

- **Gestión de Archivos:** Multer para el procesamiento de archivos PDF.

## 📦 Instalación y Configuración

### Requisitos Previos

- **Node.js** (v20 o superior recomendado).

- Cuenta en **MongoDB Atlas** para la persistencia de datos.

### 1\. Clonar el repositorio

Bash

```
git clone https://github.com/Pedro95DH/Proyect.git
cd Proyect

```

### 2\. Configuración del Backend

Bash

```
cd backend
npm install

```

Crea un archivo `.env` en la carpeta `/backend` con los siguientes parámetros (Se adjunta a la entrega el .env):

Fragmento de código

```
PORT=3000
MONGODB_URI=tu_cadena_de_conexion_mongodb
JWT_SECRET=tu_clave_secreta_para_tokens

```

Arrancar por primera vez la conexión a MongoDB con seed.js para crear un Admin por defecto la primera vez:

Bash

```
node seed.js

El usuario admin que crea por defecto es el siguiente:

( email: "admin@empresa.com", password: "Admin1234!")

```

Arrancar servidor de desarrollo:

Bash

```
node index.js

```

### 3\. Configuración del Frontend

Bash

```
cd ../frontend
npm install

```

Arrancar aplicación cliente:

Bash

```
ng serve

```

La aplicación será accesible en `http://localhost:4200`.

## 📂 Estructura del Proyecto

- `/backend`: API RESTful, modelos de Mongoose, controladores y middlewares de seguridad.

- `/frontend`: Componentes de Angular, servicios de comunicación y guards de ruta.

- `/uploads/nominas`: Carpeta de almacenamiento local para los archivos PDF de nóminas.

## 📂 Estructura del Código

```text
├── backend/
│   ├── config/          # Conexión a MongoDB
│   ├── controllers/     # Lógica de negocio (fichajeController, etc.)
│   ├── middlewares/     # Interceptores (Auth y Roles)
│   ├── models/          # Esquemas Mongoose (Usuario, Fichaje, Nomina)
│   ├── routes/          # Rutas API REST
│   └── app.js           # Entry point
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Vistas y componentes Material
│   │   │   ├── guards/      # Protección de rutas Angular
│   │   │   ├── services/    # Clientes HTTP hacia la API
│   │   │   └── models/      # Interfaces TypeScript
│   └── ...
└── README.md
```

## 📑 Licencia

Este proyecto ha sido desarrollado como **Proyecto de Fin de Ciclo** para el Grado Superior de Desarrollo de Aplicaciones Web (DAW).

---

**Autor:** Pedro Samuel Díaz Hernández
**Tutor:** Raúl Albiol
         