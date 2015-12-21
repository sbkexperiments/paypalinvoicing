$(document).ready(function(){
  $('#switchUser').click(function() {	
    chrome.extension.sendRequest({action: "switchUser"}, function(response) {});    
    $('#signinDiv').show();
    $('#signin').click(function() {
      $('#signin').disabled = true;
        chrome.extension.sendRequest({action: "authorize"}, function(response) {});
    });
  });	

  chrome.extension.sendRequest({action: "checkAuthorized"}, function(response) {});

  chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
  	//console.log("REQUEST RECEIVED POPJS", JSON.stringify(request));
  	if (request.action === 'checkAuthorized') {
  	  if (request.isAuthorized) {
  	  	$('#signinDiv').hide();
  	  	chrome.extension.sendRequest({action: "getSummary"}, function(response) {});
  	  }	else {
  	    //console.log('paypalInvoicingRefreshToken not present');	
        $('#signin').click(function() {
          $('#signin').disabled = true;
          chrome.extension.sendRequest({action: "authorize"}, function(response) {});
        });
  	  }
  	} else if (request.action === 'authorize') {
  	  chrome.extension.sendRequest({action: "getSummary"}, function(response) {});
  	} else if (request.action === 'getSummary') {
  	  //console.log("SUMMARY RESPONSE:" + JSON.stringify(request.result));
  	  if (request.result) {
  	    $('#signinDiv').hide();
  	    $( "li[data-invoice='all-count'] > span" ).html( request.result.all.count );
  	    $( "li[data-invoice='paid-count'] > span" ).html( request.result.paid.count );
  	    $( "li[data-invoice='outstanding-count'] > span" ).html( request.result.outstanding.count );
  	    $( "li[data-invoice='overdue-count'] > span" ).html( request.result.overdue.count );

  	    $( "li[data-invoice='all-amount']" ).html( request.result.all.amount + ' USD');
  	    $( "li[data-invoice='paid-amount']" ).html( request.result.paid.amount + ' USD');
  	    $( "li[data-invoice='outstanding-amount']" ).html( request.result.outstanding.amount + ' USD');
  	    $( "li[data-invoice='overdue-amount']" ).html( request.result.overdue.amount + ' USD');  	  	
  	  }
  	}	
  });	
});
