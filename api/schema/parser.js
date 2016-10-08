const username = (login, required) => {
	const path = 'username';
	if (!login && !!required) return ({ path, error: 'required' });
	if (login.length < 3) return ({ path, error: '3 characters min' });
	if (login.length > 30) return ({ path, error: '30 characters max' });
	if (!login.match(/^[a-zA-Z0-9]+$/)) {
		return ({ path, error: 'may only contain alphanumeric characters' });
	}
	return (true);
};

const password = (pass, checkSecure) => {
	const path = 'password';
	if (!pass) return ({ path, error: 'required' });
	if (!!checkSecure && !pass.match(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/)) {
		return ({ path, error: 'unsecure password' });
	}
	return (true);
};

const firstnameLastname = (name, required, first) => {
	const path = first ? 'firstname' : 'lastname';
	if (name === '') return ({ path, error: '1 characters min' });
	if (!name && !required) return (true);
	if (!name && !!required) return ({ path, error: 'required' });
	if (name.length > 30) return ({ path, error: '30 characters max' });
	if (!name.match(/^[a-zA-Z]+$/)) return ({ path, error: 'invalid' });
	return (true);
};

const mail = (email, required) => {
	const path = 'mail';
	const reg = /^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
	if (!email && !required) return (true);
	if (!email && !!required) return ({ path, error: 'required' });
	if (!email.match(reg)) return ({ path, error: 'invalid' });
	return (true);
};

const birthdate = (birth, required) => {
	const path = 'birthdate';
	if (!birth && !required) return (true);
	if (!birth && !!required) return ({ path, error: 'required' });
	if (!birth.match(/^(0?\d|[12]\d|3[01])-(0?\d|1[012])-((?:19|20)\d{2})$/)) {
		return ({ path, error: 'invalid entry' });
	}
	if (birth.length !== 10) return ({ path, error: 'invalid entry' });
	const today = new Date();
	const birthConv = new Date(birth);
	const age = today.getFullYear() - birthConv.getFullYear();
	const month = today.getMonth() - birthConv.getMonth();
	const errorAge = { path, error: 'Too young' };
	if (month < 0 || (month === 0 && today.getDate() < birthConv.getDate())) {
		if (age - 1 < 18) return (errorAge);
	} else if (age < 18) return (errorAge);
	return (true);
};

const gender = (gend, required) => {
	const path = 'gender';
	if (!gend && !required) return (true);
	if (!gend && !!required) return ({ path, error: 'required' });
	if (!gend.match(/^(male|female|other)$/)) return ({ path, error: 'invalid entry' });
	return (true);
};

const orientation = (ori, required) => {
	const path = 'orientation';
	if (!ori && !required) return (true);
	if (!ori && !!required) return ({ path, error: 'required' });
	if (!ori.match(/^(gay|bisexual|straight)$/)) return ({ path, error: 'invalid entry' });
	return (true);
};

const bio = (biog, required) => {
	const path = 'bio';
	if (!biog && !required) return (true);
	if (!biog && !!required) return ({ path, error: 'required' });
	if (biog.length < 80) return ({ path, error: '80 characters min' });
	return (true);
};

const tags = (tagsList, required) => {
	const path = 'tags';
	if (!tagsList && !required) return (true);
	if (!tagsList && !!required) return ({ path, error: 'required' });
	if (!(tagsList instanceof Array)) return ({ path, error: 'needs to be an array' });
	return (true);
};

const location = (loca, required) => {
	const path = 'location';
	if (!loca && !!required) return ({ path, error: 'required' });
	return (true);
};

const imgID = (id, required) => {
	const path = 'imgID';
	if (!id & !required) return (true);
	if (!id && !!required) return ({ path, error: 'required' });
	return (true);
};

const newMailKey = (mailKey, required) => {
	const path = 'newMailKey';
	if (!mailKey && !required) return (true);
	if (!mailKey && !!required) return ({ path, error: 'required' });
	return (true);
};

const deleteKey = (delKey, required) => {
	const path = 'deleteKey';
	if (!delKey && !required) return (true);
	if (!delKey && !!required) return ({ path, error: 'required' });
	return (true);
};

const resetKey = (resKey, required) => {
	const path = 'resetKey';
	if (!resKey && !required) return (true);
	if (!resKey && !!required) return ({ path, error: 'required' });
	return (true);
};

export {
	username,
	password,
	firstnameLastname,
	mail,
	birthdate,
	gender,
	orientation,
	bio,
	tags,
	location,
	imgID,
	newMailKey,
	deleteKey,
	resetKey,
};
