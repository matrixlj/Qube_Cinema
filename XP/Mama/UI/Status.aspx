<%@ Page Language="C#" MasterPageFile="Mama.master" 
    Title="Status" UICulture="auto" CodeBehind="Status.aspx.cs" Inherits="Status"%>  
<%@ MasterType virtualpath="Mama.master" %>

<asp:Content ID="Status" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">    
    <div id="statusBg" onselectstart='return false;'>
    
        <table border="0" cellpadding="0" cellspacing="0" class="statusCurrentShowInfo">
            <tr>
                <td><span class="statusCurrentShowLabel" id="statusNowPlayingLabel" ></span></td>
                <td style="padding-left:10px;"><span class="statusCurrentShowName" id="statusNowPlaying"></span></td>
            </tr>
        </table>        
        
        <table border="0" class="statusShowDurationStatus">
            <tr>
                <td align="right">
                    <table border="0">
                        <tr>
                            <td><span id="statusCurrentPosition"></span></td>
                            <td><span id="statusSlash"></span></td>
                            <td><span id="statusShowDuration"></span></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <img src="res/Skins/<%= Master.SkinName %>/Common/Progressbar Small.jpg" id="statusCurrentPositionBar" alt=""/>
        
        <table border="0" cellpadding="0" cellspacing="0" class="statusCurrentIngestInfo">
            <tr>
                <td><span class="statusCurrentIngestLabel" id="statusCurrentIngestLabel"></span></td>
                <td style="padding-left:10px;"><span class="statusCurrentIngestName" id="statusCurrentIngest"></span></td>
            </tr>
        </table>
        
        <span class="statusCurrentIngestCompleted" id="statusCurrentIngestComplete"></span>        
        <span class="statusEstimatedTimeToCompletion" id="statusEstimatedTimeLabel"></span>
        <span class="statusDuration" id="statusMinutes" ></span>
        
        <img src="res/Skins/<%= Master.SkinName %>/Common/Progressbar Small.jpg" id="statusIngestPositionBar" alt=""/>
        
        <table cellpadding="0" cellspacing="0" border="0" class="timeInfo">
            <tr><td><span id="statusCurrentTime"></span></td></tr>
            <tr><td><span id="statusLocalTimeDiff"></span></td></tr>
            <tr><td><span id="statusCurrentDay"></span></td></tr>
            <tr><td><span id="statusCurrentMonthAndDate" style="left: 10px; top: 481px"></span></td></tr>
            <tr><td><span id="statusCurrentYear"></span></td></tr>
        </table>
        
        <table cellpadding="0" cellspacing="0" border="0" class="storageInfo">            
            <tr>
                <td>
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td><span class="statusStorageLabel" id="statusAvailableStorageLabel"></span></td>
                            <td><span class="statusFreeSpaceInPercentage" id="statusStorageLeftPercentage"></span></td>
                        </tr>
                    </table>
                </td>                
            </tr>
            <tr>
                <td><span class="statusUsedSpace" id="statusUsedSpace"></span></td>
            </tr>
            <tr id="trRaidStatus" style="display:none;">
                <td>
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td><span class="raidLabel" id="spnRaidLabel"></span></td>
                            <td><span class="raidStatusLabel" id="spnRaidStatusLabel"></span></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <img src="res/Skins/<%= Master.SkinName %>/Common/Progressbar Large.jpg" id="statusAvailableStorageBar" alt=""/>
        
        <span class="recentEventLabel" id="statusNewlyAddedLabel"></span>
        
        <div id= "statusNewlyAdded" class="recentEventFrame" onselectstart='return false;'>
            <table id="statusNewlyAddedTable">
                <tbody id="statusNewlyAddedTableBody"></tbody>
            </table>
         </div>         
    </div>
    <script type="text/javascript" language="javascript" src="Scripts/Status.js"></script>
</asp:Content>
