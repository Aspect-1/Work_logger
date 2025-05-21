const express = require('express');
const path = require('path');
const userRouter = require('./routes/user.routes');
const mainRouter = require('./routes/main.routes');

const dotenv = require('dotenv');
dotenv.config();
const connectToDB = require('./config/db');
connectToDB();
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.static('public'));

// Serve models folder statically for face-api.js
app.use('/models', express.static(path.join(__dirname, 'public/models')));

app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRouter);
app.use('/', mainRouter);

app.get('/test-model', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/models/tiny-face-detector/tiny_face_detector_model-weights_manifest.json'));
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
