export function Error404_html() {
  return `
    <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center bg-light">
      <h1 class="display-1 text-danger">404</h1>
      <h2 class="mb-3">Page Not Found</h2>
      <p class="text-muted mb-3">Cabraping apologizes but the page you are looking for does not exist.</p>
      <a href="#/" class="btn btn-primary mt-2">Go to Home</a>
    </div>
  `;
}
