import { showNotification } from '../../components/showNotification.js';
import getHash from "../../utils/getHash.js";

const BACKEND_URL = "http://localhost:8000";
let jwt;
let myUser = null;
let see_user_id;

export async function User_js() {

  jwt = localStorage.getItem('jwt');
  if (!jwt) {
      window.location.href = '/#';
      return;
  }

  see_user_id = getHash();
  console.log("-- 🤠 💀 -> user_id:", see_user_id);

  await updateInfo();
  // const form = document.getElementById('data-info');
  // if (form) {
  //   console.log("-> form is valid");
  //   form.addEventListener('submit', FormSendData);
  // }

}

async function updateInfo(){

  // const responseMyUser = await fetch(`${BACKEND_URL}/api/me/`, {
  // const responseMyUser = await fetch(`${BACKEND_URL}/api/me-full/`, {
  const responseMyUser = await fetch(`${BACKEND_URL}/api/users/${see_user_id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  myUser = await responseMyUser.json();
  if (myUser.code === "user_not_found" || myUser.code === "token_not_valid") {
    window.location.replace("/#logout");
  }

  // Set the values of the input fields
  document.getElementById('username').value = myUser.username;
  document.getElementById('first_name').value = myUser.first_name;
  document.getElementById('last_name').value = myUser.last_name;
  document.getElementById('avatarImage').src = myUser.avatarImageURL;
}


function FormSendData(event) {

  event.preventDefault();

  const username = document.getElementById('username').value;
  const firstName = document.getElementById('first_name').value;
  const lastName = document.getElementById('last_name').value;
  const imageData = document.getElementById('avatarImageURL').value;

  let formData = new Object();
  if (username) formData.username = username
  if (firstName) formData.first_name = firstName
  if (lastName) formData.last_name = lastName
  if (imageData) formData.avatarImageURL = imageData

  const options = {
    method: 'PATCH',  // Cambiado de POST a PATCH
    body: JSON.stringify(formData),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
    },
  };

  console.log("-> formData");
  console.log(BACKEND_URL + '/api/user/update/'+ myUser.id + "/");
  console.log(formData);

  fetch(BACKEND_URL + '/api/user/update/'+ myUser.id + "/", options)
    .then(response => {
      if (!response.ok) {
        return response.json().then(text => {
          // Handle the error by returning a rejected promise
          return Promise.reject(new Error(text.message || 'Unknown error'));
      });
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      showNotification("Channel successfully created", "success");
      updateInfo();
    })
    .catch((error) => {
      console.error('Error:', error);
      showNotification("Error creating user! " + error.message, "error");
    });
}
