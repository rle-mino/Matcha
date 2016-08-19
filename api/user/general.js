import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as tagController from '../tag';
import * as userSchema from '../schema/users';

const getAllData = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	const { username } = req.query;
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const askedUser = await users.findOne({ username }, {
				password: 0,
			});
			if (askedUser) {
				res.send(askedUser);
			} else {
				res.status(500).send(`Error - ${username} not found`);
			}
		});
	} else {
		res.status(400).send('Error - Invalid entry');
	}
};

const getFastDetails = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const { username } = req.query;
			const users = db.collection('users');
			const askedUser = await users.findOne({ username }, {
				username: 1,
				firstname: 1,
				lastname: 1,
				image: 1,
				tags: 1,
			});
			if (askedUser) {
				res.status(200).send(askedUser);
			} else {
				res.status(500).send(`Error - ${username} not found`);
			}
		});
	} else {
		res.status(400).send('Error - Invalid entry');
	}
};

export { getAllData, getFastDetails };