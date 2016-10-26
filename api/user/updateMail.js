import mailer					from '../mail';
import sender					from '../sender';
import * as parserController	from '../parserController';
import * as crypto				from '../crypto';

const updateMail = async (req, res) => {
	const error = parserController.updateMailChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	const token = crypto.miniTokenGenerator();
	const creaDate = new Date().getTime() / 1000;
	const users = req.db.collection('users');
	const { mail } = req.body;
	const newMailConfirm = {
		confirmationKey: token,
		creaDate,
		mail,
	};
	const already = await users.findOne({ mail });
	if (already) return (sender(res, false, 'mail already in use'));
	users.update(
		{ username: req.loggedUser.username },
		{
			$set: newMailConfirm,
			$unset: { token: '' },
		}
	);
	const mailContent = `Please use this code to confirm your new mail adress ${token}
	This link will become useless in 2 hours`;
	mailer(mail, mailContent, 'Confirm Your new mail adress');
	return (sender(res, true, `a mail has been sent to ${mail}`));
};

export default updateMail;
