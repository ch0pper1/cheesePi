/* *******************************************************
* This is the specific instruction list for Colby Cheese *
* and is designed to iterate through each step adjusting *
* each timer or temperature setting.					*/

// pulled some methods from cheesePi to this 
var finishTime;
var timerLength = 3600; // number of seconds
var timeoutID;
var targetTemp;
var activeStep = sessionStorage.getItem('step');

// Array of instructions, set as temp, time, and description
var instructionSet = '{ "instructions" : [' +
	'{ "temp":0, "time":0, "description": "Let\'s get started. Please ensure that the water basin and the milk basin are full and that the heating element is plugged in.  Once you are ready, press next step above." },' +
	'{ "temp":86, "time":0, "description": "Heat the milk to 86°F." },' +
	'{ "temp":86, "time":0, "description": "Add the starter culture by sprinkling it on top of the milk, and let it rehydrate for a few minutes before stirring it in with an up-and-down motion of the spoon." },' +
	'{ "temp":86, "time":60, "description": "Cover the milk and allow it to set, undisturbed, for one hour. If you are using coloring, stir it into the milk now." },' +
	'{ "temp":86, "time":30, "description": "Make sure that the milk is still at 86°F. Add the diluted rennet. Mix it in well, using gentle up-and-down motions. Stir it for 1 minute, then stir just in the top part of the milk for 2 more minutes. Cover it and let it set, undisturbed, for 1/2 hour." },' +
	'{ "temp":86, "time":5, "description": "If after 30 minutes you have a clean break, cut the curd into 3/8-inch cubes. Stir them gently, then let them set for 5 minutes." },' +
	'{ "temp":102, "time":30, "description": "Heat the curds and whey 2°F every 5 minutes, until they are at 102°F. Stir to prevent the curds from matting (sticking together). Maintain the temperature at 102°F for 1/2 hour. Periodically stir them gently during this time, trying to keep them from matting." },' +
	'{ "temp":80, "time":15, "description": "Pour off the whey until the amount in the pot just covers the curds. Continuing to stir, add 60°F (cool) water until the temperature in the pot reaches 80°F. Maintain the 80°F temperature for 15 minutes. Stir frequently." },' +
	'{ "temp":0, "time":15, "description": "Drain the curds in a colander lined with cheesecloth. Allow them to drain for 15 minutes." },' +
	'{ "temp":0, "time":0, "description": "Mill the curds, breaking them to thumbnail-size pieces and gently mixing in the salt." } ]}';
var instructions = JSON.parse(instructionSet);

window.onload = function() {
    if (timeoutID === null) {
        var minutes = parseInt((timerLength) / 60);
        var seconds = parseInt((timerLength) % 60);
        $("#time").html(minutes + ":" + seconds);
    } else {
        Update();
    }
    if (activeStep === null) {
        sessionStorage.setItem('step', 0);
        activeStep = sessionStorage.getItem('step');
    } else {
		setTargetTemp(instructions.instructions[activeStep].temp);
	}

	$('#currentStep').text(instructions.instructions[activeStep].description);
	$("#time").html(minutes + ":" + seconds);
}

function nextStep() {
	if (tempOk || instructions.instructions[activeStep].temp === 0) {
		if (timeOk || instructions.instructions[activeStep].time === 0) {
			$('#nextLabel').removeClass('label label-off').addClass('label-on');
			proceed();
		}
	}
}

function proceed() {
	activeStep++;
	sessionStorage.setItem('step', activeStep);
	instructionLabel = "i" + activeStep;
	if (activeStep < 10) {
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

