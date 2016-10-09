import Joi						from 'joi';
import _						from 'lodash';
import mongoConnectAsync		from '../mongo';
import sender					from '../sender';
import * as notify				from '../notify';
import * as userSchema			from '../schema/users';
import * as authController		from './auth';
import * as reportController	from './report';
import * as tools				from '../tools';
import * as tagController		from '../tag';
import * as parserController	from '../parserController';

const getSingular = (sockList) => async (req, res) => {
	const log = req.loggedUser;
	const { username } = req.query;
	const users = req.db.collection('users');
	const askedUser = await users.findOne({ username: username || log.username }, {
		password: 0,
		loginToken: 0,
		notifications: 0,
	});
	if (!askedUser) return sender(res, false, `Error - ${username} not found`);
	if (reportController.areBlocked(log.username, askedUser.username)) {
		return (sender(res, false, 'user\'s blocked'));
	}
	const { birthdate, visit, interestCounter, interestedBy } = askedUser || '';
	if (askedUser.username !== log.username) {
		const alreadyVisited = _.find(askedUser.visiter, (visiter) => visiter === log.username);
		if (!alreadyVisited) {
			notify.send(sockList, req.db, `${log.username} has looked at your profile`, askedUser);
			await users.update({ username }, {
				$inc: { visit: 1 },
				$push: { visiter: log.username },
			});
		}
	}
	const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
	const popularity = tools.getPopularity(visit, interestCounter);
	const interToReq = !!_.find(interestedBy,
					(likedUser) => likedUser === log.username);
	const allInfo = {
		...askedUser,
		popularity,
		interToReq,
		age,
		location: askedUser.location ? askedUser.location.address : null,
	};
	if (askedUser.username === log.username) return (sender(res, true, 'success', allInfo));
	const sendableInfo = await _.omit(allInfo, [
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
		'notifications',
		'location',
	]);
	return (sender(res, true, 'success', sendableInfo));
};

const getFastDetails = (req, res) => {
	const { error } = Joi.validate(req.query, userSchema.username);
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
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

const updateProfil = async (req, res) => {
	const log = req.loggedUser;
	const error = await parserController.updateProfileChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	const users = req.db.collection('users');
	if (req.body.tags) tagController.add(req.body.tags, req.db);
	await users.update({ username: log.username }, { $set: req.body });
	return (sender(res, true, `${log.username}'s data successfully updated`));
};

export { getSingular, getFastDetails, updateProfil };
