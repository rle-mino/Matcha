import sender				from './sender';

const send = (users, db, message, to) => {
	const askedUser = users.filter((user) => user.username === to.username);
	if (askedUser && askedUser.length) {
		askedUser.forEach((user) => user.socket.emit('new notification', message));
	}
	const notifications = to.notifications ? [message, ...to.notifications] : [message];
	if (notifications.length > 7) notifications.splice(6, 1);
	db.collection('users').update({ username: to.username }, { $set: { notifications } });
};

const get = (req, res) => sender(res, true, 'success', req.loggedUser.notifications);

export { send, get };
