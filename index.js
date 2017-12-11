'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const restService = express();
const fonction = require('./function.js');

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/map', function(req, resp) {
    // console.log(req.IncomingMessage);
    console.log(req.body);
    fonction.userInfoRequest(req.body.id);
    fonction.requeteFnaimCheckLocalisation(req, resp);
});

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
