const hacerPruebaCompleta = async () => {
  try {
    console.log("1️⃣ Iniciando sesión como Administrador...");

    // Paso 1: Hacemos Login
    const respuestaLogin = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@empresa.com",
        password: "Admin1234!",
      }),
    });

    const datosLogin = await respuestaLogin.json();

    // Si falla el login, paramos aquí
    if (!datosLogin.token) {
      console.log("🔴 Error en el login:", datosLogin.mensaje);
      return;
    }

    const token = datosLogin.token;
    console.log("✅ Pase VIP obtenido con éxito.");
    console.log("-----------------------------------");

    console.log("2️⃣ Intentando crear un empleado nuevo...");

    // Paso 2: Usamos el token para crear al empleado
    const respuestaCrear = await fetch(
      "http://localhost:3000/api/usuarios/crear",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🚨 AQUÍ ESTÁ LA MAGIA: Le pasamos el token al guardia
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: "Juan Pérez",
          dni: "87654321B",
          email: "juan@empresa.com",
          password: "JuanPassword123!",
        }),
      },
    );

    const datosCrear = await respuestaCrear.json();

    console.log("📋 Respuesta del servidor al crear empleado:");
    console.log(datosCrear);
  } catch (error) {
    console.error("Error al conectar con el servidor:", error);
  }
};

hacerPruebaCompleta();
