import Joi from 'joi';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';
import mongoConnectAsync from '../mongo';
import mailer from '../mail';

const register = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.register, { abortEarly: false });
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error: error.details,
		}));
	}
	mongoConnectAsync(res, async (db) => {
		const { password, username, mail } = req.body;
		const users = db.collection('users');
		const already = await users.findOne({ $or: [{ username }, { mail }] });
		if (already) {
			return (res.send({
				status: false,
				details: 'already exists',
				error: `${already.username === username ? username : mail} already exists`,
			}));
		}
		const token = crypto.miniTokenGenerator();
		users.insert({
			...req.body,
			password: crypto.encrypt(password),
			confirmationKey: token,
			visit: 0,
			interestCounter: 0,
			interestedBy: [],
			interestedIn: [],
		});
		await mailer(mail,
					`Use this code to complete your registration ${token}`,
					'Complete your registration');
		return (res.send({
			status: true,
			details: `${username} has been successfully registred !`,
		}));
	});
	return (false);
};

const confirmMail = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.mailConf, { abortEarly: false });
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error: error.details,
		}));
	}
	mongoConnectAsync(res, async (db) => {
		const { username, newMailKey } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username, confirmationKey: newMailKey });
		if (!askedUser) {
			return (res.send({
				status: false,
				details: 'impossible to activate this account with this code',
			}));
		}
		users.update({ username }, { $unset: { confirmationKey: '' } });
		return (res.send({
			status: true,
			details: 'account successfully activated',
		}));
	});
	return (false);
};

export { register, confirmMail };
