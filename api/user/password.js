import mailer					from '../mail';
import mongoConnectAsync		from '../mongo';
import sender					from '../sender';
import * as parserController	from '../parserController';
import * as crypto				from '../crypto';

const forgot = async (req, res) => {
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
		return (sender(res, false, `A mail has been sent to ${mail}`));
	});
	return (false);
};

const changePassword = (req, res) => {
	// const { error } = Joi.validate(req.body, userSchema.changePassword, { abortEarly: false });
	// if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const { username, oldPassword, newPassword } = req.body;
		const users = db.collection('users');
		const oldCryptedPassword = crypto.encrypt(oldPassword);
		const newCryptedPassword = crypto.encrypt(newPassword);
		const already = await users.findOneAndUpdate({ username, password: oldCryptedPassword },
													{ $set: { password: newCryptedPassword } },
													{ returnNewDocument: true });
		if (already.value) return (res.status(200).send(`${username}'s password has been updated`));
		return (res.status(500).send(`${username} does not exist or old password is invalid`));
	});
	return (false);
};

const resetWithKey = (req, res) => {
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
