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
    let parameters = {};
    let url = configuration.fnaimUrlBuy;
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.location ? req.body.result.parameters.location : "Seems like some problem. Speak again."
    axios.get(configuration.fnaimUrlLocalization + '?term=' + speech)
        .then(function (res){
            console.log(res.data[0]);
            if (res.data[0].id == '') {
                console.log('test if => ');
                speech = "Désolé je n'ai pas compris votre recherche. Veuillez reformuler votre zone de recherche.";
                fonction.responseMessenger(resp, speech);
            } else {
                console.log('test else');
                speech = res.data[0];
                // speech = 'Ok je lance la recherche pour un/une ' + req.body.result.contexts[4].parameters.GoodType[0] + ' de ' + req.body.result.contexts[4].parameters.nbRoom + ' pieces minimum avec une surface de ' + req.body.result.contexts[4].parameters.minArea + ' m2 et pour un prix maximum de ' + req.body.result.contexts[4].parameters.maxPrice + ' dans le secteur de ' + req.body.result.contexts[4].parameters.location;
            }
            return speech;

        })
        .then(function(speech){
            let type = 1;
            let transaction = 1;
            let test = req.body.result.contexts;
            parameters.localites = [
                {
                    label: speech.label,
                    value: speech.label,
                    id: parseInt(speech.id),
                    type: parseInt(speech.type)
                }
            ];
            test.forEach(function (el) {

                if (el.name === 'salestypelocation') {
                    console.log('INDEX =>', el);
                    transaction = 2;
                    if (el.parameters.GoodType === 'maison') {
                        type = 2
                    } else if (el.parameters.GoodType === 'appartement') {
                        type = 1
                    }
                    parameters.TYPE = type;
                    parameters.NB_PIECES = el.parameters.nbRoom;
                    parameters.SURFACE_MIN = el.parameters.minArea;
                    parameters.PRIX_MAX = el.parameters.maxPrice;
                } else if (el.name === 'salestypeachat-followup') {
                    console.log('INDEX =>', el);
                    transaction = 1;
                    if (el.parameters.GoodType[0] === 'maison') {
                        type = 2
                    } else if (el.parameters.GoodType[0] === 'appartement') {
                        type = 1
                    }
                    parameters.TYPE = type;
                    parameters.NB_PIECES = el.parameters.nbRoom;
                    parameters.SURFACE_MIN = el.parameters.minArea;
                    parameters.PRIX_MAX = el.parameters.maxPrice;
                }
            });

            console.log(parameters);
            axios.get(configuration.fnaimUrlBuy +
                '?localites=[{"label":"' + speech.label + '","value":"' + speech.label + '","id":"' + parseInt(speech.id) + '","type":"' + parseInt(speech.type) + '"}]' +
                '&TYPE[]=' + parameters.TYPE +
                '&NB_PIECES[]=' + parameters.NB_PIECES +
                '&SURFACE_MIN=' + parameters.SURFACE_MIN +
                '&PRIX_MAX=' + parameters.PRIX_MAX +
                '&TRANSACTION=' + transaction +
                '&submit=Recherche').then(function(result){
                let $response = $(result.data);
                let data;
                let finalData = [];
                let resultats = $('.annonce_liste ul.liste li.item', $response);
                console.log('RESULT =>', resultats.length);
                if (resultats.length == 0) {
                    console.log('NO RESULT');
                    data = {
                        title : "No Result",
                        image_url : "https://i.vimeocdn.com/portrait/58832_300x300",
                        default_action: {
                            type: "web_url",
                            url: "www.fnaim.fr",
                            webview_height_ratio: "tall"
                        }
                    };

                    finalData.push(data);
                    console.log('finalData =>', finalData);

                } else {
                    resultats.each(function (index) {
                        if (index < 3) {
                            data =
                                {
                                    title: $('h3 a', this).html(),
                                    image_url: $('.itemImage img', this).attr("src"),
                                    default_action: {
                                        type: "web_url",
                                        url: 'www.fnaim.fr' + $('h3 a', this).attr("href"),
                                        webview_height_ratio: "tall"
                                    }
                                };

                            finalData.push(data);
                        }
                    })
                    console.log('finalData =>', finalData);
                }
                speech = ok;
                fonction.responseMessenger(resp, speech);
                // resp.json({
                //     speech: 'ok',
                //     displayText: 'ok',
                //     data : {
                //         facebook :
                //             {
                //                 attachment: {
                //                     type: "template",
                //                     payload: {
                //                         template_type: "generic",
                //                         elements: finalData
                //                     }
                //                 }
                //             }
                //     },
                //     source: 'webhook-echo-sample'
                // });
            });
        })
        .catch(function (error) {
            console.log(error);
        })
});

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
