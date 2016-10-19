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

export { roundTwo, getPopularity, getAge };
