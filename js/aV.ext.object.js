/**
 * @fileOverview A library which extends the base Object class with some useful functions.
 * @name Object Extensions
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 1.0
 *
 * @copyright &copy;2010 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

/**
 * This function serializes the object to a standart URI query string which can directly interpreted by PHP.
 * 
 * @param {String} [format] The desired format for the output. Not needed for most usages.
 * @return {String} The URI query string.
  */
Object.prototype.toQueryString=function(format, encodeURI)
{
	if (typeof format!='string')
		format='%s';
	var result='';
	for (var paramName in this) 
	{
		if (this.constructor==Array && isNaN(parseInt(paramName)) || !this.hasOwnProperty(paramName) || this[paramName]===undefined || this[paramName]===null)
			continue;

		if (this[paramName].constructor==Object || this[paramName].constructor==Array)
			result += '&' + this[paramName].toQueryString(format.format(paramName) + '[%s]', encodeURI);
		else
			result += '&' + format.format(paramName) + '=' + ((encodeURI!==false)?encodeURIComponent(this[paramName]):this[paramName]);
	}
	return result.substr(1);
};

/**
 * Merges the object with the given object.
 * 
 * @param {Object} additive The object which should be merged with the current object.
 * @param {Boolean} [overwrite=true] Indicates whter the function should overwrite the possible existing values in the base object with the ones from the additive.
 */
Object.prototype.unite=function(additive, overwrite)
{
	if (overwrite!==false)
		overwrite=true;
	if (!additive || !additive.hasOwnProperty)
		return this;
	for (var property in additive) 
	{
		if (!additive.hasOwnProperty(property))
			continue;
		if (this[property] && (this[property].constructor == Object) && this.hasOwnProperty(property))
			this[property].unite(additive[property], overwrite);
		else if (overwrite || !(property in this))
			this[property] = additive[property];
	}
	return this;
};

/**
 * Tries to clone the object by using the appropriate contructors and setting all the public properties' values to the same as the original object.
 * 
 * @return {Object} The cloned object which has a different resource id than the original one.
 */
Object.prototype.clone=function()
{
	var result=this.constructor();
	for (var property in this)
		if (this.hasOwnProperty(property))
			if (typeof this[property]=='object')
				result[property]=this[property].clone();
			else
				result[property]=this[property];
	return result;
};


/**
 * Tries to convert a given JSON string to a native JavaScript object by simply evaluating it.
 * 
 * @param {String} source The appropriate, JSON string whicih will be converted.
 * @param {Boolean} [secure=false] Wheterher the script should do the conversion using JSON.parse function if the library from http://json.org is loaded.
 * @return {Object} The object constructed from the given JSON string or false if an error is occured.
 */
Object.fromJSON=function(source, secure)
{
	if (!secure || !window.JSON)
		return eval('(' + source + ')');
	else if (!window.JSON)
		return JSON.parse(source);
};

/**
 * Tries to convert a given URI paramter list as an array or '&' seperated string to a native JSON object/array.
 * 
 * @param {String|Array} source The source string or array which contains the appropriate query/URI string.
 * @return {Object} The object constructed from the given source or false if an error is occured.
 */
Object.fromQueryString=function(source)
{
	var itemList;
	if (source instanceof Array)
		itemList=source;
	else if (typeof source=='string')
		itemList=source.split('&');
	else
		return false;

	var result={};
	var pairPattern=/^([^&=]+)=([^&]+)$/;
	var objectPattern=/([^\s\[\]]+)/g;
	var pair;
	for (var i=0; i<itemList.length; i++)
	{
		pair = itemList[i].match(pairPattern);
		if (!(pair && pair[1]))
			continue;
		
		var currentObject=result;
		var arr=pair[1].match(objectPattern);
		for (var j = 0; j < arr.length - 1; j++) 
		{
			if (!currentObject[arr[j]])
				currentObject[arr[j]] = (parseInt(arr[j+1])==0) ? [] : {};
			currentObject = currentObject[arr[j]];
		}
		try 
		{
			currentObject[arr[j]] = decodeURIComponent(pair[2]);
		}
		catch(error)
		{
			if (window.console)
				console.warn(error);
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
Object.fromXML=function(source, includeRoot)
{
	if (typeof source=='string')
	{
		try
		{
			if (window.DOMParser)
				source=(new DOMParser()).parseFromString(source, "application/xml");
			else if (window.ActiveXObject)
			{
				var xmlObject=new ActiveXObject("Microsoft.XMLDOM");
				xmlObject.async=false;
				xmlObject.loadXML(source);
				source=xmlObject;
				xmlObject=undefined;
			}
			else
				throw new Error("Cannot find an XML parser!");
		}
		catch(error)
		{
			return false;
		}
	}
	var result={};
	if (source.nodeType==9)
		source=source.firstChild;
	if (!includeRoot)
		source=source.firstChild;

	while (source) 
	{
		if (source.childNodes.length) 
		{
			if (source.tagName in result) 
			{
				if (result[source.tagName].constructor != Array) 
					result[source.tagName] = [result[source.tagName]];
				result[source.tagName].push(Object.fromXML(source));
			}
			else 
				result[source.tagName] = Object.fromXML(source);
		}
		else if (source.tagName)
			result[source.tagName] = source.nodeValue;
		else if (!source.nextSibling)
			result = source.nodeValue;
		source = source.nextSibling;
	}

	return result;
};

/*
 * if the JSON library at http://www.json.org/json2.js is included,
 * add a "toJSONStr" methdo to all objects.
 */
if (window.JSON)
{
	Object.prototype.toJSONStr=function(replacer, space)
	{
		return JSON.stringify(this, replacer, space);
	};
}
