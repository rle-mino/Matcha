import _						from 'lodash';
import sender					from '../sender';
import * as notify				from '../notify';
import * as reportController	from './report';
import * as tools				from '../tools';
import * as tagController		from '../tag';
import * as parserController	from '../parserController';

const getSingular = (sockList) => async (req, res) => {
	const log = req.loggedUser;
	const { username } = req.query;
	const users = req.db.collection('users');
	const askedUser = await users.findOne({ username: username || log.username }, {
		password: 0,
		token: 0,
		notifications: 0,
	});
	if (!askedUser) return sender(res, false, `Error - ${username} not found`);
	if (reportController.areBlocked(log, askedUser)) {
		return (sender(res, false, 'user\'s blocked'));
	}
	const { birthdate, visit, interestCounter, interestedBy } = askedUser || '';
	if (askedUser.username !== log.username) {
		const alreadyVisited = _.find(askedUser.visiter, (visiter) => visiter === log.username);
		if (!alreadyVisited) {
			notify.send(sockList, req.db, `${log.username} has looked at your profile`, askedUser);
			await users.update({ username }, {
				$inc: { visit: 1 },
				$push: { visiter: { $each: [log.username], $position: 0 } },
			});
		}
	}
	const age = tools.getAge(birthdate);
	const popularity = tools.getPopularity(visit, interestCounter);
	const interToReq = !!_.find(interestedBy,
					(likedUser) => likedUser === log.username);
	const liked = log.interestedBy.indexOf(askedUser.username) !== -1;
	let alreadyReportAsFake = false;
	if (askedUser.reporterFake) {
		alreadyReportAsFake = askedUser.reporterFake.indexOf(log.username) !== -1;
	}
	const allInfo = {
		...askedUser,
		popularity,
		interToReq,
		age,
		liked,
		alreadyReportAsFake,
		location: askedUser.location ? askedUser.location.address : null,
		selfReq: askedUser.username === req.loggedUser.username,
	};
	if (askedUser.username === log.username) return (sender(res, true, 'success', allInfo));
	const sendableInfo = await _.omit(allInfo, [
		'_id',
		'mail',
		'birthdate',
		'visit',
		'visiter',
		'interestedBy',
		'interestCounter',
		'interestedIn',
		'blockedBy',
		'reporterFake',
		'notifications',
		'location',
	]);
	return (sender(res, true, 'success', sendableInfo));
};

const updateProfil = async (req, res) => {
	const log = req.loggedUser;
	const error = await parserController.updateProfileChecker(req.body);
	if (error) return (sender(res, false, 'invalid request', error));
	const users = req.db.collection('users');
	if (req.body.tags) tagController.add(req.body.tags, req.db);
	await users.update({ username: log.username }, { $set: req.body });
	return (sender(res, true, `${log.username}'s data successfully updated`));
};

export { getSingular, updateProfil };
