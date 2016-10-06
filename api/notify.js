import _					from 'lodash';
import mongoConnectAsync	from './mongo';
import sender				from './sender';
import * as authController	from './user/auth';

const send = (users, db, message, to) => {
	const askedUser = _.find(users, (user) => user.username === to.username);
	if (askedUser) askedUser.socket.emit('new notification', message);
	const notifications = to.notifications ? [message, ...to.notifications] : [message];
	if (notifications.length > 7) notifications.splice(6, 1);
	db.collection('users').update({ username: to.username }, { $set: { notifications } });
};

const get = (req, res) => {
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.send(authController.errorMessage));
		return (sender(res, true, 'success', log.notifications));
	});
};

export { send, get };
