// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

export function Home_js() {
  let buttonAuth = document.getElementById("button-auth");

  if (buttonAuth) {
    buttonAuth.addEventListener("click", handleButtonClick);
  }

  return null;
}

async function redirect42() {
  const redirectURI = encodeURIComponent(`${BACKEND_URL}/api/callback/`);

  try {
    // Fetch configuration from backend
    const response = await fetch(`${BACKEND_URL}/auth42/config`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const config = await response.json();

    if (config) {
      const UID = config.UID;
      const SECRET = config.SECRET;

      // console.log(UID);
      // Construct API URL with fetched UID
      const api_url = `https://api.intra.42.fr/oauth/authorize?client_id=${UID}&redirect_uri=${redirectURI}&response_type=code`;

      // Redirect the browser to the constructed API URL
      window.location.href = api_url;
    } else {
      console.error("Failed to fetch config.");
    }
  } catch (error) {
    console.error("Error fetching config:", error);
    // Handle error (e.g., show error message or fallback behavior)
  }
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  return { access_token, refresh_token };
}

function storeTokens(access_token, refresh_token) {
  localStorage.setItem("jwt", access_token);
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
}

async function handleLogin() {
  const { access_token, refresh_token } = getQueryParams();
  if (access_token && refresh_token) {
    storeTokens(access_token, refresh_token);
    window.history.replaceState({}, document.title, "/"); // Clean URL
    // Update UI or state to reflect login
  }
}

handleLogin();

async function handleButtonClick() {
  redirect42();
}
