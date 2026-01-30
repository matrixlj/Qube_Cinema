var startDate = null;
var endDate = null;
var columnNo = null;
var _dragShow = '';
var dragItem = null;
var scheduleID = null;

SetStyle();
schedule_SetText();

Sys.Application.add_load(Schedule_Load);
Sys.Application.add_unload(Schedule_UnLoad);

function Schedule_Load()
{   
    $get("ctl00_ContentPlaceHolder_prevWeek").src = "res/Skins/" + skin + "/Schedule/PrevWeek.gif";
    $get("ctl00_ContentPlaceHolder_nextWeek").src = "res/Skins/" + skin + "/Schedule/NextWeek.gif";

    $addHandler(document, "mousedown", drag_mouseDown);
        
    $find('maskFromBehavior').set_CultureDatePlaceholder('/');
    $find('maskDateBehavior').set_CultureDatePlaceholder('/');
    $find('startTime_BID').set_CultureTimePlaceholder(':');
        
    $find('scheduleextnd')._reset = true;
            
    $find('mpextnd').add_showing(HandleOkScript);
            
    if(!$find('scheduleextnd').hasChildNodes())
    {
        pi.Show(DisplayTextResource.loading + "...");                
        Qube.Mama.Catalog.GetAllShows(true, false, OnGotShows, OnError);
    }    
}

function Schedule_UnLoad()
{
    $removeHandler(document, "mousedown", drag_mouseDown);
}

function ShowDialog(start, end, column, editID)
{
    var sttDate = $find('startDate_BID');
    if(sttDate == null)
        return;
    
    var timeZoneOffset = start.getTimezoneOffset();
    start.setMinutes(start.getMinutes() + timeZoneOffset);

    var dt = start;
    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper(sttDate.get_element());
    wrapper.set_Value(dt.format("MM/dd/yyyy"));
        
    var startTime = $find("startTime_BID");
    if(startTime == null)
        return;        
    
    startDate = start;
    endDate = end;
    columnNo = column;
    
    var yes = document.getElementById('yes');
    var no = document.getElementById('no');
    
    var sExtnd = $find('scheduleextnd');
    
    if(!sExtnd.hasChildNodes())
    {
        ConfirmationWindow(DisplayTextResource.emptyShow, DisplayTextResource.noShowsAreAvailableForScheduling,
                "res/Skins/" + skin + "/Common/information.gif", null, null);
        return;
    }
       
    startTime.get_element().value = dt.format("hh:mm:ss tt");
    
    var extender = $find('mpextnd'); 
    if(extender == null)
        return;
                
    extender.show();
    
    var isValid = !($find('scheduleextnd').selectedValue() == "");
    
    $get("yesDisabled").style.display = !isValid ? '' : 'none';
    $get("yes").style.display = !isValid ? 'none' : 'block';
    
    sExtnd._isOver = false;    
    
    sExtnd.hover();
        
    if(Sys.Browser.agent === Sys.Browser.Opera)
    {
        var elt = sExtnd.get_element();
        var bounds = $common.getBounds(elt);    
        bounds.x = elt.offsetLeft - 6;
        bounds.y = elt.offsetTop - 6;
        sExtnd.setBounds(bounds); 
        var ddCtrl = sExtnd.get_dropDownControl();
        Sys.UI.DomElement.setLocation(ddCtrl, ddCtrl.offsetLeft, ddCtrl.offsetTop - 6);        
        HandleOkScript();
    }

    if(editID !== undefined)
        $find('scheduleextnd').Select(editID);
        
    if($get(extender._OkControlID).enabled)
        $get(extender._OkControlID).focus();        
}

function SetStyle()
{
    document.getElementById("scheduleMenu").className = "MenuFocus";  
    var body = document['body'];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Schedule/Schedule.jpg)";      
}

function SaveSchedule()
{
    var startTime = $find("startTime_BID").get_element();
    if(startTime == null)
        return;
          
    var showID = $find('scheduleextnd').selectedValue();
    if(showID === null && showID === '')
        return;
        
    var dateControl = $find('startDate_BID').get_element();
    if (dateControl == null)
        return;

    if (dateControl.value == 'mm/dd/yyyy' || dateControl.value == '__/__/____') 
    {
        ConfirmationWindow(DisplayTextResource.Error, DisplayTextResource.invalidDate, "res/Skins/" + skin + "/Common/error.gif", null, null);
        return;
    }

    pi.Show(DisplayTextResource.saving + "...");

    var dateValue = Date.parseInvariant(dateControl.value, "MM/dd/yyyy")
    
    Qube.Mama.Catalog.SaveSchedule(showID, dateValue.format("MMM/dd/yyyy"), 
                startTime.value, scheduleID, OnSaveShowSchedule, OnScheduleError);
        
    scheduleID = null;
}

function OnScheduleError(result)
{
    var errorMessage = result.get_message();

    ConfirmationWindow(DisplayTextResource.Error, errorMessage, "res/Skins/" + skin + "/Common/error.gif", null, null);
    pi.Hide();
}

function OnSaveShowSchedule(result)
{
    dpc1.timeRangeSelectedCallBack(startDate, endDate, columnNo);
    pi.Hide();    
}

function schedule_SetText()
{    
    SetTexttoControl("lblgotoDate", DisplayTextResource.gotoDate + ":");
    SetTexttoControl("selectShowTitle", DisplayTextResource.selectShowTitle);
    SetTexttoControl("selectShowLbl", DisplayTextResource.Show + ":");
    SetTexttoControl("selectDateLbl", DisplayTextResource.Date + ":");
    SetTexttoControl("startTimeLbl", DisplayTextResource.Time + ":");
    SetTexttoControl("yes_a", DisplayTextResource.schedule);
    SetTexttoControl("yesDisabled_a", DisplayTextResource.schedule);    
    SetTexttoControl("no_a", DisplayTextResource.cancel);
    SetTexttoControl("spnDragShow", DisplayTextResource.showDrag + ":");        
}

function HandleOkScript()
{    
    var sExtnd = $find('scheduleextnd');
    
        if(_dragShow != '')
            sExtnd.Select(_dragShow);
        else
            sExtnd.SelectByIndex(0);
}

function drag_mouseDown(e)
{    
    if(e.target.tagName.toUpperCase() == 'A' && e.target.parentNode.id == "dragShow")
    {   
        _dragShow = e.target.getAttribute('value');
        $addHandler(document, "mousemove", drag_mouseMove);
        $addHandler(document, "mouseup", drag_mouseUp);  
        dragItem = e.target;
        dragItem.style.cursor = "move";

        with ($get("divprotection").style) 
        {
            var pbs = pi.backgroundElement.style;
            width = pbs.width;
            height = pbs.height;
            left = pbs.left;
            top = pbs.top;
            position = "absolute";
            zIndex = 10001;
            display = "";
        }

        e.stopPropagation();
        e.preventDefault();
    }
}

function drag_mouseMove(e)
{       
    DayPilotCalendar.selecting = false; 
    
    var main = $get(dpc1.id + "_main");
    var mainPos = FindPosition(main);

    var docType = GetDocumentType();
    
    var X = e.clientX + docType.scrollLeft; 
    var Y = e.clientY + docType.scrollTop;
        
    if(X >= mainPos.curleft && X <= mainPos.curleft + $get(dpc1.id).offsetWidth - 62 &&
        Y >= mainPos.curtop && Y <= mainPos.curtop + $get(dpc1.id).offsetHeight - 25) 
    {
        $get("divprotection").style.cursor = "move";
        dragItem.style.cursor = "move";
    }
    else
    {
        $get("divprotection").style.cursor = "default";
        dragItem.style.cursor = "default";
    }
    
    e.stopPropagation();
    e.preventDefault();
}

function drag_mouseUp(e)
{ 
    if(dragItem != null)
    {
        $get("divprotection").style.display = "none";

        var docType = GetDocumentType();
        
        var X = e.clientX + docType.scrollLeft; 
        var Y = e.clientY + docType.scrollTop; 
        
        if(_dragShow == '')
            return false;
        
        var elt = null;
        
        var main = $get(dpc1.id + "_main");
        var mainPos = FindPosition(main);
            
        if(X >= mainPos.curleft && X <= mainPos.curleft + $get(dpc1.id).offsetWidth &&
            Y >= mainPos.curtop && Y <= mainPos.curtop + $get(dpc1.id).offsetHeight - 25) 
        {
            elt = FindControlByPosition(main, X, Y);
        }
        
        if(elt !== null && elt.unselectable  && (elt.className == 'dpcalendar cellbackground'))
        {           
            DayPilotCalendar.selecting = true;
            DayPilotCalendar.topSelectedCell=elt;
            DayPilotCalendar.bottomSelectedCell=elt;        
            dpc1.mouseup(e);                       
        }
        
        dragItem.style.cursor = "pointer";        
    }
    
    $removeHandler(document, "mousemove", drag_mouseMove);
    $removeHandler(document, "mouseup", drag_mouseUp);
    
    dragItem = null;
    _dragShow = '';
    
    e.stopPropagation();
    e.preventDefault();
}

function FindControlByPosition(from, x, y) 
{
    var docType = GetDocumentType();
    
    x = (x + docType.scrollLeft - from.offsetLeft);
    y = (y + docType.scrollTop + from.parentNode.parentNode.parentNode.parentNode.parentNode.scrollTop);
        
    var cells = from.getElementsByTagName("TD");
    
    for(var k = 0; k < cells.length; k++)
    {
    
        var node = FindPosition(cells[k]);
        
        if(x >= node.curleft && x <= node.curleft + node.width &&
            y >= (node.curtop) && y <= (node.curtop + node.height))
            return cells[k];
    }
    
    return null;
}

function OnGotShows(result)
{       
    $find('scheduleextnd').Generate(result);    
    DragableShows(result);
    pi.Hide();    
}

function DragableShows(shows)
{
    if(shows == null)
        return;

    var dragShow = $get("dragShow");
    var alternate = false;
    
    for(i=0; i<shows.length; i++)
    {
        var optionElement = document.createElement("a");
            optionElement.id = "dragshow" + i;
            optionElement.setAttribute('value', shows[i].ID);	
            optionElement.tabIndex = dragShow.tabIndex;
            var Text = shows[i].Name;
                                
            optionElement.setAttribute('displayText', Text);
            
            var trimedText = GetTrimedText(Text, 190, "ContextMenuItem");
    	    	    
            if(trimedText != Text)
            {
                optionElement.title = Text;
                trimedText += "...";                         
            }
    	                                    	    
            SetTexttoControl(optionElement, trimedText);	    
    	    
            optionElement.href = "#";
            optionElement.className = "ContextMenuItem";
            
            if(alternate)
                optionElement.className = "ContextMenuItem alternateRow";
                
            alternate = !alternate;
            
        dragShow.appendChild(optionElement);
    }
}

function EventEdit(e)
{
    scheduleID = e.value();    
    ShowDialog(e.start(), e.end(), null, e.tag());
}

function OnCancel()
{
    scheduleID = null;
}

function EventMove(e, newStart, newEnd, oldColumn, newColumn)
{
    dpc1.eventMoveCallBack(e, newStart, newEnd, oldColumn, newColumn);
}

function OnError(result)
{
    pi.Hide();
}