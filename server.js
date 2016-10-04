import express						from 'express';
import bodyParser					from 'body-parser';
import multer						from 'multer';
import cors							from 'cors';
import http							from 'http';
import socketIo						from 'socket.io';
import _							from 'lodash';
import mongoConnectAsync			from './api/mongo';
import * as register				from './api/user/register';
import * as passwordController		from './api/user/password';
import * as detailsController		from './api/user/details';
import * as generalController		from './api/user/general';
import * as imageController			from './api/user/image';
import * as updateMailController	from './api/user/updateMail';
import * as interestController		from './api/user/interest';
import * as authController			from './api/user/auth';
import * as deleteController		from './api/user/delete';
import * as reportController		from './api/user/report';
import * as tagController			from './api/tag';

const app = express();
const server = http.createServer(app);
const upload = multer({ dest: `${__dirname}/public` });
const io = socketIo(server);

const users = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/user/get_img_src', express.static('public'));

io.on('connection', (socket) => {
	socket.on('auth', (data) => {
		mongoConnectAsync(null, async (db) => {
			const log = await authController.checkToken(data, db);
			if (!log) return (socket.emit('connect status', 'unauthorized'));
			users.push({ username: log.username, socket });
			console.log(users.map((el) => el.username));
			return (socket.emit('connect status', 'approuved'));
		});
	});

	socket.on('disconnect', () => {
		_.remove(users, { socket });
		console.log(users.map((el) => el.username));
	});
});

//		USER
app.get('/api/user/singular/all', generalController.getSingular(users));
app.get('/api/user/singular/fast', generalController.getFastDetails);
// password
app.put('/api/user/forgot_password', passwordController.forgot);
app.put('/api/user/reset_password', passwordController.resetWithKey);
app.put('/api/user/update/password', passwordController.changePassword);
// add/update global info
app.put('/api/user/add_details', detailsController.addDetails);
app.post('/api/user/register', register.register);
app.put('/api/user/confirm_mail', register.confirmMail);
app.put('/api/user/update/profile', generalController.updateProfil);
// interest
app.put('/api/user/update/interest', interestController.updateInterest);
app.get('/api/user/get/self_interest', interestController.selfInterest);
// update mail
app.put('/api/user/update/mail1o2', updateMailController.updateMail1o2);
app.put('/api/user/update/mail2o2', updateMailController.updateMail2o2);
// delete
app.put('/api/user/delete/send_delete', deleteController.deleteProfile1o2);
app.delete('/api/user/delete', deleteController.deleteProfile2o2);
// log
app.put('/api/user/login', authController.login);
app.put('/api/user/logout', authController.logout);
//	image
app.post('/api/user/add_image', upload.single('image'), imageController.add);
app.put('/api/user/remove_image', imageController.remove);
app.post('/api/user/replace_image', upload.single('image'), imageController.replace);
app.get('/api/user/get_images', imageController.getAll);
// app.get('/api/user/get_img_src/:imgname', imageController.getSRC);
// report
app.put('/api/user/report/fake', reportController.asFake);
app.put('/api/user/report/block', reportController.asBlocked);

//		TAG
app.get('/api/tag/get/all', tagController.getAll);

server.listen(8080, () => console.log('SERVER STARTED'));
