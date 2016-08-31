import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import register from './api/user/register';
import * as passwordController from './api/user/password';
import * as detailsController from './api/user/details';
import * as generalController from './api/user/general';
import * as imageController from './api/user/image';
import * as authController from './api/user/auth';
import * as tagController from './api/tag';

const app = express();
const upload = multer({ dest: `${__dirname}/public` });

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

//		USER
app.get('/api/user/get/singular/all', generalController.getSingular);
app.get('/api/user/get/singular/fast', generalController.getFastDetails);
app.put('/api/user/update/forgot_password', passwordController.forgot);
app.put('/api/user/update/reset_password', passwordController.resetWithKey);
app.put('/api/user/add/details', detailsController.addDetails);
app.put('/api/user/update/password', passwordController.changePassword);
app.put('/api/user/update/interest', detailsController.updateInterest);
app.post('/api/user/add/register', register);
app.put('/api/user/auth/login', authController.login);
app.put('/api/user/auth/logout', authController.logout);
app.post('/api/user/add_image', upload.single('image'), imageController.add);
app.put('/api/user/remove_image', imageController.remove);
app.post('/api/user/replace_image', upload.single('image'), imageController.replace);

//		TAG
app.get('/api/tag/get/all', tagController.getAll);

app.listen(8080);
