
const User = require('../models/User');
const Chat = require('../models/Chat');

exports.getChatHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const currentUser = await User.findById(userId).populate('Matches.userId');

    const history = await Promise.all(
      currentUser.Matches.map(async match => {
        const chat = await Chat.findById(match.chatId)
          .populate('participants', 'username profilePicture ProfileStatus verified');

        if (!chat) return null;

        const otherUser = chat.participants.find(u => !u._id.equals(userId));
        if (!otherUser) return null;

        const lastMessage = chat.messages.length
          ? chat.messages[chat.messages.length - 1].content
          : '';
          

        return {
          username: otherUser.username,
          verified: otherUser.verified,
          profilePicture: otherUser.profilePicture,
          ProfileStatus: otherUser.ProfileStatus,
          lastMessage,
          chatId: chat._id,
          isClosed: chat.isClosed
        };
      })
    );

    res.json(history.filter(Boolean));
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).send('Server error');
  }
};