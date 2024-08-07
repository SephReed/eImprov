/*A little bit wonky with it's updates, I'll have to figure out what I really want
hint: probably only loading from names on load and user input.  But that's hard to tell*/



load("MDI_Constants.js");
load("MDI_RecordingKit.js");

var currentPage;


var masterTrackName = null;
var trackNames = initArray(0, SUPER_BANK_MAX_TRACKS);
var trackOctaveOffsets = initArray(3, SUPER_BANK_MAX_TRACKS);

var MDI_liveBank = [];
var MDI_liveBankPosition = 0;
var MDI_focusedLiveTrack = 0;

var MDI_superBank;
var MDI_selected_track = 0;

var MDI_master_track;

var availableTracks = 0;

var onPageChange = null;
var onLiveBankPositionChange = null;



var APPLICATION;


function octaveHandlerInit()  {
    APPLICATION = host.createApplication();
    MDI_superBank = host.createTrackBank(SUPER_BANK_MAX_TRACKS, 0, 1);

    for(var t = 0; t < SUPER_BANK_MAX_TRACKS; t++)  {
        var track = MDI_superBank.getTrack(t);

        track.addNameObserver(256, NOT_YET_NAMED, createNameObserver(t));
        track.addIsSelectedInEditorObserver(createSelectObserver(t));
    }

    MDI_master_track = host.createMasterTrack(0);
    MDI_master_track.addNameObserver(256, NOT_YET_NAMED, createMasterTrackNameObserver());
}









function MDI_initializeLiveBank() {
    for(var t = 0; t < LIVE_BANK_HEIGHT; t++) {
        MDI_liveBank[t] = host.createTrackBank(LIVE_BANK_HEIGHT, MAX_MODABLE_SENDS, LIVE_BANK_WIDTH);

        var track = MDI_liveBank[t].getTrack(t);
        track.getArm().addValueObserver(createArmObserver(t));
        track.addIsSelectedInEditorObserver(MDI_createSelectObserver(t));
        for(var i_s = 0; i_s < t; i_s++) {   
            MDI_liveBank[t].scrollScenesDown();  
        }
    }
}





function scrollPage() {
    if(currentPage == DRUM_PAGE) {  MDI_setPage(CLIP_PAGE);  }
    else if(currentPage == CLIP_PAGE) {  MDI_setPage(CONDUCTOR_PAGE);  }
    else {  MDI_setPage(DRUM_PAGE);  }
}


function MDI_getCurrentPage() {
    return currentPage;
}





/******************************
*     OCTAVE CHANGE 
******************************/

function modTrackOctave(trackIndex, numOctaves)  {
    setTrackOctave(trackIndex, trackOctaveOffsets[trackIndex] + numOctaves);
    updateTrackTitleOctave(trackIndex);
}


function updateTrackTitleOctave(trackIndex)  {
    var name = trackNames[trackIndex];
    var index = name.indexOf(OCTAVE_TAG);

    var octave = trackOctaveOffsets[trackIndex];
    var str = octave;
    if(octave <= 9) {  str = "0"+str; }

    if(index != -1)  {  name = name.replace( /(#Oct:\d{2})/, OCTAVE_TAG+str);  }
    else {  name = name+"                "+OCTAVE_TAG+str;  }

    println("Update Track Name: "+name);
    MDI_superBank.getTrack(trackIndex).setName(name);
}


function setTrackOctave(trackIndex, octave)  {
    octave = Math.max(octave, 0);
    octave = Math.min(octave, 10);
    trackOctaveOffsets[trackIndex] = octave;

    println("Track#"+ trackIndex+" set Oct: "+octave);
}





/******************************
*     PAGE CHANGE 
******************************/

function MDI_addPageObserver(i_onPageChange) {
    onPageChange = i_onPageChange;
}


function MDI_setPage(i_page)  {
    if(currentPage == i_page) { return; }

    currentPage = i_page;
    if(onPageChange != null) {  onPageChange(currentPage);  }
    updateMasterTitlePage(PAGE_TAG);
}






/******************************
*     SCENE BANK SCROLL
******************************/

function MDI_addLiveBankPositionObserver(i_onLiveBankPositionChange) {
    onLiveBankPositionChange = i_onLiveBankPositionChange;
}

function modLiveBankPosition(numSteps)  {
    if(numSteps == 0)  {  return;  }
    else if (numSteps > 0)  {
        var spacesLeft = (availableTracks + 1) - (LIVE_BANK_HEIGHT + MDI_liveBankPosition);
        numSteps = Math.min(numSteps, spacesLeft);
        MDI_liveBankPosition = MDI_liveBankPosition + numSteps;
        if(onLiveBankPositionChange != null) 
        {  onLiveBankPositionChange(numSteps);  }
    }
    else if (numSteps < 0)  {
        numSteps = Math.abs(numSteps);
        numSteps = Math.min(numSteps, MDI_liveBankPosition);
        if(numSteps > 0) {
            MDI_liveBankPosition = MDI_liveBankPosition - numSteps;
            if(onLiveBankPositionChange != null) 
            {  onLiveBankPositionChange(-1*numSteps);  }
        }
    }

    updateMasterTitlePage(LIVE_BANK_POS_TAG);
}



 




/******************************
*      OBSERVERS 
******************************/

function createNameObserver(trackIndex)  {
    return function(name)  {
        if(name == NOT_YET_NAMED)  { return; }

        availableTracks = Math.max(availableTracks, trackIndex);

        trackNames[trackIndex] = name;

        
        var index = name.indexOf(OCTAVE_TAG);
        // println("index of tag "+OCTAVE_TAG+" in "+name+": "+index);
        if(index != -1)  {
            var splice = name.substr(index+OCTAVE_TAG.length, 2);
            if(splice.charAt(0) == '0') {  splice = splice.substr(1, 1); }
    
            var octave = parseInt(splice);
            if(octave != trackOctaveOffsets[trackIndex]) {
                println("Loading Track#"+trackIndex+" Octave from: "+name);
                setTrackOctave(trackIndex, octave);  }
        }   
        else {
            trackOctaveOffsets[trackIndex] == 3;
            updateTrackTitleOctave(trackIndex);
        }   
    
    };
}






function createSelectObserver(track)  {
    return function(value)  {
        if(value == true) {
            MDI_selected_track = track;  
}   }   }


function createMasterTrackNameObserver()  {
    return function(name)  {
        if(name == NOT_YET_NAMED) { return; }

        masterTrackName = name;

        var index = name.indexOf(PAGE_TAG);
        if(index != -1)  {
            var splice = name.substr(index+PAGE_TAG.length, 3);
            if(splice != currentPage)  {
                if(splice == DRUM_PAGE 
                    || splice == CLIP_PAGE
                    || splice == CONDUCTOR_PAGE  ) 
                {  
                    currentPage = splice;
                    if(onPageChange != null) {  onPageChange(currentPage);  }
                }      
                else { MDI_setPage(CLIP_PAGE);  }
            }
        }

        var index = name.indexOf(LIVE_BANK_POS_TAG);
        if(index != -1)  {
            var splice = name.substr(index+LIVE_BANK_POS_TAG.length, 3);

            //HORRID CODE
            if(splice.charAt(0) == '0') {  
                splice = splice.substr(1, 2); 
                if(splice.charAt(0) == '0') {  splice = splice.substr(1, 1); }
            }

            var liveBankPos = parseInt(splice);
            if(liveBankPos != MDI_liveBankPosition) {
                modLiveBankPosition(liveBankPos-MDI_liveBankPosition);  }
        }   
}   }




function updateMasterTitlePage(tagToUpdate)  {
    if(masterTrackName != null)  {
        name = masterTrackName;

        if(tagToUpdate == PAGE_TAG) {
            var index = name.indexOf(PAGE_TAG);
            if(index != -1)  {  name = name.replace( /(#Page:[A-Z]{3})/, PAGE_TAG+currentPage);  }
            else {  name = name+PAGE_TAG+currentPage;  }
        }

        if(tagToUpdate == LIVE_BANK_POS_TAG) {
            var txt = MDI_liveBankPosition;
            if(MDI_liveBankPosition < 10) {  txt = "00"+txt;  }
            else if(MDI_liveBankPosition < 100) {  txt = "0"+txt;  }

            var index = name.indexOf(LIVE_BANK_POS_TAG);
            if(index != -1)  {  name = name.replace( /(#LPos:\d{3})/, LIVE_BANK_POS_TAG+txt);  }
            else {  name = name+LIVE_BANK_POS_TAG+txt;  }
        }        

        println("Update Master Name: "+name);
        MDI_master_track.setName(name);
    }
}





