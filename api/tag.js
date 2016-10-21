const add = (newTags, db) => {
	if (newTags && newTags.length) {
		const tags = db.collection('tags');
		newTags.map(async (tag) => {
			const already = await tags.findOne({ value: tag });
			if (!already) tags.insert({ value: tag });
			return (!!already);
		});
	}
};

const getAll = async (req, res) => {
	const tags = req.db.collection('tags');
	const allTags = await tags.find().toArray();
	res.json(allTags);
};

export { add, getAll };
