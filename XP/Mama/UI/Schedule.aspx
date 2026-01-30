<%@ Page Language="C#" MasterPageFile="Mama.master" EnableEventValidation="false" AutoEventWireup="true" UICulture="auto" Inherits="Schedule" Title="Schedule Page" Codebehind="Schedule.aspx.cs" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ Register Assembly="DayPilot" Namespace="DayPilot.Web.Ui" TagPrefix="DayPilot" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder" Runat="Server" EnableViewState="false">        
        
    <div id="divprotection" class="progressIndicator" 
        style="display:none;background-color:Gray;cursor:move;"></div>

    <div id="divCalendar" style="left:20px;top:100px;position:absolute; z-index:100;">
        <table border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding-right:5px;"><span id="lblgotoDate" class="gotoDateLabel"></span></td>
                <td><asp:TextBox ID="gotoDate" runat="server" AutoPostBack="true" CssClass="gotoDate" 
                        TabIndex="12" OnTextChanged="gotoDate_TextChanged"></asp:TextBox>
                    <ajaxToolkit:CalendarExtender ID="calPopup" BehaviorID="gotoDate_BID" runat="server" TargetControlID="gotoDate" Format="MM/dd/yyyy">                        
                    </ajaxToolkit:CalendarExtender>
                    <ajaxToolkit:TextBoxWatermarkExtender ID="gotoDateWaterBehavior" runat="server" BehaviorID="fromDateWaterBehavior" TargetControlID="gotoDate"
                        WatermarkText="mm/dd/yyyy" WatermarkCssClass="watermark gotoDate"></ajaxToolkit:TextBoxWatermarkExtender>
                    <ajaxToolkit:MaskedEditExtender runat="server" ID="maskGoTo" TargetControlID="gotoDate" BehaviorID="maskFromBehavior" MaskType="Date" 
                        Mask="99/99/9999" UserDateFormat="MonthDayYear"></ajaxToolkit:MaskedEditExtender>
                </td>
            </tr>
        </table>
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="tblDragShowLabel">
    <tr>
        <td style="vertical-align:bottom;"><span class="selectShowToSchedule" id="spnDragShow"></span></td>
    </tr>
    </table>

    <div class="dragShow ContextMenuPanel" id="dragShow" onselectstart="return false"></div>
            
    <div style="left:283px;top:100px;position:absolute;width:702px;">
    <asp:UpdatePanel ID="dpCalandar" UpdateMode="Conditional" runat="server">
        <ContentTemplate>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr class="schedulerTitleBackGround">
                    <td align="left"><asp:ImageButton ID="prevWeek" runat="server" CssClass="h2" OnClick="prevWeek_Click" TabIndex="13"/></td>
                    <td align="center"><asp:Label ID="dateRange" CssClass="schedulerTitle" runat="server"></asp:Label></td>
                    <td align="right"><asp:ImageButton ID="nextWeek" CssClass="h2" runat="server" OnClick="nextWeek_Click" TabIndex="14" /></td>
                </tr>
                <tr>
                    <td colspan="3" class="dpCell">
                        <DayPilot:DayPilotCalendar ID="dayPilotCalendar1" runat="server" CssClass="dpcalendar"
                            Days="7" TimeRangeSelectedHandling="JavaScript" TimeFormat="Clock12Hours"
                            TimeRangeSelectedJavaScript="javascript:ShowDialog(start, end, column)"                          
                            EventClickHandling="javaScript" EventClickJavaScript="javascript:EventEdit(e)"
                            ContextMenuID="DayPilotMenu1" OnEventMenuClick="dayPilotCalendar1_EventMenuClick"
                            ClientObjectName="dpc1" OnTimeRangeSelected="dayPilotCalendar1_TimeRangeSelected" Width="702px"
                            EventMoveHandling="JavaScript"  EventMoveJavaScript="EventMove(e, newStart, newEnd, oldColumn, newColumn)"
                            OnEventMove="dayPilotCalendar1_EventMove" HeaderDateFormat="d - ddd" 
                            OnPreRender="dayPilotCalendar1_PreRender"
                            BackColor="White" BorderColor="#316AC5" EventBorderColor="#316AC5"
                            HourBorderColor="#316AC5" HourHalfBorderColor="#C0C0FF" HourNameBackColor="#D4D0C8"
                            NonBusinessBackColor="White" TabIndex="15">
                        </DayPilot:DayPilotCalendar>
                        <daypilot:daypilotmenu id="DayPilotMenu1" ShowMenuTitle="false" runat="server">
                            <DayPilot:MenuItem Text="Delete" Action="Callback" Command="Delete" />
                        </daypilot:daypilotmenu>
                    </td>
                </tr>
            </table>
        </ContentTemplate>
        <Triggers>
            <asp:AsyncPostBackTrigger ControlID="gotoDate"/>
            <asp:AsyncPostBackTrigger ControlID="prevWeek"/>
            <asp:AsyncPostBackTrigger ControlID="nextWeek"/>
        </Triggers>
    </asp:UpdatePanel>
    </div>     
             
    <ajaxToolkit:ModalPopupExtender ID="ModalPopupExtender1" runat="server" BehaviorID="mpextnd"
            TargetControlID="dummy" PopupControlID="aspPanel" 
            DropShadow="true" BackgroundCssClass="modalPopupBackground" EnableViewState="false"
            OkControlID="yes" OnOkScript="SaveSchedule()" CancelControlID="no" OnCancelScript="OnCancel()" />                   

    <asp:Panel ID="aspPanel" Style="display: none" runat="server" CssClass="modalPopup" Width="340" Height="176" EnableViewState="false">            
    <table border="0" cellpadding="0" cellspacing="0" style="width:340px;">
        <tr>
            <td class="modalPopupTitle">
                <span id="selectShowTitle"></span>
            </td>
        </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0">
        <tr>
            <td style="padding:5px 5px 5px 5px;"><span id="selectShowLbl" class="scheduleShowLabel"></span></td>
            <td style="padding:5px 5px 5px 5px;">
                <div style="padding-top:5px;">
                    <asp:Label ID="lblHeading" runat="server" CssClass="scheduleShowLabel AjaxDropDown" Width="215" TabIndex="1" EnableViewState="false"/>
                    <asp:Panel ID="scheduleshowList" runat="server" CssClass="ContextMenuPanel" 
                        Style="display :none; visibility: hidden;" EnableViewState="false" Width="215">         
                    </asp:Panel>
                    <ajaxToolkit:DropDownExtender BehaviorID="scheduleextnd" ID="scheduleextnd" runat="server" TargetControlID="lblHeading"
                    DropDownControlID="scheduleshowList" EnableViewState="false"></ajaxToolkit:DropDownExtender>            
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding:5px 5px 5px 5px;"><span id="selectDateLbl" class="DateLabel" ></span></td>
            <td style="padding:5px 5px 5px 5px;">
                <asp:TextBox ID="startDate" CssClass="startDate" runat="server" TabIndex="1" EnableViewState="false"></asp:TextBox>                        
                <ajaxToolkit:CalendarExtender ID="startDateCalendar" BehaviorID="startDate_BID" runat="server" 
                    TargetControlID="startDate" Format="MM/dd/yyyy" EnableViewState="false">
                </ajaxToolkit:CalendarExtender>
                <ajaxToolkit:TextBoxWatermarkExtender ID="TextBoxWatermarkExtender1" runat="server" BehaviorID="startDateWaterBehavior" TargetControlID="startDate"
                    WatermarkText="mm/dd/yyyy" WatermarkCssClass="watermark startDate" EnableViewState="false"></ajaxToolkit:TextBoxWatermarkExtender>
                <ajaxToolkit:MaskedEditExtender runat="server" ID="MaskedEditExtender1" TargetControlID="startDate" BehaviorID="maskDateBehavior" MaskType="Date" 
                    Mask="99/99/9999" UserDateFormat="MonthDayYear" EnableViewState="false"></ajaxToolkit:MaskedEditExtender>
            </td>
        </tr>
        <tr>
            <td style="padding:5px 5px 5px 5px;"><span id="startTimeLbl" class="timeLabel"></span></td>
            <td style="padding:5px 5px 5px 5px;"><asp:TextBox ID="startTime" CssClass="startTime" runat="server" TabIndex="1" EnableViewState="false"></asp:TextBox></td>
        </tr>
        <tr>
            <td colspan="2" style="width:340px;text-align:right;padding-top:5px;">
                <table cellpadding="0" cellspacing="0" style="float:right;">
                    <tr>
                        <td>
                            <div id="yes" style="display:none;">
                                <table border="0" cellpadding="0" cellspacing="0" class="scheduleA buttonSize">
                                    <tr>
                                        <td class="buttonEnabled buttonPadding">
                                            <a class="buttonEnabledText" id="yes_a" href="#"></a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <table border="0" cellpadding="0" cellspacing="0" 
                                class="scheduleADisabled buttonSize" id="yesDisabled">
                                <tr>
                                    <td class="buttonDisabled buttonPadding">
                                        <span class="buttonDisabledText" id="yesDisabled_a"></span>
                                    </td>
                                </tr>
                            </table>                            
                        </td>
                        <td style="padding-left:5px;padding-right:5px;">
                            <table border="0" cellpadding="0" cellspacing="0" id="no"                                
                                class="noA buttonSize">
                                <tr>
                                    <td class="buttonPadding buttonEnabled">
                                        <a class="buttonEnabledText" id="no_a" href="#"></a>
                                    </td>
                                </tr>
                            </table>                            
                        </td>
                    </tr>
                </table>                       
            </td>
        </tr>
    </table>

    <ajaxToolkit:MaskedEditExtender ID="MaskedEditExtender3" runat="server"
        TargetControlID="startTime" Mask="99:99:99" MessageValidatorTip="true"
        OnFocusCssClass="MaskedEditFocus" OnInvalidCssClass="MaskedEditError"
        MaskType="Time" AcceptAMPM="True" CultureName="en-US" BehaviorID="startTime_BID"
        AutoComplete="false" PromptCharacter="0" EnableViewState="false"/>
    </asp:Panel>        
    
    <script type="text/javascript" language="javascript" src="Scripts/Common.js"></script> 
    <script type="text/javascript" language="javascript" src="Scripts/Scheduler.js"></script>
    <script type="text/javascript" language="javascript" src="Scripts/Schedule.js"></script>     
</asp:Content>


