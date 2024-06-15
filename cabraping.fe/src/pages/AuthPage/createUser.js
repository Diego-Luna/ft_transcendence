import { validateAndSanitizeInput } from "../../components/security.js";
import { showNotification } from "../../components/showNotification.js";
import { BACKEND_URL } from "../../components/wcGlobal.js";

// Extract the IP address from the URL used to access the frontend
// const frontendURL = new URL(window.location.href);
// const serverIPAddress = frontendURL.hostname;
// const serverPort = 8000; // Specify the port your backend server is running on
// const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

export function createUser(email, password) {

    if (!validateAndSanitizeInput(email) || !validateAndSanitizeInput(password)){
        return;
    }

    const username = email.split('@')[0];

    const img = "https://i.pinimg.com/736x/22/d8/71/22d8716223532ec51ea7b0ea471bbe67.jpg"

    fetch(`${BACKEND_URL}/api/users/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email: email, password, avatarImageURL: img })
    })
    .then(response => {
        if(response.status === 200 || response.status === 201) {
            return response.json(); // Proceed with the success response
        } else {
            // When the response is not 200 or 201, handle it as an error
            throw new Error(`Server responded with status: ${response.status}`);
        }
    })
    .then(data => {
        if(data.error)
        {
            showNotification("Incorrect username or password", "error");
        }
        else
        {
            showNotification("User created successfully", "success");
        }
        // Assuming data contains the response for a successful user creation
    })
    .catch((error) => {
        // Catch any error from the server response or the fetch operation itself
        // Error message can be more user-friendly or detailed based on the actual server response
        // showNotification("Error creating user! " + error.message, "error");
        showNotification("Error creating user. Maybe you have signed up already?");
    });
}