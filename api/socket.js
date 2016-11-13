import _							from 'lodash';
import moment						from 'moment';
import mongoConnectAsync			from './mongo';
import { checkToken }				from './user/auth';
import * as parser					from './schema/parser';

const sendMessage = (db, socket, log, users) => async ({ message, recipient }) => {
	if (!parser.message(message)) return (false);
	const connected = await db.collection('chats').findOne({
		$or: [
			{ 'userA.username': log.username, 'userB.username': recipient },
			{ 'userA.username': recipient, 'userB.username': log.username },
		],
	});

	if (!connected) return (false);
	const toSend = users.filter((user) => user.username === recipient);
	const messageData = {
		author: log.username,
		message,
	};
	if (toSend && toSend.length) {
		toSend.forEach((user) => {
			user.socket.emit('receive message', messageData);
		});
	} else {
		db.collection('users').update({ username: recipient }, {
			$push: {
				notifications: {
					$each: [
						`${log.username} sent you a message`,
					],
					$position: 0,
					$slice: 7,
				},
			},
		});
	}
	db.collection('chats').update({ $or: [
			{ 'userA.username': log.username, 'userB.username': recipient },
			{ 'userA.username': recipient, 'userB.username': log.username },
		] }, {
			$push: { messages: messageData },
		}
	);
};

const disconnect = (socket, users) => () => {
	mongoConnectAsync(null, async (db) => {
		const toRemove = await _.find(users, (user) => user.socket.id === socket.id);
		if (!toRemove) return (false);
		db.collection('users').update(
			{ username: toRemove.username },
			{ $set: { lastConnection: moment().format('MM-DD-YYYY') },
		});
		_.remove(users, (user) => _.isEqual(user.socket.id, socket.id));
		console.log(users.map((el) => el.username));
		return (true);
	});
};

const auth = (users, socket) => (data) => {
	mongoConnectAsync(null, async (db) => {
		const log = await checkToken(data, db);

		if (!log) return (socket.emit('connect status', 'unauthorized'));
		db.collection('users').update(
			{ username: log.username },
			{ $set: { lastConnection: 'connected' },
		});
		users.push({ username: log.username, socket });
		socket.on('send message', sendMessage(db, socket, log, users));
		console.log(users.map((el) => el.username));
	});
};

export default (users) => (socket) => {
	socket.on('auth', auth(users, socket));
	socket.on('disconnect', disconnect(socket, users));
};