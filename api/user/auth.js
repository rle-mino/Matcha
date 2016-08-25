import Joi from 'joi';
import mongoConnectAsync from '../mongo';
import * as crypto from '../crypto';
import * as userSchema from '../schema/users';

const errorMessage = {
	status: 'fail',
	login: 'unknown',
	details: 'user not authorized',
};

const checkToken = async (req, db) => {
	const logToken = req.get('logToken');
	let loggedUser;
	if (logToken) {
		const users = db.collection('users');
		loggedUser = await users.findOne({ 'loginToken.token': logToken });
		if (loggedUser) {
			const actualDate = new Date().getTime() / 1000;
			const lifeTime = actualDate - loggedUser.loginToken.creaDate;
			const token = crypto.tokenGenerator();
			const newLoginToken = { token, creaDate: actualDate };
			// IF IS MORE THAN 10SEC AND LESS THAN 2 WEEKS
			if (lifeTime > 10 && lifeTime < 1209600) {
				await users.update({ username: loggedUser.username },
				{
					$set: { loginToken: newLoginToken },
				});
				loggedUser.loginToken.token = token;
			// IF IS MORE THAN 2 WEEKS
			} else if (lifeTime > 1209600) {
				await users.update({ username: loggedUser.username }, { $unset: { loginToken: '' } });
				return (undefined);
			// IF IS LESS THAN 10S
			} else if (lifeTime <= 10) {
				await users.update({ username: loggedUser.username },
									{ $set: { loginToken: {
												token: loggedUser.loginToken.token,
												creaDate: actualDate,
												},
											} });
			}
		}
	}
	return loggedUser;
};

const login = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.login, { abortEarly: false });
	if (error) res.status(400).send(error.details);
	else {
		mongoConnectAsync(res, async (db) => {
			const { username, password } = req.body;
			const users = db.collection('users');
			const askedUser = await users.findOne({ username, password: crypto.encrypt(password) });
			if (!askedUser) res.status(500).send('Invalid username or password');
			else {
				const loginToken = {
					token: crypto.tokenGenerator(),
					creaDate: new Date().getTime() / 1000,
				};
				await users.update({ username }, { $set: { loginToken } });
				res.status(200).send({
					status: 'success',
					login: username,
					details: `${username} successfully connected`,
					newToken: loginToken,
				});
			}
		});
	}
};

const logout = (req, res) => {
	const logToken = req.get('logToken');
	if (!logToken) {
		res.status(400).send({
			status: 'fail',
			login: 'unknown',
			details: 'logToken require',
		});
	} else {
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const askedUser = await users.findOne({ 'loginToken.token': logToken });
			if (!askedUser) {
				res.status(500).send({
					status: 'fail',
					login: 'unknown',
					details: `impossible to find a user with ${logToken}`,
				});
			} else {
				await users.update({ 'loginToken.token': logToken }, { $unset: { loginToken: '' } });
				res.status(500).send({
					status: 'success',
					login: askedUser.username,
					details: 'successfully disconnected',
				});
			}
		});
	}
};

export { login, logout, checkToken, errorMessage };