/**
 * @fileOverview A collection of useful DOM related functions.
 * @name DOM Extensions
 *
 * @author Burak Yiğit KAYA	<byk@ampliovitam.com>
 * @version 1.0
 *
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!window.aV)
	var aV={config: {}};
	
/**
 * Represents the namespace for DOM related functions since they cannot be binded directly to the prototype in all browsers.
 * @namespace
 */
aV.DOM = {};

/** <a href="http://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html">External</a> page&scroll size functions */

/**
 * Returns the internal usable width of the page.
 *
 * @return {Integer} Internal usable width of the page.
 */
aV.DOM.windowClientWidth=function()
{
	return aV.DOM._filterResults (
		window.innerWidth ? window.innerWidth : 0,
		document.documentElement ? document.documentElement.clientWidth : 0,
		document.body ? document.body.clientWidth : 0
	);
};

/**
 * Returns the internal usable height of the page.
 *
 * @return {Integer} The internal usable height of the page.
 */
aV.DOM.windowClientHeight=function()
{
	return aV.DOM._filterResults (
		window.innerHeight ? window.innerHeight : 0,
		document.documentElement ? document.documentElement.clientHeight : 0,
		document.body ? document.body.clientHeight : 0
	);
};

/**
 * Returns the scroll offset of the page from the left for page.
 *
 * @return {Integer} The scroll offset of the page from the left for page.
 */
aV.DOM.windowScrollLeft=function()
{
	return aV.DOM._filterResults (
		window.pageXOffset ? window.pageXOffset : 0,
		document.documentElement ? document.documentElement.scrollLeft : 0,
		document.body ? document.body.scrollLeft : 0
	);
};

/**
 * Returns the scroll offset of the page from the top for page.
 *
 * @return {Integer} The scroll offset of the page from the top for page.
 */
aV.DOM.windowScrollTop=function()
{
	return aV.DOM._filterResults (
		window.pageYOffset ? window.pageYOffset : 0,
		document.documentElement ? document.documentElement.scrollTop : 0,
		document.body ? document.body.scrollTop : 0
	);
};

/**
 * Filters the given values for a cross-browser compatibility.
 *
 * @private
 * @return	{Integer}
 */
aV.DOM._filterResults=function(n_win, n_docel, n_body)
{
	var n_result = n_win ? n_win : 0;
	if (n_docel && (!n_result || (n_result > n_docel)))
		n_result = n_docel;
	return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
};
/** End of external code */

/**
 * Determines whether the given element has a spesific class or not.
 * 
 * @param {HTMLElementObject} element The element which will be tested.
 * @param {String} className The classname which will be tested against.
 * @param {String} [seperator=' '] The seperator, which seperates the multiple, different classnames.
 * @return {Object} If the element has class, returns the regexp result object, else undefined.
 */
aV.DOM.hasClass=function(element, className, seperator)
{
	if (!seperator || seperator.length>1)
		seperator=' ';
	var matcher=new RegExp("[%0:s]?%1:s[%0:s]?".format(seperator.escapeRegExp(), className.escapeRegExp()));
	return element.className.match(matcher);
};

/**
 * Adds the class whoose name is given, to the spesified HTML element.
 * 
 * @param {HTMLElementObject} element The element which the class will be added.
 * @param {String} className The classname which will be added.
 * @param {String} [seperator=' '] The seperator, which seperates the multiple, different classnames.
 * @return {HTMLElementObject} The element given in the element parameter.
 */
aV.DOM.addClass=function(element, className, seperator)
{
	if (!seperator)
		seperator=' ';
	if (!aV.DOM.hasClass(element, className, seperator))
		element.className+=seperator + className;
	else
		return false;
	return element;
};

/**
 * Removes the class whoose name is given, from the spesified HTML element.
 * 
 * @param {HTMLElementObject} element The element which the class will be removed from.
 * @param {String} className The classname which will be removed.
 * @param {String} [seperator=' '] The seperator, which seperates the multiple, different classnames.
 * @return {Boolean} Returns true if the element no longer has the given class else, returns false.
 */
aV.DOM.removeClass=function(element, className, seperator)
{
	if (!seperator)
		seperator=' ';
	var matcher=new RegExp("[%0:s]?%1:s[%0:s]?".format(seperator.escapeRegExp(), className.escapeRegExp()));
	element.className=element.className.replace(matcher, '');
	return !element.className.match(matcher);
};

/**
 * Determines wheter an element is a child of another element.
 * 
 * @param {HTMLElementObject} element The element which should be the child.
 * @param {HTMLElementObject} target The element which should be the parent.
 * @param {Number} [maxDepth] The maximum node depth to look for.
 * @return {Boolean} Returns true if the element is a child of target for a maximim depth of maxDepth if given. Else, it returns false.
 */
aV.DOM.hasAsParent=function(element, target, maxDepth)
{
	if (!element || !target)
		return false;
	else
		element=element.parentNode;

	var counter=0;
	while (element && element!=target && (!maxDepth || ++counter<=maxDepth))
		element=element.parentNode;
	
	return (element && element==target)?counter:false;
};

/**
 * Removes all possible and reachable 1st degree children of an element.
 * 
 * @param {HTMLElementObject} element The HTML element which will be emptied.
 * @return {HTMLElementObject} The HTML element, given as parameter.
 */
aV.DOM.removeChildren=function(element)
{
	while (element.firstChild)
		element.removeChild(container.firstChild);
	
	return element;
};

/**
 * NOTICE: Inspired by jQuery's offset function
 * Returns a coordinate object relative to the related document element viewport.
 * @param {HTMLElement} element The element whoose coordinates will be calculated.
 * @return {Object} Returns an object having x and y properties holding the coordinates.
 */
aV.DOM.getElementCoordinates=(document.documentElement.getBoundingClientRect)?
function(element)
{
	if (!element.ownerDocument)
		return false;

  var result={x: 0, y:0}, elementBox = element.getBoundingClientRect(), docElement = element.ownerDocument.documentElement;

  result.x = elementBox.left - docElement.clientLeft + aV.DOM.windowScrollLeft();
  result.y = elementBox.top - docElement.clientTop + aV.DOM.windowScrollTop();
	
	return result;
}
:
function(element)
{
	var result={x: 0, y:0};
	
	do
	{
		result.x+=element.offsetLeft - element.scrollLeft;
		result.y+=element.offsetTop - element.scrollTop;
	}
	while ((element=element.offsetParent) && (element!=document.documentElement))

  return result;
};

aV.DOM.toggle = function(element)
{
	element.style.display = (element.style.display == 'none') ? '' : 'none';
};
