'use strict'
const jsdom = require("jsdom");
const $ = require("jquery")(jsdom.jsdom().defaultView);
const configuration = require('./configuration.js');
const axios = require('axios');

function responseMessenger(resp, speech, finalData)
{
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
function searchLocalisation(res, resp)
{
    let speech;
    if (res.data[0].id == '') {
        speech = "Désolé je n'ai pas compris votre recherche. Veuillez reformuler votre zone de recherche.";
        responseMessenger(resp, speech, null);
    } else {
        speech = res.data[0];
        // speech = 'Ok je lance la recherche pour un/une ' + req.body.result.contexts[4].parameters.GoodType[0] + ' de ' + req.body.result.contexts[4].parameters.nbRoom + ' pieces minimum avec une surface de ' + req.body.result.contexts[4].parameters.minArea + ' m2 et pour un prix maximum de ' + req.body.result.contexts[4].parameters.maxPrice + ' dans le secteur de ' + req.body.result.contexts[4].parameters.location;
    }
    return speech;
}
function getLocation(req)
{
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.location ? req.body.result.parameters.location : "Seems like some problem. Speak again."
    return speech;
}

function checkParametersForRequete(el)
{
    let parameters = {};
    if (typeof el.parameters.GoodType === 'string') {
        if (el.parameters.GoodType === 'appartement') {
            parameters.TYPE = 1;
        } else if (el.parameters.GoodType === 'maison') {
            parameters.TYPE = 2;
        }
    } else {
        if (el.parameters.GoodType) {
            if (el.parameters.GoodType[0] === 'appartement') {
                parameters.TYPE = 1;
            } else if (el.parameters.GoodType[0] === 'maison') {
                parameters.TYPE = 2;
            }
        }
    }

    parameters.NB_PIECES = el.parameters.nbRoom;
    parameters.SURFACE_MIN = el.parameters.minArea;
    parameters.PRIX_MAX = el.parameters.maxPrice;

    return parameters;
}

function getParametersForRequete(req, speech)
{
    let parameters = {};
    let data = req.body.result.contexts;
    parameters.localites = [
        {
            label: speech.label,
            value: speech.label,
            id: parseInt(speech.id),
            type: parseInt(speech.type)
        }
    ];

    data.forEach(function (el) {

        if (el.name === 'salestypelocation') {
            parameters = checkParametersForRequete(el);
            parameters.TRANSACTION = 2;

        } else if (el.name === 'salestypeachat-followup') {
            parameters = checkParametersForRequete(el);
            parameters.TRANSACTION = 1;

        }
    });

    return parameters;
}

function checkResultats(resultats)
{
    let data;
    let finalData = [];
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
    }
    return finalData;
}
function requeteFnaimGetResult(parameters, speech, resp)
{
    let url = configuration.fnaimUrlBuy;
    axios.get(url +
        '?localites=[{"label":"' + speech.label + '","value":"' + speech.label + '","id":"' + parseInt(speech.id) + '","type":"' + parseInt(speech.type) + '"}]' +
        '&TYPE[]=' + parameters.TYPE +
        '&NB_PIECES[]=' + parameters.NB_PIECES +
        '&SURFACE_MIN=' + parameters.SURFACE_MIN +
        '&PRIX_MAX=' + parameters.PRIX_MAX +
        '&TRANSACTION=' + parameters.TRANSACTION +
        '&submit=Recherche').then(function(result){
        let $response = $(result.data);
        let resultats = $('.annonce_liste ul.liste li.item', $response);
        let finalData = checkResultats(resultats);

        responseMessenger(resp, speech, finalData);

    });
}
function requeteFnaimCheckLocalisation(req, resp)
{
    var speech = getLocation(req);
    console.log(speech);
    axios.get(configuration.fnaimUrlLocalization + '?term=' + speech)
        .then(function(res){
            speech = searchLocalisation(res, resp);
            return speech;
        })
        .then(function(speech){
            if (typeof speech === 'object'){
                let parameters = getParametersForRequete(req, speech);
                console.log('PARAMETER =>', parameters);
                requeteFnaimGetResult(parameters, speech, resp);
            }

        })
        .catch(function (error) {
            console.log(error);
        })
}

module.exports = $.extend({
    requeteFnaimCheckLocalisation
});