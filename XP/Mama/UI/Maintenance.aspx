<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Maintenance" UICulture = "auto" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="maintenance" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">
	<script type="text/javascript" language="javascript" src="Scripts/Maintenance.js"></script>
    <div id="maintenanceBg">
        <%--<div id="updateDiv">
            <span class="selectUpdatePackageLabel" id="SUPLbl"></span>
            <input id="local" name="pathSelect" tabindex="12" type="radio" checked="checked" onclick ="OnLocalClicked()" />
            <span class="maintenanceLocalLabel" id="localLbl"></span>
            
            <input id="web" name="pathSelect" tabindex="13" type="radio" onclick ="OnWebClicked()" />
            <span class="maintenanceWebLabel" id="webLbl"></span>
        
            <img id="arrow" src="res/Skins/<%= Master.SkinName %>/Maintenance/Arrow.gif"/>
            
            <table border="0" cellpadding="0" cellspacing="0" id="getUpdate">
                <tr>
                    <td class="buttonPadding buttonEnabled">
                        <a class="buttonEnabledText" href="#"id="getUpdateTxt"></a>
                    </td>
                </tr>                    
            </table>
            
            <img id="browse" src="res/Skins/<%= Master.SkinName %>/Maintenance/browse.gif"/>
            <input id="pkgPath" type="text" tabindex="14"/>
        </div>--%>
   
        <%--<span class="updateFirmwareLabel" id="updateLbl"></span>--%>
        <span class="systemLabel" id="systemLbl"></span>
        
        <table border="0" cellpadding="0" cellspacing="0" id="restart">
            <tr>
                <td class="buttonPadding buttonEnabled" onclick="ConfirmAction(event, 'restart');">
                    <a class="buttonEnabledText" href="#" id="restartTxt"></a>
                </td>
            </tr>                    
        </table>
        
        <table border="0" cellpadding="0" cellspacing="0" id="shutdown">
            <tr>
                <td class="buttonPadding buttonEnabled" onclick="ConfirmAction(event, 'shutdown');">
                    <a class="buttonEnabledText" href="#" id="shutdownTxt"></a>
                </td>
            </tr>                    
        </table>        
    </div>
</asp:Content>    
