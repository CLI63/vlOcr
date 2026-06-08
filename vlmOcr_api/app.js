require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var config = require('./config/appConfig');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ocrRouter = require('./routes/ocr');
var classifyRouter = require('./routes/classify');
var classifyOcrRouter = require('./routes/classifyOcr');
var modelsRouter = require('./routes/models');
var uploadRouter = require('./routes/upload');
var historyRouter = require('./routes/history');
var statisticsRouter = require('./routes/statistics');
var tasksRouter = require('./routes/tasks');
var templatesRouter = require('./routes/templates');
var correctionsRouter = require('./routes/corrections');
var authMiddleware = require('./middleware/auth');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || !config.isProduction) {
      return callback(null, true);
    }

    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-New-Token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/ocr', authMiddleware, ocrRouter);
app.use('/classify', authMiddleware, classifyRouter);
app.use('/classifyOcr', authMiddleware, classifyOcrRouter);
app.use('/api/models', authMiddleware, modelsRouter);
app.use('/api/upload/files', uploadRouter.publicRouter);
app.use('/api/upload', authMiddleware, uploadRouter);
app.use('/api/history', authMiddleware, historyRouter);
app.use('/api/statistics', authMiddleware, statisticsRouter);
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/templates', authMiddleware, templatesRouter);
app.use('/api/corrections', authMiddleware, correctionsRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
