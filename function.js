'use strict'
const jsdom = require("jsdom");
const $ = require("jquery")(jsdom.jsdom().defaultView);

function responseMessenger(resp) {
    resp.json({
        speech: speech,
        displayText: speech,
        source: 'webhook-echo-sample'
    });
}

module.exports = $.extend({
    responseMessenger
});