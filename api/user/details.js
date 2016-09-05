import Joi from 'joi';
import _ from 'lodash';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';
import * as authController from './auth';

const addDetails = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.details, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const { username, password } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({
			username,
			password: crypto.encrypt(password),
		});
		if (askedUser) {
			const orientation = req.body.orientation || 'bisexual';
			const detailsAndRegisterData = {
				...req.body,
				orientation,
			};
			const pushableDetails = _.omit(detailsAndRegisterData, [
				'password',
				'username',
				]);
			users.update({ username }, { $set: pushableDetails });
			tagController.add(req.body.tags, db);
			res.status(200).send(`details about ${username} have been successfully added !`);
		} else {
			res.status(500).send(`${username} does not exist or password does not match`);
		}
	});
	return (true);
};

const updateInterest = async (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.username, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) await res.status(401).send(authController.errorMessage);
		if (!log.images.length) {
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

export { addDetails, updateInterest };
