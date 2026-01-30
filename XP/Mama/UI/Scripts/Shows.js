var dragElement; // needs to be passed from OnMouseDown to OnMouseMove 
var oldZIndex = 0; // we temporarily increase the z-index during drag 

var selectedShow = null;
var newShowFlag = true;

var playTitleEvent = "89E4DD82-09CB-4778-A440-181C179EB0C8";
var callPlayListEvent = "3AAB0056-0402-420F-AD5F-2E611D626F31";

var waitEvent = "E39F6289-95B3-4B80-B798-D16F31FC2E0A";
var cueEvent = "F159D87D-0B12-4770-89A2-F427222F04C4";

var featureType = "F077E40F-BCA6-4502-94E7-61E3F55D8022";
var trailerType = "CE482168-6B26-4401-A363-7CB43C901350";
var adType = "0A3C0D0C-43BA-4EBD-AE53-7E0393ACD1C1";
var shortType = "1A6FA61B-CA56-497F-8490-A083A6E7779E";
var policyType = "7161954B-22AB-4952-9247-419A628B908F";
var PSAType = "A53D4C44-869B-409E-9775-A3F7F122393A";
var ratingType = "D0042497-4AF4-4202-A2EF-C2C6AFA696C7";
var testType = "3928527D-C741-4198-A960-CD6E2FACAE47";
var transitionalType = "E104E24A-6E77-44F5-9E90-D2E9E437488C";
var teaserType = "70A1BA0B-3641-419E-83AB-91E4A6284B40";

var dragging = false;

var source = null;
var sourceElement = null;

var eventDragging = false;
var eventSourceElement = null;

var eventID = 0;

var show = null;
var titleId = null;

var isEventDrag = false;
var autoEventsCount = 0;

var event2SetParam = null;
var firstEvent = null;

var _atmosCpls = [];
var _preShowCallplaylistIds = [];
var _intervalCallplaylistIds = [];
var _callplaylists = [];
var _isQcnBuild = false;

var MAX_TRANSITION_MASK_EVENT_DURATION = 11; //in sec

SetStyle();

Sys.Application.add_load(Page_Load);
Sys.Application.add_unload(Page_Unoad);

function Page_Load() {
    PageMethods.GetQcnShowTemplates(function(template) {
        _preShowCallplaylistIds = template.PreShowCallplaylistIds;
        _intervalCallplaylistIds = template.IntervalCallplaylistIds;
        _isQcnBuild = (_preShowCallplaylistIds.length > 0 || _intervalCallplaylistIds.length > 0);
    }, function(error) { _isQcnBuild = true; });

    shows_SetText();
    document.onclick = onOffsetEvent;
    DisableDelete(true);

    $find(compositionType).get_tabs()[5]._hide();

    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("offSet_BID").get_element());
    wrapper.set_Value("00:00:00:000");

    $find('filterShowName').add_filtered(OnInvalidChar);
    $addHandler($find('filterShowName').get_element(), "keydown", ProcessKey);
}

function Page_Unoad() {
    $find('filterShowName').remove_filtered(OnInvalidChar);
    $removeHandler($find('filterShowName').get_element(), "keydown", ProcessKey);
}

function EnableCallPlaylistTab(result) {
    if (result != null && result.length > 0) {
        _callplaylists = result;
        $find(compositionType).get_tabs()[5]._show();

        if (_isQcnBuild) {
            NewShow();
        }
    }
    else
        $find(compositionType).get_tabs()[5]._hide();
}

setTimeout("Initialize()", 1000);

function Initialize() {

    $get("divShowHandler").style.display = "";

    $find('triggerEvntextnd').HideFrame();
    $find('triggerEvntextnd').set_ellipsetrim(false);

    Qube.Mama.Catalog.GetCallPlayLists(EnableCallPlaylistTab, OnErrorDummy);

    $find(compositionType).get_tabs()[0].isClicked = true;

    PageMethods.GetAtmosCpls(function(atmosCpls) {
        _atmosCpls = atmosCpls;
        Qube.Mama.Catalog.GetTitles(featureType, OnGotTitles, OnError);
    });

    var extender = $find('showextnd');
    extender._reset = true;
    extender.hover();
    extender.Loading();

    Qube.Mama.Catalog.GetAllShows(true, false, OnGotShows, OnErrorDummy);
    Qube.Mama.Dalapathi.GetCueList(OnGotCueList, OnErrorDummy);
}

function OnGotCueList(result) {
    if (result.length == 0 || result.length == undefined)
        return;

    var cueList = $get("tbCueList");

    for (var i = 0; i < result.length; ++i) {
        var tr = document.createElement("tr");
        var td = document.createElement("td");

        td.width = '25px';

        var img = document.createElement("img");
        img.id = result[i].ID;
        img.displayName = result[i].DisplayName;
        img.className = "drag";
        img.src = "res/Skins/" + skin + "/Common/Add Icon.gif";
        img.name = "cue"
        td.appendChild(img);
        tr.appendChild(td);

        var td = document.createElement("td");
        var label = document.createElement("span");
        label.style.color = 'black';
        label.style.paddingTop = '5px';
        label.style.margin = '0px';
        label.innerHTML = result[i].DisplayName;
        td.appendChild(label);
        tr.appendChild(td);

        cueList.appendChild(tr);
    }
}

function SetStyle() {
    document.getElementById("showsMenu").className = "MenuFocus";
    var body = document["body"];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Shows/Shows.jpg)";
}

function OnGotShows(result) {
    $find('showextnd').set_clientFunction(showSelected);
    $find('showextnd').Generate(result);
}

function showSelected(e) {
    newShowFlag = false;
    firstEvent = null;

    var shows = e.target;

    EnableControls('saveShow', 'saveShowDisabled');
    DisableDelete(false);

    if ($find('showextnd').selectedValue() == '') {
        $find('filterShowName').get_element().value = "";
        RemoveChildNodes("timeline");

        autoEventsCount = 0;
        SetTexttoControl("showDuration", "00:00:00");
    }
    else {
        selectedShow = $find('showextnd').selectedValue();

        if (selectedShow != undefined) {
            ChangeDefaultToWait(DisplayTextResource.loading + '...');

            var showName = $find('showextnd').selectedText();

            $find('filterShowName').get_element().value = showName.length > 100 ?
                showName.substr(0, 100) : showName;

            Qube.Mama.Catalog.GetAllShowEvents(selectedShow, false, OnGotShowEvents, OnGotShowEventError);
        }
    }
}

function OnGotShowEventError(result) {
    eventID = 0;
    RemoveChildNodes("timeline");
    SetShowDuration();
    ChangeWaitToDefault();
}

function OnGotShowEvents(result) {
    eventID = 0;
    RemoveChildNodes("timeline");

    CreateEvents(result);
    SetShowDuration();

    ChangeWaitToDefault();
}

function CalculateWidth(noOfEvents) {
    // subtract 4 for the border line
    var eventsBarWidth = document.getElementById("timeline").offsetWidth - 4;

    return eventsBarWidth / (noOfEvents - autoEventsCount);
}

function CreateEvents(result) {
    autoEventsCount = 0;
    if (result == null || result.length == 0)
        return;

    var titles = new Array();

    for (var i = 0; i < result.length; i++) {
        var evnt;

        if (result[i].Type.toUpperCase() == playTitleEvent) {
            var playTitleEventInfo = CreatePlayTitleEventInfo(result[i].Title, result[i].ID.toUpperCase());
            evnt = CreatePlayTitleEvent(playTitleEventInfo, result[i].Title);

            if (firstEvent == null)
                firstEvent = evnt.id;

            Array.add(titles, { ID: result[i].ID, Duration: result[i].Title.Duration });
        }
        else if (result[i].Type.toUpperCase() == callPlayListEvent) {
            var callPlayListEventInfo = CreateCallPlayListEventInfo(result[i].Playlist, result[i].ID.toUpperCase());
            var colorClass = _GetCallplaylistColor(result[i].Playlist.ID);
            evnt = CreateCallPlayListEvent(callPlayListEventInfo, result[i].Playlist, colorClass, result[i].Name, result[i].Duration);

            if (firstEvent == null)
                firstEvent = evnt.id;
        }
        else if (result[i].Type.toUpperCase() == waitEvent) {
            evnt = CreateWaitEvent(result[i]);
            evnt.isInsideEvent = false;
            evnt.ParentDuration = GetParentDuration(result[i].Parent, titles);
        }
        else if (result[i].Type.toUpperCase() == cueEvent) {
            evnt = CreateCueEvent(result[i]);
        }

        document.getElementById("timeline").appendChild(evnt);
    }

    titles = null;

    AdjustEventPosition();
}

function _GetCallplaylistColor(callPlaylistId) {
    return _TemplateContainsCallplaylist(_intervalCallplaylistIds, callPlaylistId) ? "callplaylist-interval" : "callplaylist";
}

function GetParentDuration(parentId, array) {
    for (var i = 0; i < array.length; ++i) {
        if (array[i].ID == parentId)
            return array[i].Duration;
    }
    return 0;
}

function EnableControls(ctrlToEnable, ctrlToDisable) {
    document.getElementById(ctrlToEnable).style.display = "block";
    document.getElementById(ctrlToDisable).style.display = "none";
}

function GetTitleType(type) {
    switch (type) {
        case featureType:
            return "feature";
        case trailerType:
            return "trailer";
        case adType:
            return "ad";
        case shortType:
            return "short";
        case policyType:
            return "policy";
        case teaserType:
            return "teaser";
        case testType:
            return "test"
        case transitionalType:
            return "transitional";
        case PSAType:
            return "PSA";
        case ratingType:
            return "rating";
        default:
            return "undefined";
    }
}

function GetColor(type) {
    switch (type) {
        case featureType:
            return "featureType";
        case trailerType:
            return "trailerType";
        case adType:
            return "adType";
        case shortType:
            return "shortType";
        default:
            return "otherType";
    }
}

function NewShow() {
    if (_isQcnBuild && _preShowCallplaylistIds.length == 0 && _intervalCallplaylistIds.length == 0) {
        ShowPopup("playlist(s) missing", "res/Skins/".concat(skin, "/Common/Error.gif"),
                      "Either one or both template file is corrupted or empty", null);
        return false;
    }

    eventID = 0;
    newShowFlag = true;
    autoEventsCount = 0;
    selectedShow = null;
    firstEvent = null;

    $find('filterShowName').get_element().value = "";
    RemoveChildNodes("timeline");

    SetTexttoControl("showDuration", "00:00:00");
    $find('showextnd').Select('');
    EnableControls('saveShowDisabled', 'saveShow');
    DisableDelete(true);

    return _CreateShowTemplate();
}

function _CreateShowTemplate() {

    var timeline = $get("timeline");

    var getCallplaylistInfo = function(id) {
        for (var i = 0; i < _callplaylists.length; i++) {
            if (_callplaylists[i].ID == id) {
                return _callplaylists[i];
            }
        }
        return null;
    }

    var createCallplaylistEvent = function(id, colorClass) {

        var info = getCallplaylistInfo(id);

        if (info == null) {
            return false;
        }

        var callPlaylistEventInfo = CreateCallPlayListEventInfo(info);
        var evnt = CreateCallPlayListEvent(callPlaylistEventInfo, info, colorClass);

        if (firstEvent == null)
            firstEvent = evnt.id;

        timeline.appendChild(evnt);

        return true;
    }

    for (var i = 0; i < _preShowCallplaylistIds.length; i++) {
        if (!createCallplaylistEvent(_preShowCallplaylistIds[i], "callplaylist")) {
            RemoveChildNodes("timeline");
            ShowPopup("invalid show template", "res/Skins/".concat(skin, "/Common/Error.gif"),
                      "Can not create show as playlist " + _preShowCallplaylistIds[i] + " not found", null);
            return false;
        }
    }

    for (var i = 0; i < _intervalCallplaylistIds.length; i++) {
        if (!createCallplaylistEvent(_intervalCallplaylistIds[i], "callplaylist-interval")) {
            RemoveChildNodes("timeline");
            ShowPopup("invalid show template", "res/Skins/".concat(skin, "/Common/Error.gif"),
                      "Can not create show as playlist " + _intervalCallplaylistIds[i] + " not found", null);
            return false;
        }
    }

    AdjustEventPosition();
    return true;
}

function OnGotCallPlayListsError(result) {
    $find(compositionType).get_tabs()[5].isLoaded = true;
    DisableTitleProgress(5);
}

function OnGotCallPlayLists(result) {
    $find(compositionType).get_tabs()[5].isLoaded = true;

    if (result == null || result.length == 0) {
        DisableTitleProgress(5);
        return;
    }

    for (var i = 0; i < result.length; ++i) {
        var tr = document.createElement("tr");

        if (i % 2 == 0)
            tr.className = "titleRowBlue rowEven";
        else
            tr.className = "titleRow rowOdd";

        var td = document.createElement("td");
        td.style.width = '10px';
        var img = document.createElement("img");
        img.className = "drag";
        img.src = "res/Skins/" + skin + "/Common/Add Icon.gif";
        img.name = 'playlist';

        td.appendChild(img);
        tr.appendChild(td);

        var titleName = document.createElement("td");
        titleName.className = "compositionName";
        titleName.style.width = "100%";
        SetTexttoControl(titleName, result[i].Name);
        tr.appendChild(titleName);

        tr.playlistInfo = result[i];
        $addHandler(tr, "dblclick", Title_dblclick);

        $get("callplayList").appendChild(tr);

        //make proper alignment for firefox
        $get("tblplaylist").style.display = 'none';
        $get("tblplaylist").style.display = 'block';
    }

    DisableTitleProgress(5);
}

function OnGotTitles(result) {
    var tabIndex = FindTabByTitleType(result[0].Type.toUpperCase());
    $find(compositionType).get_tabs()[tabIndex].isLoaded = true;

    if (result[0].Name == null) {
        DisableTitleProgress(tabIndex);
        return;
    }

    var titleType = GetTitleType(result[0].Type.toUpperCase());
    var titleList = $get("tb" + titleType) === null ? $get("tbother") : $get("tb" + titleType);

    for (var i = 0; i < result.length; ++i) {
        var tr = document.createElement("tr");

        if (i % 2 == 0)
            tr.className = "titleRowBlue rowEven";
        else
            tr.className = "titleRow rowOdd";

        var td = document.createElement("td");
        var img = document.createElement("img");
        img.className = "drag";
        img.src = "res/Skins/" + skin + "/Common/Add Icon.gif";
        img.name = "title"
        td.appendChild(img);
        td.style.width = '10px';
        tr.appendChild(td);

        var titleName = document.createElement("td");
        titleName.className = "compositionName";

        var titlename = result[i].Name;
        if (titlename.length > 30) {
            titleName.title = titlename;
            titlename = titlename.substr(0, 30) + "...";
        }

        SetTexttoControl(titleName, titlename);
        tr.appendChild(titleName);

        var tdEncrypted = document.createElement("td");
        tdEncrypted.style.width = "16px";

        if (result[i].IsEncrypted) {
            var imgEncrypt = document.createElement("img");
            if (result[i].HasKey)
                imgEncrypt.src = "res/Skins/" + skin + "/Common/lockGreen16X16.jpg";
            else
                imgEncrypt.src = "res/Skins/" + skin + "/Common/lockRed16X16.jpg";
            tdEncrypted.appendChild(imgEncrypt);
        }

        tr.appendChild(tdEncrypted);

        var stereoscopic = document.createElement("td");
        stereoscopic.className = "titleInfoStyle";

        var pictureFormat = result[i].IsStereoscopic ? "3D" : "2D";

        if (result[i].HasSubtitle)
            pictureFormat += ",S";

        pictureFormat += ","

        var pFormat = null;
        var aFormat = null;

        var mediaFormat = result[i].MediaFormat;

        pFormat = mediaFormat.PictureFormatDescription.toLowerCase();

        aFormat = mediaFormat.AudioFormatDescription;

        pictureFormat += pFormat == 'undefined' ? "other" : pFormat;

        SetTexttoControl(stereoscopic, pictureFormat);
        tr.appendChild(stereoscopic);

        if (Array.contains(_atmosCpls, result[i].ID)) {
            aFormat += ", atmos";
        }

        var audioFormat = document.createElement("td");
        audioFormat.className = "titleInfoStyle";
        SetTexttoControl(audioFormat, aFormat == null ? "" : aFormat);
        tr.appendChild(audioFormat);

        var ratings = document.createElement("td");
        ratings.className = "titleInfoStyle";
        ratings.style.whiteSpace = "normal";
        var ratingValue = result[i].Ratings;

        if (ratingValue.length > 0)
            ratingValue = ratingValue.substr(0, ratingValue.length - 1);

        SetTexttoControl(ratings, GetFormatText(ratingValue, 100, "titleInfoStlye"));
        tr.appendChild(ratings);

        var aspect = document.createElement("td");
        aspect.className = "titleInfoStyle";
        SetTexttoControl(aspect, result[i].Aspect);
        tr.appendChild(aspect);

        var duration = document.createElement("td");
        duration.className = "titleInfoStyle";
        SetTexttoControl(duration, result[i].HMS);
        duration.style.paddingRight = '18px';
        tr.appendChild(duration);


        tr.titleInfo = result[i];
        $addHandler(tr, "dblclick", Title_dblclick);

        titleList.appendChild(tr);

        //make proper alignment for firefox
        titleList.style.display = 'none';
        titleList.style.display = 'block';

    }

    DisableTitleProgress(tabIndex);
}

function Title_dblclick(e) {
    var target = e.target;
    while ((target = target.parentNode).tagName != "TR");
    var evnt = SourceEvent(target);
    InsertEvent(evnt, null);
}

function Dropped(target, e) {
    if (e == null)
        e = window.event;

    if (dragging) {
        if (target == undefined || sourceElement == null) {
            dragging = false;
            return;
        }


        if ((target.tagName && target.tagName.toLowerCase()) == 'h1')
            target = target.parentNode;

        if ((target.tagName && target.tagName.toLowerCase()) == 'img')
            target = target.parentNode;

        if ((target.titleInfo == null || target.titleInfo.Duration == null) &&
            (sourceElement.name == 'wait' || sourceElement.name == 'cue')) {
            dragging = false;
            ShowPopup("invalid target event", "res/Skins/".concat(skin, "/Common/Warning.gif"), "Not able to place the cue event over the call playlist event", null);
            return;
        }

        var timeline = document.getElementById("timeline");
        var evnt = null;

        if (target == null || (target.eventInfo && target.eventInfo.Type == callPlayListEvent
                                    && (sourceElement.name == 'wait' || sourceElement.name == 'cue')))
            return;

        if (sourceElement.name == 'wait') {
            var waitEventInfo = CreateWaitEventInfo(waitEvent, sourceElement.id);
            evnt = CreateWaitEvent(waitEventInfo);
        }
        else if (sourceElement.name == 'cue') {
            var cueEventInfo = CreateCueEventInfo(cueEvent, sourceElement.id);
            evnt = CreateCueEvent(cueEventInfo);
        }
        else
            evnt = SourceEvent(sourceElement);

        if (evnt != null)
            InsertEvent(evnt, target, e.clientX);

        dragging = false;
    }
}

function SourceEvent(srcElement) {
    var evnt = null;
    var titleInfo = srcElement.titleInfo;
    if (titleInfo != null) {
        var playTitleEventInfo = CreatePlayTitleEventInfo(titleInfo);
        evnt = CreatePlayTitleEvent(playTitleEventInfo, titleInfo);
    }

    var playlistInfo = srcElement.playlistInfo;
    if (playlistInfo != null) {
        var callPlaylistEventInfo = CreateCallPlayListEventInfo(playlistInfo);
        var colorClass = _GetCallplaylistColor(playlistInfo.ID);
        evnt = CreateCallPlayListEvent(callPlaylistEventInfo, playlistInfo, colorClass);
    }
    return evnt
}

function AdjustEventPosition() {
    var timeline = document.getElementById("timeline");

    if (timeline.childNodes == null)
        return;

    var eventWidth = CalculateWidth(timeline.childNodes.length);

    var left = 0; var lastTitlePos = 0; var leftAutoEvents = 0; var rightAutoEvents = 0;
    for (var i = 0; i < timeline.childNodes.length; ++i) {
        if (timeline.childNodes[i].AutoEventInfo != null) {
            timeline.childNodes[i].style.width = '18px';

            if (timeline.childNodes[i].AutoEventInfo.Kind == 'START') {
                timeline.childNodes[i].style.left = ((leftAutoEvents * 18) + lastTitlePos) + 'px';
                ++leftAutoEvents;
            }
            else {
                timeline.childNodes[i].style.left = (lastTitlePos + (eventWidth + 2) - ((rightAutoEvents + 1) * 18)) + 'px';
                ++rightAutoEvents;
            }
        }
        else {
            timeline.childNodes[i].style.left = left + 'px';
            timeline.childNodes[i].style.width = eventWidth + 'px';

            var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("offSet_BID").get_element());
            wrapper.set_Value('00:00:00:000');

            lastTitlePos = left;
            left += eventWidth;
            leftAutoEvents = rightAutoEvents = 0;
        }
    }
    SetShowDuration();
}

function CreateWaitEventInfo(type, action) {
    var waitEventInfo = new Qube.Mama.WaitEventInfo();
    waitEventInfo.Type = type;
    waitEventInfo.Action = action;

    waitEventInfo.Offset = '00:00:00:000';
    waitEventInfo.Kind = 'START';
    waitEventInfo.Parent = '00000000-0000-0000-0000-000000000000';

    if (action == 'wait for duration')
        waitEventInfo.WaitDuration = '00:00:00:000';
    else if (action == 'wait for ext trigger')
        waitEventInfo.Trigger = 'CONTINUE';

    return waitEventInfo;
}

function CreateCueEventInfo(type, action) {
    var cueEventInfo = new Qube.Mama.CueEventInfo();
    cueEventInfo.Type = type;
    cueEventInfo.Action = action;

    cueEventInfo.Offset = '00:00:00:000';
    cueEventInfo.Kind = 'START';
    cueEventInfo.Parent = '00000000-0000-0000-0000-000000000000';

    return cueEventInfo;
}

function CreatePlayTitleEventInfo(titleInfo, id) {
    var playTitleEventInfo = new Qube.Contracts.EventInfo();

    if (typeof (id) == 'undefined')
        id = GenerateGuid();

    playTitleEventInfo.ID = id;
    playTitleEventInfo.Type = playTitleEvent;
    playTitleEventInfo.ContentID = titleInfo.ID;

    return playTitleEventInfo;
}

function GenerateGuid() {
    var result, i, j;
    result = '';

    for (j = 0; j < 32; j++) {
        if (j == 8 || j == 12 || j == 16 || j == 20)
            result = result + '-';

        i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
        result = result + i;
    }

    return result
}

function CreateCallPlayListEventInfo(callPlayListInfo, id) {
    var callPlayListEventInfo = new Qube.Contracts.EventInfo();

    if (typeof (id) == 'undefined')
        id = GenerateGuid();

    callPlayListEventInfo.ID = id;
    callPlayListEventInfo.Type = callPlayListEvent;
    callPlayListEventInfo.ContentID = callPlayListInfo.ID;

    return callPlayListEventInfo;
}

function CreateEvent(result) {
    var img = document.createElement("img");
    img.className = "drag";
    img.src = "res/Skins/" + skin + "/Common/Add Icon.gif";
    img.isShowEvent = true;
    img.name = 'event';
    img.style.left = '0px';
    img.style.top = '0px';
    img.style.position = 'absolute';

    var eventName = document.createElement("h1");
    eventName.className = "eventNameText";

    var eventType = document.createElement("h1");
    eventType.className = "eventTypeText";

    var spanElement = document.createElement("span");
    spanElement.id = "event" + eventID;
    spanElement.className = "timeLineEvent";
    spanElement.eventInfo = result;

    AttachEvent(spanElement, "mouseover", TooltipDisplayForEvent);
    AttachEvent(spanElement, "mouseout", TooltipHideForEvent);
    AttachEvent(spanElement, "mousemove", TooltipDisplayForEvent);

    spanElement.appendChild(eventType);
    spanElement.appendChild(eventName);
    spanElement.appendChild(img);

    eventID = eventID + 1;
    return spanElement;
}

function CreateWaitEvent(waitEventInfo) {
    var spanElement = document.createElement("span");
    spanElement.className = "waitEventImg";
    spanElement.AutoEventInfo = waitEventInfo;
    spanElement.name = 'event';
    spanElement.id = "event" + eventID;
    spanElement.style.zIndex = 20;

    var img = document.createElement("img");
    img.style.cursor = "pointer";
    img.style.top = '-18px';
    img.style.height = '22px';
    img.style.width = '17px';

    img.src = "res/Skins/" + skin + "/Common/cue_grey_pause.gif";

    var tooltipText;
    if (waitEventInfo.Action == 'wait for duration')
        tooltipText = DisplayTextResource.waitForDuration + '(' + waitEventInfo.WaitDuration + ')';
    else if (waitEventInfo.Action == 'wait for ext trigger')
        tooltipText = DisplayTextResource.waitForExtTrigger + '(' +
            $find('triggerEvntextnd').FindItem(waitEventInfo.Trigger).getAttribute("displayText") + ')';
    else
        tooltipText = DisplayTextResource.waitForPanelKey;

    img.originalText = DisplayTextResource.offset.concat('(', (waitEventInfo.Kind == "START" ? '+' : '-'),
                        waitEventInfo.Offset, '), ', tooltipText);

    AddTitle(img);

    ++autoEventsCount;
    AttachEvent(spanElement, "click", AutoEventClick);
    spanElement.appendChild(img);

    eventID = eventID + 1;

    return spanElement;
}

function CreateCueEvent(cueEventInfo) {
    var spanElement = document.createElement("span");
    spanElement.className = "cueEventImg";
    spanElement.AutoEventInfo = cueEventInfo;
    spanElement.name = 'event';
    spanElement.id = "event" + eventID;
    spanElement.style.zIndex = 20;

    var img = document.createElement("img");
    img.style.cursor = "pointer";
    img.style.top = '-18px';
    img.style.height = '22px';
    img.style.width = '17px';

    img.src = "res/Skins/" + skin + "/Common/cue_grey.gif";

    var obj = document.getElementById(cueEventInfo.Action);
    var displayName;

    if (obj == undefined || obj == null)
        displayName = cueEventInfo.Action;
    else
        displayName = obj.displayName;

    var plusORminus = cueEventInfo.Kind == "START" ? "+" : "-";
    img.originalText = displayName.concat('<BR />', DisplayTextResource.offset, ': ', plusORminus, cueEventInfo.Offset);

    AddTitle(img);

    ++autoEventsCount;
    AttachEvent(spanElement, "click", AutoEventClick);
    spanElement.appendChild(img);

    eventID = eventID + 1;

    return spanElement;
}

function CreatePlayTitleEvent(result, title) {
    var evnt = CreateEvent(result);

    SetTexttoControl(evnt.childNodes[0], GetTitleType(title.Type.toUpperCase()));
    SetTexttoControl(evnt.childNodes[1], title.Name + " (" + title.HMS + ")");

    evnt.className = "timeLineEvent " + GetColor(title.Type.toUpperCase());
    evnt.titleInfo = title;

    evnt.Name = title.Name;
    evnt.Duration = title.Duration;
    evnt.Aspect = title.Aspect;
    evnt.Format = title.MediaFormat.PictureFormatDescription;
    evnt.Stereoscopic = title.IsStereoscopic ? "3D" : "2D";

    return evnt;
}

function CreateCallPlayListEvent(result, playlist, colorClass, callPlaylistName, duration) {
    var evnt = CreateEvent(result);

    SetTexttoControl(evnt.childNodes[0], "playlist");

    var durationInHMS = duration == null ? "00:00:00" : Convert2HMS(duration);

    var eventText = playlist.Name;

    if (playlist.Alias != '00000000-0000-0000-0000-000000000000')
        eventText = callPlaylistName + " - " + playlist.Name;

    evnt.Name = eventText;
    evnt.Duration = duration;
    evnt.CallPlaylistId = playlist.ID;

    eventText += " (" + durationInHMS + ")";

    SetTexttoControl(evnt.childNodes[1], eventText);
    evnt.className = "timeLineEvent " + colorClass;

    return evnt;
}

function OnGotShowSaveResponse(result) {
    var showext = $find('showextnd');
    var showName = TrimStart($find('filterShowName').get_element().value, new Array('.', ' '));

    DisableDelete(false);
    if (showext.selectedValue() != '')
        showext.UpdateText(result, showName);
    else {
        var list = new DropDownItem()
        list.ID = result;
        list.Name = showName
        var arrList = new Array();
        arrList[0] = list;
        showext.Append(arrList);
    }

    $find('filterShowName').get_element().value = showName;
    showext.Select(result);
    selectedShow = result;
    ClearCursor();
}

function IsShowInUse() {
    if ($find("showextnd").selectedValue() == "" || $find("showextnd").selectedValue() == "0") {
        SaveShow();
        return;
    }

    ChangeDefaultToWait(DisplayTextResource.saving + '...');

    Qube.Mama.Dalapathi.IsShowInUse($find("showextnd").selectedValue(), onShowSave, OnError);
}

function onShowSave(result) {
    if (result) {
        ClearCursor();
        ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", DisplayTextResource.unableToSaveLoadedPlaylist, null);
    }
    else
        SaveShow();
}

function SaveShow() {
    ChangeDefaultToWait(DisplayTextResource.saving + '...');

    if (!_ValidateShowTemplate()) {
        pi.Hide();
        ShowPopup("invalid show format", "res/Skins/".concat(skin, "/Common/Error.gif"), "Show format is not supported", null);
        return;
    }

    var showName = TrimString($find('filterShowName').get_element().value);

    var timeline = document.getElementById("timeline");

    var eventCollection = new Array(timeline.childNodes.length);

    for (var i = 0; i < timeline.childNodes.length; ++i) {
        if (timeline.childNodes[i].AutoEventInfo != null) {
            eventCollection[i] = timeline.childNodes[i].AutoEventInfo;

            if (typeof (timeline.childNodes[i].AutoEventInfo.WaitDuration) != 'undefined')
                eventCollection[i].DurationInHMS = timeline.childNodes[i].AutoEventInfo.WaitDuration;
        }
        else if (timeline.childNodes[i].CueEventInfo != null)
            eventCollection[i] = timeline.childNodes[i].AutoEventInfo;
        else
            eventCollection[i] = timeline.childNodes[i].eventInfo;
    }

    if (newShowFlag || (selectedShow == null))
        Qube.Mama.Catalog.SaveShow(showName, null, eventCollection, OnGotShowSaveResponse, OnError);
    else
        Qube.Mama.Catalog.SaveShow(showName, selectedShow, eventCollection, OnGotShowSaveResponse, OnError);

    newShowFlag = false;
}

function Save() {
    if ($get('saveShow').style.display == 'none')
        return false;

    IsShowInUse();

    return false;
}

function SetShowDuration() {
    var timeline = document.getElementById("timeline");
    var eventCollection = new Array(timeline.childNodes.length);

    var showDuration = 0;

    for (var i = 0; i < timeline.childNodes.length; ++i) {
        if (timeline.childNodes[i].titleInfo != null && timeline.childNodes[i].titleInfo.Duration != null)
            showDuration += timeline.childNodes[i].titleInfo.Duration;
    }

    SetTexttoControl("showDuration", Convert2HMS(showDuration));
}

function Convert2HMS(seconds) {
    if (seconds == null)
        return '00:00:00';

    var hms = new Array(3);
    seconds = parseInt(seconds, 10);

    hms[0] = parseInt(seconds / 3600, 10);
    seconds %= 3600;

    hms[1] = parseInt(seconds / 60, 10);
    seconds %= 60;

    hms[2] = parseInt(seconds, 10);

    var HMSString = "";
    for (var i = 0; i < 3; i++) {
        if (hms[i] < 10)
            HMSString += "0"

        HMSString += hms[i];

        if (i != 2)
            HMSString += ":";
    }
    return HMSString;
}

function ShowPopup(title, iconImgPath, text, okScript) {
    ConfirmationWindow(title, text, iconImgPath, okScript, null);
}

function ConfirmShowDeletion() {
    if ($find("showextnd").selectedValue() == "" || $find("showextnd").selectedValue() == "0")
        return;

    Qube.Mama.Dalapathi.IsShowInUse($find("showextnd").selectedValue(), OnShowDelete, OnError);
}

function OnShowDelete(result) {
    if (result)
        ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", "Can not delete loaded show.", null);
    else if ($find("showextnd").selectedValue() == '' || $find("showextnd").selectedValue() == '0')
        ShowPopup(DisplayTextResource.deleteShow, "res/Skins/" + skin + "/Common/Information.gif", DisplayTextResource.showDeleteRequest, null);
    else if (selectedShow != undefined || result == false)
        ShowPopup(DisplayTextResource.deleteConfirmation, "res/Skins/" + skin + "/Common/Warning.gif", DisplayTextResource.showDeleteConfirmationMessage, "DeleteShow()");
}

function DeleteShow() {
    ChangeDefaultToWait(DisplayTextResource.deleting + '...');
    var showToDelete = selectedShow;

    newShowFlag = true;
    selectedShow = null;
    RemoveChildNodes("timeline");
    autoEventsCount = 0;
    $find('filterShowName').get_element().value = "";
    SetTexttoControl("showDuration", "00:00:00");
    DisableDelete(true);
    var showext = $find('showextnd');
    showext.Remove(showext.selectedValue());
    showext.Select('');
    EnableControls('saveShowDisabled', 'saveShow');

    Qube.Mama.Usher.DeleteShow(showToDelete, OnGotShowDeleteResponse, OnError);
}

function OnGotShowDeleteResponse(result) {
    ClearCursor();
}

function Cancel() {
    $find('filterShowName').get_element().value = "";
    SetTexttoControl("showDuration", "00:00:00");

    autoEventsCount = 0;

    var timeline = $get("timeline");
    var timelineLength = timeline.childNodes.length;
    for (var i = 0; i < timelineLength; i++)
        timeline.removeChild(timeline.childNodes[0]);

    $find('showextnd').Select('');
    DisableDelete(true);
    EnableControls('saveShowDisabled', 'saveShow');

    selectedShow = null
    firstEvent = null;
    return false;
}

function RemoveEvent(item) {
    var parentNode = item.parentNode
    var nextEvent = item.nextSibling;

    if (item.id == firstEvent)
        firstEvent = null;

    parentNode.removeChild(item);

    if (item.AutoEventInfo == null) {
        item = nextEvent;
        while (item != null && item.AutoEventInfo != null) {
            nextEvent = item.nextSibling;
            parentNode.removeChild(item);

            item = nextEvent;
            --autoEventsCount;
        }
    }

    if (item != null && item.AutoEventInfo != null)
        --autoEventsCount;
    else if (item != null && firstEvent == null)
        firstEvent = item.id;

    AdjustEventPosition();
}

function ClearCursor() {
    ChangeWaitToDefault();
}

function EventDropped(trgtEvent, isRemove, e) {
    if (e == null)
        e = window.event;

    if (eventDragging) {
        if (eventSourceElement != null) {
            var srcEvent = eventSourceElement;

            if (isRemove)
                RemoveEvent(eventSourceElement);
            else {
                if ((trgtEvent.titleInfo == null || trgtEvent.titleInfo.Duration == null) &&
                   srcEvent.AutoEventInfo != null) {
                    eventDragging = false;
                    ShowPopup("invalid target event", "res/Skins/".concat(skin, "/Common/Warning.gif"), "Not able to place the cue event over the call playlist event", null);
                    return;
                }
                InsertEvent(srcEvent, trgtEvent, e.clientX);
            }

            disableEvent();

            srcEvent = null;
        }
    }
    eventDragging = false;
}

function InsertEvent(source, target, droppedPosition) {
    if (source == null)
        return;

    var timeline = $get("timeline");

    if (timeline.childNodes.length == 0 && !NewShow()) {
        return;
    }

    var item = target;

    var docType = GetDocumentType();

    droppedPosition += docType.scrollLeft

    if (item && item.id != 'timeline') {
        if (source.AutoEventInfo != null) {
            if (target.eventInfo && target.eventInfo.Type == callPlayListEvent)
                return;

            var obj = FindPosition(item);

            previousKind = source.AutoEventInfo.Kind;

            if (droppedPosition < (obj.curleft + (item.offsetWidth / 2))) {
                if (source.AutoEventInfo.Parent.toLowerCase() == item.eventInfo.ID.toLowerCase()
                    && source.AutoEventInfo.Kind == "START")
                    return;

                source.AutoEventInfo.Kind = "START";

                if (source.className == 'waitEventImg')
                    source.childNodes[0].src = "res/Skins/" + skin + "/Common/cue_grey_pause.gif"
                else
                    source.childNodes[0].src = "res/Skins/" + skin + "/Common/cue_grey.gif"
            }
            else {
                if (source.AutoEventInfo.Parent.toLowerCase() == item.eventInfo.ID.toLowerCase()
                    && source.AutoEventInfo.Kind == "END")
                    return;

                source.AutoEventInfo.Kind = "END";

                if (source.className == 'waitEventImg')
                    source.childNodes[0].src = "res/Skins/" + skin + "/Common/cue_grey_pause.gif"
                else
                    source.childNodes[0].src = "res/Skins/" + skin + "/Common/cue_grey.gif"
            }

            if (source.AutoEventInfo.Parent.toLowerCase() !== item.eventInfo.ID.toLowerCase()
                || source.AutoEventInfo.Kind !== previousKind) {
                var offset = source.AutoEventInfo.Offset;

                var offsetSec = Convert2Seconds(offset);
                if (offsetSec > item.titleInfo.Duration) {
                    offset = Convert2HMSF(item.titleInfo.Duration);
                    source.AutoEventInfo.Offset = offset;
                }

                var alt = source.childNodes[0].originalText;
                var commaIndex = alt.indexOf(",");

                if (alt.indexOf('<BR />') == -1 && commaIndex >= 0) {
                    var text = DisplayTextResource.offset.concat('(', (source.AutoEventInfo.Kind == "START" ? '+' : '-'), offset, '), ', alt.substr(commaIndex + 1));
                    source.childNodes[0].originalText = text;
                }
                else {
                    var offsetIndex = alt.indexOf(DisplayTextResource.offset);
                    var plusORminus = source.AutoEventInfo.Kind == "START" ? "+" : "-";

                    var text = alt.substr(0, offsetIndex - 1).concat('<BR />', DisplayTextResource.offset, ': ', plusORminus, '(', offset, ') ');
                    source.childNodes[0].originalText = text;
                }
            }

            timeline.insertBefore(source, GetNextSibling(item));
            source.AutoEventInfo.Parent = item.eventInfo.ID;
            source.ParentDuration = item.titleInfo.Duration;
        }
        else {
            var obj = FindPosition(item);

            if (droppedPosition < (obj.curleft + (item.offsetWidth / 2)))
                target = item;
            else
                target = GetNextSibling(item);

            var nextEvent = source.nextSibling;
            timeline.insertBefore(source, target);

            if (target != null && target.id == firstEvent)
                firstEvent = source.id;

            if (eventDragging) {
                source = nextEvent;
                while (source != null && source.AutoEventInfo != null) {
                    nextEvent = source.nextSibling;
                    timeline.insertBefore(source, target);
                    source = nextEvent;
                }
            }
        }
    }
    else {
        timeline.insertBefore(source, null);
        firstEvent = source.id;
    }

    AdjustEventPosition();
}

function GetNextSibling(item) {
    while (item && item.nextSibling != null) {
        if (item.nextSibling.AutoEventInfo != null) {
            item = item.nextSibling;
            continue;
        }

        return item.nextSibling;
    }

    return null;
}

function TrimString(string2Trim) {
    string2Trim = string2Trim.replace(/^\s+/g, "");
    return string2Trim.replace(/\s+$/g, "");
}

function ChangeDefaultToWait(displayText) {
    pi.Show(displayText);
}

function ChangeWaitToDefault() {
    pi.Hide();
}

function WaitEventDragging(target) {
    dragging = true;
    sourceElement = target;
}

function CueEventDragging(target) {
    dragging = true;
    sourceElement = target;
}

function ShowEventDragging(target) {
    if (target.tagName == 'SPAN')
        eventSourceElement = target;
    else
        eventSourceElement = target.parentNode;

    eventDragging = true;
}

function TitleDragging(target) {
    dragging = true;
    sourceElement = target.parentNode.parentNode;
}

function PlaylistDragging(target) {
    dragging = true;
    sourceElement = target.parentNode.parentNode;
}

function AutoEventClick(e) {
    if (e == null)  // IE uses srcElement, others use target 
        e = window.event;

    var src = GetTargetElement(e);

    if (src == null)
        return;

    if (src.tagName == 'IMG')
        src = src.parentNode;

    event2SetParam = src;
    event2SetParam.ParentDuration = src.ParentDuration;

    $get("trTriggerEvnt").style.display = "none";
    $get("trDuration").style.display = "none";
    document.getElementById("hideParam").style.visibility = "hidden";

    $find("offSet_BID").get_element().disabled = false;
    document.getElementById("apply").disabled = false;

    if (src.AutoEventInfo != null) {
        $find('triggerEvntextnd').Select(src.AutoEventInfo.Trigger);

        var obj;
        var displayName;
        if (src.AutoEventInfo.Type == cueEvent.toLowerCase() || src.AutoEventInfo.Type == cueEvent)  // getting display name for cue events
        {
            obj = document.getElementById(src.AutoEventInfo.Action);

            if (obj == undefined || obj == null)
                displayName = src.AutoEventInfo.Action;
            else
                displayName = obj.displayName;
        }
        else
            displayName = src.AutoEventInfo.Action;

        SetTexttoControl("paramWintitle", GetTrimedText(displayName, 180, "title"));

        if (src.AutoEventInfo.Action == "wait for ext trigger") {
            SetTexttoControl("paramWintitle", GetTrimedText(DisplayTextResource.waitForExtTrigger, 180, "title"));

            $get("trDuration").style.display = "none";
            $get("trTriggerEvnt").style.display = "";
            document.getElementById("hideParam").style.visibility = "hidden";

            var ext = $find('triggerEvntextnd');
            ext._reset = true;
            ext.hover();
        }
        else if (src.AutoEventInfo.Action == "wait for duration") {
            SetTexttoControl("paramWintitle", GetTrimedText(DisplayTextResource.waitForDuration, 180, "title"));

            $get("trTriggerEvnt").style.display = "none";
            $get("trDuration").style.display = "";
            var wrapperDuration = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("Duration_BID").get_element());
            wrapperDuration.set_Value(src.AutoEventInfo.WaitDuration);
        }
        else if (src.AutoEventInfo.Action == "wait for panel key") {
            SetTexttoControl("paramWintitle", GetTrimedText(DisplayTextResource.waitForPanelKey, 180, "title"));
        }

        var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("offSet_BID").get_element());
        wrapper.set_Value(src.AutoEventInfo.Offset);
    }
}

function Convert2Seconds(hms) {
    var arr = hms.split(":", 4);
    return parseInt(arr[0], 10) * 3600 + parseInt(arr[1], 10) * 60 + parseInt(arr[2], 10) + parseFloat("0." + arr[3])
}

function OnParamSet(cntrl) {
    if (event2SetParam.AutoEventInfo != null) {
        var tooltipText = event2SetParam.AutoEventInfo.Action;

        if (event2SetParam.AutoEventInfo.Action == "wait for ext trigger") {
            var events = $find('triggerEvntextnd');

            event2SetParam.AutoEventInfo.Trigger = $find('triggerEvntextnd').selectedValue();
            tooltipText += '(' + $find('triggerEvntextnd').selectedText() + ')';
        }
        else if (event2SetParam.AutoEventInfo.Action == "wait for duration") {
            var wrapperDuration = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("Duration_BID").get_element());
            var duration = wrapperDuration.get_Value();
            event2SetParam.AutoEventInfo.WaitDuration = duration;

            tooltipText += '(' + duration + ')';
        }
        var second = event2SetParam.ParentDuration;

        var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("offSet_BID").get_element());
        var offset = wrapper.get_Value();
        var offsetsecond = Convert2Seconds(offset);

        if (second < offsetsecond) {
            ShowPopup(DisplayTextResource.invalidOffset, "res/Skins/" + skin + "/Common/Information.gif", DisplayTextResource.offsetInformationMessage, null);
            wrapper.set_Value("00:00:00:000");
            return false;
        }

        event2SetParam.AutoEventInfo.Offset = offset;

        var originalText = event2SetParam.childNodes[0].originalText;

        if (originalText.indexOf('<BR />') == -1 && originalText.indexOf(",") >= 0) {
            var text = DisplayTextResource.offset.concat('(', (event2SetParam.AutoEventInfo.Kind == "START" ? '+' : '-'),
                                                        offset, '), ', tooltipText);
            event2SetParam.childNodes[0].originalText = text;
        }
        else {
            var obj = document.getElementById(event2SetParam.AutoEventInfo.Action);

            if (obj == undefined || obj == null)
                tooltipText = event2SetParam.AutoEventInfo.Action;
            else
                tooltipText = obj.displayName;

            var plusORminus = event2SetParam.AutoEventInfo.Kind == "START" ? "+" : "-";
            event2SetParam.childNodes[0].originalText = tooltipText.concat('<BR />', DisplayTextResource.offset, ": ", plusORminus, offset);
        }
    }
}

function OnMouseDown(e) {
    if (e == null)  // IE uses srcElement, others use target 
        e = window.event;

    var code = e.keyCode || e.which;

    if (code == 17) //ctrl key
        return false;

    var target = GetTargetElement(e);

    if (target.parentNode.className == "cueEventImg" || target.parentNode.className == "waitEventImg")
        target = target.parentNode;

    sourceElement = null;
    dragging = false;
    isEventDrag = false;

    if (target.className == "drag" || target.className == "cueEventImg" || target.className == "waitEventImg") {
        switch (target.className) {
            case "drag":
                dragElement = document.getElementById("dragimg");
                break;
            case "cueEventImg":
                if (target.AutoEventInfo.Kind == "END")
                    dragElement = document.getElementById("dragCueEventRight");
                else
                    dragElement = document.getElementById("dragCueEventLeft");

                break;
            case "waitEventImg":
                if (target.AutoEventInfo.Kind == "END")
                    dragElement = document.getElementById("dragWaitEventRight");
                else
                    dragElement = document.getElementById("dragWaitEventLeft");

                break;
            default:
                return;
        }

        if (target.name == 'wait')
            WaitEventDragging(target);
        else if (target.name == 'cue')
            CueEventDragging(target);
        else if (target.name == 'event') {
            isEventDrag = true;
            ShowEventDragging(target);
        }
        else if (target.name == 'title')
            TitleDragging(target);
        else if (target.name == 'playlist')
            PlaylistDragging(target);

        dragElement.style.display = 'none';
        target = dragElement;

        if ((e.button == 1 && window.event != null) || e.button == 0) {
            oldZIndex = target.style.zIndex;
            target.style.zIndex = 10000;
            dragElement = target;
            document.onmousemove = OnMouseMove;
            document.body.focus();
        }
    }

    return (target.className != "dragelement" && target.className != "cueEventImg" && target.className != 'waitEventDrag');
}

function OnMouseMove(e) {
    dragElement.style.display = '';
    var tooltip = document.getElementById("tooltip");
    if (tooltip) tooltip.style.display = "none";

    if (e == null)
        e = window.event;

    var e = new Sys.UI.DomEvent(e);

    var docType = GetDocumentType();

    var clientBounds = CommonToolkitScripts.getClientBounds();
    var clientWidth = clientBounds.width + docType.scrollLeft;
    var clientHeight = clientBounds.height + docType.scrollTop;

    if ((e.clientX + docType.scrollLeft > clientWidth - 20) || (e.clientY + docType.scrollTop > clientHeight - 20)) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    dragElement.style.left = (e.clientX + docType.scrollLeft - 12) + 'px';
    dragElement.style.top = (e.clientY + docType.scrollTop - 8) + 'px';

    return (dragElement == null);
}

function OnMouseUp(e) {
    if (e == null)
        e = window.event;

    var code = e.keyCode || e.which;

    if (code == 17) //ctrl key
        return false;

    if (dragElement != null) {
        dragElement.style.zIndex = oldZIndex;
        document.onmousemove = null;

        oldZIndex = 0;
        dragElement.style.display = 'none';
        dragElement = null;

        if (document.getElementById("timeline").childNodes.length != 0 || (sourceElement.name != 'wait' && sourceElement.name != 'cue')) {
            var isRemove = false; var target = null;
            if (isEventDrag)
                isRemove = IsRemove(eventSourceElement, document.getElementById("timeline"), e.clientX, e.clientY);

            if (!isRemove)
                target = TargetNode(eventSourceElement, document.getElementById("timeline"), e.clientX, e.clientY);

            if (!isEventDrag) {
                if (target != null && target.AutoEventInfo == null)
                    Dropped(target, e);
            }
            else {
                if (isRemove || (target != null && target.AutoEventInfo == null))
                    EventDropped(target, isRemove, e);
            }
        }

        sourceElement = null;
        dragging = false;
    }

    return (dragElement == null);
}

function IsRemove(srcElement, parent, x, y) {
    var docType = GetDocumentType();

    x = x + docType.scrollLeft;
    y = y + docType.scrollTop;

    var top = parent.offsetTop;
    if (srcElement.AutoEventInfo != null)
        top = parent.offsetTop - 30;

    if ((parent.offsetLeft < x && (parent.offsetLeft + parent.offsetWidth) > x) &&
        (top < y && (parent.offsetTop + parent.offsetHeight) > y))
        return false;

    return true;
}

function TargetNode(srcElement, from, x, y) {
    var docType = GetDocumentType();

    x += docType.scrollLeft;
    y += docType.scrollTop;

    if (firstEvent == null && (from.offsetLeft <= x && (from.offsetLeft + from.offsetWidth) > x)
            && (from.offsetTop <= y && (from.offsetTop + from.offsetHeight) >= y))
        return from;

    x -= from.offsetLeft;

    if (srcElement != null && srcElement.AutoEventInfo != null
         && from.offsetTop > y && y > from.offsetTop - 30)
        y += 30;

    var eventCollection = new Array(from.childNodes.length);

    var j = 0;
    for (var i = 0; i < from.childNodes.length; i++) {
        if (from.childNodes[i].AutoEventInfo == null)
            eventCollection[j++] = from.childNodes[i];
    }

    for (var k = 0; k < eventCollection.length; k++) {
        var node = eventCollection[k];
        var nextnode = eventCollection[k + 1];

        if (node == null)
            break;

        if (nextnode != null && (node.offsetLeft <= x && nextnode.offsetLeft > x)
            && (from.offsetTop <= y && (from.offsetTop + node.offsetHeight) >= y))
            return node;
        else if (nextnode == null && (node.offsetLeft <= x
                && (from.offsetTop <= y && (from.offsetTop + node.offsetHeight) >= y)))
            return node;
    }

    return null;
}

Sys.Application.add_load(InitDragDrop);

function InitDragDrop() {
    document.onmousedown = OnMouseDown;
    document.onmouseup = OnMouseUp;
    if (Sys.Extended.UI.TabPanel) {
        Sys.Extended.UI.TabPanel.prototype.isClicked = false;
        Sys.Extended.UI.TabPanel.prototype.isLoaded = false;
    }
}

function ActiveTabChanged() {
    var activeTabIndex = $find(compositionType).get_activeTabIndex();
    var isClicked = $find(compositionType).get_activeTab().isClicked;
    var isLoaded = $find(compositionType).get_activeTab().isLoaded;

    $get("titleTypeProgress").style.display = isLoaded ? "none" : "";

    if (activeTabIndex == 0 && !isClicked) {
        Qube.Mama.Catalog.GetTitles(featureType, OnGotTitles, OnError);
    }
    else if (activeTabIndex == 1 && !isClicked) {
        Qube.Mama.Catalog.GetTitles(adType, OnGotTitles, OnError);
    }
    else if (activeTabIndex == 2 && !isClicked) {
        Qube.Mama.Catalog.GetTitles(trailerType, OnGotTitles, OnError);
    }
    else if (activeTabIndex == 3 && !isClicked) {
        Qube.Mama.Catalog.GetTitles(shortType, OnGotTitles, OnError);
    }
    else if (activeTabIndex == 4 && !isClicked) {
        Qube.Mama.Catalog.GetTitles("other", OnGotTitles, OnError);
    }
    else if (activeTabIndex == 5 && !isClicked) {
        Qube.Mama.Catalog.GetCallPlayLists(OnGotCallPlayLists, OnGotCallPlayListsError);
    }

    $find(compositionType).get_activeTab().isClicked = true;
}

function shows_SetText() {
    SetTexttoControl("chooseShowLabel", DisplayTextResource.Show + ":");
    SetTexttoControl("showDurationLabel", DisplayTextResource.showDuration);
    SetTexttoControl("showNameLabel", DisplayTextResource.saveShow + ":");
    SetTexttoControl("newshowTxt", DisplayTextResource.New);
    SetTexttoControl("deleteshowTxt", DisplayTextResource.deleteTxt);
    SetTexttoControl("spnDeleteShowDisabled", DisplayTextResource.deleteTxt);
    SetTexttoControl("saveshowTxt", DisplayTextResource.save);
    SetTexttoControl("spnSaveShowDisabled", DisplayTextResource.save);
    SetTexttoControl("cancelshowTxt", DisplayTextResource.cancel);
    SetTexttoControl("spnCancelShowDisabled", DisplayTextResource.cancel);
    SetTexttoControl("lblOffset", DisplayTextResource.offset);
    SetTexttoControl("lblwaitEvntDur", DisplayTextResource.duration);
    SetTexttoControl("lbltriggerEvnt", DisplayTextResource.action);
    SetTexttoControl("apply", DisplayTextResource.apply);
    SetTexttoControl("waitForPanelKey", DisplayTextResource.waitForPanelKey);
    SetTexttoControl("waitForDuration", DisplayTextResource.waitForDuration);
    SetTexttoControl("waitForExtTrigger", DisplayTextResource.waitForExtTrigger);
    SetTexttoControl("restrictedCharToolTip", '< > ? / \ : * | " # ' + DisplayTextResource.charNotAllowed);
    SetTexttoControl("titleTypeProgress", DisplayTextResource.loading + "...");

    SetTexttoControl("CONTINUE", DisplayTextResource.triggerContinue);
    SetTexttoControl("START-PRESHOW", DisplayTextResource.triggerStartPreShow);
    SetTexttoControl("STARTFEATURE", DisplayTextResource.triggerStartFeature);
    $get("CONTINUE").setAttribute("displayText", DisplayTextResource.triggerContinue);
    $get("START-PRESHOW").setAttribute("displayText", DisplayTextResource.triggerStartPreShow);
    $get("STARTFEATURE").setAttribute("displayText", DisplayTextResource.triggerStartFeature);
    $find("triggerEvntextnd").Select('CONTINUE');
}

function offsetTimeChanged(extender) {
    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find(extender).get_element());
    var valueOffset = wrapper.get_Value();

    var re = /_/g;
    var reg = /(^\d\d\:[0-5]\d:[0-5]\d:\d\d\d$)/;

    valueOffset = valueOffset.replace(re, '0');

    var offsets = valueOffset.split(':');

    if (offsets[2] > 59) {
        offsets[1] = parseInt(offsets[1], 10) + (parseInt(offsets[2], 10) - 59);
        offsets[2] = 59;
    }

    if (offsets[1] > 59) {
        offsets[0] = parseInt(offsets[0], 10) + (parseInt(offsets[1], 10) - 59);
        offsets[1] = 59;
    }

    if (offsets[0] > 99)
        offsets[0] = 99;

    valueOffset = offsets.join(':');

    wrapper.set_Value(valueOffset);
}

function splchar(evnt) {
    var e = new Sys.UI.DomEvent(evnt);

    if (e.altKey || e.ctrlKey)
        return false;
    else
        return true;
}

function ValidateShowEmpty(obj) {
    if (TrimStart(obj.value, new Array('.', ' ')) != '')
        EnableControls('saveShow', 'saveShowDisabled');
    else
        EnableControls('saveShowDisabled', 'saveShow');
}

function ProcessKey(e) {
    //190 & 110 both are keycode of "."    
    if ((e.keyCode == 190 || e.keyCode == 110 || e.keyCode == Sys.UI.Key.space) &&
            GetCursorPosition(e.target) == 0) {
        e.stopPropagation();
        e.preventDefault();
    }
}

function OnInvalidChar(obj, evntArgs) {
    if ($get("restrictedCharToolTip").style.display == 'none')
        ShowToolTip(true);
}

function ShowToolTip(isVisible) {
    if (isVisible) {
        $get("restrictedCharToolTip").style.display = '';
        setTimeout("ShowToolTip(false)", 2000);
    }
    else
        $get("restrictedCharToolTip").style.display = 'none';
}

function disableEvent() {
    SetTexttoControl("paramWintitle", "");

    $get("trDuration").style.display = "none";
    $get("trTriggerEvnt").style.display = "none";

    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("offSet_BID").get_element());
    wrapper.set_Value("00:00:00:000");

    $find("offSet_BID").get_element().disabled = true;
    document.getElementById("apply").disabled = true;
    document.getElementById("hideParam").style.visibility = "visible";
}

function onOffsetEvent(e) {
    if (e == null)  // IE uses srcElement, others use target 
        e = window.event;

    var src = GetTargetElement(e);

    if (src == null)
        return;

    var panel = FindPosition($get("divapp"));

    var docType = GetDocumentType();

    var X = e.clientX + docType.scrollLeft;
    var Y = e.clientY + docType.scrollTop

    if (src.parentNode && src.parentNode.AutoEventInfo === undefined)
        if (!((X >= panel.curleft && Y >= panel.curtop &&
            X <= (panel.curleft + panel.width) && Y <= (panel.curtop + panel.height))
            || src.parentNode.id == $find("triggerEvntextnd").get_dropDownControl().id)
          ) {
        disableEvent();
    }
}

function DisableDelete(isDisable) {
    if (isDisable) {
        $get("deleteShowDisabled").style.display = "block";
        $get("deleteShow").style.display = "none";
    }
    else {
        $get("deleteShowDisabled").style.display = "none";
        $get("deleteShow").style.display = "block";
    }
}

function FindTabByTitleType(titleType) {
    switch (titleType) {
        case featureType:
            return 0;
        case adType:
            return 1;
        case trailerType:
            return 2;
        case shortType:
            return 3;
        default:
            return 4;
    }
}

function DisableTitleProgress(tabIndex) {
    if (tabIndex == $find(compositionType).get_activeTabIndex())
        $get("titleTypeProgress").style.display = "none";
}

function OnError(result) {
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

var _isEncFeature = function(showEvent) {
    return (showEvent.titleInfo &&
               showEvent.titleInfo.IsFeature &&
               showEvent.titleInfo.IsEncrypted);
}

function _GetFeatureTypeContentCount() {
    var events = $get("timeline").childNodes;
    var featureTypeCount = 0;

    for (var i = 0; i < events.length; i++) {
        if (_isEncFeature(events[i])) {
            featureTypeCount += 1;
        }
    }

    return featureTypeCount;
}

function _TemplateContainsCallplaylist(template, id) {
    for (var i = 0; i < template.length; i++) {
        if (template[i].toUpperCase() == id.toUpperCase()) {
            return true;
        }
    }

    return false;
}

function _ValidateShowTemplate() {
    var timeline = $get("timeline").childNodes;
    var featureContentCount = _GetFeatureTypeContentCount();

    if (featureContentCount == 0 ||
        (_preShowCallplaylistIds.length == 0 && _intervalCallplaylistIds.length == 0)) {
        return true;
    }

    //wait event
    var isAutomationEvent = function(event) {
        return (!event.CallPlaylistId && !event.titleInfo)
    }

    //To avoid artifact during reel transition
    var isTransitionMaskEvent = function(event) {
        return (event.titleInfo && event.titleInfo.Duration < MAX_TRANSITION_MASK_EVENT_DURATION);
    }

    //finding qcn template in reverse order
    var getPrecedingQcnTemplate = function(startIndex, featureContentIndex) {
        var template = null;
        var hasTransitionMaskEvent = false;

        //no events before feature, means feature is placed first in the show.
        if (startIndex == -1 &&
           (featureContentCount > 1 && (
           (featureContentIndex == 1 && _preShowCallplaylistIds.length == 0) ||
           (featureContentIndex == 2 && _intervalCallplaylistIds.length == 0)))) {
            template = {};
        }
        else {
            for (var eventIndex = startIndex; eventIndex >= 0; eventIndex--) {
                var event = timeline[eventIndex];
                if (isAutomationEvent(event) ||
                   (!hasTransitionMaskEvent &&
                   (hasTransitionMaskEvent = isTransitionMaskEvent(event)))) {
                    continue;
                }

                if (!event.CallPlaylistId && (featureContentCount == 1 ||
                   (featureContentIndex == 1 && _preShowCallplaylistIds.length > 0) ||
                   (featureContentIndex == 2 && _intervalCallplaylistIds.length > 0))) {
                    break;
                }

                //If the show has only one feature content, then we can have either or both pre-show and interval show templates placed before the feature
                if (featureContentCount == 1) {
                    template = _TemplateContainsCallplaylist(_preShowCallplaylistIds, event.CallPlaylistId) ? _preShowCallplaylistIds :
                                   _TemplateContainsCallplaylist(_intervalCallplaylistIds, event.CallPlaylistId) ? _intervalCallplaylistIds : null;
                }
                //if show has more than one feature content,
                //then pre-show template must be placed before 1st feature content
                //show-interval template must be placed before 2nd feature content
                else if (featureContentCount > 1) {
                    template = (featureContentIndex == 1) ? _preShowCallplaylistIds : _intervalCallplaylistIds;
                }

                break;
            }
        }

        return { callplaylistIds: template, callplaylistLastIndex: eventIndex };
    }

    //Validating in order
    var hasAllCallplaylistEvents = function(template, startIndex) {
        for (var eventIndex = startIndex, templateIndex = template.length - 1;
         eventIndex >= 0 && templateIndex >= 0;
         eventIndex--, templateIndex--) {
            if (timeline[eventIndex].CallPlaylistId != template[templateIndex]) {
                return false;
            }
        }

        return (template.length == 0 || templateIndex == -1);
    }

    var hasQcnTemplateBeforeFeature = function() {
        //we have validation only for first two feature type encrypted content
        for (var eventIndex = 0, featureContentIndex = 0; (eventIndex < timeline.length && featureContentIndex < 2); eventIndex++) {
            if (_isEncFeature(timeline[eventIndex])) {
                var template = getPrecedingQcnTemplate(eventIndex - 1, ++featureContentIndex);
                if (template.callplaylistIds == null) {
                    return false;
                }

                if (!hasAllCallplaylistEvents(template.callplaylistIds, template.callplaylistLastIndex)) {
                    return false;
                }
            }
        }

        return true;
    }

    return hasQcnTemplateBeforeFeature();
}