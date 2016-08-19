import crypto from 'crypto';

const	algorithm = 'aes-256-ctr';
const	password = 'd6F3Efeq';

const encrypt = (pass) => {
	const cipher = crypto.createCipher(algorithm, password);
	let crypted = cipher.update(pass, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
};

const decrypt = (pass) => {
	const decipher = crypto.createDecipher(algorithm, password);
	let dec = decipher.update(pass, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
};

export { encrypt, decrypt };