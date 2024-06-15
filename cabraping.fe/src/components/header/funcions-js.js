export function Header_js() {
  // Acceder al botón, al menú y al elemento header
  const navbarToggler = document.getElementById("navbarToggle");
  const navbarMenu = document.getElementById("navbarNav");
  const headerElement = document.getElementById("nav"); // Asegúrate de que este selector coincida con tu elemento header

  // Añadir evento de clic al toggler
  if (navbarToggler && navbarMenu && headerElement) {
    navbarToggler.addEventListener("click", function () {
      // Toggle de la clase 'collapse' para el menú
      navbarMenu.classList.toggle("collapse");

      // Cambiar el display del header a 'block' cada vez que se haga clic
      if (headerElement.classList.contains("d-flex")) {
        // console.log("on");
        headerElement.classList.replace("d-flex", "d-block");
      } else {
        // console.log("ffn");
        headerElement.classList.replace("d-block", "d-flex");
      }
    });
  } else {
    //console.log("One or more navbar elements are not found!");
  }
}
