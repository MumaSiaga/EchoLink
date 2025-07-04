const Chat = require('../models/Chat');
const User = require('../models/User');

let waitingUsers = [];
const socketRoomMap = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    socket.on('joinQueue', async ({ userId }) => {
      try {
        const user = await User.findById(userId);
        if (!user) {
          console.error('User not found:', userId);
          return;
        }

        const userStrId = user._id.toString();

        const matchIndex = waitingUsers.findIndex(u =>
          u.userId !== userStrId && Math.abs(u.age - user.age) <= 1
        );

        if (matchIndex !== -1) {
          const matchedUser = waitingUsers.splice(matchIndex, 1)[0];

          const roomId = `${socket.id}-${matchedUser.socketId}`;
          socket.join(roomId);
          io.to(matchedUser.socketId).socketsJoin(roomId);

          socketRoomMap.set(socket.id, roomId);
          socketRoomMap.set(matchedUser.socketId, roomId);

          const matchedUserIdStr = matchedUser.userId.toString();

         
          let chat = await Chat.findOne({
            participants: { $all: [userStrId, matchedUserIdStr] }
          });

      
          if (!chat) {
            chat = new Chat({
              participants: [userStrId, matchedUserIdStr],
              messages: []
            });
            await chat.save();
          }

       
          io.to(roomId).emit('chatStarted', {
            roomId,
            chatId: chat._id,
            messages: chat.messages
          });

        } else {
          waitingUsers.push({ socketId: socket.id, userId: userStrId, age: user.age });
        }

      } catch (err) {
        console.error('❌ Error in joinQueue:', err);
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

    socket.on('disconnect', () => {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      socketRoomMap.delete(socket.id);
      console.log('🔌 User disconnected:', socket.id);
    });
  });
};
