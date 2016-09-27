const username = (login, required) => {
	if (!login && !!required) return (false);
	if (login.length < 3 || login.length > 30) return (false);
	if (!login.match(/^[a-zA-Z0-9]+$/)) return (false);
	return (true);
};

const password = (pass, checkSecure) => {
	if (!pass) return (false);
	if (!!checkSecure && !password.match(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/)) return (false);
	return (true);
};

const firstnameLastname = (name, required) => {
	if (!name && !!required) return (false);
	if (name.length < 3 || name.length > 30) return (false);
	if (!name.match(/^[a-zA-Z]+$/)) return (false);
	return (true);
};

const mail = (email, required) => {
	const reg = /^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
	if (!mail && !!required) return (false);
	if (!mail.match(reg)) return (false);
	return (true);
};

const birthdate = (birth, required) => {
	if (!birth && !!required) return (false);
	if (birth.match()) return (false);
}

export { username, password, firstnameLastname, mail };
