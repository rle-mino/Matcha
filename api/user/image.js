import Joi from 'joi';
import fs from 'fs';
import * as userSchema from '../schema/users';
import * as authController from './auth';
import mongoConnectAsync from '../mongo';

const add = (req, res) => {
	mongoConnectAsync(res, async (db) => {
		const extension = req.file.originalname.split('.')[1];
		const image = `${req.file.filename}.${extension}`;
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		const users = db.collection('users');
		if (log.images && log.images.length === 5) {
			fs.unlinkSync(`${__dirname}/../../public/${req.file.filename}`);
			return (res.status(500).send(`${log.username} already have 5 images`));
		}
		const newImagesArray = (log.images ? [...log.images, image] : [image]);
		users.update({ username: log.username }, { $set: { images: newImagesArray } });
		return (res.status(500).send(`${log.username}'s images are now up to date`));
	});
	return (false);
};

const remove = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.removeImage, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		const { imgID } = req.body;
		const users = db.collection('users');
		if (log.images && log.images[imgID]) {
			fs.unlinkSync(`${__dirname}/../../public/${log.images[imgID].split('.')[0]}`);
			log.images.splice(imgID, 1);
			await users.update({ username: log.username }, { $set: { images: log.images } });
			return (res.status(200).send('image removed'));
		}
		return (res.status(500).send('this image does not exists'));
	});
	return (false);
};

const replace = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.replaceImage, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		const { newImage, id } = req.body;
		const users = db.collection('users');
		const newImagesArray = [...log.images];
		newImagesArray[id] = newImage;
		users.update({ username: log.username }, { $set: { images: newImagesArray } });
		return (res.status(200).send('image successfully replaced'));
	});
	return (false);
};

export { replace, add, remove };
