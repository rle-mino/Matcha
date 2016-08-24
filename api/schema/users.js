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
	username: Joi.string().alphanum().min(3).max(30).required(),
	password: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
	sex: Joi.string().regex(/^(male|female|other)$/),
	orientation: Joi.string().regex(/^(gay|bisexual|straight)$/),
	bio: Joi.string().min(80),
	tags: Joi.array().min(3),
	location: Joi.string().alphanum(),
	image: Joi.string().alphanum().regex(/^data:image\/(jpeg|png);base64,/),
});

const changePassword = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	oldPassword: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
	newPassword: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
});

const username = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30).required(),
	requester: Joi.string().alphanum().min(3).max(30).required(),
});

const modif = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30),
	firstname: Joi.string().alphanum().min(2).max(30),
	lastname: Joi.string().alphanum().min(2).max(30),
	password: Joi.string().regex(/(?=.*\w)(?=.*\d)(?=.*[A-Z]).{8}/).required(),
	mail: Joi.string().email(),
	birthdate: Joi.date().max(moment().subtract(18, 'y').format('MM-DD-YYYY')),
	sex: Joi.string().regex(/^(male|female|other)$/),
	orientation: Joi.string().regex(/^(gay|bisexual|straight)$/),
	bio: Joi.string().min(80),
	tags: Joi.array().min(3),
	location: Joi.string().alphanum(),
	image: Joi.string().alphanum().regex(/^data:image\/(jpeg|png);base64,/),
});

const search = Joi.object().keys({
	searcher: Joi.string().alphanum().min(3).max(30).required(),
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

export { register, details, modif, username, search, changePassword, forgot, resetWithKey };