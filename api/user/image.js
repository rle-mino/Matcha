import path						from 'path';
import fs						from 'fs';
import Jimp						from 'jimp';
import sender					from '../sender';
import * as authController		from './auth';
import * as parserController	from '../parserController';

const createMini = async (filename) => {
	Jimp.read(`${path.resolve('public')}/${filename}`, (err, file) => {
		if (err) return (false);
		file.resize(128, Jimp.AUTO).write(`${path.resolve('public')}/min/${filename}`);
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

const add = (upload) => (req, res) => {
	upload(req, res, async (err) => {
		if (err) return (sender(res, false, 'invalid entry', [{ image: 'required' }]));
		if (req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') {
			return (sender(res, false, 'Cannot use this file as image'));
		}
		const log = req.loggedUser;
		if (!log) {
			fs.readFile(`${__dirname}/../../public/${req.file.filename}`, (error) => {
				if (!error) fs.unlinkSync(`${__dirname}/../../public/${req.file.filename}`);
			});
			return (res.send(authController.errorMessage));
		}
		const filename = await addExtensionFilename(req.file.filename, req.file.mimetype);
		if (log.images && log.images.length === 5) {
			fs.readFile(`${__dirname}/../../public/${req.file.filename}`, (error) => {
				if (!error) fs.unlinkSync(`${__dirname}/../../public/${filename}`);
			});
			return (sender(res, false, `${log.username} already have 5 images`));
		}
		const users = req.db.collection('users');
		const newImagesArray = (log.images ? [...log.images, filename] : [filename]);
		users.update({ username: log.username }, { $set: { images: newImagesArray } });
		return (sender(res, true, `${log.username}'s images are now up to date`, filename));
	});
};

const remove = async (req, res) => {
	const error = parserController.removeIMGChecker(req.body);
	if (error) return (sender(res, false, 'invalid entry', error));
	const log = req.loggedUser;
	const { imgID } = req.body;
	const users = req.db.collection('users');
	const index = log.images ? log.images.indexOf(imgID) : -1;
	if (index === -1) return (sender(res, false, 'this image does not exists'));
	fs.readFile(`${__dirname}/../../public/${imgID}`, (err) => {
		if (!err) fs.unlinkSync(`${__dirname}/../../public/${imgID}`);
	});
	fs.readFile(`${__dirname}/../../public/min/${imgID}`, (err) => {
		if (!err) fs.unlinkSync(`${__dirname}/../../public/min/${imgID}`);
	});
	log.images.splice(index, 1);
	await users.update({ username: log.username }, { $set: { images: log.images } });
	return (sender(res, true, 'image removed'));
};

const getAll = (req, res) => sender(res, true, 'success', req.loggedUser.images || []);

export { add, remove, getAll };
