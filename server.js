import express from 'express';
import bodyParser from 'body-parser';
import * as registerController from './api/user/register';
import * as detailsController from './api/user/details';
import * as generalController from './api/user/general';
import * as tagController from './api/tag';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//		USER

app.post('/api/user/add/register', registerController.addRegister);
app.post('/api/user/add/details', detailsController.addDetails);
app.get('/api/user/get/singular', generalController.getAllData);
app.get('/api/user/get/fast_details', generalController.getFastDetails);
app.get('/api/user/get/search', detailsController.search);


//		TAG

app.get('/api/tag/get/all', tagController.getAll);

app.listen(8080);