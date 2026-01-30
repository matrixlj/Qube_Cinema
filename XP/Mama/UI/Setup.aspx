<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Setup" UICulture="auto"
    CodeBehind="Setup.aspx.cs" Inherits="Setup" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType VirtualPath="Mama.master" %>
<asp:Content ID="Setup" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">

    <script type="text/javascript">
        var ecinemaprojectortab = '<%= ecinemaprojectortab.ClientID %>';
        var dcinemaprojectortab = '<%= dcinemaprojectortab.ClientID %>';
        var projectorsCtrlID = '<%= projector.ClientID %>';
        var setupMenuTab = '<%= setupMenuTabs.ClientID %>';                
    </script>

    <script type="text/javascript" language="javascript" src="Scripts/Setup.js"></script>

    <span class="setupLabel" id="SetupLabel"></span>
    <div id="restrictedCharToolTip" class="tooltip" style="display: none; position: absolute;">
    </div>
    <ajaxToolkit:TabContainer ID="setupMenuTabs" runat="server" Style="left: 29px; top: 125px;
        position: absolute;" OnClientActiveTabChanged="MenuActiveTabChanged" EnableViewState="false">
        <ajaxToolkit:TabPanel ID="setupGeneralTab" runat="server" HeaderText="" EnableViewState="false">
            <ContentTemplate>
                <div id="generalTabContent" class="TabContentCSS">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <span class="serialNumberLabel" id="serialLabel"></span>
                            </td>
                            <td>
                                <span id="serial" class="serialNumberInfo" runat="server"></span>
                                <asp:Panel ID="hoverMenu" runat="server" CssClass="hoverMenu" EnableViewState="false">
                                    <div>
                                        <label class="hoverMenuText" id="lblCopy" onclick="Copy();" style="padding-left: 5px;">
                                        </label>
                                    </div>
                                </asp:Panel>
                                <ajaxToolkit:HoverMenuExtender ID="hmSerialExtender" runat="server" BehaviorID="hmSerialExtender"
                                    TargetControlID="serial" PopupControlID="hoverMenu" OffsetX="0" OffsetY="0" PopupPosition="Right"
                                    PopDelay="25" EnableViewState="false" />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span class="timeZoneLabel" id="timeZoneLbl"></span>
                            </td>
                            <td>
                                <div>
                                    <asp:Label Width="400" ID="lbltimezone" runat="server" Text="" CssClass="setupTimeZoneLabel AjaxDropDown"
                                        EnableViewState="false" />
                                    <asp:Panel ID="setupTimeZone" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                        visibility: hidden;" EnableViewState="false" Width="400">
                                    </asp:Panel>
                                    <ajaxToolkit:DropDownExtender BehaviorID="zoneextnd" ID="zoneextnd" runat="server"
                                        TargetControlID="lbltimezone" DropDownControlID="setupTimeZone" EnableViewState="false">
                                    </ajaxToolkit:DropDownExtender>
                                    <a id="zonesave" href="javascript:SaveTimeZone();" class="zonesave"></a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span class="bufferSizeLabel" id="spnBufferSize"></span>
                            </td>
                            <td>
                                <asp:TextBox ID="txtBufferSize" MaxLength="3" Height="17px" runat="server" EnableViewState="false" />
                                <ajaxToolkit:NumericUpDownExtender ID="NumericUpDownExtender1" runat="server" BehaviorID="bufferSize_BID"
                                    TargetControlID="txtBufferSize" Width="40" Minimum="0" Maximum="255" EnableViewState="false">
                                </ajaxToolkit:NumericUpDownExtender>
                                <ajaxToolkit:FilteredTextBoxExtender ID="bufferfilter" FilterType="Numbers" runat="server"
                                    TargetControlID="txtBufferSize" EnableViewState="false">
                                </ajaxToolkit:FilteredTextBoxExtender>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span class="theaterCodeLabel" id="spnTheaterCode"></span>
                            </td>
                            <td>
                                <asp:TextBox runat="server" ID="txtTheaterCode" MaxLength="254" EnableViewState="false" />
                                <ajaxToolkit:FilteredTextBoxExtender ID="FilteredTextBoxExtender2" FilterType="Custom, Numbers, UppercaseLetters, LowercaseLetters"
                                    ValidChars="',-,_,#,$,@,!,(,), " runat="server" BehaviorID="theaterCode_BID"
                                    TargetControlID="txtTheaterCode" EnableViewState="false">
                                </ajaxToolkit:FilteredTextBoxExtender>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span class="screenCodeLabel" id="spnScreenCode"></span>
                            </td>
                            <td>
                                <asp:TextBox runat="server" ID="txtScreenCode" MaxLength="254" EnableViewState="false" />
                                <ajaxToolkit:FilteredTextBoxExtender ID="FilteredTextBoxExtender3" FilterType="Custom, Numbers, UppercaseLetters, LowercaseLetters"
                                    ValidChars="',-,_,#,$,@,!,(,), " runat="server" BehaviorID="screenCode_BID" TargetControlID="txtScreenCode"
                                    EnableViewState="false">
                                </ajaxToolkit:FilteredTextBoxExtender>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <div id="divGeneralSave">
                                    <table onclick="SaveGeneralInfo()" class="okA buttonSize ZeroTopPadding" border="0"
                                        cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td class="buttonEnabled buttonPadding">
                                                <a class="buttonEnabledText" id="generalSaveEnabledText" href="#"></a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <table id="divGeneralSaveDisabled" border="0" cellpadding="0" style="display: none;"
                                    cellspacing="0" class="okADisabled buttonSize ZeroTopPadding">
                                    <tr>
                                        <td class="buttonDisabled buttonPadding">
                                            <span class="buttonDisabledText" id="generalSaveDisabledText"></span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            </ContentTemplate>
        </ajaxToolkit:TabPanel>
        <ajaxToolkit:TabPanel ID="setupProjectorTab" runat="server" EnableViewState="false"
            HeaderText="">
            <ContentTemplate>
                <div id="projectorTabContent" class="TabContentCSS">
                    <div class="SetupRightSidePanel">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <asp:TextBox ID="pingIP" MaxLength="255" runat="server" onkeyup="EnableSave(this.value, 'pingipimg', true)"
                                        onkeypress="KeypressEvent(event,Ping,'');"></asp:TextBox>
                                    <ajaxToolkit:FilteredTextBoxExtender ID="filterPingIP" TargetControlID="pingIP" BehaviorID="filterPingIP"
                                        FilterMode="InvalidChars" FilterType="Custom" InvalidChars="~!@#$%^&*()=+[]{}|\;:\,<>/?_'"
                                        runat="server" EnableViewState="false">
                                    </ajaxToolkit:FilteredTextBoxExtender>
                                </td>
                                <td>
                                    <div id="pingipimg" style="display: none;">
                                        <table onclick="Ping(event)" class="PingEnabled buttonSize ZeroTopPadding">
                                            <tr>
                                                <td class="buttonEnabled buttonPadding">
                                                    <a class="buttonEnabledText" href="#" id="spnPingEnabled"></a>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <table id="pingipimgDisabled" border="0" cellpadding="0" cellspacing="0" class="PingDisabled buttonSize ZeroTopPadding">
                                        <tr>
                                            <td class="buttonDisabled buttonPadding">
                                                <span class="buttonDisabledText" id="spnPingDisabled"></span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr id="trThreeDMode" style="display: none;">
                                <td>
                                    <span class="threeDModeLabel" id="threeDModelbl" style="display: none;"></span>
                                </td>
                                <td style="padding-left: 3px;">
                                    <span class="threeDModeInfo" id="threeDMode" style="display: none;"></span>
                                </td>
                            </tr>
                            <tr id="trConfigFile" style="display: none;">
                                <td style="padding-top: 5px;">
                                    <span class="configFileLabel" id="configFilelbl" style="display: none;"></span>
                                </td>
                                <td style="padding-top: 5px; padding-left: 3px;">
                                    <span class="configFileInfo" id="configFile" style="display: none;"></span>
                                </td>
                            </tr>
                            <tr id="trSubtitling">
                                <td colspan="2">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <span id="spnSubtitlingLabel" class="subtitlingLabel"></span>
                                            </td>
                                            <td style="display: none;">
                                                <input type="checkbox" id="chkInternalSubtitle" onclick="Subtitle_OnClick(this)" />
                                            </td>
                                            <td style="display: none;">
                                                <span id="spnInternalSubtitle" class="subtitleLabel"></span>
                                            </td>
                                            <td>
                                                <input type="checkbox" id="chkProjectorSubtitle" onclick="Subtitle_OnClick(this)" />
                                            </td>
                                            <td>
                                                <span id="spnProjectorSubtitle" class="subtitleLabel"></span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="SetupLeftSidePanel">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                                <td colspan="2">
                                    <table cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td>
                                                <span class="projectorsLabel" id="spnprojectors"></span>
                                            </td>
                                            <td>
                                                <asp:DropDownList ID="projector" runat="server" onchange="EnableTabs(this)" Style="width: 250px;"
                                                    EnableViewState="false">
                                                    <asp:ListItem Text="" Value="1" Selected="true"></asp:ListItem>
                                                    <asp:ListItem Text="" Value="2"></asp:ListItem>
                                                </asp:DropDownList>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr id="EBoxSettings" style="display: none;">
                                <td>
                                    <table cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td colspan="2" style="padding-top: 5px; padding-bottom: 5px;">
                                                <ajaxToolkit:TabContainer ID="ecinemaprojectortab" runat="server" OnClientActiveTabChanged="ECinemaProjectorActiveTabChanged"
                                                    EnableViewState="false">
                                                    <ajaxToolkit:TabPanel ID="ecinemaprojector1" runat="server" HeaderText="" Enabled="false"
                                                        EnableViewState="false">
                                                        <ContentTemplate>
                                                            <div class="projectorcontent">
                                                                <table border="0">
                                                                    <tr>
                                                                        <td>
                                                                            <span class="resolutionLabel" id="resolutionLbl1"></span>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="lblresolution1" runat="server" CssClass="setupresolutionLabel AjaxDropDown"
                                                                                EnableViewState="false" Width="155" />
                                                                            <asp:Panel ID="setupResolution1" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                                visibility: hidden;" EnableViewState="false" Width="155">
                                                                            </asp:Panel>
                                                                            <ajaxToolkit:DropDownExtender BehaviorID="resolutionextnd1" ID="resolutionextnd1"
                                                                                runat="server" TargetControlID="lblresolution1" DropDownControlID="setupResolution1"
                                                                                EnableViewState="false">
                                                                            </ajaxToolkit:DropDownExtender>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="lensLabel" id="lensLbl1"></span>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="lbllens1" runat="server" CssClass="setupLensLabel AjaxDropDown" EnableViewState="false"
                                                                                Width="155" />
                                                                            <asp:Panel ID="setupLens1" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                                visibility: hidden;" EnableViewState="false" Width="155">
                                                                            </asp:Panel>
                                                                            <ajaxToolkit:DropDownExtender BehaviorID="lensextnd1" ID="lensextnd1" runat="server"
                                                                                TargetControlID="lbllens1" DropDownControlID="setupLens1" EnableViewState="false">
                                                                            </ajaxToolkit:DropDownExtender>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="screenAspectRatioLabel" id="activeAspectLbl1"></span>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="lblaspect1" runat="server" CssClass="setupAspectLabel AjaxDropDown"
                                                                                EnableViewState="false" Width="155" />
                                                                            <asp:Panel ID="setupAspect1" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                                visibility: hidden;" EnableViewState="false" Width="155">
                                                                            </asp:Panel>
                                                                            <ajaxToolkit:DropDownExtender BehaviorID="aspectextnd1" ID="aspectextnd1" runat="server"
                                                                                TargetControlID="lblaspect1" DropDownControlID="setupAspect1" EnableViewState="false">
                                                                            </ajaxToolkit:DropDownExtender>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </ContentTemplate>
                                                    </ajaxToolkit:TabPanel>
                                                    <ajaxToolkit:TabPanel ID="ecinemaprojector2" runat="server" HeaderText="" Enabled="false"
                                                        EnableViewState="false">
                                                        <ContentTemplate>
                                                            <div class="projectorcontent">
                                                                <table border="0">
                                                                    <tr>
                                                                        <td>
                                                                            <span class="resolutionLabel" id="resolutionLbl2"></span>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="lblresolution2" runat="server" CssClass="setupresolutionLabel AjaxDropDown"
                                                                                EnableViewState="false" Width="155" />
                                                                            <asp:Panel ID="setupResolution2" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                                visibility: hidden;" EnableViewState="false" Width="155">
                                                                            </asp:Panel>
                                                                            <ajaxToolkit:DropDownExtender BehaviorID="resolutionextnd2" ID="resolutionextnd2"
                                                                                runat="server" TargetControlID="lblresolution2" DropDownControlID="setupResolution2"
                                                                                EnableViewState="false">
                                                                            </ajaxToolkit:DropDownExtender>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="lensLabel" id="lensLbl2"></span>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="lbllens2" runat="server" CssClass="setupLensLabel AjaxDropDown" EnableViewState="false"
                                                                                Width="155" />
                                                                            <asp:Panel ID="setupLens2" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                                visibility: hidden;" EnableViewState="false" Width="155">
                                                                            </asp:Panel>
                                                                            <ajaxToolkit:DropDownExtender BehaviorID="lensextnd2" ID="lensextnd2" runat="server"
                                                                                TargetControlID="lbllens2" DropDownControlID="setupLens2" EnableViewState="false">
                                                                            </ajaxToolkit:DropDownExtender>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="screenAspectRatioLabel" id="activeAspectLbl2"></span>
                                                                        </td>
                                                                        <td>
                                                                            <asp:Label ID="lblaspect2" runat="server" CssClass="setupAspectLabel AjaxDropDown"
                                                                                EnableViewState="false" Width="155" />
                                                                            <asp:Panel ID="setupAspect2" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                                visibility: hidden;" EnableViewState="false" Width="155">
                                                                            </asp:Panel>
                                                                            <ajaxToolkit:DropDownExtender BehaviorID="aspectextnd2" ID="aspectextnd2" runat="server"
                                                                                TargetControlID="lblaspect2" DropDownControlID="setupAspect2" EnableViewState="false">
                                                                            </ajaxToolkit:DropDownExtender>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </ContentTemplate>
                                                    </ajaxToolkit:TabPanel>
                                                </ajaxToolkit:TabContainer>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr id="DBoxSettings" style="display: none;">
                                <td>
                                    <table cellpadding="0" cellspacing="0" class="ZeroTopPadding">
                                        <tr id="trSignalFormat">
                                            <td style="padding-top: 5px;">
                                                <span class="signalFormatLabel" id="spnsignalformat"></span>
                                            </td>
                                            <td style="padding-top: 5px;">
                                                <asp:DropDownList ID="signalformat" runat="server" Style="width: 250px;" EnableViewState="false">
                                                </asp:DropDownList>
                                                <ajaxToolkit:CascadingDropDown ID="CDD1" runat="server" BehaviorID="csSFextnd" TargetControlID="signalformat"
                                                    Category="SignalFormat" PromptText="" ServiceMethod="GetDropDownContents" ParentControlID="projector"
                                                    EnableViewState="false" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" style="padding-top: 5px; padding-bottom: 5px;">
                                                <ajaxToolkit:TabContainer ID="dcinemaprojectortab" runat="server" OnClientActiveTabChanged="DCinemaProjectorActiveTabChanged"
                                                    EnableViewState="false" Width="350px">
                                                    <ajaxToolkit:TabPanel ID="dcinemaprojector1" runat="server" HeaderText="" Visible="true"
                                                        EnableViewState="false">
                                                        <ContentTemplate>
                                                            <div class="projectorcontent">
                                                                <table border="0">
                                                                    <tr>
                                                                        <td>
                                                                            <span class="projectorIPLabel" id="p1"></span>
                                                                        </td>
                                                                        <td style="padding: 4px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="projectorip1" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="dlpCinemaIPLabel" id="d1"></span>
                                                                        </td>
                                                                        <td style="padding: 0px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="dlpcinemaip1" onkeypress="KeypressEvent(event, 'dlpCinemaIPConnect', 'c1,dlpcinemaip1,1')" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="2">
                                                                            <table width="100%">
                                                                                <tr>
                                                                                    <td>
                                                                                        <img id="imgProjector1" src="res/Skins/<%= Master.SkinName %>/setup/disconnect.gif"
                                                                                            alt="" />
                                                                                    </td>
                                                                                    <td align="right" style="padding: 0px 2px 0px 2px;">
                                                                                        <a href="javascript:_ClearProjector(1);" id="proClear1" style="display: none"></a>
                                                                                        &nbsp; <a href="javascript:dlpCinemaIPReConnect();" id="dc1" style="display: none">
                                                                                        </a>&nbsp; <a href="javascript:dlpCinemaIPConnect('c1', 'dlpcinemaip1', 1);" id="c1">
                                                                                        </a><span id="disablec1" style="display: none; color: Gray; cursor: default;"></span>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </ContentTemplate>
                                                    </ajaxToolkit:TabPanel>
                                                    <ajaxToolkit:TabPanel ID="dcinemaprojector2" runat="server" HeaderText="" Visible="true"
                                                        EnableViewState="false">
                                                        <ContentTemplate>
                                                            <div class="projectorcontent">
                                                                <table>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="projectorIPLabel" id="p2"></span>
                                                                        </td>
                                                                        <td style="padding: 4px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="projectorip2" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="dlpCinemaIPLabel" id="d2"></span>
                                                                        </td>
                                                                        <td style="padding: 0px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="dlpcinemaip2" onkeypress="KeypressEvent(event, 'dlpCinemaIPConnect', 'c2,dlpcinemaip2,2')" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="2">
                                                                            <table width="100%">
                                                                                <tr>
                                                                                    <td>
                                                                                        <img id="imgProjector2" src="res/Skins/<%= Master.SkinName %>/setup/disconnect.gif"
                                                                                            alt="" />
                                                                                    </td>
                                                                                    <td align="right" style="padding: 0px 2px 0px 2px;">
                                                                                        <a href="javascript:_ClearProjector(2);" id="proClear2" style="display: none"></a>
                                                                                        &nbsp; <a href="javascript:dlpCinemaIPReConnect();" id="dc2" style="display: none">
                                                                                        </a>&nbsp; <a href="javascript:dlpCinemaIPConnect('c2', 'dlpcinemaip2', 2);" id="c2">
                                                                                        </a><span id="disablec2" style="display: none; color: Gray; cursor: default;"></span>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </ContentTemplate>
                                                    </ajaxToolkit:TabPanel>
                                                    <ajaxToolkit:TabPanel ID="dcinemaprojector3" runat="server" HeaderText="" Visible="true"
                                                        EnableViewState="false">
                                                        <ContentTemplate>
                                                            <div class="projectorcontent">
                                                                <table>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="projectorIPLabel" id="p3"></span>
                                                                        </td>
                                                                        <td style="padding: 4px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="projectorip3" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="dlpCinemaIPLabel" id="d3"></span>
                                                                        </td>
                                                                        <td style="padding: 0px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="dlpcinemaip3" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="2">
                                                                            <table width="100%">
                                                                                <tr>
                                                                                    <td>
                                                                                        <img id="imgProjector3" src="res/Skins/<%= Master.SkinName %>/setup/disconnect.gif"
                                                                                            alt="" />
                                                                                    </td>
                                                                                    <td align="right" style="padding: 0px 2px 0px 2px;">
                                                                                        <a href="javascript:dlpCinemaIPReConnect();" id="dc3" style="display: none"></a>
                                                                                        &nbsp; <a href="#" id="c3"></a><span id="disablec3" style="display: none; color: Gray;
                                                                                            cursor: default;"></span>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </ContentTemplate>
                                                    </ajaxToolkit:TabPanel>
                                                    <ajaxToolkit:TabPanel ID="dcinemaprojector4" runat="server" HeaderText="" Visible="true"
                                                        EnableViewState="false">
                                                        <ContentTemplate>
                                                            <div class="projectorcontent">
                                                                <table>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="projectorIPLabel" id="p4"></span>
                                                                        </td>
                                                                        <td style="padding: 4px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="projectorip4" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <span class="dlpCinemaIPLabel" id="d4"></span>
                                                                        </td>
                                                                        <td style="padding: 0px 2px 0px 2px;">
                                                                            <input type="text" maxlength="15" id="dlpcinemaip4" />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="2">
                                                                            <table width="100%">
                                                                                <tr>
                                                                                    <td>
                                                                                        <img id="imgProjector4" src="res/Skins/<%= Master.SkinName %>/setup/disconnect.gif"
                                                                                            alt="" />
                                                                                    </td>
                                                                                    <td align="right" style="padding: 0px 2px 0px 2px;">
                                                                                        <a href="javascript:dlpCinemaIPReConnect();" id="dc4" style="display: none"></a>
                                                                                        &nbsp; <a href="#" id="c4"></a><span id="disablec4" style="display: none; color: Gray;
                                                                                            cursor: default;"></span>
                                                                                    </td>
                                                                                </tr>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </ContentTemplate>
                                                    </ajaxToolkit:TabPanel>
                                                </ajaxToolkit:TabContainer>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="2">
                                                <div class="soundProcessor-content">
                                                    <span id="cp850IpLabel" style="font-size: 18px;"></span>
                                                    <input type="text" id="cp850Ip" maxlength="15" onkeypress="KeypressEvent(event, DisconnectOrConnectCp850Ip)"/>
                                                    <div>
                                                        <a id="cp850ReconnectOrClear" href="javascript:ReconnectOrClearCp850Ip();"></a>
                                                        <a id="cp850ConnectOrDisconnect" href="javascript:DisconnectOrConnectCp850Ip();"></a>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr id="trAudio" class="audioType">
                                            <td colspan="2">
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td>
                                                            <span class="audioOutputLabel" id="AudioOPLbl" style="font-size: 18px; font-weight: bold;"></span>
                                                        </td>
                                                        <td>
                                                            <input type="checkbox" id="chkAnalog" onclick="SelectAudioType(this, 'chkAES');" />
                                                        </td>
                                                        <td>
                                                            <span id="spanAnalog" class="analogLabel"></span>
                                                        </td>
                                                        <td style="padding-left: 15px;">
                                                            <input type="checkbox" id="chkAES" onclick="SelectAudioType(this, 'chkAnalog');" />
                                                        </td>
                                                        <td>
                                                            <span id="spanAES" class="aesLabel"></span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr class="audioType">
                                            <td colspan="2">
                                                <table>
                                                    <tr>
                                                        <td id="tdAudioOffset">
                                                            <b><span class="audioOffsetLabel" id="AudioOSLabel" style="font-size: 18px;"></span>
                                                            </b>
                                                        </td>
                                                        <td id="tdAnalogLbl">
                                                            <span class="analogLabel" id="AnalogLbl"></span>
                                                        </td>
                                                        <td id="tdAnalogOffset">
                                                            <asp:TextBox ID="analogoffset" Height="17px" runat="server" EnableViewState="false" />
                                                            <ajaxToolkit:NumericUpDownExtender ID="NUD1" runat="server" BehaviorID="analog_BID"
                                                                TargetControlID="analogoffset" Width="60" Minimum="0" Maximum="255" EnableViewState="false">
                                                            </ajaxToolkit:NumericUpDownExtender>
                                                            <ajaxToolkit:FilteredTextBoxExtender ID="analogFilter" FilterType="Numbers" runat="server"
                                                                TargetControlID="analogoffset" EnableViewState="false">
                                                            </ajaxToolkit:FilteredTextBoxExtender>
                                                        </td>
                                                        <td style="padding-left: 10px;" id="tdAESLbl">
                                                            <span class="aesLabel" id="AESLbl"></span>
                                                        </td>
                                                        <td id="tdAESOffset">
                                                            <asp:TextBox ID="AESoffset" Height="17px" runat="server" EnableViewState="false"
                                                                ReadOnly="true" />
                                                            <ajaxToolkit:NumericUpDownExtender ID="NUD2" runat="server" BehaviorID="aes_BID"
                                                                Step="10" TargetControlID="AESoffset" Width="60" Minimum="-200" Maximum="200"
                                                                EnableViewState="false">
                                                            </ajaxToolkit:NumericUpDownExtender>
                                                            <ajaxToolkit:FilteredTextBoxExtender ID="ftbe" runat="server" TargetControlID="AESoffset"
                                                                FilterType="Custom, Numbers" ValidChars="-" />
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="2">
                                                <table>
                                                    <tr>
                                                        <td>
                                                            <b><span class="audioSampleRateLabel" id="spnAudioSampleRate" style="font-size: 18px;">
                                                            </span></b>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <asp:Label Width="100" ID="lblAudioSampleRate" runat="server" Text="" CssClass="setupAudioSampleRate AjaxDropDown"
                                                                    EnableViewState="false" />
                                                                <asp:Panel ID="pnlAudioSampleRate" runat="server" CssClass="ContextMenuPanel" Style="display: none;
                                                                    visibility: hidden;" EnableViewState="false" Width="100">
                                                                </asp:Panel>
                                                                <ajaxToolkit:DropDownExtender BehaviorID="audioSampleRateExtnd" ID="audioSampleRateExtnd"
                                                                    runat="server" TargetControlID="lblAudioSampleRate" DropDownControlID="pnlAudioSampleRate"
                                                                    EnableViewState="false">
                                                                </ajaxToolkit:DropDownExtender>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <!--TODO: remove style property if needed-->
                                        <tr style="display: none;">
                                            <td colspan="2">
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding-top: 6px;">
                                                            <asp:CheckBox ID="chkPSF" Checked="false" runat="server" EnableViewState="false" />
                                                            <ajaxToolkit:ToggleButtonExtender ID="ToggleButtonExtender1" runat="server" BehaviorID="psf"
                                                                TargetControlID="chkPSF" ImageWidth="16" ImageHeight="14" UncheckedImageUrl="res/Skins/Blue/Common/Red Button.gif"
                                                                CheckedImageUrl="res/Skins/Blue/Common/Green Button.gif" EnableViewState="false" />
                                                        </td>
                                                        <td style="white-space: nowrap;">
                                                            <span class="psfLabel" id="spnPSF"></span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="2">
                                                <table cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding-top: 6px;">
                                                            <asp:CheckBox ID="chkPlayWithError" Checked="false" runat="server" EnableViewState="false" />
                                                            <ajaxToolkit:ToggleButtonExtender ID="ToggleButtonExtender2" runat="server" BehaviorID="playWithError"
                                                                TargetControlID="chkPlayWithError" ImageWidth="16" ImageHeight="14" UncheckedImageUrl="res/Skins/Blue/Common/Red Button.gif"
                                                                CheckedImageUrl="res/Skins/Blue/Common/Green Button.gif" EnableViewState="false" />
                                                        </td>
                                                        <td style="white-space: nowrap;">
                                                            <span class="playWithErrorLabel" id="spnPlayWithError"></span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <table id="projectorSaveDisabled" class="okADisabled buttonSize ZeroTopPadding" style="cursor: default;
                                        display: none;" border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td class="buttonDisabled buttonPadding">
                                                <span class="buttonDisabledText" id="projectorSaveDisabledText"></span>
                                            </td>
                                        </tr>
                                    </table>
                                    <div id="projectorSave">
                                        <table border="0" cellpadding="0" cellspacing="0" onclick="SaveProjectorInfo()" class="okA buttonSize ZeroTopPadding">
                                            <tr>
                                                <td class="buttonEnabled buttonPadding">
                                                    <a class="buttonEnabledText" href="#" id="projectorSaveEnabledText"></a>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </ContentTemplate>
        </ajaxToolkit:TabPanel>
        <ajaxToolkit:TabPanel ID="setupMediaManagementTab" runat="server" EnableViewState="false"
            HeaderText="">
            <ContentTemplate>
                <div id="mediaManagementTabContent" class="TabContentCSS">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <span class="mediaFolderLabel" id="mediafolderLbl"></span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td>
                                            <div id="newMediaFolder" class="divnewmeidasetup" style="display: none;">
                                                <table onclick="NewMediafolder()" class="newEnabled buttonSize ZeroTopPadding" border="0"
                                                    cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td class="buttonEnabled buttonPadding">
                                                            <a class="buttonEnabledText" href="#" id="newsetupTxt"></a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <table id="newMediaFolderDisabled" class="divnewmeidasetup buttonSize ZeroTopPadding"
                                                style="cursor: default;" border="0" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td class="buttonDisabled buttonPadding">
                                                        <span class="buttonDisabledText" id="spnNewMediaFolderDisabled"></span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td>
                                            <div id="delete" class="divdeletesetup" style="display: none;">
                                                <table onclick="DeleteMediaFolder()" border="0" cellpadding="0" cellspacing="0" class="deleteEnabled buttonSize ZeroTopPadding">
                                                    <tr>
                                                        <td class="buttonEnabled buttonPadding">
                                                            <a class="buttonEnabledText" href="#" id="deletesetupTxt"></a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <table id="deleteDisabled" border="0" cellpadding="0" cellspacing="0" class="buttonSize ZeroTopPadding">
                                                <tr>
                                                    <td class="buttonDisabled buttonPadding">
                                                        <span class="buttonDisabledText" id="spnDeleteDisabled"></span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div id="mediafoldersDiv" onselectstart="return false;">
                                    <table id="mediafoldersTable" cellpadding="0px" cellspacing="0px" class="ZeroTopPadding">
                                        <tbody id="mediafoldersList">
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="width: 1px;">
                                            <span class="pathLabel" id="pathLbl"></span>
                                        </td>
                                        <td>
                                            <asp:TextBox ID="path" Width="120px" onkeyup="EnableSave(this.value, 'savemediafolder');"
                                                onkeypress="KeypressEvent(event,SaveMediaFolder,'');" runat="server"></asp:TextBox>
                                            <ajaxToolkit:FilteredTextBoxExtender ID="filterPath" TargetControlID="path" BehaviorID="filterPath"
                                                FilterMode="InvalidChars" FilterType="Custom" InvalidChars="/*?<>|;&quot;" runat="server"
                                                EnableViewState="false">
                                            </ajaxToolkit:FilteredTextBoxExtender>
                                        </td>
                                        <td style="width: 1px;">
                                            <span class="quotaLabel" id="quotaLbl"></span>
                                        </td>
                                        <td>
                                            <asp:TextBox ID="quota" runat="server" Width="50px" onkeyup="EnableSave(this.value, 'savemediafolder');"
                                                EnableViewState="false" MaxLength="10" onkeypress="KeypressEvent(event,SaveMediaFolder,'');" />
                                            <ajaxToolkit:FilteredTextBoxExtender BehaviorID="quotaFilter" FilterType="Numbers"
                                                ID="quotaFilter" TargetControlID="quota" runat="server" EnableViewState="false">
                                            </ajaxToolkit:FilteredTextBoxExtender>
                                        </td>
                                        <td>
                                            <span class="mbLabel" id="mbLbl"></span>
                                        </td>
                                        <td>
                                            <div id="savemediafolder" class="divsave">
                                                <table onclick="SaveMediaFolder()" class="okA buttonSize ZeroTopPadding" border="0"
                                                    cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td class="buttonEnabled buttonPadding">
                                                            <a class="buttonEnabledText" id="savemediaTxt" href="#"></a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <table id="savemediafolderDisabled" border="0" cellpadding="0" cellspacing="0" class="okADisabled buttonSize ZeroTopPadding">
                                                <tr>
                                                    <td class="buttonDisabled buttonPadding">
                                                        <span class="buttonDisabledText" id="spnSavemediafolderDisabled"></span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table cellpadding="0" cellspacing="0" class="ZeroTopPadding">
                                    <tr>
                                        <td colspan="2" style="padding-top: 8px;">
                                            <asp:CheckBox ID="chkAutoDelete" Checked="true" runat="server" EnableViewState="false"
                                                onclick="AutoDeleteChange(this)" />
                                            <ajaxToolkit:ToggleButtonExtender ID="ToggleButtonExtender3" runat="server" BehaviorID="autoDelete"
                                                TargetControlID="chkAutoDelete" ImageWidth="16" ImageHeight="14" UncheckedImageUrl="res/Skins/Blue/Common/Red Button.gif"
                                                CheckedImageUrl="res/Skins/Blue/Common/Green Button.gif" EnableViewState="false" />
                                        </td>
                                        <td style="white-space: nowrap; width: 1px;">
                                            <span class="setupAutoDeleteLabel" id="spnAutoDelete"></span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            </ContentTemplate>
        </ajaxToolkit:TabPanel>
        <ajaxToolkit:TabPanel ID="setupFeatureTab" runat="server" EnableViewState="false"
            HeaderText="" Visible="true">
            <ContentTemplate>
                <div id="featureTabContent" class="TabContentCSS">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <div>
                                    <table cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding-left: 15px;" class="h2 featureStausLabelColor" id="spnfeatureStatus">
                                            </td>
                                            <td style="width: 440px; color: White; padding-left: 20px;" class="h2 featureNameLabelColor"
                                                id="spnFeatureName">
                                            </td>
                                            <td style="width: 160px; text-align: center;" class="h2 featureValidFromLabelColor"
                                                id="spnFeatureValidFrom">
                                            </td>
                                            <td style="width: 150px; text-align: center;" class="h2 featureValidTillLabelColor"
                                                id="spnFeatureValidTill">
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="FeaturesFrame FeaturesFrameColor">
                                    <div class="features">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="ZeroTopPadding">
                                            <tbody id="tbFeatures">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <table class="featureStatusImages" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="right">
                                            <table border="0">
                                                <tr>
                                                    <td style="width: 20px; vertical-align: top;">
                                                        <img alt="" id="validImg" src="res/Skins/<%= Master.SkinName %>/keys/Valid.gif" />
                                                    </td>
                                                    <td style="padding-right: 15px; vertical-align: top;">
                                                        <label class="featureValidLabel" id="valid">
                                                        </label>
                                                    </td>
                                                    <td style="width: 20px; vertical-align: top;">
                                                        <img alt="" id="validFutureImg" src="res/Skins/<%= Master.SkinName %>/keys/Valid In Future.gif" />
                                                    </td>
                                                    <td style="padding-right: 3px; vertical-align: top;">
                                                        <label class="featureValidInFutureLabel" id="validInFuture">
                                                        </label>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td>
                                            <iframe id="fpmupload" src="uploadFpm.aspx" frameborder="0" scrolling="no" height="22px;"
                                                width="298px;" marginheight="0" marginwidth="0"></iframe>
                                        </td>
                                        <td>
                                            <div class="divkeyget" id="UploadFpm">
                                                <table border="0" cellpadding="0" cellspacing="0" class="getKeyButtonSize ZeroTopPadding">
                                                    <tr>
                                                        <td onclick="UploadFpm()" class="buttonPadding buttonEnabled">
                                                            <a class="buttonEnabledText" style="white-space: nowrap;" id="uploadFpmTxt" href="#">
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <div class="divkeyget" id="UploadFpmDisabled" style="display: none;">
                                                <table border="0" cellpadding="0" cellspacing="0" class="getKeyButtonSize ZeroTopPadding">
                                                    <tr>
                                                        <td class="buttonPadding buttonEnabled">
                                                            <span class="buttonEnabledText" style="white-space: nowrap;" id="uploadFpmTxtDisabled">
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            </ContentTemplate>
        </ajaxToolkit:TabPanel>
        <%--<ajaxToolkit:TabPanel ID="setupTimeCodeTab" runat="server" EnableViewState="false" HeaderText="" Visible="false">
                <ContentTemplate>
                    <div id="timeCodeTabContent" class="TabContentCSS">
                        <table cellpadding="0" cellspacing="0">
                            <tr id="trTimeCodeEnable" style="display:none;">
                                <td colspan="2">
                                    <table cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding-top:15px;"> 
                                                <asp:CheckBox ID="chkTimeCodeEnable" Checked="true" runat="server" EnableViewState="false" onclick="SetIsLTCEnabled(this)"/>
                                                <ajaxToolkit:ToggleButtonExtender ID="ToggleButtonExtender4" runat="server" BehaviorID="timeCodeEnable_BID"
                                                    TargetControlID="chkTimeCodeEnable" ImageWidth="16" ImageHeight="14"
                                                    UncheckedImageUrl="res/Skins/Blue/Common/Red Button.gif"
                                                    CheckedImageUrl="res/Skins/Blue/Common/Green Button.gif" EnableViewState="false" />
                                            </td>
                                            <td style="white-space: nowrap;width:1px;">
                                                <span class="setupTimeCodeEnableLbl" id="spnTimeCodeEnable"></span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>                                
                            </tr>
                            <tr id="trFrameRate" style="display:none;">
                                <td>
                                    <span id="spnFrameRate" class="setupFrameRateLbl"></span>
                                </td>
                                <td>
                                    <select id="cboFrameRate" onchange="FrameRateOnChange(this);" style="width:60px;" >
                                        <option value="24" selected="selected">24</option>
                                        <option value="25">25</option>
                                        <option value="30">30</option>
                                    </select>                                    
                                </td>                                
                            </tr>
                            <tr style="display:none;" id="trTimeCodeOffset">
                                <td>
                                    <span id="lblTCOffset" class="TCOffsetLabel"></span>
                                </td>
                                <td>
                                    <div>
                                        <asp:TextBox ID="txtTCOffset" onchange="TCOffsetOnChange(this)" runat="server" EnableViewState="false" MaxLength="11" Width="70"/>                                    
                                        <ajaxToolkit:MaskedEditExtender ID="meExtTCOffset" runat="server" BehaviorID="tcOffset_BID"
                                            AcceptAMPM="false" AcceptNegative="None" AutoComplete="false" 
                                            OnFocusCssClass="MaskedEditFocus" OnInvalidCssClass="MaskedEditError" 
                                            MaskType="Number" InputDirection="LeftToRight" CultureName="en-US"
                                            Mask="99:99:99:99" ClearMaskOnLostFocus="false"
                                            TargetControlID="txtTCOffset"></ajaxToolkit:MaskedEditExtender>
                                    </div>
                                </td>
                            </tr>
                            <tr style="display:none;" id="trTimeCodeDelay">
                                <td>
                                    <span id="lblTCDelay" class="TCDelayLabel"></span>
                                </td>
                                <td>
                                    <div>
                                        <asp:TextBox ID="txtTCDelay" runat="server" EnableViewState="false" MaxLength="15" Width="35"/>                                    
                                        <ajaxToolkit:FilteredTextBoxExtender ID="FilteredTextBoxExtender1" FilterType="Numbers" runat="server"
                                         TargetControlID="txtTCDelay" EnableViewState="false" BehaviorID="TCDelay_BID"></ajaxToolkit:FilteredTextBoxExtender>
                                        <ajaxToolkit:NumericUpDownExtender ID="nudTCDelay" runat="server" BehaviorID="nudTCDelay_BID"
                                            TargetControlID="txtTCDelay" Width="55" Maximum="255" Minimum="0" EnableViewState="false"></ajaxToolkit:NumericUpDownExtender>                                        
                                    </div>
                                </td>
                            </tr>                            
                            <tr id="trOutputLevel" style="display:none;">
                                <td>
                                    <span id="spnOutputLevel" class="setupOutputLevelLbl"></span>
                                </td>
                                <td>
                                    <div>
                                        <asp:TextBox ID="txtOutputLevel" runat="server" MaxLength="15" Width="35" 
                                            EnableViewState="false"></asp:TextBox>                                    
                                        <ajaxToolkit:FilteredTextBoxExtender ID="FilteredTextBoxExtender4" TargetControlID="txtOutputLevel"
                                            BehaviorID="outputLevel_BID" FilterType="Numbers" runat="server" EnableViewState="false">
                                        </ajaxToolkit:FilteredTextBoxExtender>
                                        <ajaxToolkit:NumericUpDownExtender ID="nudOutputLevel" runat="server" BehaviorID="nudOutputLevel_BID"
                                            TargetControlID="txtOutputLevel" Width="55" Maximum="100" Minimum="0" EnableViewState="false"></ajaxToolkit:NumericUpDownExtender>
                                        
                                    </div>
                                </td>
                            </tr> 
                            <tr>
                                <td colspan="2">
                                    <div id="divTimeCodeSave">
                                        <table onclick="SaveTimeCodeProperties()" class="okA buttonSize ZeroTopPadding" border="0" 
                                            cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td class="buttonEnabled buttonPadding">
                                                    <a class="buttonEnabledText" id="timeCodeSaveEnabledText" href="#"></a>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <table id="divTimeCodeSaveDisabled" border="0" cellpadding="0" style="display:none;"
                                        cellspacing="0" class="okADisabled buttonSize ZeroTopPadding">
                                        <tr>
                                            <td class="buttonDisabled buttonPadding">
                                                <span class="buttonDisabledText" id="timeCodeSaveLblDisabledText"></span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>                           
                        </table>
                    </div>
                </ContentTemplate>
            </ajaxToolkit:TabPanel>--%>
    </ajaxToolkit:TabContainer>
</asp:Content>
