import mailer					from '../mail';
import mongoConnectAsync		from '../mongo';
import * as parserController	from '../parserController';
import * as crypto				from '../crypto';

const forgot = async (req, res) => {
	const error = await parserController.forgotPasswordChecker(req.body);
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error,
		}));
	}
	mongoConnectAsync(res, async (db) => {
		const { mail } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ mail });
		if (!askedUser) {
			return (res.send({
				status: false,
				details: `${mail} does not exist`,
			}));
		}
		const key = crypto.miniTokenGenerator();
		mailer(mail, `Use this code to reset your password ${key}`, 'Reset your password');
		await users.update({ mail }, { $set: { resetKey: key } });
		return (res.send({
			status: true,
			details: `A mail has been sent to ${mail}`,
		}));
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
	// const { error } = Joi.validate(req.body, userSchema.resetWithKey, { abortEarly: false });
	// if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const { username, resetkey, password } = req.body;
		const users = db.collection('users');
		const askedUser = await users.findOne({ username });
		if (!askedUser) return (res.status(500).send(`${username} does not exist`));
		else if (askedUser && askedUser.resetKey !== resetkey) {
			return (res.status(500).send(`impossible to reset ${username}'s password with this key`));
		}
		await users.update({ username },
			{
				$unset: { resetKey: '' },
				$set: { password },
			});
		return (res.status(200).send(`${username}`));
	});
	return (false);
};

export { forgot, changePassword, resetWithKey };
