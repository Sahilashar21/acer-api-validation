(() => {
  const uploadForm = document.querySelector('.upload-form');
  const uploadInput = uploadForm ? uploadForm.querySelector('input[type="file"]') : null;
  const dropzone = uploadForm ? uploadForm.querySelector('.dropzone') : null;
  const opsOpen = document.querySelector('[data-ops-open]');
  const opsClose = document.querySelector('[data-ops-close]');
  const opsModal = document.getElementById('ops-modal');
  const changePasswordForm = document.getElementById('change-password-form');
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const updateDropzoneLabel = (fileList) => {
    if (!dropzone) {
      return;
    }

    const title = dropzone.querySelector('.dropzone-title');
    if (!title) {
      return;
    }

    if (fileList && fileList.length) {
      title.textContent = `Selected: ${fileList[0].name}`;
    } else {
      title.textContent = 'Drag and drop file here';
    }
  };

  if (uploadInput) {
    uploadInput.addEventListener('change', (event) => {
      updateDropzoneLabel(event.target.files);
    });
  }

  if (dropzone && uploadInput) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', (event) => {
      const files = event.dataTransfer ? event.dataTransfer.files : null;
      if (!files || !files.length) {
        return;
      }

      uploadInput.files = files;
      updateDropzoneLabel(files);
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', (event) => {
      if (uploadInput && !uploadInput.files.length) {
        event.preventDefault();
        window.showToast?.('Please choose a file to preview.');
        return;
      }

      const button = uploadForm.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Processing...';
    });
  }

  if (opsOpen && opsModal) {
    opsOpen.addEventListener('click', () => {
      opsModal.hidden = false;
      opsModal.style.display = 'grid';
    });
  }

  const closeModal = () => {
    if (opsModal) {
      opsModal.hidden = true;
      opsModal.style.display = 'none';
    }
  };

  if (opsClose && opsModal) {
    opsClose.addEventListener('click', closeModal);
  }

  if (opsModal) {
    opsModal.addEventListener('click', (event) => {
      if (event.target === opsModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(changePasswordForm));

      const response = await fetch('/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.ok) {
        opsModal.hidden = true;
        changePasswordForm.reset();
        window.showToast?.('Password updated.');
      } else {
        window.showToast?.(result.message || 'Unable to update password.');
      }
    });
  }
})();
