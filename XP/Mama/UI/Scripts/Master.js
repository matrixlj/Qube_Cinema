// JScript File
var port = null;
var portStr = "";
var browserName = navigator.appName;
var error = false;
var CurrentModalPopup = new Array();

setTimeout("SetVersion()", 1000);
CheckPort();

Sys.Application.add_load(Master_Load);
Sys.Application.add_unload(Master_UnLoad);

function master_SetText()
{
    SetTexttoControl("statusMenu", DisplayTextResource.status);
    SetTexttoControl("controlMenu", DisplayTextResource.control);
    SetTexttoControl("showsMenu", DisplayTextResource.shows);
    SetTexttoControl("scheduleMenu", DisplayTextResource.schedule);
    SetTexttoControl("ingestMenu", DisplayTextResource.ingest);
    SetTexttoControl("keysMenu", DisplayTextResource.keys);
    SetTexttoControl("logMenu", DisplayTextResource.logs);
    SetTexttoControl("setupMenu", DisplayTextResource.setup);
    SetTexttoControl("maintenanceMenu", DisplayTextResource.maintenance);
    SetTexttoControl("mediaMenu", DisplayTextResource.media);

    SetTexttoControl("spnMasterTheatreCode", DisplayTextResource.theatre + ":");
    SetTexttoControl("spnMasterScreenCode", DisplayTextResource.screen + ":");

    SetTheatreAndScreenCodeValue(masterTheatreCode, masterScreenCode);   
}

function Master_Load() 
{
    master_SetText();
    
    $get("logout").originalText = DisplayTextResource.logout;
    AddTitle($get("logout"));

    EnableSetupMaintenancePg();        
    SetWaterMarkTextControl();
    PreventSelection();     
    $addHandler(document, 'mousewheel', Wheel);            
    $addHandler(document, 'keypress', EscModalPopup);           
    document.onselectstart = function(){ return(event.srcElement.tagName.toLowerCase() == 'input'); }  
}

function Master_UnLoad()
{
    CurrentModalPopup = null;
}

function EscModalPopup(e)
{
    if((e.charCode == Sys.UI.Key.enter) && (CurrentModalPopup.length > 0))
    {
        var obj = CurrentModalPopup[CurrentModalPopup.length - 1];
        var okElement = null;
        if(obj._OkControlID)
            okElement = $get(obj._OkControlID);
            
        var cancelElement = null;
        if(obj._CancelControlID)
            cancelElement = $get(obj._CancelControlID);
        
        if (okElement && !okElement.disabled && okElement.style.display != 'none')
                obj._onOk(e)
        else if (cancelElement && !cancelElement.disabled && cancelElement.style.display != 'none')
                obj._onCancel(e);
        else
            return false;
        
    } 
}

function Wheel(e)
{   
    if(e.ctrlKey)
    {
        e.stopPropagation();
        e.preventDefault();
    }
}

function SetVersion(s)
{
    Qube.Mama.Catalog.GetVersion(OnGotVersion, OnErrorDummy);
}

function HaveRights() {
    return /administrators|managers|powerusers/i.test(userGroup);
}

function EnableSetupMaintenancePg()
{
    var maintenanceMenu = document.getElementById("maintenanceMenu");

    maintenanceMenu.style.display = '';
    maintenanceMenu.href = "javascript:MenuClick('Maintenance');";
}

function CheckPort()
{
    var queryStr = window.location.search.substring(1);
    var params = queryStr.split("&");
    
    for (var i = 0;i < params.length; i++)
    {
        var pair = params[i].split("=");

        if(pair[0].toUpperCase() == "PORT")
        {
            port = pair[1];
            portStr = "?Port=" + port;
            break;
        }
    }       
}

function OnGotVersion(result)
{   
    if(result == null)
        return;
    SetTexttoControl("versionLabel", DisplayTextResource.version + " " + result);    
}

function MenuClick(pageName)
{   
    window.location = pageName + ".aspx" + portStr;
}

function KeypressEvent(e, evalFunction, parameter)
{   
    var paramArray = '';
    if(e == undefined) //no need to pass source event in IE
        e = window.event;

    if ((e.which || e.keyCode) == 13) //Enter Key
    {
        if ((parameter && parameter != '') && (typeof(evalFunction) == "string"))
        {
            paramArray = parameter.split(',');
            paramArray = paramArray.join("','");
            paramArray = "'" + paramArray + "'";
            eval(evalFunction + "(" + paramArray + ")");
        }               
        else
            evalFunction.call(e);
     }
}

function SetTexttoControl(objid, value)
{    
    var obj;
    
    if (typeof(objid) == "object")
        obj = objid;
    else
        obj = document.getElementById(objid);
        
    switch (browserName)
    {
        case "Netscape": //Firefox & Safari & chrome
            obj.textContent = value;
            break;
        case "Microsoft Internet Explorer":
            obj.innerText = value;
            break;
        case "Opera":        
            obj.text = value;
            break;
    }     
}

function GetControlText(objid)
{    
    var obj;
    var value = "";
    
    if (typeof(objid) == "object")
        obj = objid;
    else
        obj = document.getElementById(objid);
    
    switch (browserName)
    {
        case "Netscape": /*Firefox & Safari & chrome*/
            value = obj.textContent; 
            break;
        case "Microsoft Internet Explorer":
            value = obj.innerText
            break;
        case "Opera":        
            value = obj.text;
            break;        
    }     
    return value;
}

function AttachEvent(obj, evt, fnc)
{	    
    switch (browserName)
    {
        case "Netscape":
        case "Opera":        
            obj.addEventListener(evt,fnc,false);
            break;
        case "Microsoft Internet Explorer":
            obj.attachEvent("on" + evt,fnc);
            break;
    }
}

function GetTargetElement(e)
{
    // IE uses srcElement, others use target    
     return e.target != null ? e.target : e.srcElement;          
}

function newelement(newid)
{ 
    var el = document.createElement('div'); 
    el.id = newid;     
    
    with(el.style)
    { 
        display = 'none';
        position = 'absolute';
    } 
    
    el.className = "tooltip";
    el.innerHTML = '&nbsp;'; 
    document.body.appendChild(el); 
}

function TooltipDisplayForEvent(e)
{   
    var offsetLeft = 10;
    var offsetTop = 5;
    
    if(!document.getElementById('tooltip'))
        newelement('tooltip');
        
    var tooltip = document.getElementById('tooltip');                    
    
    var srcElement = GetTargetElement(e);            
    var evnt;
    
    if(srcElement.tagName.toUpperCase() == 'SPAN')
        evnt = srcElement;
    else if(/H1|IMG/i.test(srcElement.tagName.toUpperCase()))
        evnt = srcElement.parentNode;
    else
    {   
        tooltip.style.display = 'none';
        return;
    }
    
    if(evnt.Name == undefined)
        return;
    
    var tooltipMessage = evnt.Name + "<br />" + Convert2HMS(evnt.Duration) + "<br />"; 
    
    if(evnt.Format)
    {
        var format = evnt.Format.toLowerCase() == "undefined" ? "Other" : evnt.Format;
        tooltipMessage += evnt.Aspect + " " + format + " " + evnt.Stereoscopic;
        if (evnt.IsAtmosContent) {
            tooltipMessage += " ATMOS";
        }
    }
    
    tooltip.innerHTML = tooltipMessage;
    
    var ttstyle = tooltip.style;
    
    if(tooltipMessage != '')
        ttstyle.display = 'block';
    
    var currpos = getMousePosition(e, offsetLeft, offsetTop, tooltip.offsetWidth, tooltip.offsetHeight);
    
    ttstyle.left = currpos.currleft + 'px';
    ttstyle.top = currpos.currtop + 'px';
}

function TooltipHideForEvent(e)
{
    var tooltip = document.getElementById("tooltip");    
    tooltip.style.display = 'none';
}

function SetWaterMarkTextControl()
{
   var inputElements = document.getElementsByTagName('input');
   var inputElement;
   var globalWatermarkText;
   var watermarkText;
   
   for (var i=0; i<inputElements.length; i++)
   {
        inputElement = inputElements[i];
        
        watermarkText = inputElement.getAttribute('setwatermark');
        globalWatermarkText = null;
        
        if(watermarkText != null && watermarkText != "mm/dd/yyyy")
            globalWatermarkText = eval("DisplayTextResource." + watermarkText);
        
        if(watermarkText != undefined && globalWatermarkText == undefined)
            globalWatermarkText = watermarkText;
        
        if(globalWatermarkText && !inputElement.watermarkControlId)
        {   
            var waterMarkControl = CreateWatermarkTextBox(inputElement);
            waterMarkControl.value = globalWatermarkText;
            inputElement.watermarkControlId = waterMarkControl.id;
            $addHandler(inputElement, 'blur', function(){WaterMarkTextBlur(this);});            
            $addHandler(inputElement, 'focus', function(){WaterMarkControlFocus(this);});
            inputElement.parentNode.appendChild(waterMarkControl);
            
            inputElement.style.display = 'none';
        }
   }
}

function WaterMarkControlFocus(obj)
{
        var waterMarkControl = document.getElementById(obj.watermarkControlId);        
        waterMarkControl.style.display = 'none';
        obj.style.display = '';
}

function WaterMarkTextBlur(obj)
{
    var waterMarkControl = document.getElementById(obj.watermarkControlId);
        
    if (obj.value == '' || obj.value == null)   
    {   
        obj.style.display = 'none';
        waterMarkControl.style.display = '';
    }
    else    
    {        
        waterMarkControl.style.display = 'none';
        obj.style.display = '';
    }
}

function WaterMarkTextFocus(obj)
{   
    var target = document.getElementById(obj.targetControlId);        
    obj.style.display = 'none';  
    target.style.display = '';  
    if(!target.disabled)
        target.focus();    
    else
        WaterMarkTextBlur(target);
}

function CreateWatermarkTextBox(target)
{
    var waterMark = document.createElement('input');
    target.setAttribute("autocomplete","off");
    waterMark.id = target.id + 'waterMark';
    waterMark.targetControlId = target.id;
    waterMark.type = 'text';        
    waterMark.disabled = target.disabled;
    waterMark.className = target.className;
    waterMark.style.color = 'gray';         
    waterMark.tabIndex = target.tabIndex;  
    $addHandler(waterMark, 'focus', function(){ WaterMarkTextFocus(this); });    
    waterMark.style.display = target.value == '' ? '' : 'none';    
    return waterMark;
}

function FindPosition(obj) 
{
	this.curleft = 0;
	this.curtop = 0;
	this.width = obj.offsetWidth;
	this.height = obj.offsetHeight;

	if (obj.offsetParent) 
	{
		this.curleft = obj.offsetLeft;
		this.curtop = obj.offsetTop;
		
		while (obj = obj.offsetParent)
		{
		    this.curleft += obj.offsetLeft;
		    this.curtop += obj.offsetTop;
		}
	}
	return this;
}

if(Sys.Extended.UI.CalendarBehavior)
{
    var calendar = Sys.Extended.UI.CalendarBehavior.prototype;
    calendar._element_onblur = Overloading_element_onblur;
}

function Overloading_element_onblur(e) 
{
    if (!this._enabled) return;
    if (!this._button) {
        this.blur();
    }
    
    if (!isNaN(new Date(e.target.value)) &&
        this._parseTextValue(e.target.value) == null)
    {                  
        e.stopPropagation();
        e.preventDefault();       
        
        if(typeof(DayPilotCalendar)!='undefined')
        {
            if (this.get_element().id == $find('gotoDate_BID').get_element().id) 
            {
                var extender1 = $find('mpextnd');
                if(extender1 != null)
                    extender1.hide();
            }
            DayPilotCalendar.selecting = false;
        }
        
        var errfun = "ErrorCancelHandler('" + this.get_element().id +  "')";
        ConfirmationWindow(DisplayTextResource.invalidDate, DisplayTextResource.pleaseEnterValidDate, "res/Skins/" + skin + "/Common/error.gif", null, errfun);
        
        error = false;  
           
        return false;           
    }    
}

function GetFormatText(content, containerWidth, classname)
{
    var contentArray = content.split(" ");
    for(var i=0; i<contentArray.length; i++)
    {
        var afterTrimed = contentArray[i];
        var trimed = "";
        var reFormatText = "";
        var startIndex = 0;
        while(afterTrimed != trimed)
        {
            trimed = GetTrimedText(afterTrimed, containerWidth, classname);
            reFormatText = reFormatText.concat(trimed, " ");
            startIndex += trimed.length;
            afterTrimed = contentArray[i].substr(startIndex);            
        }
        
        contentArray[i] = reFormatText;
    }
    
    return contentArray.join('');
}

function ConfirmationWindow(titleText, bodyText, imgSrc, okScript, cancelScript, isOkOnly)
{    
    var yes = $get("imgyes");
    var no = $get("imgno");
    var extender = $find('cw_BID');
        
    SetTexttoControl($get('titletxt'), titleText);

    bodyText = GetFormatText(bodyText, 280, $get("spnBodyText").className);

    var regularExpression = /(\r\n|[\r\n])/g;
    bodyText = bodyText.replace(regularExpression, "<BR/>");
    
    $get('spnBodyText').innerHTML = bodyText;
    $get("imgInfo").src = imgSrc;


    yes.backgroundImage = "url(res/Skins/" + skin + "/Common/Ok Enabled.gif)";
    no.backgroundImage = "url(res/Skins/" + skin + "/Common/Cancel Enabled.gif)";
        
        
    SetTexttoControl("txtyes", DisplayTextResource.yes);
    SetTexttoControl("txtno", DisplayTextResource.no);
    
    if(cancelScript !== null)
        extender.set_OnCancelScript(cancelScript);

    var isOkEnabled = false;

    if(okScript === null || isOkOnly)
    {
	    isOkEnabled = true;
        SetTexttoControl("txtno", DisplayTextResource.ok);
        $get("divyes").style.display = "none";        
        no.backgroundImage = "url(res/Skins/" + skin + "/Common/Ok Enabled.gif)";

	    if(okScript != null)
	        extender.set_OnCancelScript(okScript);
    }
    else
    {        
        $get("divyes").style.display = '';
        extender.set_OnOkScript(okScript);
    }
    
    extender.show();
    extender = null;
    
    if(isOkEnabled)
        $get('txtno').focus();
    else
        $get('txtyes').focus();
}

function ErrorCancelHandler(eltID)
{   
    var focusElement = $get(eltID)
    if(focusElement && !focusElement.disabled && focusElement.style.display != "none")
    {
        focusElement.value = '';
        focusElement.focus();
    }
}

function PreventSelection()
{
    /* for IE */
    var spanElements = document.getElementsByTagName('span');
    var spanElementsLength = spanElements.length;
    for(var i = 0; i < spanElementsLength; i++)
    {
        spanElements[i].onselectstart = function(){return false;}
    }
    
    var h1Elements = document.getElementsByTagName('h1');
    var h1ElementsLength = h1Elements.length;
    for(var i = 0; i < h1ElementsLength; i++)
    {
        h1Elements[i].onselectstart = function(){return false;}
    }
    
    var h2Elements = document.getElementsByTagName('h2');
    var h2ElementsLength = h2Elements.length;
    for(var i = 0; i < h2ElementsLength; i++)
    {
        h2Elements[i].onselectstart = function(){return false;}
    }
    
    var h3Elements = document.getElementsByTagName('h3');
    var h3ElementsLength = h3Elements.length;
    for(var i = 0; i < h3ElementsLength; i++)
    {
        h3Elements[i].onselectstart = function(){return false;}
    }
        
    var imgElements = document.getElementsByTagName('img');
    var imgElementsLength = imgElements.length;
    for(var i = 0; i < imgElementsLength; i++)
    {
        imgElements[i].onselectstart = function(){return false;}
    }
    
    var labelElements = document.getElementsByTagName('label');
    var labelElementsLength = labelElements.length;
    for(var i = 0; i < labelElementsLength; i++)
    {
        labelElements[i].onselectstart = function(){return false;}
    }
    
}

function SetModalPopupEnabled(obj)
{
    Array.add(CurrentModalPopup, obj);    
}

function SetModalPopupDisabled(obj)
{
    Array.remove(CurrentModalPopup, obj);    
}

function SetDefaultFocus(obj)
{    
    var okElement = null;
    if(obj._OkControlID)
        okElement = $get(obj._OkControlID);
        
    var cancelElement = null;
    if(obj._CancelControlID)
        cancelElement = $get(obj._CancelControlID);
    
    if (okElement && !okElement.disabled && okElement.style.display != 'none')
            if(okElement.getElementsByTagName('a').length > 0)
                okElement.getElementsByTagName('a')[0].focus();
            else if(okElement.getElementsByTagName('input').length > 0)
                okElement.getElementsByTagName('input')[0].focus();            
                
    else if (cancelElement && !cancelElement.disabled && cancelElement.style.display != 'none')            
            if(cancelElement.getElementsByTagName('a').length > 0)
                cancelElement.getElementsByTagName('a')[0].focus();
            else if(cancelElement.getElementsByTagName('input').length > 0)
                cancelElement.getElementsByTagName('input')[0].focus();
                
}

function setSelectionRange(selectionStart, selectionEnd, input) 
{    
    if (input.createTextRange) //IE
    {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    }
    else if (input.setSelectionRange) //Firefox
    {
        input.setSelectionRange(selectionStart, selectionEnd);
    }
}

function EmptyFunction()
{
    return false;
}

if(Sys.Extended.UI.HoverMenuBehavior)
{
    Sys.Extended.UI.HoverMenuBehavior.prototype._onhover = Sys.Extended.UI.HoverMenuBehavior.prototype._onHover;
    Sys.Extended.UI.HoverMenuBehavior.prototype._onHover = Overloading__onHover;
    Sys.Extended.UI.HoverMenuBehavior.prototype.ResetBounds = function (elt)
                                                                 {
                                                                    this.element = elt;
                                                                 }
}

function Overloading__onHover()
{
    this._onhover();    
    if(this.element)
    {        
        var bounds = Sys.UI.DomElement.getBounds(this.element);
        this._popupBehavior.set_x(bounds.width + bounds.x + this._offsetX);
        this._popupBehavior.set_y(bounds.y - 1);        
    }
}

function getMousePosition(e, offsetLeft, offsetTop, offsetWidth, offsetHeight) 
{
    var docType = GetDocumentType();
    
    var clientBounds = CommonToolkitScripts.getClientBounds();
    var clientWidth = clientBounds.width;
    var clientHeight = clientBounds.height;
    var currleft = e.clientX + docType.scrollLeft + offsetLeft;
    var currtop = e.clientY + docType.scrollTop + offsetTop;
    curleft = (clientWidth > (currleft + offsetWidth) ? currleft + 2 : currleft - offsetWidth - offsetLeft - 8);
    curtop = (clientHeight > (currtop + offsetHeight) ? currtop : currtop - offsetHeight - offsetTop);
    return {currleft: curleft, currtop: curtop}
}

if(Sys.Extended.UI.ToggleButtonBehavior)
{
    var tbb = Sys.Extended.UI.ToggleButtonBehavior.prototype;
    tbb.set_CheckedValue = function(value)
                           {
                                this.get_element().checked = value;
                                this._onClick()
                           }
    tbb.get_CheckedValue = function()
                           {
                                return this.get_element().checked;
                           }
    
}

function GetTrimedText(text, width, classname)
{
    var dummyspan = $get("dummySpan");
    var dummytext = text;
    dummyspan.style.display = "";
    dummyspan.className = classname;
    
    SetTexttoControl(dummyspan, dummytext);
    
    if(dummyspan.offsetWidth > width)
    {    
        dummytext = text.substr(0,1);
        SetTexttoControl(dummyspan, dummytext);
        for(var i=2; dummyspan.offsetWidth < width; i++)
        {
            dummytext = text.substr(0,i);
            SetTexttoControl(dummyspan, dummytext);
        }
    }
    
    SetTexttoControl(dummyspan, "");
    
    dummyspan.style.display = "none";
    dummyspan = null;
    
    return dummytext ;
}

function Convert2HMSF(seconds)
{
    var stringSecond = "s" + seconds;
    var decimalIndex = stringSecond.indexOf(".");
    var msec = "000";
    if(decimalIndex >= 0)
    {        
        msec = stringSecond.substr(decimalIndex + 1, 3);
        while(msec.length != 3)
            msec += 0;
    }
    return Convert2HMS(seconds) + ":" + msec;
}

function Convert2HMS(seconds)
{
    var hms = new Array(3);
    seconds = parseInt(seconds, 10);
    
    var HMSString = Convert2HM(seconds) + ":";
       
    seconds %= 3600;        
    seconds %= 60;
    
    hms[0]  = parseInt(seconds, 10);

    if(hms[0] < 10)
      HMSString += "0"

    HMSString += hms[0];        

    return HMSString;
}

function Convert2HM(seconds)
{
    if(seconds == null)
        return "";
        
    var hm = new Array(2);
    seconds = parseInt(seconds, 10);
    
    hm[0] = parseInt(seconds / 3600, 10);
    seconds %= 3600;
    
    hm[1] = parseInt(seconds / 60, 10);
    seconds %= 60;
    
    var HMString = "";
    for(var i = 0; i < 2; i++)
    {
        if(hm[i] < 10)
          HMString += "0"
        
        HMString += hm[i];
        
        if(i != 1)
            HMString += ":";
    }
    return HMString;
}

function Convert2sec(time)
{
    var timearr = time.split(":");
        
    var sec = 0;
    for(var i=3; i>0; i--)
    {
         sec += (timearr[3-i] * Math.pow(60, i-1));
    }
    
    return sec;
}

function ShowTitle(e)
{
    var offsetLeft = 10;
    var offsetTop = 10;
    var target = e.target;
    
    if(target.originalText == undefined)
        return;
    
    if(!document.getElementById('tooltip'))
        newelement('tooltip');
    
    var tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = GetFormatText(target.originalText, 540, "tooltip");
    
    tooltip.style.display = "block";
    
    var currpos = getMousePosition(e, offsetLeft, offsetTop, tooltip.offsetWidth, tooltip.offsetHeight);
    
    tooltip.style.left = currpos.currleft + 'px';
    tooltip.style.top = currpos.currtop + 'px';
        
}

function HideTitle(e)
{
    var tooltip = document.getElementById('tooltip');
    tooltip.style.display = "none";
}

function AddTitle(elt)
{
    $addHandler(elt, "mouseover", ShowTitle); 
    $addHandler(elt, "mouseout", HideTitle); 
    $addHandler(elt, "mousemove", ShowTitle);
}

function RoundNumber(num, dec) 
{
    var decInNumber = Math.pow(10,dec);
	var result = Math.round(num * decInNumber)/decInNumber;
	return result;
}

function Sort(array, sortBy, sortOrder, dataType) {

    if (array == null || array.length <= 1)
        return array;

    var clause = function() { return this[sortBy]; };

    return (array.sort(function(a, b) {
        var x = clause.apply(a);
        var y = clause.apply(b);

        switch (dataType.toLowerCase()) {
            case 'number':
                break;
            case 'datetime':
                break;
            default:
                x = x.toLowerCase();
                y = y.toLowerCase();
                break;
        }

        if (sortOrder.toLowerCase() == "desc")
            return ((x > y) ? -1 : ((x < y) ? 1 : 0));
        else
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    }));
}

function Filter(array, searchText, searchBy) {
    if (searchText.trim().length == 0 || array.length == 0)
        return array;

    var clause = function() { return this[searchBy].toLowerCase().indexOf(searchText.toLowerCase()); };

    var filteredArray = new Array();

    for (var i = 0; i < array.length; i++) {
        if (clause.apply(array[i]) > -1)        
            Array.add(filteredArray, array[i]);
    }

    return filteredArray;
}

function GetDocumentType() {
    return (document.documentElement.scrollLeft >= document.body.scrollLeft) ?
                                document.documentElement : document.body;    
}

if (Sys.Extended.UI.MaskedEditBehavior) {
    var meb = Sys.Extended.UI.MaskedEditBehavior.prototype;
    meb._ExecuteNav = _ExecuteNav;    
}

function _ExecuteNav(evt, scanCode) {
    if (evt.type == "keydown") {
        if (Sys.Browser.agent == Sys.Browser.InternetExplorer) {
            // ctrl v 
            if ((scanCode == 86 || scanCode == 118) && !evt.shiftKey && evt.ctrlKey && !evt.altKey) {
                this._SetCancelEvent(evt);
                this._PasteFromClipBoard();
                return;
            }
            //Shift Ins 
            if (evt.shiftKey && !evt.ctrlKey && !evt.altKey && evt.keyCode == 45) {
                this._SetCancelEvent(evt);
                this._PasteFromClipBoard();
                return;
            }
        }
    }
    if (Sys.Browser.agent != Sys.Browser.InternetExplorer || evt.type == "keypress") {
        //Shift Ins 
        if (evt.rawEvent.shiftKey && !evt.rawEvent.ctrlKey && !evt.rawEvent.altKey && evt.rawEvent.keyCode == 45) {
            //at opera assume Ins = "-" not execute Shift-Ins
            this._SetCancelEvent(evt);
            this._PasteFromClipBoard();
            return;
        }
        // ctrl v 
        if (evt.type == "keypress" && (scanCode == 86 || scanCode == 118) && !evt.shiftKey && evt.ctrlKey && !evt.altKey) {
            this._SetCancelEvent(evt);
            this._PasteFromClipBoard();
            return;
        }
    }
    if (Sys.Browser.agent == Sys.Browser.InternetExplorer || evt.type == "keypress") {
        if (evt.ctrlKey) {
            if (scanCode == 39 || scanCode == 35 || scanCode == 34) //Right or END or pgdown
            {
                this._DirectSelText = "R";
                if (Sys.Browser.agent == Sys.Browser.Opera) {
                    return;
                }
                this._SetCancelEvent(evt);
                curpos = this._getCurrentPosition();
                this.setSelectionRange(curpos, this._LogicLastPos + 1);
            }
            else if (scanCode == 37 || scanCode == 36 || scanCode == 33) //Left or Home or pgup
            {
                this._DirectSelText = "L";
                if (Sys.Browser.agent == Sys.Browser.Opera) {
                    return;
                }
                this._SetCancelEvent(evt);
                curpos = this._getCurrentPosition();
                this.setSelectionRange(this._LogicFirstPos, curpos);
            }
        }
        else if (scanCode == 35 || scanCode == 34) //END or pgdown
        {
            this._DirectSelText = "R";
            if (Sys.Browser.agent == Sys.Browser.Opera) {
                return;
            }
            this._SetCancelEvent(evt);
            if (evt.shiftKey) {
                curpos = this._getCurrentPosition();
                this.setSelectionRange(curpos, this._LogicLastPos + 1);
            }
            else {
                this.setSelectionRange(this._LogicLastPos + 1, this._LogicLastPos + 1);
            }
        }
        else if (scanCode == 36 || scanCode == 33) //Home or pgup
        {
            this._DirectSelText = "L";
            if (Sys.Browser.agent == Sys.Browser.Opera) {
                return;
            }
            this._SetCancelEvent(evt);
            if (evt.shiftKey) {
                curpos = this._getCurrentPosition();
                this.setSelectionRange(this._LogicFirstPos, curpos);
            }
            else {
                this.setSelectionRange(this._LogicFirstPos, this._LogicFirstPos);
            }
        }
        else if (scanCode == 37) //left
        {
            this._DirectSelText = "L";
            if (Sys.Browser.agent == Sys.Browser.Opera) {
                return;
            }
            this._SetCancelEvent(evt);
            if (evt.shiftKey) {
                var BoundSel = this._GetBoundSelection();
                if (BoundSel) {
                    if (BoundSel.left > this._LogicFirstPos) {
                        BoundSel.left--;
                    }
                    this.setSelectionRange(BoundSel.left, BoundSel.right);
                }
                else {
                    var pos = this._getCurrentPosition();
                    if (pos > this._LogicFirstPos) {
                        this.setSelectionRange(pos - 1, pos);
                    }
                }
            }
            else {
                curpos = this._getCurrentPosition() - 1;
                if (curpos < this._LogicFirstPos) {
                    curpos = this._LogicFirstPos;
                }
                this.setSelectionRange(curpos, curpos);
            }
            if (Sys.Browser.agent == Sys.Browser.Opera) {
                var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper(this.get_element());
                this._SaveText = wrapper.get_Value();
                this._SavePosi = curpos;
                this._timer.set_enabled(false);
                this._timer.set_interval(1);
                this._timer.set_enabled(true);
            }
        }
        else if (scanCode == 39) // right
        {
            this._DirectSelText = "R";
            if (Sys.Browser.agent == Sys.Browser.Opera) {
                return;
            }
            this._SetCancelEvent(evt);
            if (evt.shiftKey) {
                var BoundSel = this._GetBoundSelection();
                if (BoundSel) {
                    if (BoundSel.right < this._LogicLastPos + 1) {
                        BoundSel.right++;
                    }
                    this.setSelectionRange(BoundSel.left, BoundSel.right);
                }
                else {
                    pos = this._getCurrentPosition();
                    if (pos < this._LogicLastPos + 1) {
                        this.setSelectionRange(pos, pos + 1);
                    }
                }
            }
            else {
                curpos = this._getCurrentPosition() + 1;
                if (curpos > this._LogicLastPos + 1) {
                    curpos = this._LogicLastPos + 1;
                }
                this.setSelectionRange(curpos, curpos);
            }
            if (Sys.Browser.agent == Sys.Browser.Opera) {
                var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper(this.get_element());
                this._SaveText = wrapper.get_Value();
                this._SavePosi = curpos;
                this._timer.set_enabled(false);
                this._timer.set_interval(1);
                this._timer.set_enabled(true);
            }
        }
        else if (scanCode == 27) // esc
        {
            this._SetCancelEvent(evt);
            var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper(this.get_element());
            if (this._EmptyMask == this._initialvalue) {
                wrapper.set_Value("");
            }
            else {
                wrapper.set_Value(this._initialvalue);
            }
            this._onFocus();
        }
        //else if (scanCode == 38 || scanCode == 40)  //up - down 
    }
    // any other nav key
    this._SetCancelEvent(evt);
}

function RemoveChildNodes(control) {
    var ctrl = document.getElementById(control);

    while (ctrl.hasChildNodes())
        ctrl.removeChild(ctrl.lastChild);
}

function SetTheatreAndScreenCodeValue(theatreCodeValue, screenCodeValue) {
    if (theatreCodeValue != "") {
        $get("tdTheatreCode").style.display = "block";
        var tcValue = theatreCodeValue;
        if (theatreCodeValue.length > 10) {
            tcValue = theatreCodeValue.substr(0, 10) + "...";
            $get("spnMasterTheatreCodeValue").title = theatreCodeValue;
        }
        SetTexttoControl("spnMasterTheatreCodeValue", tcValue);
    }

    if (screenCodeValue != "") {
        $get("tdScreenCode").style.display = "block";
        var scValue = screenCodeValue;
        if (screenCodeValue.length > 10) {
            scValue = screenCodeValue.substr(0, 10) + "...";
            $get("spnMasterScreenCodeValue").title = screenCodeValue;
        }
        SetTexttoControl("spnMasterScreenCodeValue", scValue);
    }
}

function TrimStart(value, chars) {
    var isCharacterTrimed = true;

    while (isCharacterTrimed) {
        isCharacterTrimed = false;
        for (var i = 0; i < chars.length; ++i) {
            while (value.indexOf(chars[i]) == 0) {
                value = value.substr(1);
                isCharacterTrimed = true;
            }
        }
    }

    return value;
}

function GetCursorPosition(ctrl) {
    var CursorPosition = 0; // IE Support
    if (document.selection) {
        ctrl.focus();
        var Sel = document.selection.createRange();
        Sel.moveStart('character', -ctrl.value.length);
        CursorPosition = Sel.text.length;
    }
    // Firefox support
    else if (ctrl.selectionStart || ctrl.selectionStart == '0')
        CursorPosition = ctrl.selectionStart;
    return (CursorPosition);
}

function OnErrorDummy()
{ }

if (Sys.Extended.UI.NumericUpDownBehavior) {
    var nud = Sys.Extended.UI.NumericUpDownBehavior.prototype;
    
    nud._computePrecision = function(value) {
        if (value == Number.Nan) {
			return this._min;
		}
        
		var str = value.toString();
		
		if (str) {
			var fractionalPart = /\.(\d*)$/;
			var matches = str.match(fractionalPart);
			if (matches && matches.length == 2 && matches[1]) {
				return matches[1].length;
			}
		}

		return 0;
    }
}