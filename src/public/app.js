(() => {
  const healthPill = document.querySelector('[data-health-status]');

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

  document.addEventListener('click', async (event) => {
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
      headers: { 'Content-Type': 'application/json' }
    });
    window.location.href = '/';
  });
})();
