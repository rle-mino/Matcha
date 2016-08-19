import Joi from 'joi';
import * as userSchema from '../schema/users';
import * as crypto from '../crypto';
import mongoConnectAsync from '../mongo';

const addRegister = async (req, res) => {
	const { error } = await Joi.validate(req.body, userSchema.register, { abortEarly: false });
	if (error) res.status(400).send(error.details);
	else {
		mongoConnectAsync(res, async (db) => {
			const { password, username, mail } = req.body;
			const users = db.collection('users');
			const already = await users.findOne({ $or: [{ username }, { mail }] });
			if (already) {
				res.status(500).send(`Error - User ${already.username === username ?
													username : mail} already exist`);
			} else {
			await users.insert({
				...req.body,
				password: crypto.encrypt(password),
			});
			res.status(200).send(`${username} has been successfully registred !`);
			}
		});
	}
};


export { addRegister };