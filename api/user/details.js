import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';

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
				res.status(200).send(`Details about ${username} have been successfully added !`);
			} else {
				res.status(500).send(`Error - ${username} does not exist or password does not match`);
			}
		});
	} else res.status(400).send(error.details);
};

const updateInterest = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.username, { abortEarly: false });
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const { username, requester } = req.body;
			const verifiedRequester = await users.findOne({ username: requester });
			if (verifiedRequester) {
				const verifiedUsername = await users.findOne({ username });
				if (verifiedUsername) {
					for (let i = 0; i < verifiedUsername.interestedIn.length; i++) {
						if (verifiedUsername.interestedIn[i] === requester) {
							users.update({ username }, {
								$inc: { interestCounter: -1 },
								$pull: { interestedIn: requester },
							});
							await users.update({ username: requester }, { $pull: { interestedBy: username } });
							res.status(200).send(`${requester}'s interest to ${username} successfully removed`);
							return;
						}
					}
					users.update({ username }, {
						$inc: { interestCounter: 1 },
						$push: { interestedIn: requester },
					});
					await users.update({ username: requester }, { $push: { interestedBy: username } });
					res.status(200).send(`${requester}'s interest to ${username} successfully added`);
				} else res.status(500).send(`${username} does not exist`);
			} else res.status(500).send(`${requester} does not exist`);
		});
	} else {
		res.status(400).send(error.details);
	}
};

export { addDetails, updateInterest };