export function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    fetch('/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('jwt', data.access);
        // console.log('Token refreshed');
    })
    .catch(error => {
        // console.error('Error refreshing token:', error);
        window.location.href = '/login';
    });
}

setInterval(refreshToken, 1000 * 60 * 15); //refreshes token every 15 minutes
