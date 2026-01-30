// JScript File

var show = null;
var showDuration = null;
var dalapathiState = 0;
var positionBarWidth = 865;
var availableStorageBarWidth = 255;
var startIngestStatusTimer = 1;
var recentEventsCount = 0;
var lastUpdateDate = null;
var maxResultCount = 100;

Sys.Application.add_load(Page_Load);

function Page_Load() {
    pi.Show(DisplayTextResource.loading + "...");

    status_SetText();
    GetStatusPageInfo();
}

SetStyle();

function status_SetText()
{
    SetTexttoControl("statusNowPlayingLabel", DisplayTextResource.currentShow + ":");
    SetTexttoControl("statusCurrentIngestLabel", DisplayTextResource.currentIngest + ':');
    SetTexttoControl("statusAvailableStorageLabel", DisplayTextResource.storage + ":");
    SetTexttoControl("statusNewlyAddedLabel", DisplayTextResource.recentEvents + ":");
    SetTexttoControl("statusEstimatedTimeLabel", DisplayTextResource.estimatedTimeToCompletion + ":");
    SetTexttoControl("spnRaidLabel", DisplayTextResource.raidStatus + ":");
}

function SetStyle()
{
    document.getElementById("statusMenu").className = "MenuFocus";
    document['body'].style.backgroundImage = "url(res/Skins/" + skin + "/Status/Status.jpg)";
}

function GetStatusPageInfo() {
    var args = new Qube.Mama.StatusPageArgs();
    args.FromDate = lastUpdateDate;
    args.MaxResultCount = maxResultCount;
    
    PageMethods.GetStatusPageInfo(args, OnSuccess, OnFailure);
}

function OnSuccess(info) {
    OnGotShowInfo(info.CurrentShowInfo);
    OnGotCurrentIngest(info.CurrentJobInfo);
    OnGotStorage(info.StorageInfo);
    UpdateTimeInfo(info.CurrentTimeInfo);
    OnGotRecentlyIngestedItems(info.RecentEvents);
    OnGotRaidStatus(info.RaidStatus);

    pi.Hide();

    setTimeout("GetStatusPageInfo()", 500);
}

function OnFailure(errorobj) {
    //alert("Error : " + errorobj.get_message());
    pi.Hide();
    setTimeout("GetStatusPageInfo()", 500);
}

function OnGotCurrentShow(result)
{     
    SetTexttoControl("statusNowPlaying", DisplayTextResource.noShow);
    SetTexttoControl("statusSlash","");
    SetTexttoControl("statusShowDuration", "");
    SetTexttoControl("statusCurrentPosition", "");
    document.getElementById("statusCurrentPositionBar").style.width = 0 + 'px';                        
}

function OnGotShowInfo(result) {

    if (result == null) {
        OnGotCurrentShow();
        return;
    }
        
    show = result.ID;
        
    var name = result.Name;
    
    if(name == "")
        name = DisplayTextResource.noShow;
    else if(name.length > 30)
        name = name.substring(0,30) + "...";
        
    SetTexttoControl("statusNowPlaying", name);
    showDuration = result.Duration;
    
    SetTexttoControl("statusSlash","/");
    SetTexttoControl("statusShowDuration", Convert2HMS(showDuration));
    OnGotCurrentPosition(result.Position);
}        

function OnGotCurrentPosition(position)
{
    if(position == null || position == 0)
        document.getElementById("statusCurrentPositionBar").style.width = 0 + 'px';
    else
    {
        if(showDuration != null)
        {
            var curPosPercentage = (position / showDuration) * 100;
            
            var barWidth = (curPosPercentage * positionBarWidth) / 100;
            
            document.getElementById("statusCurrentPositionBar").style.width = barWidth + 'px';
        }
    }
    
    if(dalapathiState == -1 || showDuration == null)
        SetTexttoControl("statusCurrentPosition", "");
    else
        SetTexttoControl("statusCurrentPosition", Convert2HMS(position));    
}

function UpdateIngestStatus()
{
    if(dalapathiState != 0 && startIngestStatusTimer == 0)
        return;
        
    UpdateCurrentIngest();        
    UpdateStorage();
    
    if(startIngestStatusTimer == 1)
    {
        setInterval("UpdateIngestStatus()", 3000);
        startIngestStatusTimer = 0;
    }
}

function OnGotStorage(result)
{
    if(result == null)
        return;

    var percentage = Math.round(result.Free * 100 / result.Total);
    
    if(isNaN(percentage))
        percentage = 0;   
    
    var statususedspace = result.Free + " / " + result.Total + " " + result.Units + ' ' + DisplayTextResource.free;
    SetTexttoControl("statusUsedSpace", statususedspace);
    
    var barWidth = (percentage * availableStorageBarWidth) / 100;
    
    document.getElementById("statusAvailableStorageBar").style.width = barWidth +'px';
    
    SetTexttoControl("statusStorageLeftPercentage", percentage + '% ' + DisplayTextResource.free);        
}

function OnGotCurrentIngestError(result)
{
    SetTexttoControl("statusCurrentIngest", DisplayTextResource.noIngest);
    SetTexttoControl("statusCurrentIngestComplete", "");
    SetTexttoControl("statusMinutes", "");
    document.getElementById("statusIngestPositionBar").style.width = 0 +'px';
    document.getElementById("statusEstimatedTimeLabel").style.visibility = "hidden";
}

function OnGotCurrentIngest(result)
{
    if(result == null)
    {
        OnGotCurrentIngestError(result);
    }
    else
    {
        document.getElementById("statusEstimatedTimeLabel").style.visibility = "visible";
        
        var name = result.Name;
        if(name.length > 30)
            name = name.substring(0, 30) + "...";
        
        SetTexttoControl("statusCurrentIngest", name);
        SetTexttoControl("statusCurrentIngestComplete", result.Progress + "% " + DisplayTextResource.Completed);
        SetTexttoControl("statusMinutes", FormatEstimatedIngestCompletionTime(result.EstimatedCompletionTime));
        
        var barWidth = (result.Progress * positionBarWidth) / 100;
        document.getElementById("statusIngestPositionBar").style.width = barWidth +'px';
    }
}

function FormatEstimatedIngestCompletionTime(seconds)
{
	var hrs = Math.floor(seconds / 3600);
	
	seconds -= hrs * 3600;
	
	var mins = Math.floor(seconds / 60);
	
	seconds -= mins * 60;
	
	var result = "";
	
	if(hrs < 10)
		result += "0";
	
	result += hrs + ":";
	
	if(mins < 10)
		result += "0";
		
	result += mins;
	
	return result;
}

function OnGotRecentlyIngestedItems(result) {
    if (result == null || result.length == 0)
        return;

    var table = document.getElementById("statusNewlyAddedTable");

    var tbody = document.getElementById("statusNewlyAddedTableBody");

    var originalTableHeight = 0;

    var alternateColor = (recentEventsCount % 2 == 0);

    if (result.length > 0) {
        recentEventsCount += result.length;
        lastUpdateDate = result[result.length - 1].LogTimeToString;
    }

    var insertIndex = tbody.childNodes.length > 0 ? 0 : -1;

    for (var i = 0; i < result.length; i++) {
        var tableRow = tbody.insertRow(0);
        
        var Message = result[i].Message;
        var Type = result[i].ErrorType;

        var tdType = document.createElement("td");

        if (Type.toLowerCase() == "failureaudit")
            Type = "error";

        switch (result[i].EventType) {
            case Qube.Mama.RecentEventType.ShowPlay:
                {
                //TODO: Seek is getting logged as show interrupted and shown as error
                    if (/aborted by user|aborted due to error|interrupted/.test(Type.toLowerCase())) {
//                      Message = "The show ".concat('"', Message, '"', " is ", Type.toLowerCase());
//                        Type = "error";
                        continue;
                    }

                    if (/Completed/.test(Type)) {
                        Message = "The show ".concat('"', Message, '" ', Type.toLowerCase());
                        Type = "SuccessAudit";
                    }
                }
                break;

            case Qube.Mama.RecentEventType.IngestShow:
                Message = "The show ".concat('"', Message, '"', " ingested successfully");
                break;
            case Qube.Mama.RecentEventType.IngestKdm:
                Message = "The KDM ".concat('"', Message, '"', " ingested successfully");
                break;
            case Qube.Mama.RecentEventType.IngestCplSuccess:
                Message = "The composition ".concat('"', Message, '"', " ingested successfully");
                break;
            case Qube.Mama.RecentEventType.IngestCplCancel:
                Message = "Ingest cancelled successfully for composition ".concat('"', Message, '"');
                break;
            case Qube.Mama.RecentEventType.IngestCplIntegrityCancel:
                Message = "Integrity verification cancelled successfully for composition ".concat('"', Message, '"')
                break;
        }

        var imgType = document.createElement("img");
        var extension = "gif";

        if (Type.toLowerCase() == "error") 
            extension = "png";

        imgType.src = "res/Skins/" + skin + "/Common/" + Type + "_small." + extension;

        tdType.appendChild(imgType);

        tdType.className = "statusNewlyAddedType";

        var tdName = document.createElement("td");

        var name = Message;

        var newLineIndex = name.indexOf("\n");

        if (newLineIndex > -1)
            name = name.substring(0, newLineIndex - 1);

        if (name.length > 30 || newLineIndex > -1) {
            tdName.title = Message;
            name = name.replace("\n", "");
            name = name.substring(0, 30) + "...";
        }

        SetTexttoControl(tdName, name);

        tdName.className = "statusNewlyAddedName";

        if (alternateColor)
            tableRow.className = "recentEventRowText recentEventRowOdd";
        else
            tableRow.className = "recentEventRowText recentEventRowEven";

        alternateColor = !alternateColor;

        tableRow.appendChild(tdType);
        tableRow.appendChild(tdName);
    }

    table.style.display = "none";
    table.style.display = "block";
}

function UpdateTimeInfo(timeInfo) 
{
    if (timeInfo == null)
        return;

    SetTexttoControl("statusCurrentYear", timeInfo.Year);
    SetTexttoControl("statusCurrentMonthAndDate", timeInfo.MonthAndDate);
    SetTexttoControl("statusCurrentDay", timeInfo.Day);
    SetTexttoControl("statusCurrentTime", timeInfo.Time);
    SetTexttoControl("statusLocalTimeDiff", "(" + timeInfo.LocalTimeDiff + ")");
}

function OnGotRaidStatus(statusInfo) 
{
    var status = _GetRaidStatusToString(statusInfo.Status);
    
    if (status != "unknown")
    {
        $get("trRaidStatus").style.display = "";
        
        var displayStatus = eval("DisplayTextResource." + status);
        
        if(status == "rebuild")
            displayStatus = displayStatus.concat(" ", statusInfo.Progress, "%");
        
        SetTexttoControl("spnRaidStatusLabel", displayStatus);
    }
    else
        $get("trRaidStatus").style.display = "none";
}

function _GetRaidStatusToString(raidStatus) {
    
    switch (raidStatus) {            
        case Qube.RAIDStatus.Failed:
            return "failed";
            
        case Qube.RAIDStatus.Degraded:
            return "degraded";
            
        case Qube.RAIDStatus.Rebuild:
            return "rebuild";
            
        case Qube.RAIDStatus.Normal:
            return "normal";

        case Qube.RAIDStatus.Migration:
            return "migration";
            
        case Qube.RAIDStatus.Backup:
            return "backup";
            
        case Qube.RAIDStatus.RebuildSuspended:
            return "rebuildsuspended";

        default:
            return "unknown";
    }
}


if (typeof (Qube.Mama.StatusPageArgs) === 'undefined') {
    var gtc1 = Sys.Net.WebServiceProxy._generateTypedConstructor;
    Qube.Mama.StatusPageArgs = gtc1("Qube.Mama.StatusPageArgs");
    Qube.Mama.StatusPageArgs.registerClass('Qube.Mama.StatusPageArgs');
}

if (typeof (Qube.Mama.RecentEventType) === 'undefined') {

        Qube.Mama.RecentEventType = function() {
            throw Error.invalidOperation();
        }

       Qube.Mama.RecentEventType.prototype = {
            EventViewer: 0,
            ShowPlay: 1,
            IngestShow: 2,
            IngestKdm: 3,            
            IngestCplSuccess: 4,
            IngestCplCancel: 5,
            IngestCplIntegrityCancel: 6
        }
    
    Qube.Mama.RecentEventType.registerEnum('Qube.Mama.RecentEventType', true);
}

if (typeof (Qube.RAIDStatus) === 'undefined') {

    Qube.RAIDStatus = function() {
        throw Error.invalidOperation();
    }

    Qube.RAIDStatus.prototype = {
        Unknown: -1,
        Failed: 0,
        Degraded: 1,
        Rebuild: 2,
        Normal: 3,  
        Migration: 4,      
        Backup: 5,
        AESRaidError: 6,
        RebuildSuspended: 7
    }

    Qube.RAIDStatus.registerEnum('Qube.RAIDStatus', true);
}