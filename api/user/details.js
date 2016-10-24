import _						from 'lodash';
import sender					from '../sender';
import * as tagController		from '../tag';
import * as parserController	from '../parserController';

const addDetails = async (req, res) => {
	const error = await parserController.detailsChecker(req.body);
	if (error) return (sender(res, false, 'invalid requiest', error));
	const log = req.loggedUser;
	const users = req.db.collection('users');
	const orientation = req.body.orientation || 'bisexual';
	if (req.body.location.address.includes('LOCATE ME')) {
		req.body = _.omit(req.body, ['location']);
	}
	const detailsAndRegisterData = {
		...req.body,
		orientation,
	};
	users.update({ username: log.username }, { $set: detailsAndRegisterData });
	tagController.add(req.body.tags, req.db);
	return (sender(res, true, `details about ${log.username} have been successfully added !`));
};

export default addDetails;
