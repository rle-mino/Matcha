import express from 'express';
import bodyParser from 'body-parser';
import * as registerController from './user/register';
import * as detailsController from './user/details';
import * as generalController from './user/general';
import * as tagController from './tag';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/user/add/register', registerController.addRegister);
app.post('/api/user/add/details', detailsController.addDetails);
app.get('/api/user/get/all', generalController.getAllData);
app.get('/api/user/get/fast_details', generalController.getFastDetails);

app.post('/api/tag/get_all', tagController.getAll);

app.listen(8080);