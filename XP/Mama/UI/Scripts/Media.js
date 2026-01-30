var featureType = "F077E40F-BCA6-4502-94E7-61E3F55D8022";
var trailerType = "CE482168-6B26-4401-A363-7CB43C901350";
var adType = "0A3C0D0C-43BA-4EBD-AE53-7E0393ACD1C1";
var shortType = "1A6FA61B-CA56-497F-8490-A083A6E7779E";
var policyType = "7161954B-22AB-4952-9247-419A628B908F";
var PSAType = "A53D4C44-869B-409E-9775-A3F7F122393A";
var ratingType = "D0042497-4AF4-4202-A2EF-C2C6AFA696C7";
var testType = "3928527D-C741-4198-A960-CD6E2FACAE47";
var transitionalType = "E104E24A-6E77-44F5-9E90-D2E9E437488C";
var teaserType = "70A1BA0B-3641-419E-83AB-91E4A6284B40";
var packingList = "00AD697B-F397-4DD3-A1BA-B6EFA0549581";

var jobEndStatus = new Array("IntegrityFailed",
    "Completed",
    "IntegrityVerificationCancelled",
    "Cancelled",
    "Error");

var selectedTitle = new Array();
var verifyTitles = new Array();
var sortedTitles = new Array();
var entities = new Array();

var titleId = null;
var availableStorageBarWidth = 350;
var progressBarWidth = 145;
var verifyJobID = null;
var isPopupEnabled = false;

var isAscending = true;
var sortBy = "Name";

var headerIds = new Array();

Sys.Application.add_load(PageLoad);

function PageLoad() {
    pi.Show();

    document.getElementById("mediaMenu").className = "MenuFocus";
    var body = document["body"];
    body.style.backgroundImage = "url(res/Skins/" + skin + "/Media/Media.jpg)";

    AddHeaderIds();

    PageMethods.GetMediaPageInfo(OnSuccess, OnFailure);
    UpdateIngestInfo();

    $addHandler(document, "keydown", DeleteIngestedItem);

    Media_SetText();

    $find('maskDateBehavior').set_CultureDatePlaceholder('/');

    UserGroupBasedChanges();

    $find("mpextnd").add_shown(AutoDelete_Init);
    $find("mpextnd").add_hidden(AutoDelete_hidden);
}

function OnSuccess(pageInfo) {
    OnGotStorage(pageInfo.StorageInfo);
    OnGotTitles(pageInfo.Titles, pageInfo.AtmosCpls);
    OnGotPendingList(pageInfo.UnderVerifications);
    OnGotTitlesIntegrityStatus(pageInfo.IntegrityStatusInfo);

    pi.Hide();
}

function OnFailure(errorObj) {
    pi.Hide();
    alert(errorObj.get_message());
}

function Media_SetText() {
    SetTexttoControl("lblstorage", DisplayTextResource.storage + ":");
    SetTexttoControl("headerTitle", DisplayTextResource.headerComposition);
    SetTexttoControl("headerType", DisplayTextResource.headerType);
    SetTexttoControl("headerPicture", DisplayTextResource.headerPicture);
    SetTexttoControl("headerAudio", DisplayTextResource.headerAudio);
    SetTexttoControl("headerRating", DisplayTextResource.headerRating);
    SetTexttoControl("headerAspect", DisplayTextResource.headerAspect);
    SetTexttoControl("headerDuration", DisplayTextResource.headerDuration);
    SetTexttoControl("headerSize", DisplayTextResource.headerSize);
    SetTexttoControl("headerSpace", DisplayTextResource.headerSpace);
    SetTexttoControl("headerVerify", DisplayTextResource.headerVerify);
    SetTexttoControl("headerLastPlay", DisplayTextResource.headerLastPlay);
    SetTexttoControl("headerAutoDelete", DisplayTextResource.headerAutoDelete);

    SetTexttoControl("headerTitle1", DisplayTextResource.headerComposition);
    SetTexttoControl("headerType1", DisplayTextResource.headerType);
    SetTexttoControl("headerPicture1", DisplayTextResource.headerPicture);
    SetTexttoControl("headerAudio1", DisplayTextResource.headerAudio);
    SetTexttoControl("headerRating1", DisplayTextResource.headerRating);
    SetTexttoControl("headerAspect1", DisplayTextResource.headerAspect);
    SetTexttoControl("headerDuration1", DisplayTextResource.headerDuration);
    SetTexttoControl("headerSize1", DisplayTextResource.headerSize);
    SetTexttoControl("headerSpace1", DisplayTextResource.headerSpace);
    SetTexttoControl("headerVerify1", DisplayTextResource.headerVerify);
    SetTexttoControl("headerLastPlay1", DisplayTextResource.headerLastPlay);
    SetTexttoControl("headerAutoDelete1", DisplayTextResource.headerAutoDelete);

    SetTexttoControl("spnAutoDelete", DisplayTextResource.headerType + ":");
    SetTexttoControl("selectDateLbl", DisplayTextResource.Date + ":");
    SetTexttoControl("txtyes1", DisplayTextResource.ok);
    SetTexttoControl("txtyesDisable", DisplayTextResource.ok);
    SetTexttoControl("txtno1", DisplayTextResource.cancel);
    SetTexttoControl("Never", DisplayTextResource.never);
    SetTexttoControl("Allow", DisplayTextResource.allow);
    SetTexttoControl("AfterDate", DisplayTextResource.afterDate);
    SetTexttoControl($find("autoDeleteExtnd").get_element(), DisplayTextResource.never);
    $get("Never").setAttribute("displayText", DisplayTextResource.never);
    $get("Allow").setAttribute("displayText", DisplayTextResource.allow);
    $get("AfterDate").setAttribute("displayText", DisplayTextResource.afterDate);
    $find("autoDeleteExtnd").get_element().setAttribute("displayText", DisplayTextResource.never);
    $find("autoDeleteExtnd").set_clientFunction(HandleDate);
    SetTexttoControl("autoDeleteTitle", DisplayTextResource.autoDeleteTitle);
    SetTexttoControl("spnDelete", DisplayTextResource.deleteTxt);
    SetTexttoControl("btnAutoDelete", DisplayTextResource.autoDelete);
    SetTexttoControl("spnVerify", DisplayTextResource.verify);
    SetTexttoControl("spnVerifyDisabled", DisplayTextResource.verify);
    SetTexttoControl("spnSearch", DisplayTextResource.search);
}

function UserGroupBasedChanges() {
    if (HaveRights()) {
        $get("tdDelete").style.display = '';
        $get("tdAutoDelete").style.display = '';
    }
}

function OnGotStorage(result) {
    if (result == null)
        return;

    var mediaFolderSize;

    if (result.Units == "Bytes")
        mediaFolderSize = result.Total;
    else if (result.Units == "KB")
        mediaFolderSize = result.Total * 1024;
    else if (result.Units == "MB")
        mediaFolderSize = result.Total * 1024 * 1024;
    else if (result.Units == "GB")
        mediaFolderSize = result.Total * 1024 * 1024 * 1024;

    var percentage = Math.round(result.Free * 100 / result.Total);

    if (isNaN(percentage))
        percentage = 0;

    var mediausedspace = result.Free + " / " + result.Total + " " + result.Units + " " + DisplayTextResource.free;
    SetTexttoControl("mediaUsedSpace", mediausedspace);

    var barWidth = (percentage * availableStorageBarWidth) / 100;

    $get("mediaAvailableStorageBar").style.width = barWidth + 'px';

    SetTexttoControl("mediaStorageLeftPercentage", percentage + "% " + DisplayTextResource.free);

}

function OnGotTitles(titles, atmosCpls) {
    if (titles == null || titles.length == 0 ||
        (titles.length == 1 && titles[0].Name == null)) {
        $get('tblmedia').style.display = "none";
        $get('emptyScreen').style.display = '';
        return;
    }

    $get("tblmedia").style.display = 'block';

    sortedTitles = Sort(titles, sortBy, 'asc', 'string');

    Array.forEach(sortedTitles, function(title, index, array, instance) {

        title.IsIngesting = false;
        title.IsVerifying = false;
        title.Progress = 0;
        title.VerificationProgress = 0;
        title.IsCancel = false;
        title.IntegrityStatus = '';
        title.ContentType = GetTitleType(title.Type.toUpperCase());
        title.Size = parseFloat(title.Size);

        CreateTitleRow(title, index, Array.contains(atmosCpls, title.ID));
    }, null)

    ResetColumnsBound();

    $get('emptyScreen').style.display = 'none';
}

function OnGotTitlesIntegrityStatus(result) {
    if (result != null) {
        for (var i = 0; i < result.length; i++) {
            var td = $get("verify" + result[i].TitleId);
            var cancelLink = td == null ? null : td.getElementsByTagName("a");

            if (cancelLink && cancelLink.length == 0) {
                SetTexttoControl(td, eval('DisplayTextResource.integrity' + result[i].Status));
                EnableCheckbox(result[i].TitleId, true);
            }

            var index = GetIndexOf(sortedTitles, result[i].TitleId);
            if (index > -1)
                sortedTitles[index].IntegrityStatus = result[i].Status;
        }
    }
}

function GetTitleType(type) {
    switch (type) {
        case featureType:
            return "feature";
        case trailerType:
            return "trailer";
        case adType:
            return "ad";
        case shortType:
            return "short";
        case policyType:
            return "policy";
        case teaserType:
            return "teaser";
        case testType:
            return "test"
        case transitionalType:
            return "trans";
        case PSAType:
            return "PSA";
        case ratingType:
            return "rating";
        case packingList:
            return "MOP";
        default:
            return "N/A";
    }
}

function OnGotReferredStatus(result) {
    pi.Hide();
    if (result != null && typeof (result) != "string") {
        $get("chkSelectAll").checked = false;
        for (var i = 0; i < result.length; i++)
            Array.remove(selectedTitle, result[i]);

        ReArrangeAlternateColor();
    }

    if (result == null || result.length == 0) {
        ShowPopup(DisplayTextResource.deleteConfirmation, "res/Skins/" + skin + "/Common/Warning.gif",
            DisplayTextResource.titleDeleteMessage,
            "DeleteComposition()");
    }
    else if (typeof (result) == "string") {
        if (result.indexOf(selectedTitle[0]) > -1) {
            ShowPopup(DisplayTextResource.cannotDelete, "res/Skins/" + skin + "/Common/error.gif",
                DisplayTextResource.protectedTitle,
                null);
        }
        else {
            ShowPopup(DisplayTextResource.cannotDelete, "res/Skins/" + skin + "/Common/error.gif",
                DisplayTextResource.titleInUsed + " " +
                (result.length > 20 ? result.substr(0, 20) + "..." : result),
                null);
        }
    }
    else {
        if (selectedTitle.length > 0) {
            ShowPopup(DisplayTextResource.deleteConfirmation, "res/Skins/" + skin + "/Common/Warning.gif",
                DisplayTextResource.someTitleReffered, "DeleteComposition()");
        }
        else {
            ShowPopup(DisplayTextResource.cannotDelete, "res/Skins/" + skin + "/Common/error.gif",
                DisplayTextResource.allTitlesReffered, null);
        }
    }
}

function ShowPopup(title, iconImgPath, text, okScript) {
    isPopupEnabled = true;
    ConfirmationWindow(title, text, iconImgPath, okScript, cancelPopUp);
}

function cancelPopUp() {
    isPopupEnabled = false;
}

function DeleteComposition() {

    if (selectedTitle.length == 0 && entities.length == 0)
        return;

    isPopupEnabled = false;

    pi.Show(DisplayTextResource.deleting + "...");

    if (selectedTitle.length > 0)
        Qube.Mama.Usher.DeleteTitles(selectedTitle, OnDeleted, OnError);
    else if (entities.length > 0)
        PageMethods.DeleteMOPs(entities, OnMOPAssetsDeleted, OnError);
}

function OnDeleted(result) {
    for (i = 0; i < selectedTitle.length; i++) {
        var tr = $get("tr" + selectedTitle[i]);
        if (tr)
            $get('tbmediainfo').removeChild(tr);

        for (var j = 0; j < sortedTitles.length; j++) {
            if (sortedTitles[j].ID == selectedTitle[i]) {
                Array.remove(sortedTitles, sortedTitles[j]);
                break;
            }
        }
    }

    Array.clear(selectedTitle);

    if (entities.length > 0)
        PageMethods.DeleteMOPs(entities, OnMOPAssetsDeleted, OnError);
    else
        setTimeout("_Init()", 0);
}

function AutoDeleteSetup() {
    RemoveEntities();

    if (selectedTitle.length == 0) {
        ShowPopup(DisplayTextResource.emptySelection, "res/Skins/" + skin + "/Common/information.gif",
                    DisplayTextResource.pleaseSelectOneORMoreTitle, null);

        return false;
    }

    $find("mpextnd").show();

    return false;
}

function SetTitleProtect() {
    var validTill = null;
    var isProtect = false;

    if ($find("autoDeleteExtnd").selectedValue() == 2) {
        var dateValue = $find('startDate_BID').get_element().value.trim();
        validTill = Date.parseInvariant(dateValue, "MM/dd/yyyy");
        validTill.setHours(23, 59, 59, 0);
        validTill = validTill.format("MMM/dd/yyyy HH:mm:ss.fff");
    }
    else if ($find("autoDeleteExtnd").selectedValue() == 0)
        isProtect = true;

    Qube.Mama.Catalog.SetTitlesProtect(selectedTitle, isProtect, validTill, OnRequestComplete, OnError);
}

function OnRequestComplete(result) {
    var validTill = null;
    var isProtect = false;

    if ($find("autoDeleteExtnd").selectedValue() == 2)
        validTill = new Date($find('startDate_BID').get_element().value);
    else if ($find("autoDeleteExtnd").selectedValue() == 0)
        isProtect = true;

    for (var i = 0; i <= selectedTitle.length - 1; i++) {
        var index = GetIndexOf(sortedTitles, selectedTitle[i]);
        sortedTitles[i].IsProtect = isProtect;
        sortedTitles[i].ValidTill = validTill;

        var autoDelete = $get("auto" + selectedTitle[i])

        if (autoDelete) {
            SetTexttoControl(autoDelete, isProtect ? DisplayTextResource.never :
                                validTill == null ? DisplayTextResource.allow :
                                                    validTill.format("dd/MM/yyyy"));
        }
    }
}

function HandleDate(e) {
    var isAfterDateSelected = (e.target.getAttribute("value") == 2);
    var dateCtrl = $get("trDate");
    if (isAfterDateSelected) {
        dateCtrl.style.visibility = "visible";
        var dateValue = !$find('startDate_BID').get_element().value.trim();
        EnableOk(!(dateValue == '__/__/____' || dateValue == 'mm/dd/yyyy'));
    }
    else {
        dateCtrl.style.visibility = "hidden";
        EnableOk(true);
    }
}

function EnableOk(value) {
    $get("divyes1").style.display = value ? '' : 'none';
    $get("divyesDisable").style.display = value ? 'none' : '';
}

function VerifyClicked() {
    if (selectedTitle.length == 0) {
        ShowPopup(DisplayTextResource.emptySelection, "res/Skins/" + skin + "/Common/information.gif",
                    DisplayTextResource.pleaseSelectOneORMoreTitle, null);

        return false;
    }

    Qube.Mama.Usher.VerifyTitles(selectedTitle, OnVerificationStarted, OnVerificationError);

    CreateCancelLinks();
    SelectedTitlesMoveToVerifyTitles();

    return false;
}

function CreateCancelLinks() {
    for (var i = 0; i <= selectedTitle.length - 1; i++) {
        var chk = $get("chk" + selectedTitle[i]);
        if (chk)
            chk.disabled = true;

        var index = GetIndexOf(sortedTitles, selectedTitle[i]);
        sortedTitles[index].IsVerifying = true;
        sortedTitles[index].IsCancel = false;

        CreateCancelLink(selectedTitle[i]);
    }
}

function OnVerificationStarted() {
    ClearCursor();
    UpdateIntegrityVerificationStatus();
}

function OnVerificationError(error) {
    UpdateIntegrityVerificationStatus();
    OnError(error);
}

function UpdateIntegrityVerificationStatus() {
    if (verifyTitles.length > 0)
        Qube.Mama.Usher.GetVerificationInfos(verifyTitles, OnGotVerificationInfo, OnErrorDummy);
}

function OnGotVerificationInfo(result) {
    for (var i = 0; i <= result.length - 1; i++) {
        var titleId = result[i].TitleId;

        var index = GetIndexOf(sortedTitles, titleId);
        sortedTitles[index].VerificationProgress = result[i].Progress;

        var imgProgress = $get("img" + titleId);

        if (imgProgress) {
            imgProgress.src = "res/Skins/" + skin + "/Ingest/IntegrityProgress.jpg";

            if (result[i].Progress >= 100)
                imgProgress.style.width = progressBarWidth + "px";
            else
                imgProgress.style.width = (result[i].Progress / 100 * progressBarWidth) + "px";
        }

        if (result[i].Status != null && result[i].Status.trim() != "") {
            Array.remove(verifyTitles, titleId);

            EnableVerify(IsAllowVerify());

            sortedTitles[index].IntegrityStatus = result[i].Status;

            EnableCheckbox(titleId, true);
            RemoveCancelLink(titleId, eval('DisplayTextResource.integrity' + result[i].Status));
        }
    }

    UpdateIntegrityVerificationStatus();
}

function EnableCheckbox(titleId, isEnable) {
    var chkSelectCtrl = $get("chk" + titleId);
    chkSelectCtrl.disabled = !isEnable;
}

function SelectRowActivate(e) {
    if (e.target.tagName == "A")
        return;

    var rowclicked = e.target;

    while (1) {
        if (rowclicked.tagName.toLowerCase() == 'tr')
            break;

        rowclicked = rowclicked.parentNode;
    }

    var isChecked = null;

    if (e.target.type == "checkbox")
        isChecked = !e.target.checked;
    else if (!rowclicked.getElementsByTagName("INPUT")[0].disabled) {
        if (e.ctrlKey)
            isChecked = rowclicked.getElementsByTagName("INPUT")[0].checked;
        else if (e.shiftKey && selectedTitle.length > 0) {
            var firstSelectedItem = GetFirstSelectedVisibleItem();
            Array.clear(selectedTitle);
            Array.clear(entities);

            if (firstSelectedItem != null) {
                Array.add(selectedTitle, firstSelectedItem);

                if ($get("chk" + firstSelectedItem).IsTitle == false)
                    Array.add(entities, firstSelectedItem);

                var firstSelectedRowIndex = $get("tr" + firstSelectedItem).rowIndex;
                var startIndex = 1;
                var endIndex = 1;

                if (firstSelectedRowIndex > rowclicked.rowIndex) {
                    startIndex = rowclicked.rowIndex;
                    endIndex = firstSelectedRowIndex;
                }
                else {
                    startIndex = firstSelectedRowIndex;
                    endIndex = rowclicked.rowIndex;
                }

                var rows = $get("tbmediainfo").rows;

                for (var i = startIndex; i < (endIndex - 1); i++) {
                    Array.add(selectedTitle, rows[i].TitleID);

                    if ($get("chk" + rows[i].TitleID).IsTitle == false)
                        Array.add(entities, rows[i].TitleID);
                }
            }

            isChecked = false;
        }
        else {
            Array.clear(selectedTitle)
            Array.clear(entities);
            isChecked = rowclicked.getElementsByTagName("INPUT")[0].checked;
        }
    }
    else
        return;

    if (isChecked) {
        Array.remove(selectedTitle, rowclicked.TitleID);

        if ($get("chk" + rowclicked.TitleID).IsTitle == false)
            Array.remove(entities, rowclicked.TitleID);
    }
    else {
        Array.add(selectedTitle, rowclicked.TitleID);

        if ($get("chk" + rowclicked.TitleID).IsTitle == false)
            Array.add(entities, rowclicked.TitleID);
    }

    EnableVerify(IsAllowVerify());

    ReArrangeAlternateColor();
}

function EnableVerify(value) {
    $get("IVEnabled").style.display = value ? "" : "none";
    $get("IVDisabled").style.display = value ? "none" : "";
}

function OnGotPendingList(result) {
    if (result == null)
        return;

    for (var i = 0; i < result.length; i++) {
        var currentResult = result[i];
        var sortedTitle = sortedTitles[GetIndexOf(sortedTitles, currentResult)];

        if (sortedTitle != null) {
            sortedTitle.IsVerifying = true;
            sortedTitle.IsCancel = false;

            CreateCancelLink(currentResult);

            var chk = $get("chk" + currentResult);

            if (chk)
                chk.disabled = true;
        }
    }

    Array.addRange(verifyTitles, result);

    EnableVerify(IsAllowVerify());

    UpdateIntegrityVerificationStatus();
}

function CreateCancelLink(titleId) {
    var tr = $get('tr' + titleId);
    if (tr == undefined)
        return;

    var links = tr.getElementsByTagName('a');
    var index = GetIndexOf(sortedTitles, titleId);

    if (links.length > 0 || sortedTitles[index].IsCancel || (!sortedTitles[index].IsVerifying && !sortedTitles[index].IsIngesting))
        return;

    var verifyElement = document.createElement("a");
    verifyElement.href = "javascript:VerifyCancel('" + titleId + "')";
    SetTexttoControl(verifyElement, DisplayTextResource.cancel);
    verifyElement.className = "mediaInfo";
    verifyElement.style.color = "Blue";
    var verifyCol = $get("verify" + titleId);
    SetTexttoControl(verifyCol, "");
    verifyCol.appendChild(verifyElement);
}

function DeleteSelectedTitles() {
    RemoveEntities();

    if (selectedTitle.length > 0) {
        pi.Show(DisplayTextResource.loading + "...");
        if (selectedTitle.length == 1)
            Qube.Mama.Catalog.GetReferredPlayList(selectedTitle[0], OnGotReferredStatus, OnError);
        else
            Qube.Mama.Catalog.GetReferredPlayLists(selectedTitle, OnGotReferredStatus, OnError);
    }
    else if (entities.length == 0) {
        ShowPopup(DisplayTextResource.emptySelection, "res/Skins/" + skin + "/Common/information.gif",
                    DisplayTextResource.pleaseSelectOneORMoreTitle, null);

        return false;
    }
    else
        OnGotReferredStatus(null);

    return false;
}

function OnMOPAssetsDeleted(mops) {

    var errorMessage = "";

    for (var i = 0; i < mops.length; ++i) {
        var mop = mops[i];
        if (mop.IsDeleted) {
            var tr = $get("tr" + mop.Id);
            if (tr)
                $get('tbmediainfo').removeChild(tr);
        }
        else {
            errorMessage += mop.ErrorMessage;
            errorMessage += "\n"
        }
    }

    setTimeout("_Init()", 0);

    if (errorMessage.length > 0)
        ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", errorMessage, null);
}

function _Init() {
    pi.Hide();

    Qube.Mama.Usher.GetStorageInfo(OnGotStorage, OnErrorDummy);

    $get("chkSelectAll").checked = false;

    if ($get('tbmediainfo').rows.length == 0)
        $get('tblmedia').style.display = "none";

    if (sortedTitles.length == 0)
        $get('emptyScreen').style.display = '';
    else
        ReArrangeAlternateColor();
}

function SelectAll(obj) {
    EnableVerify(false);

    Array.clear(selectedTitle);
    Array.clear(entities);

    var chkCollection = $get("tbmediainfo").getElementsByTagName("INPUT");
    var checkedStatus = obj.checked;

    if (obj.checked) {
        for (var i = 0; i < chkCollection.length; i++) {
            if (chkCollection[i].parentNode.parentNode.style.display != "none" && !chkCollection[i].disabled) {
                chkCollection[i].checked = true;

                Array.add(selectedTitle, chkCollection[i].id.substr(3));

                if (chkCollection[i].IsTitle == false)
                    Array.add(entities, chkCollection[i].id.substr(3));
            }
        }
    }
    else {
        for (var i = 0; i < chkCollection.length; i++)
            chkCollection[i].checked = false;
    }

    EnableVerify(IsAllowVerify());

    ReArrangeAlternateColor();

    obj.checked = checkedStatus;
}

function ReArrangeAlternateColor() {
    var alternate = false;
    var rows = $get("tblmedia").rows;

    Array.forEach(rows, function(row, i, array, instance) {
        if (row.TitleID == undefined)
            return;
        if (Array.contains(selectedTitle, row.TitleID) ||
                Array.contains(entities, row.TitleID)) {
            row.className = "mediaSelectedRow";
            $get("chk" + row.TitleID).checked = true;
        }
        else {
            row.className = alternate ? "titleRow rowOdd" : "titleRowBlue rowEven";
            $get("chk" + row.TitleID).checked = false;
        }

        alternate = !alternate;
    }, null);

    $get("chkSelectAll").checked = IsAllChecked();
}

function IsAllChecked() {
    var chkCollection = $get("tblmedia").getElementsByTagName("INPUT");

    return (chkCollection.length == selectedTitle.length && selectedTitle.length > 0);
}

function RemoveEntities() {
    for (var j = 0; j < entities.length; ++j) {
        Array.remove(selectedTitle, entities[j]);
    }
}

function SelectedTitlesMoveToVerifyTitles() {
    Array.addRange(verifyTitles, selectedTitle);

    Array.clear(selectedTitle);
    Array.clear(entities);

    ReArrangeAlternateColor();
}

function VerifyCancel(titleId) {
    var index = GetIndexOf(sortedTitles, titleId);

    var chk = $get("chk" + titleId);

    if (chk && chk.jobId != undefined)
        Qube.Mama.Usher.CancelJob(chk.jobId, CancelJobCompleted, OnError);
    else {
        RemoveCancelLink(titleId, DisplayTextResource.cancelling + "...");
        Qube.Mama.Usher.CancelTitleVerification(titleId, ClearCursor, OnError);
    }
}

function OnClientTextChange(obj) {
    EnableOk(!(obj.value == '__/__/____' || obj.value == 'mm/dd/yyyy'));
}

function AutoDelete_Init(obj) {
    var autoExtnd = $find("autoDeleteExtnd");
    var dateCtrl = $find("startDate_BID").get_element();
    var validTillText = GetControlText($get("auto" + selectedTitle[0]));

    var wrapper = Sys.Extended.UI.TextBoxWrapper.get_Wrapper(dateCtrl);
    wrapper.set_Value("");

    EnableOk(true);

    if (validTillText == DisplayTextResource.never) {
        $get("trDate").style.visibility = "hidden";
        autoExtnd.Select("0");
    }
    else if (validTillText == DisplayTextResource.allow) {
        $get("trDate").style.visibility = "hidden";
        autoExtnd.Select("1");
    }
    else {
        $get("trDate").style.visibility = "visible";
        autoExtnd.Select("2");
        var dt = validTillText.split('/');
        wrapper.set_Value(dt[1] + "/" + dt[0] + "/" + dt[2]);
        EnableOk(validTillText.trim().length != 0);
    }

    autoExtnd._isOver = false;
    autoExtnd._reset = true;
    autoExtnd.hover();

    isPopupEnabled = true;
}

function CreateTitleRow(result, index, isAtmosContent) {
    var mediaInfo = "mediaInfo";
    var tr = $get('tbmediainfo').insertRow(index);
    tr.id = "tr" + result.ID;
    tr.TitleID = result.ID;
    $addHandler(tr, "click", SelectRowActivate);

    if (index % 2)
        tr.className = "titleRow rowOdd";
    else
        tr.className = "titleRowBlue rowEven";

    tr.style.cursor = "default";

    var tdSelect = tr.insertCell(0);
    tdSelect.style.textAlign = 'center';

    var chkSelect = document.createElement("input");
    chkSelect.type = "checkbox";
    chkSelect.id = "chk" + result.ID;
    chkSelect.IsTitle = (result.MediaFormat != null);

    if (result.IsIngesting || result.IsVerifying)
        chkSelect.disabled = true;

    tdSelect.appendChild(chkSelect);
    tr.appendChild(tdSelect);

    var tdEncrypted = tr.insertCell(1);
    tdEncrypted.style.textAlign = 'center';
    if (result.IsEncrypted) {
        var imgEncrypt = document.createElement("img");
        if (result.HasKey)
            imgEncrypt.src = "res/Skins/" + skin + "/Common/lockGreen16X16.jpg";
        else
            imgEncrypt.src = "res/Skins/" + skin + "/Common/lockRed16X16.jpg";
        tdEncrypted.appendChild(imgEncrypt);
    }
    else
        tdEncrypted.innerHTML = "&nbsp;&nbsp;";

    tr.appendChild(tdEncrypted);

    var titleName = tr.insertCell(2);
    titleName.className = "mediaTitleName";

    var imgProgress = CreateProgress(result);

    if (result.IsInplace) {
        titleName.className += " titleInplace";
        mediaInfo = "mediaInfo titleInplace";
    }

    var spanTitleName = document.createElement("span");

    var titleNameWidth = 150;

    var titlename = result.Name;

    spanTitleName.style.width = titleNameWidth + "px";
    spanTitleName.style.whiteSpace = "nowrap";

    var trimedText = GetTrimedText(titlename, titleNameWidth - 32, "mediaTitleName");
    if (trimedText != titlename) {
        trimedText = trimedText + "...";
        titleName.title = titlename;
    }

    SetTexttoControl(spanTitleName, trimedText);

    titleName.appendChild(spanTitleName);
    titleName.appendChild(imgProgress);

    tr.appendChild(titleName);

    var titleType = tr.insertCell(3);
    titleType.className = mediaInfo;
    SetTexttoControl(titleType, GetTitleType(result.Type.toUpperCase()));
    tr.appendChild(titleType);

    var stereoscopic = tr.insertCell(4);
    stereoscopic.className = mediaInfo;

    var pictureFormat = result.IsStereoscopic ? "3D" : "2D";

    if (result.HasSubtitle)
        pictureFormat += ",S";

    pictureFormat += ","

    var pFormat = null;
    var aFormat = null;

    var mediaFormat = result.MediaFormat;

    var picture = mediaFormat != null ? mediaFormat.PictureFormatDescription : null;

    pFormat = picture != null ? picture.toLowerCase() : "other";

    aFormat = mediaFormat != null ? mediaFormat.AudioFormatDescription : null;

    pictureFormat += pFormat == 'undefined' ? "other" : pFormat;

    SetTexttoControl(stereoscopic, pictureFormat);
    tr.appendChild(stereoscopic);

    var classname = mediaInfo;

    if (isAtmosContent) {
        aFormat += ", atmos";
    }

    var audioFormat = tr.insertCell(5);
    audioFormat.className = classname;
    SetTexttoControl(audioFormat, aFormat == null ? "" : aFormat);
    tr.appendChild(audioFormat);

    var ratings = tr.insertCell(6);
    ratings.className = mediaInfo;
    ratings.style.whiteSpace = "normal";

    var ratingValue = result.Ratings;

    if (ratingValue.length > 0)
        ratingValue = ratingValue.substr(0, ratingValue.length - 1);

    SetTexttoControl(ratings, GetFormatText(ratingValue, 80, mediaInfo));
    tr.appendChild(ratings);

    var aspect = tr.insertCell(7);
    aspect.className = mediaInfo;
    SetTexttoControl(aspect, result.Aspect);
    tr.appendChild(aspect);

    var duration = tr.insertCell(8);
    duration.className = mediaInfo;
    SetTexttoControl(duration, result.HMS);
    tr.appendChild(duration);

    var size = tr.insertCell(9);
    size.className = mediaInfo;
    size.style.textAlign = "right";
    var sizeValue = parseFloat(result.Size);
    SetTexttoControl(size, ConvertToUnit(isNaN(sizeValue) ? 0 : sizeValue));
    tr.appendChild(size);

    var space = tr.insertCell(10);
    space.className = mediaInfo;
    space.style.textAlign = "right";
    SetTexttoControl(space, RoundNumber(result.SpaceOccupied, 1) + " %");
    tr.appendChild(space);

    var tdLastPlayed = tr.insertCell(11);
    tdLastPlayed.className = mediaInfo;

    var lastAccessed = result.LastAccessed;
    var lstAccessed = "<" + DisplayTextResource.never + ">";

    if (lastAccessed != null) {
        var today = new Date();
        lstAccessed = ((today - lastAccessed) > (24 * 60 * 60 * 1000)) ?
                                    lastAccessed.format("dd/MM/yy") :
                                    lastAccessed.format("hh:mm:ss tt");
    }

    SetTexttoControl(tdLastPlayed, lstAccessed);
    tr.appendChild(tdLastPlayed);

    var tdAutoDelete = tr.insertCell(12);
    tdAutoDelete.className = mediaInfo;
    tdAutoDelete.id = "auto" + result.ID;

    var validTill = result.ValidTill;
    validTill = validTill == null ? DisplayTextResource.allow : validTill.format("dd/MM/yyyy")

    SetTexttoControl(tdAutoDelete, result.IsProtect ? DisplayTextResource.never : validTill);
    tr.appendChild(tdAutoDelete);

    var verifycol = tr.insertCell(13);
    verifycol.style.textAlign = "center";
    verifycol.id = "verify" + result.ID;

    if (result.IsIngesting || result.IsVerifying) {
        var verifyElement = document.createElement("a");
        verifyElement.href = "javascript:VerifyCancel('" + result.ID + "')";
        SetTexttoControl(verifyElement, DisplayTextResource.cancel);
        verifyElement.className = "mediaInfo";
        verifyElement.style.color = "Blue";
        verifycol.appendChild(verifyElement);
    }
    else if (result.IntegrityStatus != '')
        SetTexttoControl(verifycol, eval('DisplayTextResource.integrity' + result.IntegrityStatus));
    else
        SetTexttoControl(verifycol, DisplayTextResource.integrityUnknown);

    verifycol.className = mediaInfo;
    tr.appendChild(verifycol);

    tr.titleInfo = result;

    return tr;
}

function DeleteIngestedItem(e) {
    if (e.keyCode == Sys.UI.Key.del && !isPopupEnabled && HaveRights() &&
        (e.target.tagName.toLowerCase() != 'input' && selectedTitle != null && selectedTitle.length > 0))
        DeleteSelectedTitles();
}

function AutoDelete_hidden(e) {
    isPopupEnabled = false;
}

function ConvertToUnit(size) {
    var ONE_GB_IN_BYTES = 1073741824;
    var ONE_MB_IN_BYTES = 1048576;
    var ONE_KB_IN_BYTES = 1024;

    if (size >= ONE_GB_IN_BYTES)
        return RoundNumber(size / 1024 / 1024 / 1024, 1) + " GB";
    else if (size >= ONE_MB_IN_BYTES)
        return RoundNumber(size / 1024 / 1024, 1) + " MB";
    else if (size >= ONE_KB_IN_BYTES)
        return RoundNumber(size / 1024, 1) + " KB";
    else
        return size + " Bytes";
}

function ClearCursor(result) {
    pi.Hide();
}

function OnError(result) {
    pi.Hide();
    ShowPopup(DisplayTextResource.Error, "res/Skins/" + skin + "/Common/error.gif", result.get_message(), null);
}

function HeaderClick(headerName, datatype, obj) {
    if (sortedTitles == null || sortedTitles.length <= 1)
        return;

    var orderBy = 'asc';

    if (sortBy == headerName)
        orderBy = isAscending ? 'desc' : 'asc';
    else
        isAscending = false;

    isAscending = !isAscending;

    sortBy = headerName;

    sortedTitles = Sort(sortedTitles, sortBy, orderBy, datatype);

    var filteredTitles = Filter(sortedTitles, $get('txtSearch').value, "Name");

    RearrangeRowsOrder(filteredTitles);
}

function RearrangeRowsOrder(titles) {

    var rows = $get('tbmediainfo').rows;
    var object = $get('tbmediainfo');

    var alternate = false;

    for (var i = titles.length - 1; i >= 0; --i) {
        var currentRow = $get("tr" + titles[i].ID);
        currentRow.style.display = '';
        currentRow.className = alternate ? "titleRow rowOdd" : "titleRowBlue rowEven";
        alternate = !alternate;

        object.insertBefore(currentRow, null);
    }
}

function SearchTitles(txtSearch) {
    if (sortedTitles == null || sortedTitles.length == 0)
        return;

    var filteredTitles = Filter(sortedTitles, txtSearch.value, "Name");

    EnableFilterRows(filteredTitles);
}

function EnableFilterRows(titles) {
    var rows = $get('tbmediainfo').rows;

    for (var i = 0; i < rows.length; ++i) {
        rows[i].style.display = 'none';
    }

    RearrangeRowsOrder(titles);
}

function ResetColumnsBound() {
    var ths = $get('tblmedia').getElementsByTagName('th');

    var offsetHeight = ths[1].offsetHeight;

    for (; ; ) {
        for (var i = 0; i < ths.length; i++) {
            $get(headerIds[i]).style.left = (ths[i].offsetLeft + 10) + 'px';
            $get(headerIds[i]).style.top = (ths[1].offsetTop + 10) + 'px';
            $get(headerIds[i]).style.width = ths[i].offsetWidth + 'px';
            $get(headerIds[i]).style.height = offsetHeight + 'px';
        }

        if ($get(headerIds[0]).offsetHeight != $get(headerIds[1]).offsetHeight)
            offsetHeight = $get(headerIds[0]).offsetHeight > $get(headerIds[1]).offsetHeight ?
                                        $get(headerIds[0]).offsetHeight : $get(headerIds[1]).offsetHeight;
        else
            break;
    }

    $get(headerIds[0]).style.paddingLeft = '0px';
}

function AddHeaderIds() {
    Array.add(headerIds, 'headerSelectTitle');
    Array.add(headerIds, 'headerEncrypt');
    Array.add(headerIds, 'headerTitle');
    Array.add(headerIds, 'headerType');
    Array.add(headerIds, 'headerPicture');
    Array.add(headerIds, 'headerAudio');
    Array.add(headerIds, 'headerRating');
    Array.add(headerIds, 'headerAspect');
    Array.add(headerIds, 'headerDuration');
    Array.add(headerIds, 'headerSize');
    Array.add(headerIds, 'headerSpace');
    Array.add(headerIds, 'headerLastPlay');
    Array.add(headerIds, 'headerAutoDelete');
    Array.add(headerIds, 'thHeaderVerify');
}

function UpdateIngestInfo() {
    Qube.Mama.Usher.GetJobs(OnGotJobs, OnErrorDummy);
}

function OnGotJobs(jobs) {
    if (jobs == null || jobs.length == 0) {
        EnableVerify(IsAllowVerify());
        return;
    }

    jobs = TrimOldJobs(jobs);

    for (var i = 0; i < jobs.length; ++i) {
        var job = jobs[i];
        var index = GetIndexOf(sortedTitles, job.CplId);

        var imgProgress = $get("img" + job.CplId);
        var title = sortedTitles[index];

        if (imgProgress == undefined || title.IsInplace)
            continue;

        if (!Array.contains(jobEndStatus, job.Status)) {
            $get('chk' + job.CplId).disabled = true;
            $get('chk' + job.CplId).jobId = job.ID;

            CreateCancelLink(job.CplId);
        }
        else {
            $get('chk' + job.CplId).jobId = null;

            if (job.Status == "Completed" && (title.IsVerifying || title.IsIngesting)) {
                imgProgress.style.width = progressBarWidth + "px";
                if (imgProgress.src.indexOf('IntegrityProgress') == -1)
                    imgProgress.src = "res/Skins/" + skin + "/Ingest/IntegrityProgress.jpg";
            }

            if (title.IsVerifying || title.IsIngesting) {
                RemoveCancelLink(job.CplId, DisplayTextResource.updating + '...');
                Qube.Mama.Usher.GetVerifiedTitles(OnGotTitlesIntegrityStatus, OnErrorDummy);
                sortedTitles[index].IsIngesting = false;
                sortedTitles[index].IsVerifying = false;
            }
        }

        if (job.Status == "Queued" || job.Status == "Transferring" ||
            job.Status == "Suspended" || job.Status == "TransientError") {
            sortedTitles[index].IsIngesting = true;
            sortedTitles[index].IsVerifying = false;
            sortedTitles[index].Progress = job.Progress;
            sortedTitles[index].VerificationProgress = job.VerificationProgress;

            imgProgress.src = "res/Skins/" + skin + "/Ingest/IngestProgress.jpg";

            if (job.Progress >= 100)
                imgProgress.style.width = progressBarWidth + "px";
            else
                imgProgress.style.width = (job.Progress / 100 * progressBarWidth) + "px";

        }
        else if (job.Status == "VerifyingIntegrity" || job.Status == "IntegrityVerificationSuspended" ||
                    job.Status == "Transferred") {
            if (!Array.contains(verifyTitles, job.CplId)) {
                sortedTitles[index].IsIngesting = false;
                sortedTitles[index].IsVerifying = true;
                sortedTitles[index].Progress = job.Progress;
                sortedTitles[index].VerificationProgress = job.VerificationProgress;

                imgProgress.src = "res/Skins/" + skin + "/Ingest/IntegrityProgress.jpg";

                if (job.VerificationProgress >= 100)
                    imgProgress.style.width = progressBarWidth + "px";
                else
                    imgProgress.style.width = (job.VerificationProgress / 100 * progressBarWidth) + "px";
            }
        }
        else if (job.Status == "Cancelled") {
            Array.removeAt(sortedTitles, index);
            $get('tbmediainfo').removeChild($get("tr" + job.CplId));
            ReArrangeAlternateColor();
        }
        else if (job.Status == "Error")
            $get('chk' + job.CplId).disabled = false;
    }

    EnableVerify(IsAllowVerify());

    setTimeout("UpdateIngestInfo()", 0);
}

function RemoveCancelLink(titleId, displayStatus) {
    var verifyCol = $get("verify" + titleId);

    if (verifyCol) {
        var cancelLink = verifyCol.getElementsByTagName("a");
        if (cancelLink && cancelLink.length > 0)
            verifyCol.removeChild(cancelLink[0]);

        SetTexttoControl(verifyCol, displayStatus);
    }

    var index = GetIndexOf(sortedTitles, titleId);

    if (index > -1) {
        sortedTitles[index].IsIngesting = false;
        sortedTitles[index].IsVerifying = false;
        sortedTitles[index].IsCancel = true;
    }
}

function TrimOldJobs(jobs) {
    var latestJobs = new Array();
    var cplIds = new Array();

    for (var i = (jobs.length - 1); i >= 0; --i) {
        var job = jobs[i];

        if (Array.contains(verifyTitles, job.CplId) ||
            Array.contains(cplIds, job.CplId))
            continue;

        job = GetLatestJobForCPL(jobs, i);
        Array.add(cplIds, job.CplId);
        Array.add(latestJobs, job);
    }

    return latestJobs;
}

function GetLatestJobForCPL(jobs, index) {
    var job = jobs[index];

    for (var i = 0; i < index; i++) {
        if (job.CplId == jobs[i].CplId && !Array.contains(jobEndStatus, jobs[i].Status)) {
            job = jobs[i];
            break;
        }
    }

    return job;
}

function GetIndexOf(titles, titleId) {
    if (titles == null)
        return -1;

    for (var i = 0; i < titles.length; ++i) {
        if (titles[i].ID.toLowerCase() == titleId.toLowerCase())
            return i;
    }

    return -1;
}

function CreateProgress(title) {
    var progressValue = 0;

    var imgProgress = document.createElement("img");
    imgProgress.className = "integrityProgress"
    imgProgress.id = "img" + title.ID;

    if (title.IsVerifying || title.VerificationProgress > 0) {
        progressValue = title.VerificationProgress
        imgProgress.src = "res/Skins/" + skin + "/Ingest/IntegrityProgress.jpg";
    }
    else if (title.IsIngesting) {
        progressValue = title.Progress;
        imgProgress.src = "res/Skins/" + skin + "/Ingest/IngestProgress.jpg";
    }

    if (progressValue > 100)
        imgProgress.style.width = progressBarWidth + "px";
    else
        imgProgress.style.width = (progressValue / 100 * progressBarWidth) + "px";

    return imgProgress;
}

function GetFirstSelectedVisibleItem() {
    for (var i = 0; i < selectedTitle.length; ++i) {
        if ($get("tr" + selectedTitle[i]))
            return selectedTitle[i];
    }

    return null;
}

function CancelJobCompleted(result) {
    Qube.Mama.Usher.GetStorageInfo(OnGotStorage, OnErrorDummy);
}

function IsJobRunning() {
    return ($get("tbmediainfo").getElementsByTagName("a").length > 0);
}

function IsAllowVerify() {
    return (selectedTitle.length == 1 && !IsJobRunning())
}