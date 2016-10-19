import sender						from '../sender';
import * as parserController		from '../parserController';
import * as tools					from '../tools';

const filterTags = async (results, req, tagMin, tagMax) => {
	return await results.filter((user) => {
		if (req.loggedUser.tags.length) {
			const commonTags = req.loggedUser.tags.reduce((accu, actual, index) => { // REDUCE
				let val = 0;
				if (index === 1 && user.tags && user.tags.indexOf(accu) !== -1) val++;
				if (user.tags && user.tags.indexOf(actual) !== -1) val++;
				return (index === 1 ? val : accu + val);
			});
			return (commonTags >= tagMin && (commonTags <= tagMax || tagMax === 100));
		}
		return (false);
	});
};

const filterAge = async (results, ageMin, ageMax) => {
	return await results.filter((user) => {
		const age = tools.getAge(user.birthdate);
		if (typeof age !== 'number') return (false);
		return (age >= ageMin && age <= ageMax);
	});
};

const filterPop = async (results, popMin, popMax) => {
	return await results.filter((user) => {
		const popularity = tools.getPopularity(user.visit, user.interestCounter);
		return (popularity >= popMin && (popularity <= popMax || popMax === 100));
	});
};

const user = async (req, res) => {
	const error = parserController.searchChecker(req.query);
	if (error) return (sender(res, false, 'invalid request', error));
	const { query } = req;
	let results = [];
	const users = req.db.collection('users');
	if (query.name) {
		const regex = new RegExp(`${query.name}`);
		results = await users.find({
			$or: [
				{ username: regex },
				{ firstname: regex },
				{ lastname: regex },
			],
		}).toArray();
	} else results = await users.find().toArray();
	// filter tags
	const tagMin = parseInt(query.tagMin, 10);
	const tagMax = parseInt(query.tagMax, 10);
	if (tagMin !== 0 || tagMax !== 100) {
		results = await filterTags(results, req, tagMin, tagMax);
	}
	// filter age
	const ageMin = parseInt(query.ageMin, 10);
	const ageMax = parseInt(query.ageMax, 10);
	if (ageMin !== 18 || ageMax !== 100) {
		results = await filterAge(results, ageMin, ageMax);
	}
	// filter pop
	const popMin = parseInt(query.popMin, 10);
	const popMax = parseInt(query.popMax, 10);
	if (popMin !== 0 || popMax !== 100) {
		results = await filterPop(results, popMin, popMax);
	}
	// filter dist
	// filter gender
	// filter orientation
	return (sender(res, true, 'success', results));
};

export { user };