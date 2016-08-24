import nodemailer from 'nodemailer';

const sendMail = (to, text, subject) => {
	const stmp = 'smtps://apimatcha@gmail.com:apiMatcha1212@smtp.gmail.com';
	const transporter = nodemailer.createTransport(stmp);
	const mailOptions = {
		from: 'apimatcha@gmail.com',
		to,
		subject,
		text,
	};
	transporter.sendMail(mailOptions, (err, info) => {
		console.log(err || info);
	});
};

export default sendMail;