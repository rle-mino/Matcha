import _			from 'lodash';

export default (users, db, message, to) => {
	const askedUser = _.find(users, (user) => user.username === to);
	askedUser.socket.emit('new notification', message);
};
