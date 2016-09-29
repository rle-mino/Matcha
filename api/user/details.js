import mongoConnectAsync		from '../mongo';
import * as tagController		from '../tag';
import * as parserController	from '../parserController';
import * as authController		from './auth';

const addDetails = async (req, res) => {
	const error = await parserController.detailsChecker(req.body);
	if (error) {
		return (res.send({
			status: false,
			details: 'invalid request',
			error,
		}));
	}
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.send(authController.errorMessage));
		const users = db.collection('users');
		const orientation = req.body.orientation || 'bisexual';
		const detailsAndRegisterData = {
			...req.body,
			orientation,
		};
		users.update({ username: log.username }, { $set: detailsAndRegisterData });
		tagController.add(req.body.tags, db);
		return (res.status(200).send({
			status: true,
			details: `details about ${log.username} have been successfully added !`,
		}));
	});
	return (true);
};

export { addDetails };
