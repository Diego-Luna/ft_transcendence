// AuthPage.js

import { loginUser } from "./loginUser.js"
import { createUser } from "./createUser.js"

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
    loginUser(username, password);
  });

  // Handler for registration
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("new-username").value;
    const password = document.getElementById("new-password").value;
    createUser(email, password);
  });
}

