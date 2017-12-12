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
    console.log(req.body.result.action);
    console.log(req.body.originalRequest);
    if (req.body.result.action === 'input.welcome') {
        fonction.userInfoRequest(resp, req.body.originalRequest.data.sender.id);
    } else {
        fonction.requeteFnaimCheckLocalisation(req, resp);
    }
});

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
