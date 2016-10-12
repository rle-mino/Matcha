import externalIp				from 'external-ip';
import geoip					from 'geo-from-ip';
import sender					from '../sender';
import * as tagController		from '../tag';
import * as parserController	from '../parserController';

const getLocation = async (req, callback) => {
	const getIp = externalIp();
	getIp((err, ip) => {
		let location = {};
		if (ip) {
			const data = geoip.allData(ip);
			if (!data) location = null;
			else {
				location.lat = data.location.latitude;
				location.lng = data.location.longitude;
			}
		}
		callback(location);
	});
};

const insertDetails = (req, res, newLocation) => {
	const log = req.loggedUser;
	const users = req.db.collection('users');
	const orientation = req.body.orientation || 'bisexual';
	const detailsAndRegisterData = {
		...req.body,
		orientation,
		location: newLocation,
	};
	users.update({ username: log.username }, { $set: detailsAndRegisterData });
	tagController.add(req.body.tags, req.db);
	return (sender(res, true, `details about ${log.username} have been successfully added !`));
};

const addDetails = async (req, res) => {
	const error = await parserController.detailsChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	if ((req.body.location
	&& (req.body.location.lat === null
	|| req.body.location.lng === null))
	|| !req.body.location) {
		getLocation(req, (newLocation) => {
			insertDetails(req, res, newLocation);
		});
	} else insertDetails(req, res, req.body.location);
	return (false);
};

export default addDetails;
