if(Sys.Debug == null)
{
    Sys.Debug = new Sys._Debug();
}

if (Sys.Extended.UI.CascadingDropDownBehavior) {
    var cddb = Sys.Extended.UI.CascadingDropDownBehavior.prototype;
    cddb.Overload_initialize = cddb.initialize;
    cddb.initialize = function() {
        this.signalFormat = -1;
        this.Overload_initialize();
    }
    cddb._onMethodComplete = function(result, userContext, methodName) {
        this._selectedValue = this.signalFormat;
        this._setOptions(result);
    }
}

PropertyType = {
    TheatreCode : "748c49d8-e900-4ff7-830d-421f348a115a",
    ScreenCode : "0d442334-6902-41d9-9888-c2123b5f2f9c",
    LTCDelayInFrames : "3aede1a0-7cd8-45cd-931d-005b03d602f7",
    IsLTCEnabled : "6b7bd46b-3909-47ba-99b0-1a02e1b25feb",
    LTCAudioLevel : "10e1d987-a1fe-48dc-8d10-9725dc79fe17",
    LTCFrameRate : "78365781-87cf-45ce-bf54-a60f276f67e0",
    LTCOffset : "0cf6bcc6-096e-4de3-bcac-90744afbe4ff",
    Subtitling : "2ee4dedf-9eeb-4355-8188-9a0c89038244"
}

var Properties = function() {
    this._properties = new Array();
}

Properties.prototype = {
    Add: function(property) {
    Array.add(this._properties, property);
    },

    Get: function(propertyId) {
        for (var i = 0; i < this._properties.length; ++i) {
            if (this._properties[i]["Property"]["ID"].toLowerCase() == propertyId)
                return this._properties[i];
        }

        return null;
    },

    IsExists: function(propertyId) {
    for (var i = 0; i < this._properties.length; ++i) {
        if (propertyId.toLowerCase() == this._properties[i].Property.ID.toLowerCase())
                return true;
        }

        return false;
    }    
}   

var mediaFolderInfo = null;
var zones;
var zoneText = "";

var selectedRow=null;
var prevRowColor=null;
var accessDenied = false;

var isDLPCinemaDevice;
var serialNo = null;
var isPostBack = false;
var isManager = false;

var isTimeZoneSaved = true;
var isBufferSizeSaved = true;
var isPropertiesSaved = true;

var monitorFpm = null;

var properties = new Properties();
var _dCinemaSettingsEx = null;
var _device = null;
var _eCinemaDevices = null;

SetStyle();

Sys.Application.add_load(Page_Load);
Sys.Application.add_unload(Page_Unload);

function Page_Load() 
{
    pi.Show(DisplayTextResource.populating + '...');

//    $find(setupMenuTab).get_tabs()[4].set_enabled(false);

    DownloadImage();

    setup_SetText();

    $get("generalTabContent").parentNode.parentNode.className = "setupMenuBody";
    
    $get(dcinemaprojectortab).style.display = 'none';
    $get(ecinemaprojectortab).style.display = 'none';
    
    OnGotUserGroup();
    
    CreateSampleRateList();

    PageMethods.GetSetupPageInfo(OnSuccess, OnError);

    var zoneext = $find('zoneextnd');
    zoneext._reset = true;
    zoneext.hover();
    zoneext.Loading();

    NumericUpDownControlAlignment("bufferSize_BID");

//    $addHandler($find("nudTCDelay_BID").get_element(), 'keyup', DelayInFramesOnChange);
//    $addHandler($find("nudOutputLevel_BID").get_element(), 'keyup', LTCAudioLevelOnChange);
//    $addHandler($find("tcOffset_BID").get_element(), 'keyup', TCOffsetOnChange);
    
//    $find("nudTCDelay_BID").add_currentChanged(DelayInFramesOnChange);
//    $find("nudOutputLevel_BID").add_currentChanged(LTCAudioLevelOnChange);

    $find("aes_BID").add_currentChanged(AudioDelayOffsetChange);
    $find('filterPath').add_filtered(OnInvalidChar);
    $find('filterPingIP').add_filtered(OnInvalidChar);    
}

function Page_Unload() {
    properties = null;
    
//    $find("nudTCDelay_BID").remove_currentChanged(DelayInFramesOnChange);
//    $find("nudOutputLevel_BID").remove_currentChanged(LTCAudioLevelOnChange);

//    $removeHandler($find("nudTCDelay_BID").get_element(), 'keyup', DelayInFramesOnChange);
//    $removeHandler($find("nudOutputLevel_BID").get_element(), 'keyup', LTCAudioLevelOnChange);
//    $removeHandler($find("tcOffset_BID").get_element(), 'keyup', TCOffsetOnChange);
    
    $find("aes_BID").remove_currentChanged(AudioDelayOffsetChange);
    $find('filterPath').remove_filtered(OnInvalidChar);
    $find('filterPingIP').remove_filtered(OnInvalidChar);
}

function DownloadImage() 
{
    SetCheckBoxImageUrl('playWithError');
    SetCheckBoxImageUrl('autoDelete');
//    SetCheckBoxImageUrl('psf');
//    SetCheckBoxImageUrl('timeCodeEnable_BID');
}

function SetCheckBoxImageUrl(controlBehaviorId) {
    $find(controlBehaviorId).set_CheckedImageUrl("res/Skins/" + skin + "/Common/Green%20Button.gif");
    $find(controlBehaviorId).set_UncheckedImageUrl("res/Skins/" + skin + "/Common/Red%20Button.gif");
}

function OnSuccess(setupPageInfo) 
{
    OnGotSerialNumber(setupPageInfo.SerialNumber);
    OnGotTimeZones(setupPageInfo.TimeZones);
    OnGotCurrentTimeZone(setupPageInfo.CurrentTimeZone);
    OnGotMediaFolderInfo(setupPageInfo.MediaFolderInfos);
    _InitCp850(setupPageInfo.Cp850ConnectionInfo);

    if (serialNo != null)
        SetupInfos(setupPageInfo);
    else {
        $find(setupMenuTab).get_tabs()[1].set_enabled(false);
//        $find(setupMenuTab).get_tabs()[4].set_enabled(false);
    }

    OnGotFeatures(setupPageInfo.Features);    
}

function AccessDeniedUser(result)
{
    EnableControl('savemediafolder', false);
    EnableControl('delete', false);    
    EnableControl('newMediaFolder', false);
    $get('zonesave').style.visibility = 'hidden';

    if (!HaveRights()) {
        DisableConnect("c1");
        DisableConnect("reconnect1");
    }
    
    EnableControl("divGeneralSave", false);
    EnableControl("projectorSave", false);
    EnableControl("UploadFpm", false);

//    DisableTimeCodePropertiesControl(true);

    DisableNumericUpDownControl("bufferSize_BID", true);
//    DisableNumericUpDownControl("analog_BID", true);
    DisableNumericUpDownControl("aes_BID", true);

//    EnableControl("divTimeCodeSave", false);

    accessDenied = true;
}

function OnGotUserGroup() 
{
    isManager = /managers/i.test(userGroup);
    if (!HaveRights() || isManager)
        AccessDeniedUser(userGroup);
    else
        EnableControl('newMediaFolder', true);
}

function SetStyle()
{
    document.getElementById("setupMenu").className = "MenuFocus";
    var body = document['body'];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Setup/setup.jpg)";
}

function OnGotSerialNumber(result)
{
    serialNo = result;
    if (serialNo != null)   
        SetTexttoControl($find('hmSerialExtender').get_element(), result);
}

function SetupInfos(result)
{
    isDLPCinemaDevice = result.IsDlpCinemaDevice;

    if (isDLPCinemaDevice)
    {
        if (result.ShowPlaybackMode.toLowerCase() == "auto")
            $get("trSignalFormat").style.display = "";

        var threeDMode = result.ThreeDMode;

        if (threeDMode.toLowerCase() == "default")
        {
            threeDMode = threeDMode.toLowerCase();
        }

        OnGot3DMode(threeDMode);
        OnGot3DConfigFile(result.ThreeDConfig);

        $get("trConfigFile").style.display = (threeDMode == "default") ? "none" : "";

        document.getElementById("DBoxSettings").style.display = "";
        $get(dcinemaprojectortab).style.display = 'block';
        $get(ecinemaprojectortab).style.display = 'none';
        
        $get("trThreeDMode").style.display = "";        

        OnGotSetupInfo(result.DlpCinemaDevice);
    }
    else
    {
        document.getElementById("EBoxSettings").style.display = "";
        $get(ecinemaprojectortab).style.display = 'block';
        $get(dcinemaprojectortab).style.display = 'none';
                
        SetupECinemaProjectorInfo(result.ECinemaDevices);
        _device = result.CurrentECinemaDevice;
        OnGotSetupInfo(result.ECinemaDevices);
    }

    OnGotProperties(result.Properties);
}

function AddProjectorNames(projector)
{
    var optionElement = new DropDownItem();
        optionElement.ID = "Barco";
        optionElement.Name = "Barco";
    
    var optionElement1 = new DropDownItem();
        optionElement1.ID = "Christie";
        optionElement1.Name = "Christie";
    
    var optionElement2 = new DropDownItem();
        optionElement2.ID = "NEC";
        optionElement2.Name = "NEC";
        
    var optionElement3 = new DropDownItem();
        optionElement3.ID = "Other";
        optionElement3.Name = "Other";
        
    var elements = new Array();
    
        elements[0]= optionElement;
        elements[1]= optionElement1;
        elements[2]= optionElement2;
        elements[3]= optionElement3;
        
    SetupProjectorDropDown("projector1Extnd", elements);
    SetupProjectorDropDown("projector2Extnd", elements);
    SetupProjectorDropDown("projector3Extnd", elements);
    SetupProjectorDropDown("projector4Extnd", elements);
    
}

function SetupProjectorDropDown(extendername, elements)
{           
    var extender = $find(extendername);
    extender.set_ellipsetrim(false); 
    extender.Generate(elements);
    extender._reset = true;
    extender.hover();
}

function OnGotSetupInfo(result) {   
   
    if (isDLPCinemaDevice) 
    {        
        _dCinemaSettingsEx = result;
        _device = result.DBoxSettings;
        
        SetDCinemaProjectorInfo(_device.Projectors);
        
        SetCurrentValue('audioSampleRateExtnd', _dCinemaSettingsEx.SampleRateConverterMode + 'Hz');

        if (!_device.IsAJAAnalogAudio) 
        {            
            $get('chkAnalog').checked = _device.IsAnalogAudio;
            $get('chkAES').checked = _device.IsDigitalAudio;

            if (_device.AnalogAudioOffset != null) 
                SetValueToNumericUpDownControl("analog_BID", _device.AnalogAudioOffset);
        }
        else {            
            $get("trAudio").style.display = "none";
            
            $get("tdAnalogLbl").style.display = "none";
            $get("tdAESLbl").style.display = "none";
            $get("tdAnalogOffset").style.display = "none";

            $get("tdAESOffset").style.paddingTop = "10px";
            $get("tdAudioOffset").style.paddingTop = "10px";
        }

        if (_device.AESAudioOffset != null) 
            SetValueToNumericUpDownControl("aes_BID", _device.AESAudioOffset);

//        $find("psf").set_CheckedValue(_device.IsPSF);
    }
    else {
        _eCinemaDevices = result;
                
        for(var i=0; i<_eCinemaDevices.length; ++i)
        {            
            SetCurrentValue("lensextnd".concat(i + 1), _eCinemaDevices[i].LensRatio);
            SetCurrentValue("aspectextnd".concat(i + 1), _eCinemaDevices[i].ActiveAspect);
            $find("resolutionextnd".concat(i + 1)).SelectByText(_eCinemaDevices[i].Resolution);
        }
    }

    $find("autoDelete").set_CheckedValue(_device.IsAutoDelete);
    $find("playWithError").set_CheckedValue(_device.IsAllowPlaybackOnError);

    SetValueToNumericUpDownControl("bufferSize_BID", _device.BufferSize);

    ClearCursor();
}

function SetupECinemaProjectorInfo(projectors)
{
    for(var i=0; i<projectors.length; ++i)
    {
        AddOptions("lensextnd".concat(i + 1), projectors[i].LensRatios);
        AddOptions("aspectextnd".concat(i + 1), projectors[i].ActiveAspects);
        AddOptions("resolutionextnd".concat(i + 1), projectors[i].Resolutions);
    }     
    
    var projectorControl = $get(projectorsCtrlID);
    
    for(var j=2; j>projectors.length; --j)
        projectorControl.remove(j);

    var projectorTabs = $find(ecinemaprojectortab).get_tabs();

    for (var k = 0; k < projectors[0].Outputs.length; ++k)
        projectorTabs[k].set_enabled(true);

    var projectorMode = 0;

    if ((projectors[0].ProjectorMode) < projectorControl.options.length)
        projectorMode = projectors[0].ProjectorMode;
        
    projectorControl.selectedIndex = projectorMode;
}

function SetDCinemaProjectorInfo(projectors) 
{
    var projectorTabs = $find(dcinemaprojectortab).get_tabs();

    for (var i = 0; i < projectors.length; ++i) {
        var projectorOrder = projectors[i].ProjectorOrder;        
        var projectorTabIndex = projectorOrder + 1;
        var CinemaIPCtrl = $get('dlpcinemaip' + (projectorOrder + 1));
        var dlpCinemaIP = projectors[i].DLPCinemaProjectorIP;

        CinemaIPCtrl.value = "";

        projectorTabs[projectorOrder].isConnected = CinemaIPCtrl.disabled = projectors[i].IsConnected;

        $get("imgProjector" + (projectorTabIndex)).style.display = '';

        if (projectors[i].IsConnected)
        {
            projectorTabs[projectorOrder].SignalFormat = projectors[i].SignalFormat;
            
            $get("imgProjector" + (projectorTabIndex)).src = "res/Skins/" + skin + "/setup/connect.gif";

            SetTexttoControl("c" + (projectorTabIndex), DisplayTextResource.Disconnect);
            $get('dc' + (projectorTabIndex)).style.display = '';
        }
        else
            $get("imgProjector" + (projectorTabIndex)).src = "res/Skins/" + skin + "/setup/disconnect.gif";

        if ((dlpCinemaIP != "0.0.0.0"))
            CinemaIPCtrl.value = dlpCinemaIP;
            
        $get("proClear" + projectorTabIndex).style.display = 
            (!projectors[i].IsConnected && dlpCinemaIP != "0.0.0.0" && dlpCinemaIP != "") ? "" : "none";
    }

    var extender = $find('csSFextnd');

    var projectorCtrl = $get(extender.get_ParentControlID());

    if (projectors.length > 0) 
    {
        extender.signalFormat = projectors[0].SignalFormat;
        extender.set_SelectedValue(projectors[0].SignalFormat.toString());

        switch (projectors.length) 
        {
            case 1:
                projectorCtrl.selectedIndex = projectors[0].ProjectorOrder;
                break;

            case 2:
                projectorCtrl.selectedIndex = 1;
                break;

            case 4:
                projectorCtrl.selectedIndex = 2;
                break;
        }
    }
    
    EnableTabs(projectorCtrl);

    extender._onParentChange(); 
}

function AddOptions(behaviorID, result)
{
    var extender = $find(behaviorID);
    
    if(result == null)
        return;
        
    var elements = new Array();
    
    for(var i = 0; i < result.length; i++)
    {
        var optionElement = new DropDownItem();
        optionElement.ID = result[i].Value;
        optionElement.Name = result[i].DisplayText;
    
        elements[i]= optionElement;
    }
    extender.set_ellipsetrim(false);
    extender.Generate(elements);
}

function SetCurrentValue(behaviorID, curValue)
{
    var extender = $find(behaviorID);
    extender.Select(curValue);
}

function rowClicked(clickedRow)
{
    var rowClicked = clickedRow; 
        
    while(1)
    {
        if(rowClicked.tagName.toLowerCase() == 'tr')
            break;

        rowClicked = rowClicked.parentNode;
    }
    
    if(selectedRow != null)
        selectedRow.style.backgroundColor = prevRowColor;
    
    prevRowColor = rowClicked.style.backgroundColor;
    
    if(rowClicked == selectedRow)
    {   
        selectedRow = null;        
        SetPathnQuota("", "");
        
        EnableControl("delete", false);
        return;
    }

    rowClicked.style.backgroundColor = "#F7DFA8";  
            
    EnableControl("savemediafolder", false);
    var path = $find('filterPath').get_element()
        
    path.disabled = false;
    
    var trc = rowClicked.getElementsByTagName('td');
    
    SetPathnQuota(GetControlText(trc[0]), GetControlText(trc[1]));

    if (trc[1].value == true)
        path.disabled = true;
        
    if(!accessDenied)
        EnableControl("delete", true);
    
    selectedRow = rowClicked;
    selectedRow.tabIndex = "25";
    selectedRow.focus();
}

function OnGotMediaFolderInfo(result)
{
    RemoveChildNodes("mediafoldersList");
    ResetMFSelection();
    
    if(result == undefined)
    {        
        pi.Hide();
        return;
    }
    
    for(var i = 0; i < result.length; i++)
    {
        var tr = document.createElement("tr");
        tr.className = "unselectedRow";
        tr.onfocus = function() 
            {
                this.className = (this.rowIndex % 2 == 0) ? "selectedRow rowEven" : "selectedRow rowOdd";
            }
        tr.onblur = function()
                    {
                        this.className = (this.rowIndex % 2 == 0) ? "unselectedRow rowEven" : "unselectedRow rowOdd";
                    }
        tr.onclick = function(){rowClicked(this)};        
        tr.onkeyup = function(e)
                        {                        
                            if(e == null)
                                e=window.event;
                                
                            var code = e.keyCode || e.which;
                            
                            if(code == 13)
                                rowClicked(this);
                            else if(code == 38 || code == 40 || code == 46) //arrow key
                                rowChanged(this, code); 
                        }

                        tr.className = (i % 2 == 0) ? "unselectedRow rowEven" : "unselectedRow rowOdd";
        
        tr.appendChild(CreateFeild("mediafolderPath", result[i].Path, result[i].Id));
        tr.appendChild(CreateFeild("mediafolderQuota", result[i].Quota, result[i].IsReferred));
        
        document.getElementById("mediafoldersList").appendChild(tr);
    }
    if(result.length > 0)
        document.getElementById("mediafoldersList").childNodes[0].tabIndex = 25;
    
    pi.Hide();    
 }
 
 function rowChanged(currRow, code)
 {
    var movedRow = null;
        
    if((code == 38 && currRow.previousSibling) || (code == 40 && currRow.nextSibling))
    {
        currRow.removeAttribute("tabIndex");
        currRow.style.backgroundColor = '';
    }
    
    if(code == 38) //up arrow     
    {
        if(currRow.previousSibling)
        {            
            movedRow = currRow.previousSibling;                                                
            rowClicked(movedRow);
        }        
    }
    else if(code == 40) //down arrow
    {
        if(currRow.nextSibling)
        {            
            movedRow = currRow.nextSibling;                        
            rowClicked(movedRow);
        }        
    }else if(code == 46) //delete
            DeleteMediaFolder();
        
 }
 
 function CreateFeild(style, text, value)
 {
    var feild = document.createElement("td");        
    feild.className = style;
    SetTexttoControl(feild, text);
    feild.value = value;
    
    return feild;
 }
 
 function NewMediafolder()
 {
    ResetMFSelection();
    return false;
 }
 
 function EnableSave(value, button, hasRights)
 {
    if (value.trim() == "") 
    {
        EnableControl(button, false);
        return;
    }

    if (!accessDenied || (hasRights != undefined && hasRights))
        EnableControl(button, true);
 }
 
function ChangeCursor(displayText)
{
    pi.Show(displayText);
}

function ClearCursor()
{
    pi.Hide();
}

function GetProjectorInfo()
{
    var projectors = new Array();
    
    var extender = $find('csSFextnd');
    var projectorCtrl = $get(extender.get_ParentControlID());
    var projectorsCount = parseInt(projectorCtrl.options[projectorCtrl.selectedIndex].value, 10);
    
    for(var i = 0; i < projectorsCount; ++i)
    {
        var projectorIp = $get('dlpcinemaip' + (i+1)).value;
        
        if(projectorIp.trim().length == 0)
            continue;
    
        var projector = new Qube.Mama.ProjectorInfo();
        projector.ProjectorIP = $get('projectorip'+ (i+1)).value;
        projector.DLPCinemaProjectorIP = $get('dlpcinemaip' + (i+1)).value;
        projector.SignalFormat = extender.get_element().selectedIndex;
        projector.ProjectorOrder = i;
                                
        Array.add(projectors, projector);
    }
    
    return projectors;
}

function SaveDBoxSettings() {

    ChangeCursor(DisplayTextResource.saving + '...');
    
    var projectors = GetProjectorInfo();
    
    if(projectors.length > 0)
        Qube.Mama.Setup.ConnectProjector(projectors, OnConnected, OnConnectError);
    
    var dBoxSettings = _device;

    _dCinemaSettingsEx.SampleRateConverterMode = parseInt(GetSelectedValue('audioSampleRateExtnd'));
    
    if ($get('tdAnalogOffset').style.display != "none") 
    {
        dBoxSettings.IsAnalogAudio = false;
        dBoxSettings.IsDigitalAudio = false;

        dBoxSettings.IsAnalogAudio = $get('chkAnalog').checked;

        dBoxSettings.IsDigitalAudio = $get('chkAES').checked;

        dBoxSettings.AESAudioOffset = GetNumericUpDownControlValue($find('aes_BID'));
        dBoxSettings.AnalogAudioOffset = GetNumericUpDownControlValue($find('analog_BID'));

    }
    else 
    {
        dBoxSettings.IsAnalogAudio = false;
        dBoxSettings.IsDigitalAudio = false;

        dBoxSettings.AESAudioOffset = GetNumericUpDownControlValue($find('aes_BID'));
    }

    dBoxSettings.IsAllowPlaybackOnError = $find("playWithError").get_CheckedValue();
    
    _dCinemaSettingsEx.DBoxSettings = dBoxSettings;
    
    PageMethods.SaveDCinemaDeviceSettings(_dCinemaSettingsEx, OnSaved, OnError);
}

function SaveEBoxSettings()
{
//    if($get(projectorsCtrlID).selectedIndex == 0)
//    {
//        ShowPopup(DisplayTextResource.emptySelection, "res/Skins/" + skin + "/Common/information.gif", 
//                    DisplayTextResource.pleaseSelectProjectorMode, null);
//        return;
//    }
    
    ChangeCursor(DisplayTextResource.saving + '...');
    
    var index = $find(ecinemaprojectortab).get_activeTabIndex();
    Qube.Mama.Setup.SaveEBoxSettings(GetUpdatedECinemaDevice(index), OnSaved, OnError);    
}

function GetUpdatedECinemaDevice(index)
{    
    var eBoxSettings = _eCinemaDevices[index];
            
    eBoxSettings.LensRatio = GetSelectedValue("lensextnd".concat(index + 1));
    eBoxSettings.ActiveAspect = GetSelectedValue("aspectextnd".concat(index + 1));
    eBoxSettings.Resolution = GetSelectedValue("resolutionextnd".concat(index + 1));
    eBoxSettings.ProjectorMode = $get(projectorsCtrlID).selectedIndex;
        
    return eBoxSettings;
}

function GetSelectedValue(behaviorID)
{
    var extender = $find(behaviorID);
    return extender.selectedValue();    
}

function Ping(e) 
{
    var ipAddress = $find('filterPingIP').get_element().value;
    
    ChangeCursor(DisplayTextResource.pinging + '...'); 
        
    if(ipAddress == "")
    {
        ClearCursor();
        ShowPopup(DisplayTextResource.pingStatus, "res/Skins/" + skin + "/Common/Information.gif", DisplayTextResource.pleaseEnterTheIPAddressToBePinged, null);
    }
    else
    {               
        var validIP = new RegExp(/^(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])$/);
        var validName = new RegExp(/^[a-zA-Z0-9-\.]{1,255}$/);

        if ((!ipAddress.match(validName)) && (!ipAddress.match(validIP))) 
        {
             ClearCursor();
             ShowPopup(DisplayTextResource.invalidHost, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.hostFormatIsNotValid, null);      
             return false;
        }
        else
            Qube.Mama.Setup.PingIPAddress(ipAddress, OnPingStatus, OnError);    
     }
     return false;
}

function OnPingStatus(result)
{
    var ipAddress = $find('filterPingIP').get_element().value;
    
    ClearCursor();
    
    var resSplit = result.split(",");
    var successCount = resSplit[0];
    var failureStatus = resSplit[1];

    if (ipAddress.length > 50)
        ipAddress = ipAddress.substr(0, 47) + "...";
  
    var failed = parseInt(4) - parseInt(successCount); 
    
    if(successCount != 0)
        ShowPopup(DisplayTextResource.pingStatus, "res/Skins/" + skin + "/Common/Information.gif", DisplayTextResource.pingStatisticsFor + " " + ipAddress + "\n " + DisplayTextResource.packets + " : " + DisplayTextResource.sent + "=4, " + DisplayTextResource.success + "=" + successCount + ", " + DisplayTextResource.failed + "=" + failed + ".", null);    
    else
        ShowPopup(DisplayTextResource.pingStatus, "res/Skins/" + skin + "/Common/Information.gif", DisplayTextResource.pingStatisticsFor + " " + ipAddress + "\n " + DisplayTextResource.packets + " : " + DisplayTextResource.sent + "=4, " + DisplayTextResource.success + "=0, " + DisplayTextResource.failed + "=4. \n" + DisplayTextResource.reason + ": " + failureStatus, null); 
}

function SaveTimeZone() 
{
    var zone = $find('zoneextnd').selectedValue();
    if ($get('zonesave').style.visibility != 'visible' || 
        zone.trim() == "" || zone == null) {
        isTimeZoneSaved = true;
        return;
    }

    ChangeCursor('saving...');

    isTimeZoneSaved = false;
    
    zoneText = zone;
    Qube.Mama.Setup.SaveTimeZone(zone, OnTimeZoneSaved, OnError);
    $get('zonesave').style.visibility = 'hidden';
}

function OnTimeZoneSaved() {
    isTimeZoneSaved = true;
    if (isBufferSizeSaved && isPropertiesSaved)
        ClearCursor();
}

function OnSaved()
{
    if(isDLPCinemaDevice)
        PageMethods.GetDCinemaDeviceSettings(OnGotSetupInfo, ClearCursor);
    else
        PageMethods.GetECinemaDeviceSettings(OnGotSetupInfo, ClearCursor);
}

function Copy()
{    
    copy_clip(serialNo);    
}

function Disconnect()
{   
    ChangeCursor(DisplayTextResource.disconnectingTheProjector + "...");
    Qube.Mama.Setup.DisconnectProjector($find(dcinemaprojectortab).get_activeTabIndex(), 
        OnDisconnected, OnDisconnectError);
}

function OnDisconnected(result)
{
    ClearCursor();
    
    var dlpcinemaipIndex = $find(dcinemaprojectortab).get_activeTabIndex() + 1;
    
    if(result)
    {
        SetTexttoControl("c" + dlpcinemaipIndex, DisplayTextResource.Connect);
        $get('dlpcinemaip' + dlpcinemaipIndex).disabled = false;
        $get('dlpcinemaip' + dlpcinemaipIndex).value = "";
        $get('dc' + dlpcinemaipIndex).style.display = 'none';
        $get("imgProjector" + dlpcinemaipIndex).src = "res/Skins/" + skin + "/setup/disconnect.gif";
        $find(dcinemaprojectortab).get_activeTab().isConnected = false;
    }
}

function SaveMediaFolder()
{
    if($get("savemediafolderDisabled").style.display != 'none')
        return false;
    
    ChangeCursor(DisplayTextResource.saving + '...');
    var mediaFolderInfo = new Qube.Mama.MediaFolderInfo();

    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("quotaFilter").get_element());

    var quota = wrapper.get_Value();
    quota = (quota == "" ? '0' : quota);
	
	if(selectedRow != null)
    {
        var trc = selectedRow.getElementsByTagName('td');
    
        if((GetControlText(trc[1]) == quota) || (quota == '0'))
        {
            ResetMFSelection();
            ClearCursor();
            return false;
        }
            
        mediaFolderInfo.Id = trc[0].value;
    }
    else
	    mediaFolderInfo.Id = null;

	mediaFolderInfo.Path = $find('filterPath').get_element().value.trim().toLowerCase();
    mediaFolderInfo.Quota = quota;
	mediaFolderInfo.Cost = 0;

	Qube.Mama.Setup.SaveMediaFolderInfo(mediaFolderInfo, OnSaveMediaFolder, OnError);
	return false;
}

function OnSaveMediaFolder(result)
{
    if(result == false)
    {
        ClearCursor();
        ShowPopup(DisplayTextResource.saveFailed, "res/Skins/" + skin + "/Common/error.gif", DisplayTextResource.mediaFolderCannotBeSaved, null);
        return false;
    }
       
    Qube.Mama.Setup.GetMediaFolderInfos(OnGotMediaFolderInfo, OnGotMFInfoError);
    return false;
}

function DeleteMediaFolder()
{
    if(selectedRow == null)
        return false;
        
    ChangeCursor(DisplayTextResource.deleting + '...');
    var trc = selectedRow.getElementsByTagName('td');
    
    if(trc[1].value)
    {
        ClearCursor();
        ShowPopup(DisplayTextResource.deleteFailed, "res/Skins/" + skin + "/Common/error.gif", 
        DisplayTextResource.mediafolderCannotBeDeleted + " " + DisplayTextResource.because + " \t\t\t\t\t\t " + DisplayTextResource.itIsReferred, null);
        return false;
    }
        
    var mediaFolderInfo = new Qube.Mama.MediaFolderInfo();
        
    mediaFolderInfo.Id = trc[0].value;
    mediaFolderInfo.Path = GetControlText(trc[0]);
    mediaFolderInfo.Quota = GetControlText(trc[1]);
    mediaFolderInfo.Cost = 0;
    
    Qube.Mama.Setup.DeleteMediaFolder(mediaFolderInfo, OnDeleteMediaFolder, OnError); 
    
    return false;    
}

function OnDeleteMediaFolder(result)
{
    if(result == false)
    {
        ClearCursor();
        ShowPopup(DisplayTextResource.deleteFailed, "res/Skins/" + skin + "/Common/error.gif", DisplayTextResource.mediafolderCannotBeDeleted, null);
        return false;
    }
    
    Qube.Mama.Setup.GetMediaFolderInfos(OnGotMediaFolderInfo, OnGotMFInfoError);
    
    EnableControl("delete", false);
}

function EnableControl(control, enable)
{
    document.getElementById(control).style.display = (enable ? "block" : "none");
    document.getElementById(control + "Disabled").style.display = (enable ? "none" : "");
}

function OnGotTimeZonesError(result)
{
    $find('zoneextnd')._isLoading = false;
    $find('zoneextnd').Select('');
}

function OnGotTimeZones(result)
{    
    if(result == undefined)
    {
        $find('zoneextnd')._isLoading = false;
        $find('zoneextnd').Select('');
        return false;
    }
    
    var zones = new Array();
    for(var i = 0; i < result.length; ++i)
    {
        var zone = new DropDownItem();
        zone.ID = result[i];
        zone.Name = result[i];
        zones[i] = zone;        
    }
    
    var zone = $find('zoneextnd');
    zone.set_ellipsetrim(false); 
    zone.Generate(zones, TimeZoneChanged);
}

function OnGotCurrentTimeZone(result)
{
    $find('zoneextnd').Select(result);
    zoneText = result;
}

function SetPathnQuota(path, quota)
{
    $find('filterPath').get_element().value = path;
    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("quotaFilter").get_element());
    wrapper.set_Value(quota);
}

function ShowPopup(title, iconImgPath, text, okScript)
{
    ConfirmationWindow(title, text, iconImgPath, okScript, null);    
}

function ResetMFSelection()
{
    if(selectedRow != null && prevRowColor != null)
    {   
        selectedRow.style.backgroundColor = prevRowColor;
        selectedRow = null;
    }
        
    SetPathnQuota("", "");

    $find('filterPath').get_element().disabled = false;
    //$find('filterPath').get_element().focus();       
    
    EnableControl("savemediafolder", false);  
    EnableControl("delete", false);    
}

function VerifyIP(obj)
{
    var IPvalue = obj.value;
    errorString = "";

    var arr = IPvalue.split('.');

    if(IPvalue != '' && (arr.length < 4 || arr.length > 4))
        errorString = DisplayTextResource.IPaddress + ': ' + IPvalue + DisplayTextResource.isNotaValidIPaddress + '.';    
    else if (IPvalue == "0.0.0.0" || IPvalue == "255.255.255.255")
        errorString = DisplayTextResource.IPaddress + ': ' + IPvalue + DisplayTextResource.isaSpecialIPaddressAndCannotBeUsedHere;
    else 
    {
        for(var i = 0; i < 4; i++)
        {
            if(arr[i] < 0 || arr[i] > 255 )
            {
                errorString = DisplayTextResource.IPaddress + ': ' + IPvalue + DisplayTextResource.isNotaValidIPaddress + '.';
                break;
           }
        }
    }
       
    if (errorString != "")
    {
        ShowPopup(DisplayTextResource.ipAddressValidation, "res/Skins/" + skin + "/Common/error.gif", errorString, null);
        return false;
    }
    return true;
}

function copy_clip(meintext)
{
    if (window.clipboardData) // for IE   
        window.clipboardData.setData("Text", meintext);
    else if (window.netscape && Sys.Browser.agent == Sys.Browser.Firefox) //for mozilla
    {     
        /*
            notes about security:
            a cause of the tight security settings in mozilla you have to sign the javascript
            to make it work another way is to change your firefox/mozilla settings
            
            add this line to your prefs.js file in your firefox/mozilla user profile directory

            user_pref("signed.applets.codebase_principal_support", true);

            or change it from within the browser with calling the "about:config" page

        */        
    
        // you have to sign the code to enable this, or see notes above 
        
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
        
        var clip = Components.classes['@mozilla.org/widget/clipboard;1'].createInstance(Components.interfaces.nsIClipboard);
        
        if (!clip) return;
            
        var trans = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);

        if (!trans) return;
        
        trans.addDataFlavor('text/unicode');
        
        var len = new Object();
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        var copytext=meintext;

        str.data=copytext;
        trans.setTransferData("text/unicode",str,copytext.length*2);

        var clipid=Components.interfaces.nsIClipboard;
        
        if (!clip) return false;

        clip.setData(trans,null,clipid.kGlobalClipboard);
    }
    else
    {
        ShowPopup(DisplayTextResource.copy, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.copyIsNotSupportedIn + " " + browserName, null);
        return false;
    }    
   
    return false;
}

function setup_SetText()
{
    SetTexttoControl("SetupLabel", DisplayTextResource.setup);    
    SetTexttoControl("AudioOPLbl", DisplayTextResource.audioOP);
    SetTexttoControl("AnalogLbl", DisplayTextResource.analog);
    SetTexttoControl("AESLbl", DisplayTextResource.aes);
    SetTexttoControl("spnAudioSampleRate", DisplayTextResource.audioSampleRate);        
    
    //SetTexttoControl("outputLbl", DisplayTextResource.output2);
    SetTexttoControl("lensLbl1", DisplayTextResource.lensRatio);
    SetTexttoControl("activeAspectLbl1", DisplayTextResource.activeAspect);
    SetTexttoControl("resolutionLbl1", DisplayTextResource.resolution);
    
    SetTexttoControl("lensLbl2", DisplayTextResource.lensRatio);
    SetTexttoControl("activeAspectLbl2", DisplayTextResource.activeAspect);
    SetTexttoControl("resolutionLbl2", DisplayTextResource.resolution);
    
    SetTexttoControl("serialLabel", DisplayTextResource.serialNumber + ': ');
    SetTexttoControl("mediafolderLbl", DisplayTextResource.mediaFolders);
    SetTexttoControl("pathLbl", DisplayTextResource.path);
    SetTexttoControl("quotaLbl", DisplayTextResource.quota);
    SetTexttoControl("timeZoneLbl", DisplayTextResource.timeZone);
    SetTexttoControl("zonesave", DisplayTextResource.save);
    SetTexttoControl("spnPingEnabled", DisplayTextResource.ping);
    SetTexttoControl("spnPingDisabled", DisplayTextResource.ping);
    SetTexttoControl("savemediaTxt", DisplayTextResource.save);
    SetTexttoControl("spnSavemediafolderDisabled", DisplayTextResource.save);
    SetTexttoControl("newsetupTxt", DisplayTextResource.New);
    SetTexttoControl("deletesetupTxt", DisplayTextResource.deleteTxt);
    SetTexttoControl("spnDeleteDisabled", DisplayTextResource.deleteTxt);
    SetTexttoControl("spnNewMediaFolderDisabled", DisplayTextResource.New);    
    SetTexttoControl("AudioOSLabel", DisplayTextResource.audioOffset + " (" + DisplayTextResource.ms + ") ");
//    SetTexttoControl($find('outputextnd').get_element(), DisplayTextResource.selectOutputDevice);
    SetTexttoControl($find('lensextnd1').get_element(), DisplayTextResource.selectLensRatio);
    SetTexttoControl($find('aspectextnd1').get_element(), DisplayTextResource.selectAspectRatio);
    SetTexttoControl("lblCopy", DisplayTextResource.Copy);
    SetTexttoControl("p1", DisplayTextResource.projectorIP);
    SetTexttoControl("p2", DisplayTextResource.projectorIP);
    SetTexttoControl("p3", DisplayTextResource.projectorIP);
    SetTexttoControl("p4", DisplayTextResource.projectorIP);
    SetTexttoControl("d1", DisplayTextResource.dlpCinemaIP);
    SetTexttoControl("d2", DisplayTextResource.dlpCinemaIP);
    SetTexttoControl("d3", DisplayTextResource.dlpCinemaIP);
    SetTexttoControl("d4", DisplayTextResource.dlpCinemaIP);
    SetTexttoControl("c1", DisplayTextResource.Connect);
    SetTexttoControl("c2", DisplayTextResource.Connect);
    SetTexttoControl("c3", DisplayTextResource.Connect);
    SetTexttoControl("c4", DisplayTextResource.Connect);
    SetTexttoControl("dc1", DisplayTextResource.Reconnect);
    SetTexttoControl("dc2", DisplayTextResource.Reconnect);
    SetTexttoControl("dc3", DisplayTextResource.Reconnect);
    SetTexttoControl("dc4", DisplayTextResource.Reconnect);
    SetTexttoControl("proClear1", DisplayTextResource.Clear);
    SetTexttoControl("proClear2", DisplayTextResource.Clear);
    
    SetTexttoControl("spnsignalformat", DisplayTextResource.signalFormat);    
    SetTexttoControl("spnprojectors", DisplayTextResource.Projectors); 
    SetTexttoControl("spanAnalog", DisplayTextResource.analog); 
    SetTexttoControl("spanAES", DisplayTextResource.aes); 
    SetTexttoControl("mbLbl", DisplayTextResource.MB); 
//    SetTexttoControl("spnPSF", DisplayTextResource.psf);
    SetTexttoControl("spnPlayWithError", DisplayTextResource.allowPlayWithError);    
    SetTexttoControl("spnAutoDelete", DisplayTextResource.autoDelete);
    SetTexttoControl("spnBufferSize", DisplayTextResource.bufferSize);
    SetTexttoControl("spnTheaterCode", DisplayTextResource.theatreCode);
    SetTexttoControl("spnScreenCode", DisplayTextResource.screenCode);
    SetTexttoControl("threeDModelbl", DisplayTextResource.threeDMode);
    SetTexttoControl("configFilelbl", DisplayTextResource.threeDConfigFile);
    SetTexttoControl("uploadFpmTxt", DisplayTextResource.upload);
    SetTexttoControl("uploadFpmTxtDisabled", DisplayTextResource.upload);

    SetTexttoControl("spnFeatureValidTill", DisplayTextResource.validTill);
    SetTexttoControl("spnFeatureValidFrom", DisplayTextResource.validFrom);
    SetTexttoControl("spnFeatureName", DisplayTextResource.featureName);
    SetTexttoControl("spnfeatureStatus", DisplayTextResource.status);    
    SetTexttoControl("valid", DisplayTextResource.valid);
    SetTexttoControl("validInFuture", DisplayTextResource.validInFuture);
    

    SetTexttoControl("generalSaveEnabledText", DisplayTextResource.save);
    SetTexttoControl("generalSaveDisabledText", DisplayTextResource.save);
    SetTexttoControl("projectorSaveEnabledText", DisplayTextResource.save);
    SetTexttoControl("projectorSaveDisabledText", DisplayTextResource.save);
//    SetTexttoControl("timeCodeSaveEnabledText", DisplayTextResource.save);
//    SetTexttoControl("timeCodeSaveLblDisabledText", DisplayTextResource.save);
       
       
//    SetTexttoControl("lblTCOffset", DisplayTextResource.TCOffset);
//    SetTexttoControl("lblTCDelay", DisplayTextResource.timecodeDelay);
//    SetTexttoControl("spnTimeCodeEnable", DisplayTextResource.timeCodeEnable);
//    SetTexttoControl("spnFrameRate", DisplayTextResource.frameRate);
//    SetTexttoControl("spnOutputLevel", DisplayTextResource.outputLevel);

    SetTexttoControl("spnSubtitlingLabel", DisplayTextResource.subtitling);
//    SetTexttoControl("spnInternalSubtitle", DisplayTextResource.internal);
    SetTexttoControl("spnProjectorSubtitle", DisplayTextResource.projectorSubtitling);

    SetTexttoControl("cp850IpLabel", (DisplayTextResource.atmosCp + " "));
    SetTexttoControl("cp850ConnectOrDisconnect", (DisplayTextResource.Connect));
}

function EnableTabs(obj)
{
    if (isDLPCinemaDevice)
        EnableDCinemaProjectorTabs(obj);
    else
        EnableECinemaProjectorTabs();
}

function EnableECinemaProjectorTabs() {
    $get(ecinemaprojectortab).style.display = 'block';

    var projectorTabExtender = $find(ecinemaprojectortab);
    var projectorTabs = projectorTabExtender.get_tabs();

    var output = parseInt(_device.Output, 10);    
    projectorTabExtender.set_activeTabIndex(output);
}

function EnableDCinemaProjectorTabs(obj) {
    $get(dcinemaprojectortab).style.display = 'block';

    var projectorTabExtender = $find(dcinemaprojectortab);
    var projectorTabs = projectorTabExtender.get_tabs();

    var enableProjector = obj.options[obj.selectedIndex].value;

    for (var i = 0; i < 4; ++i)
    {
        if(i < enableProjector)
            projectorTabs[i]._show();
        else
            projectorTabs[i]._hide();
    }

    projectorTabExtender.set_activeTabIndex(0);

    SetupDCinemaProjectors(dcinemaprojectortab);
}

function SetupDCinemaProjectors(projectortab)
{
    if(isDLPCinemaDevice)
        SetupDCinemaProjectors(projectortab);   
}

function SetupDCinemaProjectors(projectortab)
{
    if($find(projectortab).get_tabs()[0].get_enabled() == false)
        DisableDCinemaFirstProjectorTabControls(projectortab);
    else 
        OnConnected($find(projectortab).get_activeTab().isConnected);
        
    if (accessDenied && !isManager)
    {
        DisableConnect("c1");
        DisableConnect("reconnect1");

        DisableConnect("c2");
        DisableConnect("reconnect2");
    }
}

function OnGot3DConfigFile(result) 
{
    $get("configFilelbl").style.display = 'block';
    $get("configFile").style.display = 'block';

    $get("configFile").innerText = result;
}

function OnGot3DMode(result) 
{
    $get("threeDModelbl").style.display = 'block';
    $get("threeDMode").style.display = 'block';
    
    $get("threeDMode").innerText = result;
}

function DisableDCinemaFirstProjectorTabControls(projectortab)
{
    $find(projectortab).get_tabs()[0]._hide();
    $get("projectorip1").disabled = true;
    $get("dlpcinemaip1").disabled = true;
    $get("c1").style.display = "none";
    SetTexttoControl($get("disablec1"), GetControlText($get("c1")));
    $get("disablec1").style.display = ""; 
    $get("dc1").style.display = "none"; 
}

function TimeZoneChanged()
{
    if(accessDenied)
        return false;
    
    var zone = $find('zoneextnd');    
    if(zone.selectedText() != zoneText)
        $get('zonesave').style.visibility = 'visible';
    else
        $get('zonesave').style.visibility = 'hidden';
}

function Connect(dlpCinemaIP)
{
    var signalFormat = $find('csSFextnd').get_element().selectedIndex;
//    if(signalFormat == 0)
//    {
//        ConfirmationWindow(DisplayTextResource.invalidSignalFormat, DisplayTextResource.selectSignalFormat, "res/Skins/" + skin + "/Common/information.gif", null, null);
//        return;
//    }

    pi.Show(DisplayTextResource.connecting + "...");

    $find(dcinemaprojectortab).get_activeTab().SignalFormat = signalFormat;
    
    var projectors = GetProjectorInfo();
    var projectorIndex = $find(dcinemaprojectortab).get_activeTabIndex();
    
    for(var i=0; i<projectors.length; ++i)
    {
        if(i != projectorIndex)
            projectors[i].DLPCinemaProjectorIP  = '';
    }

    Qube.Mama.Setup.ConnectProjector(projectors, OnConnected, OnConnectError);    
}

function OnConnected(result)
{
    ClearCursor();
    
    var projectorTab = $find(dcinemaprojectortab);
    
    var dlpcinemaipIndex = projectorTab.get_activeTabIndex() + 1;

    projectorTab.get_activeTab().isConnected = result;
    
    if(result) 
	{
        $get('disablec' + dlpcinemaipIndex).style.display = 'none';
        $get('c' + dlpcinemaipIndex).style.display = '';
        SetTexttoControl("c" + dlpcinemaipIndex, DisplayTextResource.Disconnect);
        $get('dlpcinemaip' + dlpcinemaipIndex).disabled = true;
        $get('dc' + dlpcinemaipIndex).style.display = '';
        $get("imgProjector" + dlpcinemaipIndex).src = "res/Skins/" + skin + "/setup/connect.gif";
    }
    else
    {
        SetTexttoControl("c" + dlpcinemaipIndex, DisplayTextResource.Connect);
        $get('dlpcinemaip' + dlpcinemaipIndex).disabled = false;        
        $get("c" + dlpcinemaipIndex).style.display = '';
        $get('dc' + dlpcinemaipIndex).style.display = 'none';
        $get('disablec1').style.display = 'none';
        $get("imgProjector" + dlpcinemaipIndex).src = "res/Skins/" + skin + "/setup/disconnect.gif";
    }
    
    var projectorIp = $get('dlpcinemaip' + dlpcinemaipIndex).value;
        
    $get("proClear" + dlpcinemaipIndex).style.display = projectorIp != "" && !result ? "" : "none";
}

function dlpCinemaIPConnect(id, dlpcinemaIP, index) {
    if (accessDenied && !isManager)
        return;

    if($get(dlpcinemaIP).value == '' || $get(dlpcinemaIP).value === null)
    {
        ConfirmationWindow(DisplayTextResource.invalidDlpcinemapIP, DisplayTextResource.pleaseEnterValidDlpcinemaIP, "res/Skins/" + skin + "/Common/information.gif", null, null);
        return;
    }
    
    if(GetControlText(id) == DisplayTextResource.Connect)
    {        
        Connect($get(dlpcinemaIP).value);
    }
    else
    {        
        Disconnect();
    }
}

function DisableConnect(link)
{
    var btnConnect = $get(link);
    if(btnConnect != undefined)
        btnConnect.style.display = "none";

    var btnDisconnect = $get("d" + link);    
    if(btnDisconnect != undefined)
        btnDisconnect.style.display = "none";

    var btnDisabelConnect = $get("disable" + link);
    if (btnDisabelConnect != undefined && btnConnect != undefined) 
    {
        SetTexttoControl(btnDisabelConnect, GetControlText(btnConnect));
        btnDisabelConnect.style.display = "";
    }
}

function ECinemaProjectorActiveTabChanged()
{
    var activeTabIndex = $find(ecinemaprojectortab).get_activeTabIndex() + 1;
    
    RedrawDropDownFrame("resolutionextnd".concat(activeTabIndex));
    RedrawDropDownFrame("lensextnd".concat(activeTabIndex));
    RedrawDropDownFrame("aspectextnd".concat(activeTabIndex));    
}

function DCinemaProjectorActiveTabChanged()
{
    var activeTabIndex = $find(dcinemaprojectortab).get_activeTabIndex();

    if (accessDenied && !isManager)
    {
        var connectLabel = "c";
        var reConnectLabel = "reconnect";

        DisableConnect(connectLabel.concat(activeTabIndex + 1));
        DisableConnect(reConnectLabel.concat(activeTabIndex + 1));
    }    
}

function SelectAudioType(selectedType, anotherType)
{
    $get(anotherType).checked = !selectedType.checked;
}

function dlpCinemaIPReConnect()
{
    var projectors = GetProjectorInfo();
    var projectorIndex = $find(dcinemaprojectortab).get_activeTabIndex();
    
    pi.Show(DisplayTextResource.reconnecting + "...");
    
    for(var i=0; i<projectors.length; ++i)
    {
        if(i != projectorIndex)
            projectors[i].DLPCinemaProjectorIP  = "";
    }
    
    Qube.Mama.Setup.ReconnectProjector(projectors, OnConnected, OnConnectError);
}

function OnConnectError(result)
{
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif",
        DisplayTextResource.notAbleToConnect + "\n" + result.get_message(), null);
}

function OnError(result)
{
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function OnGotMFInfoError(result)
{
    RemoveChildNodes("mediafoldersList");
    ResetMFSelection();
    pi.Hide();
}

function OnDisconnectError(result)
{
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function SaveProperties() 
{
    var currentTheatreCodeValue = $find('theaterCode_BID').get_element().value.trim();
    var currentScreenCodeValue = $find('screenCode_BID').get_element().value.trim();

    SaveProperty(currentTheatreCodeValue, PropertyType.TheatreCode, OnSetProperty);
    SaveProperty(currentScreenCodeValue, PropertyType.ScreenCode, OnSetProperty);
}

function SaveProperty(currentValue, propertytype, callback) 
{
    var property = properties.Get(propertytype);

    if (property != null && currentValue != property.Value) {
        ChangeCursor(DisplayTextResource.saving + "...");
        isPropertiesSaved = false;
        property.Value = currentValue;
        Qube.Mama.Catalog.SetProperty(propertytype, property.Value, callback, OnError);
    }
}

function OnSetProperty() 
{
    var theatreCode = properties.Get(PropertyType.TheatreCode);
    var screenCode = properties.Get(PropertyType.ScreenCode);
    
    SetTheatreAndScreenCodeValue(theatreCode.Value, screenCode.Value);
    
    isPropertiesSaved = true;
    if (isBufferSizeSaved && isTimeZoneSaved)
        ClearCursor();
}

function OnGotProperties(result) 
{
    if (result == null || result.length == 0)
        return;

    for (var i = 0; i < result.length; ++i) 
    {
        var propertyValue = result[i];

        if (propertyValue.Property.Scope == Qube.XP.PropertyScope.Global &&
            !properties.IsExists(propertyValue.Property.ID)) 
        {
            properties.Add(result[i]);
            
            switch (propertyValue.Property.ID.toLowerCase()) 
            {
                case PropertyType.TheatreCode:
                    $find('theaterCode_BID').get_element().value = propertyValue.Value;
                    break;
                case PropertyType.ScreenCode:
                    $find('screenCode_BID').get_element().value = propertyValue.Value;
                    break;
//                case PropertyType.LTCOffset:
//                    {                        
//                        $get("trTimeCodeOffset").style.display = "";
//                        var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper($find("tcOffset_BID").get_element());
//                        wrapper.set_Value(propertyValue.Value);
//                    }
//                    break;
//                case PropertyType.LTCDelayInFrames:
//                    {
//                        $get("trTimeCodeDelay").style.display = "";
//                        $find('TCDelay_BID').get_element().value = propertyValue.Value;
//                    }
//                    break;
//                case PropertyType.IsLTCEnabled:
//                    {
//                        var isLTCEnabled = propertyValue.Value == "0" ? false : true;

//                        $get("trTimeCodeEnable").style.display = "";

//                        $find("timeCodeEnable_BID").set_CheckedValue(isLTCEnabled);

//                        DisableTimeCodePropertiesControl(!isLTCEnabled);

//                        EnableControl("divTimeCodeSave", false);
//                    }
//                    break;
//                case PropertyType.LTCFrameRate:
//                    {
//                        $get("trFrameRate").style.display = "";
//                        
//                        $get("cboFrameRate").selectedIndex = propertyValue.Value == "24" ? 0 : propertyValue.Value == "25" ? 1 : 2;
//                    }
//                    break;
//                case PropertyType.LTCAudioLevel:
//                    {
//                        $get("trOutputLevel").style.display = "";
//                        
//                        $find("outputLevel_BID").get_element().value = propertyValue.Value;
//                    }
//                    break;

                case PropertyType.Subtitling:
                    {
                        $get("trSubtitling").style.display = "";
                    
//                        var internalSubtitle = $get("chkInternalSubtitle");
                        var projectorSubtitle = $get("chkProjectorSubtitle");

//                        if (propertyValue.Value == "0")
//                            internalSubtitle.checked = true;
//                        else 
                          if (propertyValue.Value == "1")
                              projectorSubtitle.checked = true;
//                        else if (propertyValue.Value == "2") {
//                            internalSubtitle.checked = true;
//                            projectorSubtitle.checked = true;
//                        }

//                        internalSubtitle.disabled = accessDenied;
                        projectorSubtitle.disabled = accessDenied;
                    }
//                    break;

            }

        }
    }

//    $find(setupMenuTab).get_tabs()[4].set_enabled(properties.IsExists(PropertyType.IsLTCEnabled) && isDLPCinemaDevice);    
}

function DisableTimeCodePropertiesControl(isDisabled) 
{
    if (accessDenied)
        return;
    
    DisableNumericUpDownControl("nudTCDelay_BID", isDisabled);
    $get("cboFrameRate").disabled = isDisabled;
    DisableNumericUpDownControl("nudOutputLevel_BID", isDisabled);
    $find("tcOffset_BID").get_element().disabled = isDisabled;
}

function IsSignalFormatChange(elt) 
{
//    if ($find('csSFextnd')._parentElement.selectedIndex != 2 || elt.selectedIndex == 0)
//        return;

    var projectorTabs = $find(dcinemaprojectortab);

    if (!projectorTabs.get_tabs()[0].isConnected && !projectorTabs.get_tabs()[1].isConnected)
        return;

    var activeTabIndex = projectorTabs.get_activeTabIndex();

    if ((projectorTabs.get_tabs()[0].isConnected == true &&
        (elt.selectedIndex != projectorTabs.get_tabs()[0].SignalFormat)) ||
      (projectorTabs.get_tabs()[1].isConnected == true &&
            (elt.selectedIndex != projectorTabs.get_tabs()[1].SignalFormat))) 
    {
        ShowPopup("invalid signal format selection", "res/Skins/" + skin + "/Common/Warning.gif",
                    String.format(DisplayTextResource.signalFormatChangeWarningMessage, GetControlText(elt.options[elt.selectedIndex])),
                    "Dummy()", "RevertSignalFormat()");
    }
}

function RevertSignalFormat() 
{
    var elt = $find('csSFextnd').get_element();

    elt.selectedIndex = (elt.selectedIndex == 0 ? 1 : 0);
}

function Dummy() {
}

function OnGotFeatures(features) {
    if (features != null) {
        var index = -1;

        for (var i = 0; i < features.length; ++i) {
            if (features[i].IsEnabled) {
                index++;
                CreateFeatureRow(features[i], index);
            }
        }

        var rows = $get("tbFeatures").rows;

        if (index != (rows.length - 1))
            HideRows(index + 1, rows);

    }
    else {
        var rows = $get("tbFeatures").rows;
        HideRows(0, rows);
    }

    pi.Hide();
}

function HideRows(startIndex, rows) {
    for (var j = startIndex; j < rows.length; ++j) 
        rows[j].style.display = "none";
}

function CreateFeatureRow(feature, index) {
    var featureTable = $get("tbFeatures");
    var row = null;
    var column = null;
    var column1 = null;
    var column2 = null;
    var column3 = null;

    if (index <= featureTable.rows.length - 1) {
        row = featureTable.rows[index];
        row.style.display = '';
        column = row.cells[0];
        column1 = row.cells[1];
        column2 = row.cells[2];
        column3 = row.cells[3];
    }
    else {
        row = featureTable.insertRow();

        column = document.createElement("td");
        column.className = "featureStatus";

        var statusImg = document.createElement("img");
        column.appendChild(statusImg);

        column1 = document.createElement("td");
        column1.className = "featureName";

        column2 = document.createElement("td");
        column2.className = "featureValidFrom";

        column3 = document.createElement("td");
        column3.className = "featureValidTill";

        row.appendChild(column);
        row.appendChild(column1);
        row.appendChild(column2);
        row.appendChild(column3);
    }

    var statusSrc = "";
    
    var today = new Date();
    today.setHours(0, 0, 0, 0, 0);

    feature.ValidFrom.setHours(0, 0, 0, 0, 0);
    feature.ValidTill.setHours(0, 0, 0, 0, 0);

    if (feature.ValidFrom > today)
        statusSrc = "res/Skins/".concat(skin, "/Keys/Valid In Future Status.gif");
    else
        statusSrc = "res/Skins/".concat(skin, "/Keys/Valid Status.gif");

    column.getElementsByTagName("img")[0].src = statusSrc;

    SetTexttoControl(column1, feature.Name);
    SetTexttoControl(column2, feature.ValidFrom.format("dd/MM/yyyy hh:mm tt"));
    SetTexttoControl(column3, feature.ValidTill.format("dd/MM/yyyy hh:mm tt"));

    row.className = (row.rowIndex % 2 == 0) ? "rowEven" : "rowOdd";
}

function UploadFpm() {
    pi.Show(DisplayTextResource.uploading + "...");

    var fpmuploadCtrl = $get("fpmupload").contentWindow.document.getElementById("fpmupload");
    if (fpmuploadCtrl.value == '') {
        pi.Hide();
        ShowPopup(DisplayTextResource.invalidPath, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.pleaseSelectTheFpmFilesToBeUpload, null);
        return false;
    }

    var error = $get("fpmupload").contentWindow.document.getElementById('errorMessage');
    error.value = "";

    $get("fpmupload").contentWindow.document.getElementById('formFpmUpload').submit();
    monitorFpm = setInterval("MonitorUploadFpm()", 500);
    return false;
}

function MonitorUploadFpm() {

    var error = $get("fpmupload").contentWindow.document.getElementById('errorMessage');

    if (error && error.value != "") {
        clearInterval(monitorFpm);

        if (error.value != "Success") {
            pi.Hide();
            ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif",
                error.value, null);
            error.value = "";
        }
        else
            Qube.Mama.Usher.GetFeatures(OnGotFeatures, OnError);
    }
}

function MenuActiveTabChanged() 
{
    var menuExtender = $find(setupMenuTab)
    var activeTab = menuExtender.get_activeTab();

    switch (menuExtender.get_activeTabIndex()) 
    {
        case 1:
            {
                if (activeTab.isRedraw != undefined)
                    return;

                activeTab.isRedraw = true;

                if (isDLPCinemaDevice) 
                {
                    NumericUpDownControlAlignment("analog_BID");
                    NumericUpDownControlAlignment("aes_BID");
                    RedrawDropDownFrame('audioSampleRateExtnd');
                    

//                    var tcOffset = properties.Get(PropertyType.LTCDelayInFrames);

//                    if (tcOffset != null)
//                        SetValueToNumericUpDownControl("nudTCDelay_BID", tcOffset.Value);
                }
                else 
                    EnableTabs($get(projectorsCtrlID));
                
                break;
            }        
        case 4:
            {
                if (activeTab.isRedraw != undefined)
                    return;

                activeTab.isRedraw = true;

//                NumericUpDownControlAlignment("nudTCDelay_BID");
//                NumericUpDownControlAlignment("nudOutputLevel_BID");
            }
            break;
    }    
}

function SetValueToNumericUpDownControl(behaviourID, value) 
{
    var behaviourObject = $find(behaviourID);
    behaviourObject._currentValue = value;
    behaviourObject.setCurrentToTextBox(value);
}

function NumericUpDownControlAlignment(behaviourID) 
{
    var behaviourObject = $find(behaviourID);
    var elt = behaviourObject.get_element();
    var left = elt.offsetWidth;
    var top = elt.offsetTop >= 0 ? 1 : elt.offsetTop;

    elt.parentNode.style.verticalAlign = "Top";
    
    behaviourObject._bUp.style.left = left + 'px';
    behaviourObject._bDown.style.left = left + 'px';
    behaviourObject._bUp.style.top = top + 'px';
    behaviourObject._bDown.style.top = (top + behaviourObject._bUp.offsetHeight) + 'px';    
}

function DisableNumericUpDownControl(behaviourID, isDisabled) {
    var behaviourObject = $find(behaviourID);
    
    behaviourObject.get_element().disabled = isDisabled;
    behaviourObject._bUp.disabled = isDisabled;
    behaviourObject._bDown.disabled = isDisabled;
    
}

function RedrawDropDownFrame(extenderId) {
    var extender = $find(extenderId);
    extender._reset = false;
    extender.hover();
}

function SaveGeneralInfo() {
    if (accessDenied)
        return;

    ChangeCursor(DisplayTextResource.saving + "...");

    SaveTimeZone();
    
    if(serialNo != null)
    {
        SaveProperties();

        isBufferSizeSaved = false;

        Qube.Mama.Setup.SaveBufferSize(GetNumericUpDownControlValue($find('bufferSize_BID')), OnBufferSizeSaved, OnError);
    }

    if (isBufferSizeSaved && isTimeZoneSaved && isPropertiesSaved)
        ClearCursor();
}

function OnBufferSizeSaved() {
    isBufferSizeSaved = true;

    _device.BufferSize = GetNumericUpDownControlValue($find('bufferSize_BID'));
    
    if(isPropertiesSaved && isTimeZoneSaved)
        ClearCursor();
}

function SaveProjectorInfo() {
        
    if (isDLPCinemaDevice)
        SaveDBoxSettings();
    else
        SaveEBoxSettings();
}

function AutoDeleteChange(autoDeleteCtrl) {
    if (accessDenied) {
        var autoDeleteExtender = $find("autoDelete");
        autoDeleteExtender.set_CheckedValue(!autoDeleteCtrl.checked);
        return;
    }

    if (serialNo == null) {
        var autoDeleteExtender = $find("autoDelete");
        autoDeleteExtender.set_CheckedValue(!autoDeleteCtrl.checked);
        
        ShowPopup(DisplayTextResource.Error, "res/Skins/".concat(skin, "/Common/error.gif"),
            DisplayTextResource.dalapathiNotFound, null);
        return;
    }
    
    _device.IsAutoDelete = $find("autoDelete").get_CheckedValue();
    
    Qube.Mama.Setup.SaveAutoDelete(autoDeleteCtrl.checked, Dummy, OnAutoDeleteError);
}

function OnAutoDeleteError(errorObj) {
    var autoDeleteExtender = $find("autoDelete");
    autoDeleteExtender.set_CheckedValue(!autoDeleteExtender.get_element().checked);
    
    _device.IsAutoDelete = autoDeleteExtender.get_CheckedValue();
    
    OnError(errorObj);
}

function SetIsLTCEnabled(obj) {

    if (accessDenied) {
        $find("timeCodeEnable_BID").set_CheckedValue(!obj.checked);
        return;
    }

    DisableTimeCodePropertiesControl(!obj.checked);
    EnableTimeCodePropertySave();

    SaveProperty(obj.checked == false ? "0" : "1", PropertyType.IsLTCEnabled, TimeCodeCallback);
}

function EnableTimeCodePropertySave() {

    var ltcOffset = properties.Get(PropertyType.LTCOffset);
    var ltcDelay = properties.Get(PropertyType.LTCDelayInFrames);
    var ltcAudioLevel = properties.Get(PropertyType.LTCAudioLevel);
    var ltcFrameRate = properties.Get(PropertyType.LTCFrameRate);
    
    var frameRate = $get("cboFrameRate");

    EnableControl("divTimeCodeSave", !accessDenied  && $find("timeCodeEnable_BID").get_CheckedValue() && (        
        (ltcOffset != null && $find("tcOffset_BID").get_element().value != ltcOffset.Value) ||
        (ltcAudioLevel != null && GetNumericUpDownControlValue($find("nudOutputLevel_BID")) != ltcAudioLevel.Value) ||
        (ltcDelay != null && GetNumericUpDownControlValue($find("nudTCDelay_BID")) != ltcDelay.Value) ||
        (ltcFrameRate != null && frameRate.options[frameRate.selectedIndex].value != ltcFrameRate.Value)));
}

function LTCAudioLevelOnChange(sender, e) {
    EnableTimeCodePropertySave();
}

function DelayInFramesOnChange(sender, e) {
    EnableTimeCodePropertySave();
}

function FrameRateOnChange(frameRate) {
    EnableTimeCodePropertySave();
}

function TCOffsetOnChange(offset) {
    EnableTimeCodePropertySave();
}

function SaveTimeCodeProperties() {

    var delay = GetNumericUpDownControlValue($find("nudTCDelay_BID"));
    var outputLevel = GetNumericUpDownControlValue($find("nudOutputLevel_BID"));

    SaveProperty($find("tcOffset_BID").get_element().value.trim(), PropertyType.LTCOffset, TimeCodeCallback);

    SaveProperty(delay, PropertyType.LTCDelayInFrames, TimeCodeCallback);

    SaveProperty(outputLevel, PropertyType.LTCAudioLevel, TimeCodeCallback);

    var frameRate = $get("cboFrameRate");
    SaveProperty(frameRate.options[frameRate.selectedIndex].value, PropertyType.LTCFrameRate, TimeCodeCallback);

}

function GetNumericUpDownControlValue(nud) 
{
    var value = nud.get_element().value.trim();
    
    if (value.length == 0 || isNaN(value))
        return nud.get_Minimum();

    value = (value < this._min) ? this._min : value;
    value = (value > this._max) ? this._max : value;

    return value;
}

function TimeCodeCallback() {
    isPropertiesSaved = true;
    EnableControl("divTimeCodeSave", false);
    ClearCursor();    
}

function OnInvalidChar(obj, evntArgs) {
    if ($get("restrictedCharToolTip").style.display == 'none')
        ShowToolTip(true, obj);
}

function ShowToolTip(isVisible, object) {
    if (isVisible) {
        var toolTip = $get("restrictedCharToolTip");
        var bounds = Sys.UI.DomElement.getBounds(object._element);

        SetTexttoControl("restrictedCharToolTip", object._invalidChars.split('').join(' ') + " " + DisplayTextResource.charNotAllowed); 
        
        toolTip.style.left = bounds.x + 'px';
        toolTip.style.top = (bounds.y - 15) + 'px';
        toolTip.style.display = '';
        setTimeout("ShowToolTip(false)", 1000);
    }
    else
        $get("restrictedCharToolTip").style.display = 'none';
}

function Subtitle_OnClick(curObject) {

    var internalSubtitle = $get("chkInternalSubtitle");
    var projectorSubtitle = $get("chkProjectorSubtitle");

    var isInternalSubtitle = internalSubtitle.checked;
    var isProjectorSubtitle = projectorSubtitle.checked;

    var subtitling = (isInternalSubtitle && isProjectorSubtitle) ? 2 : //Enabling both
                        (!isInternalSubtitle && !isProjectorSubtitle) ? -1 : //Disabling both
                        isProjectorSubtitle ? 1 : 0; //Enabling projector or internal

    SaveProperty(subtitling, PropertyType.Subtitling, OnSetProperty);
}

function CreateSampleRateList()
{
    AddOptions('audioSampleRateExtnd', 
        new Array({Value:'0Hz', DisplayText:DisplayTextResource.sameAsInput}, {Value:'48000Hz', DisplayText:'48KHz'}, {Value:'96000Hz', DisplayText:'96KHz'}));    
}

function AudioDelayOffsetChange(elt, args)
{
    elt._elementTextBox.value -= elt._elementTextBox.value%10;
}

function _ClearProjector(projectorIndex){
    $get("proClear" + projectorIndex).style.display = "none";
    $get("dlpcinemaip" + projectorIndex).value = "";
    PageMethods.ClearProjector(projectorIndex);
}

function _InitCp850(cp850ConnectionInfo) {
    var cp850IpElement = $get("cp850Ip");
    cp850IpElement.value = cp850ConnectionInfo.Cp850Ip;
    cp850IpElement.disabled = cp850ConnectionInfo.IsConnected;

    if (cp850ConnectionInfo.IsConnected) {
        SetTexttoControl("cp850ReconnectOrClear", DisplayTextResource.Reconnect);
        SetTexttoControl("cp850ConnectOrDisconnect", DisplayTextResource.Disconnect);
    }
    else {
        if (cp850ConnectionInfo.Cp850Ip.length > 0) {
            SetTexttoControl("cp850ReconnectOrClear", DisplayTextResource.Clear);
            SetTexttoControl("cp850ConnectOrDisconnect", DisplayTextResource.Connect);
        }
        else {
            $get("cp850ReconnectOrClear").style.display = "none";
        }
    }
}

function ReconnectOrClearCp850Ip() {
    var text = GetControlText("cp850ReconnectOrClear");

    if (text == DisplayTextResource.Reconnect) {
        pi.Show(DisplayTextResource.connecting + "...");
        PageMethods.DisconnectCp850(function() {
            PageMethods.ConnectCp850($get("cp850Ip").value,
                                     function() {
                                         ClearCursor();
                                     }, OnConnectError);
        }, OnError);
    }
    else {
        PageMethods.ClearCp850(function() {
            SetTexttoControl("cp850ReconnectOrClear", "");
            $get("cp850Ip").value = "";
            $get("cp850ReconnectOrClear").style.display = "none";
        }, OnError);
    }
}

function DisconnectOrConnectCp850Ip() {
    var text = GetControlText("cp850ConnectOrDisconnect");

    if (text == DisplayTextResource.Connect) {
        var cp850Ip = $get("cp850Ip").value;
        if(cp850Ip.trim().length == 0){
            return;
        }
        
        pi.Show(DisplayTextResource.connecting + "...");

        PageMethods.ConnectCp850(cp850Ip,
                                 function() {
                                     SetTexttoControl("cp850ConnectOrDisconnect", DisplayTextResource.Disconnect);
                                     SetTexttoControl("cp850ReconnectOrClear", DisplayTextResource.Reconnect);
                                     $get("cp850ReconnectOrClear").style.display = "";
                                     $get("cp850Ip").disabled = true;
                                     ClearCursor();
                                 }, OnConnectError);
    }
    else {
        pi.Show(DisplayTextResource.disconnecting + "...");

        PageMethods.DisconnectCp850(function() {
            SetTexttoControl("cp850ConnectOrDisconnect", DisplayTextResource.Connect);
            $get("cp850ReconnectOrClear").style.display = "none";
            $get("cp850Ip").value = "";
            $get("cp850Ip").disabled = false;
            ClearCursor();
        }, OnError);
    }
}


Qube.XP.PropertyScope = function() {
    throw Error.invalidOperation();
}

Qube.XP.PropertyScope.prototype = {
    Global: 0,
    Show: 1
}

Qube.XP.PropertyScope.registerEnum("Qube.XP.PropertyScope", false);

if (typeof (Qube.Mama.GeneralInfo) === 'undefined') {
    var gtc1 = Sys.Net.WebServiceProxy._generateTypedConstructor;
    Qube.Mama.GeneralInfo = gtc1("Qube.Mama.GeneralInfo");
    Qube.Mama.GeneralInfo.registerClass('Qube.Mama.GeneralInfo');
}


