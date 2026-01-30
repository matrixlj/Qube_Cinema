DayPilotCalendar.Calendar = function(id) {
    var $t = this;
    this.uniqueID = null;
    this.id = id;
    this.selectedEvents = [];
    this.cleanSelection = function() {
        for (var j = 0; j < DayPilotCalendar.selectedCells.length; j++) {
            var $a = DayPilotCalendar.selectedCells[j];
            if ($a) {
                $a.style.backgroundColor = $a.originalColor;
                $a.selected = false;
            }
        }
    };
    this.postBack = function($w) {
        var $x = [];
        for (var i = 1; i < arguments.length; i++) {
            $x.push(arguments[i]);
        };
        __doPostBack($t.uniqueID, $w + DayPilot.ea($x));
    };
    this.callBack = function($w) {
        var $x = [];
        for (var i = 1; i < arguments.length; i++) {
            $x.push(arguments[i]);
        };
        $x.push($t.startDate);
        $x.push($t.days);
        WebForm_DoCallback(this.uniqueID, $w + DayPilot.ea($x), DayPilotCalendar.updateView, this.clientName, this.callbackError, true);
    };
    this.$ = function($y) {
        return document.getElementById(id + "_" + $y);
    };
    this.createShadow = function($n) {
        var $z = $t.$("main");
        var $A = $z.clientWidth / $z.rows[0].cells.length;
        var i = Math.floor(($t.coords.x - 45) / $A);
        var $q = $z.rows[0].cells[i];
        var $i = $n * $t.cellsPerHour * $t.cellHeight / 3600;
        var $B = 1;
        var top = Math.floor((($t.coords.y - $B) + $t.cellHeight / 2) / $t.cellHeight) * $t.cellHeight + $B;
        var $g = document.createElement('div');
        $g.setAttribute('unselectable', 'on');
        $g.style.position = 'absolute';
        $g.style.width = ($q.offsetWidth - 4) + 'px';
        $g.style.height = ($i - 4) + 'px';
        $g.style.left = '0px'; $g.style.top = top + 'px';
        $g.style.border = '2px dotted #666666';
        $g.style.zIndex = 101;
        $q.firstChild.appendChild($g);
        return $g;
    };
    this.eventClickPostBack = function(e) {
        this.postBack('CLK:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay());
    };
    this.eventClickCallBack = function(e) {
        this.callBack('CLK:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay());
    };
    this.eventClick = function(clickEvent) {

        clickEvent = clickEvent || window.event;

        if (clickEvent.button > 0)
            return;

        var e = this.event;
        if (!e.clickingAllowed()) {
            return;
        };
        switch ($t.eventClickHandling) {
            case 'PostBack':
                $t.eventClickPostBack(e);
                break;
            case 'CallBack':
                $t.eventClickCallBack(e);
                break;
            case 'JavaScript':
                $t.eventClickCustom(e);
                break;
            case 'Edit':
                if (!e.isAllDay()) {
                    $t.divEdit(this);
                };
                break;
            case 'Select':
                if (!e.isAllDay()) {
                    $t.eventSelect(e);
                };
                break;
            case 'Bubble':
                if ($t.bubble) {
                    $t.bubble.show(e.value());
                }
        }
    };
    this.rightClickPostBack = function(e) {
        this.postBack('RCK:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay());
    };
    this.rightClickCallBack = function(e) {
        this.callBack('RCK:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay());
    };
    this.rightClick = function() {
        var e = this.event;
        if (!e.rightClickingAllowed()) { return false; };
        switch ($t.rightClickHandling) {
            case 'PostBack':
                $t.rightClickPostBack(e); break;
            case 'CallBack':
                $t.rightClickCallBack(e); break;
            case 'JavaScript':
                $t.rightClickCustom(e); break;
            case 'ContextMenu':
                if (this.data.ContextMenu) {
                    eval(this.data.ContextMenu + ".show(this.event)");
                }
                else {
                    if ($t.contextMenu) {
                        $t.contextMenu.show(this.event);
                    }
                }; break;
        };
        return false;
    };
    this.headerClickPostBack = function(c) {
        this.postBack('HEA:', c.value, c.name, c.date);
    };
    this.headerClickCallBack = function(c) {
        this.callBack('HEA:', c.value, c.name, c.date);
    };
    this.headerClick = function($d) {
        var $C = this.data;
        var c = new DayPilotCalendar.Column($C.Value, $C.Name, $C.Date);
        switch ($t.headerClickHandling) {
            case 'PostBack': $t.headerClickPostBack(c); break;
            case 'CallBack': $t.headerClickCallBack(c); break;
            case 'JavaScript': $t.headerClickCustom(c); break;
        }
    };
    this.eventDeletePostBack = function(e) {
        this.postBack('DEL:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay());
    };
    this.eventDeleteCallBack = function(e) {
        this.callBack('DEL:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay());
    };
    this.eventDelete = function($d) {
        var e = $d.parentNode.parentNode.event;
        switch ($t.eventDeleteHandling) {
            case 'PostBack': $t.eventDeletePostBack(e); break;
            case 'CallBack': $t.eventDeleteCallBack(e); break;
            case 'JavaScript': $t.eventDeleteCustom(e); break;
        }
    };
    this.eventResizePostBack = function(e, $D, $E) {
        if (!$D) throw 'newStart is null';
        if (!$E) throw 'newEnd is null';
        this.postBack('RES:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay(), $D, $E);
    };
    this.eventResizeCallBack = function(e, $D, $E) {
        if (!$D) throw 'newStart is null';
        if (!$E) throw 'newEnd is null'; this.callBack('RES:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay(), $D, $E);
    };
    this.eventResize = function(e, $F, $G, $j) {
        var $B = 1; var $D = new Date(); var $E = new Date();
        var $H = e.start(); var $I = 60 / $t.cellsPerHour; var $J = new Date();
        $J.setTime(Date.UTC($H.getUTCFullYear(), $H.getUTCMonth(), $H.getUTCDate()));
        if ($j === 'top') {
            var $K = Math.floor(($G - $B) / $t.cellHeight); var $L = $K * $I;
            var ts = $L * 60 * 1000; var $M = $t.visibleStart * 60 * 60 * 1000;
            $D.setTime($J.getTime() + ts + $M); $E = e.end();
        } else if ($j === 'bottom') {
            var $K = Math.floor(($G + $F - $B) / $t.cellHeight); var $L = $K * $I;
            var ts = $L * 60 * 1000; var $M = $t.visibleStart * 60 * 60 * 1000; $D = $H;
            $E.setTime($J.getTime() + ts + $M);
        }; switch ($t.eventResizeHandling) {
            case 'PostBack': $t.eventResizePostBack(e, $D, $E); break;
            case 'CallBack': $t.eventResizeCallBack(e, $D, $E); break;
            case 'JavaScript': $t.eventResizeCustom(e, $D, $E); break;
        }
    };
    this.eventMovePostBack = function(e, $D, $E, $k, $l) {
        if (!$D) throw 'newStart is null'; if (!$E) throw 'newEnd is null';
        this.postBack('MOV:', e.value(), e.tag(), e.start(), e.end(), e.text(), $k, e.isAllDay(), $D, $E, $l);
    };
    this.eventMoveCallBack = function(e, $D, $E, $k, $l) {
        if (!$D) throw 'newStart is null';
        if (!$E) throw 'newEnd is null';
        this.callBack('MOV:', e.value(), e.tag(), e.start(), e.end(), e.text(), $k, e.isAllDay(), $D, $E, $l);
    };
    this.eventMove = function(e, $k, $l, $m, $G) {
        var $B = 1;
        var $K = Math.floor(($G - $B) / $t.cellHeight);
        var $I = 60 / $t.cellsPerHour;
        var $N = $K * $I * 60 * 1000;
        var $H = e.start();
        var end = e.end();
        var $J = new Date(); $J.setTime(Date.UTC($H.getUTCFullYear(), $H.getUTCMonth(), $H.getUTCDate()));
        var $O = ($t.useEventBoxes != 'Never') ?
                    $H.getTime() - ($J.getTime() + $H.getUTCHours() * 3600 * 1000 +
                    Math.floor($H.getUTCMinutes() / $I) * $I * 60 * 1000) : 0;
        var length = end.getTime() - $H.getTime();
        var $M = $t.visibleStart * 3600 * 1000;
        var $P = (Date._jsParse) ? Date._jsParse($m) : Date.parse($m);
        var $D = new Date();
        $D.setTime($P + $N + $O + $M);
        var $E = new Date(); $E.setTime($D.getTime() + length);
        switch ($t.eventMoveHandling) {
            case 'PostBack': $t.eventMovePostBack(e, $D, $E, $k, $l); break;
            case 'CallBack': $t.eventMoveCallBack(e, $D, $E, $k, $l); break;
            case 'JavaScript': $t.eventMoveCustom(e, $D, $E, $k, $l, DayPilotCalendar.drag ? true : false);
                break;
        }
    }; this.eventMenuClickPostBack = function(e, $Q) {
        this.postBack('MNU:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay(), $Q);
    };
    this.eventMenuClickCallBack = function(e, $Q) {
        this.callBack('MNU:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay(), $Q);
    };
    this.eventMenuClick = function($Q, e, $R) {
        switch ($R) {
            case 'PostBack': $t.eventMenuClickPostBack(e, $Q);
                break; case 'CallBack': $t.eventMenuClickCallBack(e, $Q); break;
        }
    };
    this.timeRangeMenuClickPostBack = function(e, $Q) {
        this.postBack('TRM:', e.start, e.end, e.resource, $Q);
    };
    this.timeRangeMenuClickCallBack = function(e, $Q) {
        this.callBack('TRM:', e.start, e.end, e.resource, $Q);
    };
    this.timeRangeMenuClick = function($Q, e, $R) {
        switch ($R) {
            case 'PostBack': $t.timeRangeMenuClickPostBack(e, $Q); break;
            case 'CallBack': $t.timeRangeMenuClickCallBack(e, $Q); break;
        }
    };
    this.timeRangeSelectedPostBack = function($H, end, $q) {
        this.postBack('FRE:', $H, end, $q);
    };
    this.timeRangeSelectedCallBack = function($H, end, $q) { this.callBack('FRE:', $H, end, $q); };
    this.timeRangeSelected = function($H, end, $q) {
        switch ($t.timeRangeSelectedHandling) {
            case 'PostBack': $t.timeRangeSelectedPostBack($H, end, $q); break;
            case 'CallBack': $t.timeRangeSelectedCallBack($H, end, $q); break;
            case 'JavaScript': $t.timeRangeSelectedCustom($H, end, $q); break;
        }
    };
    this.eventEditPostBack = function(e, $S) {
        this.postBack('EDT:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay(), $S);
    };
    this.eventEditCallBack = function(e, $S) {
        this.callBack('EDT:', e.value(), e.tag(), e.start(), e.end(), e.text(), e.column(), e.isAllDay(), $S);
    };
    this.eventEdit = function(e, $S) {
        switch ($t.eventEditHandling) {
            case 'PostBack': $t.eventEditPostBack(e, $S); break;
            case 'CallBack': $t.eventEditCallBack(e, $S); break;
            case 'JavaScript': $t.eventEditCustom(e, $S); break;
        }
    };
    this.eventSelectPostBack = function(e) { this.postBack('SEL:', ''); };
    this.eventSelectCallBack = function(e) { this.callBack('SEL:', ''); };
    this.eventSelectAction = function() {
        var e = this.selectedEvent();
        switch ($t.eventSelectHandling) {
            case 'PostBack': $t.eventSelectPostBack(e);
                break;
            case 'CallBack': __theFormPostData = ""; __theFormPostCollection = [];
                WebForm_InitCallback(); $t.eventSelectCallBack(e); break;
            case 'JavaScript': $t.eventSelectCustom(e); break;
        }
    };
    this.refreshCallBack = function($P, $T, $C) {
        var $U; if (!$T) { $T = this.days; }; if (!$P) { $U = this.startDate; }
        else if ($P.getFullYear) { $U = $P; } else {
            var $V = parseInt($P);
            if (isNaN($V)) { throw "You must pass null, Date or number as the first parameter to Calendar.refreshCallBack()."; }
            else { var $U = new Date(); $U.setTime(this.startDate.getTime() + $V * 24 * 3600 * 1000); }
        };
        this.callBack('REF:', $U, $T, $C);
    };
    this.mousedown = function(ev) {
        if (DayPilotCalendar.selecting) { return; };

        if (DayPilotCalendar.editing) {
            DayPilotCalendar.editing.blur();
            return;
        };
        if (!$t.AllowSelecting) { return; };
        var $W = (window.event) ? window.event.button : ev.which;
        if ($W !== 1 && $W !== 0) { return; };
        DayPilotCalendar.firstMousePos = DayPilot.mc(ev || window.event);
        DayPilotCalendar.selecting = true;
        if (DayPilotCalendar.selectedCells) {
            $t.cleanSelection();
            DayPilotCalendar.selectedCells = [];
        };
        DayPilotCalendar.column = DayPilotCalendar.getColumn(this);
        DayPilotCalendar.selectedCells.push(this);
        DayPilotCalendar.firstSelected = this;
        DayPilotCalendar.topSelectedCell = this;
        DayPilotCalendar.bottomSelectedCell = this;
        $t.activateSelection();
    };
    this.activateSelection = function() {
        var $X = this.getSelection();
        for (var j = 0; j < DayPilotCalendar.selectedCells.length; j++) {
            var $a = DayPilotCalendar.selectedCells[j];
            if ($a) {
                $a.style.backgroundColor = $t.selectedColor;
                $a.selected = true;
            }
        }
    };
    this.mousemove = function(ev) {
        if (typeof (DayPilotCalendar) === 'undefined') { return; };
        if (!DayPilotCalendar.selecting) { return; };
        var $f = DayPilot.mc(ev || window.event);
        var $Y = DayPilotCalendar.getColumn(this);
        if ($Y !== DayPilotCalendar.column) { return; };
        $t.cleanSelection();
        if ($f.y < DayPilotCalendar.firstMousePos.y) {
            DayPilotCalendar.selectedCells = DayPilotCalendar.getCellsBelow(this);
            DayPilotCalendar.topSelectedCell = DayPilotCalendar.selectedCells[0];
            DayPilotCalendar.bottomSelectedCell = DayPilotCalendar.firstSelected;
        }
        else {
            DayPilotCalendar.selectedCells = DayPilotCalendar.getCellsAbove(this);
            DayPilotCalendar.topSelectedCell = DayPilotCalendar.firstSelected;
            DayPilotCalendar.bottomSelectedCell = DayPilotCalendar.selectedCells[0];
        };
        $t.activateSelection();
    };
    this.getSelection = function() {
        var $q = DayPilotCalendar.getColumn(DayPilotCalendar.topSelectedCell);
        var $Z = DayPilot.$($t.id + '_main');
        var $J = new Date($Z.rows[0].cells[$q].getAttribute("dpColumnDate")).getTime();
        var $00 = $Z.rows[0].cells[$q].getAttribute("dpColumn");
        var $H = new Date(); $H.setTime($J + DayPilotCalendar.topSelectedCell.start);
        var end = new Date(); end.setTime($J + DayPilotCalendar.bottomSelectedCell.end);
        return new DayPilot.Selection($H, end, $00, $t);
    };
    this.mouseup = function(ev) {

        if (DayPilotCalendar.selecting && DayPilotCalendar.topSelectedCell !== null) {
            $t.divDeselectAll();
            DayPilotCalendar.selecting = false;
            var $01 = $t.getSelection();
            $t.timeRangeSelected($01.start, $01.end, $01.resource);
            if ($t.timeRangeSelectedHandling != "Hold" && $t.timeRangeSelectedHandling != "HoldForever") {
                $t.cleanSelection();
            }
        }
        else {
            DayPilotCalendar.selecting = false;
        }
    };
    this.scroll = function(ev) {
        if (!$t.initScrollPos) return;
        $t.scrollPos = $t.$('scroll').scrollTop;
        $t.scrollHeight = $t.$('scroll').clientHeight;
        $t.$('scrollpos').value = $t.scrollPos;
        $t.updateScrollIndicators();
    };
    this.updateScrollIndicators = function() {
        var up = $t.$("up");
        var $02 = $t.$("down");
        if (up && $02) {
            if ($t.minEnd <= $t.scrollPos) {
                up.style.display = '';
            }
            else {
                up.style.display = 'none';
            };
            if ($t.maxStart >= $t.scrollPos + $t.scrollHeight) {
                $02.style.display = '';
            }
            else {
                $02.style.display = 'none';
            }
        }
    };
    this.createEdit = function($d) {
        var $e = $d.parentNode;
        while ($e && $e.tagName !== "TD") { $e = $e.parentNode; };
        var $03 = document.createElement('textarea');
        $03.style.position = 'absolute';
        $03.style.width = ($d.parentNode.offsetWidth - 2) + 'px';
        $03.style.height = ($d.offsetHeight - 2) + 'px';
        $03.style.fontFamily = DayPilot.gs($d, 'fontFamily') + DayPilot.gs($d, 'font-family');
        $03.style.fontSize = DayPilot.gs($d, 'fontSize') + DayPilot.gs($d, 'font-size');
        $03.style.left = '0px';
        $03.style.top = $d.offsetTop + 'px';
        $03.style.border = '1px solid black';
        $03.style.padding = '0px';
        $03.style.marginTop = '0px';
        $03.style.backgroundColor = 'white';
        $03.value = DayPilot.tr($d.event.text());
        $03.event = $d.event; $e.firstChild.appendChild($03);
        return $03;
    };
    this.divDeselect = function($04) {
        $04.parentNode.removeChild($04.top);
        $04.parentNode.removeChild($04.bottom);
    };
    this.divDeselectAll = function() {
        var a = $t.selectedEvents;
        while (a.length > 0) { var e = a.pop(); $t.divDeselect(e); }
    };
    this.divSelectOne = function($04) {
        var w = 5; $04.b = 1;
        $t.selectedEvents.push($04);
        var top = document.createElement("div");
        top.unselectable = 'on';
        top.style.position = 'absolute';
        top.style.left = $04.offsetLeft + 'px';
        top.style.width = $04.offsetWidth + 'px';
        top.style.top = ($04.offsetTop - w) + 'px';
        top.style.height = w + 'px';
        top.style.backgroundColor = $t.eventSelectColor;
        top.style.zIndex = 100; $04.parentNode.appendChild(top);
        $04.top = top;
        var $05 = document.createElement("div");
        $05.unselectable = 'on';
        $05.style.position = 'absolute';
        $05.style.left = $04.offsetLeft + 'px';
        $05.style.width = $04.offsetWidth + 'px';
        $05.style.top = ($04.offsetTop + $04.offsetHeight) + 'px';
        $05.style.height = w + 'px';
        $05.style.backgroundColor = $t.eventSelectColor;
        $05.style.zIndex = 100;
        $04.parentNode.appendChild($05);
        $04.bottom = $05;
    };
    this.cleanEventSelection = function() {
        $t.divDeselectAll();
        var hs = DayPilot.$($t.id + "_select");
        hs.value = null;
    };
    this.eventSelect = function(e) {
        var a = $t.selectedEvents;
        var hs = DayPilot.$($t.id + "_select");
        var s = true;
        if (a.length > 0 && a[0] === e.div) { s = false; };
        $t.divDeselectAll();
        if (s) {
            if ($t.eventSelectHandling === "JavaScript") {
                $t.divSelectOne(e.div);
            };
            hs.value = e.div.event.value();
        }
        else {
            hs.value = null;
        };
        $t.eventSelectAction();
    };
    this.selectedEvent = function() {
        var a = $t.selectedEvents;
        if (a.length <= 0) { return null; };
        if (a.length === 1) { return a[0].event; };
        return null;
    };
    this.divEdit = function($d) {
        if (DayPilotCalendar.editing) { DayPilotCalendar.editing.blur(); return; };
        var $03 = this.createEdit($d);
        DayPilotCalendar.editing = $03;
        $03.onblur = function() {
            var id = $d.event.value();
            var $06 = $d.event.tag();
            var $07 = $d.event.text();
            var $S = $03.value;
            DayPilotCalendar.editing = null;
            $03.parentNode.removeChild($03);
            if ($07 === $S) { return; };
            $d.style.display = 'none';
            $t.eventEdit($d.event, $S);
        };
        $03.onkeypress = function(e) {
            var $08 = (window.event) ? event.keyCode : e.keyCode;
            if ($08 === 13) { this.onblur(); return false; }
            else if ($08 === 27) {
                $03.parentNode.removeChild($03);
                DayPilotCalendar.editing = false;
            };
            return true;
        };
        $03.select();
        $03.focus();
    };
    this.drawEventsAllDay = function() {
        if (!this.showAllDayEvents) { return; };
        var $09 = this.$("header");
        $09.style.display = 'none'
        if (this.totalHeader) {
            var $0a = this.$("left");
            if ($0a) {
                $0a.style.height = this.totalHeader + "px";
            };
            var $0b = this.$("right");
            if ($0b) {
                $0b.style.height = this.totalHeader + "px";
            }
        };
        if (this.scrollUpTop && this.scrollDownTop) {
            var up = this.$("up");
            if (up) {
                up.style.top = this.scrollUpTop + "px";
            };
            var $02 = this.$("down");
            if ($02) {
                $02.style.top = this.scrollDownTop + "px";
            }
        };
        var l = $09.rows[1].cells.length;
        for (var i = 0; i < l; i++) {
            $09.rows[1].cells[i].firstChild.firstChild.innerHTML = '';
            $09.rows[1].cells[i].firstChild.style.height = this.allDayHeaderHeight + "px";
        };
        var l = this.eventsAllDay.length;
        for (var i = 0; i < l; i++) {
            var $C = this.eventsAllDay[i];
            var $0c = document.createElement("div");
            $0c.data = $C;
            $0c.unselectable = 'on';
            $0c.style.backgroundColor = this.eventBorderColor;
            $0c.style.height = this.allDayEventHeight + 'px';
            $0c.style.marginBottom = '2px';
            $0c.style.position = 'relative';
            $0c.style.textAlign = 'left';
            if ($C.ClickEnabled) {
                $0c.onclick = this.eventClick;
            };
            $0c.oncontextmenu = this.rightClick;

            if (this.bubble) {
                $0c.onmouseout = function() {
                    $t.bubble.hideOnMouseOut();
                };
            };
            var $0d = [];
            $0d.push("<div unselectable='on' style='position:absolute;text-align:left;height:1px;font-size:1px;width:100%'><div unselectable='on' style='margin-top:2px;margin-left:4px;font-size:8pt;color:gray'>");
            $0d.push($C.LeftInnerHTML);
            $0d.push("</div></div>");
            $0d.push("<div unselectable='on' style='position:absolute;text-align:right;height:1px;font-size:1px;width:100%'><div unselectable='on' style='margin-top:2px;margin-right:4px;font-size:8pt;color:gray'>"); $0d.push($C.RightInnerHTML); $0d.push("</div></div>");
            $0d.push("<div style='height:1px;line-height:1px;font-size:0px; width:1px;'><!-- --></div>");
            $0d.push("<div style='margin-top:0px;height:");
            $0d.push(this.allDayEventHeight - 2);
            $0d.push("px;background-color:");
            $0d.push($C.BackgroundColor);
            $0d.push(";border-left:1px solid ");
            $0d.push(this.eventBorderColor);
            $0d.push(";border-right:1px solid ");
            $0d.push(this.eventBorderColor);
            $0d.push(";overflow:hidden;text-align:center;font-size:");
            $0d.push(this.eventFontSize);
            $0d.push(";color:");
            $0d.push(this.eventFontColor);
            $0d.push(";font-family:");
            $0d.push(this.eventFontFamily);
            $0d.push("' unselectable=on'>");
            $0d.push($C.InnerHTML);
            $0d.push("</div></div>");
            $0c.innerHTML = $0d.join('');
            new DayPilotCalendar.Event($0c, $t);
            $09.rows[1].cells[$C.DayIndex].firstChild.firstChild.appendChild($0c);
        };
        $09.style.display = '';
    };
    this.drawEvents = function() {
        var $z = this.$('main');
        this.selectedEvents = [];
        var l = $z.rows[0].cells.length;
        for (var i = 0; i < l; i++) { $z.rows[0].cells[i].firstChild.innerHTML = ''; };
        var l = this.events.length;
        for (var i = 0; i < l; i++) {
            var $C = this.events[i];
            var $0c = document.createElement("div");
            $0c.data = this.events[i];
            $0c.unselectable = 'on';
            $0c.style.MozUserSelect = 'none';
            $0c.style.KhtmlUserSelect = 'none';
            $0c.style.position = 'absolute';
            $0c.style.fontFamily = this.eventFontFamily;
            $0c.style.fontSize = this.eventFontSize;
            $0c.style.color = this.eventFontColor;
            $0c.style.left = $C.Left + '%';
            $0c.style.top = $C.Top + 'px';
            $0c.style.width = $C.Width + '%';
            $0c.style.height = $C.Height + 'px';
            $0c.style.backgroundColor = this.eventBorderColor;
            $0c.style.overflow = 'hidden';
            if ($C.ClickEnabled) { $0c.onclick = this.eventClick; };
            $0c.oncontextmenu = this.rightClick;

            if (this.bubble) {
                $0c.onmouseout = function() { $t.bubble.hideOnMouseOut(); };
            };
            var $0d = [];
            if (this.eventDeleteHandling != 'Disabled' && $C.DeleteEnabled) {
                $0d.push("<div unselectable='on' style='position:absolute; width:100%;text-align:right;'><img src='");
                $0d.push(this.deleteUrl);
                $0d.push("' width='10' height='10' style='margin-right:2px; margin-top: 2px; cursor:pointer;' onmousemove=\"if(typeof(DayPilotBubble)!='undefined'&&");
                $0d.push(this.clientName);
                $0d.push(".bubble) { DayPilotBubble.hideActive(); event.cancelBubble = true; };\" onmousedown=\"this.parentNode.parentNode.style.cursor='default';\" onclick='");
                $0d.push(this.clientName);
                $0d.push(".eventDelete(this); event.cancelBubble = true; if (event.stopPropagation) event.stopPropagation();' /></div>");
            };
            $0d.push("<div style='height:1px;line-height:1px;font-size:0px; width:1px;'><!-- --></div>");
            $0d.push("<div");
            if (this.showToolTip) {
                $0d.push(" title='");
                $0d.push($C.ToolTip);
                $0d.push("'");
            };
            $0d.push(" class='");
            $0d.push(this.cssClass);
            $0d.push(" event'");
            $0d.push(" style='margin-top:0px;height:");
            $0d.push($C.Height - 2);
            $0d.push("px;background-color:");
            $0d.push($C.BackgroundColor);
            $0d.push(";border-left:1px solid ");
            $0d.push(this.eventBorderColor);
            $0d.push(";border-right:1px solid ");
            $0d.push(this.eventBorderColor);
            $0d.push(";overflow:hidden' unselectable='on'>");
            if (this.durationBarVisible) {
                $0d.push("<div style='position:absolute;left:0px;width:5px;height:");
                $0d.push($C.BarLength);
                $0d.push("px;top:");
                $0d.push($C.BarStart + 1);
                $0d.push("px;background-color:");
                $0d.push($C.BarColor);
                $0d.push(";font-size:1px' unselectable='on'></div><div style='position:absolute;left:5px;top:1px;width:1px;background-color:");
                $0d.push(this.eventBorderColor);
                $0d.push(";height:100%' unselectable='on'></div>");
            };
            if (this.durationBarVisible) {
                $0d.push("<div unselectable='on' style='overflow:hidden;padding-left:8px;'>");
            }
            else {
                $0d.push("<div unselectable='on' style='overflow:hidden;padding-left:2px;'>");
            };
            $0d.push($C.InnerHTML);
            $0d.push("</div></div></div>");
            $0c.innerHTML = $0d.join('');
            var $0e = $z.rows[0].cells[$C.DayIndex].firstChild;
            $0e.appendChild($0c);
            var e = new DayPilotCalendar.Event($0c, $t);
            if ($t.afterEventRender) { $t.afterEventRender(e, $0c); }
        }
    };
    this.drawTable = function() {
        var $Z = this.$('main');
        var $K = $t.stepMs;
        var $H = $t.startMs;
        var end = $t.endMs; DayPilotCalendar.selectedCells = [];
        var cl = $t.columns.length;
        var $0f = [];
        var $0g = [];
        var $0h = $t.columns.length != $Z.rows[0].cells.length;
        while ($Z.rows.length > 0 && $0h) { $Z.deleteRow(0); };
        var r = ($0h) ? $Z.insertRow(-1) : $Z.rows[0];
        if ($0h) {
            r.style.backgroundColor = 'white';
            r.id = this.id + "_events";
        };
        for (var j = 0; j < cl; j++) {
            var c = ($0h) ? r.insertCell(-1) : r.cells[j];
            if ($0h) {
                c.style.height = '1px';
                c.style.textAlign = 'left';
                //c.width = $t.columns[j].Width + "%";
                var $0c = document.createElement("div");
                $0c.style.display = 'block';
                $0c.style.marginRight = $t.columnMarginRight + "px";
                $0c.style.position = 'relative';
                $0c.style.height = '1px';
                $0c.style.fontSize = '1px';
                $0c.style.lineHeight = '1.2';
                $0c.style.marginTop = '-1px'; c.appendChild($0c);
            };
            c.setAttribute("dpColumnDate", $t.columns[j].Date);
            c.setAttribute("dpColumn", $t.columns[j].Value);
        };
        for (var i = $H; i < end; i += $K) {
            var $0i = (i - $H) / $K;
            var r = ($0h) ? $Z.insertRow(-1) : $Z.rows[$0i + 1];
            if ($0h) { r.style.MozUserSelect = 'none'; r.style.KhtmlUserSelect = 'none'; };
            for (var j = 0; j < cl; j++) {
                var c = ($0h) ? r.insertCell(-1) : r.cells[j];
                if ($0h) {
                    c.style.verticalAlign = 'bottom';
                    c.start = i;
                    c.end = i + $K;
                    c.root = this;
                    c.onmousedown = this.mousedown;
                    c.onmousemove = this.mousemove;
                    c.onmouseup = function() { return false; };
                    c.onclick = function() { return false; };
                    c.oncontextmenu = function() {
                        if (!this.selected && ($t.timeRangeSelectedHandling == 'Hold' || $t.timeRangeSelectedHandling == 'HoldForever')) {
                            if (DayPilotCalendar.selectedCells) {
                                $t.cleanSelection();
                                DayPilotCalendar.selectedCells = [];
                            };
                            DayPilotCalendar.column = DayPilotCalendar.getColumn(this);
                            DayPilotCalendar.selectedCells.push(this);
                            DayPilotCalendar.firstSelected = this;
                            DayPilotCalendar.topSelectedCell = this;
                            DayPilotCalendar.bottomSelectedCell = this;
                            $t.activateSelection();
                        };
                        if ($t.contextMenuSelection) {
                            $t.contextMenuSelection.show($t.getSelection());
                        };
                        return false;
                    };
                    c.style.fontSize = '1px';
                    if (j !== cl - 1) c.style.borderRight = '1px solid ' + $t.borderColor;
                    c.style.height = $t.cellHeight + 'px';
                    c.unselectable = 'on';
                    var $0c = document.createElement("div");
                    $0c.unselectable = 'on';
                    $0c.style.width = '100%';
                    $0c.style.fontSize = '1px';
                    $0c.style.height = '1px';
                    var $0j = ((i + $K) % 3600000 > 0);
                    if ($0j) {
                        if ($t.hourHalfBorderColor != '') {
                            $0c.style.borderBottom = '1px solid ' + $t.hourHalfBorderColor;
                        };
                        $0c.className = $t.cssClass + " hourhalfcellborder";
                    }
                    else {
                        if ($t.hourBorderColor != '') {
                            $0c.style.borderBottom = '1px solid ' + $t.hourBorderColor;
                        };
                        $0c.className = $t.cssClass + " hourcellborder";
                    };
                    c.appendChild($0c);
                };
                c.originalColor = $t.colors[$0i][j];
                c.className = $t.cssClass + " cellbackground"; c.style.backgroundColor = c.originalColor;
            }
        };
        $Z.onmouseup = this.mouseup; $Z.root = this; var scroll = $t.$("scroll");
        $Z.onmousemove = function(ev) {
            DayPilotCalendar.activeCalendar = this;
            var $0k = $t.$("scroll"); $t.coords = DayPilot.mo2($0k, ev); ev = ev || window.event;
            var $f = DayPilot.mc(ev); if (DayPilotCalendar.resizing) {
                var $0l = DayPilotCalendar.resizing.event.root.cellHeight; var $B = 1;
                var $0m = ($f.y - DayPilotCalendar.originalMouse.y);
                if (DayPilotCalendar.resizing.dpBorder === 'bottom') {
                    var $0n = Math.floor(((DayPilotCalendar.originalHeight + DayPilotCalendar.originalTop + $0m) + $0l / 2) / $0l) * $0l - DayPilotCalendar.originalTop + $B;
                    if ($0n < $0l) $0n = $0l;
                    var $0o = DayPilot.$(DayPilotCalendar.resizing.event.root.id + "_main").clientHeight;
                    if (DayPilotCalendar.originalTop + $0n > $0o) $0n = $0o - DayPilotCalendar.originalTop;
                    DayPilotCalendar.resizingShadow.style.height = ($0n - 4) + 'px';
                }
                else if (DayPilotCalendar.resizing.dpBorder === 'top') {
                    var $0p = Math.floor(((DayPilotCalendar.originalTop + $0m - $B) + $0l / 2) / $0l) * $0l + $B;
                    if ($0p < $B) { $0p = $B; };
                    var $0n = DayPilotCalendar.originalHeight - ($0p - DayPilotCalendar.originalTop);
                    if ($0n < $0l) { $0n = $0l; } else { DayPilotCalendar.resizingShadow.style.top = $0p + 'px'; };
                    DayPilotCalendar.resizingShadow.style.height = ($0n - 4) + 'px';
                }
            }
            else if (DayPilotCalendar.moving) {
                if (!$t.coords) { return; };
                var $0l = $t.cellHeight;
                var $B = 1;
                var $V = DayPilotCalendar.moveOffsetY;

                if (!$V) { $V = $0l / 2; };
                var $0p = Math.floor((($t.coords.y - $V - $B) + $0l / 2) / $0l) * $0l + $B;

                if ($0p < $B) { $0p = $B; };
                var $z = $t.$("main");
                var $0o = $z.clientHeight;

                if ($0p + DayPilotCalendar.moving.clientHeight > $0o) {
                    alert('s');
                    $0p = $0o - DayPilotCalendar.moving.clientHeight;
                };

                DayPilotCalendar.movingShadow.style.top = $0p + 'px';

                var $A = $z.clientWidth / $z.rows[0].cells.length;
                var $q = Math.floor(($t.coords.x - 45) / $A);

                if ($q < $z.rows[0].cells.length && $q >= 0) {
                    DayPilotCalendar.moveShadow($z.rows[0].cells[$q]);
                }
            };

            if (DayPilotCalendar.drag) {
                if (DayPilotCalendar.gShadow) { document.body.removeChild(DayPilotCalendar.gShadow); };
                DayPilotCalendar.gShadow = null; if (!DayPilotCalendar.movingShadow && $t.coords) {
                    DayPilotCalendar.movingShadow = $t.createShadow(DayPilotCalendar.drag.duration);
                    DayPilotCalendar.moving = {};
                    DayPilotCalendar.moving.event = new DayPilot.Event(DayPilotCalendar.drag.id, DayPilotCalendar.drag.duration, DayPilotCalendar.drag.text);
                    DayPilotCalendar.moving.event.root = $t;
                }; ev.cancelBubble = true;
            }
        };
        var $0d = DayPilot.$(this.id + '_scroll').firstChild; var $0q = $0d;
        while ($0q.tagName !== "TABLE") $0q = $0q.nextSibling; $0q.style.display = '';
        $0q = $0d; while ($0q.tagName !== "DIV") $0q = $0q.nextSibling; $0q.style.display = 'none';
    };
    this.drawHeader = function() {
        if (!this.showHeader) { return; };
        var $09 = this.$("header"); var $0h = true;
        if ($09.rows.length > 0) { $0h = $09.rows[0].cells.length != this.columns.length; }
        while ($09.rows.length > 0 && $0h) { $09.deleteRow(0); };
        var r = ($0h) ? $09.insertRow(-1) : $09.rows[0]; var $0r = this.columns.length;
        for (var i = 0; i < $0r; i++) {
            var $C = this.columns[i];
            var $a = ($0h) ? r.insertCell(-1) : r.cells[i]; $a.data = $C; //$a.width = $C.Width + "%";
            $a.onclick = this.headerClick; $a.title = $C.ToolTip; $a.style.overflow = 'hidden';
            $a.style.lineHeight = '1.2'; var $0c = ($0h) ? document.createElement("div") : $a.firstChild;
            var $o = ($0h) ? document.createElement("div") : $0c.firstChild;
            if ($0h) {
                $0c.unselectable = 'on'; $0c.style.MozUserSelect = 'none';
                $0c.style.backgroundColor = $C.BackColor; $0c.className = $t.cssClass + ' header';
                $0c.style.cursor = 'default'; $0c.style.position = 'relative'; $0c.style.fontFamily = this.headerFontFamily;
                $0c.style.fontSize = this.headerFontSize; $0c.style.color = this.headerFontColor;
                if (i == $0r - 1) { $0c.style.borderRight = "1px solid " + $C.BackColor; }
                else { $0c.style.borderRight = "1px solid " + this.borderColor; };
                $0c.style.height = this.headerHeight + "px"; var $o = document.createElement("div");
                $o.style.position = 'absolute'; $o.style.left = '0px'; $o.style.width = '100%';
                $o.style.padding = "2px"; $0c.style.textAlign = 'center'; $o.unselectable = 'on';
                if (this.headerClickHandling != "Disabled") { $o.style.cursor = 'pointer'; };
                $0c.appendChild($o); $a.appendChild($0c);
            }; $o.innerHTML = $C.InnerHTML;
        };
        if (!this.showAllDayEvents) { return; };
        var r = ($0h) ? $09.insertRow(-1) : $09.rows[1];
        var $0r = this.columns.length;
        for (var i = 0; i < $0r; i++) {
            var $C = this.columns[i];
            var $a = ($0h) ? r.insertCell(-1) : r.cells[i];
            $a.data = $C; $a.width = $C.Width + "%";
            $a.style.overflow = 'hidden';
            $a.style.lineHeight = '1.2';
            var $0c = ($0h) ? document.createElement("div") : $a.firstChild;
            if ($0h) {
                $0c.unselectable = 'on'; $0c.style.MozUserSelect = 'none';
                $0c.style.display = 'block'; $0c.style.textAlign = 'center';
                $0c.style.backgroundColor = $C.BackColor; $0c.style.cursor = 'default';
                $0c.style.borderTop = '1px solid ' + this.borderColor;
                if (i == $0r - 1) { $0c.style.borderRight = "1px solid " + $C.BackColor; }
                else { $0c.style.borderRight = "1px solid " + this.borderColor; };
                $0c.style.overflow = 'hidden'; var $o = document.createElement("div");
                $o.style.paddingLeft = "2px"; $o.style.paddingRight = "2px";
                $o.style.paddingTop = "2px"; $o.unselectable = 'on'; $0c.appendChild($o);
                $a.appendChild($0c);
            }; $0c.style.height = this.allDayHeaderHeight + "px";
        }
    }; this.enableScrolling = function() {
        var $0s = DayPilot.$(id + '_scroll');
        if (this.initScrollPos === null) return; $0s.root = this; $0s.onscroll = this.scroll;
        if ($0s.scrollTop === 0) { $0s.scrollTop = this.initScrollPos; } else { this.scroll(); }
    };
    this.callbackError = function($r, $s) { alert("Error!\r\nResult: " + $r + "\r\nContext:" + $s); };
    this.spaceIt = function() {
        var tr = this.$("events");
        for (var i = 0; i < tr.cells.length; i++) {
            var $0c = tr.cells[i].firstChild;
            while ($0c.tagName !== "DIV") { $0c = $0c.nextSibling; };
            var $0t = document.createElement('div'); $0t.style.position = 'absolute';
            $0t.style.width = $0c.clientWidth + 'px'; $0t.style.height = '1px';
            $0c.appendChild($0t);
        }
    }; this.fixScrollHeader = function() {
        var w = DayPilotCalendar.getScrollWidth(this); var d = this.$("right");
        if (d && w > 0) { d.style.width = (w - 1) + 'px'; }
    };
    this.registerGlobalHandlers = function() {
        if (!DayPilotCalendar.globalHandlers) {
            DayPilotCalendar.globalHandlers = true;
            DayPilot.re(document, 'mousemove', DayPilotCalendar.gMouseMove);
            DayPilot.re(document, 'mouseup', DayPilotCalendar.gMouseUp);
        }
    };
    this.Init = function() {
        this.registerGlobalHandlers();
        this.drawHeader(); this.drawTable(); this.fixScrollHeader();
        this.drawEvents(); this.drawEventsAllDay(); this.enableScrolling();
    };
};                   DayPilotCalendar.Cell = function($H, end, $q) {
    this.start = $H; this.end = end;
    this.column = function() { };
};
DayPilotCalendar.Column = function($0u, name, $P) {
    this.value = $0u; this.name = name;
    this.date = new Date($P);
};
DayPilotCalendar.Event = function($d, $t) {
    $d.event = this;
    this.div = $d; this.root = $t; this.value = function() { return $d.data.Value; };
    this.text = function() { return $d.data.Text; };
    this.start = function() { return new Date($d.data.Start); };
    this.end = function() { return new Date($d.data.End); }; this.partStart = function() {
        return new Date($d.data.PartStart);
    }; this.partEnd = function() {
        return new Date($d.data.PartEnd);
    }; this.column = function() {
        var $q = DayPilotCalendar.getShadowColumn($d);
        return $q.getAttribute("dpColumn");
    }; this.innerHTML = function() {
        var c = $d.getElementsByTagName("DIV"); return c[c.length - 1].innerHTML;
    };
    this.tag = function($0v) {
        var t = $d.data.Tag; if (!$0v) { return t; };
        var $0w = $t.tagFields.split(","); var $0x = -1; for (var i = 0; i < $0w.length; i++) {
            if ($0v === $0w[i]) $0x = i;
        }; if ($0x == -1) { throw "Field name not found."; };
        var $0y = t.split('&'); return decodeURIComponent($0y[$0x]);
    }; this.movingAllowed = function() {
        return $d.data.MoveEnabled && $t.eventMoveHandling !== "Disabled"
    }; this.resizingAllowed = function() {
        return $d.data.ResizeEnabled && $t.eventResizeHandling !== "Disabled"
    }; this.clickingAllowed = function() {
        return $d.data.ClickEnabled && $t.eventClickHandling !== "Disabled"
    }; this.rightClickingAllowed = function() {
        return $d.data.RightClickEnabled && $t.rightClickHandling !== "Disabled"
    }; this.isSelected = function() {
        return $t.selectedEvent() === this
    }; this.isAllDay = function() { return $d.data.AllDay; };
    if ($t.$("select").value === this.value()) { $t.divSelectOne($d); }; $d.onmousemove = function(ev) {
        var $0z = 5; var $0A = 10; var w = 5; if (typeof (DayPilotCalendar) === 'undefined') { return; };
        var $V = DayPilot.mo(this, ev); if (!$V) { return; };
        if (DayPilotCalendar.resizing || DayPilotCalendar.moving) { return; };
        var $0B = this.getAttribute("dpStart") === this.getAttribute("dpPartStart");
        var $0C = this.getAttribute("dpEnd") === this.getAttribute("dpPartEnd");
        if ($V.x <= $0A && $d.event.movingAllowed()) {
            if ($0B) { this.style.cursor = 'move'; }
            else { this.style.cursor = 'not-allowed'; }
        }
        else if ($V.y <= $0z && $d.event.resizingAllowed()) {
            if ($0B) { this.style.cursor = "n-resize"; this.dpBorder = 'top'; }
            else { this.style.cursor = 'not-allowed'; }
        }
        else if (this.offsetHeight - $V.y <= $0z && $d.event.resizingAllowed()) {
            if ($0C) { this.style.cursor = "s-resize"; this.dpBorder = 'bottom'; }
            else { this.style.cursor = 'not-allowed'; }
        }
        else if (!DayPilotCalendar.resizing && !DayPilotCalendar.moving) {
            if ($d.event.clickingAllowed())
                this.style.cursor = 'pointer'; else this.style.cursor = 'default';
        };
        if (typeof (DayPilotBubble) != 'undefined' && $t.bubble) {
            if (this.style.cursor == 'default' || this.style.cursor == 'pointer') {
                $t.bubble.showOnMouseOver(this.event.value());
            } else {
                DayPilotBubble.hideActive();
            }
        }
    }; $d.onmousedown = function(ev) {
        ev = ev || window.event; var $W = ev.which || ev.button;
        if ((this.style.cursor === 'n-resize' || this.style.cursor === 's-resize') && $W === 1) {
            DayPilotCalendar.resizing = this; DayPilotCalendar.originalMouse = DayPilot.mc(ev);
            DayPilotCalendar.originalHeight = this.offsetHeight; DayPilotCalendar.originalTop = this.offsetTop;
            DayPilotCalendar.resizingShadow = DayPilotCalendar.createShadow(this);
            document.body.style.cursor = this.style.cursor; this.onclickSave = this.onclick; this.onclick = null;
        }
        else if (this.style.cursor === 'move' && ($W === 1 || $W === 0)) {
            DayPilotCalendar.moving = this;
            DayPilotCalendar.originalMouse = DayPilot.mc(ev);
            DayPilotCalendar.originalTop = this.offsetTop;
            DayPilotCalendar.originalLeft = this.offsetLeft;
            var $V = DayPilot.mo(null, ev);
            if ($V) {
                DayPilotCalendar.moveOffsetY = $V.y; 
            } else { DayPilotCalendar.moveOffsetY = 0; };
            DayPilotCalendar.movingShadow = DayPilotCalendar.createShadow(this);
            DayPilotCalendar.movingShadow.style.width = DayPilotCalendar.movingShadow.parentNode.offsetWidth + 'px';
            DayPilotCalendar.movingShadow.style.left = '0px'; 
            document.body.style.cursor = 'move';
            this.onclickSave = this.onclick; this.onclick = null;
        } else {
            if (this.onclickSave) {
                this.onclick = this.onclickSave; this.onclickSave = null;
            }
        }; return false;
    };
};


