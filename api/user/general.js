import Joi						from 'joi';
import _						from 'lodash';
import notify					from '../notify';
import mongoConnectAsync		from '../mongo';
import * as userSchema			from '../schema/users';
import * as authController		from './auth';
import * as tools				from '../tools';
import * as tagController		from '../tag';

const getSingular = (sockList) => (req, res) => {
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
		if (!askedUser) return (res.status(500).send(`Error - ${username} not found`));
		if ((askedUser.blockedBy && askedUser.blockedBy.indexOf(log.username) !== -1) ||
				(log.blockedBy && log.blockedBy.indexOf(askedUser.username) !== -1)) {
			return (res.status(500).send('user\'s blocked'));
		}
		const { birthdate, visit, interestCounter, interestedBy } = askedUser || '';
		if (askedUser.username !== log.username) {
			notify(sockList, db, `${log.username} has watched your profile`, askedUser.username);
			const alreadyVisited = _.find(askedUser.visiter, (visiter) => visiter === log.username);
			if (!alreadyVisited) {
				await users.update({ username }, {
					$inc: { visit: 1 },
					$push: { visiter: log.username },
				});
			}
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
				'_id',
				'mail',
				'birthdate',
				'visit',
				'visiter',
				'interestedBy',
				'interestCounter',
				'interestedIn',
				'blockedBy',
				'reporterFake',
			]);
			return (res.send(sendableInfo));
		}
		return (res.status(200).send(allInfo));
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
			blockedBy: 1,
		});
		if (askedUser) {
			if ((askedUser.blockedBy && askedUser.blockedBy.indexOf(log.username) !== -1) ||
				(log.blockedBy && log.blockedBy.indexOf(askedUser.username) !== -1)) {
				return (res.status(500).send('user\'s blocked'));
			}
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
				'blockedBy',
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

const updateProfil = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.updateProfil, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		const users = db.collection('users');
		if (req.body.tags) {
			tagController.add(req.body.tags, db);
		}
		await users.update({ username: log.username }, { $set: req.body });
		return (res.status(200).send(`${log.username}'s data successfully updated`));
	});
	return (false);
};

export { getSingular, getFastDetails, updateProfil };
