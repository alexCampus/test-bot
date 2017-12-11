'use strict'
const jsdom = require("jsdom");
const $ = require("jquery")(jsdom.jsdom().defaultView);
const configuration = require('./configuration.js');
const axios = require('axios');

function userInfoRequest(resp, userId) {
    axios.get("https://graph.facebook.com/v2.6/" + userId + "?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=EAAHDua4aSJABAHxgLlulhv2Ixu2r8KKFUcNvrt2FxGwZCu6VlpXOPMw4yAk4T9qrcHnjg5LZALF61HBNGArPrOGTtDCBBZAdjSUR1gbZCCorwcyf2iRHtbarKtTZCXcraNVYZAfbwuhuizKaZAZAZBbnoQbHd3xvacA9VPyJEZBOUyiAZDZD")
        .then(function(res){
            let speech = 'Bienvenue, ' + res.data.first_name + ' ' + res.data.last_name + ' que souhaites tu recherchez une Location ? Un Achat ?';
            responseMessenger(resp, speech, null);
        })
        .catch(function(error){
            console.error('Error while userInfoRequest: ', error);
        })
}

function requeteFnaimCheckLocalisation(req, resp)
{
    var speech = getLocation(req);

    axios.get(configuration.fnaimUrlLocalization + '?term=' + speech)
        .then(function(res){
            speech = searchLocalisation(res, resp);
            return speech;
        })
        .then(function(speech){
            if (typeof speech === 'object'){
                let parameters = getParametersForRequete(req, speech);

                requeteFnaimGetResult(parameters, speech, resp);
            }

        })
        .catch(function (error) {
            console.log(error);
        })
}

function getLocation(req)
{
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.location ? req.body.result.parameters.location : "Seems like some problem. Speak again."
    return speech;
}

function searchLocalisation(res, resp)
{
    let speech;
    if (res.data[0].id == '') {
        speech = "Désolé je n'ai pas compris votre recherche. Veuillez reformuler votre zone de recherche.";
        responseMessenger(resp, speech, null);
    } else {
        speech = res.data[0];
    }
    return speech;
}

function getParametersForRequete(req)
{
    let parameters = {};
    let data = req.body.result.contexts;

    data.forEach(function (el) {
        if (el.name === 'salestypelocation') {
            parameters             = checkParametersForRequete(el);
            parameters.TRANSACTION = 2;

        } else if (el.name === 'salestypeachat-followup') {
            parameters             = checkParametersForRequete(el);
            parameters.TRANSACTION = 1;
        }
    });

    return parameters;
}

function checkParametersForRequete(el)
{
    let parameters = {};
    if (typeof el.parameters.GoodType === 'string') {
        if (el.parameters.GoodType === 'appartement') {
            parameters.TYPE = 1;
        } else if (el.parameters.GoodType === 'maison') {
            parameters.TYPE = 2;
        } else if (el.parameters.GoodType === 'terrain') {
            parameters.TYPE = 3;
        }
    } else {
        if (el.parameters.GoodType) {
            if (el.parameters.GoodType[0] === 'appartement') {
                parameters.TYPE = 1;
            } else if (el.parameters.GoodType[0] === 'maison') {
                parameters.TYPE = 2;
            } else if (el.parameters.GoodType[0] === 'terrain') {
                parameters.TYPE = 2;
            }
        }
    }

    parameters.NB_PIECES   = el.parameters.nbRoom;
    parameters.SURFACE_MIN = el.parameters.minArea;
    parameters.PRIX_MAX    = el.parameters.maxPrice;

    return parameters;
}

function responseMessenger(resp, speech, finalData)
{
    if (finalData != null) {
        resp.json({
            speech      : 'ok',
            displayText : 'ok',
            data        : {
                facebook : [
                    {
                        attachment: {
                            type    : "template",
                            payload : finalData
                        }
                    },
                    {
                        text: "Que souhaitez vous faire maintenant ?"
                    },
                    {
                        text: "Une autre recherche pour un achat?"
                    },
                    {
                        text: "Une location ?"
                    }
                ]
            },
            source: 'webhook-echo-sample'
        });
    } else {
        resp.json({
            speech      : speech,
            displayText : speech,
            source      : 'webhook-echo-sample'
        });
    }
}

function checkResultats(resultats, parameters, speech)
{
    let data;
    let finalData = {};

    if (resultats.length == 0) {
        finalData.template_type = "button";
        finalData.text          = "Il n'y a aucun résultat correspondant à votre recherche. Si vous souhaitez chercher dans une autre localité, vous pouvez saisir votre recherche. Sinon vous pouvez revenir au menu en tapant Annuler";
        finalData.buttons       = [
            {
                type  :"web_url",
                url   : configuration.fnaimUrl,
                title :"Visit Fnaim Web Site"
            }
        ];
    } else {
        finalData.template_type = "list";
        finalData.elements      = [];

        resultats.each(function (index) {
            if (index < 3) {
                let img_url = $('.itemImage img', this).attr("src");
                let testUrl = img_url.split(':');
                img_url     = testUrl[0] === 'http' ? img_url : 'http://fnaim.fr' + img_url;
                data        = {
                    title          : $('h3 a', this).html(),
                    image_url      : img_url,
                    default_action : {
                        type                : "web_url",
                        url                 : 'www.fnaim.fr' + $('h3 a', this).attr("href"),
                        webview_height_ratio: "tall"
                    },
                    buttons: [
                        {
                            type  :"web_url",
                            url   : configuration.fnaimUrlBuy + '?localites=[{"label":"' + speech.label + '","value":"' + speech.label + '","id":"' + parseInt(speech.id) + '","type":"' + parseInt(speech.type) + '"}]' +
                            '&TYPE[]=' + parameters.TYPE +
                            '&NB_PIECES[]=' + parameters.NB_PIECES +
                            '&SURFACE_MIN=' + parameters.SURFACE_MIN +
                            '&PRIX_MAX=' + parameters.PRIX_MAX +
                            '&TRANSACTION=' + parameters.TRANSACTION +
                            '&submit=Recherche',
                            title :"Voir toutes les Annonces"
                        }
                    ]
                };

            finalData.elements.push(data);
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
        '&submit=Recherche')
        .then(function(result){
            let $response = $(result.data);
            let resultats = $('.annonce_liste ul.liste li.item', $response);
            let finalData = checkResultats(resultats, parameters, speech);
            responseMessenger(resp, speech, finalData);
        });
}


module.exports = $.extend({
    userInfoRequest,
    requeteFnaimCheckLocalisation
});