/**
 * @fileOverview A collection of useful CSS related functions.
 * @name CSS Library
 *
 * @author Burak Yiğit KAYA	<byk@ampliovitam.com>
 * @version 1.1.1
 *
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!window.aV)
	var aV={config: {}};
	
/**
 * Represents the namespace for CSS related functions
 * @namespace
 */
aV.CSS = {};

aV.CSS.usable = !!document.styleSheets;

/**
 * Sets the browser dependent property values when the page is initialized. 
 */
aV.CSS._initialize = function()
{
	var standartCompliant = (document.styleSheets && document.styleSheets.length && ('cssRules' in document.styleSheets[0]));
	if (standartCompliant) 
	{
		aV.CSS._rulesProperty = 'cssRules';
		aV.CSS._deleteMethod = 'deleteRule';
	}
	else 
	{
		aV.CSS._rulesProperty = 'rules';
		aV.CSS._deleteMethod = 'removeRule';
	}
};

/**
 * Returns an array where each object in the array contains the styleSheetIndex and the ruleIndex of the matched rule.
 * @param {Object} selector The selector string of the rule which actually identifies the rule.
 * @param {Object} [styleSheetName] the optional style sheet name which the rule shut be defined in
 * @return {Array}
 */
aV.CSS._findRules = function(selector, styleSheetName)
{
	selector = selector.toLowerCase();
	var result = [];
	if (aV.CSS.usable && document.styleSheets.length) 
	{
		for (var i = document.styleSheets.length - 1; i >= 0; --i) 
		{
			var styleSheet = document.styleSheets[i];
			if (!styleSheet || (styleSheet.href && styleSheetName && styleSheet.href.indexOf(styleSheetName) == -1)) 
				continue;
			var j = 0;
			var cssRule = false;
			do 
			{
				try 
				{
					cssRule = styleSheet[aV.CSS._rulesProperty][j];
				} 
				catch (error) 
				{
					cssRule = false;
				}
				if (cssRule && cssRule.selectorText && cssRule.selectorText.toLowerCase() == selector) 
				{
					result.push(
					{
						styleSheetIndex: i,
						ruleIndex: j
					});
				}
				j++;
			}
			while (cssRule)
		}
	}
	return result;
};

/**
 * Returns an array of the CSS rules matched
 * @see CSS._findrules for parameters' descriptions
 * @param {Object} selector
 * @param {Object} [styleSheetName]
 * @return {Array}
 */
aV.CSS.getRules = function(selector, styleSheetName)
{
	var ruleInfo = aV.CSS._findRules(selector, styleSheetName), i;
	for (i = ruleInfo.length - 1; i >= 0; i--)
		ruleInfo[i] = document.styleSheets[ruleInfo[i].styleSheetIndex][aV.CSS._rulesProperty][ruleInfo[i].ruleIndex];
	return ruleInfo;
};

/**
 * Deletes all the matched CSS rules existing on the document
 * @see CSS._findrules for parameters' descriptions
 * @param {Object} selector
 * @param {Object} [styleSheetName]
 */
aV.CSS.deleteRules = function(selector, styleSheetName)
{
	var ruleInfo = aV.CSS._findRules(selector, styleSheetName), i;
	for (i = ruleInfo.length - 1; i >= 0; i--)
		document.styleSheets[ruleInfo[i].styleSheetIndex][aV.CSS._deleteMethod](ruleInfo[i].ruleIndex);
};

/**
 * Sets the given styles on the matched general CSS rules of the document 
 * @see CSS._findrules for parameters' descriptions
 * @param {Object} selector
 * @param {Object} styles
 * @param {Object} [styleSheetName]
 */
aV.CSS.setRuleStyle = function(selector, styles, styleSheetName)
{
	var rules = aV.CSS.getRules(selector, styleSheetName), length = rules.length, i, name;
	for (i = 0; i < length; i++)
		for (name in styles)
			if (styles.hasOwnProperty(name))
				rules[i].style[name] = styles[name];
	return rules;
};

aV.CSS.getElementStyle = function(element, properties)
{
	if (!(element && element.ownerDocument))
		return false;
	var computedStyle = arguments.callee._getComputed(element) || element.style;
	if (properties instanceof Array)
	{
		var result = {}, propertyName;
		for (var i = properties.length - 1; i >= 0; i--) 
		{
			propertyName = properties[i];
			result[propertyName] = computedStyle[propertyName];
		}
		return result;
	}
	else if (typeof properties == 'string')
		return computedStyle[properties];
	else
		return computedStyle;
};

aV.CSS.getElementStyle._getComputed = (window.getComputedStyle || (document.defaultView && document.defaultView.getComputedStyle)) ?
function(element)
{
	return element.ownerDocument.defaultView.getComputedStyle(element, null);
}
:
function(element)
{
	return element.currentStyle;
};


/**
 * Sets the given element's opacity to the given opacity value.
 * 
 * @param {HTMLElementObject} obj The HTML element ITSELF whose opacity will be changed.
 * @param {Float [0,1]} opacity The opacity value which the object's opacity will be set to.
 */
aV.CSS.setOpacity = (document.all) ?
function(element, opacity)
{
	if (!element.currentStyle.hasLayout)
		element.style.zoom='1';
	element.style.filter = "alpha(opacity=" + opacity * 100 + ")";
}:
function(element, opacity)
{
	element.style.opacity = opacity;
};

/**
 * Tries to get the given element's opacity value.
 * <br /><b>IMPORTANT:</b> At the moment it can only get the opacity values defined in the object's style property.
 * @return {Float [0,1]} If a valid opacity value cannot be gathered, the default return value is 1.
 * @param {HTMLElementObject} obj The HTML element ITSELF whose opacity will tried to be gathered.
 */
aV.CSS.getOpacity = function(styleObject)
{
	if (styleObject.style) 
		styleObject = aV.CSS.getElementStyle(styleObject);
	return (styleObject) ? arguments.callee._get(styleObject) : false;
};

aV.CSS.getOpacity._get = (document.all) ? 
function(styleObject)
{
	var regExpResult = styleObject.filter.match(/alpha\(opacity=(\d+)\)/);
	return (regExpResult) ? parseFloat(regExpResult[1])/100 : 1;
}:
function(styleObject)
{
	return parseFloat(styleObject.opacity); //parse the opacity value to float
};

aV.CSS._initialize();