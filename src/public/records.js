(() => {
  const table = document.querySelector('table');
  const bulkDeleteButton = document.querySelector('[data-bulk-delete]');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastUndo = document.getElementById('toast-undo');
  const selectAll = document.querySelector('.select-all');
  const searchForm = document.querySelector('.search-form');
  const statusSelect = searchForm ? searchForm.querySelector('select[name="status"]') : null;
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  let pendingDelete = null;

  if (!table || !bulkDeleteButton || !selectAll || !toast || !toastMessage || !toastUndo) {
    return;
  }

  const updateBulkState = () => {
    const selected = document.querySelectorAll('.row-select:checked');
    bulkDeleteButton.disabled = selected.length === 0;
  };

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      searchForm.submit();
    });
  }

  selectAll.addEventListener('change', () => {
    document.querySelectorAll('.row-select').forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
    });
    updateBulkState();
  });

  table.addEventListener('change', async (event) => {
    if (event.target.classList.contains('row-select')) {
      updateBulkState();
      return;
    }

    if (event.target.classList.contains('status-select')) {
      const row = event.target.closest('tr');
      const id = row.dataset.id;
      const isValidated = event.target.value;
      event.target.disabled = true;

      const response = await fetch('/records/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify({ id, isValidated })
      });

      const data = await response.json();
      if (data.ok) {
        const badge = row.querySelector('.badge');
        const validatedAtCell = row.querySelector('.validated-at');
        const isValid = data.record.is_validated;
        badge.textContent = isValid ? 'Validated' : 'Pending';
        badge.classList.toggle('success', isValid);
        badge.classList.toggle('pending', !isValid);
        validatedAtCell.textContent = data.record.validated_at
          ? new Date(data.record.validated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '-';
      }

      event.target.disabled = false;
    }
  });

  const scheduleDelete = (rows) => {
    if (pendingDelete) {
      clearTimeout(pendingDelete.timer);
    }

    rows.forEach((row) => row.classList.add('pending-delete'));
    toastMessage.textContent = `${rows.length} record${rows.length === 1 ? '' : 's'} queued for deletion.`;
    toast.hidden = false;

    const ids = rows.map((row) => Number(row.dataset.id));
    const timer = setTimeout(async () => {
      await fetch('/records/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify({ ids })
      });

      rows.forEach((row) => row.remove());
      toast.hidden = true;
      pendingDelete = null;
      updateBulkState();
    }, 5000);

    pendingDelete = { rows, timer };
  };

  table.addEventListener('click', (event) => {
    if (!event.target.matches('[data-delete]')) {
      return;
    }

    const row = event.target.closest('tr');
    const confirmed = confirm('Delete this record?');
    if (!confirmed) {
      return;
    }
    scheduleDelete([row]);
  });

  bulkDeleteButton.addEventListener('click', () => {
    const rows = Array.from(document.querySelectorAll('.row-select:checked')).map((checkbox) => checkbox.closest('tr'));
    if (rows.length) {
      const confirmed = confirm(`Delete ${rows.length} selected record(s)?`);
      if (!confirmed) {
        return;
      }
      scheduleDelete(rows);
    }
  });

  toastUndo.addEventListener('click', () => {
    if (!pendingDelete) {
      return;
    }

    clearTimeout(pendingDelete.timer);
    pendingDelete.rows.forEach((row) => row.classList.remove('pending-delete'));
    pendingDelete = null;
    toast.hidden = true;
  });
})();
