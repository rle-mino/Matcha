import express from 'express';
import bodyParser from 'body-parser';
import register from './api/user/register';
import * as passwordController from './api/user/password';
import * as detailsController from './api/user/details';
import * as generalController from './api/user/general';
import * as tagController from './api/tag';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//		USER
app.get('/api/user/get/singular', generalController.getSingular);
app.get('/api/user/get/singular_fast_details', generalController.getFastDetails);
app.put('/api/user/update/forgot_password', passwordController.forgot);
app.put('/api/user/update/reset_password', passwordController.resetWithKey);
app.put('/api/user/add/details', detailsController.addDetails);
app.put('/api/user/update/password', passwordController.changePassword);
app.put('/api/user/update/like', detailsController.updateInterest);
app.post('/api/user/add/register', register);

//		TAG
app.get('/api/tag/get/all', tagController.getAll);

app.listen(8080);
