(() => {
  const healthPill = document.querySelector('[data-health-status]');
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const toast = document.getElementById('global-toast');
  const toastMessage = document.getElementById('global-toast-message');

  const updateHealthPill = (health) => {
    if (!healthPill) {
      return;
    }

    healthPill.classList.remove('status-ok', 'status-bad', 'status-checking');
    const latency = health && typeof health.latencyMs === 'number' ? `${health.latencyMs}ms` : '--';

    if (health && health.ok) {
      healthPill.classList.add('status-ok');
      healthPill.textContent = `Healthy • ${latency}`;
      return;
    }

    healthPill.classList.add('status-bad');
    healthPill.textContent = `Degraded • ${latency}`;
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) {
        updateHealthPill({ ok: false });
        return;
      }

      const health = await response.json();
      updateHealthPill(health);
    } catch (error) {
      updateHealthPill({ ok: false });
    }
  };

  fetchHealth();
  setInterval(fetchHealth, 20000);

  window.showToast = (message) => {
    if (!toast || !toastMessage) {
      return;
    }

    toastMessage.textContent = message;
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  };

  document.addEventListener('click', async (event) => {
    const userMenu = event.target.closest('[data-user-menu]');
    const changePassword = event.target.closest('[data-change-password]');
    const opsModal = document.getElementById('ops-modal');

    if (changePassword && opsModal) {
      opsModal.hidden = false;
      opsModal.style.display = 'grid';
      document.querySelectorAll('[data-user-menu].open').forEach((menu) => menu.classList.remove('open'));
      return;
    }

    if (userMenu) {
      userMenu.classList.toggle('open');
      return;
    }

    document.querySelectorAll('[data-user-menu].open').forEach((menu) => {
      menu.classList.remove('open');
    });
    const opsOpen = event.target.closest('[data-ops-open]');
    const opsClose = event.target.closest('[data-ops-close]');

    if (opsOpen && opsModal) {
      opsModal.hidden = false;
      opsModal.style.display = 'grid';
      return;
    }

    if (opsClose && opsModal) {
      opsModal.hidden = true;
      opsModal.style.display = 'none';
      return;
    }

    if (opsModal && event.target === opsModal) {
      opsModal.hidden = true;
      opsModal.style.display = 'none';
      return;
    }

    const resetTrigger = event.target.closest('[data-reset-all]');
    if (!resetTrigger) {
      return;
    }

    const confirmed = confirm('This will delete all serial records and upload logs. Continue?');
    if (!confirmed) {
      return;
    }

    await fetch('/records/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken || ''
      }
    });
    window.showToast?.('Data cleared.');
    window.location.href = '/';
  });
})();
