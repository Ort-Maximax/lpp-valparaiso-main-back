'use strict';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io').apply(server);
const cors = require('cors');
const bodyParser = require('body-parser');

const routes = require('./routes/routes.js');
const bearerToken = require('express-bearer-token');


app.use(cors());
app.use(bearerToken());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
io.on('connection', socket => {
  app.socket = socket;
});

routes(app);
server.listen(process.env.PORT || 3009, function() {
  console.log('app running on port.', server.address().port);
});

io.listen(server);

module.exports = server;
