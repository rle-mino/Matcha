import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as userSchema from '../schema/users';
import mailer from '../mail';

const getSingular = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	const { username, requester } = req.query;
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const askedUser = await users.findOne({ username }, {
				password: 0,
			});
			if (askedUser) {
				if (askedUser.username !== requester) {
					await users.update({ username }, { $inc: { visit: 1 } });
				}
				res.send(askedUser);
			} else {
				res.status(500).send(`Error - ${username} not found`);
			}
		});
	} else {
		res.status(400).send(error.details);
	}
};

const getFastDetails = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const { username, requester } = req.query;
			const users = db.collection('users');
			const askedUser = await users.findOne({ username }, {
				username: 1,
				firstname: 1,
				lastname: 1,
				image: 1,
				tags: 1,
				popularity: 1,
				interestedIn: 1,
			});
			askedUser.interestedTorequester = false;
			for (let i = 0; i < askedUser.interestedIn.length; i++) {
				if (askedUser.interestedIn[i] === requester) {
					askedUser.interestedTorequester = true;
				}
			}
			delete askedUser.interestedIn;
			if (askedUser) {
				res.status(200).send(askedUser);
			} else {
				res.status(500).send(`Error - ${username} not found`);
			}
		});
	} else {
		res.status(400).send(error.details);
	}
};

export { getSingular, getFastDetails };