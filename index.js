'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const configuration = require('./configuration.js');
const axios = require('axios');
const restService = express();
const jsdom = require("jsdom");
const $ = require("jquery")(jsdom.jsdom().defaultView);
const fonction = require('./function.js');

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/map', function(req, resp) {
    fonction.requeteFnaim(req, resp);
});

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
