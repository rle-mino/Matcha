import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import mailer from '../mail';
import * as userSchema from '../schema/users';
import * as authController from './auth';
import * as crypto from '../crypto';

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

export { deleteProfile1o2, deleteProfile2o2 };
