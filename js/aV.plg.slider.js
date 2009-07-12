/**
 * @fileOverview	Extens visual effects library with a resize slider namespace.
 * @name Visual Effects - Slider Extension
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.2.1
 *
 * @requires	<a href="http://amplio-vita.net/JSLib_files/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV || !aV.Visual)
	throw new Error("Visual functions library cannot be found!", "aV.plg.infoBox.js@" + window.location.href);

/**
 * Introduces a namespace that holds the sliders' functions under the aV.Visual namespace.
 *
 * @namespace
 * @config {Boolean} [effects] Set to true to turn on the css hover and mousedown effects. Default is true.
 * @config {integer} [heightDifference] Automatically calculated height difference between the slider
 * and the neighbour divs. You may override it manually.
 */
aV.Visual.slider = {};

aV.config.Visual.slider=
{
	effects: true,
	heightDifference: 0
};

/**
 * The property stores the active slider's object referance whenuser is silding a slider.
 * You should not change its value but you may use its value.
 *
 * @type HTMLDivElementObject
 */
aV.Visual.slider.activeSlider=false;

/**
 * The event handler which responds to a slider's onmousedown event to lock the user to that slider.
 *
 * @method
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
aV.Visual.slider._lockSlider=function(event)
{
	var obj=event.target;
	obj.initialPos=event.clientX;

	obj.prevSib.initialWidth=parseInt(obj.prevSib.style.width);
	obj.nextSib.initialWidth=parseInt(obj.nextSib.style.width);
	aV.Visual.slider.activeSlider=obj;
	if (aV.config.Visual.slider.effects)
		obj.className="slider_active";
	return false;
};

/**
 * The event handler which responds to a slider's onmousedown event to lock the user to that slider.
 *
 * @return {Boolean}
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
aV.Visual.slider._unlockSlider=function(event)
{
	//var obj=event.target;
	var obj=aV.Visual.slider.activeSlider;
	if (!obj)
		return true;
	if (aV.config.Visual.slider.effects)
		obj.className=(event.target!=obj)?"slider":"slider_hover";
	obj.initialPos=false;
	if (obj.getAttribute("onSlideEnd"))
		eval(obj.getAttribute("onSlideEnd") + '(obj);');
	else if (obj.onSlideEnd)
		obj.onSlideEnd({type: "slideEnd", target: obj});

	aV.Visual.slider.activeSlider=false;
	return aV.Visual.slider.activeSlider;
};

/**
 * The event handler which responds to the document's onmousemove event when a slider is active.
 *
 * @return {Boolean}
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
aV.Visual.slider._moveSlider=function(event)
{
	//var obj=event.target;
	var obj=aV.Visual.slider.activeSlider;
	if (!obj.initialPos)
		return false;
	var prevSibWidth=obj.prevSib.initialWidth + event.clientX - obj.initialPos;
	var nextSibWidth=obj.nextSib.initialWidth - event.clientX + obj.initialPos;
	if (prevSibWidth<0 || nextSibWidth<0)
		return false;
	obj.prevSib.style.width=prevSibWidth + "px";
	obj.nextSib.style.width=nextSibWidth + "px";
	obj.style.height=(Math.max(obj.prevSib.offsetHeight, obj.nextSib.offsetHeight) + aV.config.Visual.slider.heightDifference) + "px";	
};

/**
 * The event handler which responds to a slider's ondblclick event to collapse one of the neighbour containers.
 *
 * @return {Boolean}
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
aV.Visual.slider._collapseContainer=function(event)
{
	var obj=event.target;
	var totalWidth=parseInt(obj.prevSib.style.width)+parseInt(obj.nextSib.style.width);
	var condition=(parseInt(obj.prevSib.style.width)>parseInt(obj.nextSib.style.width));
	
	aV.Visual.fadeNSlide(
		(condition)?obj.prevSib:obj.nextSib,
		0,
		-1,
		true,
		function(o)
		{
			aV.Visual.setOpacity(o, 1);
			aV.Visual.fadeNSlide(
				(condition)?obj.nextSib:obj.prevSib,
				totalWidth,
				1,
				true,
				function(o)
				{
					if (obj.getAttribute("onSlideEnd"))
						eval(obj.getAttribute("onSlideEnd") + '(obj);');
					else if (obj.onSlideEnd)
						obj.onSlideEnd({type: "slideEnd", target: obj});
				}
			);
		}
	);
};

aV.Visual.initFunctions.push(
	function()
	{
		if (aV.AJAX)
			aV.AJAX.loadResource("/JSLib/css/aV.plg.slider.css", "css", "aVsliderCSS");
	
		var divElements=document.getElementsByTagName("div");
		for (var i = 0; i < divElements.length; i++) 
		{
			if (divElements[i].className == "slider") 
			{
				aV.Events.add(divElements[i], "mousedown", aV.Visual.slider._lockSlider);
				aV.Events.add(divElements[i], "dblclick", aV.Visual.slider._collapseContainer);
				
				divElements[i].onselectstart = function()
				{
					return false
				};
				//REAL previous sibling determination
				divElements[i].prevSib = divElements[i].previousSibling;
				while (divElements[i].prevSib.nodeName != "DIV") 
					divElements[i].prevSib = divElements[i].prevSib.previousSibling;
				//determined and assigned the REAL previous sibling object to objects prevSib property
				//REAL next sibling determination
				divElements[i].nextSib = divElements[i].nextSibling;
				while (divElements[i].nextSib.nodeName != "DIV") 
					divElements[i].nextSib = divElements[i].nextSib.nextSibling;
				//determined and assigned the REAL next sibling object to objects nextSib property
				if (aV.config.Visual.slider.effects) 
				{
					aV.Events.add(divElements[i], "mouseover", function()
					{
						if (!this.initialPos) 
							this.className = "slider_hover"
					});
					aV.Events.add(divElements[i], "mouseout", function()
					{
						if (!this.initialPos) 
							this.className = "slider"
					});
				}
			
				divElements[i].style.height = Math.max(divElements[i].prevSib.offsetHeight, divElements[i].nextSib.offsetHeight) + "px";
				aV.config.Visual.slider.heightDifference = parseInt(divElements[i].style.height) - divElements[i].offsetHeight;
			}
		}
		aV.Visual.slider.activeSlider=false;
		aV.Events.add(document, "mousemove", aV.Visual.slider._moveSlider);
		aV.Events.add(document, "mouseup", aV.Visual.slider._unlockSlider);
		/**
		 * @ignore
		 */
		document.onselectstart=function() {return !aV.Visual.slider.activeSlider};
		aV.Events.add(document, "dragstart", function() {return !aV.Visual.slider.activeSlider});
	}
);