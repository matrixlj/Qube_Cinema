
Sys.WebForms.PageRequestManager.getInstance().add_beginRequest(BeginRequestHandler);
Sys.WebForms.PageRequestManager.getInstance().add_endRequest(EndRequestHandler);

setStyle();

Sys.Application.add_load(PageLoad);
Sys.Application.add_unload(PageUnload);

var prevRowIndex = null;

function PageUnload()
{
    Qube.Mama.LogService.ClearSession();    
}

function PageLoad() 
{
    logs_SetText();

    $get('ctl00_ContentPlaceHolder_getLogs').src = "res/Skins/" + skin + "/Logs/getEnable.gif";

    $find('maskFromBehavior').set_CultureDatePlaceholder('/');
    $find('maskToBehavior').set_CultureDatePlaceholder('/');
    
    var div = document.getElementById("logsTableDiv"); 
    var table = div.getElementsByTagName("table"); 
           
    if(table && table.length > 0)
    {   
        table = table[0]; 
        
        var headerColumns = table.rows[0].getElementsByTagName("th");
        
        if(headerColumns.length == 8)
            headerColumns[0].style.display = 'none';
                
        for(var i = 1; i < table.rows.length; i++)
        {
            var firstColumn = table.rows[i].getElementsByTagName("td");
            
            var text = GetControlText(firstColumn[0]);

            if (table.rows[i].className == "pageNavigator")
                continue;
            
            if(table.rows[i].className == 'rowStyle')
            {
                if(firstColumn.length == 4)
                    firstColumnWidth = 500;
                else if(firstColumn.length == 5)
                    firstColumnWidth = 400;
                else
                {                
                    table.rows[i].ondblclick = function(){TooltipDisplayForLog(this)};
                    table.rows[i].onclick = function()
                                            {
                                                SetTransparentColor(prevRowIndex);                                                
                                                prevRowIndex = this.rowIndex;
                                                this.style.backgroundColor = "#E4E2DD";
                                            };
                    firstColumn[0].setAttribute("originalText", text);
                    firstColumn[0].style.display = 'none';
                    
                    var eventLogErrorType = GetControlText(firstColumn[1]);
                    if(eventLogErrorType == "0")
                        SetTexttoControl(firstColumn[1], "Information");
                    
                    var eventLogCategory = GetControlText(firstColumn[4]);
                    
                    if(eventLogCategory == "(0)")
                        SetTexttoControl(firstColumn[4], "None");
                        
                    var eventLogUserName = GetControlText(firstColumn[6]);                    
                    
                    if(eventLogUserName == null || eventLogUserName.trim().length == 0 || eventLogUserName.length == 1)
                        SetTexttoControl(firstColumn[6], "N/A");
                }
            }
            
            if(firstColumn.length != 8)
            {
                firstColumn[0].style.width = firstColumnWidth + "px";
                var trimedText = GetTrimedText(text, firstColumnWidth - 50, "rowStyle");
            
                if(trimedText != text)
                {
                    trimedText = trimedText + "...";
                    firstColumn[0].title = text;                
                }
                
                SetTexttoControl(firstColumn[0], trimedText);
            }
        }            
    
        var offset = (Sys.Browser.agent === Sys.Browser.InternetExplorer ? 6 : 2);
                
        if(table.offsetHeight > div.offsetHeight)
            div.style.height = table.offsetHeight;
                
        if(table.rows[table.rows.length - 1].className == 'rowStyle')
            table.rows[table.rows.length - 1].style.height = '15px';
        else
        {
            var pageHeight = (div.offsetHeight - table.offsetHeight + table.rows[table.rows.length - 1].offsetHeight - offset);
            if(Sys.Browser.agent === Sys.Browser.Safari)
                pageHeight = pageHeight - 3;
            table.rows[table.rows.length - 1].style.height = pageHeight + 'px';
            var col = table.rows[table.rows.length - 1].getElementsByTagName("TD");
            col[0].style.height = table.rows[table.rows.length - 1].style.height;
        }
    } 
    
    div.style.overflow = "auto";
    div.style.visibility = "visible";
}

function setStyle()
{
    document.getElementById("logMenu").className = "MenuFocus";
    EnableDownloadLog();
    var body = document['body'];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Logs/Logs.jpg)";   
}

function BeginRequestHandler(sender, args) 
{
    CloseMessageWindow();
        
    var tabCont = $find(tabContainer);
    var activeTabIndex = tabCont == null ? 1 : tabCont.get_activeTabIndex();
    
    if(activeTabIndex != 4)
        Default2WaitCursor();
}

function EndRequestHandler(sender, args) 
{
    Wait2DefaultCursor();
    EnableDownloadLog();

    var error = args.get_error();

    if (error != null) {
        args.set_errorHandled(true);
        var msg = error.message.replace("Sys.WebForms.PageRequestManagerServerErrorException: ", "");
        alert(msg);
    }
}

function Wait2DefaultCursor()
{
    pi.Hide();      
}

function Default2WaitCursor()
{    
    pi.Show(DisplayTextResource.loading + '...');        
}

function EnableDownloadLog()
{
    var grdView = document.getElementById("ctl00_ContentPlaceHolder_gridView");
    var downloadLog = document.getElementById("ctl00_ContentPlaceHolder_downloadLog");
    var tabCont = $find(tabContainer);
    var activeTabIndex = tabCont == null ? 1 : tabCont.get_activeTabIndex();
    
    if(activeTabIndex <= 1 && grdView != null && grdView.rows.length > 1)
        downloadLog.style.display = '';
    else
        downloadLog.style.display = 'none';        
}

function logs_SetText()
{
    SetTexttoControl("fromLabel", DisplayTextResource.from);
    SetTexttoControl("toLabel", DisplayTextResource.to);      
}

function ActiveTabChanged_Client(sender, e)
{  
    __doPostBack(sender.get_id(), sender.get_activeTab().get_headerText());
}

function TooltipDisplayForLog(row)
{
    var offsetLeft = 10;
    var offsetTop = 5;
    
    SetTransparentColor(prevRowIndex);
    
    prevRowIndex = row.rowIndex;
    
    var columns = row.getElementsByTagName("TD");
    var srcElement = columns[0];
    
    var text = srcElement.getAttribute("originalText");
    
    if(text && text != '')
    {    
        row.style.backgroundColor = "#E4E2DD";
        var tooltipMessage = text
        if(!document.getElementById('tooltip'))
            newelement('tooltip');
            
        var tooltip = document.getElementById('tooltip');
        
        tooltip.style.textAlign = "left";
        tooltip.style.fontSize = "12px";
           
        tooltip.innerHTML = "<table><tr><td align='left'>" +
            "<table><tr><td style='padding:5px;'><a style='color:gray;' href='javascript:MovePrevMessage()'>prev</a></td>" +
            "<td style='padding:5px;'><a style='color:gray;' href='javascript:MoveNextMessage()'>next</a></td>" + 
            "<td style='padding:5px;'><a style='color:gray;' href='javascript:CloseMessageWindow()'>close</a></td>" +
            "</tr></table></td></tr></table><br>"  + tooltipMessage;
        
        var ttstyle = tooltip.style;
        
        if(tooltipMessage != '')
            ttstyle.display = 'block';        
            
        ttstyle.left = 520 + 'px';
        ttstyle.top = 160 + 'px';
    }
}

function MovePrevMessage()
{
    var div = document.getElementById("logsTableDiv"); 
    var table = div.getElementsByTagName("table"); 
    if(prevRowIndex >= 2)
        TooltipDisplayForLog(table[0].rows[prevRowIndex - 1]);
}

function MoveNextMessage()
{
    var div = document.getElementById("logsTableDiv"); 
    var table = div.getElementsByTagName("table"); 
    if(prevRowIndex <= table[0].rows.length - 2)
        TooltipDisplayForLog(table[0].rows[prevRowIndex + 1]);
}

function CloseMessageWindow()
{
    if(document.getElementById('tooltip'))
       document.getElementById('tooltip').style.display = 'none';
}

function SetTransparentColor(rowIndex)
{
    var div = document.getElementById("logsTableDiv"); 
    var table = div.getElementsByTagName("table"); 
    
    if(rowIndex == null || table.length == 0 || rowIndex > table[0].rows.length - 1)
        return;
        
    table[0].rows[rowIndex].style.backgroundColor = '';
}

function ToDateValidation()
{
    var from = $find('logFrom_BID').get_element().value.trim();
    var to = $find('logTo_BID').get_element().value.trim();
    
    var isFromEmpty = (from.length == 0 || from == 'mm/dd/yyyy');
    var isToEmpty = (to.length == 0 || to == 'mm/dd/yyyy');
    
    if(isFromEmpty && isToEmpty)
        return true;
    else if(isFromEmpty && !isToEmpty)
        return false;

    if(!(new Date(from) <= new Date()))
    {
        ConfirmationWindow(DisplayTextResource.invalidDate, DisplayTextResource.FromDateMustLesserThanToday, "res/Skins/" + skin + "/Common/error.gif", null, null);
        return false;
    }

    if (isToEmpty)
        return true;
    
    if(!(new Date(to) <= new Date()))
    {
        ConfirmationWindow(DisplayTextResource.invalidDate, DisplayTextResource.ToDateMustLesserThanToday, "res/Skins/" + skin + "/Common/error.gif", null, null);
        return false;
    }
    
    if(!(new Date(from) <= new Date(to)))
    {
        ConfirmationWindow(DisplayTextResource.invalidDate, DisplayTextResource.ToDateMustGreaterThanFrom, "res/Skins/" + skin + "/Common/error.gif", null, null);
        return false;
    }
        
    return true;
}