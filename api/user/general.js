import Joi from 'joi';
import _ from 'lodash';
import mongoConnectAsync from '../mongo';
import * as userSchema from '../schema/users';
import * as authController from './auth';
import * as tools from '../tools';

const getSingular = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	const { username } = req.query;
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		res.set('logToken', log.loginToken.token);
		const users = db.collection('users');
		const askedUser = await users.findOne({ username }, {
			password: 0,
			loginToken: 0,
		});
		if (askedUser) {
			const { birthdate, visit, interestCounter, interestedBy } = askedUser || '';
			if (askedUser.username !== log.username) {
				await users.update({ username },
				{
					$inc: { visit: 1 },
					$push: { visiter: log.username },
				});
			}
			const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
			const popularity = tools.getPopularity(visit, interestCounter);
			const interToMe = _.find(interestedBy,
							(likedUser) => likedUser === log.username);
			const allInfo = {
				...askedUser,
				popularity,
				interToReq: interToMe || false,
				age,
			};
			if (askedUser.username !== log.username) {
				const sendableInfo = _.omit(allInfo, [
					'interestedBy',
					'birthdate',
					'visit',
					'interestCounter',
					'mail',
					'visiter',
					'_id',
					'interestedIn',
				]);
				return (res.send(sendableInfo));
			}
			return (res.status(200).send(allInfo));
		}
		return (res.status(500).send(`Error - ${username} not found`));
	});
	return (false);
};

const getFastDetails = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		res.set('logToken', log.loginToken.token);
		const { username } = req.query;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username }, {
			username: 1,
			firstname: 1,
			lastname: 1,
			image: 1,
			tags: 1,
			visit: 1,
			interestCounter: 1,
			birthdate: 1,
			interestedBy: 1,
		});
		if (askedUser) {
			const { birthdate, interestCounter, visit, interestedBy } = askedUser || '';
			const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
			const popularity = tools.getPopularity(visit, interestCounter);
			const interToMe = _.find(interestedBy,
							(likedUser) => likedUser === log.username);
			const fastDetails = _.omit(askedUser, [
				'interestedBy',
				'birthdate',
				'visit',
				'interestCounter',
			]);
			return (res.status(200).send({ ...fastDetails,
								interToReq: interToMe || false,
								age,
								popularity,
							}));
		}
		return (res.status(500).send(`Error - ${username} not found`));
	});
	return (false);
};

export { getSingular, getFastDetails };
