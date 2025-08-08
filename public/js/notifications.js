let currentNotificationId = null;
const modal = document.getElementById('notificationModal');
const modalReadBtn = document.getElementById('modalReadBtn');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');


function openModal(notificationId) {
  currentNotificationId = notificationId;
  modal.style.display = 'block';
}

function closeModal() {
  modal.style.display = 'none';
  currentNotificationId = null;
}


window.onclick = function(event) {
  if (event.target === modal) {
    closeModal();
  }
}

async function markAllAsRead() {
  try {
    const res = await fetch('/notifications/list');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const notifications = await res.json();

    const unreadNotificationIds = notifications
      .filter(n => !n.read)
      .map(n => n._id);

    if (unreadNotificationIds.length > 0) {
      const promises = unreadNotificationIds.map(id => 
        fetch(`/notifications/${id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      
      await Promise.all(promises);
      console.log('All notifications marked as read');
      
      
      loadNotifications();
    }
  } catch (err) {
    console.error('Error marking notifications as read:', err);
  }
}

async function deleteAllNotifications() {
  if (!confirm('Are you sure you want to delete all notifications?')) {
    return;
  }

  try {
    const res = await fetch('/notifications/list');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const notifications = await res.json();

    const notificationIds = notifications.map(n => n._id);

    if (notificationIds.length > 0) {
      const promises = notificationIds.map(id => 
        fetch(`/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      
      await Promise.all(promises);
      console.log('All notifications deleted');
      
      loadNotifications();
    }
  } catch (err) {
    console.error('Error deleting notifications:', err);
  }
}

async function markSingleAsRead(notificationId) {
  try {
    const response = await fetch(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('Notification marked as read');
      closeModal();
      
      loadNotifications();
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

async function deleteSingleNotification(notificationId) {
  try {
    const response = await fetch(`/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('Notification deleted');
      closeModal();
      
      loadNotifications();
    }
  } catch (err) {
    console.error('Error deleting notification:', err);
  }
}

function getNotificationIcon(type) {
  const icons = {
    'default': '🔔'
  };
  return icons[type] || icons.default;
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInHours = Math.floor((now - notificationTime) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}

function highlightKeywords(text) {
 
  text = text.replace(/\b(completed|successfully|matched)\b/gi, '<span class="highlight-positive">$1</span>');
  
  
  text = text.replace(/\b(expire|expired|urgent|failed)\b/gi, '<span class="highlight-negative">$1</span>');
  
  
  text = text.replace(/\b(\$[\d,]+|\d{1,2}\/\d{1,2}\/\d{4}|Apartment \d+)\b/g, '<span class="highlight-bold">$1</span>');
  
  return text;
}

async function loadNotifications() {
  try {
    const res = await fetch('/notifications/list');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const notifications = await res.json();

    const list = document.getElementById('notifications-list');
    list.innerHTML = '';

    if (notifications.length === 0) {
      list.innerHTML = '<li>No notifications</li>';
      return;
    }

    notifications.forEach(n => {
      const li = document.createElement('li');
      
      
      const iconDiv = document.createElement('div');
      iconDiv.className = 'notification-icon';
      iconDiv.textContent = getNotificationIcon(n.type);
      
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'notification-content';
      
      
      const headerDiv = document.createElement('div');
      headerDiv.className = 'notification-header';
      
      const titleDiv = document.createElement('h3');
      titleDiv.className = 'notification-title';
      titleDiv.textContent = n.title;
      
      const timeDiv = document.createElement('p');
      timeDiv.className = 'notification-time';
      timeDiv.textContent = formatTimeAgo(n.createdAt);
      
      headerDiv.appendChild(titleDiv);
      headerDiv.appendChild(timeDiv);
      
     
      const descDiv = document.createElement('p');
      descDiv.className = 'notification-description';
      descDiv.innerHTML = highlightKeywords(n.body);
      
      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(descDiv);
      
     
      contentDiv.addEventListener('click', async () => {
        
        if (!n.read) {
          await markSingleAsRead(n._id);
        }
        
    
      });

     
      const threeDots = document.createElement('div');
      threeDots.className = 'three-dots';
      threeDots.innerHTML = '⋯';
      threeDots.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(n._id);
      });

      
      li.appendChild(iconDiv);
      li.appendChild(contentDiv);
      li.appendChild(threeDots);

      
      if (n.read) {
        li.classList.add('read');
      }

      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('notifications-list').innerHTML = '<li>Error loading notifications</li>';
  }
}


document.addEventListener('DOMContentLoaded', () => {

  loadNotifications();


  const markAllReadBtn = document.getElementById('mark-all-read');
  const deleteAllBtn = document.getElementById('delete-all');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', deleteAllNotifications);
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
  }


  if (modalReadBtn) {
    modalReadBtn.addEventListener('click', () => {
      if (currentNotificationId) {
        markSingleAsRead(currentNotificationId);
      }
    });
  }

  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', () => {
      if (currentNotificationId) {
        deleteSingleNotification(currentNotificationId);
      }
    });
  }

  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', closeModal);
  }
});
