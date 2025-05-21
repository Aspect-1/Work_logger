const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/user.routes');
const mainRouter = require('./routes/main.routes');
const connectToDB = require('./config/db');

dotenv.config();
connectToDB();

const app = express();

// Log model directory being served (debugging)
console.log('Serving models from:', path.join(__dirname, 'public/models'));

// Middleware
app.use(express.static('public'));
app.use('/models', express.static(path.join(__dirname, 'public/models')));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routers
app.use('/user', userRouter);
app.use('/', mainRouter);

// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
