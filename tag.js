import mongoConnectAsync from './mongo';

const add = (newTags, db) => {
	if (newTags.length) {
		const tags = db.collection('tags');
		newTags.map(async (tag) => {
			const already = await tags.findOne({ value: tag });
			if (!already) tags.insert({ value: tag });
		});
	}
};

const getAll = (req, res) => {
	mongoConnectAsync(res, async (db) => {
		const tags = db.collection('tags');
		const allTags = await tags.find().toArray();
		res.status(200).json(allTags);
	});
};

export { add, getAll };