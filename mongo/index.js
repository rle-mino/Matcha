import mongodb from 'mongodb';

const mongoConnectAsync = (res, callback) => {
	const mongo = mongodb.MongoClient;
	const url = 'mongodb://138.68.142.55/matcha';
	mongo.connect(url, (err, db) => {
		if (err) res.status(500).send('Error - Fail to connect to database');
		else callback(db);
	});
};


export default mongoConnectAsync;