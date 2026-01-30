<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Shows"
    UICulture="auto" CodeBehind="Shows.aspx.cs" Inherits="ShowsPage" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="Shows" ContentPlaceHolderID="ContentPlaceHolder" runat="Server" EnableViewState="false">
    <script type="text/javascript">
        var compositionType = '<%= CompositionType.ClientID %>';
    </script>

    <div id="bg" smartnavigation="false">
        <div style="display: none;" id="divShowHandler" class="showHandlerControls">
            <table>
                <tr>
                    <td>
                        <table border="0" cellpadding="0" cellspacing="0" id="newShow" class="divshownew">
                            <tr>
                                <td onclick="NewShow()" class="buttonPadding buttonEnabled">
                                    <a class="buttonEnabledText" id="newshowTxt" href="#"></a>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td>
                        <span class="showLabel" id="chooseShowLabel"></span>
                    </td>
                    <td>                        
                        <asp:Label ID="lblHeading" runat="server" Text="" EnableViewState="false"
                            CssClass="showShowLabel AjaxDropDown" Width="250"/>
                        <asp:Panel ID="showShowList" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                            visibility: hidden; width: 250px;" EnableViewState="false">
                        </asp:Panel>
                        <ajaxToolkit:DropDownExtender BehaviorID="showextnd" ID="showextnd" runat="server"
                            TargetControlID="lblHeading" DropDownControlID="showShowList" EnableViewState="false">
                        </ajaxToolkit:DropDownExtender>
                    </td>
                    <td>      
                        <div class="divshowdelete" id="deleteShow" >
                            <table border="0" cellpadding="0" cellspacing="0" class="buttonSize">
                                <tr>
                                    <td onclick="ConfirmShowDeletion()" class="buttonPadding buttonEnabled">
                                        <a class="buttonEnabledText" id="deleteshowTxt" href="#"></a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div id="deleteShowDisabled">
                            <table border="0" cellpadding="0" cellspacing="0" class="buttonSize">
                                <tr>
                                    <td class="buttonPadding buttonDisabled">
                                        <span class="buttonDisabledText" id="spnDeleteShowDisabled"></span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <ajaxToolkit:TabContainer ID="CompositionType" runat="server" Width="705px" Height="245px"
            Style="left: 29px; top: 158px; position: absolute;" 
            OnClientActiveTabChanged="ActiveTabChanged"
            EnableViewState="false">
            <ajaxToolkit:TabPanel ID="feature" runat="server" HeaderText="" EnableViewState="false">
                <ContentTemplate>
                    <div id="divfeature" class="titlesDiv">
                        <table id="tblfeature" width="100%">
                            <tbody id="tbfeature">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="advertisement" runat="server" EnableViewState="false" HeaderText="">
                <ContentTemplate>
                    <div id="divad" class="titlesDiv">
                        <table id="tblad" width="100%">
                            <tbody id="tbad">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="trailers" runat="server" EnableViewState="false" HeaderText="">
                <ContentTemplate>
                    <div id="divtrailer" class="titlesDiv">
                        <table id="tbltrailer" width="100%">
                            <tbody id="tbtrailer">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="shorts" runat="server" EnableViewState="false" HeaderText="">
                <ContentTemplate>
                    <div id="divshort" class="titlesDiv">
                        <table id="tblshort" width="100%">
                            <tbody id="tbshort">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="others" runat="server" EnableViewState="false" HeaderText="">
                <ContentTemplate>
                    <div id="divother" class="titlesDiv">
                        <table id="tblother" width="100%">
                            <tbody id="tbother">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="playlist" runat="server" EnableViewState="false" HeaderText="">
                <ContentTemplate>
                    <div id="divplaylist" class="titlesDiv">
                        <table id="tblplaylist" width="100%">
                            <tbody id="callplayList">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
        </ajaxToolkit:TabContainer>
        <ajaxToolkit:TabContainer runat="server" ID="eventTabs" Style="width: 229px; left: 746px;
            top: 158px; position: absolute;" EnableViewState="false">
            <ajaxToolkit:TabPanel ID="wait" runat="server" EnableViewState="false" HeaderText="">
                <ContentTemplate>
                    <div id="divwaitevents" class="titlesDivs">
                        <table width="200">
                            <tr>
                                <td width="25px">
                                    <img id="wait for panel key" name="wait" src="res/Skins/<%= Master.SkinName %>/Common/Add Icon.gif" class="drag" />
                                </td>
                                <td>
                                    <label id="waitForPanelKey" style="color: Black; padding-top: 5px; margin: 0">
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <img id="wait for duration" name="wait" src="res/Skins/<%= Master.SkinName %>/Common/Add Icon.gif" class="drag" />
                                </td>
                                <td>
                                    <label id="waitForDuration" style="color: Black; padding-top: 5px; margin: 0">
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <img id="wait for ext trigger" name="wait" src="res/Skins/<%= Master.SkinName %>/Common/Add Icon.gif" class="drag" />
                                </td>
                                <td>
                                    <label id="waitForExtTrigger" style="color: Black; padding-top: 5px; margin: 0">
                                    </label>
                                </td>
                            </tr>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel runat="server" EnableViewState="false" ID="cue" HeaderText="">
                <ContentTemplate>
                    <div id="divcueevents" class="titlesDivs">
                        <table width="200">
                            <tbody id="tbCueList">
                            </tbody>
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>
        </ajaxToolkit:TabContainer>
        <span id="hideParam" class="hideParam"></span>
        <div id="divapp" class="cueEventInputParamWindow">
            <asp:Panel ID="ParamWindow" runat="server" CssClass="paramWin" EnableViewState="false">
                <asp:Panel ID="Ttl" runat="server" CssClass="innerPanel" title="event" EnableViewState="false">
                    <span id="paramWintitle" class="title"></span>
                </asp:Panel>
                <div id="popbody">
                    <div id="body" class="bodyText">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding: 5px 0px 5px 0px">
                                    <span id="lblOffset" class="offsetLabel"></span>
                                </td>
                                <td style="padding: 5px 0px 5px 5px">
                                    <asp:TextBox ID="offset" Text="" Enabled="false" onpaste="return false"
                                        MaxLength="12" runat="server" Width="78px" EnableViewState="false"
                                        onchange="javascript:offsetTimeChanged('offSet_BID'); return false;"/>
                                    <ajaxToolkit:MaskedEditExtender ID="offsetExtender" runat="server" ClearMaskOnLostFocus="false"
                                        TargetControlID="offset" Mask="99:99:99:999" OnFocusCssClass="MaskedEditFocus"
                                        OnInvalidCssClass="MaskedEditError" MaskType="Number" InputDirection="LeftToRight"
                                        CultureName="en-US" BehaviorID="offSet_BID" 
                                        AutoComplete="false" EnableViewState="false"/>
                                </td>
                            </tr>
                            <tr id="trDuration" style="display: none;">
                                <td style="padding: 0px 0px 5px 0px">
                                    <span id="lblwaitEvntDur" class="waitDurationLabel"></span>
                                </td>
                                <td style="padding: 5px 0px 5px 5px">
                                    <asp:TextBox ID="waitEvntDur" autocomplete="off" onpaste="return false"
                                        MaxLength="12" runat="server" Width="78px" EnableViewState="false"
                                        onchange="javascript:offsetTimeChanged('Duration_BID'); return false;" />
                                    <ajaxToolkit:MaskedEditExtender ID="durationExtender" runat="server" ClearMaskOnLostFocus="false"
                                        TargetControlID="waitEvntDur" Mask="99:99:99:999" MessageValidatorTip="true"
                                        OnFocusCssClass="MaskedEditFocus" OnInvalidCssClass="MaskedEditError" MaskType="Number"
                                        InputDirection="LeftToRight" CultureName="en-US" BehaviorID="Duration_BID" AutoComplete="false" 
                                        EnableViewState="false"/>
                                </td>
                            </tr>
                            <tr id="trTriggerEvnt" style="display: none;">
                                <td colspan="2">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 0px 0px 5px 0px">
                                                <span id="lbltriggerEvnt" class="triggerEventLabel"></span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <asp:Label ID="lblddltriggerEvnt" runat="server" value="" displayText="" Text=""
                                                    CssClass="AjaxDropDown trigerEventDropDown" EnableViewState="false"/>
                                                <asp:Panel ID="pnltriggerEvnt" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                    visibility: hidden;" EnableViewState="false">
                                                    <a href="#" id="CONTINUE" value="CONTINUE" displaytext="" class="ContextMenuItem">
                                                    </a><a href="#" id="START-PRESHOW" value="START-PRESHOW" displaytext="" class="ContextMenuItem">
                                                    </a><a href="#" id="STARTFEATURE" value="STARTFEATURE" displaytext="" class="ContextMenuItem">
                                                    </a>
                                                </asp:Panel>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <ajaxToolkit:DropDownExtender BehaviorID="triggerEvntextnd" ID="triggerEvntextnd"
                            runat="server" TargetControlID="lblddltriggerEvnt" DropDownControlID="pnltriggerEvnt"
                            EnableViewState="false">
                        </ajaxToolkit:DropDownExtender>
                        <table class="tblapply" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="right">
                                    <a id="apply" onclick="OnParamSet()" class="buttonEnabledText showApplyText" href="#" disabled="disabled">
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </asp:Panel>
        </div>
        
        <div id="timeline" class="timeLine"></div>
        
        <table border="0" class="showDuration">
            <tr>
                <td align="right">
                    <table border="0">
                        <tr>
                            <td class="text">
                                <span id="showDurationLabel" class="showDurationLabel"></span>
                            </td>
                            <td style="padding-left: 5px; white-space: nowrap;">
                                <span id="showDuration" class="showDurationInfo">00:00:00</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <div id="restrictedCharToolTip" class="tooltip" style="display: none; left: 560px;
            top: 550px; position: absolute;">
        </div>
        <table border="0" class="showName">
            <tr>
                <td align="right">
                    <table border="0">
                        <tr>
                            <td>
                                <span class="showNameLabel" id="showNameLabel"></span>
                            </td>
                            <td style="padding-left: 5px;">
                                <asp:TextBox ID="showName" CssClass="showNameTextBox" onkeypress="KeypressEvent(window.event,Save,'');"
                                    onkeyup="ValidateShowEmpty(this)" runat="server" EnableViewState="false" MaxLength="100"></asp:TextBox>                                    
                                <ajaxToolkit:FilteredTextBoxExtender ID="filterShowName" TargetControlID="showName"
                                    BehaviorID="filterShowName" FilterMode="InvalidChars" FilterType="Custom" InvalidChars="<>?/\:*|&quot;#"
                                    runat="server" EnableViewState="false">
                                </ajaxToolkit:FilteredTextBoxExtender>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
    
    <div class="divshowsave" id="saveShow">
        <table border="0" cellpadding="0" cellspacing="0" class="buttonSize">
            <tr>
                <td onclick="Save()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" id="saveshowTxt" href="#"></a>
                </td>
            </tr>
        </table>
    </div>    
    <div id="saveShowDisabled">
        <table border="0" cellpadding="0" cellspacing="0" class="buttonSize">
            <tr>
                <td class="buttonPadding buttonDisabled">
                    <span class="buttonDisabledText" id="spnSaveShowDisabled"></span>
                </td>
            </tr>
        </table>
    </div>
    
    <table border="0" cellpadding="0" cellspacing="0" id="cancelShow" class="divshowcancel">
        <tr>
            <td onclick="Cancel()" class="buttonPadding buttonEnabled">
                <a class="buttonEnabledText" id="cancelshowTxt" href="#"></a>
            </td>
        </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" id="cancelShowDisabled">
        <tr>
            <td class="buttonPadding buttonDisabled">
                <span class="buttonDisabledText" id="spnCancelShowDisabled"></span>
            </td>
        </tr>
    </table>
    <img id="dragCueEventLeft" style="display: none; height: 22px;" src="res/Skins/<%= Master.SkinName %>/Common/cue_grey.gif"
        alt="" class="dragelement" />
    <img id="dragCueEventRight" style="display: none; height: 22px;" src="res/Skins/<%= Master.SkinName %>/Common/cue_grey.gif"
        alt="" class="dragelement" />
    <img id="dragWaitEventLeft" style="display: none; height: 22px" src="res/Skins/<%= Master.SkinName %>/Common/cue_grey_pause.gif"
        alt="" class="dragelement" />
    <img id="dragWaitEventRight" style="display: none; height: 22px" src="res/Skins/<%= Master.SkinName %>/Common/cue_grey_pause.gif"
        alt="" class="dragelement" />
    <img id="dragimg" style="display: none" src="res/Skins/<%= Master.SkinName %>/Common/Add Icon.gif" alt="" class="dragelement" />
    <span id="titleTypeProgress" class="titleTypeProgress"></span>

    <script type="text/javascript" language="javascript" src="Scripts/Shows.js"></script>

</asp:Content>
