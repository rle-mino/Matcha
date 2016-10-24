import sender					from '../sender';
import mongoConnectAsync		from '../mongo';
import * as notify				from '../notify';
import * as authController		from './auth';
import * as reportController	from './report';

const updateInterest = (socketList) => async (req, res) => {
	const liker = req.loggedUser;
	if ((liker.images && liker.images.length === 0) || !liker.images) {
		return (sender(res, false,
'user needs to upload at least one image before showing his interest to someone'));
	}
	const users = req.db.collection('users');
	const { username } = req.body;
	if (!username) {
		return (sender(res, false, 'invalid request', { path: 'username', error: 'required' }));
	}
	const liked = await users.findOne({ username, confirmationKey: { $exists: false } });
	if (!liked) {
		return (sender(res, false, 'user does not exist'));
	}
	if (liked.username === liker.username) {
		return (sender(res, false, 'interest to himself impossible'));
	}
	if (reportController.areBlocked(liked, liker)) {
		return (sender(res, false, 'user\'s blocked'));
	}
	const alreadyLiked = liked.interestedIn.indexOf(liker.username);
	if (alreadyLiked !== -1) {
		users.update({ username: liker.username }, {
			$pull: { interestedBy: liked.username },
		});
		users.update({ username: liked.username }, {
			$inc: { interestCounter: -1 },
			$pull: { interestedIn: liker.username },
		});
		if (liker.interestedIn.indexOf(liked.username) !== -1) {
			notify.send(socketList, req.db,
				`${liker.username} no longer interested in your profile`, liked);
		}
	} else {
		users.update({ username: liker.username }, {
			$push: { interestedBy: { $each: [liked.username], $position: 0 } },
		});
		users.update({ username: liked.username }, {
			$inc: { interestCounter: 1 },
			$push: { interestedIn: { $each: [liker.username], $position: 0 } },
		});
		notify.send(socketList, req.db,
			`${liker.username} is interested in your profile`, liked);
	}
	return (sender(res, true, 'interest successfully updated'));
};

const selfInterest = (req, res) => {
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		const users = db.collection('users');
		const compatibleUser = await users.find({
			interestedIn: log.username,
			interestedBy: log.username,
		}, {
			username: 1,
			_id: 0,
		}).toArray();
		return (res.status(500).send(compatibleUser));
	});
};

export { updateInterest, selfInterest };
