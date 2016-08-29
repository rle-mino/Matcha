import Joi from 'joi';
import _ from 'lodash';
import mongoConnectAsync from '../mongo';
import * as userSchema from '../schema/users';
import * as authController from './auth';

const getSingular = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	const { username } = req.query;
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const log = await authController.checkToken(req, db);
			if (!log) res.status(401).send(authController.errorMessage);
			else {
				res.set('logToken', log.loginToken.token);
				const users = db.collection('users');
				const askedUser = await users.findOne({ username }, {
					password: 0,
					loginToken: 0,
				});
				if (askedUser) {
					if (askedUser.username !== log.username) {
						await users.update({ username },
						{
							$inc: { visit: 1 },
							$push: { visiter: log.username },
						});
					}
					res.status(200).send(askedUser);
				} else res.status(500).send(`Error - ${username} not found`);
			}
		});
	} else res.status(400).send(error.details);
};

//		Popularity
//		age 

const getFastDetails = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	if (!error) {
		mongoConnectAsync(res, async (db) => {
			const log = await authController.checkToken(req, db);
			if (!log) res.status(401).send(authController.errorMessage);
			else {
				res.set('logToken', log.loginToken.token);
				const { username } = req.query;
				const users = db.collection('users');
				const askedUser = await users.findOne({ username }, {
					username: 1,
					firstname: 1,
					lastname: 1,
					image: 1,
					tags: 1,
					birthdate: 1,
					interestedBy: 1,
				});
				const interToMe = _.find(askedUser.interestedBy, (likedUser) => likedUser === log.username);
				if (askedUser) {
					const fastDetails = _.omit(askedUser, 'interestedBy');
					res.status(200).send({ ...fastDetails,
										interToReq: interToMe || false });
				} else {
					res.status(500).send(`Error - ${username} not found`);
				}
			}
		});
	} else res.status(400).send(error.details);
};

export { getSingular, getFastDetails };