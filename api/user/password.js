import Joi from 'joi';
import mailer from '../mail';
import mongoConnectAsync from '../mongo';
import userSchema from '../schema/users';
import * as crypto from '../crypto';

const forgot = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.forgot, { abortEarly: false });
	if (error) res.status(400).send(error.details);
	else {
		mongoConnectAsync(res, async (db) => {
			const { mail } = req.body;
			const users = db.collection('users');
			const askedUser = await users.findOne({ mail });
			if (!askedUser) res.status(500).send(`${mail} does not exist`);
			else {
				const key = crypto.tokenGenerator();
				const url = `http://localhost:8000/forgot_password?username=${encodeURI(askedUser.username)}&resetkey=${encodeURI(key)}`;
				mailer(mail, `Use this link to reset your password ${url}`, 'Reset your password');
				await users.update({ mail }, { $set: { resetKey: key } });
				res.status(200).send(`A mail has been sent to ${mail}`);
			}
		});
	}
};

const changePassword = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.changePassword, { abortEarly: false });
	if (error) res.status(400).send(error.details);
	else {
		mongoConnectAsync(res, async (db) => {
			const { username, oldPassword, newPassword } = req.body;
			const users = db.collection('users');
			const oldCryptedPassword = crypto.encrypt(oldPassword);
			const newCryptedPassword = crypto.encrypt(newPassword);
			const already = await users.findOneAndUpdate({ username, password: oldCryptedPassword },
														{ $set: { password: newCryptedPassword } },
														{ returnNewDocument: true });
			if (already.value) res.status(200).send(`${username}'s password has been updated`);
			else res.status(500).send(`${username} does not exist or old password is invalid`);
		});
	}
};

const resetWithKey = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.resetWithKey, { abortEarly: false });
	if (error) res.status(400).send(error.details);
	else {
		mongoConnectAsync(res, async (db) => {
			const { username, resetkey, password } = req.body;
			const users = db.collection('users');
			const askedUser = await users.findOne({ username });
			if (!askedUser) res.status(500).send(`${username} does not exist`);
			else if (askedUser && askedUser.resetKey !== resetkey) {
				res.status(500).send(`impossible to reset ${username}'s password with this key`);
			} else {
				await users.update({ username },
					{
						$unset: { resetKey: '' },
						$set: { password },
					});
				res.status(200).send(`${username}`);
			}
		});
	}
};

export { forgot, changePassword, resetWithKey };