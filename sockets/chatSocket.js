const Chat = require('../models/Chat');
const User = require('../models/User');

let waitingUsers = [];
const socketRoomMap = new Map();
const activeMatches = new Map();


const recentUnmatches = new Map();

const UNMATCH_BLOCK_TIME = 15 * 60 * 1000; 


function getPairKey(id1, id2) {
  return [id1, id2].sort().join('-');
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    socket.on('joinQueue', async ({ userId }) => {
      try {
        const user = await User.findById(userId);
        if (!user) return console.error('User not found:', userId);

        const userStrId = user._id.toString();

        if (activeMatches.has(userStrId)) {
          const { roomId, chatId } = activeMatches.get(userStrId);
          socket.join(roomId);
          socketRoomMap.set(socket.id, roomId);

          const chat = await Chat.findById(chatId);
          if (!chat) return;

          return io.to(socket.id).emit('chatStarted', {
            roomId,
            chatId,
            messages: chat.messages
          });
        }

        
        const now = Date.now();
        const filteredWaiting = waitingUsers.filter(u => {
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
          
          const matchedUser = waitingUsers.find(u => u.userId === filteredWaiting[matchIndex].userId);

          
          waitingUsers = waitingUsers.filter(u => u.userId !== matchedUser.userId);

          const matchedUserIdStr = matchedUser.userId;
          const roomId = `${socket.id}-${matchedUser.socketId}`;

          socket.join(roomId);
          io.to(matchedUser.socketId).socketsJoin(roomId);

          socketRoomMap.set(socket.id, roomId);
          socketRoomMap.set(matchedUser.socketId, roomId);

          let chat = await Chat.findOne({participants: { $all: [userStrId, matchedUserIdStr] }});

          if (!chat) {
          chat = new Chat({ participants: [userStrId, matchedUserIdStr], messages: [] });
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
          io.to(roomId).emit('refreshPage');

        } else {
          waitingUsers.push({ socketId: socket.id, userId: userStrId, age: user.age });
        }
        
      } catch (err) {
        console.error('Error in joinQueue:', err);
      }
    });

    socket.on('sendMessage', async ({ roomId, senderId, chatId, message }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const timestamp = new Date();

        chat.messages.push({
          sender: senderId,
          content: message,
          timestamp
        });

        await chat.save();

        io.to(roomId).emit('receiveMessage', {
          senderId,
          message,
          timestamp
        });

      } catch (err) {
        console.error(' Error sending message:', err);
      }
    });

    socket.on('typing', ({ roomId, senderId, isTyping }) => {
      socket.to(roomId).emit('typingNotification', {
        senderId,
        isTyping
      });
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
    io.to(roomId).emit('refreshPage');
  } catch (err) {
    console.error('Error in unmatch:', err);
  }
});


    socket.on('disconnect', () => {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      socketRoomMap.delete(socket.id);
      console.log('🔌 User disconnected:', socket.id);
    });

    
    setInterval(() => {
      const now = Date.now();
      for (const [pairKey, timestamp] of recentUnmatches.entries()) {
        if (now - timestamp > UNMATCH_BLOCK_TIME) {
          recentUnmatches.delete(pairKey);
        }
      }
    }, 5 * 60 * 1000);
  });
};
