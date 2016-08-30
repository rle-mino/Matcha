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
	const { error } = Joi.validate(req.body, userSchema.login, { abortEarly: false });
	if (error) await res.status(400).send(error.details);
	mongoConnectAsync(res, async (db) => {
		const { username, password } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({
			username,
			password: crypto.encrypt(password),
		});
		if (!askedUser) {
			res.status(500).send({
				status: 'fail',
				login: 'unknown',
				details: 'Invalid username or password',
			});
		} else if (askedUser && askedUser.confirmationKey) {
			res.status(500).send({
				status: 'fail',
				login: askedUser.username,
				details: `${askedUser.username}'s account is not activated`,
			});
		} else {
			const loginToken = {
				token: crypto.tokenGenerator(),
				creaDate: new Date().getTime() / 1000,
			};
			await users.update({ username }, { $set: { loginToken } });
			res.status(200).send({
				status: 'success',
				login: username,
				details: `${username} successfully connected`,
				token: loginToken.token,
			});
		}
	});
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
