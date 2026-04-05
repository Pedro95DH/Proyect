const intentarEntrarSinLlave = async () => {
  console.log("Intentando colarme en la zona VIP sin token...");
  const respuesta = await fetch("http://localhost:3000/api/auth/perfil", {
    method: "GET",
  });

  const datos = await respuesta.json();
  console.log("El servidor responde:", datos);
};

intentarEntrarSinLlave();
