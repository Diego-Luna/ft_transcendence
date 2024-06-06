// AuthPage.js

import { loginUser } from "./loginUser.js"
import { createUser } from "./createUser.js"
import { validateAndSanitizeInput } from "../../components/security.js";

// export function AuthPageInit() {
export function AuthPage_js() {
  const jwt = localStorage.getItem("jwt");
  if (jwt) {
    window.location.href = "/#";
    return;
  }

  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  // Handler for login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!validateAndSanitizeInput(password) || !validateAndSanitizeInput(username))
      return;

    loginUser(username, password);
  });

  // Handler for registration
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("new-username").value;
    const password = document.getElementById("new-password").value;

    if (!validateAndSanitizeInput(email) || !validateAndSanitizeInput(password))
      return;

    createUser(email, password);
  });
}

