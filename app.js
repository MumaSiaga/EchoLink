const express = require(`express`);
require('dotenv').config();
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
require('./config/auth');


app.set('view engine', 'ejs');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
require('./sockets/chatSocket')(io);

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected successfully"))
.catch((err) => console.error("MongoDB connection error:", err));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secretkey', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());


app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/chat', require('./routes/chatRoutes'));
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));