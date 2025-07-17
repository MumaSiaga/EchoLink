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


  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (uploadForm) {
        uploadForm.submit();
      }
    });
  }

 
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

function addStory() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.multiple = false;

  input.onchange = async () => {
    const file = input.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('story', file); 

      try {
        const res = await fetch('/stories/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error(await res.text());

        location.reload();
      } catch (err) {
        console.error(err);
        alert('Failed to upload story.');
      }
    }
  };

  input.click(); 
}

 const ageModal = document.getElementById('ageModal');
  const editAgeBtn = document.getElementById('editAgeBtn');

  editAgeBtn.addEventListener('click', () => {
    ageModal.style.display = 'block';
  });

  function closeAgeModal() {
    ageModal.style.display = 'none';
  }

 
  window.onclick = function(event) {
    if (event.target == ageModal) {
      closeAgeModal();
    }
  }

    


    
  
