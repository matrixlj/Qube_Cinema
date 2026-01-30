if(Sys.Extended.UI.PopupBehavior)
{
    //If popup not visible fully the original function handle automatically and make visible (means it take decision to show popup at top/bottom, left/right)
    //But that haven't work as expected. The issue was if window scroll enabled but not scrolled down in this case 
    //the popup should shown up but it shown down
    Sys.Extended.UI.PopupBehavior.prototype._verifyPosition = function(pos, elementWidth, elementHeight, parentBounds){
                                    return pos;
                                }
}

if(Sys.Extended.UI.DropDownBehavior)
{    
    var objDD = Sys.Extended.UI.DropDownBehavior.prototype;
    var DropDownItem = function() { this.ID = null; this.Name = null };

    objDD._init = objDD.initialize;
    objDD.initialize = function()
                       {                            
                            this._dropWrapper$delegates = {
                                click : Function.createDelegate(this, this._dropWrapper_onclick),
                                mouseover : Function.createDelegate(this, this._dropWrapper_onhover),
                                mouseout:Function.createDelegate(this, this._dropWrapper_onunhover),
                                contextmenu : Function.createDelegate(this, this._dropWrapper_oncontextmenu)
                                }
                            this._dropDownControl$delegates = {
                                click : Function.createDelegate(this, this._dropDownControl_onclick),
                                mouseover : Function.createDelegate(this, this._dropDownControl_onhover),
                                mouseout:Function.createDelegate(this, this._dropDownControl_onunhover),
                                contextmenu : Function.createDelegate(this, this._dropDownControl_oncontextmenu)
                                }
                                
                            this._document$delegates = {
                                click : Function.createDelegate(this, this._document_onclick),
                                mouseover : Function.createDelegate(this, this._document_hover),
                                contextmenu : Function.createDelegate(this, this._document_oncontextmenu)                                
                                }
                            
                            this._trim = true;
                            this._trimLength = 40;
                            
                            var text = GetControlText(this.get_element());
                            SetTexttoControl(this.get_element(), '');
                            this._UpdateDisplayText(text);
                            
                            AddTitle(this.get_element()); //AddTitle available in master.js
                            
                            this._init();                            
                            
                            this.get_element().setAttribute('displayText', GetControlText(this.get_element()));
                            this.get_element().setAttribute('value', '');
                            
                            this._selectedItem = this.get_element();
                            this._clientCall = null;
                            
                            this._displayText = text;
                            
                            this._reset = false;        
                            this._isLoading = false;                                                                                    
                            this.elementHover = false;
                            this.dropWrapperHover = false;
                            this._alwaysVisible = false;
                            
                            this.arrayOfOptions = new Array();
                       }
    
    objDD.Loading = function()
                    {
                        SetTexttoControl(this.get_element(), DisplayTextResource.loading + '...'); 
                        this._isLoading = true;
                    }

    objDD.selectedValue = function ()
                          {
                              if(this._selectedItem === null)
                                  return '';
                              else
                                  return this._selectedItem.getAttribute('value');
                          }
                                                                  
    objDD.selectedText = function ()
                         {
                             if(this._selectedItem === null)
                                 return '';
                             else
                                 return this._selectedItem.getAttribute('displayText');
                         }

    objDD._unhover = objDD.unhover;
    objDD.unhover = function (e)
                    {
                        if(!this._alwaysVisible)
                            this._unhover();
                            
                        if(!this._isOpen)
                        {
                            this.get_element().style.color = 'white';
                        }
                    }
                                                            
    objDD._show = objDD.show;
    objDD.show = function Overloading_show() {
        if (this._alwaysVisible || this.hasChildNodes()) {
            this._show();
            var elt = this._dropPopupPopupBehavior.get_element();
            elt.style.left = (this._dropFrameRight.offsetLeft - elt.offsetWidth) + "px";

            if (this._dropPopupPopupBehavior._positioningMode == 3)
                elt.style.top = (this._dropFrameBottom.offsetTop + 2) + "px";

        }
    }
                                                         
    objDD._dropDownControl_onclick = function (e)
                                     {
                                         if (e.target.tagName.toUpperCase() !== 'A') return;
                                         
                                         this._selectedItem = e.target;  
                                         
                                         var text = GetControlText(e.target);
                                         this._UpdateDisplayText(text);
                                        
                                         if(this._clientCall != null)
                                             this._clientCall(e);
                                        
                                        this._isOver = false;
                                        this.hover();
                                        
                                        if(!this.alwaysVisible)     
                                            this.hide();                                                                                
                                    }
                                                                            
    objDD.Generate = function (list, clientFunction, append)
                     {
                        var _displayText = '';
                        var _value = '';

                        this.arrayOfOptions = list;

                        if(clientFunction !== undefined && clientFunction !== null)
                            this._clientCall = clientFunction;
                        
                        if(this._selectedItem == null)
                            this._selectedItem = this.get_element();
                            
                        _displayText = this._selectedItem.getAttribute('displayText');
                        _value = this._selectedItem.getAttribute('value');
                            
                           
                        if((append === undefined) || (!append))
                            this.Clear(this._dropDownControl);
                        
                        if(list != null)
                        {
                            for(var i = 0; i < list.length; i++)
                            {        
                            
                                if(_value == list[i].ID)
                                {
                                    _displayText = this.get_trimText(list[i].Name);
                                }
                            
                                var optionElement = document.createElement("a");
                                optionElement.id = "show" + i;
                                optionElement.setAttribute('value', list[i].ID);	
                                optionElement.tabIndex = this.get_element().tabIndex;
                                optionElement.onselectstart = function(){return false;};
                        	        
                                var Text = list[i].Name;
                                
                                optionElement.setAttribute('displayText', Text);
                                
                                var trimedText = this.get_trimText(Text, "ContextMenuItem");
                        	    	    
                                if(trimedText != Text)
                                {
                                    optionElement.originalText = Text;
                                    AddTitle(optionElement);
                                }
                        	                                    	    
                                SetTexttoControl(optionElement, trimedText);	    
                        	    
                                optionElement.href = "#";
                                optionElement.className = "ContextMenuItem";
                        	    
                                this._dropDownControl.appendChild(optionElement);
                            }    
                        }
                        
                        if(this._dropDownControl.childNodes.length > 10)
                        {
                            this._dropDownControl.style.height = '200px';
                        }
                            
                        this._selectedItem.setAttribute('displayText', _displayText);
                        this._selectedItem.setAttribute('value', _value);
                        
                        SetTexttoControl(this.get_element(), _displayText);
                        this._isLoading = false;
                        
                     }
    
    objDD.hasChildNodes = function ()
                          {
                              return(this._dropDownControl.hasChildNodes() 
                                        && this._dropDownControl.getElementsByTagName('A').length > 0)
                          }
    
    objDD.get_clientFunction = function () 
                               { 
                                   return this._clientCall; 
                               }
    
    objDD.set_clientFunction = function (functionName)
                               {
                                   this._clientCall = functionName
                               }
    
    objDD.set_ellipsetrim = function (value) 
                            { 
                                this._trim = value; 
                            }
                            
    objDD.get_trimText = function(text, classname)
                         {  
                            if(!this._trim)
                                return text;
                            
                            if(!classname)
                                classname = "AjaxDropDown";
                                
                            //GetTrimedText(text, width, classname) available in master.js
                            var offsetWidth = this.get_element().offsetWidth;   
                            
                            var trimedText = GetTrimedText(text , offsetWidth == 0 ? 220 : offsetWidth - 30, classname);
                            if(trimedText != text)
                                trimedText = trimedText + "...";
                            
                            return trimedText;
                         }
                            
    objDD.SelectByIndex = function (index)
                          {
                            if(this._isLoading)
                                return;
                            var item = this.FindItemByIndex(index);                            
                            
                            if(item == null)
                            {
                                this.Select('');
                            }
                            else
                            {
                                this._selectedItem = item;
                                this._UpdateDisplayText(this.selectedText());
                            }
                          }  
                            
    objDD.SelectByText = function (displaytext)
                         {
                            if(this._isLoading) 
                            return;
                            
                            if(displaytext == null || displaytext.trim().length == 0)
                            {
                                this._SelectInit();
                                return;
                            }
                             if(displaytext != null)                       
                             {
                                this._selectedItem = this.FindItemByText(displaytext);                        
                                if(this._selectedItem != null)
                                    this._UpdateDisplayText(this.selectedText());
                                else
                                    this._SelectInit();
                            }
                         }
                                                                    
    objDD.Select = function (value)
                    {
                        if(this._isLoading) 
                            return;
                            
                        if(value == null || value.trim().length == 0)
                        {
                            this._SelectInit();
                            return;
                        }
                         if(value != null)                       
                         {
                            this._selectedItem = this.FindItem(value);                        
                            if(this._selectedItem != null)    
                                this._UpdateDisplayText(this.selectedText());
                            else
                                this._SelectInit();
                        }
                    }
                    
    objDD._SelectInit = function()
                        {
                            this._UpdateDisplayText(this._displayText);
                            this.get_element().setAttribute('value', '');
                            this.get_element().setAttribute('displayText', GetControlText(this.get_element()));
                            this._selectedItem = this.get_element();
                        }
    
    objDD.FindItemByIndex = function (index)
                            {
                                var options = this._dropDownControl.childNodes;
                                
                                if(options.length < index || index < 0)
                                    return null;
                                
                                return options[index];
                            }
                    
    objDD.FindItemByText = function (text)
                           {
                                var options = this._dropDownControl.childNodes;
                                
                                for(var i=0; i<=options.length; i++)
                                {
                                    if(options[i] && options[i].getAttribute && options[i].getAttribute('displayText') == text)
                                    {
                                        return options[i];
                                    }
                                }
                                return null;
                           }      
                    
    objDD.FindItem = function (value)
                     {
                        var options = this._dropDownControl.childNodes;
                        
                        for(var i=0; i<=options.length; i++)
                        {
                            if(options[i] && options[i].getAttribute && options[i].getAttribute('value') == value)
                            {
                                return options[i];
                            }
                        }
                        return null;
                     }

    objDD.Append = function(list) {
                         if (this.arrayOfOptions == null)
                             this.arrayOfOptions = new Array();

                         Array.addRange(this.arrayOfOptions, list)
                         this.sort();
                         this.Generate(this.arrayOfOptions, this._clientCall, false);
                     }
    objDD.UpdateText = function (value, text)
                       {
                            var item = this.FindItem(value);
                            item.setAttribute('displayText', text);
                            if(text.length > this._trimLength)
                                text = text.substr(0, this._trimLength) + "...";
                            SetTexttoControl(item, text);                            
                       }

    objDD.Remove = function(value) {
                           this._dropDownControl.removeChild(this.FindItem(value));
                           var index = this._GetIndex(value);
                           if (index > -1)
                               Array.removeAt(this.arrayOfOptions, index);
                       }

    objDD._hover = objDD.hover;
    objDD.hover = function() 
                  {
                      if (!this._isOver) 
                      {
                            var elt = this.get_element();
                        
                            this._hover();
                            this._isOver = true;

                            this.get_element().style.color = 'black';
                      }
                  }
    
        
    objDD.unhover = function() {}
    
    objDD.HideFrame = function() 
                      {
                        var elt = this.get_element();
                        Sys.UI.DomElement.setVisible(this._dropFrame, false);
                        elt.style.backgroundColor = "transparent";
                     }
                     
    objDD.ShowFrame =  function()
                       {
                            var elt = this.get_element();
                            Sys.UI.DomElement.setVisible(this._dropFrame, true);
                            elt.style.backgroundColor = this._highlightBackgroundColor;
                       } 
        
    objDD._dropWrapper_onhover = function()
                                 {
                                 }
    
    objDD._dropWrapper_onunhover = function()
                                   {
                                   }
    objDD._dropDownControl_onhover = function()
                                    {
                                    }
    
    objDD._dropDownControl_onunhover = function()
                                        {
                                        }
    
    objDD._document_hover = function()
                            {
                            }
                            
    objDD.sort = function()
                 {                     
                     var temp = (this.arrayOfOptions.sort(function(a, b) {
                         var x = a.Name.toLowerCase();
                         var y = b.Name.toLowerCase();

                        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    }));

                    this.arrayOfOptions  = temp;
                 }
                 
    objDD._UpdateDisplayText = function(text)     
                               {                                    
                                    var trimedText = this.get_trimText(text);
                                    SetTexttoControl(this.get_element(), trimedText);                                    
                                    this.get_element().originalText = text;
                                }

    objDD.Clear = function(control) {
                        while (control.hasChildNodes())
                            control.removeChild(control.lastChild);
                    }

    objDD._GetIndex = function(id) {
                        for (var i = 0; i < this.arrayOfOptions.length; ++i) {
                            if (this.arrayOfOptions[i].ID == id)
                                return i;
                        }

                        return -1;
                    }
        

    objDD.activeDispose = objDD.dispose;
    objDD.dispose = function() 
    {
        var elt = this.get_element();
        $removeHandler(elt, "mouseover", ShowTitle);
        $removeHandler(elt, "mouseout", HideTitle);
        $removeHandler(elt, "mousemove", ShowTitle);
        this.arrayOfOptions = null;
        this.activeDispose();
    }
}
