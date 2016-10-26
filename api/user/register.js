import jwt						from 'jsonwebtoken';
import moment					from 'moment';
import sender					from '../sender';
import mailer					from '../mail';
import mongoConnectAsync		from '../mongo';
import * as crypto				from '../crypto';
import * as parserController	from '../parserController';
import * as authController		from './auth';

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
			lastConnection: moment().format('MM-DD-YYYY'),
			confirmationKey: token,
			visit: 0,
			visiter: [],
			interestCounter: 0,
			interestedBy: [],
			interestedIn: [],
			tags: [],
			images: [],
			blockedBy: [],
			reporterFake: [],
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
	if (error) return (sender(res, false, 'invalid request', error));
	mongoConnectAsync(res, async (db) => {
		const { username, newMailKey } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username, confirmationKey: newMailKey });
		if (!askedUser) {
			return (sender(res, false, 'impossible to activate this account with this code'));
		}
		const token = jwt.sign({
			username: askedUser.username,
			id: askedUser._id,
		}, authController.secret);
		users.update({ username }, {
			$unset: { confirmationKey: '' },
			$set: { token },
		});
		authController.setHeader(res, token);
		if (askedUser.orientation) {
			return (sender(res, true, 'mail successfully confirmed'));
		}
		return (sender(res, true, 'account successfully activated'));
	});
	return (false);
};

export { register, confirmMail };
