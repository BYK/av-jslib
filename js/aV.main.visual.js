/**
 * @fileOverview	A visual effects function library incloding some positioning functions.
 * @name Visual Effects&Functions Library
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.5.1
 *
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.events.js">aV.main.events.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (typeof Visual!="undefined")
	throw new Error('"Visual" namespace had already been taken!', "aV.main.visual.js@" + window.location.href, 13);

/**
 * Represents a namespace, Visual, for the new functions and global parameters of those functions.
 *
 * @namespace
 * @config	{Integer}	slideTreshold	The maximum dimension difference between the current dimension and the target dimension to stop the sliding.
 * @config	{Float}	slideDivisor	The slide functions divide the remaining dimension difference to this number and add the result to the current dimension. The bigger this number gets the slower the slide gets.
 * @config	{Float [0,1]}	fadeTreshold	The maximum opacity difference between the current opacity and the target opacity to stop the fade.
 * @config	{Float}	fadeDivisor	The fade functions divide the remaining opacity difference to this number and add the result to the current opacity. The bigger this number gets the slower the fade gets.
 */
Visual = {};

Visual.config=
{
	slideTreshold: 2,
	slideDivisor: 4,
	fadeTreshold: 0.05,
	fadeDivisor: 4
};

/**
 * Holds the fixed elements recognized by the initEditables function.
 * Changing this property is discouraged.
 *
 * @type HTMLElementObject[]
 */
Visual.fixedElements = [];

/**
 * Holds the user defined initialization functions.
 * Suitable for extending Visual library.
 * <br />A developer can easly add his/her own function as in the example.	
 *
 * @type Function[]
 * @example
 * Visual.initFunctions.add(
 * 	function()
 * 	{
 * 		Visual.myPlugin={}
 * 		Visual.myPlugin.version="1.0";
 * 		Visual.myPlugin.foo=function()
 * 		{
 * 			alert("I'm a function of Visual.myPlugin!");
 * 		}
 * 	}
 * );
 */
Visual.initFunctions = [];

/**
 * Sets the given element's opacity to the given opacity value.
 * 
 * @method
 * @param	{HTMLElementObject}	obj	The HTML element ITSELF whose opacity will be changed.
 * @param	{Float [0,1]}	opacity	The opacity value which the object's opacity will be set to.
 */
Visual.setOpacity=function(obj, opacity)
{
	if (document.all) //if IE
		obj.style.filter="alpha(opacity=" + opacity*100 + ")"; //use filter-alpha
	else //if not IE
		obj.style.opacity=opacity; //use CSS opacity
};

/**
 * Tries to get the given element's opacity value.
 * <br /><b>IMPORTANT:</b> At the moment it can only get the opacity values defined in the object's style property.
 * @return	{Float [0,1]}	If a valid opacity value cannot be gathered, the default return value is 1.
 * @param	{HTMLElementObject}	obj	The HTML element ITSELF whose opacity will tried to be gathered.
 */
Visual.getOpacity=function(obj)
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

/**
 * Fades the given HTML element, to the given opacity value with a slowing fade effect.
 *
 * @method
 * @param	{HTMLElementObject}	obj	The HTML element ITSELF which will be faded. It <b>must</b> have an ID.
 * @param	{Float [0,1]}	opacity	The desired/target opacity to be faded to.
 * @param	{Boolean}	init	Indicates the user is calling the function, not itself. MUST SET TO BE TRUE ALWAYS.
 * @param	{Function(HTMLElementObject)}	[callbackFunc]	The function which will be called immediately after the fade operation is finished.
 */
Visual.fade=function(obj, opacity, init, callbackFunc)
{
	if (obj.fadeTimer) //if there is an ongoing fade operation
		clearTimeout(obj.fadeTimer); //cancel it
	obj.fadeTimer=false;
		
	if (init) //if it is a start function, called by USER
	{
		obj.fadeCallbackFunc=callbackFunc; //assign the callbackFunc to the object
		//obj.style.display="block";
	}
	
	var theOpacity=Visual.getOpacity(obj); //get the object's current opacity
	if (Math.abs(theOpacity-opacity)>Visual.config["fadeTreshold"]) //check if the difference between the current opacity and the desired opacity is above the defined treshold limit
	{
		Visual.setOpacity(obj, theOpacity + (opacity - theOpacity)/Visual.config["fadeDivisor"]); //calculate and set the new opacity
		obj.fadeTimer=setTimeout("Visual.fade(document.getElementById('" + obj.id + "'), " + opacity + ")", 25); //set new instance to be called after 25ms
	}
	else //if the difference is smaller or equal to the defined treshold
	{
		Visual.setOpacity(obj, opacity); //set the opacity to the desired value for an exact match
		if (obj.fadeCallbackFunc) //if a callbackFunction is assigned
			obj.fadeCallbackFunc(obj); //call it
	}
};

/**
 * Fades the first element to invisiblity and then fades the second element to full opacity.
 *
 * @method
 * @param	{HTMLElementObject}	fromObj	The HTML element which will be FADED OUT.
 * @param	{HTMLElementObject}	toObj	The HTML element which will be FADED IN.
 * @param	{Function(HTMLElementObject, HTMLElementObject)}	[callbackFunc]	The function which will be called immediately after the whole fade operation is finished. The first parameter passed to the function is fromObj and the second parameter is toObj.
 */
Visual.fadeFromOneToOne=function(fromObj, toObj, callbackFunc)
{
	Visual.fade(fromObj, //fade the fromObj
				0, //to 0 opacity(invisible)
				true,
				function(obj)
				{
					obj.style.display="none"; //and when it becomes invisible, maket its display none to consume no visual space
					toObj.style.display="block"; //and make the toObj contain space in case of its display set to none
					Visual.fade(toObj, //then fade the toObj
								1, //to full opacity(fully visible)
								true,
								function(obj)
								{
									if (window.onresize)
										window.onresize({type: "resize"}); //there might be window size change so if a function is assigned to window.onresize and on scroll, call them.
									if (callbackFunc) //if a callbackFunc assigned
										callbackFunc(fromObj, toObj) //call it with giving the fromObj and toObj as its parameters
								}
								);
				}
				);
};

/**
 * Slides the given HTML element to the given dimension with a combined fade efect. The effects slow down non-linearly.
 *
 * @method
 * @param	{HTMLElementObject}	obj	The HTML element ITSELF which will be slided. It *MUST* have an ID.
 * @param	{Integer}	newDimension	The desired/target height/width to be slided to.
 * @param	{Integer [-1,1]}	opcDirection	The opacity change direction identifier. If it is positive the opacity INCREASES with the continuing slide operation and vice versa.
 * @param	{Boolean}	horizontalSlide	Defines if the newDimension is a height value or a width value. (Width if true)
 * @param	{Boolean}	init	Indicates the user is calling the function, not itself. MUST SET TO BE TRUE ALWAYS.
 * @param	{Function(HTMLElementObject)}	[callbackFunc]	The function which will be called immediately after the slide operation is finished.
 */
Visual.fadeNSlide=function(obj, newDimension, opcDirection, horizontalSlide, init, callbackFunc)
{
	var propertyName=(horizontalSlide)?"Width":"Height";
	
	if (obj.slideTimer) //if there is an ongoing slide
		clearTimeout(obj.slideTimer); //cancel it
		
	if (init) //if it is a start function, called by USER
	{
		obj["old" + propertyName]=(obj.style[propertyName.toLowerCase()])?parseInt(obj.style[propertyName.toLowerCase()]):obj["offset" + propertyName]; //set the old height if available forum CSS, and if not from the offsetHeight property.
		obj.slideCallback=callbackFunc; //assign the callbackFunc to object's slideCallback property
	}

	var currentDimension=(obj.style[propertyName.toLowerCase()])?parseInt(obj.style[propertyName.toLowerCase()]):obj["offset" + propertyName]; //get the current height, seperate from the above *oldHeight*. This is needed for the iteration.
  if (Math.abs(Math.round(currentDimension-newDimension))>Visual.config["slideTreshold"]) //check if the difference between the *currentDimension* and the desired height is above the the defined treshold value
	{
		obj.style[propertyName.toLowerCase()]=Math.round(currentDimension + (newDimension - currentDimension)/Visual.config["slideDivisor"]) + "px"; //decrease the difference by difference/4 for a non-linear and a smooth slide
		var opacity=(parseInt(obj.style[propertyName.toLowerCase()])-obj["old" + propertyName])/(newDimension-obj["old" + propertyName]); //calculate the opacity by getting the ratio of the *currentDimension* and the desired height
		if (opcDirection<0) //if direction is negative, substitude the opacity from 1, since 1 is the maximum opacity
			opacity=1-opacity;
		Visual.setOpacity(obj, opacity); //set the calculated opacity
		obj.slideTimer=setTimeout("Visual.fadeNSlide(document.getElementById('" + obj.id + "'), " + newDimension + ", " + opcDirection + ", " + horizontalSlide + ");", 25); //set new instance, which will be called after 25ms
	}
	else //if the diffrence is below the defined treshold, time to stop :)
	{
		obj.style[propertyName.toLowerCase()]=newDimension + "px"; //set the height to the desired height for an exact match
		Visual.setOpacity(obj, (newDimension<obj["old" + propertyName])?0:1); //set opacity
		if (obj.slideCallback) obj.slideCallback(obj); //call the callbackFunc if it is defined
	}
	if (window.onscroll)
		window.onscroll({type: "scroll"}); //there might be a scroll change so if a function is assigned to window.onscroll, call it.
};

/**
 * Moves the given object to the given postion with a slowing move effect.
 *
 * @method
 * @param	{HTMLElementObject}	obj	The HTML element which will be moved.
 * @param	{Integer | false}	[xPos]	The target X coordinate of the given HTML element. If it is given as false, the X coordinate is not changed.
 * @param	{Integer | false}	[yPos]	The target Y coordinate of the given HTML element. If it is given as false, the Y coordinate is not changed.
 * @param	{Boolean}	init	Indicates the user is calling the function, not itself. MUST SET TO BE TRUE ALWAYS.
 * @param	{Function(HTMLElementObject)}	[callbackFunc]	The function which will be called immediately after the moving operation is finished.
 */
Visual.move=function(obj, xPos, yPos, init, callbackFunc)
{
	var timerNeeded=false; //this variable actually defines that if there is way to go to the position or not :)
	if (obj.moveTimer) //if there is an ongoing move operation
	{
		clearTimeout(obj.moveTimer); //cancel it
		if (init && obj.moveCallbackFunc) //if a callBackFunction is assigned
			obj.moveCallbackFunc(obj); //call it		
	}
		
	if (init) //if it is a start function, called by USER
		obj.moveCallbackFunc=callbackFunc; //assign the callBackFunc to the object
	
	 //get the object's current position
	var currentXPos=parseInt(obj.style.left);
	var currentYPos=parseInt(obj.style.top);
	if (isNaN(currentXPos))
		currentXPos=0;
	if (isNaN(currentYPos))
		currentYPos=0;
	
	if (xPos===false) //a forced type+value check is need to prevent this statement become true if xPos is equal to 0
		xPos=currentXPos;
		
	if (yPos===false)
		yPos=currentYPos;
		
	//for x-position
	if (Math.abs(Math.round(currentXPos-xPos))>Visual.config["slideTreshold"]) //check if the difference between the current x-position and the desired *xPos* is above the defined treshold limit
	{
		obj.style.left=Math.round(currentXPos + (xPos - currentXPos)/Visual.config["slideDivisor"]) + "px"; //calculate and set the new x-position
		timerNeeded=true;
	}
	else //if the difference is smaller or equal to the defined treshold
		obj.style.left=xPos + "px"; //set the x-position to the desired value for an exact match
	
	//for y-position
	if (Math.abs(currentYPos-yPos)>Visual.config["slideTreshold"]) //check if the difference between the current y-position and the desired *yPos* is above the defined treshold limit
	{
		obj.style.top=Math.round(currentYPos + (yPos - currentYPos)/Visual.config["slideDivisor"]) + "px"; //calculate and set the new y-position
		timerNeeded=true;
	}
	else //if the difference is smaller or equal to the defined treshold
		obj.style.top=yPos + "px"; //set the y-position to the desired value for an exact match

	if (timerNeeded)
		obj.moveTimer=setTimeout("Visual.move(document.getElementById('" + obj.id + "'), " + xPos + ", " + yPos + ")", 25); //set new instance to be called after 25ms
	else if (obj.moveCallbackFunc) //if a callBackFunction is assigned
	{
		obj.moveCallbackFunc(obj); //call it
		obj.moveCallbackFunc=false;
	}
};

/**
 * This function is called whenever a scroll or resize event is occured. It determines the fixed elements' appropriate new positions and calls "moveElement" to set them.
 * <br />Can be called manually to ensure all the fixed elements are in correct place.
 *
 * @method
 */
Visual.setFixedElementPositions=function()
{
	//below variable definitons are only for not to call the functions repedeatly in the for loop
	var visiblePageLeftPosition=Visual.scrollLeft();
	var visiblePageTopPosition=Visual.scrollTop();
	var visiblePageWidth=Visual.clientWidth();
	var visiblePageHeight=Visual.clientHeight();	
	var xPosTemp, yPosTemp;
	for (var i=Visual.fixedElements.length-1; i>=0; i--) //walk throught the fixed elements
	{
		if (typeof(Visual.fixedElements[i].xOffset)=="number")
			if (Visual.fixedElements[i].xOffset>=0)
				xPosTemp=visiblePageLeftPosition + Visual.fixedElements[i].xOffset;
			else
				xPosTemp=visiblePageLeftPosition + visiblePageWidth + Visual.fixedElements[i].xOffset - Visual.fixedElements[i].offsetWidth;
		else
			xPosTemp=false;
		
		if (typeof(Visual.fixedElements[i].yOffset)=="number")
			if (Visual.fixedElements[i].yOffset>=0)
				yPosTemp=visiblePageTopPosition + Visual.fixedElements[i].yOffset;
			else
				yPosTemp=visiblePageTopPosition + visiblePageHeight + Visual.fixedElements[i].yOffset - Visual.fixedElements[i].offsetHeight;
		else
			yPosTemp=false;
			
		Visual.move(Visual.fixedElements[i], xPosTemp, yPosTemp, true); //move them to the appropriate positions
	}
};

/**
 * This function initialises the "fixed positioned elements" and adds them to the <a href="#Visual.fixedElements">fixedElements</a> array.
 * <br />It also adds the <a href="#Visual.setFixedElementPositions">setFixedElementPositions</a> function to window.onresize and window.onscroll event lists.
 * <br />The mentioned elements <b>must</b> have their ID properties set.
 * <br />
 * <br />The so called "fixed positioned elements" are the ones which has an <b>xOffset</b> or a <b>yOffset</b> property(or both of them).
 * <br />These properties define the elements' distance from the page's edges. A negative offset means the offset is measured from the opposite edge. (i.e. xOffset="-10" means 10 pixels from right side)
 *
 * @method
 * @example
 * &lt;div id="cart" xOffset="-10" yOffset="-10"&gt;<br />I'm your shopping cart and I stay always at the top right corner of your window with a 10px padding<br />&lt;/div&gt;
 */
Visual.initFixedElements=function()
{
	delete Visual.fixedElements;
	Visual.fixedElements=new Array();
	var list=document.getElementsByTagName('*'); //get all the elements
	for (var i=list.length-1; i>=0; i--) //walk all the elements
	{
		xOffsetTemp=list[i].getAttribute("xOffset");
		yOffsetTemp=list[i].getAttribute("yOffset");		
		if (xOffsetTemp || yOffsetTemp) //if it is a "fixed-position" element
		{
			Visual.fixedElements.push(list[i]); //add the element to the list
			//parse the string value into integer at the beginning to make the scroll events faster
			if (xOffsetTemp)
				list[i].xOffset=parseInt(xOffsetTemp);
			if (yOffsetTemp)
				list[i].yOffset=parseInt(yOffsetTemp);
			list[i].style.position="absolute"; //make sure the elements positioning is absolute
		}
	}
	//assign the watcher setFixedElementPositions function to the scroll and resize events
	Events.add(window, "resize", Visual.setFixedElementPositions);
	Events.add(window, "scroll", Visual.setFixedElementPositions);
	//call the setFixedElementPositions function to set the initial positions of the elements when the page is loaded
	Visual.setFixedElementPositions();
};

/** <a href="http://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html">External</a> page&scroll size functions */

/**
 * Returns the internal usable width of the page.
 *
 * @return	{Integer}
 */
Visual.clientWidth=function()
{
	return Visual._filterResults (
		window.innerWidth ? window.innerWidth : 0,
		document.documentElement ? document.documentElement.clientWidth : 0,
		document.body ? document.body.clientWidth : 0
	);
};

/**
 * Returns the internal usable height of the page.
 *
 * @return	{Integer}
 */
Visual.clientHeight=function()
{
	return Visual._filterResults (
		window.innerHeight ? window.innerHeight : 0,
		document.documentElement ? document.documentElement.clientHeight : 0,
		document.body ? document.body.clientHeight : 0
	);
};

/**
 * Returns the scroll offset of the page from the left.
 *
 * @return	{Integer}
 */
Visual.scrollLeft=function()
{
	return Visual._filterResults (
		window.pageXOffset ? window.pageXOffset : 0,
		document.documentElement ? document.documentElement.scrollLeft : 0,
		document.body ? document.body.scrollLeft : 0
	);
};

/**
 * Returns the scroll offset of the page from the top.
 *
 * @return	{Integer}
 */
Visual.scrollTop=function()
{
	return Visual._filterResults (
		window.pageYOffset ? window.pageYOffset : 0,
		document.documentElement ? document.documentElement.scrollTop : 0,
		document.body ? document.body.scrollTop : 0
	);
};

/**
 * Filters the given values for a cross-browser compatibility.
 *
 * @private
 * @deprecated Do not use directly.
 * @return	{Integer}
 */
Visual._filterResults=function(n_win, n_docel, n_body)
{
	var n_result = n_win ? n_win : 0;
	if (n_docel && (!n_result || (n_result > n_docel)))
		n_result = n_docel;
	return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
};
/** End of external code */

/** External code from unknown author, if you know the author, please notify me */

/**
 * Gets the CSS rule element whose name is given with ruleName parameter or deletes it providing to the deleteFlag's state.
 *
 * @return	{CSSRuleElementObject}
 * @param	{String}	ruleName	The name of the CSS rule which will be returned.
 * @param	{Boolean}	[deleteFlag]	Set to true if you want to delete the CSS rule whose name is given in the ruleName parameter.
 */
Visual.getCSSRule=function(ruleName, deleteFlag)
{
	if (document.styleSheets)
	{
		for (var i=0; i<document.styleSheets.length; i++)
		{
			var styleSheet=document.styleSheets[i];
			var ii=0;
			var cssRule=false;
			do
			{
				if (styleSheet.cssRules)
					cssRule = styleSheet.cssRules[ii];
				else
					cssRule = styleSheet.rules[ii];
				if (cssRule)
				{
					if (cssRule.selectorText==ruleName)
					{
						if (deleteFlag)
						{
							if (styleSheet.cssRules)
								styleSheet.deleteRule(ii);
							else
								styleSheet.removeRule(ii);
							return true;
						}
						else
							return cssRule;
					}
				}
				ii++;
			}
			while (cssRule)
		}
	}
	return false;
};
/** end of unknown author's external code */


/**
 * Gathers the REAL position of the given HTML element.
 *
 * @private
 * @deprecated Use getElementPositionX and getElementPositionY instead.
 * @return	{Integer}
 * @param	{HTMLElementObject}	element	The HTML element whose position to be gathered.
 * @param	{Boolean}	[xPosition]	Set true to get the X coordinate, false for Y coordinate.
 */
Visual._getElementPosition=function(element, xPosition)
{
	if (!element)
		return;
	var axis=(xPosition)?'Left':'Top';
	var position = 0;

	do
	{
		position+=element['offset' + axis];
	}
	while (element=element.offsetParent)
	return position;
};

/**
 * Gets the x position of the element.
 *
 * @return	{Integer}
 * @param	{HTMLElementObject}	element	The HTML element whose x position to be gathered.
 */
Visual.getElementPositionX=function(element)
{
	return Visual._getElementPosition(element, true);
};

/**
 * Gets the y position of the element.
 * @return	{Integer}
 * @param	{HTMLElementObject}	element	The HTML element whose y position to be gathered.
 */
Visual.getElementPositionY=function(element)
{
	return Visual._getElementPosition(element, false);
};

/**
 * Initializes the Visual system.
 * Loops through the initFunctions array and calls every function in the array.
 * After the loop is done, calls <a href="#Visual.initFixedElements">initFixedElements</a>.
 * Attached to the window.onload event automatically.
 *
 * @method
 */
Visual.init=function()
{
	if (typeof Events=="undefined")
		throw new Error("Event functions cannot be found!", "aV.main.visual.js@" + window.location.href, 467);
	for (var i=0, max=Visual.initFunctions.length; i<max; i++)
		Visual.initFunctions[i]();
	Visual.initFixedElements();
};

Events.add(window, 'load', Visual.init);
