/**
 * @fileOverview Extends visual effects library to provide custom hints support.
 * @name Visual Effects - customHint Extension
 *
 * @author Burak Yiğit KAYA	byk@amplio-vita.net
 * @version 1.2.1
 *
 * @requires <a href="http://amplio-vita.net/JSLib_files/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.plg.customHint.js@" + window.location.href);

if (!aV.Visual)
	throw new Error("aV visual functions library is not loaded.", "aV.plg.customHint.js@" + window.location.href);

aV.config.Visual.customHint=
{
	offsetX: 2,
	offsetY: 2,
	timeout: 500,
	maxWidth: 300
};

/**
 * @memberOf aV.Visual
 * @name aV.Visual.customHint
 * @type HTMLDivElementObject
 */
aV.Visual.customHint=document.createElement("DIV");
aV.Visual.customHint.id='customHint';
aV.Visual.customHint.style.position="absolute";

/**
 * Clears the timer which is set to hide the CustomHint after some interval.
 *
 * @method
 */
aV.Visual.customHint.clearTimer=function()
{
	if (this.hideTimer)
	{
		clearTimeout(this.hideTimer);	
		this.hideTimer=null;
	}
};

/**
 * Adjusts the size and the position of the hint div according to the data inside it
 * and the given pop coordinates.
 *
 * @method
 * @param {integer} [xPos] The x coordinate on the page where the hint box will be popped.
 * @param {integer} [yPos] The y coordinate on the page where the hint box will be popped.
 */
aV.Visual.customHint.adjustSizeNPosition=function(xPos, yPos)	
{
	if (!xPos)
		xPos=this.lastXPos;
	if (!yPos)
		yPos=this.lastYPos;

	this.style.height="auto";
	this.style.width="auto";
	var widthVar=Math.min(this.scrollWidth, aV.DOM.windowClientWidth()/3);
	this.style.width=widthVar + 'px';
	var heightVar=Math.min(this.scrollHeight, aV.DOM.windowClientHeight()/3);
	this.style.height=heightVar + 'px';
	this.style.left=((aV.config.Visual.customHint.offsetX + xPos + widthVar) < (aV.DOM.windowClientWidth() + aV.DOM.windowScrollLeft())) ? (aV.config.Visual.customHint.offsetX + xPos + 'px') : (aV.config.Visual.customHint.offsetX + xPos - widthVar + 'px');
	this.style.top=((aV.config.Visual.customHint.offsetY + yPos + heightVar) < (aV.DOM.windowClientHeight() + aV.DOM.windowScrollTop())) ? (aV.config.Visual.customHint.offsetY + yPos + 'px') : (aV.config.Visual.customHint.offsetY + yPos - heightVar + 'px');
	
	this.lastXPos=xPos;
	this.lastYPos=yPos;
};

/**
 * Pops up the hint div with a fade effect at the given coordinates with the given message.
 * Automatically called by the generated mousemove event handler but might be called manually to show hints.
 *
 * @method
 * @param {String} [message] The message which will appear in the hint.
 * The string here is assigned to the innerHTML of the customHint.
 * @param	{integer} xPos The x coordinate on the page where the hint box will be popped.
 * @param	{integer} yPos The y coordinate on the page where the hint box will be popped.
 */
aV.Visual.customHint.pop=function(message, xPos, yPos)
{
	this.clearTimer();
	if (message)
		this.innerHTML=message;
	aV.Visual.setOpacity(this, 0);
	this.style.visibility="visible";		
	this.adjustSizeNPosition(xPos, yPos);
	
	aV.Visual.fade(this, 1/*, function()
	{
		if (aV.config.Visual.customHint["timeout"])
			this.hideTimer=setTimeout('aV.Visual.customHint.hide();', aV.config.Visual.customHint["timeout"]);
	}*/
	);
};

/**
 * Hides the customHint with a fade effect and clears the hide timer.
 *
 * @method
 */
aV.Visual.customHint.hide=function()
{
	this.clearTimer();
	this.innerHTML='';
	aV.Visual.fade(this, 0, function() {this.style.visibility='hidden';});
};

/**
 * The onclick event is assigned directly to the <a href="#aV.Visual.customHint.hide">hide</a> method
 * of the customHint to provide hide-on-click support.
 *
 * @private
 * @event
 */
aV.Visual.customHint.onclick=aV.Visual.customHint.hide;

/**
 * The onmouseover event is assigned directly to the <a href="#aV.Visual.customHint.clearTimeout">clearTimeout</a> method
 * of the customHint to prevent it hiding when the cursor is over the hint.
 *
 * @private
 * @event
 */
aV.Visual.customHint.onmouseover=aV.Visual.customHint.clearTimer;

/**
 * Sets the hide timer of customHint when the cursor moves away from it.
 * <br />This event assignment should <b>not</b> be overridden but developers
 * can use aV.Visual.customHint.onmouseout() to manually set the timer for hiding.
 *
 * @method
 * @event
 */
aV.Visual.customHint.onmouseout=function()
{
	this.hideTimer=setTimeout('aV.Visual.customHint.hide();', aV.config.Visual.customHint["timeout"]);
};

/**
 * The event handler for the document's onmousemove event to trigger the hints.
 */
aV.Visual.customHint._mouseMoveHandler=function(event)
{
	var element=event.target;
	var hint;
	if (element && element!=aV.Visual.customHint && element.getAttribute)
	{
		while (element!=aV.Visual.customHint && element.getAttribute && !element.getAttribute("hint") && element.parentNode && element.getAttribute("showParentHint")!="false")
			element=element.parentNode;
		hint=(element.getAttribute)?element.getAttribute("hint"):null;
		if (hint=="%self%")
			hint=element.innerHTML;
	}
	if (element && (hint==aV.Visual.customHint.innerHTML || element==aV.Visual.customHint))
	{
		aV.Visual.customHint.clearTimer();
	}
	else if (!hint && element!=aV.Visual.customHint && aV.Visual.customHint.style.visibility=='visible' && !aV.Visual.customHint.hideTimer)
	{
		aV.Visual.customHint.onmouseout();
	}
	else if (element && hint && element!=aV.Visual.customHint.lastElement)
	{
		aV.Visual.customHint.pop(hint, event.clientX + aV.DOM.windowScrollLeft(), event.clientY + aV.DOM.windowScrollTop());
	}
	if (element && element!=aV.Visual.customHint)
		aV.Visual.customHint.lastElement=element;
};

aV.Events.add(document,
	"mousemove",
	aV.Visual.customHint._mouseMoveHandler
);

aV.Visual.initFunctions.push(
	function()
	{/*
		if (aV.AJAX)
			aV.AJAX.loadResource("/JSLib/css/aV.plg.customHint.css", "css", "aVcustomHintCSS");*/
		document.body.appendChild(aV.Visual.customHint);
		aV.AJAX.loadResource("/JSLib/css/aV.plg.customHint.css", "css", "aVcustomHintCSS");
	}
);