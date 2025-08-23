document.addEventListener('DOMContentLoaded', async () => {
  const socket = window.globalSocket;
  if (!socket) {
    console.error('Global socket not found');
    return;
  }

  const container = document.getElementById('chat-history-list');
  if (container) {
    try {
      const res = await fetch('/chat/history');
      const history = await res.json();

      if (!history.length) {
        container.innerHTML = '<p style="color:#888;">No previous chats</p>';
      } else {
    history.forEach(chat => {
  const div = document.createElement('div');
  div.className = 'chat-history-item';

  if (!chat.isClosed) {
    div.classList.add('active');
  }

  const profilePic = chat.profilePicture || '/images/profile.jpg';

  div.innerHTML = `
    <img src="${profilePic}" class="chat-icon" alt="User" />
  `;

  div.addEventListener('click', () => {
    if (!chat.isClosed) {
      window.location.href = `/chat`;
    } else {
      window.location.href = `/chat/view/${chat.chatId}`;
    }
  });

  // **Prepend active chats, append inactive**
  if (div.classList.contains('active')) {
    container.prepend(div); // active chats go first
  } else {
    container.appendChild(div);
  }
});

      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  const userId = window.currentUserId;
  let roomId = null;
  let chatId = null;

  socket.emit('joinQueue', { userId });

  socket.on('chatStarted', ({ roomId: r, chatId: c, messages = [] }) => {
    roomId = r;
    chatId = c;

    const status = document.getElementById('status');
    if (status) status.innerText = "Connected";

    const chatBox = document.getElementById('chat-box');
    if (chatBox && chatBox.children.length === 0) {
      chatBox.innerHTML = '';
      messages.forEach(({ sender, content, timestamp }) => {
        appendMessage(sender, content, timestamp);
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  socket.on('receiveMessage', ({ senderId, message, timestamp, senderName }) => {
    appendMessage(senderId, message, timestamp, senderName);
  });

  socket.on('typingNotification', ({ senderId, isTyping }) => {
    if (senderId !== userId) {
      const status = document.getElementById('status');
      if (status) status.textContent = isTyping ? 'typing...' : '';
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
    const chatBox = document.getElementById('chat-box');
    if (chatBox) chatBox.innerHTML = '';
    const status = document.getElementById('status');
    if (status) status.textContent = '';
    socket.emit('joinQueue', { userId });
  });

  const form = document.getElementById('chat-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('msg');
      const message = input.value.trim();
      if (!message || !roomId || !chatId) return;

      socket.emit('sendMessage', { roomId, senderId: userId, chatId, message });
      input.value = '';
    });
  }

  const input = document.getElementById('msg');
  if (input) {
    input.addEventListener('input', () => {
      if (!roomId) return;

      socket.emit('typing', { roomId, senderId: userId, isTyping: true });

      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socket.emit('typing', { roomId, senderId: userId, isTyping: false });
      }, 3000);
    });
  }

const menuBtn = document.getElementById("menu-btn");
  const menuDropdown = document.getElementById("menu-dropdown");
  const menuContainer = document.querySelector(".menu-container");

  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent closing immediately
      menuDropdown.classList.toggle("hidden");
    });
  }

  if (menuContainer) {
    menuContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  document.addEventListener("click", () => {
    menuDropdown.classList.add("hidden");
  });
  const unmatchBtn = document.getElementById('unmatch-btn');
if (unmatchBtn) {
  unmatchBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // so it doesn’t close the menu immediately
    socket.emit('unmatch', { userId });
    // Optional: close menu after clicking
    const menuDropdown = document.getElementById("menu-dropdown");
    if (menuDropdown) menuDropdown.classList.add("hidden");
  });
}
  

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
    if (chatBox) {
      chatBox.appendChild(bubble);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }
});
