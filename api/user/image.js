import Joi						from 'joi';
import path						from 'path';
import fs						from 'fs';
import Jimp						from 'jimp';
import mongoConnectAsync		from '../mongo';
import sender					from '../sender';
import * as userSchema			from '../schema/users';
import * as authController		from './auth';
import * as parserController	from '../parserController';

const createMini = async (filename) => {
	Jimp.read(`${path.resolve('public')}/${filename}`, (err, file) => {
		if (err) return (false);
		file.resize(96, Jimp.AUTO).write(`${path.resolve('public')}/min/${filename}`);
		return (true);
	});
};

const addExtensionFilename = async (filename, mimetype) => {
	const publicFolder = path.resolve('public');
	const newName = mimetype === 'image/jpeg' ? `${filename}.jpg` : `${filename}.png`;
	fs.renameSync(`${publicFolder}/${filename}`, `${publicFolder}/${newName}`);
	createMini(newName);
	return (newName);
};

const add = (req, res) => {
	if (!req.file) return (sender(res, false, 'invalid entry', [{ image: 'required' }]));
	mongoConnectAsync(res, async (db) => {
		if (req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') {
			return (sender(res, false, 'Cannot use this file as image'));
		}
		const filename = await addExtensionFilename(req.file.filename, req.file.mimetype);
		const log = await authController.checkToken(req, db);
		if (!log) {
			fs.unlinkSync(`${__dirname}/../../public/${filename}`);
			fs.unlinkSync(`${__dirname}/../../public/min/${filename}`);
			return (res.send(authController.errorMessage));
		}
		if (log.images && log.images.length === 5) {
			fs.unlinkSync(`${__dirname}/../../public/${filename}`);
			return (sender(res, false, `${log.username} already have 5 images`));
		}
		const users = db.collection('users');
		const newImagesArray = (log.images ? [...log.images, filename] : [filename]);
		users.update({ username: log.username }, { $set: { images: newImagesArray } });
		return (sender(res, true, `${log.username}'s images are now up to date`, filename));
	});
	return (false);
};

const remove = (req, res) => {
	const error = parserController.removeIMGChecker(req.body);
	if (error) return (sender(res, false, 'invalid entry', error));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.send(authController.errorMessage));
		const { imgID } = req.body;
		const users = db.collection('users');
		const index = log.images ? log.images.indexOf(imgID) : -1;
		if (index !== -1) {
			try {
				fs.unlink(`${__dirname}/../../public/${imgID}`);
				fs.unlink(`${__dirname}/../../public/min/${imgID}`);
			} catch (err) {
				console.log('already removed');
			}
			log.images.splice(index, 1);
			await users.update({ username: log.username }, { $set: { images: log.images } });
			return (sender(res, true, 'image removed'));
		}
		return (sender(res, false, 'this image does not exists'));
	});
	return (false);
};

const replace = (req, res) => {
	const { error } = Joi.validate(req.body, userSchema.imageID, { abortEarly: false });
	if (error) return (res.status(400).send(error.details));
	if (!req.file) return (res.status(400).send('image field required'));
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.status(401).send(authController.errorMessage));
		if (req.file.mimetype !== 'image/jpeg' || req.file.mimetype !== 'image/png') {
			return (res.status(400).send('Cannot use this file as image'));
		}
		const { imgID } = req.body;
		if (imgID > 4) return (res.status(400).send('Cannot add more than 5 images'));
		const newImage = req.file.filename;
		const users = db.collection('users');
		const newImagesArray = [...log.images];
		newImagesArray[imgID] = newImage;
		fs.unlink(`${__dirname}/../../public/${log.images[imgID]}`);
		await users.update({ username: log.username }, { $set: { images: newImagesArray } });
		return (res.status(200).send('image successfully replaced'));
	});
	return (false);
};

const getAll = (req, res) => {
	mongoConnectAsync(res, async (db) => {
		const log = await authController.checkToken(req, db);
		if (!log) return (res.send(authController.errorMessage));
		return (sender(res, true, 'success', log.images || []));
	});
};

export { replace, add, remove, getAll };
