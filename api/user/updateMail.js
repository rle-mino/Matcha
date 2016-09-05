import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import mailer from '../mail';
import * as userSchema from '../schema/users';
import * as authController from './auth';
import * as crypto from '../crypto';

const updateMail1o2 = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.forgot, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		res.set('logToken', log.loginToken.token);
		const token = crypto.tokenGenerator();
		const creaDate = new Date().getTime() / 1000;
		const users = db.collection('users');
		const { mail } = req.body;
		const newMailConfirm = {
			token,
			creaDate,
			newMail: mail,
		};
		await users.update({ username: log.username }, { $set: { newMailConfirm } });
		const url = `http://localhost:8000/confirm_new_mail?username=${encodeURI(log.username)}&newmailkey=${encodeURI(token)}`;
		const mailContent = `Please follow this link to confirm your new mail adress ${url}
		This link will become useless in 2 hours`;
		mailer(mail, mailContent, 'Confirm Your new mail adress');
		return (res.status(200).send(`a mail has been sent to ${mail}`));
	});
	return (false);
};

const updateMail2o2 = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.mailConf, { abortEarly: false });
	if (error) return (res.status(400).send(error.detail));
	mongoConnectAsync(res, async (db) => {
		const { username, newMailKey } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username, 'newMailConfirm.token': newMailKey });
		if (askedUser) {
			await users.update({ username }, { $unset: { newMailConfirm: '' } });
		}
		if (!askedUser || (new Date().getTime() / 1000) - askedUser.newMailConfirm.creaDate > 7200) {
			return (res.status(500).send(`Cannot update ${username}'s mail with this key`));
		}
		users.update({ username }, { $set: { mail: askedUser.newMailConfirm.newMail } });
		return (res.status(200).send(
			`${username}'s mail successfully updated to ${askedUser.newMailConfirm.newMail}`));
	});
	return (false);
};

export { updateMail1o2, updateMail2o2 };
