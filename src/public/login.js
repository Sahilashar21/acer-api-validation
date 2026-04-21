(() => {
  const toggle = document.querySelector('[data-toggle-password]');
  const passwordInput = document.querySelector('input[name="password"]');

  if (!toggle || !passwordInput) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggle.textContent = isPassword ? 'Hide' : 'Show';
  });
})();
