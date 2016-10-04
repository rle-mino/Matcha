import mongodb from 'mongodb';

const mongoConnectSocket = (url, mongo, callback) => {
	mongo.connect(url, (err, db) => {
		if (err) return (false);
		return callback(db);
	});
};

const mongoConnectAsync = (res, callback) => {
	const mongo = mongodb.MongoClient;
	const url = 'mongodb://138.68.142.55/matcha';
	if (!res) return (mongoConnectSocket(url, mongo, callback));
	mongo.connect(url, (err, db) => {
		if (err) res.status(500).send('Error - Fail to connect to database');
		else callback(db);
	});
	return (true);
};

export default mongoConnectAsync;
