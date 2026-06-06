// 加载环境变量配置
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ocrRouter = require('./routes/ocr');
var classifyRouter = require('./routes/classify');
var classifyOcrRouter = require('./routes/classifyOcr');
var modelsRouter = require('./routes/models');
var uploadRouter = require('./routes/upload');
var historyRouter = require('./routes/history');
var statisticsRouter = require('./routes/statistics');

// 认证中间件
const authMiddleware = require('./middleware/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/ocr', authMiddleware, ocrRouter);
app.use('/classify', authMiddleware, classifyRouter);
app.use('/classifyOcr', authMiddleware, classifyOcrRouter);
app.use('/api/models', authMiddleware, modelsRouter);
app.use('/api/upload', authMiddleware, uploadRouter);
app.use('/api/history', authMiddleware, historyRouter);
app.use('/api/statistics', authMiddleware, statisticsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
