import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';

const addDetails = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.details, { abortEarly: false });
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

const search = async (req, res) => {
	const { error } = await Joi.validate(req.query, userSchema.search, { abortEarly: false });
	if (!error) {
		const { searcherName, tags, username, location, name } = req.query;
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const searchObject = {};
			if (tags) searchObject.tags = tags;
			if (username) searchObject.username = username;
			if (location) searchObject.location = location;
			if (name) {
				searchObject.firstname = name[0];
				searchObject.lastname = name[1];
			}
			const searcherInfo = await users.findOne({ username: searcherName }, {
				username: 1,
				orientation: 1,
				sex: 1,
			});
			const searchResult = await users.find({ $or: [searchObject] }, {
				username: 1,
				firstname: 1,
				lastname: 1,
				image: 1,
				tags: 1,
				location: 1,
			}).toArray();
			res.status(200).send(searchResult);
		});
	} else {
		res.status(400).send('Error - Invalid entry');
	}
};

export { addDetails, search };