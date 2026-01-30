<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Control" UICulture="auto" CodeBehind="Control.aspx.cs" Inherits="ControlPage" %>  
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>
    
<asp:Content ID="Control" ContentPlaceHolderID="ContentPlaceHolder" EnableViewState="false" Runat="Server">      
    <script type="text/javascript">
        var _playAnyComposition = Boolean.parse('<%= ConfigurationManager.AppSettings["PlayAnyComposition"] %>');
        var controlstop = '<%= controlstop.ClientID %>';
        var controlpause = '<%= controlpause.ClientID %>';
        var controlplay = '<%= controlplay.ClientID %>';
        var ejectShow = '<%= ejectShow.ClientID %>';
        var _ignoreShowValidationFailures =
                Boolean.parse('<%= IsIgnoreShowValidationFailures() %>');
    </script>
    
    <div id="bg">
        <div class="playValidation" id="validationError" style="display:none;padding-bottom:25px;">
            <table cellpadding="0" cellspacing="0" width="295px;">
                <tr>
                    <td>
                        <table cellpadding="0" cellspacing="0" style="background-color:#F5FFFF">
                            <tr>                    
                                <td style="padding-left:5px;"><span id="Validate" class="validationFailedText validationFailedTextColor"></span></td>
                                <td style="padding-left:6px;padding-right:5px;">
                                    <img src="res/Skins/<%= Master.SkinName %>/Common/expand.jpg" 
                                        id="imgCollapsePanel" alt="" onclick="ErrorMessageHandler();"/>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr style="display:none;" id="trValidationErrorFrame">
                    <td style="background-color:#F5FFFF;min-height:50px;vertical-align:top;padding-left:5px;">
                        <span id="validationErrorFrame" style="white-space:normal;" class="validationErrorText validationErrorTextColor"></span></td>
                </tr>
            </table>
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0"  class="statusTable">
            <tr>
                <td class="text">
                    <span class="controlCurrentShowLabel" id="controlnowPlayingLabel"></span>
                </td>
                <td class="value" colspan="2">
                    <span class="controlCurrentShowName" id="controlnowPlaying"></span>
                </td>
            </tr>
            <tr style="padding-top:6px;">
                <td class="text">
                    <span class="controlStatusLabel" id="controlstatusLabel"></span>
                </td>
                <td class="value" colspan="2">
                    <span class="controlStatusInfo" id="controlstatus"></span>
                </td>
            </tr>
            <tr style="padding-top:6px;">
                <td class="text">
                    <span class="controlDurationLabel" id="controldurationLabel"></span>
                </td>
                <td class="value" colspan="2">
                    <span class="controlDurationInfo" id="controlduration">00:00:00</span> 
                </td>
            </tr>
            <tr style="padding-top:6px;">
                <td class="text" style="vertical-align:text-top;">
                    <span class="controlShowTimeLabel" id="controltimeLeftLabel"></span>                    
                </td>
                <td class="value" rowspan="2">
                    <table border="0" cellpadding="0" cellspacing="0" style="height:60px;">
                        <tr>
                            <td style="width:90px;">
                                <span class="controlShowTimeInfo" id="controltimeLeft">00:00:00</span>                                
                            </td>
                            <td style="padding-left:5px;">
                                <span onmouseout="javascript:this.className='controlDurationUpDownButton';" 
                                    onmouseover="javascript:this.className='controlDurationUpDownButton-hover';" 
                                    id="timeLeftCount" class="controlDurationUpDownButton" onclick="ChangeStatus(this);" />
                            </td>
                        </tr>
                        <tr>
                            <td style="width:90px;vertical-align:bottom;padding-bottom:0px;">
                                <span class="controlEventTimeInfo" style="padding-bottom:0px;" id="controleventtime">00:00:00</span>                                
                            </td>
                            <td style="padding-left:5px;vertical-align:bottom;padding-bottom:3px;">
                                <span onmouseout="javascript:this.className='controlDurationUpDownButton';" 
                                    onmouseover="javascript:this.className='controlDurationUpDownButton-hover';" id="eventTimeCount" 
                                    class="controlDurationUpDownButton" onclick="ChangeStatus(this);" />
                            </td>
                        </tr>
                    </table>                    
                </td>                
            </tr>
            <tr>
                <td class="text">
                    <span class="controlEventTimeLable" id="controleventtimeLabel"></span>
                </td>                
            </tr>
        </table>
                
        <div id="pointerTime" class="tooltip" style="top:240px;display:none;position:absolute;"></div>
        <div id="seekProgress" class="seekProgress" onmouseout="javascript:$get('pointerTime').style.display='none'" onmousemove="PopulateDuration(event)" onclick="SeekProgressClick(event)"></div>
        <img id="controlpositionBar" src="res/Skins/<%= Master.SkinName %>/Common/Progressbar Small.jpg" alt="" onmouseout="javascript:$get('pointerTime').style.display='none'" onmousemove="PopulateDuration(event)" onclick="SeekProgressClick(event)"/> 

        <span class="controlShowStartTime" id="controlstarttime"></span>
        <span class="controlCurrentDuration" id="controlcurrentPos"></span>
        <span class="controlShowEndTime" id="controlendtime"></span>
       
        <input type="button" class="btnprevEvent" id="btnPrev" visible="false" value="" onclick="MovePrevious()"/>
        <div id="controlevents" onselectstart='return false;'></div>
        <input type="button" class="btnnextEvent" id="btnNext" visible="false" value="" onclick="MoveNext()"/>
        
        <asp:LinkButton ID="controlstop" CssClass="controlstop controlStopSrc" OnClientClick="return Stop()" runat="server" EnableViewState="false" />
        <asp:LinkButton ID="ejectShow" CssClass="controlstop controlEjectSrc" OnClientClick="return EjectShow()" runat="server" EnableViewState="false" />
        <span id="controlstopDisabled" class="controlstopDisabled" visible="false"></span>
        <span id="controlStopInactive" class="controlStopInactive" visible="false"></span>
        
        <asp:LinkButton ID="controlpause" OnClientClick="return Pause();" CssClass="controlpause controlPauseSrc" runat="server" EnableViewState="false"/>
        <span id="controlpauseDisabled" class="controlpauseDisabled" visible="false"></span>
        <span id="controlPauseInactive" class="controlPauseInactive" visible="false"></span>
        
        <asp:LinkButton ID="controlplay" OnClientClick="return Play();" CssClass="controlplay controlPlaySrc"  runat="server" EnableViewState="false"/>
        <span id="controlplayDisabled" class="controlplayDisabled" visible="false"></span>  
        <span id="controlPlayInactive" class="controlPlayInactive" visible="false"></span>
                
        <table border="0" cellpadding="0" cellspacing="0" class="playbackControlLabel">
            <tr>
                <td style="width:100px;"><span id="controlstopLabel" style="white-space:normal;"></span></td>
                <td style="width:100px;"><span id="controlpauseLabel" style="white-space:normal;"></span></td>
                <td style="width:100px;"><span id="controlplayLabel" style="white-space:normal;"></span></td>
            </tr>
        </table>
        
        <table border="0" cellpadding="0" cellspacing="0" id="controlresume"
            style="visibility:hidden;" class="divresume">
            <tr>
                <td onclick="ResumeShow()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" id="resumeTxt" href="#"></a>
                </td>
            </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" id="controlresumeDisabled">
            <tr>
                <td class="buttonPadding buttonDisabled">
                    <span class="buttonDisabledText" id="spnControlresumeDisabled"></span>
                </td>
            </tr>
        </table>
        
        <table border="0" cellpadding="0" cellspacing="0" id="controlload"
            style="visibility:hidden;"
            class="divload">
            <tr>
                <td onclick="LoadShow()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" id="loadTxt" href="#"></a>
                </td>
            </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" id="controlloadDisabled">
            <tr>
                <td class="buttonPadding buttonDisabled">
                    <span class="buttonDisabledText" id="spnControlloadDisabled"></span>
                </td>
            </tr>
        </table>
        
        <div class="Shows">
            <asp:Label ID="lblHeading" runat="server" Width="250"
                CssClass="controlShowLabel AjaxDropDown" EnableViewState="false"/>
            <asp:Panel ID="controlshowList" runat="server" CssClass="ContextMenuPanel" 
                Style="display :none; visibility: hidden;" Width="250" EnableViewState="false">         
            </asp:Panel>
            <ajaxToolkit:DropDownExtender BehaviorID="showextnd" ID="showextnd" runat="server" EnableViewState="false" TargetControlID="lblHeading"
            DropDownControlID="controlshowList"></ajaxToolkit:DropDownExtender>            
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" id="manualEnabled"
            style="visibility:hidden;"
            class="manualEnabled">
            <tr>
                <td onclick="SelectManual()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" id="manualTxt" href="#"></a>
                </td>
            </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" id="manualDisabled">
            <tr>
                <td class="buttonPadding buttonDisabled">
                    <span class="buttonDisabledText" id="spnManualDisabled"></span>
                </td>
            </tr>
        </table>
        
        <table border="0" cellpadding="0" cellspacing="0" id="scheduleEnabled"
            style="visibility:hidden;"
            class="scheduleEnabled">
            <tr>
                <td onclick="SelectScheduled()" class="buttonPadding buttonEnabled">
                    <a class="buttonEnabledText" id="scheduleTxt" href="#"></a>
                </td>
            </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" id="scheduleDisabled">
            <tr>
                <td class="buttonPadding buttonDisabled">
                    <span class="buttonDisabledText" id="spnScheduleDisabled"></span>
                </td>
            </tr>
        </table>
        
        <div class="centerPart">
            <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td>
                        <asp:TextBox ID="seekTime" MaxLength="8" onpaste="return false" EnableViewState="false"
                            Text="00:00:00" runat="server" style="font-size:19px" 
                            Width="85px" onchange="javascript:SeekTimeChanged(); return false;" Height="23px"/>
                        
                        <ajaxToolkit:MaskedEditExtender ID="meExtender" runat="server" ClearMaskOnLostFocus="false"
                            TargetControlID = "seekTime" Mask="99:99:99" 
                            OnFocusCssClass="MaskedEditFocus" OnInvalidCssClass="MaskedEditError" 
                            MaskType="Number" InputDirection="LeftToRight" CultureName="en-US" 
                            BehaviorID="seekTime_BID" AutoComplete="false"  EnableViewState="false"/>
                    </td>
                    <td>
                        <table border="0" cellpadding="0" cellspacing="0" id="seek"
                            style="display:none" class="divseek buttonSize">
                            <tr>
                                <td onclick="Seek()" class="buttonPadding buttonEnabled">
                                    <a class="buttonEnabledText" id="seek_a" href="#"></a>
                                </td>
                            </tr>
                        </table>
                        <table border="0" cellpadding="0" cellspacing="0" id="seekDisabled" class="buttonSize">
                            <tr>
                                <td class="buttonPadding buttonDisabled">
                                    <span class="buttonDisabledText" id="spnSeekDisabled"></span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr id="trPlayType" style="visibility:hidden;">
                    <td style="padding-top:5px;padding-bottom:10px;">
                        <span id="spnPlayType" class="showPlayTypeLabel"></span>
                    </td>
                    <td style="padding-left:5px;padding-bottom:10px;">                                    
                        <asp:Label ID="lblPlayType" runat="server" CssClass="playTypeLabel AjaxDropDown" 
                            EnableViewState="false"/>
                        <asp:Panel ID="ddPlayType" runat="server" CssClass="ContextMenuPanel" Style="display :none; 
                            visibility: hidden;" EnableViewState="false">         
                        </asp:Panel>
                        <ajaxToolkit:DropDownExtender BehaviorID="playTypeExtnd" ID="ddPlayTypeExtnd" runat="server" 
                            EnableViewState="false" TargetControlID="lblPlayType"
                            DropDownControlID="ddPlayType"></ajaxToolkit:DropDownExtender>            
                    </td>                        
                </tr>
                <tr id="trSequenceType" style="visibility:hidden;">
                    <td>
                        <span id="spnSequence" class="showPlayTypeLabel"></span>
                    </td>
                    <td style="padding-left:5px;">
                        <asp:TextBox ID="txtSequence" runat="server" EnableViewState="false"/>
                        <ajaxToolkit:NumericUpDownExtender ID="NUD1" runat="server" BehaviorID="sequence_BID"
                            TargetControlID="txtSequence" Width="40" Minimum="1" Maximum="255" 
                            EnableViewState="false">
                        </ajaxToolkit:NumericUpDownExtender>
                        <ajaxToolkit:FilteredTextBoxExtender ID="sequenceFilter" FilterType="Numbers" 
                            runat="server" TargetControlID="txtSequence" EnableViewState="false">
                        </ajaxToolkit:FilteredTextBoxExtender>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <div id="divloop" style="display:none;">
                            <asp:CheckBox ID="loopplay1" Checked="false" runat="server" 
                                            onclick="UpdateLoopPlayBack(this);" EnableViewState="false"/>
                            <ajaxToolkit:ToggleButtonExtender ID="ToggleEx" runat="server" BehaviorID="loopplay"                        
                                TargetControlID="loopplay1" EnableViewState="false"
                                ImageWidth="20" ImageHeight="20"                                            
                                UncheckedImageUrl="res/Skins/Blue/Common/Loop Inactive.png" 
                                CheckedImageUrl="res/Skins/Blue/Common/Loop Active.png" />
                            
                            <span class="loopLabel" id="loopLbl"></span>
                        </div>
                    </td>
                </tr>                
            </table>
        </div>       
    </div>  
    <table id="tblCueList" style="display:none;"></table>
    <script type="text/javascript" language="javascript" src="Scripts/Control.js"></script>     
</asp:Content>
