<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Media" UICulture="auto"
    CodeBehind="Media.aspx.cs" Inherits="Media" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="Media" ContentPlaceHolderID="ContentPlaceHolder" Runat="Server" EnableViewState="false">    
    <script type="text/javascript" src="Scripts/Media.js"></script>
    <div id="divSearch" class="searchBox">
        <table cellpadding="0" cellspacing="0">
            <tr>
                <td><span id="spnSearch" class="searchLabel"></span></td>
                <td style="padding-left:5px;">
                    <input type="text" id="txtSearch" onkeyup="SearchTitles(this);"/>
                </td>
            </tr>
        </table>
    </div>    
    <div id="divmedia" class="divmedia">                
        <div id="emptyScreen" class="emptyScreen"></div>
        <div id="headerRow" class="divmediaInfoHeader">            
            <table id="tblHeaderRow" cellpadding="0" cellspacing="0" border="0">
                <thead>
                    <tr>
                        <th class="mediainfoHeader h1" id="headerSelectTitle">                            
                                <input type="checkbox" onclick="SelectAll(this)" id="chkSelectAll" /></th>
                        <th class="mediainfoHeader h1" style="width:21px;" id="headerEncrypt">&nbsp;&nbsp;</th>
                        <th class="mediainfoHeader h1" id="headerTitle" style="cursor:pointer;" 
                            onclick="HeaderClick('Name', 'string', this)">
                        </th>
                        <th class="mediainfoHeader h1" id="headerType" style="cursor:pointer;width:55px;" 
                            onclick="HeaderClick('ContentType', 'string', this)"></th>
                        <th class="mediainfoHeader h1" id="headerPicture" style="width:70px;"></th>                        
                        <th class="mediainfoHeader h1" id="headerAudio" style="width:85px;"></th>
                        <th class="mediainfoHeader h1" id="headerRating" style="white-space:normal; width:44px;"></th>
                        <th class="mediainfoHeader h1" id="headerAspect" style="cursor:pointer;width:49px;" 
                            onclick="HeaderClick('Aspect', 'number', this)"></th>
                        <th class="mediainfoHeader h1" id="headerDuration" style="cursor:pointer;width:60px;" 
                            onclick="HeaderClick('Duration', 'number', this)"></th>
                        <th class="mediainfoHeader h1" id="headerSize" style="cursor:pointer;width:61px;" 
                            onclick="HeaderClick('Size', 'number', this)"></th>
                        <th class="mediainfoHeader h1" id="headerSpace" style="white-space:normal;width:38px;"></th>
                        <th class="mediainfoHeader h1" id="headerLastPlay" style="white-space:normal;cursor:pointer;width:74px;" 
                            onclick="HeaderClick('LastAccessed', 'datetime', this)"></th>
                        <th class="mediainfoHeader h1" id="headerAutoDelete" style="white-space:normal;width:81px;"></th>
                        <th class="mediainfoHeader h1" id="thHeaderVerify" style="border-right:solid 1px white;width:60px;">
                            <span id="headerVerify" style="white-space:nowrap;width:200px;"></span>
                        </th>
                    </tr>
                </thead>
            </table>
        </div>        
        <div class="divmediaInfo" id="divmediaInfo">
            <table id="tblmedia" class="tblmediaInfo" cellpadding="0" cellspacing="0">                        
                <thead>
                    <tr>
                        <th class="mediainfoHeader" id="Th1" style="width:21px"></th>
                        <th class="mediainfoHeader h1" style="width:21px;" id="Th2">&nbsp;&nbsp;</th>
                        <th class="mediainfoHeader h1" id="headerTitle1" style="cursor:pointer;" ></th>
                        <th class="mediainfoHeader h1" id="headerType1" style="cursor:pointer;width:55px;" ></th>
                        <th class="mediainfoHeader h1" id="headerPicture1" style="width:70px;"></th>                        
                        <th class="mediainfoHeader h1" id="headerAudio1" style="width:85px;"></th>
                        <th class="mediainfoHeader h1" id="headerRating1" style="white-space:normal; width:44px;"></th>
                        <th class="mediainfoHeader h1" id="headerAspect1" style="cursor:pointer;width:49px;" ></th>
                        <th class="mediainfoHeader h1" id="headerDuration1" style="cursor:pointer;width:60px;" ></th>
                        <th class="mediainfoHeader h1" id="headerSize1" style="cursor:pointer;width:61px;" ></th>
                        <th class="mediainfoHeader h1" id="headerSpace1" style="white-space:normal;width:38px;"></th>
                        <th class="mediainfoHeader h1" id="headerLastPlay1" style="white-space:normal;cursor:pointer;width:74px;" ></th>
                        <th class="mediainfoHeader h1" id="headerAutoDelete1" style="white-space:normal;width:81px;"></th>
                        <th class="mediainfoHeader h1" id="thHeaderVerify1" 
                            style="border-right:solid 1px white;width:87px;">
                            <span id="headerVerify1" style="white-space:nowrap;width:200px;"></span>
                        </th>
                    </tr>
                </thead>
                <tbody id="tbmediainfo"></tbody>
            </table>
        </div>
    </div>
    
    <div class="divmediastorage">
        <table cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <span class="mediaStorageLabel" id="lblstorage"></span>
                </td>
                <td  valign="bottom">
                    <span class="mediaStorageLeftPercentage" id="mediaStorageLeftPercentage"></span>
                </td>
                <td rowspan="2" valign="bottom" style="width:350px;">
                    <div class="divprogressbar">
                        <img id="mediaAvailableStorageBar" class="mediaAvailableStorageBar" src="res/Skins/<%= Master.SkinName %>/Common/Progressbar Large.jpg" style="height:37px;" alt="" />
                    </div>                    
                </td>                
            </tr>
            <tr>
                <td colspan="2" align="right"><span class="mediaUsedSpace" id="mediaUsedSpace"></span></td>
            </tr>
        </table>
    </div>
    
    <div class="divmediaControls">
        <table border="0" class="tblmediaControls" cellpadding="0" cellspacing="0" style="vertical-align:bottom;">
            <tr>
                <td align="right">
                    <table border="0" cellpadding="0" cellspacing="0" style="vertical-align:bottom;">
                        <tr>
                            <td id="tdDelete" style="display:none;" align="left" valign="middle">
                                <table border="0" cellpadding="0" cellspacing="0" class="mediaDelete buttonSize">
                                    <tr>
                                        <td onclick="DeleteSelectedTitles()" class="buttonEnabled buttonPadding">
                                            <a class="buttonEnabledText" style="font-size:13px;"  id="spnDelete" href="#"></a>
                                        </td>
                                    </tr>
                                </table>                                
                            </td>
                            <td id="tdAutoDelete" style="display:none;" align="left">
                                <table border="0" cellpadding="0" cellspacing="0" class="mediaAutoDelete buttonSize">
                                    <tr>
                                        <td onclick="AutoDeleteSetup()" class="buttonEnabled">
                                            <a class="buttonEnabledText" style="font-size:13px;"  id="btnAutoDelete" href="#"></a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td id="tdIntegrityVerifiy" align="left">
                                <table id="IVEnabled" border="0" cellpadding="0" cellspacing="0" class="mediaVerify buttonSize">
                                    <tr>
                                        <td onclick="VerifyClicked()" class="buttonEnabled buttonPadding">
                                            <a class="buttonEnabledText" style="font-size:13px;" id="spnVerify" href="#"></a>
                                        </td>
                                    </tr>
                                </table>
                                <table id="IVDisabled" border="0" cellpadding="0" cellspacing="0" 
                                    class="mediaVerifyDisabled buttonSize" style="display:none;">
                                    <tr>
                                        <td class="buttonEnabled buttonPadding" style="cursor:default;">
                                            <span class="buttonEnabledText" style="font-size:13px;" id="spnVerifyDisabled"/>
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
       
    <div>
        <ajaxToolkit:ModalPopupExtender ID="ModalPopupExtender1" runat="server" BehaviorID="mpextnd"
                    TargetControlID="dummy" PopupControlID="aspPanel" EnableViewState="false" 
                    DropShadow="true" BackgroundCssClass="modalPopupBackground" 
                    OkControlID="divyes1" OnOkScript="SetTitleProtect()" CancelControlID="divno1"/>
            
        <asp:Panel ID="aspPanel" Style="display: none;" runat="server" CssClass="confirmationWindow" 
            Width="320px" EnableViewState="false">
            <table class="tblCW">
                <tr>
                    <td class="modalPopupTitle">
                        <span id="autoDeleteTitle"></span>
                    </td>                    
                </tr>
                <tr>                    
                    <td valign="top"> 
                        <table>
                            <tr>
                                <td style="padding-top:10px;"><span id="spnAutoDelete" class="autoDeleteTypeLabel"></span></td>
                                <td style="padding-top:10px;"><div>
                                        <asp:Label ID="lblHeading" runat="server" Text="" value="0" displayText="" 
                                            Width="225" CssClass="scheduleShowLabel AjaxDropDown" TabIndex="1"
                                            EnableViewState="false"/>
                                        <asp:Panel ID="autoDeleteList" runat="server" CssClass="ContextMenuPanel" Width="225"
                                            Style="display :none; visibility: hidden;" EnableViewState="false">
                                            <a href="#" id="Never" value="0" displayText="" class="ContextMenuItem"></a>
                                            <a href="#" id="Allow" value="1" displayText="" class="ContextMenuItem"></a>
                                            <a href="#" id="AfterDate" value="2" displayText="" class="ContextMenuItem"></a>
                                        </asp:Panel>
                                        <ajaxToolkit:DropDownExtender BehaviorID="autoDeleteExtnd" ID="autoDeleteExtnd" runat="server" 
                                            TargetControlID="lblHeading" DropDownControlID="autoDeleteList" EnableViewState="false"></ajaxToolkit:DropDownExtender>            
                                    </div>
                                </td>
                            </tr>
                            <tr id="trDate" style="visibility:hidden;">
                                <td style="padding-top:10px;"><label id="selectDateLbl" class="mediaDateLabel" ></label></td>
                                <td style="padding-top:10px;">
                                    <asp:TextBox ID="startDate" onchange="OnClientTextChange(this)" 
                                        onblur="OnClientTextChange(this)" CssClass="startDate" runat="server" MaxLength="10" EnableViewState="false" 
                                        TabIndex="1"></asp:TextBox>
                                    <ajaxToolkit:CalendarExtender BehaviorID="startDate_BID" ID="startDateCalendar" runat="server" EnableViewState="false"  
                                        TargetControlID="startDate"/>
                                    <ajaxToolkit:TextBoxWatermarkExtender ID="startDateWaterBehavior" runat="server" BehaviorID="startDateWaterBehavior" 
                                        TargetControlID="startDate" EnableViewState="false"
	                                    WatermarkText="mm/dd/yyyy" WatermarkCssClass="watermark startDate"></ajaxToolkit:TextBoxWatermarkExtender>
	                                <ajaxToolkit:MaskedEditExtender runat="server" ID="maskDate" TargetControlID="startDate" BehaviorID="maskDateBehavior" MaskType="Date" 
	                                    Mask="99/99/9999" UserDateFormat="MonthDayYear" EnableViewState="false"></ajaxToolkit:MaskedEditExtender>
                                </td>
                            </tr>                            
                        </table>                        
                    </td>
                </tr>
                <tr>
                    <td align="right" valign="bottom">
                        <table cellpadding="0" cellspacing="0" style="vertical-align:bottom;">
                            <tr>
                                <td>
                                    <table border="0" cellpadding="0" cellspacing="0" id="divyes1"
                                        class="buttonSize okA">
                                        <tr>
                                            <td class="buttonPadding buttonEnabled">
                                                <a class="buttonEnabledText" id="txtyes1" href="#"></a>
                                            </td>
                                        </tr>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" id="divyesDisable"                                        
                                        class="buttonSize okADisabled">
                                        <tr>
                                            <td class="buttonPadding buttonEnabled">
                                                <span class="buttonDisabledText" id="txtyesDisable"></span>
                                            </td>
                                        </tr>
                                    </table>                                    
                                </td>
                                <td valign="bottom">
                                    <table border="0" cellpadding="0" cellspacing="0" id="divno1"
                                        style="height:40px;"
                                        class="buttonSize noA">
                                        <tr>
                                            <td class="buttonPadding buttonEnabled">
                                                <a class="buttonEnabledText" id="txtno1" href="#"></a>
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
    </div>  
</asp:Content>