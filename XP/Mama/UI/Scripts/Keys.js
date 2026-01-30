// JScript File
var isWebAddress = false;
var extender;
var selectedRow = new Array();
var keyupload = "keyupload";

var isProgressActive = false;
var isPopupEnabled = false;
var isKeyUpload = false;

var _certTypePopupTimeout = null;
var _isLock = false;

var updateKeyInfoTimer = null;
var fileUploadMonitor = null;

SetStyle();

setTimeout("Main()", 1000);
Sys.Application.add_load(InitializeWaterMarkText);

function InitializeWaterMarkText() {
    PageMethods.GetCertSerialNumbers(OnGotSerialNumbers);
    
    $addHandler(document, "keydown", DeleteIngestedItem);

    $find('namedextnd').Loading();
    Qube.Mama.Usher.GetNamedSpaces(OnGotNamedSpaces, OnErrorDummy);

    UserGroupBasedChanges();
        
    DisableDelete(true);
    
    var imagePath = $find("keyPath_bID");
    var WatermarkText;    
    if(isWebAddress)
        WatermarkText=DisplayTextResource.localWatermark; 
    else
        WatermarkText=DisplayTextResource.networkWatermark;
        
    imagePath.set_WatermarkText(WatermarkText);
    
    keys_SetText();
}

function Main()
{
	UpdateStatus();

	updateKeyInfoTimer = setInterval("UpdateStatus()", 6000);
}

function UserGroupBasedChanges(result)
{
    if (HaveRights())
    {
        $get("addKeyDiv").style.height = "200px";
        $get("divNamedSpaceKey").style.display = "";
        $get("shortnamedelete").style.display = "";
    }
}

function SetStyle()
{
    document.getElementById("keysMenu").className = "MenuFocus";
    var body = document['body'];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/keys/Keys.jpg)";
}

function UpdateStatus() 
{
    PageMethods.GetKeyInfo(OnGotKeyInfo, OnGotKeyInfoError);
}

function OnGotKeyInfoError(errorObj) 
{
    if (isProgressActive) 
    {
        isProgressActive = false;
        
        ChangeWaitToDefault();
    }
}

function ShowUploadError() {
    var error = $get(keyupload).contentWindow.document.getElementById("errorMessage");
    if (error.value != "" && error.value != "Success") {
        ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif",
                            error.value, null);

        error.value = "";
    }
}

function OnGotKeyInfo(result)
{
    var tbody = document.getElementById("addedKeysTableBody");
        
    for(var i = tbody.rows.length - 1; i >= 0; --i)
		tbody.deleteRow(i);

    if (result == null || result.length == 0) 
    {
        if (!isProgressActive)
        {
            ChangeWaitToDefault();

            ShowUploadError();
        }

        return;
    }
	
	var table = document.getElementById("addedKeysTable");
	
    for (var i = 0; i < result.length; ++i)
    {
        var titleRow = document.createElement("tr");
        $addHandler(titleRow, "click", SelectRowActivate);
        titleRow.id = "tr" + result[i].ID;
        
        titleRow.appendChild(CreateStatusField(result[i]));
        
        var tdSelect = document.createElement("td");
        tdSelect.style.width = "16px";
        var chkSelect = document.createElement("input");
        chkSelect.type = "checkbox";
        chkSelect.id = "chk" + result[i].ID;
        chkSelect.disabled = (result[i].ID == '00000000-0000-0000-0000-000000000000');
        
        tdSelect.appendChild(chkSelect);
        titleRow.appendChild(tdSelect);
                
	    titleRow.appendChild(CreateNameField(result[i]));
	    titleRow.appendChild(CreateStartDateField(result[i]));
	    titleRow.appendChild(CreateEndDateField(result[i]));
	    
	    titleRow.setAttribute("KdmId", result[i].ID)
	    
	    titleRow.style.cursor = "default";
	    	    	    	    
	    tbody.appendChild(titleRow);
    }

    ReArrangeAlternateColor();

    if (!isProgressActive)
    {
        ChangeWaitToDefault();

        ShowUploadError()
    }
}

function CreateStatusField(result)
{
	var status = document.createElement("td");
	
    status.align = "center";
    status.width = 50 + 'px';
    
    status.appendChild(CreateStatusImg(result.Status));
    
    return status;
}

function CreateStatusImg(status)
{
	var img = document.createElement("img");
	
	//TODO: add cases for other statuses 
	switch(status)
	{
		case "valid":
			img.src = GetValidStatusImgSrc();
			break;
		
		case "validinfuture":
			img.src = GetValidInFutureStatusImgSrc();
			break;
		
		case "expired":
			img.src = GetExpiredStatusImgSrc();
			break;
			
		default :
		    img.src = GetNoKeyStatusImgSrc();
	}
	
	return img;
}

function GetValidStatusImgSrc()
{
    return "res/Skins/" + skin + "/keys/Valid Status.gif";
}

function GetValidInFutureStatusImgSrc()
{
    return "res/Skins/" + skin + "/keys/Valid In Future Status.gif";
}

function GetExpiredStatusImgSrc()
{
    return "res/Skins/" + skin + "/keys/Expired Status.gif";
}

function GetNoKeyStatusImgSrc()
{
    return "res/Skins/" + skin + "/keys/Nokey Status.gif";
}

function CreateNameField(result)
{
	var name = document.createElement("td");
    name.align = "center";
    	    	               
    var span = document.createElement("span");
    span.className = "titleName";
    span.setAttribute("title", result.Name);
    SetTexttoControl(span, result.Name);
    	    	    
    name.appendChild(span);
    
    return name;
}

function CreateStartDateField(result)
{
    var startDate = document.createElement("td");
    startDate.align = "center";
    
    var span = document.createElement("span");
    span.className = "keysStartDate";
    
    SetTexttoControl(span, result.ValidFrom);
    
    if(result.Status == "nokey")
        SetTexttoControl(span, "---");
    
    startDate.appendChild(span);
    
    return startDate;
}

function CreateEndDateField(result)
{
    var endDate = document.createElement("td");
    endDate.align = "center";
    
    var span = document.createElement("span");
    span.className = "keysEndDate";
    SetTexttoControl(span, result.ValidTill);
    
    if(result.Status == "nokey")
        SetTexttoControl(span, "---");
        
    endDate.appendChild(span);
    
    return endDate;
} 

function OnAddKeyClicked()
{
    var addKeyDiv = document.getElementById("addKeyDiv");
       
    addKeyDiv.style.display = addKeyDiv.style.display == "block" ? "none" : "block";

    if (addKeyDiv.style.display == "block" && HaveRights())
    {
        $get("addKeyDiv").style.height = "200px";
        $get("divNamedSpaceKey").style.display = "";
        $get("shortnamedelete").style.display = "";
    }
    
    if(addKeyDiv.style.display == "block")
	{
        UpdateDropDownExtenderBounds();
    }
        
    SetWaterMarkText();
    return false;
    
}
    
function HandleUsernamePassword(userName, password)
{
    userName = document.getElementById(userName);
    password = document.getElementById(password);
    
    var dummyPassword = document.getElementById(password.watermarkControlId);
    userName.disabled = !isWebAddress;
    
    if(password)
        password.disabled = !isWebAddress;
        
    if(dummyPassword)
        dummyPassword.disabled = !isWebAddress;
}

function OnLocalClicked(userName, password, uploadKey)
{
    isWebAddress = false;
    $get(uploadKey).style.display = 'none';
    SetTexttoControl($get("getKeyTxt"), DisplayTextResource.getKey);
    $find('keyPath_bID').get_element().style.display = '';    
    HandleUsernamePassword(userName, password);
	SetWaterMarkText();
	ClearCredentials();
	EnableNamedSpaceSaveInof(true);
	UpdateDropDownExtenderBounds();
}

function OnWebClicked(userName, password, uploadKey)
{
    isWebAddress = true;
    SetTexttoControl($get("getKeyTxt"), DisplayTextResource.getKey);
    $get(uploadKey).style.display = 'none';
    $find('keyPath_bID').get_element().style.display = '';    
    HandleUsernamePassword(userName, password);
	SetWaterMarkText();
	ClearCredentials();
	EnableNamedSpaceSaveInof(true);
	UpdateDropDownExtenderBounds();
}

function SetWaterMarkText()
{

    var extender = $find('keyPath_bID'); 
    var pathSelection;
    if(extender == null)
        return;
    
    if(isWebAddress)
    {
        extender.WatermarkText=DisplayTextResource.networkWatermark; 
         pathSelection = document.getElementById("webKey");
    }   
    else
    {
        extender.WatermarkText=DisplayTextResource.localWatermark;
        pathSelection = document.getElementById("localKey");
    }
    extender.set_WatermarkText(extender.WatermarkText); 
    
    var imagePath = document.getElementById("ctl00_ContentPlaceHolder_keyPath");
       
    imagePath.value='';
    if (document.getElementById("addKeyDiv").style.display != "none")
    {
        imagePath.focus();    
        pathSelection.focus();
    }

}

function GetKeys() 
{
    ChangeDefaultToWait(DisplayTextResource.wait + "...");
    isProgressActive = true;
   
    extender = $find('key_extender'); 
    
    var keyPath = TrimString($find('keyPath_bID').get_Text());
    
    if($get('uploadKey').checked)
    {
        var keyuploadCtrl = $get(keyupload).contentWindow.document.getElementById("keyupload");
        if (keyuploadCtrl.value == '') 
        {
            ChangeWaitToDefault();
            ShowPopup(DisplayTextResource.invalidUploadKey, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.pleaseSelectTheKDMFilesToBeIngest, null);
            return false;
        }

        clearInterval(updateKeyInfoTimer);

        $get(keyupload).contentWindow.document.getElementById("errorMessage").value = "";
        $get(keyupload).contentWindow.document.getElementById('formKeyUpload').submit();

        fileUploadMonitor = setInterval("FileUploadMonitor()", 1000);

        return false;
    }

    var keyUserName = TrimString($find('username_bID').get_Text());
    var keyPassword = TrimString($get("password").value);
    
    Qube.Mama.Usher.IsFile(keyPath, OnGotFileType)
    
    return false;
}

function OnGotFileType(result)
{
    var keyPath = TrimString($find('keyPath_bID').get_Text());
    
    var nickName = null;
    var saveFlag = false;

    if (HaveRights())
    {
        nickName = TrimString($find("waterNamedExtnd").get_Text());
        saveFlag = $get("chkNamedIngest").checked;
    }
    
    var userName = TrimString($find('username_bID').get_Text());
    var password = TrimString($get("password").value);
    
    if(userName == "" || !isWebAddress)
        userName = null;
    
    if(password == "" || !isWebAddress)
        password = null;
        
    if(result)
    {
        $find('keyPath_bID').get_element().value = "";
        Qube.Mama.Usher.IngestKeyFrom(keyPath, userName, password, OnRequestCompleted, OnError);
    }
    else
    {        
        Qube.Mama.Usher.GetIngestableKeys(keyPath, userName, password, nickName, saveFlag, OnGotKeys, OnError);
    }
}

function OnGotKeys(result)
{
    Qube.Mama.Usher.GetNamedSpaces(OnGotNamedSpaces, OnErrorDummy);

    extender = $find('key_extender'); 
    var keysList = document.getElementById("keysList");            
    RemoveChildNodes("keysList");

    if (result.length <= 0) 
    {
        isProgressActive = false;
        ChangeWaitToDefault();

        ShowPopup(DisplayTextResource.ingest, "res/Skins/" + skin + "/Common/warning.gif", DisplayTextResource.noEntitiesFound, null);

        return;
    }

    $get('chkIngestNew').checked = true;

    for (var i = 0; i < result.length; ++i) {
        var tr = document.createElement("tr");

        var td1 = document.createElement("td");
        td1.className = 'checkCell';

        var keyCheck = document.createElement("input");

        keyCheck.id = "check" + (i + 1);
        keyCheck.type = "checkbox";
        keyCheck.className = "check";
        keyCheck.onclick = function(event) { OnChecked(event) };

        td1.appendChild(keyCheck);

        var td2 = document.createElement("td");
        td2.className = "cell"

        var spanElement = document.createElement("span");

        var titleName = result[i].TitleName;

        var trimedText = GetTrimedText(titleName, 500, "composition");

        spanElement.setAttribute("title", titleName)

        if (trimedText != titleName) {
            trimedText = trimedText + "...";
        }

        SetTexttoControl(spanElement, trimedText);
        spanElement.className = "composition";

        td2.appendChild(spanElement);

        tr.appendChild(td1);
        tr.appendChild(td2);

        tr.className = (i % 2 == 0) ? "rowStyleIngest rowEven" : "rowStyleIngest rowOdd";

        tr.keyInfo = result[i];

        keysList.appendChild(tr);
    }

    CheckKeys();

    isProgressActive = false;
    ChangeWaitToDefault();
    extender.show();
}

function CheckAll(source, keylist) {
    if (source.checked)
        CheckKeys(keylist);
    else
        UnCheckKeys(keylist);
}

function OnChecked(e) {
    if (e == undefined)  //For IE
        e = event;

    var parent = GetTargetElement(e).parentNode.parentNode.parentNode;

    $get('chkIngestNew').checked = !IsAnyKeyUnchecked();
}

function IsAnyKeyUnchecked() {
    var keyList = document.getElementById('keysList').getElementsByTagName('input');

    for (var i = 0; i < keyList.length; i++) {
        if (keyList[i].checked == false)
            return true;
    }
    return false;
}

function UnCheckKeys() {
    var keyList = document.getElementById('keysList').getElementsByTagName('input');

    for (var i = 0; i < keyList.length; i++)
        keyList[i].checked = false;
}

function CheckKeys() {
    var keyList = document.getElementById('keysList').getElementsByTagName('input');

    for (var i = 0; i < keyList.length; i++)
        keyList[i].checked = true;
}

function IngestKeys()
{
    ChangeDefaultToWait(DisplayTextResource.wait + "...");
    isProgressActive = true;
    
    var keyList = document.getElementById("keysList");

    var keys = new Array();

    for (var i = 0; i < keyList.rows.length; i++) 
    {
        if (keyList.rows[i].cells[0].childNodes[0].checked)
            Array.add(keys, keyList.rows[i].keyInfo);
    }

    if (keys.length == 0) 
    {
        OnRequestCompleted();
        return;
    }
    
    
    var userName = TrimString($find('username_bID').get_Text());
    var password = TrimString($get("password").value);
    
    if(userName == "" || !isWebAddress)
        userName = null;
    
    if(password == "" || !isWebAddress)
        password = null;
    
    Qube.Mama.Usher.IngestKeys(keys, userName, password, OnRequestCompleted, OnError);
        
    ClearCredentials();
}

function TrimString(string2Trim)
{
    if(string2Trim == null)
        return "";
        
    string2Trim = string2Trim.replace( /^\s+/g, "" );
    return string2Trim.replace( /\s+$/g, "" );
}

function CancelIngest()
{
    ClearCredentials();
    ChangeWaitToDefault();
}

function ClearCredentials()
{
    ClearUsernamePassword();
    ClearNamedSpaceInfo();    
    
    $find("namedextnd").SelectByText('');
              
    SetWaterMarkText();   
}

function ChangeDefaultToWait(displayText)
{
    pi.Show(displayText)
}

function ChangeWaitToDefault()
{
    pi.Hide();
}

function ReArrangeAlternateColor()
{
    var alternate = false;
    var rows = $get("addedKeysTable").rows;
    
    for(var i=0; i<rows.length; i++)
    {
        rows[i].className = alternate ? "titleRow rowOdd" : "titleRowBlue rowEven";
        alternate = !alternate;
        $get("chk" + rows[i].getAttribute("KdmId")).checked = false;
    }

    if (selectedRow.length != 0)
    {
        for(var i = 0; i < rows.length; i++)
        {
            if(Array.contains(selectedRow, rows[i].getAttribute("KdmId")))
            {
                rows[i].className = "mediaSelectedRow";
                $get("chk" + rows[i].getAttribute("KdmId")).checked = true;
            }
        }
    }
    
    $get("chkSelectAll").checked = IsAllChecked();
    
    DisableDelete(selectedRow.length == 0);
}

function IsAllChecked()
{
    var chkCollection = $get("addedKeysTableBody").getElementsByTagName("INPUT");
    var enableChkColl = 0;
    for(var i = 0; i < chkCollection.length; i++)
        if(!chkCollection[i].disabled)
            enableChkColl++;
    
    return (enableChkColl == selectedRow.length && selectedRow.length > 0);
}

function ConfirmDeleteKDM()
{
    if (selectedRow.length == 0 || !HaveRights())
        return false;

    ShowPopup(DisplayTextResource.deleteConfirmation, "res/Skins/" + skin + "/Common/Information.gif",
        DisplayTextResource.deleteConfirmationMessage,
        "DeleteKDM()"); 
    return false;        
}

function DeleteKDM() 
{
    ChangeDefaultToWait(DisplayTextResource.deleting + "...");
    isProgressActive = true;
    
    Qube.Mama.Usher.DeleteKDMs(selectedRow, OnRequestCompleted, OnError);
    Array.clear(selectedRow);
    DisableDelete(true);
    $get("chkSelectAll").checked = false;    
 }
 
function ShowPopup(title, iconImgPath, text, okScript)
{
    isPopupEnabled = true;
    ConfirmationWindow(title, text, iconImgPath, okScript, cancelPopUp)
}

function cancelPopUp()
{
    isPopupEnabled = false;
}    

function keys_SetText()
{
    SetTexttoControl("keys", DisplayTextResource.keys);
    SetTexttoControl("status", DisplayTextResource.status);
    SetTexttoControl("composition", DisplayTextResource.composition);
    SetTexttoControl("startdate", DisplayTextResource.startDate);
    SetTexttoControl("enddate", DisplayTextResource.endDate);
    SetTexttoControl("valid", DisplayTextResource.valid);
    SetTexttoControl("validInFuture", DisplayTextResource.validInFuture);
    SetTexttoControl("expired", DisplayTextResource.expired);
    SetTexttoControl("noKey", DisplayTextResource.noKey);
//    SetTexttoControl("downloadText", DisplayTextResource.downloadText);
    SetTexttoControl("keyaddTxt", DisplayTextResource.addKey);
    SetTexttoControl("keydeleteTxt", DisplayTextResource.deleteTxt);    
    SetTexttoControl("ok_a", DisplayTextResource.ok);
    SetTexttoControl("cncl_a", DisplayTextResource.cancel);
    SetTexttoControl("uploadSpan", DisplayTextResource.upload); 
    SetTexttoControl("keysLocal", DisplayTextResource.local); 
    SetTexttoControl("keysWeb", DisplayTextResource.network); 
    SetTexttoControl("keyUserNameLabel", DisplayTextResource.username); 
    SetTexttoControl("keyPasswordLabel", DisplayTextResource.password);
    SetTexttoControl("spnDeleteKeyDisabled", DisplayTextResource.deleteTxt);
    SetTexttoControl("spnIngestNew", DisplayTextResource.kdmPopupTitle);    
    SetTexttoControl("lblNamedIngest", DisplayTextResource.saveLocationInfo);
    SetTexttoControl("spnNamedSpace", DisplayTextResource.namedSpace);
    SetTexttoControl("getKeyTxt", DisplayTextResource.getKey);
    
       
    var username = $find("username_bID")
    
    if(username != null)
        username.set_WatermarkText(DisplayTextResource.enterUsername);
}

function OnUploadClick(userName, password, uploadKey)
{
    SetTexttoControl($get("getKeyTxt"), DisplayTextResource.upload);
    $find('keyPath_bID').get_element().style.display = 'none';
    $get(uploadKey).style.display = 'block';
    isWebAddress = false;
    HandleUsernamePassword(userName, password);
    ClearUsernamePassword();
    ClearNamedSpaceInfo();
    EnableNamedSpaceSaveInof(false);
    UpdateDropDownExtenderBounds();
}

function DisableDelete(isDisable)
{
    if (HaveRights())
    {
        $get("deleteKeyDisabled").style.display = isDisable ? "block" : "none";
        $get("deleteKey").style.display = isDisable ? "none" : "block";
        return true;
    }
    return false;
}

function OnGotNamedSpaces(result)
{
    $find('namedextnd').Generate(result, OnSelectNamedKeys);
    $find("namedextnd").SelectByText('');
    pi.Hide();    
}

function OnSelectNamedKeys(e)
{
    ChangeDefaultToWait(DisplayTextResource.wait + "...");
    isProgressActive = true;
    
    Qube.Mama.Usher.GetNamedSpaceByID($find('namedextnd').selectedValue(), OnGotNamedkey, OnError)
}

function OnGotNamedkey(result)
{
    var selectedValue = $find('namedextnd').selectedValue();
    
    if(result.UserName == "" || result.UserName == null)
    {
        $get("localKey").checked = true;        
        isWebAddress = false;
        $get("localKey").click();
    }
    else    
    {
        $get("webKey").checked = true;
        isWebAddress = true;
        $get("webKey").click();
    }
    
    $find("keyPath_bID").set_Text(result.Path);

    if (HaveRights())
    {
        $get("chkNamedIngest").checked = true;
        $find("waterNamedExtnd").set_Text(result.Name);
    }
    
    $find("username_bID").set_Text(result.UserName);
    $get("password").value = result.Password;    
    WaterMarkTextBlur($get("password"));
    $find('namedextnd').Select(selectedValue);

    isProgressActive = false;
    ChangeWaitToDefault();
}

function DeleteShortName()
{
    var selectedValue = $find("namedextnd").selectedValue();
    if(selectedValue == "" || selectedValue == null)
    {
        ShowPopup(DisplayTextResource.invalidSelection, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.pleaseSelectNamedSpaceForDeletion, null);
        return false;
    }

    ShowPopup(DisplayTextResource.deleteConfirmation, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.deleteConfirmationMessageGeneral, DeleteConfirmation);
    
    return false;
}

function DeleteConfirmation()
{
    pi.Show(DisplayTextResource.wait + "...");

    Qube.Mama.Usher.DeleteNamedSpaceByID($find("namedextnd").selectedValue(), OnDeleted, OnErrorDummy);
}

function OnDeleted(result)
{
    ClearCredentials();
    Qube.Mama.Usher.GetNamedSpaces(OnGotNamedSpaces, OnErrorDummy);
}

function ClearUsernamePassword()
{
    $find("username_bID").set_Text('');
    var password = $get("password");
    password.value = '';
    WaterMarkTextBlur(password);
}

function ClearNamedSpaceInfo()
{
    if (HaveRights())
    {
        $get("chkNamedIngest").checked = false;
        $find("waterNamedExtnd").set_Text("");        
    }
}

function EnableNamedSpaceSaveInof(isEnable)
{
    if (HaveRights())
    {        
        $get("addKeyDiv").style.height = isEnable ? "200px" : "160px";
        $get("divNamedSpaceKey").style.display = isEnable ? "" : "none";
    }
}

function SelectAll(obj)
{
    Array.clear(selectedRow);
    
    var chkCollection = $get("addedKeysTableBody").getElementsByTagName("INPUT");
    var checkedStatus = obj.checked;
    
    if(obj.checked)
    {        
        for(var i=0; i<chkCollection.length; i++)
        {
            if(!chkCollection[i].disabled)
            {
                chkCollection[i].checked = true;
                Array.add(selectedRow, chkCollection[i].id.substr(3));
            }
        }
    }
    else
    {
        for(var i=0; i<chkCollection.length; i++)
            chkCollection[i].checked = false;        
    }
    
    ReArrangeAlternateColor();
    
    obj.checked = checkedStatus;
}

function UpdateDropDownExtenderBounds()
{
    var extender = $find('namedextnd');
        extender._reset = true;
    var element = extender.get_element();
        element.style.position = "absolute";            
        element.style.left = ($get("addKeyDiv").offsetWidth - 335) + "px";
        element.style.top = "6px";
        extender._isOver = false;
        extender.hover();
}

function SelectRowActivate(e)
{        
    var rowclicked = e.target;
        
    while(1)
    {
        if(rowclicked.tagName.toLowerCase() == 'tr')
            break;

        rowclicked = rowclicked.parentNode;
    }
    
    var isChecked = null;
    
    if(e.target.type == "checkbox")
        isChecked = !e.target.checked;
    else if(!rowclicked.getElementsByTagName("INPUT")[0].disabled)
    {
        if(e.ctrlKey)
            isChecked = rowclicked.getElementsByTagName("INPUT")[0].checked;
        else if(e.shiftKey && selectedRow.length > 0)
        {
            var lastSelectedItem = selectedRow[selectedRow.length - 1];
            Array.clear(selectedRow);
            Array.add(selectedRow, lastSelectedItem);
            var lastSelectedRowIndex = $get("tr" + lastSelectedItem).rowIndex;            
            var startIndex = 1;
            var endIndex = 1;
            
            if(lastSelectedRowIndex > rowclicked.rowIndex)
            {
                startIndex = rowclicked.rowIndex;
                endIndex = lastSelectedRowIndex;
            }
            else
            {
                startIndex = lastSelectedRowIndex;
                endIndex = rowclicked.rowIndex;
            }
            
            var rows = $get("addedKeysTable").rows;
                        
            for(var i=(startIndex + 1); i<=(endIndex - 1); i++)
                Array.add(selectedRow, rows[i].getAttribute("KdmId"));
                        
            isChecked = false;
        }
        else
        {
            Array.clear(selectedRow)
            isChecked = false;
        }            
    }
    else
        return;
    
    if(isChecked)
        Array.remove(selectedRow, rowclicked.getAttribute("KdmId"));
    else
        Array.add(selectedRow, rowclicked.getAttribute("KdmId"));
    
    ReArrangeAlternateColor();
}

function DeleteIngestedItem(e)
{
    if (e.keyCode == Sys.UI.Key.del && !isPopupEnabled && HaveRights())
        ConfirmDeleteKDM();
}

function OnError(result)
{
    isProgressActive = false;
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function OnRequestCompleted(result) 
{
    isProgressActive = false;
    setTimeout("UpdateStatus()", 100);
}

function OnKeyUp(ctrl) {
    $get("chkNamedIngest").checked = (ctrl.value.trim() != "");
}

function FileUploadMonitor() {
    if ($get(keyupload).contentWindow.document.getElementById("keyupload")) {
        isProgressActive = false;
        clearInterval(fileUploadMonitor);
        
        setTimeout("UpdateStatus()", 1000);
        
        updateKeyInfoTimer = setInterval("UpdateStatus()", 6000);
    }
}

function OnGotSerialNumbers(serialNumbers) {
    var div = $get("certDownloads");
    if (serialNumbers.length > 0) {
        var spnDownloads = document.createElement("SPAN");
        spnDownloads.setAttribute("class", "downloadCertificateLabel");
        SetTexttoControl(spnDownloads, DisplayTextResource.downloadText + "  ");

        div.appendChild(spnDownloads);

        for (var i = 0; i < serialNumbers.length; i++) {
            var certDownLink = document.createElement("A");
            certDownLink.id = serialNumbers[i];
            certDownLink.setAttribute("class", "downloadCertificateLabel");
            SetTexttoControl(certDownLink, serialNumbers[i]);
            $addHandler(certDownLink, "mouseover", ShowCertTypePopup);
            
            $addHandler(certDownLink, "mouseout", function(e) {
                if (e.target.className != 'downloadCertificateLabel') return;

                _certTypePopupTimeout = setTimeout(Function.createDelegate(this, function(e) {
                    HideCertTypePopup.apply(this, [this]);
                }), 50);
            });

            div.appendChild(certDownLink);

            if (i < serialNumbers.length - 1) {
                var spnPipeSymbol = document.createElement("SPAN");
                spnPipeSymbol.setAttribute("class", "downloadCertificateLabel");
                SetTexttoControl(spnPipeSymbol, " | ");
                div.appendChild(spnPipeSymbol);
            }
        }
    }
}

function ShowCertTypePopup(e) {
    if (_isLock || e.target == null || !e.target.id ||
        e.target.tagName.toLowerCase() != "a" ||
        e.target.getElementsByTagName("DIV").length > 0)
        return;

    _isLock = true;

    var certType = document.createElement("DIV");
    certType.className = "cert-type chat-bubble";
    certType.id = e.target.id + "-div";

    var targetLeft = e.target.offsetLeft;
    var targetWidth = e.target.offsetWidth;
    var certTypeWidth = 116;

    certType.style.left = (targetLeft + targetWidth - certTypeWidth) + 'px';

    $addHandler(certType, "mouseover", function() { clearTimeout(_certTypePopupTimeout); });
    $addHandler(certType, "mouseout", function() {
        _certTypePopupTimeout = setTimeout(Function.createDelegate(this, function() {
            HideCertTypePopup.apply(this, [e.target]);
        }), 50);
    });
    
    var linkSha256 = document.createElement("A");
    var linkSha1 = document.createElement("A");

    linkSha256.setAttribute("href", "../../Mami/Dispatch/CertChain.aspx?type=SHA256&serial=" + e.target.id);
    linkSha1.setAttribute("href", "../../Mami/Dispatch/CertChain.aspx?type=SHA1&serial=" + e.target.id);

    SetTexttoControl(linkSha256, "SHA256");
    SetTexttoControl(linkSha1, "SHA1");

    certType.appendChild(linkSha256);
    certType.appendChild(document.createElement("BR"));
    certType.appendChild(linkSha1);
    e.target.appendChild(certType);

    _isLock = false;
}

function HideCertTypePopup(ele) {
    var popup = $get(ele.id + "-div");

    if (popup != null) {
        ele.removeChild(popup);
    }
}