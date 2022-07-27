/*	This javascript file holds the functions necessary to 
	control the water pump and heater.  It should publish 
	to the mqtt topic "relay".								*/

client = new Paho.MQTT.Client(location.hostname, 9001, "motorPublisher_js");
// set callback handlers
client.onConnectionLost = onConnectionLost;
//client.onMessageArrived = onMessageArrived;

// connect to client
client.connect({onSuccess:onConnect});

function onConnect() {
        console.log("onConnect");
        //client.subscribe("#");
};

// called when the client loses its connection
function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
        }
};

