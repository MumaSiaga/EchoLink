document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById('profileModal');
  const profilePic = document.getElementById('profilePic');
  const fileInput = document.getElementById('profilePictureInput');
  const uploadForm = document.getElementById('uploadForm');

  // Show modal when profile picture is clicked
  if (profilePic) {
    profilePic.addEventListener('click', () => {
      modal.style.display = 'block';
    });
  }

  // Close the modal
  window.closeModal = function () {
    modal.style.display = 'none';
  };

window.viewPhoto = function () {
  const photoViewer = document.getElementById('photoViewer');
  const modalButtons = document.getElementById('modalButtons');
  const fullPhoto = document.getElementById('fullPhoto');

  modalButtons.style.display = 'none';
  photoViewer.style.display = 'block';
  fullPhoto.src = profilePic.src;
};

window.backToOptions = function () {
  const photoViewer = document.getElementById('photoViewer');
  const modalButtons = document.getElementById('modalButtons');

  photoViewer.style.display = 'none';
  modalButtons.style.display = 'block';
};

  // Auto-submit form when image is selected
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (uploadForm) {
        uploadForm.submit();
      }
    });
  }

  // Close modal if clicked outside modal content
  window.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });
});
document.getElementById('editBioBtn').addEventListener('click', () => {
  document.getElementById('bioForm').style.display = 'block';
  document.getElementById('editBioBtn').style.display = 'none';
});

document.getElementById('cancelBioBtn').addEventListener('click', () => {
  document.getElementById('bioForm').style.display = 'none';
  document.getElementById('editBioBtn').style.display = 'inline-block';
});
