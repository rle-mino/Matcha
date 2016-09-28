import Joi						from 'joi';
import mailer					from '../mail';
import mongoConnectAsync		from '../mongo';
import * as crypto				from '../crypto';
import * as userSchema			from '../schema/users';
import * as parserController	from '../parserController';

const register = async (req, res) => {
	const error = await parserController.registerChecker(req.body);
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error,
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
	const error = await parserController.confirmMailChecker(req.body);
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error,
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
