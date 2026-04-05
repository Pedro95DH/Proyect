const probarLogin = async () => {
  try {
    console.log("LLamando a la puerta del servidor...");

    // Hacemos una petición POST exacta a la que haría Angular
    const respuesta = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@empresa.com",
        password: "Admin1234!", // Las credenciales exactas de tu semilla
      }),
    });

    const datos = await respuesta.json();

    console.log("Respuesta del portero:");
    console.log(datos);
  } catch (error) {
    console.error("Error al conectar:", error);
  }
};

probarLogin();
