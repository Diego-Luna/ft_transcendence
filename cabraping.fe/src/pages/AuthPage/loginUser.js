import { validateAndSanitizeInput } from "../../components/security.js";
import { showNotification } from "../../components/showNotification.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";

// Extract the IP address from the URL used to access the frontend
// const frontendURL = new URL(window.location.href);
// const serverIPAddress = frontendURL.hostname;
// const serverPort = 8000; // Specify the port your backend server is running on
// const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

// Function to log in
export function loginUser(username, password) {
  // validateAndSanitizeInput
  if (!validateAndSanitizeInput(username) || !validateAndSanitizeInput(password)){
    return;
  }

  fetch(`${BACKEND_URL}/api/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => {
      if (response.ok) {
        showNotification("Successful login", "success");
        return response.json();
      } else {
        showNotification("Incorrect username or password", "error");
        throw new Error("Login failed");
      }
    })
    .then((data) => {
      // console.log("data.access");
      // console.log(data.access);

      localStorage.setItem("jwt", data.access);
      // window.location.href = '/#';
      setTimeout(() => {
        window.location.href = "/#";
      }, 500);
    })
    .catch((error) => {
      //console.log("Error:", error);
    });
}