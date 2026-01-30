// JScript File
var playTitleEvent = "Qube.PlayTitleEvent"; //"89E4DD82-09CB-4778-A440-181C179EB0C8";
var callPlaylistEvent = "Qube.CallPlaylistEvent"; //"3AAB0056-0402-420F-AD5F-2E611D626F31";

var waitEvent = "E39F6289-95B3-4B80-B798-D16F31FC2E0A";
var cueEvent = "F159D87D-0B12-4770-89A2-F427222F04C4";

var playTypeID = 'DDEA66B1-7AD8-4BF1-A092-F972C1DC6564';
var sequenceTypeID = 'B641B9A2-0D47-4a69-9EF2-ED895C72096E';

var showPlayType = null;
var showPlayTypeValue = null;

var showSequence = null;
var showSequenceValue = null;

var serialno = null;

var showDuration = 0;
var showDurationInHMS = null;
var prevState = null;
var state = null;

var firstEvent = null;
var lastEvent = null;
var currentEvent = null;
var selectedEvent = null;
var showEvents = null;

var selectedShow = null;
var selectedShowName = null;
var isStereoscopic = false;
var isFPS48 = false;
var show = null;
var showID = null;

var progressBarMaxWidth = 877;
var currentShowPlayedDuration = 0;
var currentEventPlayedDuration = 0;
var progressLeft = 0;
var isResume = false;

var isProgressActive = false;
var isLoopUpdateRequest = false;
var _isSeekDisabled = true;

SetStyle();
Sys.Application.add_load(control_SetText);
Sys.Application.add_unload(control_unload);

function DownloadImage() {
    $find('loopplay').set_CheckedImageUrl("res/Skins/" + skin + "/Common/Loop%20Active.png");
    $find('loopplay').set_UncheckedImageUrl("res/Skins/" + skin + "/Common/Loop%20Inactive.png");
}

function control_SetText() {
    PageMethods.IsSeekDisabled(function(isSeekDisabled) {
        _isSeekDisabled = isSeekDisabled 
    });

    DownloadImage();

    SetTexttoControl("controlnowPlayingLabel", DisplayTextResource.currentShow);
    SetTexttoControl("controlstatusLabel", DisplayTextResource.status);
    SetTexttoControl("controldurationLabel", DisplayTextResource.duration);
    SetTexttoControl("controltimeLeftLabel", DisplayTextResource.timeLeft);
    SetTexttoControl("controleventtimeLabel", DisplayTextResource.eventTime);
    SetTexttoControl("controlstopLabel", DisplayTextResource.stop);
    SetTexttoControl("controlpauseLabel", DisplayTextResource.pause);
    SetTexttoControl("controlplayLabel", DisplayTextResource.play);
    SetTexttoControl("spnManualDisabled", DisplayTextResource.manual);
    SetTexttoControl("manualTxt", DisplayTextResource.manual);
    SetTexttoControl("spnScheduleDisabled", DisplayTextResource.schedule);
    SetTexttoControl("scheduleTxt", DisplayTextResource.schedule);
    SetTexttoControl("loadTxt", DisplayTextResource.load);
    SetTexttoControl("spnControlloadDisabled", DisplayTextResource.load);
    SetTexttoControl("resumeTxt", DisplayTextResource.resume);
    SetTexttoControl("spnControlresumeDisabled", DisplayTextResource.resume);
    SetTexttoControl("seek_a", DisplayTextResource.seek);
    SetTexttoControl("spnSeekDisabled", DisplayTextResource.seek);
    SetUpDownArrow($get("eventTimeCount"), DisplayTextResource.down);
    SetUpDownArrow($get("timeLeftCount"), DisplayTextResource.up);
    SetTexttoControl("loopLbl", DisplayTextResource.loop);
    SetTexttoControl("spnPlayType", DisplayTextResource.showPlayType);
    SetTexttoControl("spnSequence", DisplayTextResource.showSequence);
    SetTexttoControl("Validate", DisplayTextResource.validationFailed);

    progressLeft = document.getElementById("controlpositionBar").offsetLeft;
}

setTimeout("Initialize()", 1000);

function Initialize() {
    pi.Show(DisplayTextResource.loading + "...");

    $get("btnPrev").value = '\u00AB';
    $get("btnNext").value = '\u00BB';

    $find('seekTime_BID').set_CultureTimePlaceholder(':');

    var timeLeftCount = $get("timeLeftCount");
    timeLeftCount.originalText = DisplayTextResource.up;

    var eventTimeCount = $get("eventTimeCount");
    eventTimeCount.originalText = DisplayTextResource.down;

    var showextnd = $find('showextnd');
    showextnd.Loading();
    showextnd._dropPopupPopupBehavior._positioningMode = 5; //TopRight
    showextnd._reset = true;
    showextnd.hover();
    showextnd = null;

    LoadPlayTypes();

    PageMethods.GetControlPageInfo(OnSuccess, OnFailure);

    Qube.Mama.Catalog.GetProperties(null, null, OnGotProperties, OnErrorDummy);
}

function OnSuccess(controlPageInfo) {
    OnGotSerialNumber(controlPageInfo.SerialNumber);
    OnGotCueList(controlPageInfo.Cues);
    OnGotShows(controlPageInfo.Shows);
    OnGotScheduledState(controlPageInfo.IsScheduleMode);
    OnGotCurrentShowStatus(controlPageInfo.CurrentShowInfo);

    isProgressActive = false;
    pi.Hide();
}

function OnFailure(errorObj) {
    isProgressActive = false;

    OnGotShowsError(errorObj);
    OnGotError(errorObj);
}

function OnGotCueList(result) {
    var cueListTable = $get("tblCueList");
    cueListTable.style.display = 'none';

    if (result == null || result.length == 0)
        return;

    for (var i = 0; i < result.length; ++i) {
        var tr = document.createElement("tr");

        var td = document.createElement("td");
        var label = document.createElement("label");
        label.id = result[i].ID;
        label.displayName = result[i].DisplayName;
        td.appendChild(label);
        tr.appendChild(td);

        cueListTable.appendChild(tr);
    }
}

function OnGotSerialNumber(result) {
    serialno = result;
}

function SetStyle() {
    document.getElementById("controlMenu").className = "MenuFocus";
    document['body'].style.backgroundImage = "url(res/Skins/" + skin + "/Control/Control.jpg)";
}

function OnGotScheduledState(result) {
    if (result == true)
        EnableManual();
    else
        EnableSchedule();
}

function EnableManual() {
    document.getElementById("scheduleDisabled").style.visibility = "visible";
    document.getElementById("scheduleEnabled").style.visibility = "hidden";

    document.getElementById("manualDisabled").style.visibility = "hidden";
    document.getElementById("manualEnabled").style.visibility = "visible";
}

function EnableSchedule() {
    document.getElementById("scheduleDisabled").style.visibility = "hidden";
    document.getElementById("scheduleEnabled").style.visibility = "visible";

    document.getElementById("manualDisabled").style.visibility = "visible";
    document.getElementById("manualEnabled").style.visibility = "hidden";
}

function UpdateStatus() {
    PageMethods.GetCurrentShowInfo(showID, false,
                                            $get("timeLeftCount").originalText == DisplayTextResource.up ? true : false,
                                            $get("eventTimeCount").originalText == DisplayTextResource.up ? true : false,
                                            OnGotCurrentShowStatus, OnGotError);
}

function OnGotError(result) {
    $get("btnPrev").style.display = "none";
    $get("btnNext").style.display = "none";

    OnGotShowInfo(null);
    OnGotShowState(-1);
    OnGotCurrentPosition(0);
    OnGotCurrentPositionHM(null);
    OnGotShowStartTime(null);
    OnGotShowEndTime(null);
    OnGotRemainingDuration('');
    OnGotEventPosition('');
    OnGotShowEvent(null);

    EnablePlayPauseStop();

    if (!isProgressActive)
        pi.Hide();

    ChangePlayPauseCursor();

    setTimeout("UpdateStatus()", 1000);
}

function OnGotCurrentShowStatus(result) {
    if (result == null) {
        OnGotError(result);
        return;
    }

    if (result.Events == null) {
        $get("btnPrev").style.display = "none";
        $get("btnNext").style.display = "none";
        showEvents = null;

        _RemoveEvents();
    }
    else if (IsShowEventsChanged(result.Events)) {
        showEvents = result.Events;
        OnGotShowEvents(showEvents);
    }
    else
        UpdateAutoEventsInfo(result.Events);

    if (isResume && result.RemainingDuration != "") {
        OnGotShowStoppedPosition(result.RemainingDuration);
        isResume = false;
    }

    OnGotShowInfo(result);
    OnGotShowState(result.State);
    OnGotCurrentPosition(result.Position);
    OnGotCurrentPositionHM(result.Position);
    OnGotShowStartTime(result.StartTime);
    OnGotShowEndTime(result.EndTime);
    OnGotRemainingDuration(result.RemainingDuration);
    OnGotEventPosition(result.ShowEventPosition);
    OnGotShowEvent(result.ShowEvent);

    if (!isLoopUpdateRequest)
        $find("loopplay").set_CheckedValue(result.IsLoopplayBack);

    OnUpdateCompletedCues(result.Cues);

    EnablePlayPauseStop();

    if (!isProgressActive)
        pi.Hide();

    ChangePlayPauseCursor();

    result = null;

    setTimeout("UpdateStatus()", 1000);
}

function OnGotShowInfo(result) {
    if (result == null) {
        showID = null;
        show = null;
        return;
    }

    var name = result.Name == "" ? DisplayTextResource.noShow : result.Name;
    if (name.length > 44)
        name = name.substr(0, 44) + "...";

    show = name;

    showID = result.ID;

    SetTexttoControl("controlnowPlaying", name);

    showDuration = result.Duration;

    showDurationInHMS = Convert2HMS(showDuration);
    SetTexttoControl("controlduration", showDurationInHMS);

    result = null;
}

function OnGotShowStartTime(result) {
    if (state <= 0 || result == null) {
        SetTexttoControl("controlstarttime", "");
        return;
    }

    SetTexttoControl("controlstarttime", result);

    result = null;
}

function OnGotShowEndTime(result) {
    if (state <= 0 || result == null) {
        SetTexttoControl("controlendtime", "");
        return;
    }

    SetTexttoControl("controlendtime", result);

    result = null;
}

function OnGotShowState(result) {
    if (result == null)
        return;

    state = result;

    if (serialno == null && state != Qube.DalapathiState.Inactive)
        Qube.Mama.Dalapathi.GetSerialNumber(OnGotSerialNumber, OnErrorDummy);

    if (state != Qube.DalapathiState.Stopped && selectedEvent != null)
        selectedEvent = null;

    $get("divloop").style.display = result == -1 ? "none" : "";

    SetTexttoControl("controlstatus", DisplayState(result));

    if (show == null)
        SetTexttoControl("controlnowPlaying", DisplayTextResource.noShow);

    EnableControls();
}

function OnGotShowStoppedPosition(result) {
    if (result == null)
        return;

    var seekTC = $find('seekTime_BID').get_element();
    seekTC.value = result;
}

function OnGotEventPosition(result) {
    if (result == "")
        SetTexttoControl("controleventtime", "00:00:00");
    else {
        if (state != Qube.DalapathiState.Paused &&
            state != Qube.DalapathiState.Inactive &&
            currentEvent != null && currentEvent.Duration != undefined) {
            currentEventPlayedDuration = $get("eventTimeCount").originalText == DisplayTextResource.up ? result :
                                                              (currentEvent.Duration - result)
        }
        SetTexttoControl("controleventtime", result);
    }



    result = null;
}

function OnGotRemainingDuration(result) {
    SetTexttoControl("controltimeLeft", result == "" ? "00:00:00" : result);

    result = null;
}

function OnGotCurrentPositionHM(result) {
    if (state <= 0 || result == 0 || showDurationInHMS == null) {
        SetTexttoControl("controlcurrentPos", "");
        return;
    }

    SetTexttoControl("controlcurrentPos", Convert2HMS(result) + " / " + showDurationInHMS);

    result = null;
}

function OnGotCurrentPosition(result) {
    var barWidth = 0;

    if (result != null && result != 0 && showDuration != null && showDuration != 0)
        barWidth = result * (progressBarMaxWidth / showDuration);

    currentShowPlayedDuration = result;

    document.getElementById("controlpositionBar").style.width = barWidth + 'px';

    result = null;
}

function OnGotShows(result) {
    if (result == null) {
        OnGotShowsError(result);
        return;
    }

    $find('showextnd').Generate(result, showSelected);

    result = null;
}

function _RemoveEvents() {
    var events = document.getElementById("controlevents");

    var eventCollection = document.getElementById("controlevents").childNodes;

    if (eventCollection != null) {
        var length = eventCollection.length;

        while (length--)
            events.removeChild(eventCollection[0]);
    }
}

function OnGotShowEvents(result) {
    _RemoveEvents();

    PageMethods.GetAtmosCpls(
        function(atmosCpls) {
            var hasEvents = CreateEvents(result, atmosCpls);

            if (hasEvents) {
                $get("btnPrev").style.display = "block";
                $get("btnNext").style.display = "block";
            }
            else {
                $get("btnPrev").style.display = "none";
                $get("btnNext").style.display = "none";
            }
        }, OnError);
}

function CalculateWidth(eventsCollection) {
    if (eventsCollection == null)
        return;

    var playlistEvents = 0;
    for (var i = 0; i < eventsCollection.length; ++i) {
        if (eventsCollection[i].TypeName == playTitleEvent ||
                    eventsCollection[i].TypeName == callPlaylistEvent)
            ++playlistEvents;
    }

    var eventsBarWidth = document.getElementById("controlevents").offsetWidth - 4;

    eventsCollection = null;

    return eventsBarWidth / playlistEvents;
}

function CreateEvent(result) {
    var spanElement = document.createElement("span");

    spanElement.id = result.ID;
    spanElement.className = "event eventName";
    spanElement.Duration = result.Duration;
    spanElement.onclick = function(event) { OnEventClicked(event) };
    spanElement.ondblclick = function(event) { OnEventDoubleClicked(event) };

    AttachEvent(spanElement, "mouseover", TooltipDisplayForEvent);
    AttachEvent(spanElement, "mouseout", TooltipHideForEvent);
    AttachEvent(spanElement, "mousemove", TooltipDisplayForEvent);

    result = null;

    return spanElement;
}

function CreateCueEvent(result) {
    var img = document.createElement("img");
    img.src = "res/Skins/" + skin + "/Common/cue_grey.gif";
    img.className = "cueEventImg";
    img.id = result.ID;
    img.style.zIndex = 20;
    img.style.top = '-18px';

    img.originalText = UpdateCueEventTooltip(result);

    AddTitle(img);

    result = null;

    return img;
}

function CreateWaitEvent(result) {
    var img = document.createElement("img");
    img.src = "res/Skins/" + skin + "/Common/cue_grey_pause.gif"
    img.className = "waitEventImg";
    img.id = result.ID;
    img.style.zIndex = 20;
    img.style.top = '-18px';

    img.originalText = UpdateWaitEventTooltip(result);

    AddTitle(img);

    result = null;

    return img;
}

function CreateEvents(result, atmosCpls) {
    var spanleft = 0;
    var width = CalculateWidth(result);
    var eventCollection = document.getElementById("controlevents");

    var i;

    firstEvent = null;
    lastEvent = null;

    if (result.length > 0) {
        firstEvent = result[0].ID;
        lastEvent = result[result.length - 1].ID;
    }

    var hasEvents = false;
    var evnt;

    for (i = 0; i < result.length; ++i) {
        if (result[i].TypeName == playTitleEvent || result[i].TypeName == callPlaylistEvent) {
            evnt = CreateEvent(result[i]);

            var evntName;

            if (result[i].TypeName == playTitleEvent) {
                evntName = result[i].Name + "\n(" + Convert2HMS(result[i].Duration) + ")";
                evnt.Name = result[i].Name;
                evnt.Aspect = result[i].Aspect;
                evnt.Format = result[i].Format;
                evnt.Stereoscopic = result[i].IsStereoscopic ? "3D" : "2D";
                evnt.IsAtmosContent = Array.contains(atmosCpls, result[i].playlistID);
            }
            else if (result[i].TypeName == callPlaylistEvent) {
                evntName = result[i].Name + "\n(" + Convert2HMS(result[i].Duration) + ")";

                evnt.Name = result[i].Name;

                if (result[i].Alias != null && result[i].Alias != "") {
                    evntName = result[i].Name + " - " + result[i].Alias + "\n(" + Convert2HMS(result[i].Duration) + ")";
                    evnt.Name = result[i].Name + " - " + result[i].Alias;
                }
            }

            SetTexttoControl(evnt, evntName);

            evnt.style.width = width + 'px';
            evnt.style.left = spanleft + 'px';

            lastTitlePos = spanleft;
            spanleft = spanleft + width;

            rightEvents = leftEvents = 0;

            if (result[i].AutoEventInfo != null && result[i].AutoEventInfo.length > 0) {
                var autoEvnt = null;
                for (var j = 0; j < result[i].AutoEventInfo.length; j++) {
                    if (result[i].AutoEventInfo[j].Type.toUpperCase() == waitEvent) {
                        autoEvnt = CreateWaitEvent(result[i].AutoEventInfo[j]);

                        if (result[i].AutoEventInfo[j].Kind == 'START') {
                            autoEvnt.style.left = lastTitlePos + leftEvents * 18 + 'px';
                            ++leftEvents;
                        }
                        else {
                            autoEvnt.style.left = (spanleft - ((rightEvents + 1) * 18)) + 'px';
                            ++rightEvents;
                        }
                    }
                    else if (result[i].AutoEventInfo[j].Type.toUpperCase() == cueEvent) {
                        autoEvnt = CreateCueEvent(result[i].AutoEventInfo[j]);

                        if (result[i].AutoEventInfo[j].Kind == 'START') {
                            autoEvnt.style.left = lastTitlePos + leftEvents * 18 + 'px';
                            ++leftEvents;
                        }
                        else {
                            autoEvnt.style.left = (spanleft - ((rightEvents + 1) * 18)) + 'px';
                            ++rightEvents;
                        }
                    }
                    eventCollection.appendChild(autoEvnt);
                }
            }
        }

        if (evnt != undefined) {
            hasEvents = true;
            eventCollection.appendChild(evnt);
        }
    }

    result = null;
    evnt = null;
    eventCollection = null;

    return hasEvents;
}

function OnEventClicked(e) {
    if (state != Qube.DalapathiState.Stopped)
        return;
    SetSelectedEvent(e);
}

function SetSelectedEvent(e) {
    if (e == undefined)  //For IE
        e = event;

    var span = GetTargetElement(e);

    while (span.tagName.toLowerCase() != 'span')
        span = span.parentNode;

    if (_playAnyComposition || (!_playAnyComposition && span.id == firstEvent)) {
        var eventCollection = document.getElementById("controlevents").getElementsByTagName("Span");

        for (var i = 0; i < eventCollection.length; ++i) {
            if (eventCollection[i].className == 'event')
                document.getElementById(eventCollection[i].id).className = "event eventName";
        }

        span.className = "selectedEvent eventName";

        selectedEvent = span;
        currentEvent = span;

        return true;
    }

    return false;
}

function OnGotShowEvent(result) {
    if (result == null)
        return;

    var eventCollection = document.getElementById("controlevents").getElementsByTagName("Span");

    for (var i = 0; i < eventCollection.length; ++i) {
        if (state != Qube.DalapathiState.Stopped) {
            if (result == eventCollection[i].id) {
                currentEvent = eventCollection[i];
                document.getElementById(eventCollection[i].id).className = "currentEvent eventName";
                continue;
            }
        }
        else if (selectedEvent != null && eventCollection[i].id == selectedEvent.id) {
            document.getElementById(eventCollection[i].id).className = "selectedEvent eventName";
            continue;
        }

        document.getElementById(eventCollection[i].id).className = "event eventName";
    }

    eventCollection = null;
}

function EjectShow() {
    if (show == null || isProgressActive)
        return false;

    isProgressActive = true;

    pi.Show(DisplayTextResource.ejecting + "...");

    PageMethods.EjectShow(OnRequestCompleted, OnError);

    return false;
}

function Stop() {
    if (isProgressActive)
        return false;

    isProgressActive = true;

    var seekTC = $find('seekTime_BID').get_element();
    seekTC.value = Convert2HMS(currentShowPlayedDuration);

    pi.Show(DisplayTextResource.stopping + "...");
    PageMethods.Stop(OnRequestCompleted, OnError);
    return false;
}

function Play() {
    if (show == null || isProgressActive)
        return false;

    isProgressActive = true;

    pi.Show(DisplayTextResource.playing + "...");

    if (state == Qube.DalapathiState.Stopped) {
        if (_playAnyComposition && selectedEvent != null && 
            selectedEvent.id != firstEvent && !_isSeekDisabled) {
            PageMethods.PlayFromEvent(selectedEvent.id, OnRequestCompleted, OnError);
        }
        else
            PageMethods.Play(OnRequestCompleted, OnError);
    }
    else
        PageMethods.Play(OnRequestCompleted, OnError);

    return false;
}

function OnRequestCompleted() {
    isProgressActive = false;
}

function Pause() {
    if (show == null || isProgressActive)
        return false;

    isProgressActive = true;

    //    if ((state == Qube.DalapathiState.Stopped) && (firstEvent != null))
    //    {        
    //        pi.Show(DisplayTextResource.cueing + "...");
    //
    //        if(_playAnyComposition)
    //            Qube.Mama.Dalapathi.Cue((selectedEvent != null) ?  selectedEvent.id : firstEvent, OnRequestCompleted, OnError);
    //        else
    //            Qube.Mama.Dalapathi.Cue(firstEvent, OnRequestCompleted, OnError);
    //    }
    //    else
    //    {
    if (state == Qube.DalapathiState.Paused)
        pi.Show(DisplayTextResource.playing + "...");
    else
        pi.Show(DisplayTextResource.pausing + "...");

    Qube.Mama.Dalapathi.Pause(OnRequestCompleted, OnError);
    //    }
    return false;
}

function showSelected(e) {
    if (state != Qube.DalapathiState.Stopped)
        return;

    var shows = e.target;

    if (shows.value == '') {
        EnableControl("controlloadDisabled", "controlload");
        EnableControl("controlresumeDisabled", "controlresume");
        return;
    }

    selectedShow = $find('showextnd').selectedValue();
    selectedShowName = $find('showextnd').selectedText();

    isStereoscopic = false;
    isFPS48 = false;

    // TODO:Uncomment the following line if playlist validation not needed before load.    
    //    OnGotPlayableStatus({"IsPlayable":"true", "IsStereoscopic":"false", "isFPS48":"false", "IsAborted":"false"});

    // TODO:comment the following line if playlist validation not needed before load.
    isProgressActive = true;

    pi.Show(DisplayTextResource.validatingShow + " " + (selectedShowName.length > 10 ? selectedShowName.substr(0, 10) : selectedShowName) + "...");

    $get("validationError").style.display = "none";

    Qube.Mama.Dalapathi.IsPlaylistValid(serialno, selectedShow, OnGotPlayableStatus, OnGotPlayableStatusError);
}

function OnGotPlayableStatusError(result) {
    SetNotPlayable(result.get_message());
    OnRequestCompleted();
}

function SetNotPlayable(errorMessage) {
    if (!_ignoreShowValidationFailures) {
        EnableControl("controlloadDisabled", "controlload");
        EnableControl("controlresumeDisabled", "controlresume");
    }

    if (errorMessage != "" && errorMessage != null) {
        errorMessage = GetFormatText(errorMessage, 300, "validationErrorText");
        SetTexttoControl("validationErrorFrame", errorMessage);
    }

    $get("validationError").style.display = "";
}

function OnGotPlayableStatus(result) {

    if (result == null)
        SetNotPlayable("");
    else {
        if (result.IsPlayable) {
            isStereoscopic = result.IsStereoscopic;
            isFPS48 = result.IsFPS48;
        }
        else
            SetNotPlayable(result.ErrorMessage);

        if (result.IsPlayable || _ignoreShowValidationFailures) {
            EnableControl("controlload", "controlloadDisabled");
            OnGotShowAbortedStatus(result.IsAborted);
        }
    }

    OnRequestCompleted();
}

function OnGotShowAbortedStatus(result) {
    if (result != null && result == true)
        EnableControl("controlresume", "controlresumeDisabled");
    else
        EnableControl("controlresumeDisabled", "controlresume");
}

function GetControl(controlID) {
    if (typeof (controlID) == "object")
        return controlID;
    else
        return (document.getElementById(controlID));
}

function EnableControl(controlID2Enable, controlID2Disable) {
    var control2Enable = controlID2Enable != null ? GetControl(controlID2Enable) : null;
    var control2Disable = controlID2Disable != null ? GetControl(controlID2Disable) : null;

    if (control2Enable != null)
        control2Enable.style.visibility = "visible";

    if (control2Disable != null)
        control2Disable.style.visibility = "hidden";
}

function ResumeShow() {
    if (state == null || state != Qube.DalapathiState.Stopped || selectedShow == null)
        return false;

    pi.Show(DisplayTextResource.resuming + "...");

    isProgressActive = true;

    if ($find('showextnd').selectedValue() != showID)
        showDuration = 0;

    Init();

    PageMethods.Resume(selectedShow, OnResumeCompleted, OnError);
    isResume = true;
}

function OnResumeCompleted(result) {
    isProgressActive = false;
}

function LoadShow() {
    if (state == null || state != Qube.DalapathiState.Stopped || selectedShow == null)
        return false;

    isProgressActive = true;
    pi.Show(DisplayTextResource.loading + "...");

    var seekTC = $find('seekTime_BID').get_element();
    seekTC.value = '00:00:00';

    if ($find('showextnd').selectedValue() != showID)
        showDuration = 0;

    Init();

    Qube.Mama.Dalapathi.LoadShow(selectedShow, isStereoscopic, OnRequestCompleted, OnError);
}

function Init() {
    currentEvent = null;
    lastEvent = null;
    firstEvent = null;
    showID = null;
    showEvents = null;
}

function DisplayState(state) {
    switch (state) {
        case Qube.DalapathiState.Inactive:
            return DisplayTextResource.inactive;

        case Qube.DalapathiState.Stopped:
            return DisplayTextResource.stopped;

        case Qube.DalapathiState.Paused:
            return DisplayTextResource.paused;

        case Qube.DalapathiState.Running:
            return DisplayTextResource.playing;

        case Qube.DalapathiState.Cued:
            return DisplayTextResource.cued;

        default:
            return DisplayTextResource.inactive;
    }
}

function SelectManual() {
    if (state == Qube.DalapathiState.Inactive)
        return false;

    EnableSchedule();
    Qube.Mama.Dalapathi.SetDeviceMode(false, OnRequestCompleted, OnError);
    return false;
}

function SelectScheduled() {
    if (state == Qube.DalapathiState.Inactive)
        return false;

    EnableManual();
    Qube.Mama.Dalapathi.SetDeviceMode(true, OnRequestCompleted, OnError);
    return false;
}

function SeekTimeChanged() {
    var seekTC = $find('seekTime_BID').get_element();
    var re = /_/g;
    var reg = /(^\d\d:[0-5]\d:[0-5]\d$)/;

    seekTime = seekTC.value.replace(re, '0');

    if (!reg.test(seekTime)) {
        ConfirmationWindow(DisplayTextResource.invalidPosition, DisplayTextResource.pleaseEnterValidPositionToSeek,
                            "res/Skins/" + skin + "/Common/error.gif", null, null);
        seekTC.value = '00:00:00';
    }
    else
        seekTC.value = seekTime;

    seekTC = null;
}

function Seek() {
    if (state == Qube.DalapathiState.Stopped || _isSeekDisabled)
        return;

    var seekControl = $find('seekTime_BID').get_element();
    var seekTime = seekControl.value;
    seekTime = parseInt(seekTime.substr(0, 2), 10) * 3600 + parseInt(seekTime.substr(3, 5), 10) * 60 + parseInt(seekTime.substr(6, 9), 10);

    if (seekTime > showDuration) {
        ConfirmationWindow(DisplayTextResource.invalidPosition, DisplayTextResource.seekPositionCannotBeMoreThanShowDuration,
                            "res/Skins/" + skin + "/Common/error.gif", null, null);
        SetTexttoControl(seekControl, '00:00:00');
        return false;
    }

    isProgressActive = true;

    pi.Show(DisplayTextResource.seeking + "...");

    PageMethods.Seek(seekTime, OnRequestCompleted, OnError);

    seekControl = null;

    return false;
}

function _ChangeImageSrc() {
    if (state == Qube.DalapathiState.Stopped || state == Qube.DalapathiState.Inactive) {
        document.getElementById("controlPlayInactive").className = "controlPlayInactive";
        document.getElementById("controlPauseInactive").className = "controlPauseInactive";
        document.getElementById("controlStopInactive").className = "controlStopInactive";
    }
}

function EnablePlayPauseStop() {
    if (state == Qube.DalapathiState.Stopped || state == Qube.DalapathiState.Inactive) {
        if (showID == null || showID == "") {

            _ChangeImageSrc();

            EnablePlaybackControls("controlPlayInactive", "controlplayDisabled", controlplay);
            EnablePlaybackControls("controlPauseInactive", "controlpauseDisabled", controlpause);
            EnablePlaybackControls("controlstopDisabled", "controlStopInactive", controlstop);
        }
        else {
            EnablePlaybackControls(controlplay, "controlplayDisabled", "controlPlayInactive");
            EnablePlaybackControls("controlPauseInactive", controlpause, "controlpauseDisabled");

            EnablePlaybackControls(ejectShow, "controlstopDisabled", "controlStopInactive");
        }

        ChangePlayPauseCursor();
    }
}

function EnablePlaybackControls(enable, disable, disable2) {
    document.getElementById(enable).style.visibility = "visible";
    document.getElementById(disable).style.visibility = "hidden";

    if (disable2 != undefined)
        document.getElementById(disable2).style.visibility = "hidden";
}

function ResetPlaybackControlLabelClassName() {
    document.getElementById("controlstopLabel").className = (state == Qube.DalapathiState.Stopped) ? "activeControlStatusLabel" : "";
    document.getElementById("controlplayLabel").className = (state == Qube.DalapathiState.Running) ? "activeControlStatusLabel" : "";
    document.getElementById("controlpauseLabel").className = (state == Qube.DalapathiState.Paused || state == Qube.DalapathiState.Cued) ?
                                                                            "activeControlStatusLabel" : "";
}

function ChangeStopControlText() {
    if (state == Qube.DalapathiState.Stopped && (showID != null & showID != "")) {
        SetTexttoControl("controlstopLabel", DisplayTextResource.eject);
    }
    else {
        SetTexttoControl("controlstopLabel", DisplayTextResource.stop);
        document.getElementById(ejectShow).style.visibility = "hidden";
    }
}

function EnableControls() {
    ChangeStopControlText();

    if (prevState == null || prevState != state) {
        ResetPlaybackControlLabelClassName();

        switch (state) {
            case Qube.DalapathiState.Stopped:
                {
                    EnablePlayPauseStop();

                    EnableControl("controlloadDisabled", "controlload");
                    EnableControl("controlresumeDisabled", "controlresume");

                    $find('showextnd').Select('');

                    document.getElementById("seek").style.display = "none";
                    document.getElementById("seekDisabled").style.display = "";

                    break;
                }
            case Qube.DalapathiState.Paused:
                {
                    EnablePlaybackControls(controlplay, "controlplayDisabled", "controlPlayInactive");
                    EnablePlaybackControls("controlpauseDisabled", controlpause, "controlPauseInactive");
                    EnablePlaybackControls(controlstop, "controlstopDisabled", "controlStopInactive");

                    document.getElementById("seek").style.display = "";
                    document.getElementById("seekDisabled").style.display = "none";

                    EnableControl("controlloadDisabled", "controlload");
                    EnableControl("controlresumeDisabled", "controlresume");

                    break;
                }
            case Qube.DalapathiState.Running:
                {

                    EnablePlaybackControls("controlplayDisabled", controlplay, "controlPlayInactive");

                    EnablePlaybackControls(controlpause, "controlpauseDisabled", "controlPauseInactive");
                    EnablePlaybackControls(controlstop, "controlstopDisabled", "controlStopInactive");

                    document.getElementById("seek").style.display = "";
                    document.getElementById("seekDisabled").style.display = "none";

                    EnableControl("controlloadDisabled", "controlload");
                    EnableControl("controlresumeDisabled", "controlresume");
                    break;
                }
            case Qube.DalapathiState.Cued:
                {
                    EnablePlaybackControls(controlplay, "controlplayDisabled", "controlPlayInactive");
                    EnablePlaybackControls("controlpauseDisabled", controlpause, "controlPauseInactive");
                    EnablePlaybackControls(controlstop, "controlstopDisabled", "controlStopInactive");

                    document.getElementById("seek").style.display = "";
                    document.getElementById("seekDisabled").style.display = "none";

                    EnableControl("controlloadDisabled", "controlload");
                    EnableControl("controlresumeDisabled", "controlresume");

                    break;
                }

            default: //inactive
                {
                    SetTexttoControl("controlnowPlaying", DisplayTextResource.noShow);

                    SetTexttoControl("controlduration", "00:00:00");
                    SetTexttoControl("controlevents", "");

                    EnablePlaybackControls("controlPlayInactive", "controlplayDisabled", controlplay);
                    EnablePlaybackControls("controlPauseInactive", "controlpauseDisabled", controlpause);
                    EnablePlaybackControls("controlStopInactive", "controlstopDisabled", controlstop);

                    document.getElementById("seek").style.display = "none";
                    document.getElementById("seekDisabled").style.display = "";

                    EnableControl("controlloadDisabled", "controlload");
                    EnableControl("controlresumeDisabled", "controlresume");

                    show = showID = null;
                }
        }

        prevState = state;
    }
}

function ShowPopup(title, iconImgPath, text, okScript, cancelScript, isOkOnly) {
    ConfirmationWindow(title, text, iconImgPath, okScript, cancelScript, isOkOnly);
}

function control_unload() {
    showID = null;
    show = null;

    showPlayType = null;
    showPlayTypeValue = null;

    showSequence = null;
    showSequenceValue = null;

    serialno = null;

    prevState = null;
    state = null;

    firstEvent = null;
    lastEvent = null;
    currentEvent = null;
    selectedEvent = null;

    selectedShow = null;
    selectedShowName = null;
    show = null;
    showID = null;

    if (showEvents != null) {
        for (var i = 0; i < showEvents.length; ++i) {
            var showEvent = $get(showEvents[i].ID);
            if (showEvent == undefined)
                continue;

            showEvent.Duration = null;

            if (showEvent.AutoEventInfo != undefined) {
                var cueEvents = showEvent.AutoEventInfo;
                for (var j = 0; j < cueEvents.length; ++j) {
                    cueEvents[j].originalText = null;
                }
                showEvent.AutoEventInfo = null;
                cueEvents = null;
            }

            showEvent = null;
        }

        showEvents = null;
    }
}

function ChangePlayPauseCursor() {
    if (showID == null || showID == "") {
        $get(controlplay).style.cursor = "default";
        $get(controlpause).style.cursor = "default";
    }
    else {
        $get(controlplay).style.cursor = "pointer";
        $get(controlpause).style.cursor = "pointer";
    }

}

function OnEventDoubleClicked(e) {
    if (_isSeekDisabled || !SetSelectedEvent(e))
        return;

    var selectedEventID = selectedEvent.id;

    isProgressActive = true;

    pi.Show(DisplayTextResource.wait + "...");

    PageMethods.PlayFromEvent(selectedEventID, OnRequestCompleted, OnError);
}

function FindEventStartPosition(selectedevent) {
    var timeline = $get("controlevents");
    var duration = 0;

    for (var i = 0; i < timeline.childNodes.length; i++) {
        var evnt = timeline.childNodes[i];
        if (evnt.Duration && evnt.id != selectedevent)
            duration += evnt.Duration;
        else if (evnt.id == selectedevent)
            break;
    }

    return RoundNumber(duration, 9);
}

function SetUpDownArrow(btn, status) {
    if (Sys.Browser.agent == Sys.Browser.InternetExplorer) {
        btn.style.fontFamily = 'Webdings';
        btn.style.fontSize = '12pt';
        SetTexttoControl(btn, (status == DisplayTextResource.up ? '5' : '6')); //up : down        
    }
    else {
        btn.style.fontFamily = 'Tahoma, Arial, sans-serif';
        btn.style.fontSize = '9pt';
        SetTexttoControl(btn, (status == DisplayTextResource.up ? '\u25B2' : '\u25BC')); //up : down
    }
}

function ChangeStatus(btn) {
    btn.originalText = (btn.originalText == DisplayTextResource.up ? DisplayTextResource.down : DisplayTextResource.up);
    SetUpDownArrow(btn, btn.originalText);
}

function MovePrevious() {
    if (currentEvent == null || isProgressActive || _isSeekDisabled)
        return false;
    else {
        isProgressActive = true;
        pi.Show(DisplayTextResource.wait + "...");
        PageMethods.PlayPreviousEvent(OnRequestCompleted, OnError);
    }

    return false;
}

function MoveNext() {
    if (currentEvent == null || isProgressActive || _isSeekDisabled)
        return false;
    else {
        isProgressActive = true;
        pi.Show(DisplayTextResource.wait + "...");
        PageMethods.PlayNextEvent(OnRequestCompleted, OnError);
    }

    return false;
}

function IsCrossed3Sec(currEvent) {
    return (currentEventPlayedDuration >= 4);
}

function SeekProgressClick(e) {
    if (_isSeekDisabled || state <= 0)
        return false;

    if (e == null)
        e = window.event;

    isProgressActive = true;

    pi.Show(DisplayTextResource.seeking + "...");

    var docType = GetDocumentType();

    var oneSec = showDuration / progressBarMaxWidth;
    var position = (e.clientX + docType.scrollLeft - progressLeft) * oneSec;

    position = position > showDuration ? showDuration : position;
    selectedEvent = FindEventByPosition(position);

    PageMethods.Seek(position, OnRequestCompleted, OnError);
    $find('seekTime_BID').get_element().value = Convert2HMS(position);
}

function FindEventByPosition(position) {
    var timeline = $get("controlevents");
    var selectedevnt = null;
    var duration = 0;

    for (var i = 0; i < timeline.childNodes.length; i++) {
        var evnt = timeline.childNodes[i];
        if (evnt.Duration) {
            duration += evnt.Duration;
            if (duration >= position) {
                selectedevnt = evnt;
                break;
            }
        }
    }

    timeline = null;

    return selectedevnt;
}

function FindNextEvent(currentEventId) {
    var timeline = $get("controlevents");
    var nextEvent = null;
    var evnt = null;
    var isFound = false;

    for (var i = 0; i < timeline.childNodes.length; i++) {
        evnt = timeline.childNodes[i];
        if (evnt.Duration) {
            if (evnt.id == currentEventId) {
                isFound = true;
                nextEvent = evnt;
            }
            else if (isFound) {
                nextEvent = evnt;
                break;
            }
        }
    }

    timeline = null;

    return nextEvent;
}

function FindPreviousEvent(currentEventId) {
    var timeline = $get("controlevents");
    var prevEvent = null;
    var currEvent = null;
    var evnt = null;

    for (var i = 0; i < timeline.childNodes.length; i++) {
        evnt = timeline.childNodes[i];
        if (evnt.Duration) {
            prevEvent = currEvent;
            currEvent = evnt;
            if (evnt.id == currentEventId) {
                if (i == 0)
                    prevEvent = currEvent;
                break;
            }
        }
    }

    timeline = null;

    return prevEvent;
}

function PopulateDuration(e) {
    if (state <= 0)
        return;

    if (e == null)
        e = window.event;

    var docType = GetDocumentType();

    var oneSec = showDuration / progressBarMaxWidth;
    var position = (e.clientX + docType.scrollLeft - progressLeft) * oneSec;

    position = position > showDuration ? showDuration : position;

    var pointerTime = $get("pointerTime");
    pointerTime.innerHTML = Convert2HMS(position);
    pointerTime.style.display = "";
    pointerTime.style.left = (e.clientX + docType.scrollLeft - pointerTime.offsetWidth) + "px";
}

function UpdateLoopPlayBack(obj) {
    isLoopUpdateRequest = true;
    Qube.Mama.Dalapathi.SetLoopPlayBack(obj.checked, OnUpdateCompleted, OnSetLoopPlayBackError);
}

function OnSetLoopPlayBackError(result) {
    $find("loopplay").set_CheckedValue(!$find("loopplay").get_element().checked);
    isLoopUpdateRequest = false;
}

function OnUpdateCompleted(result) {
    isLoopUpdateRequest = false;
}

function OnError(result) {
    isProgressActive = false;
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function OnGotShowsError(result) {
    $find('showextnd')._isLoading = false;
    $find('showextnd').Select('');
}

function OnUpdateCompletedCues(cues) {
    if (cues == null)
        return;

    for (var i = 0; i < cues.length; i++) {
        var img = $get(cues[i].Id);
        if (img == null)
            continue;

        if (cues[i].CueEventType == Qube.CueEventType.Wait) {
            if (cues[i].Status == Qube.CueStatus.Success && img.src.indexOf("res/Skins/" + skin + "/Common/cue_green_pause.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_green_pause.gif";
            else if (cues[i].Status == Qube.CueStatus.PartialSuccess && img.src.indexOf("res/Skins/" + skin + "/Common/cue_orange_pause.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_orange_pause.gif";
            else if (cues[i].Status == Qube.CueStatus.Failed && img.src.indexOf("res/Skins/" + skin + "/Common/cue_red_pause.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_red_pause.gif";
            else if (cues[i].Status == Qube.CueStatus.Unknown && img.src.indexOf("res/Skins/" + skin + "/Common/cue_grey_pause.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_grey_pause.gif";
        }
        else {
            if (cues[i].Status == Qube.CueStatus.Success && img.src.indexOf("res/Skins/" + skin + "/Common/cue_green.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_green.gif";
            else if (cues[i].Status == Qube.CueStatus.PartialSuccess && img.src.indexOf("res/Skins/" + skin + "/Common/cue_orange.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_orange.gif";
            else if (cues[i].Status == Qube.CueStatus.Failed && img.src.indexOf("res/Skins/" + skin + "/Common/cue_red.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_red.gif";
            else if (cues[i].Status == Qube.CueStatus.Unknown && img.src.indexOf("res/Skins/" + skin + "/Common/cue_grey.gif") == -1)
                img.src = "res/Skins/" + skin + "/Common/cue_grey.gif";
        }
    }
}

function LoadPlayTypes() {
    var commercial = new DropDownItem();
    commercial.ID = 'commercial';
    commercial.Name = 'commercial';

    var test = new DropDownItem();
    test.ID = 'test';
    test.Name = 'test';

    var result = new Array();

    Array.add(result, commercial);
    Array.add(result, test);

    $find('playTypeExtnd').Generate(result, SetProperties);
}

function SetProperties() {
    var currentShowSequence = $find('sequence_BID').get_element().value;
    var currentShowPlayType = $find('playTypeExtnd').selectedValue();

    if (currentShowSequence != showSequenceValue) {
        showSequenceValue = currentShowSequence;
        Qube.Mama.Catalog.SetProperty(showSequence.ID, showSequenceValue, OnSetProperty, OnError);
    }

    if (currentShowPlayType != showPlayTypeValue) {
        showPlayTypeValue = currentShowPlayType;
        Qube.Mama.Catalog.SetProperty(showPlayType.ID, showPlayTypeValue, OnSetProperty, OnError);
    }
}

function OnSetProperty(result) {
}

function OnGotProperties(properties) {
    if (properties.length == 0)
        return;

    for (var i = 0; i < properties.length; ++i) {
        if (showPlayType != null && showSequence != null)
            break;

        if (properties[i].Property.Scope == Qube.XP.PropertyScope.Show) {
            if (showPlayType == null && properties[i].Property.ID.toLowerCase() == playTypeID.toLowerCase()) {
                $get('trPlayType').style.display = '';
                $get('trPlayType').style.visibility = 'visible';

                showPlayType = properties[i].Property;
                showPlayTypeValue = properties[i].Value;

                $find('playTypeExtnd').Select(showPlayTypeValue);
            }
            else if (showSequence == null && properties[i].Property.ID.toLowerCase() == sequenceTypeID.toLowerCase()) {
                $get('trSequenceType').style.visibility = 'visible';

                showSequence = properties[i].Property;
                showSequenceValue = properties[i].Value;

                $find('sequence_BID').get_element().value = showSequenceValue;
            }
        }
    }

    ResetSequenceTypeControl();
    ResetShowPlayTypeControl();
}

function ResetShowPlayTypeControl() {
    if ($get("trPlayType").style.visibility == "hidden") {
        $get("trPlayType").style.display = "none";
        return;
    }

    var playTypeExtnd = $find('playTypeExtnd');
    playTypeExtnd._reset = true;
    playTypeExtnd.hover();
    playTypeExtnd = null;
}

function ResetSequenceTypeControl() {
    if ($get('trSequenceType').style.visibility == 'hidden') {
        $get('trSequenceType').style.display = 'none';
        return;
    }

    var sequence = $find('sequence_BID');
    var sequenceelt = sequence.get_element();
    var sequenceleft = sequenceelt.offsetWidth + 'px';
    var sequencetop = sequenceelt.offsetTop + 'px';
    sequence.add_currentChanged(SetProperties);

    sequence._bUp.style.left = sequenceleft;
    sequence._bDown.style.left = sequenceleft;
    sequence._bUp.style.top = sequencetop;
    sequence._bDown.style.top = (sequenceelt.offsetTop + sequence._bUp.offsetHeight) + 'px';
}

function IsShowEventsChanged(events) {
    if (showEvents == null || showEvents.length != events.length)
        return true;

    for (var i = 0; i < showEvents.length; ++i) {
        if (showEvents[i].ID.toLowerCase() != events[i].ID.toLowerCase())
            return true;
        else if (IsCueEventsChanged(showEvents[i].AutoEventInfo, events[i].AutoEventInfo))
            return true;
    }

    return false;
}

function IsCueEventsChanged(oldCues, currentCues) {
    if (oldCues == null && currentCues == null)
        return false;

    if (oldCues == null || currentCues == null || oldCues.length != currentCues.length)
        return true;

    var oldCue = null;
    var currCue = null;

    for (var i = 0; i < oldCues.length; ++i) {
        oldCue = oldCues[i];
        currCue = currentCues[i];
        if (oldCue.ID != currCue.ID || oldCue.Kind != currCue.Kind)
            return true;
    }

    return false;
}

function UpdateAutoEventsInfo(events) {
    var oldAutoEvent = null;
    var currAutoEvent = null;
    var img = null;

    for (var i = 0; i < showEvents.length; ++i) {
        if (showEvents[i].AutoEventInfo == undefined)
            continue;

        for (var j = 0; j < showEvents[i].AutoEventInfo.length; ++j) {
            oldAutoEvent = showEvents[i].AutoEventInfo[j];
            currAutoEvent = events[i].AutoEventInfo[j];

            if (oldAutoEvent.Offset != currAutoEvent.Offset ||
                oldAutoEvent.WaitDuration != currAutoEvent.WaitDuration) {
                img = $get(oldAutoEvent.ID);
                if (img != undefined) {
                    img.originalText = oldAutoEvent.Type.toUpperCase() == waitEvent ?
                                            UpdateWaitEventTooltip(currAutoEvent) :
                                            UpdateCueEventTooltip(currAutoEvent);
                }
            }
        }
    }

    oldAutoEvent = null;
    currAutoEvent = null;
    img = null;

    showEvents = events;
}

function UpdateWaitEventTooltip(event) {
    var tooltipText;
    if (event.Action != null && event.Action != "") {
        var trigger;
        if (event.Action.toLowerCase() == "start-preshow")
            trigger = DisplayTextResource.triggerStartPreShow;
        else if (event.Action.toLowerCase() == "startfeature")
            trigger = DisplayTextResource.triggerStartFeature;
        else
            trigger = DisplayTextResource.triggerContinue;

        tooltipText = DisplayTextResource.waitForExtTrigger + '(' + trigger + ')';
    }
    else if ((event.WaitDuration != null && event.WaitDuration != "") || event.WaitDuration == 0)
        tooltipText = DisplayTextResource.waitForDuration + '(' + Convert2HMSF(event.WaitDuration) + ')';
    else
        tooltipText = DisplayTextResource.waitForPanelKey;

    return tooltipText + ', ' + DisplayTextResource.offset + '(' +
                            (event.Kind == "START" ? '+' : '-') +
                            Convert2HMSF(event.Offset) + ')';
}

function UpdateCueEventTooltip(event) {
    var obj = document.getElementById(event.Action);
    var displayName;

    if (obj == undefined || obj == null)
        displayName = event.Action;
    else
        displayName = obj.displayName;

    return displayName + ', ' + DisplayTextResource.offset + '(' +
                        (event.Kind == "START" ? '+' : '-') +
	                    Convert2HMSF(event.Offset) + ')';
}

function ErrorMessageHandler() {
    $get("trValidationErrorFrame").style.display = $get("trValidationErrorFrame").style.display != "none" ?
                                                    "none" : "";
    $get("imgCollapsePanel").src = "res/Skins/".concat(skin, "/Common/", $get("imgCollapsePanel").src.indexOf("expand.jpg") > -1 ? "collapse.jpg" : "expand.jpg");
}


if (typeof (Qube.CueStatus) === 'undefined') {

    Qube.CueStatus = function() {
        throw Error.invalidOperation();
    }

    Qube.CueStatus.prototype = {
        Unknown: -1,
        Failed: 0,
        Success: 1,
        PartialSuccess: 2
    }

    Qube.CueStatus.registerEnum("Qube.CueStatus", true);

}

if (typeof (Qube.CueEventType) === 'undefined') {

    Qube.CueEventType = function() {
        throw Error.invalidOperation();
    }

    Qube.CueEventType.prototype = {
        Wait: 0,
        Cue: 1
    }

    Qube.CueEventType.registerEnum("Qube.CueEventType", true);
}

if (typeof (Qube.PropertyScope) === 'undefined') {

    Qube.XP.PropertyScope = function() {
        throw Error.invalidOperation();
    }

    Qube.XP.PropertyScope.prototype = {
        Global: 0,
        Show: 1
    }

    Qube.XP.PropertyScope.registerEnum("Qube.XP.PropertyScope", true);

}