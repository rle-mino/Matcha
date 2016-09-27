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

const detailsChecker = async (data) => {
	const error = [];
	let testVal = null;
	testVal = parser.gender(data.gender, false);
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

const test = async (req, res) => {
	res.send(await detailsChecker(req.body));
};

export {
	test,
	registerChecker,
	loginChecker,
};
