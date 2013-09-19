var ws, xhr;

//example open a websocket and send up a message
ws = new WebSocket("ws://localhost:1337");
ws.onopen = function(e){
	ws.send("START - "+ (new Date().getTime()));
	var count = 0;
	var timer = setInterval(function() {
		if(count >=5) {
			clearInterval(timer);
		}
		ws.send("ZOMBIE - "+ (new Date().getTime()));
		count++;
	},100)
	ws.onclose = function(e){
		console.log("WS closed: ", e);
	};
};
ws.onerror = function(e){
	console.log("Error with WS: ", e);
};
ws.onmessage = function(e){
	console.log("Message Received From WS: ", e);
	// var textNode = document.createTextNode("Message From WS:"+ e.data);
	// document.getElementsByTagName("body")[0].appendChild(textNode);
}

//example get some data for a SPA
xhr = new XMLHttpRequest();
xhr.open('GET', '/json/data.json', true);
xhr.responseType = 'json';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();