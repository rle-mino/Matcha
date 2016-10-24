import express						from 'express';
import moment						from 'moment';
import bodyParser					from 'body-parser';
import multer						from 'multer';
import cors							from 'cors';
import http							from 'http';
import socketIo						from 'socket.io';
import _							from 'lodash';
import expressJWT					from 'express-jwt';
import mongoConnectAsync			from './api/mongo';
import addDetails					from './api/user/details';
import * as register				from './api/user/register';
import * as passwordController		from './api/user/password';
import * as generalController		from './api/user/general';
import * as imageController			from './api/user/image';
import * as updateMailController	from './api/user/updateMail';
import * as interestController		from './api/user/interest';
import * as authController			from './api/user/auth';
import * as deleteController		from './api/user/delete';
import * as reportController		from './api/user/report';
import * as searchController		from './api/user/search';
import * as notify					from './api/notify';
import * as tagController			from './api/tag';

const app = express();
const server = http.createServer(app);
const upload = multer({ dest: `${__dirname}/public` }).single('image');
const io = socketIo(server);

const users = [];

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/user/get_img_src', express.static('public'));
app.use(expressJWT({
	secret: authController.secret,
}).unless({ path: authController.uncheckedPath }));
app.use(authController.error);
app.use(authController.checkTokenMid);

io.on('connection', (socket) => {
	socket.on('auth', (data) => {
		mongoConnectAsync(null, async (db) => {
			const log = await authController.checkToken(data, db);
			if (!log) return (socket.emit('connect status', 'unauthorized'));
			db.collection('users').update(
				{ username: log.username },
				{ $set: { lastConnection: 'connected' },
			});
			if (!_.find(users, (user) => user.username === log.username)) {
				users.push({ username: log.username, socket });
			} else {
				console.log('already in');
			}
			console.log('connect', users.map((el) => el.username));
			return (socket.emit('connect status', 'approuved'));
		});
	});

	socket.on('disconnect', () => {
		mongoConnectAsync(null, async (db) => {
			const toRemove = await _.find(users, { socket });
			db.collection('users').update(
				{ username: toRemove.username },
				{ $set: { lastConnection: moment().format('MM-DD-YYYY') },
			});
			_.remove(users, { socket });
		});
		console.log(users.map((el) => el.username));
	});
});

//		USER
app.get('/api/user/singular/all', generalController.getSingular(users));
// notifications
app.get('/api/user/notification/latest', notify.get);
// password
app.put('/api/user/forgot_password', passwordController.forgot);
app.put('/api/user/reset_password', passwordController.resetWithKey);
app.put('/api/user/update/password', passwordController.changePassword);
// add/update global info
app.put('/api/user/add_details', addDetails);
app.post('/api/user/register', register.register);
app.put('/api/user/confirm_mail', register.confirmMail);
app.put('/api/user/update_profile', generalController.updateProfil);
// interest
app.put('/api/user/update_interest', interestController.updateInterest(users));
app.get('/api/user/get/self_interest', interestController.selfInterest);
// update mail
app.put('/api/user/update/mail1o2', updateMailController.updateMail1o2);
app.put('/api/user/update/mail2o2', updateMailController.updateMail2o2);
// delete
app.put('/api/user/delete/send_delete', deleteController.deleteProfile1o2);
app.delete('/api/user/delete', deleteController.deleteProfile2o2);
// logP
app.put('/api/user/login', authController.login);
app.put('/api/user/logout', authController.logout);
//	image
app.post('/api/user/add_image', imageController.add(upload));
app.put('/api/user/remove_image', imageController.remove);
app.get('/api/user/get_images', imageController.getAll);
// report
app.put('/api/user/report/fake', reportController.asFake);
app.put('/api/user/report/block', reportController.asBlocked);
// search

app.get('/api/user/search', searchController.user);
app.get('/api/tag/search', searchController.tag);

//		TAG
app.get('/api/tag/all', tagController.getAll);

server.listen(8080, () => console.log('SERVER STARTED'));
