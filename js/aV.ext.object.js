/**
 * @fileOverview A library which extends the base Object class with some useful functions.
 * @name Object Extensions
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 2.0
 *
 * @requires aV.ext.string.js
 * @copyright 2010 amplioVitam under Apache License, Version 2.0
 */

if (!window.aV)
	var aV={config: {}};
	
/**
 * Represents the namespace for DOM related functions since they cannot be binded directly to the prototype in all browsers.
 * @namespace
 */
aV.Object = {};

/**
 * This function serializes the object to a standart URI query string which can directly interpreted by PHP.
 * 
 * @param {String} [format] The desired format for the output. Not needed for most usages.
 * @return {String} The URI query string.
  */
aV.Object.toQueryString = function toQS(obj, format, encodeURI)
{
	if (typeof format != 'string')
		format = '%s';
	var result = '';
	for (var paramName in obj)
	{
		if (obj.constructor == Array && isNaN(parseInt(paramName)) || !obj.hasOwnProperty(paramName) || obj[paramName] === undefined || obj[paramName] === null)
			continue;

		if (obj[paramName].constructor == Object || obj[paramName].constructor == Array)
			result += '&' + toQS(obj[paramName], format.format(paramName) + '[%s]', encodeURI);
		else
			result += '&' + format.format(paramName) + '=' + ((encodeURI !== false) ? encodeURIComponent(obj[paramName]) : obj[paramName]);
	}
	return result.substr(1);
};

/**
 * Merges the object with the given object.
 * 
 * @param {Object} additive The object which should be merged with the current object.
 * @param {Boolean} [overwrite=true] Indicates whter the function should overwrite the possible existing values in the base object with the ones from the additive.
 */
aV.Object.unite = function unite(obj, additive, overwrite)
{
	if (overwrite !== false)
		overwrite = true;
	if (!additive || !additive.hasOwnProperty)
		return obj;
	for (var property in additive) 
	{
		if (!additive.hasOwnProperty(property))
			continue;
		if (obj[property] && (obj[property].constructor == Object) && obj.hasOwnProperty(property))
			unite(obj[property], additive[property], overwrite);
		else if (overwrite || !(property in obj))
			obj[property] = additive[property];
	}
	return obj;
};

/**
 * Tries to clone the object by using the appropriate contructors and setting all the public properties' values to the same as the original object.
 * 
 * @return {Object} The cloned object which has a different resource id than the original one.
 */
aV.Object.clone = function clone(obj)
{
	var result = obj.constructor();
	for (var property in obj)
		if (obj.hasOwnProperty(property))
			if (typeof obj[property] == 'object')
				result[property] = clone(obj[property]);
			else
				result[property] = obj[property];
	return result;
};

/**
 * Tries to convert a given URI paramter list as an array or '&' seperated string to a native JSON object/array.
 * 
 * @param {String|Array} source The source string or array which contains the appropriate query/URI string.
 * @return {Object} The object constructed from the given source or false if an error is occured.
 */
aV.Object.fromQueryString = function oFromQS(source)
{
	var itemList;
	if (source instanceof Array)
		itemList = source;
	else if (typeof source == 'string')
		itemList = source.split('&');
	else
		return false;

	var result = {};
	var pairPattern = /^([^&=]+)=([^&]+)$/;
	var objectPattern = /([^\s\[\]]+)/g;
	var pair;
	for (var i = 0; i < itemList.length; i++)
	{
		pair = itemList[i].match(pairPattern);
		if (!(pair && pair[1]))
			continue;
		
		var currentObject = result;
		var arr = pair[1].match(objectPattern);
		for (var j = 0; j < arr.length - 1; j++) 
		{
			if (!currentObject[arr[j]])
				currentObject[arr[j]] = (parseInt(arr[j+1]) == 0) ? [] : {};
			currentObject = currentObject[arr[j]];
		}
		try 
		{
			currentObject[arr[j]] = decodeURIComponent(pair[2]);
		}
		catch(error)
		{
			currentObject[arr[j]] = pair[2];
		}
	}
	return result;
};

/**
 * Tries to convert a given XML data to a native JavaScript object by traversing the DOM tree.
 * If a string is given, it first tries to create an XMLDomElement from the given string.
 * 
 * @param {XMLDomElement|String} source The XML string or the XMLDomElement prefreably which containts the necessary data for the object.
 * @param {Boolean} [includeRoot] Whether the "required" main container node should be a part of the resultant object or not.
 * @return {Object} The native JavaScript object which is contructed from the given XML data or false if any error occured.
 */
aV.Object.fromXML = function oFromXML(source, includeRoot)
{
	if (typeof source == 'string')
	{
		try
		{
			if (window.DOMParser)
				source = new DOMParser().parseFromString(source, "application/xml");
			else if (window.ActiveXObject)
			{
				var xmlObject = new ActiveXObject("Microsoft.XMLDOM");
				xmlObject.async = false;
				xmlObject.loadXML(source);
				source = xmlObject;
				xmlObject = undefined;
			}
			else
				throw new Error("Cannot find an XML parser!");
		}
		catch(error)
		{
			return false;
		}
	}

	var result = {};
	if (source.nodeType == 9)
		source = source.firstChild;
	if (!includeRoot)
		source = source.firstChild;

	while (source) 
	{
		if (source.childNodes.length) 
		{
			if (source.tagName in result) 
			{
				if (result[source.tagName].constructor != Array) 
					result[source.tagName] = [result[source.tagName]];
				result[source.tagName].push(oFromXML(source));
			}
			else 
				result[source.tagName] = oFromXML(source);
		}
		else if (source.tagName)
			result[source.tagName] = source.nodeValue;
		else if (!source.nextSibling)
			result = source.nodeValue;
		source = source.nextSibling;
	}

	return result;
};
