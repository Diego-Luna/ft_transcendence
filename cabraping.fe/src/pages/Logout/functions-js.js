export function LogoutPage_js() {
    localStorage.removeItem("jwt");
    window.location.replace("");
    localStorage.clear();
    return "";
  }

// import { showNotification } from "../../components/showNotification.js";
// import { Header_html } from "../../components/header/html.js";

// /*export function LogoutPage_js() {
//   localStorage.removeItem("jwt");
//   window.location.replace("");
//   return "";
// }*/

// export async function logoutUser() {
//     try {
//         console.log("Initiating logout request");
//         const response = await fetch("http://127.0.0.1:8000/api/logout/", {
//             method: "POST",
//             headers: {
//                 'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (!response.ok) {
//             showNotification("Error logging out user", "error");
//             throw new Error('Logout failed');
//         }

//         const data = await response.json();
//         console.log('Logout response body:', data);

//         showNotification("Successfully logged out", "success");

//         localStorage.clear(); // Limpiar todo el localStorage

//         window.location.href = '/login';

//     } catch (error) {
//         console.error('Error:', error);
//         showNotification(error.message, "error");
//     }
// }

// // Function to initialize logout button event listeners
// export function initializeLogoutButtons() {
//     const logoutButtons = document.querySelectorAll('#logoutButton');
//     console.log("Logout buttons found:", logoutButtons);
//     logoutButtons.forEach(button => {
//         console.log('Attaching click event to:', button);
//         button.addEventListener('click', (event) => {
//             event.preventDefault();
//             console.log('Logout button clicked');
//             logoutUser();
//         });
//     });
// }

// // Function to render the header and set up the logout button
// /*export async function renderHeaderAndSetupLogout() {
//     const headerContent = await Header_html();
//     const headerElement = document.getElementById('header');
//     headerElement.innerHTML = headerContent;

//     initializeLogoutButtons(); // Initialize logout buttons after rendering the header
// }*/

// // Function to initialize logout page
// export function LogoutPage_js() {
//     console.log("LogoutPage_js initialized"); 
//     document.addEventListener('DOMContentLoaded', (event) => {
//         //renderHeaderAndSetupLogout();
//         initializeLogoutButtons(); // Initialize them globally
//     });
// }

// LogoutPage_js(); // Initialize logout page when the script is loaded