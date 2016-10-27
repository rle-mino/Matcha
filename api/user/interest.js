import sender					from '../sender';
import * as notify				from '../notify';
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
	const chats = req.db.collection('chats');
	if (alreadyLiked !== -1) {
		users.update({ username: liker.username }, {
			$pull: { interestedBy: liked.username },
		});
		users.update({ username: liked.username }, {
			$inc: { interestCounter: -1 },
			$pull: { interestedIn: liker.username },
		});
		if (liker.interestedIn.indexOf(liked.username) !== -1) {
			chats.remove({ $or: [
				{ 'userA.username': liker.username, 'userB.username': liked.username },
				{ 'userA.username': liked.username, 'userB.username': liked.username },
			] });
			notify.send(socketList, req.db,
				`${liker.username} is no longer interested in your profile`, liked);
		}
	} else {
		users.update({ username: liker.username }, {
			$addToSet: { interestedBy: { $each: [liked.username], $position: 0 } },
		});
		users.update({ username: liked.username }, {
			$inc: { interestCounter: 1 },
			$addToSet: { interestedIn: { $each: [liker.username], $position: 0 } },
		});
		if (liker.interestedIn.indexOf(liked.username) !== -1) {
			chats.insert({
				userA: {
					username: liker.username,
					image: liker.images[0],
				},
				userB: {
					username: liked.username,
					image: liked.images[0],
				},
				messages: [],
			});
		}
		notify.send(socketList, req.db,
			`${liker.username} is interested in your profile`, liked);
	}
	return (sender(res, true, 'interest successfully updated'));
};

const selfInterest = async (req, res) => {
	const chats = req.db.collection('chats');
	const compatibleUser = await chats.find({ $or: [
		{ 'userA.username': 'raph' },
		{ 'userB.username': 'raph' },
		] }).toArray();
	const final = compatibleUser.map((obj) => {
		if (obj.userA.username === req.loggedUser.username) {
			return ({
				user: {
					image: obj.userB.image,
					username: obj.userB.username,
				},
				messages: obj.messages,
			});
		}
		return ({
			user: {
				image: obj.userA.image,
				username: obj.userA.username,
			},
			message: obj.messages,
		});
	});
	return (sender(res, true, 'success', final));
};

export { updateInterest, selfInterest };
