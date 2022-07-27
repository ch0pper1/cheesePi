// Variables for time, temp and status
var mTemp = new Array();
var wTemp = new Array();
var mTempCurrent = 0;
var wTempCurrent = 0;
var heaterStatus, pumpStatus;
var tempOk = false;
var timeOk = false;
var finishTime;
var timerLength = 3600; // number of seconds
var timeoutID;
var targetTemp;
var activeStep = sessionStorage.getItem('step');
var instructions;
var cRecipe = sessionStorage.getItem('currentRecipe');
console.log(cRecipe);
var recipes;
var client = new Paho.MQTT.Client(location.hostname, 9001, "clientId");


window.onload = function() {
	// test recipe load
	loadRecipes();
	if (cRecipe !== null) {
		$("#recipe").val(cRecipe);
		$("#recipe").filter(function() {
			return $(this).text() == cRecipe;
		}).attr('selected', true);
		loadInstructions(cRecipe);
	}
}

function mqttConnect() {
	// Create client instance
	// 9001 is the websocket port for communication
	// set callback handlers
	client.onConnectionLost = onConnectionLost;
	client.onMessageArrived = onMessageArrived;

	if (!client.isConnected()) {
		// connect to client
		client.connect({onSuccess:onConnect});
	}
}

function onConnect() {
	//console.log("onConnect");
	client.subscribe("#");
	getHeaterStatus();
	getPumpStatus();
	
};

// called when the client loses its connection
function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
        	console.log("onConnectionLost: "+responseObject.errorMessage);
        }
};

// called when a message arrives
function onMessageArrived(message) {
	//console.log("onMessageArrived:"+message.destinationName+": "+message.payloadString);
	var topic = message.destinationName;
	var payload = message.payloadString;
	//$('#ws').prepend('<li>' + topic + ' = ' + payload + '</li>');

	// split topic received and display
	var message = topic.split('/');
	var group = message[0];
	var sensor = message[1];

	// Post to page based on group and sensor.
	if (group == 'temp') {
		$('#'+sensor+'Label').text(payload + '\u00B0F');
		checkTargetTemp(sensor, payload, targetTemp);
	} else if (group == "relay") {
		// turn on or off motor control 
		if (sensor == "pump") {
			switch(payload) {
				case "ON":
					//console.log("turn on " + sensor);
					break;
				case "OFF":
					//console.log("turn off " + sensor);
					break;
				case "STATUS":
					//console.log("status of " + sensor);
					break;
				case "STATUS_ON":
					pumpStatus = true;
					$('#pumpLabel').text('On');
					$('#pumpLabel').removeClass('label label-off').addClass('label-on');
					//console.log("status of " + sensor);
					break;
				case "STATUS_OFF":
					pumpStatus = false;
					$('#pumpLabel').text('Off');
					$('#pumpLabel').removeClass('label label-on').addClass('label-off');
					//console.log("status of " + sensor + " is off");
					break;
			}
		} else if (sensor == "heater") {
			switch(payload) {
				case "ON":
					//console.log("turn on " + sensor);
					break;
				case "OFF":
					//console.log("turn off " + sensor);
					break;
				case "STATUS":
					//console.log("getting status of " + sensor);
					break;
				case "STATUS_ON":
					heaterStatus = true;
					$('#heaterLabel').text('On');
					$('#heaterLabel').removeClass('label label-off').addClass('label-on');
					//console.log("status of " + sensor);
					break;
				case "STATUS_OFF":
					heaterStatus = false;
					$('#heaterLabel').text('Off');
					$('#heaterLabel').removeClass('label label-on').addClass('label-off');
					//console.log("status of " + sensor + " is off");
					break;
			}
		}
	}
};

// Motor functions
function getPumpStatus() {
	client.publish("relay/pump", "STATUS");
};

function getHeaterStatus() {
	client.publish("relay/heater", "STATUS");
};

function toggleHeater() {
    if (heaterStatus) {
        client.publish("relay/heater", "OFF");
    } else {
        client.publish("relay/heater", "ON");
    }
};

function togglePump() {
    if (pumpStatus) {
        client.publish("relay/pump", "OFF");
    } else {
        client.publish("relay/pump", "ON");
    }
};

// Temperature functions
function checkTargetTemp(sensor, temp, targetTemp) {
    // Look at current and target temperature, then adjust label and heater status
    var label = '#' + sensor + 'Label';
	if (sensor === "mTemp") { 
		mTempCurrent = Math.round(temp);
	} else if (sensor === "wTemp") {
		wTempCurrent = Math.round(temp);
	}

	// Verify milk and water temperatures and toggle heater accordingly
	if (mTempCurrent < targetTemp-10) {
		if (wTempCurrent >= targetTemp+10) {
			heaterOff(sensor);
		} else {
			heaterOn(sensor);
		}
	} else if (mTempCurrent >= targetTemp-10 && mTempCurrent < targetTemp) {
		if (wTempCurrent >= targetTemp+2) {
			heaterOff(sensor);
		} else {
			heaterOn(sensor);
		}
	} else if (mTempCurrent == targetTemp) {
		heaterOff(sensor);
	} else if (mTempCurrent > targetTemp) {
		heaterOff(sensor);
		// $(label).removeClass('label label-cold label-on').addClass('label-hot');
	}

	// Set the proper label based on temp
	if (Math.round(temp) < targetTemp) {
		$(label).removeClass('label label-hot label-on').addClass('label-cold');
	} else if (Math.round(temp) === targetTemp) {
		$(label).removeClass('label label-on label-hot label-cold').addClass('label-on');
	} else {
		$(label).removeClass('label label-cold label-on').addClass('label-hot');
	}

	if ((timeOk || instructions.instructions[activeStep].time === 0) && (tempOk || instructions.instructions[activeStep].temp === 0)) {
		if (instructions.instructions[activeStep].temp >= 88 && instructions.instructions[activeStep].temp <= 102) {
			nextStep();
		} else {
			$('#nextLabel').removeClass('label label-off').addClass('label-on');
		}
    }
}

function heaterOff(sensor) {
    var label = '#' + sensor + 'Label';
	client.publish("relay/heater", "OFF");
    // $(label).removeClass('label label-hot label-cold').addClass('label-on');
    if (sensor === "mTemp" && mTempCurrent === targetTemp) {
        tempOk = true;
    }
}

function heaterOn(sensor) {
    var label = '#' + sensor + 'Label';
	client.publish("relay/heater", "ON");
    // $(label).removeClass('label label-hot label-on').addClass('label-cold');
    tempOk = false;
}

// Timer functions
function startTimer(stepTime) {
	sessionStorage.setItem('myTime', (new Date().getTime() + stepTime * 1000));
	if (timeoutID != undefined) window.clearTimeout(timeoutID);
	Update();
}

function Update() {
	finishTime = sessionStorage.getItem('myTime');
	var timeLeft = Math.max((finishTime - new Date().getTime()),0);
	var minutes = parseInt((timeLeft/1000) / 60);
	var seconds = parseInt((timeLeft/1000) % 60);
	seconds = seconds < 10 ? "0" + seconds : seconds;
	$("#time").html(minutes + ":" + seconds);
	timeoutID = window.setTimeout(Update, 100);
	
	// Check if timer is finished
	if (timeLeft === 0) {
		timeOk = true;
	} else {
		timeOk = false;
	}
	if ((timeOk || instructions.instructions[activeStep].time === 0) && (tempOk || instructions.instructions[activeStep].temp === 0)) {
		$('#nextLabel').removeClass('label label-off').addClass('label-on');
	} else {
		$('#nextLabel').removeClass('label label-on').addClass('label-off');
	}
}

function nextStep() {
    //if (tempOk || instructions.instructions[activeStep].temp === 0) {
        if (timeOk || instructions.instructions[activeStep].time === 0) {
            $('#nextLabel').removeClass('label label-off').addClass('label-on');
    		activeStep++;
            proceed();
        }
    //}
}

function proceed() {
    sessionStorage.setItem('step', activeStep);
    instructionLabel = "i" + activeStep;
    if (activeStep < instructions.instructions.length) {
        $('#currentStep').text(instructions.instructions[activeStep].description);

        setTargetTemp(instructions.instructions[activeStep].temp);
        if (instructions.instructions[activeStep].time !== 0) {
            startTimer(instructions.instructions[activeStep].time * 60);
        }
    } else {
        $('#currentStep').text("All Finished!!");
        activeStep--;
    }
}

function setTargetTemp(temp) {
    targetTemp = temp;
    $('#temp').text(temp);
}

// Create function to import all json files for cheese recipes
function loadRecipes() {
	// load all recipes and populate dropdown list
	recipes = $.parseJSON($.ajax({ url: "src/json/recipes.json", async: false }).responseText);
	$.each(recipes, function(i, obj) {
		$("#recipe").append($("<option></option>").val(obj.recipe).html(obj.recipe));
	});
	$('#recipe').on('change', function() {
		cRecipe = $('#recipe').children("option:selected").text();
		sessionStorage.setItem('currentRecipe', cRecipe);
		$('#list').empty();
		loadInstructions(cRecipe);
	});
}

function loadInstructions() {
	// Load the instruction set for the selected recipe unless one is already active, then
	// force page to load that recipe.
	
	instructions = $.parseJSON($.ajax({ url: "src/json/colby.json", async: false }).responseText);
    if (activeStep === null) {
        sessionStorage.setItem('step', 0);
        activeStep = sessionStorage.getItem('step');
    } else {
        setTargetTemp(instructions.instructions[activeStep].temp);
    }
    if (timeoutID === null) {
        var minutes = parseInt((timerLength) / 60);
        var seconds = parseInt((timerLength) % 60);
        $("#time").html(minutes + ":" + seconds);
    } else {
        Update();
    }

    $('#currentStep').text(instructions.instructions[activeStep].description);
    $("#time").html(minutes + ":" + seconds);
	

	// Add list of instrusctions
	$.each(instructions.instructions, function(i, obj) {
		if (i>0 && (obj.description != instructions.instructions[i-1].description)) {
    		$("#list").append("<li>"+obj.description+"</li>")
		}
	});
}

function loadInstructions(r) {
	if (cRecipe !== null || cRecipe !== '') {
		// console.log(r);
		// console.log(recipes);
		// get recipe instructions
		var index = recipes.findIndex(x => x.recipe === r);
		instructions = recipes[index];
		// console.log(instructions);
		// instructions = recipeInstructions
		if (activeStep === null) {
			sessionStorage.setItem('step', 0);
			activeStep = sessionStorage.getItem('step');
		} else {
			setTargetTemp(instructions.instructions[activeStep].temp);
			// console.log(targetTemp);
		}
		if (timeoutID === null) {
        	var minutes = parseInt((timerLength) / 60);
        	var seconds = parseInt((timerLength) % 60);
        	$("#time").html(minutes + ":" + seconds);
    	} else {
        	Update();
    	}
		$('#currentStep').text(instructions.instructions[activeStep].description);
    	$("#time").html(minutes + ":" + seconds);

		// Add list of instrusctions
		$.each(instructions.instructions, function(i, obj) {
			if (i>0 && (obj.description != instructions.instructions[i-1].description)) {
    			$("#list").append("<li>"+obj.description+"</li>")
			}
		});
	} else {
		if (activeStep === null) {
            sessionStorage.setItem('step', 0);
            activeStep = sessionStorage.getItem('step');
        } else {
            setTargetTemp(instructions.instructions[activeStep].temp);
            // console.log(targetTemp);
        }
		
		// load instructions and set dropdown
	}

	// connect to mqtt service
	mqttConnect();
}


function onRecipeSelect() {
	console.log("Changing Recipe");
	if (cRecipe === null) {
		// sessionStorage.setItem('currentStep', 
		cRecipe = $(this).children("option:selected").text();
		// console.log('cRecipe = ' + cRecipe);
		loadInstructions(cRecipe);
	}
}
