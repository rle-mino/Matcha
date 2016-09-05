import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import mailer from '../mail';
import * as userSchema from '../schema/users';
import * as authController from './auth';

const blockUser = (users, toBlock, by) => {
	users.update({ username: toBlock }, {
		$pull: {
			visiter: by,
			interestedIn: by,
			interestedBy: by,
		},
		m$push: {
			blockedBy: by,
		},
	});
	return (true);
};

const asFake = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.username, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		res.set('logToken', log.loginToken.token);
		const { username } = req.body;
		if (username === log.username) {
			return (res.status(500).send('impossible to report onself as fake'));
		}
		const users = db.collection('users');
		const askedUser = await users.findOne({ username });
		if (!askedUser) return (res.status(500).send(`${username} does not exist`));
		const already = await (askedUser.reporterFake ?
			askedUser.reporterFake.indexOf(log.username) : null);
		if (already !== -1 && already != null) {
			return (res.status(500).send(`${log.username} already reported ${username} as fake`));
		}
		users.update({ username }, { $push: { reporterFake: log.username } });
		await blockUser(users, username, log.username);
		mailer('raphael.leminor@gmail.com', `${username} has been reported has fake`, 'Fake reporter');
		return (res.status(200).send(`${username} has been successfully report as fake`));
	});
	return (false);
};

const asBlocked = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.username, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		res.set('logToken', log.loginToken.token);
		const { username } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username });
		if (!askedUser) return (res.status(500).send(`${username} does not exist`));
		await blockUser(users, username, log.username);
		return (res.status(200).send(`${username} has been successfully blocked by ${log.username}`));
	});
	return (false);
};

export { asFake, asBlocked };
