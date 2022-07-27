$(function() {
	// connect websocket
	var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
	var tempsock = new ReconnectingWebSocket(ws_scheme + '://' + window.location.host + "/temp" + window.location.pathname);

	var ads1x15 = require('node-ads1x15');
	var chip = 1;

	var adc = new ads1x15(chip);

	var channel = 0;
	var sps = '250';
	var gain = '4096';

	tempsock.onsend = function(message) {
		var reading = 0;
		if(!adc.busy) {
			adc.readADCSingleEnded(channel, gain, sps, function(err, data) {
				if(err) {
					throw err;
				}
				reading = data;
				// console.log("reading: " + reading);
				// convert output to temperature
				var beta = 3890.0;
				var room_temp = 298.15;
				var max_voltage = 4.096 / 32767.0;
				var voltage = reading / 1000;
				// console.log("voltage: " + voltage);
				var R = 10000.0 * ((5.18 / voltage) - 1.0)
				// console.log("Resistance: " + R);
				var tempK = (beta * room_temp) / (beta + (room_temp * Math.log(R/10000.0)));
				var tempC = tempK - 273.15;
				var tempF = (9.0/5.0)*tempC + 32.0;
				// console.log(Math.round(tempF))

				// TODO: send back temperature
			});
		}
	};
});
