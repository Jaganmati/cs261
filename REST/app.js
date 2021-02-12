/**
 * @file The entry point to the web api server.
 * @author Johnathan Faehn
 */

// Load Environment Variables from .env file, and define the server port.
let port = (process.env.NODE_PORT || 3300);

// Load in all modules.
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const jsonUtils = require('./utils/json');
const commonUtils = require('./utils/common');
const usersRoute = require('./routes/users');
const gameRoute = require('./routes/game');

// Instantiate a server
const app = express();

// Register middleware with the express server.
app.use(bodyParser.json());
app.use(jsonUtils.responseMiddleware);
app.use(commonUtils.protocolMiddleware);

let _root = '/api/v1';

// Allow the users endpoint to register its actions.
usersRoute.register(_root + '/users', app);

// Allow the game endpoint to register its actions.
gameRoute.register(_root + '/game', app);

const httpServer = app.listen(port, (err) => {
  console.log("Node app " + __filename + " is listening on port " + port + "!");
});

module.exports = app;
