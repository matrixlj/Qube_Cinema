<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Ingests" UICulture="auto"
    Inherits="Ingest" CodeBehind="Ingest.aspx.cs" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="Ingest" ContentPlaceHolderID="ContentPlaceHolder" runat="Server" EnableViewState="false">    
    <script type="text/javascript" language="javascript" src="Scripts/Ingest.js"></script>        
    <div id="ingestDiv">
        <span class="currentIngestLabel" id="currentIngestLabel"></span>
        <span class="ingestStatusLabel" id="statusLabel"></span>
        <span class="compositionLabel" id="compositionLabel"></span>
        <span class="progressLabel" id="progressLabel"></span>
        <div id="currentIngestsDiv" onselectstart='return false;'>
            <table id="currentIngestsTable" cellspacing="0" cellpadding="0">
                <tbody id="currentIngestsTableBody" />
            </table>
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" class="ingestStatusInfo">
            <tr>
                <td align="right">
                    <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td><img id="transferringImg" src="res/Skins/<%= Master.SkinName %>/Ingest/Icon Transferring Blue.gif" /></td>
                            <td><span class="transferringLabel" id="transferringLabel"></span></td>
                            <td><img id="suspendedImg" src="res/Skins/<%= Master.SkinName %>/Ingest/Icon Suspended Blue.gif" /></td>
                            <td><span class="suspendedLabel" id="suspendedLabel"></span></td>
                            <td><img id="queuedImg" src="res/Skins/<%= Master.SkinName %>/Ingest/Icon Queued Blue.gif" /></td>
                            <td><span class="queuedLabel" id="queuedLabel"></span></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
                
        <table border="0" cellpadding="0" cellspacing="0" id="addIngestButton" class="addIngestButton">
            <tr>
                <td onclick="OnAddIngestClicked()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" id="addIngestTxt" href="#"></a>
                </td>
            </tr>
        </table>
                
        <div id="addIngestDiv">
            <table cellpadding="0" cellspacing="0" class="tblAddIngest">
                <tr>
                    <td style="padding-left:24px;" class="borderLeftTopBottom">
                        <span id="spnNamedSpace" class="namedSpaceLabel"></span>
                    </td>
                    <td style="white-space:nowrap;" class="borderBottomTop">
                        <div id="cboNamedIngest">
                            <asp:Label ID="lblHeading" runat="server" Text="" CssClass="namedLabel AjaxDropDown" EnableViewState="false"/>
                            <asp:Panel ID="namedList" runat="server" CssClass="ContextMenuPanel" Width="275"
                                Style="display :none; visibility: hidden;" EnableViewState="false">         
                            </asp:Panel>
                            <ajaxToolkit:DropDownExtender BehaviorID="namedextnd" ID="namedextnd" runat="server" TargetControlID="lblHeading" EnableViewState="false"
                            DropDownControlID="namedList"></ajaxToolkit:DropDownExtender>                            
                        </div>                        
                    </td>
                    <td class="borderRightTopBottom" style="text-align:right;padding-top:5px;">
                        <input type="image" id="shortnamedelete" style="display:none;" title="delete" 
                            class="shortnamedelete" src="res/Skins/<%= Master.SkinName %>/Common/imgDelete.gif" 
                            onclick="return DeleteShortName()" />
                    </td>
                </tr>
                <tr>
                    <td class="borderLeft" style="white-space:nowrap;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td>                                
                                    <input id="localIngestOption" name="IngestOption" checked="checked" type="radio" 
                                        onclick="OnLocalClicked('<%= userName.ClientID %>','password')" 
                                        style="left: 6px" />
                                    <span class="localLabel" id="localLabel"></span>
                                </td>
                                <td rowspan="2"><img id="arrowImg" src="res/Skins/<%= Master.SkinName %>/Ingest/Arrow.gif" /></td>                                
                            </tr>
                            <tr>
                                <td>
                                    <input id="webIngestOption" name="IngestOption" type="radio" 
                                        onclick="OnWebClicked('<%= userName.ClientID %>','password')"
                                        style="left: 6px" />
                                    <span class="networkLabel" id="networkLabel"></span>
                                </td>                                                                
                            </tr>                            
                        </table>
                    </td>                    
                    <td colspan="2" class="borderRight">
                        <asp:TextBox ID="ingestPath" runat="server" CssClass="ingestPath" style="left: 150px" 
                            EnableViewState="false" onkeypress = "KeypressEvent(event, OnIngestClick, '')"/>
                        <ajaxToolkit:TextBoxWatermarkExtender ID="ingestPathTBWE" runat="server" TargetControlID="ingestPath" EnableViewState="false"
                            WatermarkText=" " WatermarkCssClass="watermarkIngestPath" BehaviorID="ingestPath_bID" />                         
                    </td>
                </tr>
                <tr>
                    <td class="borderLeft" style="padding-left:40px;">
                        <span class="userNameLabel" id="userNameLabel"></span>
                    </td>
                    <td colspan="2" rowspan="2" class="borderRightBottom">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>                                
                                <td style="text-align:left;">
                                    <asp:TextBox ID="userName" runat="server" CssClass="userName"
                                        Enabled="False" style="left: 150px" EnableViewState="false"
                                        onkeypress = "KeypressEvent(event, OnIngestClick, '')"/>
                                    <ajaxToolkit:TextBoxWatermarkExtender ID="userNameTBWE" 
                                        runat="server" TargetControlID="userName" EnableViewState="false"
                                        WatermarkText=" " WatermarkCssClass="watermarkUserName" 
                                        BehaviorID="username_bID" />
                                </td>                                
                            </tr>
                            <tr>
                                <td>
                                    <input type="password" id="password" class="password" 
                                        disabled="disabled" setwatermark="enterPassword" 
                                        style="left: 150px" onkeypress = "KeypressEvent(event, OnIngestClick, '')"/>
                                </td>
                                <td rowspan="2" colspan="2" style="vertical-align:bottom;text-align:right;">
                                    <table border="0" cellpadding="0" cellspacing="0" id="IngestButton"                                        
                                        class="ingestButton">
                                        <tr>
                                            <td onclick="OnIngestClick()" class="buttonPadding buttonEnabled">
                                                <a class="buttonEnabledText" id="ingestTxt" href="#"></a>
                                            </td>
                                        </tr>
                                    </table>                                    
                                </td>                                
                            </tr>
                        </table>
                    </td>
                </tr>                    
                <tr>
                    <td class="borderLeftBottom" style="padding-left:40px;">
                        <span class="passwordLabel" id="passwordLabel"></span>
                    </td>
                </tr>                        
                <tr id="divNamedIngest" style="display:none;">
                    <td style="padding-top:3px;padding-bottom:3px;" class="borderLeftBottom">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td><input type="checkbox" id="chkNamedIngest"/></td>
                                <td><span id="lblNamedIngest" class="savePathInfoLabel" 
                                    style="width:100px;white-space:normal;"></span>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="2" style="padding-top:4px;padding-bottom:4px;" class="borderRightBottom">
                        <asp:TextBox runat="server" MaxLength="50" ID="txtNamedIngest" CssClass="txtNamedIngest" 
                            EnableViewState="false" onkeyup="OnKeyUp(this)" onkeypress="KeypressEvent(event, OnIngestClick, '')"/>
                        <ajaxToolkit:TextBoxWatermarkExtender runat="server" ID="waterNamedExtnd" BehaviorID="waterNamedExtnd" EnableViewState="false" 
                            TargetControlID="txtNamedIngest" WatermarkCssClass="watermarkNamedIngest" WatermarkText=""></ajaxToolkit:TextBoxWatermarkExtender>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    
    <asp:Panel ID="popup" runat="server" Style="display: none" onselectstart="return false;" 
        CssClass="confirmationWindow popup" EnableViewState="false">
        
        <div class="ingestableTitleFrame" id="newIngestTitle">
            <table cellpadding="0" cellspacing="1" border="0" style="width:598px;">
                <tr>
                    <td style="width:1px;padding-left:2px;" class="ingestableTitleBackgroundColor">
                        <input type="checkbox" id="chkIngestNew" onclick="CheckAll(this, 'CompositionsList')"/></td>
                    <td style="padding-left:3px;" class="ingestableTitleBackgroundColor">
                        <span id="spnIngestNew" class="IngestableTitleText"></span></td>
                </tr>
            </table>
        </div>
        <div class="ingestableItemBorderColor" style="padding:1px;" id="newIngestContent">            
            <div id="divNewIngest" class="ingestNew modalPopupBackgroundColor">
                <table id="CompositionsTable" cellpadding="0" cellspacing="0" class="popupTable">
                    <tbody id="CompositionsList">
                    </tbody>
                </table>
            </div>
        </div>
        
        <div style="padding:3px;"></div>
        
        <div id="re-ingestTitle" class="ingestableTitleFrame">
            <table cellpadding="0" cellspacing="1" border="0" style="width:598px;">
                <tr>
                    <td style="width:1px;padding-left:1px;" class="ingestableTitleBackgroundColor">
                        <input type="checkbox" id="chkReingest" onclick="CheckAll(this, 'reingestCompositionsList')"/></td>
                    <td style="padding-left:3px;" class="ingestableTitleBackgroundColor">
                        <span id="spnReingest" class="IngestableTitleText"></span></td>
                </tr>
            </table>
        </div>        
        <div class="ingestableItemBorderColor" style="padding:1px;" id="re-ingestContent">
            <div id="divReingest" class="re-ingest modalPopupBackgroundColor">
                <table id="reingestCompositionsTable" cellpadding="0" cellspacing="0" class="popupTable">
                    <tbody id="reingestCompositionsList">
                    </tbody>
                </table>
            </div>
        </div>
                    
        <div>            
            <div class="leaveContentAtSourceContainer">
                <table>
                    <tr>
                        <td><input type="checkbox" id="inplaceIngest" onclick="LeaveContentClick(this)"/></td>
                        <td><span id="spnLeavContentAtSource" style="white-space:normal;" class="leaveContentAtSource"></span></td>
                    </tr>
                </table>
            </div>                            
            
            <div class="okA popupIngestButton" id="set">
                <table border="0" cellpadding="0" cellspacing="0" class="buttonSize">
                    <tr>
                        <td class="buttonPadding buttonEnabled">
                            <a class="buttonEnabledText" id="ok_a" href="#"></a>
                        </td>
                    </tr>
                </table>
            </div>
            <div id="cncl" class="noA popupCancelButton">
                <table border="0" cellpadding="0" cellspacing="0" class="buttonSize">
                    <tr>
                        <td class="buttonPadding buttonEnabled">
                            <span class="buttonDisabledText" id="cncl_a"></span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </asp:Panel>    
    <ajaxToolkit:ModalPopupExtender ID="extender" runat="server" TargetControlID="dummy" BehaviorID="ingest_BID" EnableViewState="false"
        PopupControlID="popup" OkControlID="set" OnOkScript="IngestTitles()" OnCancelScript="CancelIngest()"
        BackgroundCssClass="modalPopupBackground" CancelControlID="cncl" />
        
    <div id="divProtectionWindow" style="display: none;position:absolute;z-index:100107"
        class="progressIndicator">         
    </div>
    
    <div style="display:none;text-align:left;z-index:100118;position:absolute;" 
        id="divLeaveContentAtSource" class="confirmationWindow">
        <table class="tblCW">
            <tr>
                <td class="modalPopupTitle">
                    <span style="white-space:normal;" id="leaveContentTitletxt"></span>
                </td>                    
            </tr>
            <tr>                    
                <td height="70px;" valign="top">
                    <table>
                        <tr>
                            <td valign="top"><img src="" id="leaveContentImgInfo" alt="" class="messageIcon" /></td>
                            <td><span id="spnLeaveContentBodyText" class="confirmationWindowContentText" style="white-space:normal;"></span></td>
                        </tr>
                    </table>                        
                </td>
            </tr>
            <tr>
                <td align="right" valign="bottom">
                    <table cellpadding="0" cellspacing="0" style="vertical-align:bottom;">
                        <tr>
                            <td valign="bottom" id="lcsYes">
                                <table border="0" cellpadding="0" cellspacing="0" id="imgyes"
                                    class="imgyes">
                                    <tr>
                                        <td onclick="HideLeaveContentAtSource()">
                                            <a class="buttonEnabledText" id="lcsTxtYes" href="#"></a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td valign="bottom" id="lcsNo" style="padding-left:3px;">
                                <table border="0" cellpadding="0" cellspacing="0" id="imgno"
                                    class="imgno">
                                    <tr>
                                        <td onclick="ResetLeaveContentAtSource()">
                                            <a class="buttonEnabledText" id="lcsTxtNo" href="#"></a>
                                        </td>
                                    </tr>
                                </table>                                    
                            </td>
                        </tr>
                    </table>
                </td>                    
            </tr>
        </table>
    </div>
    
    <asp:Panel ID="ingestInfo" Style="display: none;" runat="server" 
            CssClass="confirmationWindow" EnableViewState="false">
            <table class="tblCW">                
                <tr id="trSuccessTitle">
                    <td class="modalPopupTitle">
                        <span style="white-space:normal;" id="successfullyIngestTitleText"></span>
                    </td>                    
                </tr>
                <tr id="trSuccessMessage">
                    <td height="30px;" valign="top">
                        <table>
                            <tr>
                                <td valign="top"><img src="res/Skins/<%= Master.SkinName %>/Common/Information.gif" id="imgInformation" alt="" class="messageIcon" /></td>
                                <td style="width:280px;">                                    
                                    <span id="spnSuccessfullyIngestBodyText" class="confirmationWindowContentText" style="white-space:normal;"></span>
                                </td>
                            </tr>
                        </table>                        
                    </td>
                </tr>
                <tr>
                    <td class="modalPopupTitle">
                        <span style="white-space:normal;" id="failedIngestTitleText"></span>
                    </td>                    
                </tr>
                <tr>                    
                    <td height="70px;" valign="top">
                        <table>
                            <tr>
                                <td valign="top"><img src="res/Skins/<%= Master.SkinName %>/Common/Error.gif" id="imgError" alt="" class="messageIcon" /></td>
                                <td>                                    
                                    <div style="max-height:350px;width:280px;overflow:auto;overflow-x:hidden;">
                                        <span id="spnFailedIngestBodyText" class="confirmationWindowContentText" style="white-space:normal;"></span>
                                    </div>
                                </td>
                            </tr>
                        </table>                        
                    </td>
                </tr>
                <tr>
                    <td align="right" valign="bottom">
                        <table cellpadding="0" cellspacing="0" style="vertical-align:bottom;">
                            <tr>
                                <td valign="bottom" id="ingestInfoPopupOk">
                                    <table border="0" cellpadding="0" cellspacing="0" id="Table1"
                                        class="imgyes">
                                        <tr>
                                            <td>
                                                <a class="buttonEnabledText" id="ingestInfoPopupOkText" href="#"></a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>                    
                </tr>
            </table>
        </asp:Panel>
                
        <ajaxToolkit:ModalPopupExtender ID="ingestInfoPopup" runat="server" BehaviorID="ingestInfo_BID"
                    TargetControlID="dummy" PopupControlID="ingestInfo" 
                    DropShadow="True" BackgroundCssClass="modalPopupBackground"
                    OkControlID="ingestInfoPopupOk" 
                    DynamicServicePath="" Enabled="True" EnableViewState="false"/>
</asp:Content>
