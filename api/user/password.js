import mailer					from '../mail';
import mongoConnectAsync		from '../mongo';
import sender					from '../sender';
import * as parserController	from '../parserController';
import * as crypto				from '../crypto';

const forgot = async (req, res) => {
	// UPDATE REQUIRED
	const error = await parserController.forgotPasswordChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	mongoConnectAsync(res, async (db) => {
		const { mail } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ mail });
		if (!askedUser) return (sender(res, false, `${mail} does not exist`));
		const key = crypto.miniTokenGenerator();
		mailer(mail, `Use this code to reset your password ${key}`, 'Reset your password');
		await users.update({ mail }, { $set: { resetKey: key } });
		return (sender(res, true, `A mail has been sent to ${mail}`));
	});
	return (false);
};

const changePassword = async (req, res) => {
	const error = parserController.changePasswordChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	const { oldPassword, newPassword } = req.body;
	const users = req.db.collection('users');
	const oldCryptedPassword = crypto.encrypt(oldPassword);
	const newCryptedPassword = crypto.encrypt(newPassword);
	if (req.loggedUser.password !== oldCryptedPassword) {
		return (sender(res, false, 'user does not exist or old password is invalid'));
	}
	users.update({ username: req.loggedUser.username }, { $set: { password: newCryptedPassword } });
	return (sender(res, true, `${req.loggedUser.username}'s password has been updated`));
};

const resetWithKey = (req, res) => {
	// UPDATE REQUIRED
	const error = parserController.resetWithKeyChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	mongoConnectAsync(res, async (db) => {
		const { username, resetKey, password } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username });
		if (!askedUser) return (sender(res, false, `${username} does not exist`));
		else if (askedUser && askedUser.resetKey !== resetKey) {
			return (sender(res, false, `impossible to reset ${username}'s password with this key`));
		}
		await users.update({ username }, {
			$unset: { resetKey: '' },
			$set: { password: crypto.encrypt(password) },
		});
		return (sender(res, true, `${username}'s password successfully updated'`));
	});
	return (false);
};

export { forgot, changePassword, resetWithKey };
