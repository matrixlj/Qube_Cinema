<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Keys" UICulture="auto" 
    CodeBehind="Keys.aspx.cs" Inherits="Keys" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="ContentKeys" ContentPlaceHolderID="ContentPlaceHolder" runat="Server" EnableViewState="false">            
    <div id="keysBg">
        <span class="keysLabel" id ="keys"></span>
        <span class="keyStatusLabel" id ="status"></span>
        <input type="checkbox" id="chkSelectAll" onclick="SelectAll(this)" class="keysSelectAll"/>
        <span class="keyCompositionLabel" id ="composition"></span>
        <span class="keyStartDateLabel" id ="startdate"></span>
        <span class="keyEndDateLabel" id ="enddate"></span>
        
        <div id="addedKeysDiv" onselectstart='return false;'>
			<table id="addedKeysTable" cellspacing="0" cellpadding="10">
				<tbody id="addedKeysTableBody" />
			</table>
		</div>
		
		<table class="statusImgs" border="0" cellpadding="0" cellspacing="0">
		    <tr>
		        <td align="right">
		            <table border="0">
                        <tr>
                            <td style="width:20px;vertical-align:top;">                                
                                <img alt="" id="validImg" src="res/Skins/<%= Master.SkinName %>/keys/Valid.gif"/>
                            </td>
                            <td style="padding-right:3px;vertical-align:top;">
                                <label class="keyValidLabel" id ="valid"></label>
                            </td>
                            <td style="width:20px;vertical-align:top;">
                                <img alt="" id ="validFutureImg" src="res/Skins/<%= Master.SkinName %>/keys/Valid In Future.gif"/>
                            </td>
                            <td style="padding-right:3px;vertical-align:top;">
                                <label class="keyValidInFutureLabel" id ="validInFuture"></label>
                            </td>
                            <td style="width:12px;vertical-align:top;">
                                <img alt="" id ="expiredImg" src="res/Skins/<%= Master.SkinName %>/keys/Expired.gif"/>
                            </td>
                            <td style="padding-right:3px;vertical-align:top;">
                                <label class="keyExpiredLabel" id ="expired"></label>
                            </td>
                            <td style="width:17px;vertical-align:top;">
                                <img alt="" id ="noKeyImg" src="res/Skins/<%= Master.SkinName %>/keys/Nokey.gif"/>
                            </td>
                            <td style="padding-right:3px;vertical-align:top;" class="h2">
                                <label class="noKeyLabel" id ="noKey"></label>
                            </td>
                        </tr>
                    </table>
		        </td>
		    </tr>
		</table>
		
		<table border="0" cellpadding="0" cellspacing="0" id="addKey" class="divaddkey">
            <tr>
                <td onclick="OnAddKeyClicked()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" style="white-space:nowrap;" id="keyaddTxt" href="#"></a>
                </td>
            </tr>
        </table>
		
		<div id="deleteKey" class="divkeydelete"  style="display:none;">
            <table border="0" cellpadding="0" cellspacing="0"            
                class="divkeydeleteEnabled buttonSize">
                <tr>
                    <td onclick="ConfirmDeleteKDM()" class="buttonPadding buttonEnabled">
                        <a class="buttonEnabledText" id="keydeleteTxt" href="#"></a>
                    </td>
                </tr>
            </table>
        </div>    
        <div id="deleteKeyDisabled" class="divkeydelete">
            <table border="0" cellpadding="0" cellspacing="0"
                class="deleteKeyDisabled buttonSize">
                <tr>
                    <td class="buttonPadding buttonDisabled">
                        <span class="buttonDisabledText" id="spnDeleteKeyDisabled"></span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div id="addKeyDiv">
            <table cellpadding="0" cellspacing="0" class="tblAddIngest">
                <tr>
                    <td style="padding-left:25px;" class="borderLeftTopBottom">
                        <span id="spnNamedSpace" class="namedSpaceLabel"></span>
                    </td>
                    <td style="white-space:nowrap;" class="borderBottomTop">
                        <div id="cboNamedIngest">
                            <asp:Label ID="lblHeading" runat="server" Text="" CssClass="namedLabel AjaxDropDown" 
                                EnableViewState="false"/>
                            <asp:Panel ID="namedList" runat="server" CssClass="ContextMenuPanel" Width="275" 
                                Style="display :none; visibility: hidden;" EnableViewState="false">
                            </asp:Panel>
                            <ajaxToolkit:DropDownExtender BehaviorID="namedextnd" ID="namedextnd" 
                                runat="server" TargetControlID="lblHeading" EnableViewState="false"
                                DropDownControlID="namedList"></ajaxToolkit:DropDownExtender>                            
                        </div>                         
                    </td>
                    <td class="borderRightTopBottom" style="text-align:right;padding-top:5px;">
                        <input type="image" id="shortnamedelete" style="display:none;" 
                            class="shortnamedelete" src="res/Skins/<%= Master.SkinName %>/Common/imgDelete.gif"
                            title="delete" onclick="return DeleteShortName()" />
                    </td>
                </tr>
                <tr>
                    <td class="borderLeft" style="white-space:nowrap;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td>
                                    <input id="uploadKey" name="keyType" type="radio" 
                                        onclick="OnUploadClick('<%= username.ClientID %>', 'password', 'keyupload');"/>
                                    <span class="keyUploadLabel" id="uploadSpan"></span>
                                </td>
                                <td rowspan="3"><img id="keysArrow" src="res/Skins/<%= Master.SkinName %>/Keys/Arrow.gif" /></td>                                
                            </tr>
                            <tr>
                                <td>
                                    <input id="localKey" name="keyType" checked="checked" type="radio" 
                                        onclick ="OnLocalClicked('<%= username.ClientID %>', 'password', 'keyupload')" />
                                    <span class="localLabel" id="keysLocal"></span>
                                </td>                                
                            </tr>
                            <tr>
                                <td>
                                    <input id="webKey" name="keyType" type="radio" 
                                        onclick="OnWebClicked('<%= username.ClientID %>', 'password', 'keyupload')" />
                                    <span class="networkLabel" id="keysWeb"></span>
                                </td>                                                                
                            </tr>                            
                        </table>
                    </td>                    
                    <td colspan="2" class="borderRight">                        
                        <asp:TextBox ID="keyPath" Runat="server" CssClass="keyPath" 
                            onkeypress = "KeypressEvent(event, GetKeys, '')" EnableViewState="false"/>
                        <ajaxToolkit:TextBoxWatermarkExtender ID="keyPathTBWE" runat="server" 
                            TargetControlID="keyPath" WatermarkText=" " WatermarkCssClass="watermarkKeyPath" 
                            BehaviorID="keyPath_bID" EnableViewState="false"/>
                        <iframe id="keyupload" src="uploadkey.aspx" frameborder="0"
                            scrolling="no" style="display:none;"
                            height="22px;" width="320px;" marginheight="0" marginwidth="0"></iframe>
                    </td>
                </tr>
                <tr>
                    <td class="borderLeft" style="padding-left:40px;">
                        <span class="userNameLabel" id="keyUserNameLabel"></span>
                    </td>
                    <td colspan="2" rowspan="2" class="borderRightBottom">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>                                
                                <td style="text-align:left;">
                                    <asp:TextBox  ID="username" runat="server" CssClass="keysUserName" 
                                        Enabled="false" EnableViewState="false"  onkeypress = "KeypressEvent(event, GetKeys, '')"/>
                                    <ajaxToolkit:TextBoxWatermarkExtender ID="userNameTBWE" runat="server"  
                                        TargetControlID="username" WatermarkText="enter username" EnableViewState="false" 
                                        WatermarkCssClass="keysWatermarkUserName" BehaviorID="username_bID" />
                                </td>                                
                            </tr>
                            <tr>
                                <td>
                                    <input type="password" id="password" setwatermark="enterPassword"
                                        onkeypress = "KeypressEvent(event, GetKeys, '')" 
                                        class="keysPassword" disabled="disabled" />
                                </td>
                                <td rowspan="2" colspan="2" style="vertical-align:bottom;text-align:right;">
                                    <table border="0" cellpadding="0" cellspacing="0" id="GetKey"
                                        class="divkeyget getKeyButtonSize">
                                        <tr>
                                            <td onclick="GetKeys()" class="buttonPadding buttonEnabled">
                                                <a class="buttonEnabledText" style="white-space:nowrap;" id="getKeyTxt" href="#"></a>
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
                        <span class="passwordLabel" id="keyPasswordLabel"></span>
                    </td>
                </tr>
                <tr id="divNamedSpaceKey" style="display:none;">
                    <td style="padding-top:3px;padding-bottom:3px;" class="borderLeftBottom">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td><input type="checkbox" id="chkNamedIngest" /></td>
                                <td><span id="lblNamedIngest" class="savePathInfoLabel" 
                                    style="width:100px; white-space:normal;"></span></td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="2" style="padding-top:4px;padding-bottom:4px;" class="borderRightBottom">
                        <asp:TextBox MaxLength="50" runat="server" ID="txtNamedIngest" onkeyup="OnKeyUp(this)" 
                            CssClass="txtNamedIngest" EnableViewState="false" onkeypress = "KeypressEvent(event, GetKeys, '')"/>
                        <ajaxToolkit:TextBoxWatermarkExtender runat="server" ID="waterNamedExtnd" BehaviorID="waterNamedExtnd" 
                            TargetControlID="txtNamedIngest" WatermarkCssClass="watermarkNamedIngest" EnableViewState="false" 
                            WatermarkText=" "></ajaxToolkit:TextBoxWatermarkExtender>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="download" id="certDownloads" />        
    </div>
    
    <asp:Panel ID="popup" runat="server" Style="display: none" onselectstart="return false;" 
        CssClass="confirmationWindow popup" EnableViewState="false">
        
        <div class="ingestableTitleFrame">
            <table cellpadding="0" cellspacing="1" border="0" style="width:598px;">
                <tr>
                    <td style="width:1px;padding-left:0px;" class="ingestableTitleBackgroundColor">
                        <input type="checkbox" id="chkIngestNew" onclick="CheckAll(this, 'keysList')"/></td>
                    <td style="padding-left:3px;" class="ingestableTitleBackgroundColor">
                        <span id="spnIngestNew" class="IngestableTitleText"></span></td>
                </tr>
            </table>
        </div>
        <div class="ingestableItemBorderColor" style="padding:1px;">            
            <div id="divNewIngest" class="ingestNew modalPopupBackgroundColor">
                <table id="keysTable" cellpadding="0" cellspacing="0" class="popupTable">
                    <tbody id="keysList">
                    </tbody>
                </table>
            </div>
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
        
    </asp:Panel>
        
    <ajaxToolkit:ModalPopupExtender ID="extender" runat="server" BehaviorID="key_extender"
            TargetControlID = "dummy"
            PopupControlID = "popup"
            OkControlID = "set"
            OnOkScript = "IngestKeys()"
            OnCancelScript = "CancelIngest()"
            BackgroundCssClass="modalPopupBackground"
            CancelControlID="cncl" 
            EnableViewState="false"
         />
         
    <script type="text/javascript" language="javascript" src="Scripts/Keys.js"></script>
</asp:Content>
