import _							from 'lodash';
import sender						from '../sender';
import * as parserController		from '../parserController';
import * as tools					from '../tools';

const filterTags = async (results, req, tagMin, tagMax) => {
	return await results.filter((user) => {
		if (req.loggedUser.tags.length) {
			const commonTags = user.commonTags;
			return (commonTags >= tagMin && (commonTags <= tagMax || tagMax === 100));
		}
		return (false);
	});
};

const filterAge = async (results, ageMin, ageMax) => {
	return await results.filter((user) => {
		if (typeof user.age !== 'number') return (false);
		return (user.age >= ageMin && user.age <= ageMax);
	});
};

const filterPop = async (results, popMin, popMax) => {
	return await results.filter((user) => {
		return (user.popularity >= popMin && (user.popularity <= popMax || popMax === 100));
	});
};

const filterDist = async (results, req, distMin, distMax) => {
	return await results.filter((user) => user.distance >= distMin && (user.distance <= distMax));
};

const getSearchOBJ = (query, req) => {
	let searchOBJ = {
		confirmationKey: { $exists: false },
		blockedBy: { $nin: [req.loggedUser.username] },
		$and: [],
	};
	const regex = new RegExp(`${query.name}`);

	if (query.name) {
		searchOBJ.$and[0] = {
			$or: [
				{ username: regex },
				{ firstname: regex },
				{ lastname: regex },
		] };
	}
	if (query.orientation1 || query.orientation2 || query.orientation3) {
		searchOBJ.$and[searchOBJ.$and.length] = {
			$or: [
				{ orientation: query.orientation1 || false },
				{ orientation: query.orientation2 || false },
				{ orientation: query.orientation3 || false },
			] };
	}
	if (query.gender) searchOBJ.gender = query.gender;
	if (req.loggedUser.blockedBy) {
		const blockedUsernames = req.loggedUser.blockedBy.map((blocked) => {
			return ({ username: blocked });
		});
		if (blockedUsernames.length > 0) {
			searchOBJ.$and[searchOBJ.$and.length].$nor = blockedUsernames;
		}
	}
	if (searchOBJ.$and.length === 0) {
		searchOBJ = _.omit(searchOBJ, ['$and']);
	}
	return (searchOBJ);
};

const addUsefullData = async (results, req) => {
	return await results.map((user) => {
		user.age = tools.getAge(user.birthdate);
		user.popularity = tools.getPopularity(user.visit, user.interestCounter);
		user.commonTags = tools.getCommonTags(req.loggedUser, user);
		user.distance = tools.getDistance(req.loggedUser, user);
		return (user);
	});
};

const user = async (req, res) => {
	const error = parserController.searchChecker(req.query);
	if (error) return (sender(res, false, 'invalid request', error));
	const { query } = req;
	let results = [];
	const users = req.db.collection('users');
	const searchOBJ = await getSearchOBJ(query, req);
	results = await users.find(searchOBJ).toArray();
	// add usefull data
	results = await addUsefullData(results, req);
	// filter dist
	const distMin = parseInt(query.distMin, 10);
	const distMax = parseInt(query.distMax, 10);
	results = await filterDist(results, req, distMin, distMax);
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
	results = results.map((userOBJ) => _.omit(userOBJ, [
		'password',
		'birthdate',
		'mail',
		'visit',
		'interestCounter',
		'interestedBy',
		'interestedIn',
		'loginToken',
		'token',
		'tags',
		'location',
		'bio',
		'reporterFake',
		'blockedBy',
		'visiter',
		'notifications',
	]));
	await results.sort((userA, userB) => {
		if (query.sort === 'age' || query.sort === 'distance') {
			return (+userA[query.sort] - +userB[query.sort]);
		}
		return (-userA[query.sort] - -userB[query.sort]);
	});
	return (sender(res, true, 'success', results));
};

const tag = async (req, res) => {
	if (!req.query.tag) {
		return (sender(res, false, 'invalid request', [{ path: 'tag', error: 'required' }]));
	}
	const users = req.db.collection('users');
	let results = await users.find({
		tags: { $in: [req.query.tag] },
		confirmationKey: { $exists: false },
		blockedBy: { $nin: [req.loggedUser.username] },
	}).toArray();
	results = await addUsefullData(results, req);
	results = await results.filter((user) => {
		if (req.loggedUser.blockedBy && req.loggedUser.blockedBy.indexOf(user.username) !== -1) {
			return (false);
		}
		return (true);
	});
	results = await filterDist(results, req, 0, 100);
	results = results.map((userOBJ) => _.omit(userOBJ, [
		'password',
		'birthdate',
		'mail',
		'visit',
		'interestCounter',
		'interestedBy',
		'interestedIn',
		'loginToken',
		'token',
		'tags',
		'location',
		'bio',
		'reporterFake',
		'blockedBy',
		'visiter',
		'notifications',
	]));
	return (sender(res, true, 'success', results));
};

export { user, tag };
