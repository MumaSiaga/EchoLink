const eventEmitter = require('../../sockets/event');
const Notification = require('../../models/Notifications');

async function addNotification(userId, notifData) {
  let notifDoc = await Notification.findOne({ user: userId });
  if (!notifDoc) {
    notifDoc = new Notification({ user: userId, notifications: [] });
  }
  notifDoc.notifications.push(notifData);
  await notifDoc.save();
}

eventEmitter.on('messageSent', async ({ chatId, senderId, participants, message }) => {
  for (const userId of participants) {
    if (userId.toString() === senderId.toString()) continue;
    await addNotification(userId, {
      type: 'message',
      title: 'New Message',
      body: message.length > 100 ? message.slice(0, 100) + '...' : message,
      link: `/chat/view/${chatId}`,
      read: false,
      createdAt: new Date()
    });
  }
});

eventEmitter.on('matchCreated', async ({ chatId, participants }) => {
  for (const userId of participants) {
    await addNotification(userId, {
      type: 'match',
      title: 'You matched!',
      body: 'You have been matched.',
      link: `/chat/view/${chatId}`,
      read: false,
      createdAt: new Date()
    });
  }
});

eventEmitter.on('unmatched', async ({ participants }) => {
  for (const userId of participants) {
    await addNotification(userId, {
      type: 'unmatch',
      title: 'Unmatched',
      body: 'You have been unmatched.',
      link: null,
      read: false,
      createdAt: new Date()
    });
  }
});
