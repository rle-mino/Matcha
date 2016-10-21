const roundTwo = (nb) => {
	const nbM = nb * 100;
	const nbR = Math.floor(nbM);
	return (nbR / 100);
};

const getPopularity = (visit, likes) => roundTwo((likes * 100) / visit) || 0;

const getAge = (birthdate) => {
	const now = new Date();
	const birthDate = new Date(birthdate).getTime();
	const diffMs = now - birthDate;
	const ageDate = new Date(diffMs);
	return (Math.abs(ageDate.getUTCFullYear() - 1970));
};

const getCommonTags = (userA, userB) => {
	if (userA.tags && userA.tags.length && userB.tags && userB.tags.length) {
		userA.tags.reduce((accu, actual, index) => {
			let val = 0;
			if (index === 1 && userB.tags && userB.tags.indexOf(accu) !== -1) val++;
			if (userB.tags && userB.tags.indexOf(actual) !== -1) val++;
			return (index === 1 ? val : accu + val);
		});
	} else return (0);
};

export { roundTwo, getPopularity, getAge, getCommonTags };
