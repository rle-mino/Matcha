import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';

const addDetails = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.details);
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const { username, password } = req.body || '';
			const users = db.collection('users');
			const askedUser = await users.findOne({
				username,
				password: crypto.encrypt(password),
			});
			const userTags = req.body.tags.map((atag) => atag.toLowerCase());
			if (askedUser) {
				const detailsAndRegisterData = {
					...req.body,
					tags: userTags,
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

export { addDetails };