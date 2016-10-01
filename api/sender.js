export default (res, status, details, error) => {
	res.send({
		status,
		details,
		error,
	});
	return (status);
};
