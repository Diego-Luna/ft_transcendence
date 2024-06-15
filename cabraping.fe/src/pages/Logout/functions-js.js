export function LogoutPage_js() {
    localStorage.removeItem("jwt");
    window.location.replace("");
    localStorage.clear();
    return "";
  }
