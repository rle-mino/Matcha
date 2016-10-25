import geolib						from 'geolib';

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
		return userA.tags.reduce((accu, actual, index) => {
			let val = 0;
			if (index === 1 && userB.tags && userB.tags.indexOf(accu) !== -1) val++;
			if (userB.tags && userB.tags.indexOf(actual) !== -1) val++;
			return (index === 1 ? val : accu + val);
		});
	}
	return (0);
};

const getDistance = (userA, userB) => {
	const distance = geolib.getDistance({
			latitude: userA.location.lat,
			longitude: userA.location.lng,
		}, {
			latitude: userB.location.lat,
			longitude: userB.location.lng,
		});
		const kmDist = distance / 1000;
		userB.distance = kmDist;
		return (kmDist);
};

const addUsefullData = async (results, req) => {
	return await results.map((user) => {
		user.age = getAge(user.birthdate);
		user.popularity = getPopularity(user.visit, user.interestCounter);
		user.commonTags = getCommonTags(req.loggedUser, user);
		user.distance = getDistance(req.loggedUser, user);
		return (user);
	});
};

const getAgeScore = (ageA, ageB) => {
	const ageDiff = ageA - ageB;
	if (ageDiff < 2 || ageDiff > -2) return 100;
	else if (ageDiff < 5 || ageDiff > -5) return 75;
	else if (ageDiff < 10 || ageDiff > -10) return 50;
	else if (ageDiff < 20 || ageDiff > -20) return 25;
	return (0);
};

const getDistScore = (dist) => {
	if (dist < 5) return (100);
	else if (dist < 10) return (75);
	else if (dist < 20) return (50);
	else if (dist < 30) return (25);
	return (0);
};

const getCommonTagsScore = (comTags) => {
	if (comTags > 25) return (100);
	else if (comTags > 18) return (75);
	else if (comTags > 10) return (50);
	else if (comTags > 5) return (25);
	return (0);
};

const getPopScore = (pop) => {
	return (pop * 10);
};

export { roundTwo,
	getPopularity,
	getAge,
	getCommonTags,
	getDistance,
	addUsefullData,
	getAgeScore,
	getDistScore,
	getCommonTagsScore,
	getPopScore,
};
