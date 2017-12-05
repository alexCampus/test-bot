'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');
const configuration = require('./configuration.js');
const axios = require('axios');
const restService = express();
const jsdom = require("jsdom");
const $ = require("jquery")(jsdom.jsdom().defaultView);


restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/echo', function(req, res) {
    // var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Seems like some problem. Speak again."
    return res.json({
        speech: 'Hello my friend',
        displayText: 'Hello my friend',
        source: 'webhook-echo-sample'
    });
});

restService.post('/map', function(req, resp) {
    let parameters = {};
    let url = configuration.fnaimUrlBuy;
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.location ? req.body.result.parameters.location : "Seems like some problem. Speak again."
    axios.get(configuration.fnaimUrlLocalization + '?term=' + speech)
        .then(function (res){
            console.log(res.data[0]);
            if (res.data[0].id == '') {
                console.log('test if => ');
                speech = "Désolé je n'ai pas compris votre recherche. Veuillez reformuler votre zone de recherche."
            } else {
                console.log('test else');
                speech = res.data[0];
                // speech = 'Ok je lance la recherche pour un/une ' + req.body.result.contexts[4].parameters.GoodType[0] + ' de ' + req.body.result.contexts[4].parameters.nbRoom + ' pieces minimum avec une surface de ' + req.body.result.contexts[4].parameters.minArea + ' m2 et pour un prix maximum de ' + req.body.result.contexts[4].parameters.maxPrice + ' dans le secteur de ' + req.body.result.contexts[4].parameters.location;
            }
            return speech;
            // resp.json({
            //     speech: speech,
            //     displayText: speech,
            //     source: 'webhook-echo-sample'
            // });
        })
        .then(function(speech){
            parameters.localites = speech;
            parameters.TYPE = req.body.result.contexts[0].parameters.GoodType[0];
            parameters.NB_PIECES = req.body.result.contexts[0].parameters.nbRoom;
            parameters.SURFACE_MIN = req.body.result.contexts[0].parameters.minArea;
            parameters.PRIX_MAX = req.body.result.contexts[0].parameters.maxPrice;
            axios.get(configuration.fnaimUrlBuy, {
                params: parameters
            }).then(function(result){

                let $response = $(result.data);
                let data = {};
                let finalData = [];
                let resultats = $('.annonce_liste ul.liste li.item', $response);
                // console.log('RESULT =>', resultats);
                console.log('RESULT =>', resultats.length);
                if (resultats.length == 0) {
                    console.log('NO RESULT');
                    data = {
                        attachment : {
                            type : "template",
                            payload : {
                                template_type : "generic",
                                elements : [
                                    {
                                        "title" : "No Result",
                                        "image_url" : "https://i.vimeocdn.com/portrait/58832_300x300"
                                    },
                                    {
                                        "title" : "No Result",
                                        "image_url" : "https://i.vimeocdn.com/portrait/58832_300x300"
                                    }
                                ]
                            }
                        }
                    }
                } else {
                    resultats.each(function (index) {
                        if (index < 3) {
                            data = [
                                {
                                    title: $('h3 a', this).html(),
                                    image_url: $('.itemImage img', this).attr("src"),
                                    url: $('h3 a', this).attr("href")
                                }
                            ];

                            finalData.push(data);
                        }
                    })
                    console.log('RESULT =>', finalData);
                }
                resp.json({
                    speech: speech,
                    displayText: speech,
                    source: 'webhook-echo-sample'
                });
            });
        })
        .catch(function (error) {
            console.log(error);
        })
    // var options = {
    //     uri: configuration.fnaimUrlLocalization,
    //     qs: {
    //         term: speech
    //     },
    //     json: true
    // };
    //
    // rp(options)
    //     .then(function (res) {
    //         console.log('test => ', req.body.result.contexts[4]);
    //         if (res[0].id == '') {
    //             console.log('test if => ', res);
    //             speech = "Désolé je n'ai pas compris votre recherche. Veuillez reformuler votre zone de recherche."
    //         } else {
    //             console.log('test else => ', res);
    //             // speech = 'Ok je lance la recherche pour un/une ' + req.body.result.contexts[4].parameters.GoodType[0] + ' de ' + req.body.result.contexts[4].parameters.nbRoom + ' pieces minimum avec une surface de ' + req.body.result.contexts[4].parameters.minArea + ' m2 et pour un prix maximum de ' + req.body.result.contexts[4].parameters.maxPrice + ' dans le secteur de ' + req.body.result.contexts[4].parameters.location;
    //         }
    //         resp.json({
    //             speech: speech,
    //             displayText: speech,
    //             source: 'webhook-echo-sample'
    //         });
            // parameters.localites = res[0];
            // parameters.TYPE = req.body.result.contexts[0].parameters.GoodType[0];
            // parameters.NB_PIECES = req.body.result.contexts[0].parameters.nbRoom;
            // parameters.SURFACE_MIN = req.body.result.contexts[0].parameters.minArea;
            // parameters.PRIX_MAX = req.body.result.contexts[0].parameters.maxPrice;
            // var choiceWebservice = rp({
            //     url: url,
            //     qs: parameters
            // });
            // choiceWebservice.then(function (result) {
            //     // console.log('response =>', result);
            //     resp.json({
            //         speech: speech,
            //         displayText: speech,
            //         data: {
            //             facebook: {
            //                 attachment: {
            //                     type: "template",
            //                     payload: {
            //                         template_type: "generic",
            //                         elements: [
            //                             {
            //                                 "title": "Hello I am the card",
            //                                 "image_url": "https://i.vimeocdn.com/portrait/58832_300x300"
            //                             }
            //                         ]
            //                     }
            //                 }
            //             }
            //         },
            //         source: 'webhook-echo-sample'
            //     });
            // });
        // })
        // .catch(function (err) {
        //     speech = "Il y a eu une erreur dans le process. Veuillez recommencer la saisie."
        //     console.log(err);
        // });
});

restService.post('/music', function(req, res) {
    var speech = "";
    switch (req.body.result.parameters.AudioSample.toLowerCase()) {
        case "music":
            speech = '<speak>  <audio src="https://actions.google.com/sounds/v1/ambiences/barnyard_with_animals.ogg">did not get your MP3 audio file</audio></speak>';
            break;
        case "delay":
            speech = '<speak>Let me take a break for 3 seconds. <break time="3s"/> I am back again.</speak>';
            break;
    }
    return res.json({
        speech: speech,
        displayText: speech,
        source: 'webhook-echo-sample'
    });
});

restService.post('/video', function(req, res) {
    return res.json({
        speech: '<speak>  <audio src="https://www.youtube.com/watch?v=VX7SSnvpj-8">did not get your MP3 audio file</audio></speak>',
        displayText: '<speak>  <audio src="https://www.youtube.com/watch?v=VX7SSnvpj-8">did not get your MP3 audio file</audio></speak>',
        source: 'webhook-echo-sample'
    });
});



restService.post('/slack-test', function(req, res) {

    var slack_message = {
        "text": "Details of JIRA board for Browse and Commerce",
        "attachments": [{
            "title": "JIRA Board",
            "title_link": "http://www.google.com",
            "color": "#36a64f",

            "fields": [{
                "title": "Epic Count",
                "value": "50",
                "short": "false"
            }, {
                "title": "Story Count",
                "value": "40",
                "short": "false"
            }],

            "thumb_url": "https://stiltsoft.com/blog/wp-content/uploads/2016/01/5.jira_.png"
        }, {
            "title": "Story status count",
            "title_link": "http://www.google.com",
            "color": "#f49e42",

            "fields": [{
                "title": "Not started",
                "value": "50",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }, {
                "title": "Development",
                "value": "40",
                "short": "false"
            }]
        }]
    }
    return res.json({
        speech: "speech",
        displayText: "speech",
        source: 'webhook-echo-sample',
        data: {
            "facebook": slack_message
        }
    });
});




restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
