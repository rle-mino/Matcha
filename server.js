import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import cors from 'cors';
import * as register from './api/user/register';
import * as passwordController from './api/user/password';
import * as detailsController from './api/user/details';
import * as generalController from './api/user/general';
import * as imageController from './api/user/image';
import * as updateMailController from './api/user/updateMail';
import * as interestController from './api/user/interest';
import * as authController from './api/user/auth';
import * as deleteController from './api/user/delete';
import * as reportController from './api/user/report';
import * as parserController from './api/parserController';
import * as tagController from './api/tag';

const app = express();
const upload = multer({ dest: `${__dirname}/public` });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//		USER
app.get('/api/user/get/singular/all', generalController.getSingular);
app.get('/api/user/get/singular/fast', generalController.getFastDetails);
// password
app.put('/api/user/forgot_password', passwordController.forgot);
app.put('/api/user/update/reset_password', passwordController.resetWithKey);
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
app.delete('/api/user/remove_image', imageController.remove);
app.post('/api/user/replace_image', upload.single('image'), imageController.replace);
// report
app.put('/api/user/report/fake', reportController.asFake);
app.put('/api/user/report/block', reportController.asBlocked);

//		TAG
app.get('/api/tag/get/all', tagController.getAll);

app.post('/api/test', parserController.test);

app.listen(8080);
