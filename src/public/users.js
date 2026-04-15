(() => {
  const csrfToken =
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
    document.getElementById('csrf-token')?.value ||
    '';
  const userModal = document.getElementById('user-modal');
  const resetModal = document.getElementById('reset-modal');
  const createButton = document.querySelector('[data-open-user]');
  const closeUser = document.querySelector('[data-close-user]');
  const closeReset = document.querySelector('[data-close-reset]');
  const createForm = document.getElementById('user-create-form');
  const resetForm = document.getElementById('reset-form');
  let resetUserId = null;

  const sendJson = async (url, payload) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken || ''
      },
      body: JSON.stringify({ ...payload, _csrf: csrfToken })
    });
    const data = await response.json().catch(() => ({}));
    return response.ok ? data : { ok: false, message: data.message || 'Request failed.' };
  };

  if (createButton && userModal) {
    createButton.addEventListener('click', () => {
      userModal.hidden = false;
      userModal.style.display = 'grid';
    });
  }

  if (closeUser && userModal) {
    closeUser.addEventListener('click', () => {
      userModal.hidden = true;
      userModal.style.display = 'none';
    });
  }

  if (closeReset && resetModal) {
    closeReset.addEventListener('click', () => {
      resetModal.hidden = true;
      resetModal.style.display = 'none';
    });
  }

  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(createForm));
      if (!csrfToken) {
        window.showToast?.('Session expired. Refresh and try again.');
        return;
      }
      const result = await sendJson('/users/create', data);
      if (result.ok) {
        window.showToast?.('User created.');
        window.location.reload();
      } else {
        window.showToast?.(result.message || 'Unable to create user.');
      }
    });
  }

  document.querySelectorAll('.username-input').forEach((input) => {
    input.addEventListener('blur', async (event) => {
      const row = event.target.closest('tr');
      const id = row.dataset.id;
      const username = event.target.value.trim();
      if (!username) {
        window.showToast?.('Username cannot be empty.');
        return;
      }
      const result = await sendJson('/users/update-username', { id, username });
      if (result.ok) {
        window.showToast?.('Username updated.');
      } else {
        window.showToast?.(result.message || 'Unable to update username.');
      }
    });
  });

  document.querySelectorAll('.role-select').forEach((select) => {
    select.addEventListener('change', async (event) => {
      const row = event.target.closest('tr');
      const id = row.dataset.id;
      const result = await sendJson('/users/update-role', { id, roleCode: event.target.value });
      if (result.ok) {
        window.showToast?.('Role updated.');
      } else {
        window.showToast?.(result.message || 'Unable to update role.');
      }
    });
  });

  document.querySelectorAll('[data-toggle-active]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const row = event.target.closest('tr');
      const id = row.dataset.id;
      const isActive = event.target.textContent.trim() === 'Activate';
      if (!isActive) {
        const confirmed = confirm('Deactivate this account?');
        if (!confirmed) {
          return;
        }
      }
      const result = await sendJson('/users/toggle-active', { id, isActive });
      if (result.ok) {
        window.showToast?.('User status updated.');
        window.location.reload();
      } else {
        window.showToast?.(result.message || 'Unable to update status.');
      }
    });
  });

  document.querySelectorAll('[data-reset-password]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const row = event.target.closest('tr');
      resetUserId = row.dataset.id;
      resetModal.hidden = false;
      resetModal.style.display = 'grid';
    });
  });

  if (resetForm) {
    resetForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const confirmed = confirm('Reset this user\'s password?');
      if (!confirmed) {
        return;
      }
      const data = Object.fromEntries(new FormData(resetForm));
      const result = await sendJson('/users/reset-password', { id: resetUserId, newPassword: data.newPassword });
      if (result.ok) {
        window.showToast?.('Password reset.');
        window.location.reload();
      } else {
        window.showToast?.(result.message || 'Unable to reset password.');
      }
    });
  }

  document.querySelectorAll('[data-unlock]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const row = event.target.closest('tr');
      const id = row.dataset.id;
      const result = await sendJson('/users/unlock', { id });
      if (result.ok) {
        window.showToast?.('Account unlocked.');
        window.location.reload();
      } else {
        window.showToast?.(result.message || 'Unable to unlock account.');
      }
    });
  });

  document.querySelectorAll('[data-delete-user]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const confirmed = confirm('Delete this user account?');
      if (!confirmed) {
        return;
      }
      const row = event.target.closest('tr');
      const id = row.dataset.id;
      const result = await sendJson('/users/delete', { id });
      if (result.ok) {
        window.showToast?.('User deleted.');
        window.location.reload();
      } else {
        window.showToast?.(result.message || 'Unable to delete user.');
      }
    });
  });
})();
