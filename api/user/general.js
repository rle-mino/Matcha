import Joi from 'joi';
import _ from 'lodash';
import mongoConnectAsync from '../mongo';
import * as userSchema from '../schema/users';
import * as authController from './auth';
import * as tools from '../tools';
import * as tagController from '../tag';
import * as crypto from '../crypto';
import mailer from '../mail';

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

const deleteProfile1o2 = (req, res) => {
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		const users = db.collection('users');
		const deleteKey = {
			key: crypto.tokenGenerator(),
			creaDate: new Date().getTime() / 1000,
		};
		await users.update({ username: log.username }, { $set: { deleteKey } });
		const url = `http://localhost:8000/delete_account?username=${encodeURI(log.username)}&deletekey=${encodeURI(deleteKey.key)}`;
		const message = `follow this link to remove your account: ${url}.
		This link will become useless in 2 hours`;
		mailer(log.mail, message, 'Delete your account');
		return (res.status(200).send(`A mail has been sent to ${log.mail}`));
	});
};

const deleteProfile2o2 = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.removeAccount, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const { username, password, deleteKey } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username });
		if (askedUser.password !== crypto.encrypt(password)) {
			return (res.status(500).send('Invalid password or username'));
		}
		const lifeTime = (new Date().getTime() / 1000) - askedUser.deleteKey.creaDate;
		if (askedUser.deleteKey.key !== deleteKey || lifeTime > 7200) {
			if (lifeTime > 7200) {
				await users.update({ username }, { $unset: { deleteKey: '' } });
			}
			return (res.status(500).send('Cannot remove this user with this key'));
		}
		users.remove({ username });
		const interestedIn = users.find({ interestedIn: username });
		const interestedBy = users.find({ interestedBy: username });
		const visiter = await users.find({ visiter: username });
		interestedIn.forEach((user) => {
			users.update({ username: user.username }, { $pull: { interestedIn: askedUser.username } });
		});
		interestedBy.forEach((user) => {
			users.update({ username: user.username }, { $pull: { interestedBy: askedUser.username } });
		});
		visiter.forEach((user) => {
			users.update({ username: user.username }, { $pull: { visiter: askedUser.username } });
		});
		return (res.status(200).send(`${username}'s account successfully removed'`));
	});
	return (false);
};

export { getSingular, getFastDetails, updateProfil, deleteProfile1o2, deleteProfile2o2 };
