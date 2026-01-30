var pi = null;
var docObject = document.documentElement;

ProgressIndicator = function(){
    this.backgroundElement = null;
    this.processingImage = null;
    this.processingText = null;
    this.processContainer = null;    
    this.isActivate = false;    
    this._saveDisableSelect = new Array();
    this._saveTabIndexes = new Array();
    this._tagWithTabIndex = new Array('A','AREA','BUTTON','INPUT','OBJECT','SELECT','TEXTAREA','IFRAME','DIV','TR','SPAN','LABEL','IMG');
    this.clientBounds = null;
    this.okButton = null;
    this.okButton$delegates = {
            click : Function.createDelegate(this, this.Hide),
            keydown : Function.createDelegate(this, this.Hide)
        }    
}


ProgressIndicator.prototype = {
    InitializeBase: function() {
        var body = document["body"];

        this.clientBounds = CommonToolkitScripts.getClientBounds();

        this.backgroundElement = this.CreateProtection();
        this.processContainer = this.CreateProcessContainer();

        this.AppendElementToParent(body, this.backgroundElement);
        this.AppendElementToParent(body, this.processContainer);

        $addHandlers(this.okButton, this.okButton$delegates);

    },
    CreateProcessContainer: function() {
        var clientWidth = this.clientBounds.width;
        var clientHeight = this.clientBounds.height;

        var pContainer = document.createElement('div');
        pContainer.id = "progressContainer";
        pContainer.style.zIndex = 10001;
        pContainer.style.display = 'none';
        pContainer.style.position = "absolute";
        pContainer.className = "progressContainer";


        this.processingImage = this.CreateProcessingImage();
        this.processingText = this.CreateProcessingText(DisplayTextResource.loading + '...');
        this.okButton = this.CreateOkButton();

        this.AppendElementToParent(pContainer, this.processingImage);
        this.AppendElementToParent(pContainer, this.processingText);
        this.AppendElementToParent(pContainer, this.okButton);

        var offsetWidth = 300;

        var docObject = GetDocumentType();

        pContainer.style.width = offsetWidth + 'px';
        pContainer.style.left = (docObject.scrollLeft + ((clientWidth - offsetWidth) / 2)) + 'px';
        pContainer.style.top = (docObject.scrollTop + ((clientHeight - pContainer.offsetHeight) / 2)) + 'px';
        pContainer.setAttribute('unselectable', 'on');
        pContainer.align = "center";


        return pContainer;
    },

    CreateProtection: function() {
        var _backgroundElement = document.createElement('div');
        _backgroundElement.style.display = 'none';
        _backgroundElement.style.position = 'absolute';
        _backgroundElement.style.left = '0px';
        _backgroundElement.style.top = '0px';
        _backgroundElement.style.zIndex = 10000;
        _backgroundElement.id = "progressIndicator";
        _backgroundElement.className = "progressIndicator";
        _backgroundElement.onselectstart = function() { return false; }

        var clientWidth = this.clientBounds.width;
        var clientHeight = this.clientBounds.height;

        _backgroundElement.style.width = Math.max(Math.max(document.documentElement.scrollWidth, document.body.scrollWidth), clientWidth) + 'px';
        _backgroundElement.style.height = Math.max(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), clientHeight) + 'px';

        return _backgroundElement;
    },

    CreateProcessingImage: function() {
        var img = new Image();
        img.id = "imgProgress";
        img.src = "res/Skins/" + skin + "/Common/ajax-loader.gif";
        img.style.paddingBottom = '10px';

        return img;
    },

    CreateProcessingText: function(text) {
        var displayText = document.createElement('div');
        displayText.className = 'progressIndicatorText';
        displayText.innerHTML = text;
        displayText.style.paddingBottom = '15px';

        return displayText;
    },

    CreateOkButton: function() {
        var okButton = document.createElement('input');
        okButton.type = "image";
        okButton.src = "res/Skins/" + skin + "/Common/Ok Enabled.gif";
        okButton.tabIndex = '-1';
        okButton.style.display = 'none';

        return okButton;
    },

    AppendElementToParent: function(parent, child) {
        parent.appendChild(child);
    },

    ProcessFailed: function(displayText) {
        this.backgroundElement.className = 'progressIndicatorFailed';
        this.processingImage.style.display = 'none';
        this.processingText.innerHTML = displayText;
        this.okButton.style.display = '';
        this.okButton.tabIndex = '1';
        if (document.focus)
            document.focus();
        this.okButton.focus();
    },

    Show: function(displayText) {
        if (!this.isActivate) {
            if (!(displayText == null || displayText == "undefined" || displayText == ''))
                this.processingText.innerHTML = displayText;

            this.backgroundElement.className = 'progressIndicator';
            this.DisableTab();
            this.backgroundElement.style.display = '';
            this.processContainer.style.display = '';
            this.processingImage.style.display = '';
            this.okButton.style.display = 'none';
            this.isActivate = true;
        }
    },

    Hide: function(e) {
        if (this.isActivate) {
            if (e != undefined && e.type != 'click')
                if (e.keyCode != undefined && (e.keyCode != Sys.UI.Key.enter && e.keyCode != Sys.UI.Key.esc && e.keyCode != Sys.UI.Key.space))
                return false;

            this.backgroundElement.style.display = 'none';
            this.processContainer.style.display = 'none';
            this.RestoreTab();
            this.isActivate = false;
            return false;
        }
    },

    DisableTab: function() {
        var tagElements;
        var l = 0;

        if (this._saveTabIndexes.length > 0)
            this.RestoreTab();

        for (var i = 0; i < this._tagWithTabIndex.length; i++) {
            tagElements = document.getElementsByTagName(this._tagWithTabIndex[i])
            for (var j = 0; j < tagElements.length; j++) {
                if (tagElements[j].tabIndex > 0) {
                    this._saveTabIndexes[l] = { tag: tagElements[j], index: tagElements[j].tabIndex };
                    tagElements[j].tabIndex = "-1";
                    l++;
                }
            }
        }

        l = 0;
        if ((Sys.Browser.agent === Sys.Browser.InternetExplorer) && (Sys.Browser.version < 7)) {
            tagElements = document.getElementsByTagName('SELECT');

            for (var k = 0; k < tagElements.length; k++) {
                this._saveDisableSelect[l] = { tag: tagElements[k], disab: tagElements[k].disabled };
                tagElements[k].disabled = true;
                l++;
            }
        }
    },

    RestoreTab: function() {
        for (var i = 0; i < this._saveTabIndexes.length; i++) {
            this._saveTabIndexes[i].tag.tabIndex = this._saveTabIndexes[i].index;
        }
        Array.clear(this._saveTabIndexes);
        if ((Sys.Browser.agent === Sys.Browser.InternetExplorer) && (Sys.Browser.version < 7)) {
            for (var k = 0; k < this._saveDisableSelect.length; k++) {
                this._saveDisableSelect[k].tag.disabled = this._saveDisableSelect[k].disab;
            }
            Array.clear(this._saveDisableSelect);
        }
    },

    Dispose: function() {
        var body = document["body"];
        if (this.okButton) {
            $common.removeHandlers(this.okButton, this.okButton$delegates);
            this.okButton = null;
        }
        body.removeChild(this.backgroundElement);
        body.removeChild(this.processContainer);
        this.backgroundElement = null;
        this.processingImage = null;
        this.processingText = null;
        this.processContainer = null;
        this.isActivate = false;
        this._saveDisableSelect = null;
        this._saveTabIndexes = null;
        this._tagWithTabIndex = null;
        this.clientBounds = null;

    }
}


Sys.Application.add_load(load);
Sys.Application.add_unload(unlaod);

function load()
{
    if(pi == null)
    {
        pi = new ProgressIndicator();
        pi.InitializeBase();
    }
    else
        pi.Hide();
}

function unlaod()
{
    pi.Dispose();
    pi = null;
}
