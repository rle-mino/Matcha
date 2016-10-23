import _			from 'lodash';
import * as parser	from './schema/parser';

const registerChecker = async (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.username(data.username, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.password(data.password, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.firstnameLastname(data.firstname, true, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.firstnameLastname(data.lastname, true, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.mail(data.mail, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.birthdate(data.birthdate, true);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'username' &&
			key !== 'firstname' &&
			key !== 'lastname' &&
			key !== 'mail' &&
			key !== 'birthdate' &&
			key !== 'password') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

const loginChecker = async (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.username(data.username, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.password(data.password, false);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'username' &&
			key !== 'password') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

const detailsChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.gender(data.gender, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.orientation(data.orientation, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.bio(data.bio, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.location(data.location, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.tags(data.tags, false);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'gender' &&
			key !== 'orientation' &&
			key !== 'bio' &&
			key !== 'location' &&
			key !== 'tags') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

const confirmMailChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.username(data.username, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.newMailKey(data.newMailKey, true);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'username' &&
			key !== 'newMailKey') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

const forgotPasswordChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.mail(data.mail, true);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'mail') {
			error.push({ path: key, error: 'unauthorized' });
		}
	});
	return (!error.length ? null : error);
};

const resetWithKeyChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.username(data.username, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.password(data.password, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.resetKey(data.resetKey, true);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'username' &&
			key !== 'password' &&
			key !== 'resetKey') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

const removeIMGChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.imgID(data.imgID, true);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'imgID') error.push({ path: key, error: 'unauthorized' });
	});
	return (!error.length ? null : error);
};

const updateProfileChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.firstnameLastname(data.firstname, false, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.firstnameLastname(data.lastname, false, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.birthdate(data.birthdate, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.gender(data.gender, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.orientation(data.orientation, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.bio(data.bio, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.tags(data.tags, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.location(data.location, false);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'firstname' &&
			key !== 'lastname' &&
			key !== 'birthdate' &&
			key !== 'gender' &&
			key !== 'orientation' &&
			key !== 'bio' &&
			key !== 'tags' &&
			key !== 'location') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

const searchChecker = (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.name(data.name, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.ageMin(data.ageMin, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.ageMax(data.ageMax, true);
	if (testVal !== true) error.push(testVal);
	testVal = parser.age(data.ageMin, data.ageMax);
	if (testVal !== true) error.push(testVal);
	testVal = parser.distPopTag(data.tagMin, true, 'tagMin');
	if (testVal !== true) error.push(testVal);
	testVal = parser.distPopTag(data.tagMax, true, 'tagMax');
	if (testVal !== true) error.push(testVal);
	testVal = parser.distPopTag(data.distMin, true, 'distMin');
	if (testVal !== true) error.push(testVal);
	testVal = parser.distPopTag(data.distMax, true, 'distMax');
	if (testVal !== true) error.push(testVal);
	testVal = parser.distPopTag(data.popMin, true, 'popMin');
	if (testVal !== true) error.push(testVal);
	testVal = parser.distPopTag(data.popMax, true, 'popMax');
	if (testVal !== true) error.push(testVal);
	testVal = parser.gender(data.gender, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.orientation(data.orientation1, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.orientation(data.orientation2, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.orientation(data.orientation3, false);
	if (testVal !== true) error.push(testVal);
	testVal = parser.sort(data.sort, true);
	if (testVal !== true) error.push(testVal);
	_.forEach(data, (el, key) => {
		if (key !== 'name' &&
			key !== 'ageMin' &&
			key !== 'ageMax' &&
			key !== 'tagMin' &&
			key !== 'tagMax' &&
			key !== 'distMin' &&
			key !== 'distMax' &&
			key !== 'popMin' &&
			key !== 'gender' &&
			key !== 'orientation1' &&
			key !== 'orientation2' &&
			key !== 'orientation3' &&
			key !== 'popMax' &&
			key !== 'sort') {
				error.push({ path: key, error: 'unauthorized' });
			}
	});
	return (!error.length ? null : error);
};

export {
	registerChecker,
	loginChecker,
	detailsChecker,
	confirmMailChecker,
	forgotPasswordChecker,
	resetWithKeyChecker,
	removeIMGChecker,
	updateProfileChecker,
	searchChecker,
};
