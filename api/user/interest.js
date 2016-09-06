import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as userSchema from '../schema/users';
import * as authController from './auth';
import * as reportController from './report';

const updateInterest = async (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.username, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) await res.status(401).send(authController.errorMessage);
		if ((log.images && log.images.length === 0) || !log.images) {
			return (res.status(500).send(
			`${log.username} needs to upload at least one image before showing his interest to someone`));
		}
		const users = db.collection('users');
		const { username } = req.body;
		const verifiedUsername = await users.findOne({ username, confirmationKey: { $exists: false } });
		if (verifiedUsername && verifiedUsername === log.username) {
			return (res.status(500).send('interest to himself impossible'));
		}
		if (!verifiedUsername) return (res.status(500).send(`${username} does not exist`));
		if (reportController.areBlocked(verifiedUsername, log)) {
			return (res.status(500).send('user\'s blocked'));
		}
		if (verifiedUsername && verifiedUsername.username !== log.username) {
			const alreadyInterested = await users.findOne({
				username: log.username,
				interestedBy: username,
			});
			if (alreadyInterested) {
				users.update({ username }, {
						$inc: { interestCounter: -1 },
						$pull: { interestedIn: log.username },
				});
				await users.update({ username: log.username }, { $pull: { interestedBy: username } });
				return (res.status(200).send(
					`${log.username}'s interest to ${username} successfully removed`));
			}
			users.update({ username }, {
				$inc: { interestCounter: 1 },
				$push: { interestedIn: log.username },
			});
			await users.update({ username: log.username }, { $push: { interestedBy: username } });
			return (res.status(200).send(`${log.username}'s interest to ${username} successfully added`));
		}
		return (false);
	});
	return (false);
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
