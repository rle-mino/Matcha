export default (res, status, details, more) => {
	if (status === false) {
		res.send({
			status,
			details,
			error: more,
		});
	} else {
		res.send({
			status,
			details,
			more,
		});
	}
	return (status);
};
