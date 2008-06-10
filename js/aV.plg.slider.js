/**
 * @fileOverview	Extens visual effects library with a resize slider namespace.
 * @name Visual Effects - Slider Extension
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.2
 *
 * @requires	<a href="http://amplio-vita.net/JSLib_files/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (typeof Visual=="undefined")
			throw new Error("Visual functions library cannot be found!", "aV.plg.infoBox.js@" + window.location.href, 13);

/**
 * Introduces a namespace that holds the sliders' functions under the Visual namespace.
 *
 * @namespace
 * @config {Boolean} [effects] Set to true to turn on the css hover and mousedown effects. Default is true.
 * @config {integer} [heightDifference] Automatically calculated height difference between the slider
 * and the neighbour divs. You may override it manually.
 */
Visual.sliders = {};

Visual.sliders.config=
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
Visual.sliders.activeSlider=false;

/**
 * The event handler which responds to a slider's onmousedown event to lock the user to that slider.
 *
 * @method
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
Visual.sliders._lockSlider=function(event)
{
	var obj=event.target;
	obj.initialPos=event.clientX;

	obj.prevSib.initialWidth=parseInt(obj.prevSib.style.width);
	obj.nextSib.initialWidth=parseInt(obj.nextSib.style.width);
	Visual.sliders.activeSlider=obj;
	if (Visual.sliders.config["effects"])
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
Visual.sliders._unlockSlider=function(event)
{
	//var obj=event.target;
	var obj=Visual.sliders.activeSlider;
	if (!obj)
		return true;
	if (Visual.sliders.config["effects"])
		obj.className=(event.target!=obj)?"slider":"slider_hover";
	obj.initialPos=false;
	if (obj.getAttribute("onSlideEnd"))
		eval(obj.getAttribute("onSlideEnd") + '(obj);');
	else if (obj.onSlideEnd)
		obj.onSlideEnd({type: "slideEnd", target: obj});

	Visual.sliders.activeSlider=false;
	return Visual.sliders.activeSlider;
};

/**
 * The event handler which responds to the document's onmousemove event when a slider is active.
 *
 * @return {Boolean}
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
Visual.sliders._moveSlider=function(event)
{
	//var obj=event.target;
	var obj=Visual.sliders.activeSlider;
	if (!obj.initialPos)
		return false;
	var prevSibWidth=obj.prevSib.initialWidth + event.clientX - obj.initialPos;
	var nextSibWidth=obj.nextSib.initialWidth - event.clientX + obj.initialPos;
	if (prevSibWidth<0 || nextSibWidth<0)
		return false;
	obj.prevSib.style.width=prevSibWidth + "px";
	obj.nextSib.style.width=nextSibWidth + "px";
	obj.style.height=(Math.max(obj.prevSib.offsetHeight, obj.nextSib.offsetHeight) + heightDifference) + "px";	
};

/**
 * The event handler which responds to a slider's ondblclick event to collapse one of the neighbour containers.
 *
 * @return {Boolean}
 * @private
 * @deprecated Since this is an event handler, it should not be called directly.
 */
Visual.sliders._collapseContainer=function(event)
{
	var obj=event.target;
	var totalWidth=parseInt(obj.prevSib.style.width)+parseInt(obj.nextSib.style.width);
	var condition=(parseInt(obj.prevSib.style.width)>parseInt(obj.nextSib.style.width));
	
	Visual.fadeNSlide(
		(condition)?obj.prevSib:obj.nextSib,
		0,
		-1,
		true,
		function(o)
		{
			Visual.setOpacity(o, 1);
			Visual.fadeNSlide(
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

/**
 * The initialization function which is attached to the Visual namespace's initFunctions array.
 * Initializes the div elements whose class name is "slider" as sliders.
 *
 * @method
 * @deprecated Use <a href="#Visual.init">Visual.init</a> instead
 */
Visual.sliders.init=function()
{
	Visual.sliders.config["effects"]=Visual.sliders.config["effects"] && (Visual.getCSSRule(".slider_hover") && Visual.getCSSRule(".slider_active"));
	var divElements=document.getElementsByTagName("div");
	for (var i=0; i<divElements.length; i++)
		if (divElements[i].className=="slider")
		{
			Events.add(divElements[i], "mousedown", Visual.sliders._lockSlider);
			Events.add(divElements[i], "dblclick", Visual.sliders._collapseContainer);
			//Events.add(divElements[i], "mouseup", Visual.sliders._unlockSlider);
			//Events.add(divElements[i], "mousemove", Visual.sliders._moveSlider);
			divElements[i].onselectstart=function() {return false};
			//REAL previous sibling determination
			divElements[i].prevSib=divElements[i].previousSibling;
			while (divElements[i].prevSib.nodeName!="DIV")
				divElements[i].prevSib=divElements[i].prevSib.previousSibling;
			//determined and assigned the REAL previous sibling object to objects prevSib property
			//REAL next sibling determination
			divElements[i].nextSib=divElements[i].nextSibling;
			while (divElements[i].nextSib.nodeName!="DIV")
				divElements[i].nextSib=divElements[i].nextSib.nextSibling;
			//determined and assigned the REAL next sibling object to objects nextSib property
			if (Visual.sliders.config["effects"])
			{			
				Events.add(divElements[i], "mouseover", function() {if(!this.initialPos)this.className="slider_hover"});
				Events.add(divElements[i], "mouseout", function() {if(!this.initialPos)this.className="slider"});
			}
			
			divElements[i].style.height=Math.max(divElements[i].prevSib.offsetHeight, divElements[i].nextSib.offsetHeight) + "px";
			heightDifference=parseInt(divElements[i].style.height) - divElements[i].offsetHeight;
		}
	Visual.sliders.activeSlider=false;
	Events.add(document, "mousemove", Visual.sliders._moveSlider);
	Events.add(document, "mouseup", Visual.sliders._unlockSlider);
	document.onselectstart=function() {return !Visual.sliders.activeSlider};
	Events.add(document, "dragstart", function() {return !Visual.sliders.activeSlider});
};

Visual.initFunctions.push(Visual.sliders.init);