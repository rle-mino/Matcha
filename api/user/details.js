import Joi from 'joi';
import _ from 'lodash';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';

const addDetails = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.details, { abortEarly: false });
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error: error.details,
		}));
	}
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
			return (res.status(200).send(`details about ${username} have been successfully added !`));
		}
		return (res.status(500).send(`${username} does not exist or password does not match`));
	});
	return (true);
};

export { addDetails };
