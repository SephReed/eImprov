/**

send note to MDI
right before next measure
catches
releases at measure begin
send note off

send note to MDI
change octave
send note off to MDI
how does MDI know they are the same note




**/

var buttonsMidi = [];
var numToMidi = function(buttonNum)  {
	return buttonNum + (trackOctaveOffsets[buttonNum] * 8);
};
var stalledMidi = initArray(-1, 128);
var currentlyStallingMidi = false;


var MDI_beatPos = 0;



function MDI_initializeBitwigHaxFunctionality() {
	host.createTransport().getPosition().addRawValueObserver(function(newPos)  {
		beatPosition = newPos;  
		// updateMDIToBeatTime();  
	});
}





function MDI_registerButtons (numButtons, i_numToMidi) {
	buttonsMidi = initArray(-1, numButtons);
	

	if(i_numToMidi !== undefined) {
		numToMidi = i_numToMidi;  }
}


function sendButtonHitToBitwig(buttonNum, velocity)  {
	if(velocity > 0) {

		if(buttonsMidi[buttonNum] != -1)  {
			println("button #"+buttonNum+" already registered as being pressed");
		}

		buttonsMidi[buttonNum] = numToMidi == null ? buttonNum : numToMidi(buttonNum);
	}
	else if(buttonsMidi[buttonNum] == -1)  {
		println("button #"+buttonNum+" already registered as being released");
	}
	
	
	/**
	println(recStatus.nextTrack+ " " +recStatus.queuedTrack);
	if(recStatus.queuedTrack != -1)  {
		var nextMeasureWorthy = (1 - (beatPosition%1)) < BITWIG_UPDATE_LAG;  //within 1/16 of beat start
		var doubleArmIssue = (numTracksArmed > 1 && velocity != 0);

		println(nextMeasureWorthy+" || "+doubleArmIssue);
		if(nextMeasureWorthy || doubleArmIssue)  {
			var midiNum = buttonsMidi[buttonNum];
			if(velocity > 0)  {

				if(stalledMidi[buttonNum] == null)  {
					

					stalledMidi[midiNum] = new StalledMidi(velocity);
					currentlyStallingMidi = true;
				}
				//if a note has already been hit and released, merge it with this next hit.
				else {
					stalledMidi[midiNum].impulseOnly = false;
				}

				println("note caught to be put in next measure");
				return true;
			}
			else if(stalledMidi[midiNum] != null && velocity == 0)  {
				stalledMidi[midiNum].impulseOnly = true;

				println("note registered as impulse only");
				return true;
			}	
		}
		//else, release note normally below		
	}**/
	
	noteIn.sendRawMidiEvent(STATUS_NOTE_ON, buttonsMidi[buttonNum], velocity);
	if(velocity == 0) { buttonsMidi[buttonNum] = -1; }
	


	
}


function tryReleasingStalledMidi()  {
	println("attempting release of stalled midi "+currentlyStallingMidi+" "+numTracksArmed);
	if(currentlyStallingMidi)  {
	   	//pad hits are only stalled for recording purposes
	   	//if not recording, ensure that all functionality is initialized
	 //   	if(recStatus.recTrack == -1)  {
		// 	for(var i = 0; i < stalledMidi.length; i++)  {
		// 		stalledMidi[i] = null;}	
		// 	currentlyStallingMidi = false;
		// }



	   //if there is no track arm interference and pad hit's are stalled,
	   //release the hits
		if(numTracksArmed == 1)  {
			for(var midiNum = 0; midiNum < stalledMidi.length; midiNum++)  {
				if(stalledMidi[midiNum] != null)  {

					println("releasing stalled midi note "+midiNum);
					// println("releasing stalled pad hit "+i);
					// sendPadHitToBitwig(midiOutForPad[i], stalledMidi[i].velocity);
					noteIn.sendRawMidiEvent(STATUS_NOTE_ON, midiNum, stalledMidi[midiNum].velocity);

					if(stalledMidi[midiNum].impulseOnly == true)  {
						noteIn.sendRawMidiEvent(STATUS_NOTE_ON, midiNum, 0);
						// sendNoteOnToBitwig(midiOutForPad[i], 0);
					}

					stalledMidi[midiNum] = null;
			}	}

			currentlyStallingMidi = false;
		}
	}
}







function StalledMidi(velocity){
   	this.velocity = velocity;  
	this.impulseOnly = false;  }



