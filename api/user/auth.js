import jwt							from 'jsonwebtoken';
import mongoConnectAsync			from '../mongo';
import * as crypto					from '../crypto';
import * as parserController		from '../parserController';
import sender						from '../sender';

const errorMessage = {
	status: false,
	login: 'unknown',
	details: 'user not authorized',
};

const secret = 'matcha secret string';

const getToken = (req) => {
	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
		return req.query.token;
    }
    return null;
};

const checkToken = async (token, db) => {
	const logToken = token;
	if (!logToken) return (null);
	const users = db.collection('users');
	const loggedUser = await users.findOne({ token });
	return (loggedUser || null);
};

const setHeader = (res, token) => {
	res.set('Access-Control-Expose-Headers', 'x-access-token');
	res.set('x-access-token', token);
};

const login = async (req, res) => {
	const error = await parserController.loginChecker(req.body);
	if (error) return (res.send({ status: false, details: 'invalid request', error }));
	mongoConnectAsync(res, async (db) => {
		const { username, password } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({
			username,
			password: crypto.encrypt(password),
		});
		if (!askedUser) return (sender(res, false, 'username or password invalid'));
		else if (askedUser && askedUser.confirmationKey) {
			return (sender(res, false, `${askedUser.username}'s account is not activated`));
		}
		const token = jwt.sign({
			username: askedUser.username,
			id: askedUser._id,
		}, secret);
		await users.update({ username }, { $set: { token } });
		setHeader(res, token);
		return (sender(res, true, `${username} successfully connected`));
	});
	return (false);
};

const logout = async (req, res) => {
	const token = req.loggedUser.token;
	const users = req.db.collection('users');
	await users.update({ token }, { $unset: { token: '' } });
	return (sender(res, true, 'successfully disconnected'));
};

const uncheckedPath = [
	'/api/user/login',
	'/api/user/register',
	'/api/user/forgot_password',
	'/api/user/reset_password',
	'/api/user/confirm_mail',
];

const checkTokenMid = (req, res, next) => {
	if (uncheckedPath.indexOf(req.path) !== -1 || !req.path.includes('/api')) return (next());
	const token = getToken(req);
	if (!token) return (sender(res, false, 'user unauthorized'));
	jwt.verify(token, secret, (err) => {
		if (err) return (sender(res, false, 'user unauthorized'));
		mongoConnectAsync(res, async (db) => {
			const users = db.collection('users');
			const loggedUser = await users.findOne({ token });
			if (!loggedUser) return (sender(res, false, 'user unauthorized'));
			req.loggedUser = loggedUser;
			req.db = db;
			return (next());
		});
		return (true);
	});
	return (false);
};

const error = (err, req, res, next) => next();

export {
	login,
	logout,
	checkToken,
	errorMessage,
	setHeader,
	error,
	checkTokenMid,
	secret,
	uncheckedPath,
};
