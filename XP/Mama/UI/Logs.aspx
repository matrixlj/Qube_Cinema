<%@ Page Language="C#" MasterPageFile="Mama.master" Title="Logs" Inherits="Logs" Codebehind="Logs.cs" AutoEventWireup="True" UICulture="auto" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxToolkit" %>
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="Logs1" ContentPlaceHolderID="ContentPlaceHolder" runat="Server" EnableViewState="false">    
    <script type="text/javascript">
        var tabContainer = '<%= tabsContainer.ClientID %>';
    </script>
	<div id="logsDiv">	
		<div id="divCalendar" style="left:410px;top:89px;width:450px;position:absolute; z-index:100;">
		    <table style="width:450px;">
		        <tr>
		            <td align="right">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding-right:5px;">		
		                            <span class="logFromLabel" id="fromLabel"></span>
		                        </td>
		                        <td style="padding-right:5px;">
		                            <asp:TextBox ID="logFrom" runat="server" CssClass="logFrom" />
                                    <ajaxToolkit:CalendarExtender ID="fromDateCalendar" runat="server" TargetControlID="logFrom" BehaviorID="logFrom_BID" />
                                    <ajaxToolkit:TextBoxWatermarkExtender ID="fromDateWaterBehavior" runat="server" BehaviorID="fromDateWaterBehavior" TargetControlID="logFrom"
	                                    WatermarkText="mm/dd/yyyy" WatermarkCssClass="watermark logFrom"></ajaxToolkit:TextBoxWatermarkExtender>
	                                <ajaxToolkit:MaskedEditExtender runat="server" ID="maskFrom" TargetControlID="logFrom" BehaviorID="maskFromBehavior" MaskType="Date" 
	                                    Mask="99/99/9999" UserDateFormat="MonthDayYear"></ajaxToolkit:MaskedEditExtender>
	                                </td>
	                             <td>    
	                                    <asp:UpdatePanel runat="server" UpdateMode="Conditional">
	                                        <ContentTemplate>
	                                            <asp:TextBox ID="logFromTime" runat="server" CssClass="logFrom"></asp:TextBox>
	                                            <ajaxToolkit:TextBoxWatermarkExtender ID="fromTime" runat="server" BehaviorID="fromTimeWaterBehavior" TargetControlID="logFromTime"
	                                                WatermarkText="hh:mm:ss" WatermarkCssClass="watermark logFrom"></ajaxToolkit:TextBoxWatermarkExtender>
	                                            <ajaxToolkit:MaskedEditExtender runat="server" ID="maskFromTime" TargetControlID="logFromTime" BehaviorID="maskFromTimeBehavior" 
	                                                MaskType="Time" Mask="99:99:99" UserTimeFormat="TwentyFourHour"></ajaxToolkit:MaskedEditExtender>    
	                                        </ContentTemplate>
	                                        <Triggers>
	                                            <asp:AsyncPostBackTrigger ControlID="tabsContainer" EventName="ActiveTabChanged" />
	                                        </Triggers>
	                                    </asp:UpdatePanel>
	                                
		                        </td>
		                        <td style="padding-right:5px;padding-left:5px;">
		                            <span class="logToLabel" id="toLabel"></span>
		                        </td>
		                        <td style="padding-right:5px;">
		                            <asp:TextBox ID="logTo" runat="server" CssClass="logTo" />
	                                <ajaxToolkit:CalendarExtender ID="toDateCalendar" runat="server" TargetControlID="logTo" BehaviorID="logTo_BID"/>
	                                <ajaxToolkit:TextBoxWatermarkExtender ID="toDateWaterMarker" runat="server" BehaviorID="toDateWaterBehavior" TargetControlID="logTo"
	                                    WatermarkText="mm/dd/yyyy" WatermarkCssClass="watermark logTo"></ajaxToolkit:TextBoxWatermarkExtender>
	                                <ajaxToolkit:MaskedEditExtender runat="server" ID="maskTo" TargetControlID="logTo" BehaviorID="maskToBehavior" MaskType="Date" 
	                                    Mask="99/99/9999" UserDateFormat="MonthDayYear" UserTimeFormat="TwentyFourHour"></ajaxToolkit:MaskedEditExtender>
	                             </td>
	                             <td>
	                                    <asp:UpdatePanel ID="UpdatePanel1" runat="server" UpdateMode="Conditional">
	                                        <ContentTemplate>
	                                            <asp:TextBox ID="logToTime" runat="server" CssClass="logTo"></asp:TextBox>
	                                            <ajaxToolkit:TextBoxWatermarkExtender ID="toTime" runat="server" BehaviorID="toTimeWaterBehavior" TargetControlID="logToTime"
	                                                WatermarkText="hh:mm:ss" WatermarkCssClass="watermark logTo"></ajaxToolkit:TextBoxWatermarkExtender>
	                                            <ajaxToolkit:MaskedEditExtender runat="server" ID="maskToTime" TargetControlID="logToTime" BehaviorID="maskToTimeBehavior" MaskType="Time" 
	                                                Mask="99:99:99"></ajaxToolkit:MaskedEditExtender>
	                                    </ContentTemplate>
	                                        <Triggers>
	                                            <asp:AsyncPostBackTrigger ControlID="tabsContainer" EventName="ActiveTabChanged" />
	                                        </Triggers>
	                                    </asp:UpdatePanel>
	    	                    </td>	    	        
    	                    </tr>
    	                </table>
    	            </td>
    	        </tr>
    	    </table>
    	</div>
    	
      	<asp:ImageButton ID="getLogs" runat="server" AlternateText="Get logs for the date specified" 
      	    OnClientClick="return ToDateValidation()" CssClass="getLogs buttonSize" 
      	    OnClick="getLogs_ServerClick" EnableViewState="false"/>
        <asp:LinkButton ID="getTxt" CssClass="getTxt buttonEnabledText" runat="server" 
            OnClick="getLogsSpan_ServerClick" OnClientClick="return ToDateValidation()" 
            EnableViewState="false"></asp:LinkButton>
        
        <ajaxToolkit:TabContainer ID="tabsContainer" runat="server" OnClientActiveTabChanged="ActiveTabChanged_Client"
                style="left:30px; top:101px; position:absolute;" OnActiveTabChanged="ActiveTabChanged_Server"
                EnableViewState="false">
            <ajaxToolkit:TabPanel ID="ingest" runat="server" 
                HeaderText="" EnableViewState="false">
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="play" runat="server"
                HeaderText="" EnableViewState="false">
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="pnlQube" Visible="false" runat="server"
                HeaderText="" EnableViewState="false">
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="pnlSystem" Visible="false" runat="server"
                HeaderText="" EnableViewState="false">
            </ajaxToolkit:TabPanel>
            <ajaxToolkit:TabPanel ID="pnlSecurity" Visible="false" runat="server"
                HeaderText="" EnableViewState="false">
            </ajaxToolkit:TabPanel>
        </ajaxToolkit:TabContainer>
        
        <asp:UpdatePanel ID="UpdatePanel" runat="server" UpdateMode="Conditional">
		    <ContentTemplate>		        
	            <div id="logsTableDiv" onselectstart="return false;">
	            	                
	                <asp:Label Text="Click get button to download security log" CssClass="securityLogMessageHidden" 
	                    ID="lblSecurityLogMessage" runat="server"></asp:Label>
	                
		            <asp:GridView ID="gridView" runat="server" Width="100%" AllowPaging="True" CssClass="gridView"
		                PageSize="19" AutoGenerateColumns="False" RowStyle-HorizontalAlign="Left">
                        <HeaderStyle CssClass="headerStyle" />
                        <RowStyle CssClass="rowStyle" />
                        <PagerSettings Mode="NumericFirstLast" />
                        <PagerStyle CssClass="pageNavigator" />
                    </asp:GridView>
                    
	            </div>
                <a id="downloadLog" runat="server" class="downloadLog" target="_blank"></a>                
		    </ContentTemplate>
		    <Triggers>
		        <asp:AsyncPostBackTrigger ControlID="getLogs" />
		        <asp:AsyncPostBackTrigger ControlID="getTxt" />
		        <asp:AsyncPostBackTrigger ControlID="tabsContainer" EventName="ActiveTabChanged" />		        
		    </Triggers>
		</asp:UpdatePanel>

		<asp:ObjectDataSource ID="objectDataSource" runat="server">                       
        </asp:ObjectDataSource>
        
        <asp:TextBox ID="logType" runat="server" Visible="false"></asp:TextBox>
        <script type="text/javascript" language="javascript" src="Scripts/Logs.js"></script>     
	</div>	
</asp:Content>
