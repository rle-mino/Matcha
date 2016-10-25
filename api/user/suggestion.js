import _					from 'lodash';
import sender				from '../sender';
import * as tools			from '../tools';

const getSearchOBJ = (gender, orientation) => {
	let searchOBJ = null;
	if (gender !== 'other') {
		let sex = null;
		if (orientation === 'gay') {
			sex = gender === 'male' ? 'male' : 'female';
			searchOBJ = {
				$or: [
					{ gender: sex, orientation: 'gay' },
					{ gender: sex, orientation: 'bisexual' },
				],
			};
		} else if (orientation === 'straight') {
			sex = gender === 'female' ? 'male' : 'female';
			searchOBJ = {
				$or: [
					{ gender: sex, orientation: 'straight' },
					{ gender: sex, orientation: 'bisexual' },
				],
			};
		} else {
			searchOBJ = {
				$nor: [
					{ gender: gender === 'male' ? 'female' : 'male', orientation: 'gay' },
					{ gender: gender === 'male' ? 'male' : 'female', orientation: 'straight' },
					{ gender: 'other' },
				],
			};
		}
	} else searchOBJ = { gender: 'other' };
	return (searchOBJ);
};

const suggestion = async (req, res) => {
	const searchOBJ = getSearchOBJ(req.loggedUser.gender, req.loggedUser.orientation);
	const users = req.db.collection('users');
	let results = await users.find(searchOBJ, {
		_id: 0,
		password: 0,
		notifications: 0,
		token: 0,
		mail: 0,
		bio: 0,
		interestedIn: 0,
		interestedBy: 0,
		blockedBy: 0,
		reporterFake: 0,
	}).toArray();
	results = await tools.addUsefullData(results, req);
	// TO FINISH
	const age = tools.getAge(req.loggedUser.birthdate);
	results = results.map((user) => {
		user.score = tools.getAgeScore(user.age, age);
		user.score += tools.getPopScore(user.popularity);
		user.score += tools.getDistScore(user.distance);
		user.score += tools.getCommonTagsScore(user.commonTags);
		return (user);
	});
	results.sort((userA, userB) => -userA.score - -userB.score);
	results = results.map((result) => _.omit(result, [
		'birthdate',
		'visit',
		'interestCounter',
		'location',
		'tags',
		'visiter',
		'score',
	]));
	results = results.slice(0, 10);
	sender(res, true, 'succes', results);
};

export default suggestion;