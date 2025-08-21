// public/js/socket-global.js
(() => {
  const socket = io();

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);

    if (window.currentUserId) {
      socket.emit('joinQueue', { userId: window.currentUserId });
      console.log('joinQueue emitted for userId:', window.currentUserId);
    } else {
      console.warn('currentUserId not found on window');
    }
  });

  socket.on('chatStarted', ({ roomId, chatId, messages }) => {
    console.log('Chat started in room:', roomId);
    window.currentRoomId = roomId;
    window.currentChatId = chatId;
  });

  socket.on('receiveMessage', ({ senderId, message, timestamp, senderName }) => {
    console.log('Message received:', { senderId, message });
  });

  socket.on('typingNotification', ({ senderId, isTyping }) => {
    console.log(`User ${senderId} is ${isTyping ? 'typing...' : 'not typing'}`);
  });

  socket.on('unmatched', () => {
    console.log('You have been unmatched.');
    window.currentRoomId = null;
    window.currentChatId = null;
  });

  socket.on('refreshPage', () => {
    console.log('Received refreshPage event');
    window.location.reload();
  });

  window.globalSocket = socket;
})();
