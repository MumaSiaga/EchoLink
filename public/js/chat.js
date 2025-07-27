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

    document.getElementById('status').innerText = "You can chat now!";
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
    document.getElementById('status').textContent = 'Looking for a match...';
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
