var config = require('./ppConfig.json'),
    redirectUri = 'https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb',
    redirectRe = new RegExp(redirectUri + '[#\?](.*)'),
    options = {
      interactive: true,
      url: 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize?client_id=' + config.clientId +
           '&response_type=code' +
           '&scope=https%3A%2F%2Furi.paypal.com%2Fservices%2Finvoicing' +
           '&redirect_uri=' + redirectUri
    };

//console.log("URL:" + options.url);

var paypal = (function(){
  var request = require('request');
  
  var getAccessToken = function(authCode, callback) {
    request.post({
      headers: {'Content-Type' : 'application/x-www-form-urlencoded', 'Accept' : 'application/json', 'Accept-Language' : 'en_US'},
      url:     'https://api.paypal.com/v1/identity/openidconnect/tokenservice',
      auth:   {'user' : config.clientId , 'pass' : config.clientSecret},
      body:    'grant_type=authorization_code&code=' + authCode + '&redirect_uri=' + redirectUri
    }, function(error, response, body) {
      if (error) {
        //console.log("ERROR:" + JSON.stringify(error));
        callback(error, null);
      }

      //console.log("RESPONSE:" + JSON.stringify(response));
      //console.log('BODY:' + JSON.stringify(body));

      if (response.statusCode === 200) {
        body = JSON.parse(body);
        callback(null, {access_token : body.access_token, refresh_token : body.refresh_token});
      } else {
        callback(response, null);
      }
    });
  };

  var getAccessTokenFromRefreshToken = function(refreshToken, callback) {
    request.post({
      headers: {'Content-Type' : 'application/x-www-form-urlencoded', 'Accept' : 'application/json', 'Accept-Language' : 'en_US'},
      url:     'https://api.paypal.com/v1/identity/openidconnect/tokenservice',
      auth:   {'user' : config.clientId , 'pass' : config.clientSecret},
      body:    'grant_type=refresh_token&refresh_token=' + refreshToken + '&redirect_uri=' + redirectUri
    }, function(error, response, body) {
      if (error) {
        //console.log("ERROR:" + JSON.stringify(error));
        callback(error, null);
      }

      //console.log("RESPONSE:" + JSON.stringify(response));
      //console.log('BODY:' + JSON.stringify(body));

      if (response.statusCode === 200) {
        body = JSON.parse(body);
        callback(null, {access_token : body.access_token, refresh_token : body.refresh_token});
      } else {
        callback(response, null);
      }
    });
  };

  var getSummary = function(token, callback) {
    //console.log('GET SUMMARY: token=' + token );
    request.get({
        headers: {'Authorization' : 'Bearer ' + token, 'Accept' : 'application/json'},
        url:     'https://api.paypal.com/v1/invoicing/summaries'
    }, function(error, response, body) {
        if (error) {
            //console.log("ERROR:" + JSON.stringify(error));
            callback(error, null);
        }

        //console.log("RESPONSE:" + JSON.stringify(response));
        //console.log('BODY:' + JSON.stringify(body));

        if (response.statusCode === 200) {
            body = JSON.parse(body);
            callback(null, buildResponseJSON(body));
        } else {
            callback(response, null);
        }
    });
  };
 
  var buildResponseJSON = function(invsum) {
    var response = {
        'all' : {
            'count' : 0,
            'amount': 0.0
        },
        'paid' : {
            'count' : 0,
            'amount': 0.0
        },
        'outstanding' : {
            'count' : 0,
            'amount': 0.0
        },
        'overdue' : {
            'count' : 0,
            'amount': 0.0
        }
    };
    for (var i=0; i < invsum.summaries.length ; i++) {
        var summary = invsum.summaries[i];
        response.all.count += summary.count;
        response.all.amount += Number(summary.amount_summary[0].total_amount.value);
        if (summary.status === 'DRAFT') {
        } else if (summary.status === 'PAYABLE') {
            response.outstanding.count += summary.count;
            response.outstanding.amount += Number(summary.amount_summary[0].total_amount.value);
        } else if (summary.status === 'SENT') {
            response.outstanding.count += summary.count;
            response.outstanding.amount += Number(summary.amount_summary[0].total_amount.value);
        } else if (summary.status === 'PAID') {
            response.paid.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.paypal.value);
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.other.value);
            }
        } else if (summary.status === 'MARKED_AS_PAID') {
            response.paid.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.paypal.value);
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.other.value);
            }
        } else if (summary.status === 'REFUNDED') {
            response.paid.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.paypal.value);
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.other.value);
            }
        } else if (summary.status === 'MARKED_AS_REFUNDED') {
            response.paid.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.paypal.value);
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.other.value);
            }
        } else if (summary.status === 'PARTIALLY_REFUNDED') {
            response.paid.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.paypal.value);
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.other.value);
            }
        } else if (summary.status === 'PARTIALLY_PAID') {
            response.paid.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.paypal.value);
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.paid.amount += Number(summary.amount_summary[0].paid_amount.other.value);
            }
            response.outstanding.count += summary.count;
            if (summary.amount_summary[0].paid_amount.paypal) {
                response.outstanding.amount += (Number(summary.amount_summary[0].total_amount.value) - Number(summary.amount_summary[0].paid_amount.paypal.value));
            }
            if (summary.amount_summary[0].paid_amount.other) {
                response.outstanding.amount += (Number(summary.amount_summary[0].total_amount.value) - Number(summary.amount_summary[0].paid_amount.other.value));
            }
        } else if (summary.status === 'PAYMENT_PENDING') {

        }
    }

    response.all.amount = Math.round(response.all.amount * 100) / 100;
    response.paid.amount = Math.round(response.paid.amount * 100) / 100;
    response.outstanding.amount = Math.round(response.outstanding.amount * 100) / 100;
    response.overdue.amount = Math.round(response.overdue.amount * 100) / 100;

    return response;
  };

  return {
    getAccessToken: getAccessToken,
    getAccessTokenFromRefreshToken: getAccessTokenFromRefreshToken,
    getSummary: getSummary
  };

})();


var messageHandler = (function(){
  chrome.extension.onRequest.addListener(function(request, sender, sendResponse2){
    var action = request.action;
    var data = request.data;
  
    if (action === 'authorize') {
      handleAuthorize(function(err, result){
        if (!err) {
          sendResponse({ action: 'authorize', result: result });
        } else {
          sendResponse({ action: 'authorize', err: err });
        }
      });
    } else if (action === 'checkAuthorized') {
      chrome.storage.sync.get('paypalInvoicingRefreshToken', function(token){
        //console.log('refreshToken retrieved:', JSON.stringify(token));
        if (token && token.hasOwnProperty('paypalInvoicingRefreshToken')) {
          sendResponse({ action: 'checkAuthorized', isAuthorized: true, refreshToken: token });
        } else {
          sendResponse({ action: 'checkAuthorized', isAuthorized: false });
        }
      });
    } else if (action === 'switchUser') {
      chrome.storage.sync.remove('paypalInvoicingRefreshToken', function(token){});
    } else if (action === 'getSummary') {
      handleGetSummary(function(err, result){
        if (!err) {
          sendResponse({ action: 'getSummary', result: result });
        } else {
          sendResponse({ action: 'getSummary', err: err });
        }
      });
    }  
  });

  var sendResponse = function(message) {
    chrome.extension.sendRequest(message, function(response) {
    });
  };

  var parseRedirectFragment = function(fragment) {
    var pairs = fragment.split(/&/);
    var values = {};

    pairs.forEach(function(pair) {
      var nameval = pair.split(/=/);
      values[nameval[0]] = nameval[1];
    });
  
    return values;
  };

  var handleAuthorize = function(callback){
    chrome.identity.launchWebAuthFlow(options, function(redirect_url) {
      //console.log(redirect_url);
      var res = {};
      var matches = redirect_url.match(redirectRe);
      //console.log(matches);
      if (matches && matches.length > 1) {
        var params = parseRedirectFragment(matches[1]);
        var authCode = params.code;
        paypal.getAccessToken(authCode, function(err, result){
          ////console.log("AUTH TOKEN:", result);
          var authToken = result.access_token;
          chrome.storage.sync.set({'paypalInvoicingRefreshToken': result.refresh_token}, function() {
            ////console.log('refreshToken saved');
            chrome.storage.sync.get('paypalInvoicingRefreshToken', function(token){
              ////console.log('refreshToken retrieved:', token);
            });
          });
          paypal.getSummary(authToken, function(err, result){
            ////console.log("SUMMARY INFO:", result);
            callback(null, result);  
          });
        });  
      }  
    });
  };

  var handleGetSummary = function(callback){
    chrome.storage.sync.get('paypalInvoicingRefreshToken', function(refreshToken){
      //console.log('refreshToken retrieved:', refreshToken.paypalInvoicingRefreshToken);
      paypal.getAccessTokenFromRefreshToken(refreshToken.paypalInvoicingRefreshToken, function(err, result){      
        var authToken = result.access_token;
        //console.log("handleGetSummary: AUTH TOKEN:", authToken);

        paypal.getSummary(authToken, function(err, result){
          //console.log("handleGetSummary SUMMARY INFO:", result);
          callback(null, result);  
        });
      });
    });  
  };

})();







