const Chat = require('../models/Chat');
const User = require('../models/User');
const eventEmitter = require('./event');
let waitingUsers = [];
const socketRoomMap = new Map();
const activeMatches = new Map();
const recentUnmatches = new Map();
const userSocketMap = new Map();
const UNMATCH_BLOCK_TIME = 15 * 60 * 1000;
const lastRefreshTimestamp = new Map();

function getPairKey(id1, id2) {
  return [id1, id2].sort().join('-');
}

module.exports = (io) => {
  function emitRefreshOnce(roomId) {
    const now = Date.now();
    if (!lastRefreshTimestamp.has(roomId) || now - lastRefreshTimestamp.get(roomId) > 5000) {
      io.to(roomId).emit('refreshPage');
      lastRefreshTimestamp.set(roomId, now);
    }
  }

  io.on('connection', (socket) => {
  socket.on('joinQueue', async ({ userId }) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const userStrId = user._id.toString();

    // Prevent multiple matches: if already matched, return early
    if (activeMatches.has(userStrId)) {
      const { roomId, chatId } = activeMatches.get(userStrId);
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);
      }

      const chat = await Chat.findById(chatId);
      if (!chat) return;

      return io.to(socket.id).emit('chatStarted', {
        roomId,
        chatId,
        messages: chat.messages
      });
    }

    // Handle multiple sockets for same user
    const oldSocketId = userSocketMap.get(userStrId);
    if (oldSocketId && oldSocketId !== socket.id) {
      waitingUsers = waitingUsers.filter(u => u.socketId !== oldSocketId);
      socketRoomMap.delete(oldSocketId);
    }
    userSocketMap.set(userStrId, socket.id);
    socket.join(userStrId);

    waitingUsers = waitingUsers.filter(u => u.userId !== userStrId);

    const now = Date.now();
    const filteredWaiting = waitingUsers.filter(u => {
      if (u.userId === userStrId) return false; // ❌ skip yourself
      const pairKey = getPairKey(userStrId, u.userId);
      if (recentUnmatches.has(pairKey)) {
        const lastUnmatchTime = recentUnmatches.get(pairKey);
        if (now - lastUnmatchTime < UNMATCH_BLOCK_TIME) return false;
      }
      return true;
    });

    const matchIndex = filteredWaiting.findIndex(u =>
      u.userId !== userStrId && Math.abs(u.age - user.age) <= 1
    );

    if (matchIndex !== -1) {
      const matchedUser = waitingUsers.find(
        u => u.userId === filteredWaiting[matchIndex].userId
      );

      waitingUsers = waitingUsers.filter(u => u.userId !== matchedUser.userId);
      const matchedUserIdStr = matchedUser.userId;
      const roomId = getPairKey(userStrId, matchedUserIdStr);

      socket.join(roomId);
      io.sockets.sockets.get(matchedUser.socketId)?.join(roomId);
      socketRoomMap.set(socket.id, roomId);
      socketRoomMap.set(matchedUser.socketId, roomId);

      let chat = await Chat.findOne({
        participants: { $all: [userStrId, matchedUserIdStr] }
      });

      if (!chat) {
        chat = new Chat({
          participants: [userStrId, matchedUserIdStr],
          messages: []
        });
        await chat.save();
      } else {
        await Chat.findByIdAndUpdate(chat._id, { isClosed: false });
      }

      activeMatches.set(userStrId, { roomId, chatId: chat._id, partnerId: matchedUserIdStr });
      activeMatches.set(matchedUserIdStr, { roomId, chatId: chat._id, partnerId: userStrId });

      const alreadyMatched1 = await User.findOne({
        _id: userStrId,
        'Matches.userId': matchedUserIdStr
      });
      const alreadyMatched2 = await User.findOne({
        _id: matchedUserIdStr,
        'Matches.userId': userStrId
      });

      if (!alreadyMatched1) {
        await User.findByIdAndUpdate(userStrId, {
          $addToSet: {
            Matches: {
              userId: matchedUserIdStr,
              chatId: chat._id,
              createdAt: new Date()
            }
          }
        });
      }

      if (!alreadyMatched2) {
        await User.findByIdAndUpdate(matchedUserIdStr, {
          $addToSet: {
            Matches: {
              userId: userStrId,
              chatId: chat._id,
              createdAt: new Date()
            }
          }
        });
      }

      io.to(roomId).emit('chatStarted', {
        roomId,
        chatId: chat._id,
        messages: chat.messages
      });
      eventEmitter.emit('matchCreated', {
        chatId: chat._id,
        participants: [userStrId, matchedUserIdStr]
      });

      emitRefreshOnce(roomId);
    } else {
      waitingUsers.push({
        socketId: socket.id,
        userId: userStrId,
        age: user.age
      });
    }
  } catch {}
});


    socket.on('sendMessage', async ({ roomId, senderId, chatId, message }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const timestamp = new Date();
        chat.messages.push({ sender: senderId, content: message, timestamp });
        await chat.save();

        io.to(roomId).emit('receiveMessage', { senderId, message, timestamp });
        eventEmitter.emit('messageSent', {
        chatId,
        senderId,
        message,
        participants: chat.participants
        });
      } catch {}
    });

    socket.on('typing', ({ roomId, senderId, isTyping }) => {
      socket.to(roomId).emit('typingNotification', { senderId, isTyping });
    });

    socket.on('unmatch', async ({ userId }) => {
      try {
        const match = activeMatches.get(userId);
        if (!match) return;

        const { roomId, partnerId, chatId } = match;
        activeMatches.delete(userId);
        activeMatches.delete(partnerId);
        socketRoomMap.delete(socket.id);

        const pairKey = getPairKey(userId, partnerId);
        recentUnmatches.set(pairKey, Date.now());
        await Chat.findByIdAndUpdate(chatId, { isClosed: true });

        io.to(roomId).emit('unmatched');
        eventEmitter.emit('unmatched', {
        chatId,
        participants: [userId, partnerId]
        });
        emitRefreshOnce(roomId);
      } catch {}
    });

    socket.on('disconnect', () => {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      socketRoomMap.delete(socket.id);

      let disconnectedUserId = null;
      for (const [userId, sId] of userSocketMap.entries()) {
        if (sId === socket.id) {
          disconnectedUserId = userId;
          userSocketMap.delete(userId);
          break;
        }
      }
    });

    setInterval(async () => {
      const now = Date.now();
      for (const [pairKey, timestamp] of recentUnmatches.entries()) {
        if (now - timestamp > UNMATCH_BLOCK_TIME) {
          recentUnmatches.delete(pairKey);
        }
      }

      try {
        const inactiveChats = await Chat.find({
          isClosed: false,
          messages: { $exists: true, $not: { $size: 0 } }
        }).lean();

        for (const chat of inactiveChats) {
          const lastMsg = chat.messages[chat.messages.length - 1];
          if (now - new Date(lastMsg.timestamp).getTime() > 10 * 60 * 1000) {
            await Chat.findByIdAndUpdate(chat._id, { isClosed: true });
            const participants = chat.participants.map(id => id.toString()).sort();
            for (let i = 0; i < participants.length; i++) {
              for (let j = i + 1; j < participants.length; j++) {
                const pairKey = `${participants[i]}-${participants[j]}`;
                recentUnmatches.set(pairKey, now);
              }
            }
            for (const userId of participants) {
              activeMatches.delete(userId);
            }
          }
        }
      } catch {}
    }, 10 * 60 * 1000);
  });
};
