export function showNotification(message, type) {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");

  notification.classList.add(
    "text-white",
    "p-2",
    "rounded-3",
    "m-2",
    "shadow",
    "d-inline-block",
  );
  // "notification"
  if (type === "success" || type === "success")
  {
    notification.classList.remove("bg-danger");
    notification.classList.remove("bg-warning");
    notification.classList.add("bg-success");
    }
  if (type === "warning")
  {
    notification.classList.remove("bg-danger");
    notification.classList.remove("bg-success");
    notification.classList.add("bg-warning");
  }
  else {
    notification.classList.remove("bg-danger");
    notification.classList.remove("bg-warning");
    notification.classList.add("bg-danger");
  }

  notification.textContent = message;

  container.appendChild(notification);

  // Automatically remove the notification after 5 seconds
  setTimeout(() => {
    container.removeChild(notification);
  }, 3000);
}

export function showNotificationPopup(userName, message) {
  const notificationContainer = document.getElementById(
    "notification-container"
  );
  if (!notificationContainer) return;

  const notification = document.createElement("div");
  notification.className =
    "toast show align-items-center text-bg-primary border-0 mb-2";
  notification.role = "alert";
  notification.ariaLive = "assertive";
  notification.ariaAtomic = "true";

  const notificationBody = document.createElement("div");
  notificationBody.className = "d-flex";

  const notificationContent = document.createElement('div');
  notificationContent.className = 'toast-body';
  notificationContent.textContent = `${userName} ${message}`;
  // notificationContent.textContent = `${userName} has sent you a message `;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close btn-close-white me-2 m-auto";
  closeButton.ariaLabel = "Close";
  closeButton.addEventListener("click", () => {
    notification.remove();
  });

  notificationBody.appendChild(notificationContent);
  notificationBody.appendChild(closeButton);
  notification.appendChild(notificationBody);
  notificationContainer.appendChild(notification);

  // Auto-remove notification after 5 seconds
  setTimeout(() => {
    if (notification) {
      notification.remove();
    }
  }, 5000);
}
