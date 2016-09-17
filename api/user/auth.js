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
	if (!logToken) return (null);
	const users = db.collection('users');
	const loggedUser = await users.findOne({ 'loginToken.token': logToken });
	if (!loggedUser) return (null);
	const actualDate = new Date().getTime() / 1000;
	const lifeTime = actualDate - loggedUser.loginToken.creaDate;
/*
****	const token = crypto.tokenGenerator();
****	const newLoginToken = { token, creaDate: actualDate };
****	//IF IT'S MORE THAN 10SEC AND LESS THAN 2 WEEKS
****	if (lifeTime > 10 && lifeTime < 1209600) {
****		await users.update({ username: loggedUser.username },
****		{
****			$set: { loginToken: newLoginToken },
****		});
****		return ({
****			...loggedUser,
****			loginToken: { token },
****		});
****	// IF IT'S MORE THAN 2 WEEKS
****	} else
*/
	if (lifeTime > 1209600) {
		await users.update({ username: loggedUser.username }, { $unset: { loginToken: '' } });
	// IF IT'S LESS THAN 10S
	} else if (lifeTime <= 10) {
		await users.update({ username: loggedUser.username },
							{ $set: {
								loginToken: {
										token: loggedUser.loginToken.token,
										creaDate: actualDate,
									},
								},
							});
	}
	return (loggedUser);
};

const login = async (req, res) => {
	let error = 0;
	if (!req.body.username) error = error | 1;
	if (!req.body.password) error = error | 2;
	if (error & 1 || error & 2) return (res.send({
		status: false,
		details: 'invalid request',
		require: [(error & 1 ? 'username' : null), (error & 2 ? 'password' : null)],
	}));
	mongoConnectAsync(res, async (db) => {
		const { username, password } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({
			username,
			password: crypto.encrypt(password),
		});
		if (!askedUser) {
			return (res.send({
				status: false,
				details: 'Username or password invalid',
			}));
		} else if (askedUser && askedUser.confirmationKey) {
			return (res.send({
				status: false,
				details: `${askedUser.username}'s account is not activated`,
			}));
		}
		const loginToken = {
			token: crypto.tokenGenerator(),
			creaDate: new Date().getTime() / 1000,
		};
		await users.update({ username }, { $set: { loginToken } });
		res.set('logToken', loginToken.token);
		return (res.send({
			details: `${username} successfully connected`,
			status: true,
		}));
	});
	return (false);
};

const logout = (req, res) => {
	const logToken = req.get('logToken');
	if (!logToken) {
		res.status(400).send('logToken require');
	} else {
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const askedUser = await users.findOne({ 'loginToken.token': logToken });
			if (!askedUser) {
				res.status(500).send(`impossible to find a user with ${logToken}`);
			} else {
				await users.update({ 'loginToken.token': logToken }, { $unset: { loginToken: '' } });
				res.status(500).send('successfully disconnected');
			}
		});
	}
};

export { login, logout, checkToken, errorMessage };
