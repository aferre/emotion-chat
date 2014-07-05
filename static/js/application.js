var inbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
var outbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");

var viz = new bubblesViz();
var inputLastLength = 0;

//receiving a message
//get data and show in chat box
inbox.onmessage = function(message) {
  // console.log(message);
  var data = JSON.parse(message.data);

  if (data.type === 'text'){
	handleMessage(data);
  } else if (data.type === 'awaiting'){
	handleIncoming(data);
  }

};


inbox.onclose = function(){
    console.log('inbox closed');
    this.inbox = new WebSocket(inbox.url);

};

outbox.onclose = function(){
    console.log('outbox closed');
    this.outbox = new WebSocket(outbox.url);
};

function handleIncoming(data){
	var name = data.handle;
	if ( $("#input-name")[0].value !== name ) {
		var isTyping = data.text === true;
		console.log('incoming typing ' + isTyping + ' from ' + name);
		if (isTyping)
			$("#chat-text").append("<div id='awaiting-img'><img src='static/images/visualfeedback.gif' alt='' /></div>");
		else
			$("#awaiting-img").remove();
  	}
}

function handleMessage(data){
  var name = data.handle;
  var content = data.text;
  var textLength = parseInt(data.length);
  // console.log(textLength);
 
  var negP = parseFloat(data.neg);
  // console.log(data.neg);
  var posP = parseFloat(data.pos);
  // console.log(posP);

  var emotionRangeClassString = ""
    if ( negP > posP){

      switch(negP){
        case 1:
          emotionRangeClassString = "rg-5";
          break;
        case 2:
          emotionRangeClassString = "rg-4";
          break;
        case 3:
          emotionRangeClassString = "rg-3";
          break;
        case 4:
          emotionRangeClassString = "rg-2";
          break;
        case 5:
          emotionRangeClassString = "rg-1";
          break;
      }
    }
    else if(posP > negP){
      var index = posP + 6;
      emotionRangeClassString = "rg-".concat( index.toString() ); 
    }
    else{ 
      emotionRangeClassString = "rg-6";
    }

  // console.log(emotionRangeClassString);

  var bubblesNb = data.length;
  //if it's the content we entered
  var cl = 'his-words';
  if ( $("#input-name")[0].value == name ) {
    cl = 'my-words';
  }
  $("#chat-text").append("<div class='bubble-span-panel'><div class='speechbubble "+cl+" "+ 
      emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + 
      $('<span/>').text(data.text).html() + "</div></div></div>");

  $("#chat-text").stop().animate({
    scrollTop: $('#chat-text')[0].scrollHeight
    }, 800,function(){
    addNodes(data.text, bubblesNb,data.pos,data.neg,emotionRangeClassString);
    start();
  });

}
function sendTyping(typing){
 	console.log('typing : ' + typing);
	var handle = $("#input-name")[0].value;
	var text   = typing;
	outbox.send(JSON.stringify({ handle: handle, text: text, type: "awaiting" }));
}

$('#input-text').on('input', function() { 
	var val = $(this).val();
	var currentLength = val.length;
	if (inputLastLength === 0 && currentLength !==0){
		sendTyping(true);
	} else if (inputLastLength !== 0 && currentLength === 0){
		sendTyping(false);
	}
	inputLastLength = currentLength;
});

//send message to server when submit button pressed.
$("#input-form").on("submit", function(event) {

  if ( $("#input-name").val() == ""){
    alert("Type your name!!");
    return
  }
  event.preventDefault();
  var handle = $("#input-name")[0].value;
  var text   = $("#input-text")[0].value;
  sendTyping(false);
  //we stringify it because it only support string.
  outbox.send(JSON.stringify({ handle: handle, text: text, type: "text" }));
  $("#input-text")[0].value = "";
  inputLastLength = 0;
  //console.log(stringifyText);
});

function textEntered(){
 if ( $("#input-name").val() == ""){
    alert("Type your name!!");
    return
  }

  var handle = $("#input-name")[0].value;
  var text   = $("#input-text")[0].value;

  //we stringify it because it only support string.
  outbox.send(JSON.stringify({ handle: handle, text: text, type: "text" }));
  $("#input-text")[0].value = "";
  //console.log(stringifyText);
}

function nameConfirm(){

    if(!$("#input-name").prop('readonly')) {
        $("#input-name").prop('readonly', true);
        $("#name-confirm-btn").html("Reset");    
    }
    else{
        $("#input-name").prop('readonly', false);
        $("#name-confirm-btn").html("Confirm");
    }
    
}

$( window ).load(function() {
  viz.resize();
  DEBUG.log('init')
  // $("#goodNumber").html("0");
  // $("#badNumber").html("0");
});
