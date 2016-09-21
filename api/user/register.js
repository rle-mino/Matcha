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
		const token = crypto.tokenGenerator();
		users.insert({
			...req.body,
			password: crypto.encrypt(password),
			confirmationKey: token,
			visit: 0,
			interestCounter: 0,
			interestedBy: [],
			interestedIn: [],
		});
		const url = `http://localhost:8000/complete_registration?username=${encodeURI(username)}&resetkey=${encodeURI(token)}`;
		await mailer(mail,
					`Use this link to complete your registration ${url}`,
					'Complete your registration');
		return (res.send({
			status: true,
			details: `${username} has been successfully registred !`,
		}));
	});
	return (false);
};

export default register;
