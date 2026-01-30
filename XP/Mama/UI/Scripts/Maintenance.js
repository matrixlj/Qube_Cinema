SetStyle();

Sys.Application.add_load(maintenance_SetText);

function OnGotUserGroup() 
{
    if (!HaveRights())
        window.location="Status.aspx";
}

function OnGotError(result)
{
    window.location = "Status.aspx";
}

function SetStyle()
{
    document.getElementById("maintenanceMenu").className = "MenuFocus";
    var body = document['body'];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Maintenance/maintenance.jpg)";
}

function ConfirmAction(e, control)
{
    if(e == undefined) //For IE
        e = event; 
        
    var srcElement = GetTargetElement(e);
    
    if(control == 'shutdown')
        ShowPopup(DisplayTextResource.shutDown, "res/Skins/" + skin + "/Common/Warning.gif", DisplayTextResource.shutdownConfirmation, "Shutdown()");
    
    if(control == 'restart')
        ShowPopup(DisplayTextResource.restart, "res/Skins/" + skin + "/Common/Warning.gif", DisplayTextResource.restartConfirmation, "Restart()");
}

function Shutdown()
{
    Qube.Mama.Maintenance.ShutDown(OnRequestCompleted, OnError);
}

function Restart(result)
{
    Qube.Mama.Maintenance.Restart(OnRequestCompleted, OnError);
}

function OnLocalClicked()
{
	document.getElementById("local").checked = true;
	document.getElementById("web").checked = false;
}

function OnWebClicked()
{
	document.getElementById("local").checked = false;
	document.getElementById("web").checked = true;
}

function ShowPopup(title, iconImgPath, text, okScript)
{
    ConfirmationWindow(title, text, iconImgPath, okScript, null);
}

function maintenance_SetText() 
{
//    SetTexttoControl("SUPLbl", DisplayTextResource.updatePackage);
//    SetTexttoControl("updateLbl", DisplayTextResource.updateFirmware);
//    SetTexttoControl("localLbl", DisplayTextResource.local);
//    SetTexttoControl("webLbl", DisplayTextResource.web);
//    SetTexttoControl("getUpdateTxt", DisplayTextResource.getUpdate);

    SetTexttoControl("systemLbl", DisplayTextResource.system);
    SetTexttoControl("restartTxt", DisplayTextResource.restart);
    SetTexttoControl("shutdownTxt", DisplayTextResource.shutDown);
}

function OnError(result)
{
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function OnRequestCompleted(result)
{
    pi.Hide();
}