import { showNotification } from '../../components/showNotification.js';
import { getHash } from '../../utils/getHash.js';

// Extract the IP address from the URL used to access the frontend
const frontendURL = new URL(window.location.href);
const serverIPAddress = frontendURL.hostname;
const serverPort = 8000; // Specify the port your backend server is running on
const BACKEND_URL = `http://${serverIPAddress}:${serverPort}`;

let jwt;
let myUser = null;
let userId = null;

export async function User_js() {
  jwt = localStorage.getItem('jwt');
  if (!jwt) {
    window.location.href = '/#';
    return;
  }

  userId = getHash() || null;
  if (userId === '/') userId = null;

  await updateInfo();

  const form = document.getElementById('data-info');
  if (form) {
    console.log("-> form is valid");
    form.addEventListener('submit', FormSendData);
  }
}

async function updateInfo() {
  let responseUsers;

  // Fetch all users
  responseUsers = await fetch(`${BACKEND_URL}/api/users/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const users = await responseUsers.json();
  console.log("---> All users:", users);

  if (userId) {
    myUser = users.find(user => user.id === parseInt(userId));
  } else {
    const responseMyUser = await fetch(`${BACKEND_URL}/api/me-full/`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    myUser = await responseMyUser.json();
  }

  if (!myUser || myUser.code === "user_not_found" || myUser.code === "token_not_valid") {
    window.location.replace("/#logout");
    return;
  }

  // Set the values of the input fields
  document.getElementById('username').value = myUser.username;
  document.getElementById('first_name').value = myUser.first_name;
  document.getElementById('last_name').value = myUser.last_name;
  document.getElementById('avatarImage').src = myUser.avatarImageURL;
  document.getElementById('avatarImageURL').value = myUser.avatarImageURL;

  if (userId) {
    // Disable the form fields if viewing another user
    document.getElementById('username').disabled = true;
    document.getElementById('first_name').disabled = true;
    document.getElementById('last_name').disabled = true;
    document.getElementById('avatarImageURL').disabled = true;
    document.querySelector('button[type="submit"]').style.display = 'none';
  }
}

function FormSendData(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const firstName = document.getElementById('first_name').value;
  const lastName = document.getElementById('last_name').value;
  const imageData = document.getElementById('avatarImageURL').value;

  let formData = new Object();
  if (username) formData.username = username;
  if (firstName) formData.first_name = firstName;
  if (lastName) formData.last_name = lastName;
  if (imageData) formData.avatarImageURL = imageData;

  const options = {
    method: 'PATCH',
    body: JSON.stringify(formData),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
    },
  };

  console.log("-> formData");
  console.log(BACKEND_URL + '/api/user/update/' + myUser.id + "/");
  console.log(formData);

  fetch(BACKEND_URL + '/api/user/update/' + myUser.id + "/", options)
    .then(response => {
      if (!response.ok) {
        return response.json().then(text => {
          return Promise.reject(new Error(text.message || 'Unknown error'));
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      showNotification("User successfully updated", "success");
      updateInfo();
    })
    .catch((error) => {
      console.error('Error:', error);
      showNotification("Error updating user! " + error.message, "error");
    });
}
