import Joi from 'joi';
import moment from 'moment';

const register = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	firstname: Joi.string().alphanum().min(2).max(30).required(),
	lastname: Joi.string().alphanum().min(2).max(30).required(),
	password: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
	mail: Joi.string().email().required(),
	birthdate: Joi.date().max(moment().subtract(18, 'y').format('MM-DD-YYYY')).required(),
});

const details = Joi.object().keys({
	sex: Joi.string().regex(/^(male|female|other)$/),
	orientation: Joi.string().regex(/^(gay|bisexual|straight)$/),
	bio: Joi.string().min(80),
	tags: Joi.array().min(3),
	location: Joi.string().alphanum(),
});

const changePassword = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	oldPassword: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
	newPassword: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
});

const username = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
});

const updateProfil = Joi.object().keys({
	firstname: Joi.string().alphanum().min(2).max(30),
	lastname: Joi.string().alphanum().min(2).max(30),
	birthdate: Joi.date().max(moment().subtract(18, 'y').format('MM-DD-YYYY')),
	sex: Joi.string().regex(/^(male|female|other)$/),
	orientation: Joi.string().regex(/^(gay|bisexual|straight)$/),
	bio: Joi.string().min(80),
	tags: Joi.array().items(Joi.string().alphanum()).min(3),
	location: Joi.string().alphanum(),
});

const search = Joi.object().keys({
	tags: Joi.array().max(10),
	name: Joi.array(),
});

const forgot = Joi.object().keys({
	mail: Joi.string().email().required(),
});

const resetWithKey = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	resetkey: Joi.number().required(),
	password: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
});

const login = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	password: Joi.string().required(),
});

const imageID = Joi.object().keys({
	imgID: Joi.number().required(),
});

const removeAccount = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	password: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
	deleteKey: Joi.string().required(),
});

const mailConf = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	newMailKey: Joi.string().required(),
});

export {
	register,
	details,
	updateProfil,
	username,
	search,
	changePassword,
	forgot,
	resetWithKey,
	login,
	imageID,
	removeAccount,
	mailConf,
};
