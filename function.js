'use strict'
const jsdom = require("jsdom");
const $ = require("jquery")(jsdom.jsdom().defaultView);

function responseMessenger(resp, speech, finalData) {
    if (finalData != null) {
        resp.json({
            speech: 'ok',
            displayText: 'ok',
            data : {
                facebook :
                    {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: finalData
                            }
                        }
                    }
            },
            source: 'webhook-echo-sample'
        });
    } else {
        resp.json({
            speech: speech,
            displayText: speech,
            source: 'webhook-echo-sample'
        });
    }
}

module.exports = $.extend({
    responseMessenger
});