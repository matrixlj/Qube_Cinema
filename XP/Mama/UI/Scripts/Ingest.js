// Globals. Yuck!

var g_maxProgressBarWidth = 180;
var isWebAddress = false;
var isProgressActive = false;
var extender;

var jobs = new Array();
var jobIds = new Array();

SetStyle();
setTimeout("Main()", 500);

Sys.Application.add_load(Ingest_Load);

function Ingest_Load()
{   
    $find('namedextnd').Loading();
    Qube.Mama.Usher.GetNamedSpaces(OnGotNamedSpaces, OnErrorDummy);
    
    var imagePath = $find("ingestPath_bID");
    
    var WatermarkText;    
    if(isWebAddress)
        WatermarkText= DisplayTextResource.localWatermark; 
    else
        WatermarkText= DisplayTextResource.networkWatermark;
        
    if (imagePath != null)
        imagePath.set_WatermarkText(WatermarkText);    
        
    ingest_SetText();
}

function Main()
{
	UpdateJobs();
}

function SetStyle()
{
    document.getElementById("ingestMenu").className = "MenuFocus";
    var body = document['body'];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Ingest/Ingest.jpg)";    
}

function UpdateJobs() 
{
    PageMethods.GetJobs(OnGotJobs, OnGotJobsError);    
}

function CreateJobStatusField(job)
{
	var jobStatus = document.createElement("td");
	
    jobStatus.align = "center";
    jobStatus.width = 45 + 'px';
    var statusImg = document.createElement("img");
    statusImg.id = 'progressStatusImg' + job.ID;
    statusImg.src = GetJobStatusImage(job.Status);
    
    jobStatus.appendChild(statusImg);
    
    return jobStatus;
}

function CreateJobNameField(job)
{
	var jobName = document.createElement("td");
    jobName.align = "center";
    jobName.style.paddingRight = "10px";
    jobName.style.width = "370px";
    	    	               
    var span = document.createElement("span");
    span.className = "jobName";
    span.setAttribute("title", job.Name);

    var trimedText = GetTrimedText(job.Name, 340, "jobName");

    if (trimedText != job.Name) {
        trimedText = trimedText.concat("...");
    }
    
    SetTexttoControl(span, trimedText);
    	    	    
    jobName.appendChild(span);
    
    return jobName;
}

function CreateJobProgressField(job)
{
	var jobProgress = document.createElement("td");
	jobProgress.className = "progressTD";
	jobProgress.id = 'progressInfoColumn' + job.ID;
	
	var vProgressImg = CreateJobProgressImg(job, "verifyingProgressBar",
	                            (job.VerificationProgress * g_maxProgressBarWidth));
	vProgressImg.id = 'integrity' + job.ID;
	vProgressImg.src = "res/Skins/" + skin + "/Ingest/IntegrityProgress.jpg";
	                            
	jobProgress.appendChild(vProgressImg);
	
    var progressImg = CreateJobProgressImg(job, "progressBar",
                           (parseFloat(job.Progress) - job.VerificationProgress) * g_maxProgressBarWidth);

    progressImg.id = 'ingest' + job.ID;
    progressImg.src = "res/Skins/" + skin + "/Ingest/IngestProgress.jpg";
    
    jobProgress.appendChild(progressImg);
    
    jobProgress.appendChild(CreateJobProgressLabel(job));

    jobProgress.appendChild(CreateJobStatusLabel(job));
    
    return jobProgress;
}

function CreateJobProgressImg(job, className, value) 
{
    var img = document.createElement("img");
    img.className = className;

    var barWidth = value / 100;
    img.style.width = barWidth + 'px';

    img.vspace = 5 + 'px';

    return img;
}

function CreateJobStatusLabel(job) 
{
    var span = document.createElement("span");

    span.className = "progressInfoLabel";
    span.id = 'progressStatus' + job.ID

    if (job.Status == "Completed" || job.Status.indexOf("Error") > -1 ||
	        job.Status == "IntegrityFailed" || job.Status.indexOf("Cancelled") > -1) {
        SetTexttoControl(span, eval("DisplayTextResource." + job.Status));
    }
    else if (job.Status == "VerifyingIntegrity" || job.Status == "IntegrityVerificationSuspended" ||
                job.Status == "Transferred")
        SetTexttoControl(span, eval("DisplayTextResource." + job.Status) + "...");
    else
        SetTexttoControl(span, "");

    return span;
}

function CreateJobProgressLabel(job)
{
	var span = document.createElement("span");

	span.className = "progressInfoLabel";
	span.id = 'progress' + job.ID;
	
	if (job.Status == "Completed" || job.Status.indexOf("Error") > -1 ||
	        job.Status == "IntegrityFailed" || job.Status.indexOf("Cancelled") > -1) 
    {
        span.style.display = 'none';
	}
	else if (job.Status == "VerifyingIntegrity" || job.Status == "IntegrityVerificationSuspended")
	    SetTexttoControl(span, parseInt(job.VerificationProgress.toString(), 10) + '%');
	else
	    SetTexttoControl(span, job.Progress.toString() + "%");
	
	return span;
}

function IsJobSuspended(job)
{
    /*Earlier when IV jobs are queued (Transferred state), 'Suspend' button was shown and because of it we couldn't able to resume. 
      We had to click 'Suspend' button and it will change to 'Resume' and then 
      we have to click it to immediately resume that IV job. 
      Now the UI is modified to show 'Resume' button even if the IV job is queued (Transferred state).
      this allows to click 'Resume' button and immediately resume/start the IV.
      thereby we consider transferred state as suspended*/

	return (job.Status == "Suspended" || 
	        job.Status == "IntegrityVerificationSuspended" ||
	        job.Status == "Transferred");
}

function IsJobProgressing(job)
{
	switch(job.Status)
	{
		case "Queued":
		case "Transferring":
		case "TransientError":
		case "VerifyingIntegrity":
			return true;
	}
	
	return false;
}

function CreateJobControlButton(job, imgSrc, onClick, displayText)
{
	var td = document.createElement("td");
    td.style.cursor = 'pointer';
    var img = document.createElement("img");	
	
	img.style.cursor = "pointer";
	img.src = imgSrc();
	img.hspace = 2 + 'px';		

	var h2 = document.createElement("span");
	h2.id = ((displayText == DisplayTextResource.cancel) ? 'cancel' : 'susResButton') + job.ID;
	SetTexttoControl(h2, displayText);
	h2.className = 'ingestControl buttonEnabledText';

	if (displayText == DisplayTextResource.cancel && browserName == "Microsoft Internet Explorer")
	    td.style.paddingRight = "12px";
	
	h2.style.paddingTop = "2px";
	h2.style.textAlign = 'center';    	
	h2.style.width = '102px';
	h2.style.position = 'absolute';

	td.onclick = function() { onClick(job) };

	td.appendChild(h2);
	td.appendChild(img);
	
	td.style.width = "102px";

	td.id = ((displayText == DisplayTextResource.cancel) ? 'cancel' : 'susRes') + job.ID;

	return td;	    	    
}

function OnCancelJob(job) 
{
    var selectedJob = jobs[Array.indexOf(jobIds, job.ID)]
    if (!selectedJob.IsSentRequest) {
        selectedJob.IsSentRequest = true;
        Qube.Mama.Usher.CancelJob(job.ID, UpdateJobs, OnError);
    }
}

function OnAddIngestClicked()
{
	var addIngestDiv = document.getElementById("addIngestDiv");
	addIngestDiv.style.display = addIngestDiv.style.display == "block" ? "none" : "block";

	if (addIngestDiv.style.display == "block" && HaveRights())
    {
        $get("addIngestDiv").style.height = "200px";
        $get("divNamedIngest").style.display = "";
        $get("shortnamedelete").style.display = "";
    }

	if(addIngestDiv.style.display == "block")
	{
	    UpdateDropDownExtenderBounds();
    }
    	
	SetWaterMarkText();
	return false
}

function OnIngestClick()
{
    if (document.getElementById("IngestButton").style.cursor == "wait")
        return false;

    var ingestPath = TrimString($find('ingestPath_bID').get_Text());

    if (isWebAddress) {
        if (ingestPath == null || ingestPath.length == 0) {
            ShowPopup(DisplayTextResource.invalidPath, "res/Skins/" + skin + "/Common/information.gif", DisplayTextResource.pleaseEnterValidNetworkLocation, null);
            return false;
        }
    }

    ChangeDefaultToWait(DisplayTextResource.loading + '...');
    isProgressActive = true;

    var userInfo = GetUserInfo();

    if (/.spl.xml/i.test(ingestPath))
        Qube.Mama.Usher.IngestSplFrom(ingestPath, userInfo.UserName, userInfo.Password, OnGotIngest, OnError);
    else if(/.kdm.xml/i.test(ingestPath))
        Qube.Mama.Usher.IngestKeyFrom(ingestPath, userInfo.UserName, userInfo.Password, OnGotIngest, OnError);
    else {
        var saveNamedSpaceInfo = GetSaveNamedSpaceInfo();
        Qube.Mama.Usher.GetIngestableTitles(ingestPath, userInfo.UserName, userInfo.Password,
                            saveNamedSpaceInfo.NickName, saveNamedSpaceInfo.Flag, OnGotIngestableEntities, OnError);
    }
    return false;
}

function GetUserInfo() 
{
    extender = $find('ingest_BID');
    
    var userName = null;
    var password = null;

    if (isWebAddress) {
        userName = TrimString($find('username_bID').get_Text());
        password = TrimString($get("password").value);
    }

    return { UserName: userName, Password: password };
}

function GetSaveNamedSpaceInfo() 
{
    var nickName = null;
    var saveFlag = false;

    if (HaveRights()) {
        nickName = TrimString($find("waterNamedExtnd").get_Text());
        saveFlag = $get("chkNamedIngest").checked;
    }

    return {NickName: nickName, Flag: saveFlag};
}

function OnGotIngestableEntities(result)
{
    $get('inplaceIngest').checked = false;
    Qube.Mama.Usher.GetNamedSpaces(OnGotNamedSpaces, OnErrorDummy);

    HideReIngest(false);    
    ShowIngestNew(true);
    
    var CompositionList = document.getElementById("CompositionsList");
    var reingestCompositionList = document.getElementById("reingestCompositionsList");

    $get('divNewIngest').style.height = '270px';

    RemoveChildNodes("CompositionsList");
    RemoveChildNodes("reingestCompositionsList");

    $get('chkReingest').disabled = true;
    $get('chkIngestNew').disabled = true;
    $get('inplaceIngest').disabled = true;
    $get('chkIngestNew').checked = false;
    $get('chkReingest').checked = false;
         
    if(result == null || result.length == 0)
    {
        isProgressActive = false;
        ChangeWaitToDefault();

        ShowPopup(DisplayTextResource.ingest, "res/Skins/" + skin + "/Common/warning.gif", DisplayTextResource.noEntitiesFound, null);
        
        return;
    }

    MakeIngestList(result);

    $get('chkIngestNew').disabled = (CompositionList.rows.length <= 0);
    $get('chkIngestNew').checked = (CompositionList.rows.length > 0);
    $get('inplaceIngest').disabled = isWebAddress;

    var isNewIngestShow = (CompositionList.rows.length > 0);
    var isReingestHide = false;

    if (reingestCompositionList.rows.length > 0) 
    {
        $get('chkReingest').disabled = false;

        var reIngestHeight = 270;
        
        if (isNewIngestShow) {            
            var rows = Math.min(5, reingestCompositionList.rows.length);
            $get('divNewIngest').style.height = (270 - (25 + (rows * 20))) + 'px';
            reIngestHeight = (20 * rows);
        }

        $get('re-ingestContent').style.height = reIngestHeight + 'px';
        $get('divReingest').style.height = reIngestHeight + 'px';
    }
    else
        isReingestHide = true;
    
    isProgressActive = false;
    ChangeWaitToDefault();
    extender.show();
    
    CompositionList.style.display = 'none';
    CompositionList.style.display = '';

    reingestCompositionList.style.display = 'none';
    reingestCompositionList.style.display = '';

    HideReIngest(isReingestHide);
    ShowIngestNew(isNewIngestShow);
}

function HideReIngest(isHide) {
    $get('re-ingestTitle').style.display = isHide ? 'none' : '';
    $get('re-ingestContent').style.display = isHide ? 'none' : '';    
}

function ShowIngestNew(isShow) {
    $get('newIngestTitle').style.display = isShow ? '' : 'none';
    $get('newIngestContent').style.display = isShow ? '' : 'none';
}

function MakeIngestList(result) {
    var CompositionList = document.getElementById("CompositionsList");
    var reingestCompositionList = document.getElementById("reingestCompositionsList");

    for (var i = 0; i < result.length; i++) {
        var tr = document.createElement("tr");

        var td1 = document.createElement("td");
        td1.className = 'checkCell';

        var titleCheck = document.createElement("input");
        titleCheck.id = "check" + i + 1;
        titleCheck.type = "checkbox";
        titleCheck.className = "compositionCheck";

        titleCheck.onclick = function(event) {
            OnChecked(event)
        };

        td1.appendChild(titleCheck);

        var td2 = document.createElement("td");
        td2.className = "cell"

        var spanElement1 = document.createElement("span");

        var titleName = result[i].Name;
        spanElement1.setAttribute("title", titleName);

        var trimedText = GetTrimedText(titleName, 500, "composition");

        if (trimedText != titleName) {
            trimedText = trimedText + "...";
        }

        SetTexttoControl(spanElement1, trimedText);
        spanElement1.className = "composition";

        td2.appendChild(spanElement1);

        tr.appendChild(td1);
        tr.appendChild(td2);

        tr.ingestableEntityInfo = result[i];

        if (!result[i].IsIngested) {
            titleCheck.checked = true;
            tr.className = (CompositionList.rows.length % 2 == 0) ?
                                "rowStyleIngest rowEven" : "rowStyleIngest rowOdd";
            CompositionList.appendChild(tr);
        }
        else {
            tr.className = (reingestCompositionList.rows.length % 2 == 0) ?
                                "rowStyleIngest rowEven" : "rowStyleIngest rowOdd";
            reingestCompositionList.appendChild(tr);
        }
    }
}

function CheckAll(source, compositionlist) 
{    
    if(source.checked)
        CheckCompositions(compositionlist);
    else
        UnCheckCompositions(compositionlist);
}

function OnChecked(e)
{   
    if(e == undefined)  //For IE
        e = event;

    var parent = GetTargetElement(e).parentNode.parentNode.parentNode;
    
    var chk = (parent.id == 'CompositionsList') ? $get('chkIngestNew') : $get('chkReingest');
    
    chk.checked = !IsAnyCompositionUnchecked(parent.id);
}

function IsAnyCompositionUnchecked(compositionslist)
{
    var compositionlist = document.getElementById(compositionslist).getElementsByTagName('input');
        
    for(var i = 0; i < compositionlist.length; i++)    
    {
        if(compositionlist[i].checked == false)
            return true;
    }
    return false;
}

function UnCheckCompositions(compositionslist)
{
    var compositionlist = document.getElementById(compositionslist).getElementsByTagName('input');
    
    for(var i = 0; i < compositionlist.length; i++)
        compositionlist[i].checked = false;
}

function CheckCompositions(compositionslist)
{
    var compositionlist = document.getElementById(compositionslist).getElementsByTagName('input');    
    
    for(var i = 0; i < compositionlist.length; i++)
        compositionlist[i].checked = true;
}

function HandleUsernamePassword(userName, password)
{
    userName = document.getElementById(userName);
    password = document.getElementById(password);
    
    var dummyPassword = document.getElementById(password.watermarkControlId);
    userName.disabled = !isWebAddress;
    
    if (password)
        password.disabled = !isWebAddress;
        
    if (dummyPassword)
        dummyPassword.disabled = !isWebAddress;
}

function OnLocalClicked(userName, password)
{   
    isWebAddress = false;
    HandleUsernamePassword(userName, password)
	SetWaterMarkText();
	ClearCredentials();
	UpdateDropDownExtenderBounds();
}

function OnWebClicked(userName, password)
{    
    isWebAddress = true;
	HandleUsernamePassword(userName, password)
	SetWaterMarkText();
	ClearCredentials();
	UpdateDropDownExtenderBounds();
}

function TrimString(string2Trim)
{
    if(string2Trim == null)
        return "";
        
    string2Trim = string2Trim.replace( /^\s+/g, "" );
    return string2Trim.replace( /\s+$/g, "" );
}

function IngestTitles() 
{
    ChangeDefaultToWait(DisplayTextResource.wait + '...');
    isProgressActive = true;

    var titleList = document.getElementById("CompositionsList");
        
    var titles = new Array();
    
    for(var i = 0; i < titleList.rows.length; i++)
    {
        if (titleList.rows[i].cells[0].childNodes[0].checked)
            Array.add(titles, titleList.rows[i].ingestableEntityInfo);
    }


    if ($get('re-ingestContent').style.display != 'none') 
    {
        var reingestCompositionList = document.getElementById("reingestCompositionsList");

        for (var j = 0; j < reingestCompositionList.rows.length; j++) {
            if (reingestCompositionList.rows[j].cells[0].childNodes[0].checked)
                Array.add(titles, reingestCompositionList.rows[j].ingestableEntityInfo);
        }
    }
    
    if(titles.length > 0)
    {
        var isInplace = $get('inplaceIngest').checked;
        
        if(isInplace)
            Qube.Mama.Usher.IngestTitlesInplace(titles, OnGotIngest, OnIngestInfoError);
        else
        {
            Qube.Mama.Usher.IngestTitles(titles,
                                         $find('username_bID').get_Text(),
                                         $get("password").value,
                                         OnGotIngest, OnIngestInfoError);
        }
    }
    else 
    {
        isProgressActive = false;
        ChangeWaitToDefault();
    }
    
    ClearCredentials();
}

function OnIngestInfoError(errorObj) 
{
    isProgressActive = false;
    ChangeWaitToDefault();

    var errorMessage = errorObj.get_message();

    if (errorMessage.trim() == "") {
        errorMessage = "Check eventlog for details";
        }
        
    var lineFeedPosition = errorMessage.lastIndexOf("\r\n");

    if (lineFeedPosition > -1 && errorMessage.indexOf("item(s) successfully started ingest") > -1) {
        var successMessage = errorMessage.substr(lineFeedPosition + 1).trim();

        $get("trSuccessTitle").style.display = "";
        $get("trSuccessMessage").style.display = "";

        InitializeIngestInfo("successfullyIngestTitleText", DisplayTextResource.successfullyIngest,
                            "spnSuccessfullyIngestBodyText", successMessage);
    }
    else {
        $get("trSuccessTitle").style.display = "none";
        $get("trSuccessMessage").style.display = "none";
    }

    if (lineFeedPosition > 0)
        errorMessage = errorMessage.substr(0, (lineFeedPosition - 1));

    InitializeIngestInfo("failedIngestTitleText", DisplayTextResource.failedIngest, 
                            "spnFailedIngestBodyText", errorMessage);

    var extender = $find('ingestInfo_BID');
    extender.show();
    $get("ingestInfoPopupOkText").focus();
    extender = null;
}

function InitializeIngestInfo(titleCtrlId, titleText, bodyCtrlId, bodyText) 
{   
    SetTexttoControl($get(titleCtrlId), titleText);

    bodyText = GetFormatText(bodyText, 275, $get(bodyCtrlId).className);

    var regularExpression = /(\r\n|[\r\n])/g;
    bodyText = bodyText.replace(regularExpression, "<BR/>");

    $get(bodyCtrlId).innerHTML = bodyText;    
}

function OnGotIngest(errStr) 
{
    isProgressActive = false;
    setTimeout("UpdateJobs()", 1000);
}

function CancelIngest()
{
    ClearCredentials();
    ChangeWaitToDefault();
}

function ClearCredentials()
{   
    $find("username_bID").set_Text('');
    var password = $get("password");
    password.value='';                         
    WaterMarkTextBlur(password);

    if (HaveRights())
    {
        $get("chkNamedIngest").checked = false;
        $find("waterNamedExtnd").set_Text("");        
    }
    
    $find("namedextnd").SelectByText('');
    
    SetWaterMarkText();    
 }

function ChangeDefaultToWait(displayText)
{
    pi.Show(displayText);
}

function ChangeWaitToDefault()
{
    pi.Hide();
}

function SetWaterMarkText()
{
    var extender = $find('ingestPath_bID'); 
    
    if(extender == null)
        return;
    var pathSelection;
         
    if(isWebAddress)
    {
        extender.WatermarkText=DisplayTextResource.networkWatermark; 
         pathSelection = document.getElementById("webIngestOption");
    }
    else
    {
        extender.WatermarkText= DisplayTextResource.localWatermark;
         pathSelection = document.getElementById("localIngestOption");
    }
    
    extender.set_WatermarkText(extender.WatermarkText); 
    
    var imagePath = extender.get_element();
       
    imagePath.value='';
    if(document.getElementById("addIngestDiv").style.display != "none")
    {
        imagePath.focus();    
        pathSelection.focus();
    }
}

function ShowPopup(title, iconImgPath, text, okScript)
{
    ConfirmationWindow(title, text, iconImgPath, okScript, null);
}

function OnGotNamedSpaces(result)
{
    $find('namedextnd').Generate(result, OnSelectNamedIngest);
    $find("namedextnd").SelectByText('');
    ChangeWaitToDefault();
}

function OnSelectNamedIngest(e) 
{
    ChangeDefaultToWait(DisplayTextResource.wait + "...");
    isProgressActive = true;
    Qube.Mama.Usher.GetNamedSpaceByID($find('namedextnd').selectedValue(), OnGotNamedIngest, OnError)
}

function OnGotNamedIngest(result)
{
    var selectedValue = $find('namedextnd').selectedValue();
    
    if(result.UserName == "" || result.UserName == null)
    {
        $get("localIngestOption").checked = true;        
        isWebAddress = false;
        $get("localIngestOption").click();
    }
    else    
    {
        $get("webIngestOption").checked = true;
        isWebAddress = true;
        $get("webIngestOption").click();
    }
    
    $find("ingestPath_bID").set_Text(result.Path);

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
    ChangeDefaultToWait(DisplayTextResource.deleting + "...");
    isProgressActive = true;
    Qube.Mama.Usher.DeleteNamedSpaceByID($find("namedextnd").selectedValue(), OnDeleted, OnError);
}

function OnDeleted(result)
{
    ClearCredentials();
    Qube.Mama.Usher.GetNamedSpaces(OnGotNamedSpaces, OnErrorDummy);
}

function ingest_SetText()
{
    SetTexttoControl("currentIngestLabel", DisplayTextResource.currentIngest);
    SetTexttoControl("statusLabel", DisplayTextResource.status);
    SetTexttoControl("compositionLabel", DisplayTextResource.composition);
    SetTexttoControl("progressLabel", DisplayTextResource.progress);
    SetTexttoControl("transferringLabel", DisplayTextResource.Transferring);
    SetTexttoControl("suspendedLabel", DisplayTextResource.suspended);
    SetTexttoControl("queuedLabel", DisplayTextResource.queued);
    SetTexttoControl("localLabel", DisplayTextResource.local);
    SetTexttoControl("networkLabel", DisplayTextResource.network);
    SetTexttoControl("userNameLabel", DisplayTextResource.username);
    SetTexttoControl("passwordLabel", DisplayTextResource.password);
    SetTexttoControl("currentIngestLabel", DisplayTextResource.currentIngest);
    SetTexttoControl("addIngestTxt", DisplayTextResource.addIngest);
    SetTexttoControl("ingestTxt", DisplayTextResource.ingest);
    SetTexttoControl("ok_a", DisplayTextResource.ingest);
    SetTexttoControl("cncl_a", DisplayTextResource.cancel);
    SetTexttoControl("spnLeavContentAtSource", DisplayTextResource.leaveContentAtSource);     
    SetTexttoControl("lblNamedIngest", DisplayTextResource.saveLocationInfo);
    SetTexttoControl("spnNamedSpace", DisplayTextResource.namedSpace);    
    SetTexttoControl("spnIngestNew", DisplayTextResource.ingestTheFollowingComposition);
    SetTexttoControl("spnReingest", DisplayTextResource.reingestTheFollowingComposition);
    SetTexttoControl("lcsTxtYes", DisplayTextResource.yes);
    SetTexttoControl("lcsTxtNo", DisplayTextResource.no);
    SetTexttoControl("ingestInfoPopupOkText", DisplayTextResource.ok);
    
    
    var username = $find("username_bID")
    
    if(username != null)
        username.set_WatermarkText(DisplayTextResource.enterUsername);
}

function UpdateDropDownExtenderBounds()
{
    var extender = $find('namedextnd');
        extender._reset = true;
    var element = extender.get_element();
        element.style.position = "absolute";            
        element.style.left = ($get("addIngestDiv").offsetWidth - 335) + "px";
        element.style.top = "6px";
        extender._isOver = false;
        extender.hover();
}

function OnError(result) 
{
    isProgressActive = false;
    ChangeWaitToDefault();

    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function OnGotJobsError(errorObject) {
    setTimeout("UpdateJobs()", 1000);
}

function OnGotJobs(results) 
{
    if (results == null || results.length == 0) {
        if (!isProgressActive)
            ChangeWaitToDefault();

        setTimeout("UpdateJobs()", 1000);
        
        return;
    }

    var job = null;

    for (var i = 0; i < results.length; ++i) {
        job = results[i];
        if (IsExists(job))
            UpdateJob(job)
        else
            AddJob(job);
    }

    if (!isProgressActive)
        ChangeWaitToDefault();

    job = null;
    results = null;

    setTimeout("UpdateJobs()", 1000);
}

function UpdateJob(job) 
{
    var selectedJob = jobs[Array.indexOf(jobIds, job.ID)];

    var ingestProgress = $get('ingest' + job.ID);
    var integrityProgress = $get('integrity' + job.ID);
    var progressValue = $get('progress' + job.ID);
    var progressStatus = $get('progressStatus' + job.ID);
    var progressInfoColumn = $get('progressInfoColumn' + job.ID);
    var progressStatusImage = $get('progressStatusImg' + job.ID);

    var isSuspended = IsJobSuspended(job);

    if (job.Status != selectedJob.Status) {
        progressStatusImage.src = GetJobStatusImage(job.Status);
        selectedJob.IsSentRequest = false;
    }
    else if (isSuspended || selectedJob.isCompleted)
        return;        

    selectedJob.Status = job.Status;
    selectedJob.VerificationProgress = job.VerificationProgress;
    selectedJob.Progress = job.Progress;

    integrityProgress.style.width = ((parseInt(job.VerificationProgress, 10) * g_maxProgressBarWidth)/100) + 'px';

    ingestProgress.style.width = (((parseFloat(job.Progress) - job.VerificationProgress) * g_maxProgressBarWidth)/100) + 'px';

    progressStatus.style.display = '';

    if (!IsJobProgressing(job) && !IsJobSuspended(job)) 
    {
        selectedJob.isCompleted = true;
        
        var cancelColumn = $get('cancel' + job.ID);
        if (cancelColumn)
            cancelColumn.style.display = 'none';

        var suspendResumeColumn = $get('susRes' + job.ID);

        if (suspendResumeColumn)
            suspendResumeColumn.style.display = 'none';

        progressInfoColumn.colSpan = '3';
        progressInfoColumn.style.width = '550px';

        progressValue.style.display = 'none';
        SetTexttoControl(progressStatus, eval("DisplayTextResource." + job.Status));
    }
    else 
    {        
        if ($get('susResButton' + job.ID)) 
        {
            var suspendResumeColumn = $get('susRes' + job.ID);
            if (isSuspended)
                SetTexttoControl($get('susResButton' + job.ID), DisplayTextResource.resume);
            else
                SetTexttoControl($get('susResButton' + job.ID), DisplayTextResource.suspend);

            $get('cancel' + job.ID).style.display = "block";
        }

        progressValue.style.display = '';

        if (job.Status == "VerifyingIntegrity" ||
            job.Status == "IntegrityVerificationSuspended" ||
            job.Status == "Transferred") {
            SetTexttoControl(progressValue, parseInt(job.VerificationProgress, 10).toString() + "%");
            SetTexttoControl(progressStatus, eval("DisplayTextResource." + job.Status) + "...");
        }
        else if (job.Status == "TransientError") {
            SetTexttoControl(progressStatus, eval("DisplayTextResource." + job.Status));
            SetTexttoControl(progressValue, job.Progress.toString() + "%");
        }
        else
        {
            progressStatus.style.display = 'none';
            SetTexttoControl(progressValue, job.Progress.toString() + "%");
        }
    }

    $get('currentIngestsTableBody').style.display = 'none';
    $get('currentIngestsTableBody').style.display = 'block';


    ingestProgress = null;
    integrityProgress = null;
    progressValue = null;
    progressStatus = null;
    progressInfoColumn = null;
    progressStatusImage = null;
    job = null;
    selectedJob = null;
}

function GetJobStatusImage(jobStatus) 
{

    //TODO: add cases for other statuses 
    switch (jobStatus) {
        case "Queued":
            return "res/Skins/" + skin + "/Ingest/Icon Queued White.gif";

        case "Suspended":
        case "IntegrityVerificationSuspended":
            return "res/Skins/" + skin + "/Ingest/Icon Suspended White.gif";
            
        case "Transferred":
        case "Transferring":            
        case "VerifyingIntegrity":
            return "res/Skins/" + skin + "/Ingest/Icon Transferring White.gif";

        case "Completed":
            return "res/Skins/" + skin + "/Common/SuccessAudit_small.gif";
            
        case "Error":
        case "IntegrityFailed":
            return "res/Skins/" + skin + "/Common/Error_small.png";

        case "Cancelled":
        case "IntegrityVerificationCancelled":
            return "res/Skins/" + skin + "/Ingest/Cancel Ingest.gif";

        default:
            return "res/Skins/" + skin + "/Ingest/Icon Queued White.gif";
    }
}

function AddJob(job) 
{
    Array.add(jobIds, job.ID);
    job.isCompleted = false;
    CreateJob(job);
    job.IsSentRequest = false;
    Array.add(jobs, job);
    job = null;
}

function CreateJob(job)
{
    var tbody = document.getElementById("currentIngestsTableBody");

    var table = document.getElementById("currentIngestsTable");

    var alternateColor = ((tbody.rows.length % 2) == 0);

    var ingestRow = document.createElement("tr");
    ingestRow.id = "tr" + job.ID;

    ingestRow.className = (alternateColor) ? "rowEven" : "rowOdd";

    ingestRow.appendChild(CreateJobStatusField(job));
    ingestRow.appendChild(CreateJobNameField(job));

    var progressTD = CreateJobProgressField(job);
    ingestRow.appendChild(progressTD);

    if (IsJobSuspended(job))
        ingestRow.appendChild(CreateJobControlButton(job, GetButtonImage, SuspendORResumeRequest, DisplayTextResource.resume));    
    else if (IsJobProgressing(job))
        ingestRow.appendChild(CreateJobControlButton(job, GetButtonImage, SuspendORResumeRequest, DisplayTextResource.suspend));
    
    if (job.Status == "Completed" || job.Status == "Error" || job.Status == "IntegrityFailed" ||
            job.Status.indexOf("Cancelled") > -1) {
        progressTD.colSpan = "3";
        progressTD.style.width = "550px";
    }
    else
        ingestRow.appendChild(CreateJobControlButton(job, GetButtonImage, OnCancelJob, DisplayTextResource.cancel));

    tbody.appendChild(ingestRow);

    tbody.style.display = "none";
    tbody.style.display = "block";
}

function SuspendORResumeRequest(job) 
{
    var selectedJob = jobs[Array.indexOf(jobIds, job.ID)]
    if (!selectedJob.IsSentRequest) 
    {
        selectedJob.IsSentRequest = true;
        if (IsJobSuspended(job))
            Qube.Mama.Usher.ResumeJob(job.ID, UpdateJobs, OnError);
        else
            Qube.Mama.Usher.SuspendJob(job.ID, UpdateJobs, OnError);
    }
}

function IsExists(job) 
{
    return Array.contains(jobIds, job.ID);
}

function GetButtonImage() {
    return "res/Skins/" + skin + "/Ingest/EmptyButton.gif";
}

function LeaveContentClick(source) {
    if (source.checked) 
    {
        var backgroundElement = $get('divProtectionWindow');
        var confirmationWindow = $get('divLeaveContentAtSource');

        backgroundElement.style.display = '';
        confirmationWindow.style.display = '';

        var docObject = GetDocumentType();

        var clientBounds = CommonToolkitScripts.getClientBounds();
        var clientWidth = clientBounds.width;
        var clientHeight = clientBounds.height;

        SetTexttoControl('leaveContentTitletxt', DisplayTextResource.leaveContentAtSource);
        $get('spnLeaveContentBodyText').innerHTML = DisplayTextResource.leaveContentAtSourceConfirmation;
        $get('leaveContentImgInfo').src = "res/Skins/" + skin + "/Common/warning.gif";

        confirmationWindow.style.left = (docObject.scrollLeft + ((clientWidth - confirmationWindow.offsetWidth) / 2)) + 'px';
        confirmationWindow.style.top = (docObject.scrollTop + ((clientHeight - confirmationWindow.offsetHeight) / 2)) + 'px';
        confirmationWindow.setAttribute('unselectable', 'on');
        confirmationWindow.align = "center";

        backgroundElement.style.left = '0px';
        backgroundElement.style.top = '0px';
        backgroundElement.style.width = Math.max(docObject.scrollWidth, clientWidth) + 'px';
        backgroundElement.style.height = Math.max(docObject.scrollHeight, clientHeight) + 'px';
    }
}

function ResetLeaveContentAtSource() {
    HideLeaveContentAtSource();
    $get('inplaceIngest').checked = false;
}

function HideLeaveContentAtSource() {
    $get('divProtectionWindow').style.display = 'none';
    $get('divLeaveContentAtSource').style.display = 'none';
}

function OnKeyUp(ctrl) {    
    $get("chkNamedIngest").checked = (ctrl.value.trim() != "");
}