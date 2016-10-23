import mailer					from '../mail';
import sender					from '../sender';

const areBlocked = (userA, userB) => {
	if (userA.blockedBy && userA.blockedBy.indexOf(userB.username) !== -1) {
		return (true);
	}
	if (userB.blockedBy && userB.blockedBy.indexOf(userA.username) !== -1) {
		return (true);
	}
	return (false);
};

const blockUser = (users, toBlock, by) => {
	users.update({ username: toBlock }, {
		$pull: {
			visiter: by,
			interestedIn: by,
			interestedBy: by,
		},
		$push: {
			blockedBy: by,
		},
	});
	return (true);
};

const asFake = async (req, res) => {
	const { username } = req.body;
	if (!username || username === '') {
		return (sender(res, false, 'invalid request', [{ path: username, error: 'required' }]));
	}
	const log = req.loggedUser;
	if (username === log.username) {
		return (sender(res, false, 'impossible to report onself as fake'));
	}
	const users = req.db.collection('users');
	const askedUser = await users.findOne({ username });
	if (!askedUser) return (res.status(500).send(`${username} does not exist`));
	const already = await (askedUser.reporterFake ?
		askedUser.reporterFake.indexOf(log.username) : null);
	if (already !== -1 && already != null) {
		return (sender(res, false, `${log.username} already reported ${username} as fake`));
	}
	users.update({ username }, { $push: { reporterFake: log.username } });
	blockUser(users, username, log.username);
	mailer('raphael.leminor@gmail.com', `${username} has been reported has fake`, 'Fake reporter');
	return (sender(res, true, `${username} has been successfully report as fake`));
};

const asBlocked = async (req, res) => {
	const { username } = req.body;
	if (!username || username === '') {
		return (sender(res, false, 'invalid request', [{ path: username, error: 'required' }]));
	}
	const log = req.loggedUser;
	const users = req.db.collection('users');
	const askedUser = await users.findOne({ username });
	if (!askedUser) return (sender(res, false, `${username} does not exist`));
	blockUser(users, username, log.username);
	return (sender(res, true, `${username} has been successfully blocked by ${log.username}`));
};

export { asFake, asBlocked, areBlocked };
