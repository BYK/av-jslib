/**
 * @fileOverview A visual effects function library.
 * @name Visual Effects and Functions Library
 *
 * @author Burak Yiğit KAYA <byk@amplio-vita.net>
 * @version 1.7
 *
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.main.visual.js@" + window.location.href);

if (!aV.Events)
	throw new Error("aV event manager library is not loaded.", "aV.main.visual.js@" + window.location.href);
	
if (!aV.DOM)
	throw new Error("aV DOM library is not loaded.", "aV.main.visual.js@" + window.location.href);

/**
 * Represents a namespace, aV.Visual, for the new functions and global parameters of those functions.
 *
 * @namespace
 * @requires {@link aV.Events} (aV.main.events.js)
 * @param	{Integer} config.slideTreshold The maximum dimension difference between the current dimension and the target dimension to stop the sliding.
 * @param	{Float} config.slideDivisor The slide functions divide the remaining dimension difference to this number and add the result to the current dimension. The bigger this number gets the slower the slide gets.
 * @param	{Float [0,1]} config.fadeTreshold The maximum opacity difference between the current opacity and the target opacity to stop the fade.
 * @param	{Float} config.fadeDivisor The fade functions divide the remaining opacity difference to this number and add the result to the current opacity. The bigger this number gets the slower the fade gets.
 */
aV.Visual = {};

/**
 * Holds the configuration parameters.
 */
aV.config.Visual=
{
	slideTreshold: 2,
	slideDivisor: 4,
	fadeTreshold: 0.05,
	fadeDivisor: 4,
	defaults:
	{
		interval: 50,
		duration: 2000,
		converger: 'exponential'
	},
	convergers:
	{
		linear: function(start, end, steps)
		{
			this.step=0;
			this.steps=steps;
			this.m=(end-start)/this.steps;
			this.c=start;
			this.next=function()
			{
				this.step++;
				return this.m*this.step + this.c;
			};
		},
		exponential: function(start, end, steps)
		{
			this.step=0;
			this.steps=steps;
			this.increment=5/this.steps;
			this.c=start;
			this.m=(end-start);
			this.next=function()
			{
				this.step++;
				return (1-Math.exp(-this.step*this.increment))*this.m + this.c;
			};
		},
		trigonometric: function(start, end, steps)
		{
			this.step=0;
			this.steps=steps;
			this.m=(end-start);
			this.c=start;
			this.next=function()
			{
				this.step++;
				return (Math.cos((this.step/this.steps - 1)*Math.PI)+1)*this.m/2 + this.c;
			};
		},
		power: function(start, end, steps)
		{
			this.step=0;
			this.steps=steps;
			this.increment=12/this.steps;
			this.c=start;
			this.m=(end-start);
			this.next=function()
			{
				this.step++;
				var x=this.step*this.increment;
				return (1-Math.pow(x/2, -x/4))*this.m + this.c;
			};
		}
	}
};

/**
 * Holds the fixed elements recognized by the initEditables function.
 * Changing this properties value is not recommended.
 *
 * @type HTMLElementObject[]
 */
aV.Visual.fixedElements = [];

/**
 * Holds the user defined initialization functions.
 * Suitable for extending aV.Visual library.
 * <br />A developer can easly add his/her own function as in the example.	
 *
 * @type Function[]
 * @example
 * aV.Visual.initFunctions.add(
 * 	function()
 * 	{
 * 		aV.Visual.myPlugin={}
 * 		aV.Visual.myPlugin.version="1.0";
 * 		aV.Visual.myPlugin.foo=function()
 * 		{
 * 			alert("I'm a function of aV.Visual.myPlugin!");
 * 		}
 * 	}
 * );
 */
aV.Visual.initFunctions = [];

aV.Visual.animationTicker=function(startVal, endVal, tickCallback, type, duration, interval)
{
	if (!(type in aV.config.Visual.convergers))
		type=aV.config.Visual.defaults.converger;

	this.startVal=this.currentVal=startVal;
	this.endVal=endVal;
	this.tickCallback=tickCallback;
	this.interval=interval || aV.config.Visual.defaults.interval;
	this.duration=duration || aV.config.Visual.defaults.duration;
	
	this.diverger=new aV.config.Visual.convergers[type](startVal, endVal, this.duration/this.interval);

	var self=this;
	
	this.start=function()
	{
		return this.ticker=window.setInterval(this.tickerFunction, this.interval);
	};
	
	this.stop=function()
	{
		if (this.ticker) 
		{
			window.clearInterval(this.ticker);
			delete this.ticker;
		}
	};
	
	this.tickerFunction=function()
	{
		self.currentVal=self.diverger.next();
		if (self.diverger.step==self.diverger.steps)
		{
			self.currentVal=self.endVal;
			self.stop();
		}
		self.tickCallback(self);
	};
	
	this.start();
};

/**
 * Sets the given element's opacity to the given opacity value.
 * 
 * @param {HTMLElementObject} obj The HTML element ITSELF whose opacity will be changed.
 * @param {Float [0,1]} opacity The opacity value which the object's opacity will be set to.
 */
aV.Visual.setOpacity=function(obj, opacity)
{
	if (document.all) //if IE
		obj.style.filter="alpha(opacity=" + opacity*100 + ")"; //use filter-alpha
	else //if not IE
		obj.style.opacity=opacity; //use CSS opacity
};

/**
 * Tries to get the given element's opacity value.
 * <br /><b>IMPORTANT:</b> At the moment it can only get the opacity values defined in the object's style property.
 * @return {Float [0,1]} If a valid opacity value cannot be gathered, the default return value is 1.
 * @param {HTMLElementObject} obj The HTML element ITSELF whose opacity will tried to be gathered.
 */
aV.Visual.getOpacity=function(obj)
{
	var opacity;
	try
	{
		if (document.all) //if IE
			opacity=parseFloat(obj.style.filter.split('=')[1])/100; //extract the alpha value, then parse to float
		else //if not IE
			opacity=parseFloat(obj.style.opacity); //parse the opacity value to float
	}
	catch(e) //if any error occurs then,
	{
		opacity=1; //most probable opacity value is one
	}
	if (isNaN(opacity)) //or if opacity cannot be parsed to float, again
		opacity=1; //most probable opacity value is one
	return opacity;
};

aV.Visual.composeRGBCode=function(color)
{
	var colors=[];
	colors.push(color.r.toString(16), color.g.toString(16), color.b.toString(16));
	colors.each(function(x){if (x.length==1) return '0'+x; else if (x.length>2) return '00'; else return x;});
	return '#%s%s%s'.format(colors);
};

aV.Visual.decomposeRGBCode=function(colorCode)
{
	var colorSeperator=/rgb\(\s*(\d{1,3})\,\s*(\d{1,3})\,\s*(\d{1,3})\)|\#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i
	
	var colors=colorSeperator.exec(colorCode);
	if (!colors)
		return undefined;
	
	var startFrom, base;
	if (colors[1]!=undefined)
	{
		startFrom=1;
		base=10;
	}
	else if (colors[4]!=undefined)
	{
		startFrom=4;
		base=16;
	}
	else
		return undefined;

	return {
		r: parseInt(colors[startFrom], base),
		g: parseInt(colors[startFrom+1], base),
		b: parseInt(colors[startFrom+2], base)
	};
};

aV.Visual.HSLtoRGB=function(color)
/** conversion function taken from 
 * http://en.wikipedia.org/wiki/HSL_and_HSV
 */
{
	var q=(color.l<0.5)?color.l*(1+color.s):(color.l + color.s - color.l*color.s);
	var p=2*color.l - q;
	var hk=color.h/360;
	var t=[hk + 1/3, hk, hk - 1/3];
	t.each(function(x){if (x<0) return x+1; else if (x>1) return x-1; else return x});
	var calculateColorValue=function(x)
	{
		var result;
		if (x<1/6)
			result=p + (q - p)*6*x;
		else if (x<0.5)
			result=q;
		else if (x<2/3)
			result=p + (q - p)*6*(2/3 - x);
		else
			result=p;
		
		return Math.round(result*255);
	};
	
	return {
		r: calculateColorValue(t[0]),
		g: calculateColorValue(t[1]),
		b: calculateColorValue(t[2])
	};
};

aV.Visual.RGBtoHSL = function(color)
/** conversion function taken from 
 * http://en.wikipedia.org/wiki/HSL_and_HSV
 */
{
	var max=Math.max(Math.max(color.r, color.g), color.b);
	var min=Math.min(Math.min(color.r, color.g), color.b);
	var result={};
	switch(max)
	{
		case min:
			result.h=0;break;
		case color.r:
			result.h=(60*(color.g - color.b)/(max - min) + 360)%360;break;
		case color.g:
			result.h=60*(color.b - color.r)/(max - min) + 120;break;
		case color.b:
			result.h=60*(color.r - color.g)/(max - min) + 240; break;
	}
	
	result.l=(max + min)/510;
	
	if (max==min)
		result.s=0;
	else if (result.l>0.5)
		result.s=(max - min)/(510 - max - min);
	else
		result.s=(max - min)/(max + min);
	
	return result;
};

/**
 * Fades the given HTML element, to the given opacity value with a slowing fade effect.
 *
 * @param {HTMLElementObject} obj The HTML element ITSELF which will be faded. It <b>must</b> have an ID.
 * @param {Float [0,1]} opacity The desired/target opacity to be faded to.
 * @param {Function(HTMLElementObject)}	[callback]	The function which will be called immediately after the fade operation is finished.
 */
aV.Visual.fade=function(obj, opacity, callback)
{
	if (obj.fadeTimer) //if there is an ongoing fade operation
	{
		clearTimeout(obj.fadeTimer); //cancel it
		obj.fadeTimer=undefined;
	}

	if (callback)
	{
		obj.fadeCallback=callback; //assign the callbackFunc to the object
	}
	
	var theOpacity=aV.Visual.getOpacity(obj); //get the object's current opacity
	if (Math.abs(theOpacity-opacity)>aV.config.Visual.fadeTreshold) //check if the difference between the current opacity and the desired opacity is above the defined treshold limit
	{
		aV.Visual.setOpacity(obj, theOpacity + (opacity - theOpacity)/aV.config.Visual.fadeDivisor); //calculate and set the new opacity
		obj.fadeTimer=setTimeout("aV.Visual.fade(document.getElementById('" + obj.id + "'), " + opacity + ")", 25); //set new instance to be called after 25ms
	}
	else //if the difference is smaller or equal to the defined treshold
	{
		aV.Visual.setOpacity(obj, opacity); //set the opacity to the desired value for an exact match
		if (obj.fadeCallback) //if a callbackFunction is assigned
		{
			obj.fadeCallback(obj); //call it
			obj.fadeCallback=undefined;
		}
	}
};

aV.Visual.newFade=function(element, targetOpacity, duration, callback, type, interval, startOpacity)
{
	if (!element || typeof targetOpacity!='number')
		return;
	
	if (element.aVfadeTicker) 
	{
		element.aVfadeTicker.stop();
		delete element.aVfadeTicker;
	}
	
	if (typeof startOpacity!='number')
		startOpacity=aV.Visual.getOpacity(element);
	
	var tickFunction=function(ticker)
	{
		aV.Visual.setOpacity(element, ticker.currentVal);
		if (ticker.currentVal==ticker.endVal)
		{
			delete element.aVfadeTicker;
			if (callback)
				callback(element);
		}
	};
	element.aVfadeTicker=new aV.Visual.animationTicker(startOpacity, targetOpacity, tickFunction, type, duration, interval);
};

/**
 * Fades the first element to invisiblity and then fades the second element to full opacity.
 *
 * @param	{HTMLElementObject}	fromObj	The HTML element which will be FADED OUT.
 * @param	{HTMLElementObject}	toObj	The HTML element which will be FADED IN.
 * @param	{Function(HTMLElementObject, HTMLElementObject)}	[callback]	The function which will be called immediately after the whole fade operation is finished. The first parameter passed to the function is fromObj and the second parameter is toObj.
 */
aV.Visual.fadeFromOneToOne=function(fromObj, toObj, callback)
{
	aV.Visual.fade(fromObj, //fade the fromObj
				0, //to 0 opacity(invisible)
				function(obj)
				{
					obj.style.display="none"; //and when it becomes invisible, make its display none to consume no visual space
					toObj.style.display=""; //and make the toObj's display property "" to force it to the default value
					aV.Visual.fade(toObj, //then fade the toObj
								1, //to full opacity(fully visible)
								function(obj)
								{
									if (window.onresize)
										window.onresize({type: "resize"}); //there might be window size change so if a function is assigned to window.onresize and on scroll, call them.
									if (callback) //if a callbackFunc assigned
										callback(fromObj, toObj) //call it with giving the fromObj and toObj as its parameters
								}
								);
				}
				);
};

/**
 * Slides the given HTML element to the given dimension with a combined fade efect. The effects slow down non-linearly.
 *
 * @param	{HTMLElementObject}	obj	The HTML element ITSELF which will be slided. It *MUST* have an ID.
 * @param	{Integer}	newDimension	The desired/target height/width to be slided to.
 * @param	{Integer [-1,1]}	opcDirection	The opacity change direction identifier. If it is positive the opacity INCREASES with the continuing slide operation and vice versa.
 * @param	{Boolean}	horizontalSlide	Defines if the newDimension is a height value or a width value. (Width if true)
 * @param	{Function(HTMLElementObject)}	[callback]	The function which will be called immediately after the slide operation is finished.
 */
aV.Visual.fadeNSlide=function(obj, newDimension, opcDirection, horizontalSlide, callback)
{
	var propertyName=(horizontalSlide)?"Width":"Height";
	
	if (obj.slideTimer) //if there is an ongoing slide
	{
		clearTimeout(obj.slideTimer); //cancel it
		obj.slideTimer=undefined;
	}
		
	if (!obj["old" + propertyName])
		obj["old" + propertyName]=(obj.style[propertyName.toLowerCase()])?parseInt(obj.style[propertyName.toLowerCase()]):obj["offset" + propertyName]; //set the old height if available forum CSS, and if not from the offsetHeight property.

	if (callback)
		obj.slideCallback=callback; //assign the callbackFunc to object's slideCallback property

	var currentDimension=(obj.style[propertyName.toLowerCase()])?parseInt(obj.style[propertyName.toLowerCase()]):obj["offset" + propertyName]; //get the current height, seperate from the above *oldHeight*. This is needed for the iteration.
  if (Math.abs(Math.round(currentDimension-newDimension))>aV.config.Visual.slideTreshold) //check if the difference between the *currentDimension* and the desired height is above the the defined treshold value
	{
		obj.style[propertyName.toLowerCase()]=Math.round(currentDimension + (newDimension - currentDimension)/aV.config.Visual.slideDivisor) + "px"; //decrease the difference by difference/4 for a non-linear and a smooth slide
		
		var opacity=(parseInt(obj.style[propertyName.toLowerCase()])-obj["old" + propertyName])/(newDimension-obj["old" + propertyName]); //calculate the opacity by getting the ratio of the *currentDimension* and the desired height
		if (opcDirection<0) //if direction is negative, substitude the opacity from 1, since 1 is the maximum opacity
			opacity=1-opacity;
		aV.Visual.setOpacity(obj, opacity); //set the calculated opacity
		obj.slideTimer=setTimeout("aV.Visual.fadeNSlide(document.getElementById('" + obj.id + "'), " + newDimension + ", " + opcDirection + ", " + horizontalSlide + ");", 25); //set new instance, which will be called after 25ms
	}
	else //if the diffrence is below the defined treshold, time to stop :)
	{
		obj.style[propertyName.toLowerCase()]=newDimension + "px"; //set the height to the desired height for an exact match
		aV.Visual.setOpacity(obj, (newDimension<obj["old" + propertyName])?0:1); //set opacity
		obj["old" + propertyName]=undefined;
		if (obj.slideCallback) 
		{
			obj.slideCallback(obj); //call the callbackFunc if it is defined
			obj.slideCallback=undefined;
		}
	}
	if (window.onscroll)
		window.onscroll({type: "scroll"}); //there might be a scroll change so if a function is assigned to window.onscroll, call it.
};

aV.Visual.toggle=function(element, display)
{
	if (!display)
		display='';

	if (element.style.display=='none')
		element.style.display=display;
	else
		element.style.display='none';
};

aV.Visual.slideToggle=function (element, maxDimension, offset, horizontal, callback)
{
	var newDimension, direction;
	var propertyStr=(horizontal)?'Width':'Height';
	if (!offset)
		offset=0;
	if (!maxDimension)
		maxDimension=element['scroll' + propertyStr];
	if (element['client' + propertyStr]<maxDimension)
	{
		newDimension=maxDimension + offset;
		direction=1;
	}
	else
	{
		newDimension=0;
		direction=-1
	}
	aV.Visual.fadeNSlide(element, newDimension, direction, horizontal, callback);
};

/**
 * Moves the given object to the given postion with a slowing move effect.
 *
 * @param	{HTMLElementObject}	obj	The HTML element which will be moved.
 * @param	{Integer | false}	[xPos]	The target X coordinate of the given HTML element. If it is given as false, the X coordinate is not changed.
 * @param	{Integer | false}	[yPos]	The target Y coordinate of the given HTML element. If it is given as false, the Y coordinate is not changed.
 * @param	{Function(HTMLElementObject)}	[callback]	The function which will be called immediately after the moving operation is finished.
 */
aV.Visual.move=function(obj, xPos, yPos, callback)
{
	var timerNeeded=false; //this variable actually defines that if there is way to go to the position or not :)
	if (obj.moveTimer) //if there is an ongoing move operation
	{
		clearTimeout(obj.moveTimer); //cancel it
		obj.moveTimer=undefined;
		if (callback && obj.moveCallback) //if a callBackFunction is assigned
			obj.moveCallback(obj); //call it
	}
		
	if (callback)
		obj.moveCallback=callback; //assign the callBackFunc to the object
	
	 //get the object's current position
	var currentXPos=parseInt(obj.style.left) | 0;
	var currentYPos=parseInt(obj.style.top) | 0;
	
	if (xPos===false) //a forced type+value check is need to prevent this statement become true if xPos is equal to 0
		xPos=currentXPos;
		
	if (yPos===false)
		yPos=currentYPos;
		
	//for x-position
	if (Math.abs(Math.round(currentXPos-xPos))>aV.config.Visual.slideTreshold) //check if the difference between the current x-position and the desired *xPos* is above the defined treshold limit
	{
		obj.style.left=Math.round(currentXPos + (xPos - currentXPos)/aV.config.Visual.slideDivisor) + "px"; //calculate and set the new x-position
		timerNeeded=true;
	}
	else //if the difference is smaller or equal to the defined treshold
		obj.style.left=xPos + "px"; //set the x-position to the desired value for an exact match
	
	//for y-position
	if (Math.abs(currentYPos-yPos)>aV.config.Visual.slideTreshold) //check if the difference between the current y-position and the desired *yPos* is above the defined treshold limit
	{
		obj.style.top=Math.round(currentYPos + (yPos - currentYPos)/aV.config.Visual["slideDivisor"]) + "px"; //calculate and set the new y-position
		timerNeeded=true;
	}
	else //if the difference is smaller or equal to the defined treshold
		obj.style.top=yPos + "px"; //set the y-position to the desired value for an exact match

	if (timerNeeded)
		obj.moveTimer=setTimeout("aV.Visual.move(document.getElementById('" + obj.id + "'), " + xPos + ", " + yPos + ")", 25); //set new instance to be called after 25ms
	else if (obj.moveCallback) //if a callBackFunction is assigned
	{
		obj.moveCallback(obj); //call it
		obj.moveCallback=undefined;
	}
};

/**
 * This function is called whenever a scroll or resize event is occured. It determines the fixed elements' appropriate new positions and calls "moveElement" to set them.
 * <br />Can be called manually to ensure all the fixed elements are in correct place.
 */
aV.Visual.setFixedElementPositions=function()
{
	//below variable definitons are only for not to call the functions repedeatly in the for loop
	var visiblePageLeftPosition=aV.DOM.windowScrollLeft();
	var visiblePageTopPosition=aV.DOM.windowScrollTop();
	var visiblePageWidth=aV.DOM.windowClientWidth();
	var visiblePageHeight=aV.DOM.windowClientHeight();	
	var xPosTemp, yPosTemp;
	for (var i=aV.Visual.fixedElements.length-1; i>=0; i--) //walk throught the fixed elements
	{
		if (typeof(aV.Visual.fixedElements[i].xOffset)=="number")
			if (aV.Visual.fixedElements[i].xOffset>=0)
				xPosTemp=visiblePageLeftPosition + aV.Visual.fixedElements[i].xOffset;
			else
				xPosTemp=visiblePageLeftPosition + visiblePageWidth + aV.Visual.fixedElements[i].xOffset - aV.Visual.fixedElements[i].offsetWidth;
		else
			xPosTemp=false;
		
		if (typeof(aV.Visual.fixedElements[i].yOffset)=="number")
			if (aV.Visual.fixedElements[i].yOffset>=0)
				yPosTemp=visiblePageTopPosition + aV.Visual.fixedElements[i].yOffset;
			else
				yPosTemp=visiblePageTopPosition + visiblePageHeight + aV.Visual.fixedElements[i].yOffset - aV.Visual.fixedElements[i].offsetHeight;
		else
			yPosTemp=false;
			
		aV.Visual.move(aV.Visual.fixedElements[i], xPosTemp, yPosTemp); //move them to the appropriate positions
	}
};

/**
 * This function initialises the "fixed positioned elements" and adds them to the <a href="#aV.Visual.fixedElements">fixedElements</a> array.
 * <br />It also adds the <a href="#aV.Visual.setFixedElementPositions">setFixedElementPositions</a> function to window.onresize and window.onscroll event lists.
 * <br />The mentioned elements <b>must</b> have their ID properties set.
 * <br />
 * <br />The so called "fixed positioned elements" are the ones which has an <b>xOffset</b> or a <b>yOffset</b> property(or both of them).
 * <br />These properties define the elements' distance from the page's edges. A negative offset means the offset is measured from the opposite edge. (i.e. xOffset="-10" means 10 pixels from right side)
 *
 * @example
 * &lt;div id="cart" xOffset="-10" yOffset="-10"&gt;<br />I'm your shopping cart and I stay always at the top right corner of your window with a 10px padding<br />&lt;/div&gt;
 */
aV.Visual.initFixedElements=function()
{
	aV.Visual.fixedElements=[];
	var list=document.getElementsByTagName('*'); //get all the elements
	for (var i=list.length-1; i>=0; i--) //walk all the elements
	{
		xOffsetTemp=list[i].getAttribute("xOffset");
		yOffsetTemp=list[i].getAttribute("yOffset");		
		if (xOffsetTemp || yOffsetTemp) //if it is a "fixed-position" element
		{
			aV.Visual.fixedElements.push(list[i]); //add the element to the list
			//parse the string value into integer at the beginning to make the scroll events faster
			if (xOffsetTemp)
				list[i].xOffset=parseInt(xOffsetTemp);
			if (yOffsetTemp)
				list[i].yOffset=parseInt(yOffsetTemp);
			list[i].style.position="absolute"; //make sure the elements positioning is absolute
		}
	}
	//assign the watcher setFixedElementPositions function to the scroll and resize events
	aV.Events.add(window, "resize", aV.Visual.setFixedElementPositions);
	aV.Events.add(window, "scroll", aV.Visual.setFixedElementPositions);
	//call the setFixedElementPositions function to set the initial positions of the elements when the page is loaded
	aV.Visual.setFixedElementPositions();
};

/**
 * Initializes the aV.Visual system.
 * Loops through the initFunctions array and calls every function in the array.
 * After the loop is done, calls <a href="#aV.Visual.initFixedElements">initFixedElements</a>.
 * Attached to the window.onload event automatically.
 *
 * @method
 */
aV.Visual.init=function()
{
	aV.Visual.initFunctions.push(aV.Visual.initFixedElements);
	for (var i=0, max=aV.Visual.initFunctions.length; i<max; i++)
		aV.Visual.initFunctions[i]();
};

aV.Events.add(window, 'domready', aV.Visual.init);