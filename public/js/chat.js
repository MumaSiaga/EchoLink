document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, currentUserId:', window.currentUserId);

  // Single socket connection for both chat and notifications
  const socket = io({ query: { userId: window.currentUserId } });

  // Initialize notification count on page load
  try {
    const response = await fetch('/notifications/list');
    if (response.ok) {
      const notifications = await response.json();
      const unreadCount = notifications.filter(n => !n.read).length;
      updateNotificationCount(unreadCount);
    }
  } catch (error) {
    console.error('Error fetching initial notification count:', error);
  }

  socket.on('connect', () => {
    console.log('Socket connected with id:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('newNotification', (notif) => {
    console.log('New Notification received:', notif);
    incrementNotificationCount();
  });

  // Add this function to update notification count
  function updateNotificationCount(count) {
    const notifCountElem = document.getElementById('notif-count');
    if (notifCountElem) {
      if (count > 0) {
        notifCountElem.textContent = count;
        notifCountElem.style.display = 'inline-block';
      } else {
        notifCountElem.textContent = '';
        notifCountElem.style.display = 'none';
      }
      console.log('Notification count updated to:', count);
    } else {
      console.warn('notif-count element not found');
    }
  }

  function incrementNotificationCount() {
    const notifCountElem = document.getElementById('notif-count');
    if (notifCountElem) {
      let currentCount = parseInt(notifCountElem.textContent.trim()) || 0;
      updateNotificationCount(currentCount + 1);
    } else {
      console.warn('notif-count element not found');
    }
  }
});


  
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('chat-history-list');
  if (!container) return;

  try {
    const res = await fetch('/chat/history');
    const history = await res.json();

    if (!history.length) {
      container.innerHTML = '<p style="color:#888;">No previous chats</p>';
      return;
    }

    history.forEach(chat => {
      const div = document.createElement('div');
      div.className = 'chat-history-item';

     const isPrivateOrClosed = chat.ProfileStatus === 'Private' || chat.isClosed;

    const name = isPrivateOrClosed ? 'Peer' : chat.username;
    let profilePic = isPrivateOrClosed ? '/images/profile.jpg' : (chat.profilePicture || '/images/profile.jpg');
      
      const lastMessage = chat.lastMessage || '';
      
      div.innerHTML = `
      <img src="${profilePic}" class="chat-icon" alt="User" />
      <div class="chat-info">
        <strong>
          ${name}
          ${chat.verified === 'true'
            ? '<img src="/images/verified.png" alt="Verified" title="Verified" style="width: 16px; height: 16px; margin-left: 1px; vertical-align: middle;">'
            : ''}
        </strong>
        <p>${lastMessage}</p>
      </div>
    `;

      div.addEventListener('click', () => {
        if (!chat.isClosed) {
          window.location.href = `/chat`;
        } else {
          alert(`This chat is closed. You can view past messages.`);
          window.location.href = `/chat/view/${chat.chatId}`;
        }
      });

      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
});



document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const userId = window.currentUserId;
  const username = window.username;

  let roomId = null;
  let chatId = null;

 
  socket.emit('joinQueue', { userId });


  socket.on('chatStarted', ({ roomId: r, chatId: c, messages = [] }) => {
    roomId = r;
    chatId = c;

    document.getElementById('status').innerText = "Connected";
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';

    messages.forEach(({ sender, content, timestamp }) => {
      appendMessage(sender, content, timestamp);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });

  socket.on('receiveMessage', ({ senderId, message, timestamp, senderName }) => {
    appendMessage(senderId, message, timestamp, senderName);
  });

  
  socket.on('typingNotification', ({ senderId, isTyping }) => {
    if (senderId !== userId) {
      const status = document.getElementById('status');
      status.textContent = isTyping ? 'typing...' : '';
    }
  });

  socket.on('userRevealedName', ({ userId: revealedId, username: revealedName }) => {
    const allMessages = document.querySelectorAll('.message');
    allMessages.forEach(msg => {
      const label = msg.querySelector('.username-label');
      if (msg.classList.contains('other') && label.textContent === 'Peer' && revealedId !== userId) {
        label.textContent = revealedName;
      }
    });
  });
socket.on('refreshPage', () => {
  window.location.reload();
});
  
  socket.on('unmatched', () => {
    alert('You have been unmatched.');
    document.getElementById('chat-box').innerHTML = '';
    document.getElementById('status').textContent = '';
    socket.emit('joinQueue', { userId });
  });

 
  const form = document.getElementById('chat-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('msg');
    const message = input.value.trim();
    if (!message || !roomId || !chatId) return;

    socket.emit('sendMessage', {
      roomId,
      senderId: userId,
      chatId,
      message
    });

    input.value = '';
  });

  
  const input = document.getElementById('msg');
  input.addEventListener('input', () => {
    if (!roomId) return;

    socket.emit('typing', { roomId, senderId: userId, isTyping: true });

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('typing', { roomId, senderId: userId, isTyping: false });
    }, 3000);
  });

  document.getElementById('unmatch-btn').addEventListener('click', () => {
    socket.emit('unmatch', { userId });
  });

 
  function appendMessage(sender, content, timestamp, senderName) {
    const isYou = sender === userId;

    const bubble = document.createElement('div');
    bubble.classList.add('message', isYou ? 'me' : 'other');

    const nameLabel = document.createElement('div');
    nameLabel.classList.add('username-label');
    nameLabel.textContent = senderName || (isYou ? 'You' : 'Peer');
    bubble.appendChild(nameLabel);

    const messageText = document.createElement('div');
    messageText.textContent = content;
    bubble.appendChild(messageText);

    const timeElem = document.createElement('small');
    timeElem.classList.add('timestamp');
    timeElem.textContent = new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    bubble.appendChild(timeElem);

    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
