const roundTwo = (nb) => {
	const nbM = nb * 100;
	const nbR = Math.floor(nbM);
	return (nbR / 100);
};

const getPopularity = (visit, likes) => roundTwo((likes * 100) / visit) || 0;

export { roundTwo, getPopularity };
