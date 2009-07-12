/**
 * @fileOverview A collection of useful DOM related functions.
 * @name DOM Extensions
 *
 * @author Burak Yiğit KAYA	<byk@amplio-vita.net>
 * @version 1.0
 *
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
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

/** External code from unknown author, if you know the author, please notify me */

/**
 * Gets the CSS rule element whose name is given with ruleName parameter or deletes it provided to the deleteFlag's state.
 *
 * @param {String} ruleName The name of the CSS rule which will be returned.
 * @param {Boolean} [deleteFlag] Set to true if you want to delete the CSS rule whose name is given in the ruleName parameter.
 * @return {CSSRuleElementObject} The css rule
 */
aV.DOM.getCSSRule=function(ruleName, styleSheetName, deleteFlag)
{
	if (document.styleSheets)
	{
		for (var i=0; i<document.styleSheets.length; i++)
		{
			var styleSheet=document.styleSheets[i];
			if (!styleSheet || styleSheet.href.indexOf(styleSheetName)==-1)
				continue;
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
 * Returns a Coordinate object relative to the top-left of the BODY document.
 * Implemented as a single function to save having to do two recursive loops in
 * opera and safari just to get both coordinates.
 *
 * Note: this is based on Yahoo's getXY method, which is
 * Copyright (c) 2006, Yahoo! Inc.
 * All rights reserved.
 * 
 * Note2: I have adapted this code from http://code.google.com/p/doctype/wiki/ArticlePageOffset
 * 
 * Redistribution and use of this software in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 * 
 * * Redistributions of source code must retain the above
 *   copyright notice, this list of conditions and the
 *   following disclaimer.
 * 
 * * Redistributions in binary form must reproduce the above
 *   copyright notice, this list of conditions and the
 *   following disclaimer in the documentation and/or other
 *   materials provided with the distribution.
 * 
 * * Neither the name of Yahoo! Inc. nor the names of its
 *   contributors may be used to endorse or promote products
 *   derived from this software without specific prior
 *   written permission of Yahoo! Inc.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @param {HTMLElement} element The element whoose coordinates will be calculated.
 * @return {Object} Returns an object having x and y properties holding the coordinates.
 */
aV.DOM.getElementCoordinates=function(element)
{
  var result={x: 0, y:0};
	var damnIE=false;
	
	//IE conditional comments to force the use of DOM traversing since IE7+ does not include scrolls in getBoundingClientRect
	/*@cc_on
	damnIE=true;
	@*/
	
	if (element == document.documentElement)
    return result;
  if (element.getBoundingClientRect && !damnIE)
	{
    var elementBox = element.getBoundingClientRect();
		var documentElementBox = document.documentElement.getBoundingClientRect();

    result.x = elementBox.left - documentElementBox.left;
    result.y = elementBox.top - documentElementBox.top;

  }
	else
	{
    do
		{
			result.x+=element.offsetLeft - element.scrollLeft;
			result.y+=element.offsetTop - element.scrollTop;
		}
		while ((element=element.offsetParent) && (element!=document.documentElement))
  }

  return result;
};