import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';
import * as authController from './auth';

const addDetails = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.details, { abortEarly: false });
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const { username, password } = req.body;
			const users = db.collection('users');
			const askedUser = await users.findOne({
				username,
				password: crypto.encrypt(password),
			});
			const userTags = req.body.tags.map((atag) => atag.toLowerCase());
			if (askedUser) {
				const orientation = req.body.orientation || 'bisexual';
				const detailsAndRegisterData = {
					...req.body,
					tags: userTags,
					orientation,
				};
				delete detailsAndRegisterData.password;
				delete detailsAndRegisterData.username;
				users.update({ username }, { $set: detailsAndRegisterData });
				tagController.add(userTags, db);
				res.status(200).send({
					status: 'success',
					login: username,
					details: `about ${username} have been successfully added !`,
				});
			} else {
				res.status(500).send({
					status: 'fail',
					login: 'unknown',
					details: `${username} does not exist or password does not match`,
				});
			}
		});
	} else res.status(400).send(error.details);
};

const updateInterest = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.username, { abortEarly: false });
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const log = await authController.checkToken(req, db);
			if (!log) res.status(401).send(authController.errorMessage);
			else {
				const users = db.collection('users');
				const { username } = req.body;
				const verifiedUsername = await users.findOne({ username });
				if (verifiedUsername && verifiedUsername !== log.username) {
					for (let i = 0; i < verifiedUsername.interestedIn.length; i++) {
						if (verifiedUsername.interestedIn[i] === log.username) {
							users.update({ username }, {
								$inc: { interestCounter: -1 },
								$pull: { interestedIn: log.username },
							});
							await users.update({ username: log.username }, { $pull: { interestedBy: username } });
							res.status(200).send({
								status: 'success',
								login: username,
								details: `${log.username}'s interest to ${username} successfully removed`,
								token: log.loginToken.token,
							});
							return;
						}
					}
					users.update({ username }, {
						$inc: { interestCounter: 1 },
						$push: { interestedIn: log.username },
					});
					await users.update({ username: log.username }, { $push: { interestedBy: username } });
					res.status(200).send({
						status: 'success',
						login: log.username,
						details: `${log.username}'s interest to ${username} successfully added`,
						token: log.loginToken.token,
					});
				} else if (verifiedUsername) {
					res.status(500).send({
						status: 'fail',
						login: log.username,
						details: 'interest to himself impossible',
						token: log.loginToken.token,
					});
				} else {
					res.status(500).send({
						status: 'fail',
						login: log.username,
						details: `${username} does not exist`,
						token: log.loginToken.token,
					});
				}
			}
		});
	} else {
		res.status(400).send(error.details);
	}
};

export { addDetails, updateInterest };