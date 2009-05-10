/**
 * @fileOverview A parser library which assignes elements some properties from a CSS-like external file, from a special style tag or from an inline HTML attribute.
 * @name aV.aParser
 *
 * @author Burak Yiğit KAYA <byk@amplio-vita.net>
 * @version	1.3
 * 
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (!window.aV)
	throw new Error("aV namespace cannot be found.", "aV.main.aParser.js@" + window.location.href);

if (!aV.AJAX)
	throw new Error("aV AJAX functions library is not loaded.", "aV.main.aParser.js@" + window.location.href);

/**
 * Represents the namespace for aParser's functions and methods.
 * 
 * @namespace
 * @requires String Extensions (aV.ext.string.js)
 * @requires Object Extension (aV.ext.object.js)
 * @requires aV.AJAX (aV.main.ajax.js)
 * @requires Ext.DomQuery (ext.main.domQuery.js)
 */
aV.aParser = {};

/**
 * Evaluates and assigns the attributes given in attributeStr as string to the given element.
 * Works incrementally, which means will override existing properties but leaves the ones which
 * are not mentioned in attributeStr as they are.
 * 
 * @deprecated Used internally, might be used if necessary.
 * @return {HTMLElement} Returns the given element if succeeds, false if fails.
 * @param {HTMLElementObject} element The element whose attributes will be set.
 * @param {String} propertyName The name of the property which the parsed attributes will be assigned to.
 * @param {String} attributeStr The string which containts the attributes.
 */
aV.aParser.setElementAttributes=function(element, propertyName, attributeStr)
{
	attributeStr="{" + attributeStr + "}";
	try 
	{
		var attributes=eval('(' + attributeStr + ')');
	} 
	catch(error) 
	{
		if (window.onerror)
			window.onerror(error.message, error.fileName, error.lineNumber);
		return false;
	}

	if (element[propertyName])
			element[propertyName].unite(attributes);
	else
		element[propertyName]=attributes;

	return element;
};

/**
 * Collects the elements which satisfies the CSS query given in queryString and
 * assigns their propertyName attribute the attributes given in attributeStr as text. If attributeStr
 * is *, then it uses the elements' inline attribute whose name is given in
 * propertyName to gather the element spesific attributeStr.
 * 
 * @deprecated Used internally, in most cases you shouldn't be in a need for calling this function.
 * @param {String} queryStr The CSS query string for determination of the proper elements.
 * @param {String} propertyName The name of the property which the parsed attributes will be assigned to.
 * @param {String} attributeStr The string which containts the attributes.
 * @param {Function(HTMLElement)} [beforeSet] The function, which will be called for each element before
 * setting its attributes. If the function returns false, the element is skipped. You may use this parameter to
 * do additional checks on the gathered elements.
 * @param {Function(HTMLElement)} [afterSet] The function, which will be called for each element after
 * successfully setting its attributes. You may do additional operations on the elements by giving a
 * proper function to this paramter.
 */
aV.aParser.retrieveElementsAndSetAttributes=function(queryStr, propertyName, attributeStr, beforeSet, afterSet)
{
	var elements=cssQuery(queryStr);

	if (!beforeSet)
		/**
		 * @ignore
		 */
		beforeSet=function(){return true;};
	
	for (var i=elements.length-1; i>=0; i--)
	{
		if (beforeSet(elements[i])===false)
			continue;
		if (aV.aParser.setElementAttributes(elements[i], propertyName, (attributeStr != '*') ? attributeStr : ((elements[i].attributes[propertyName.toLowerCase()])?elements[i].attributes[propertyName.toLowerCase()].value:'')) &&
		afterSet) 
			afterSet(elements[i]);
	}	
};

/**
 * Assigns the elements' attributes rules from the ruleText which should be in a very CSS-like structure.
 * See aV.aParser.retrieveElementsAndSetAttributes for other parameters.
 * 
 * @param {String} ruleText The text which contains the rules in an external CSS file like structure.
 */
aV.aParser.assignAttributesFromText=function(ruleText, propertyName, beforeSet, afterSet)
{
	ruleText=ruleText.replace(/\/\*.*\*\//g, '');
	var matcher=new RegExp("([^{]+)\\s*{\\s*([^}]+)\\s*}", "g");
	var result, queryStr, attributeStr;
	while (result=matcher.exec(ruleText))
	{
		queryStr = result[1].trim();
		attributeStr = result[2].trim();
		aV.aParser.retrieveElementsAndSetAttributes(queryStr, propertyName, attributeStr, beforeSet, afterSet);
	}
};

/**
 * Assigns the elements' attributes using the rules from the given text file.
 * Loads the file and then calls the assignAttributesFromText to parse its text content.
 * See aV.aParser.retrieveElementsAndSetAttributes for other parameters.
 * 
 * @method
 * @param {String} fileAddress The address of the file which contains the rules with a CSS file like structure.
 * @param {Boolean} [includeStyleTags=true] Tells the function that whether it should use the inline style tags for additional rules.
 */
aV.aParser.assignAttributesFromFile=function(fileAddress, propertyName, beforeSet, afterSet, includeStyleTags, includeInnerDefinitions)
{
	var secondaryInitializer=function()
	{
		if (includeStyleTags!==false)
			aV.aParser.assignAttributesFromStyleTag(propertyName, beforeSet, afterSet);
		if (includeInnerDefinitions!==false)
			aV.aParser.assignAttributesFromInnerDefinitions(propertyName, beforeSet, afterSet);
	};

	var initializer=function(requestObject)
	{
		var ruleText='';
		if (aV.AJAX.isResponseOK(requestObject, 'text/plain'))
			ruleText=requestObject.responseText;
		
		aV.aParser.assignAttributesFromText(ruleText, propertyName, beforeSet, afterSet);
		secondaryInitializer();
	};
	
	if (fileAddress)
		aV.AJAX.makeRequest('GET', fileAddress, '',	initializer);
	else
		window.setTimeout(secondaryInitializer, 0);
};

/**
 * Assigns the element's attributes using the inline style elements defined in the document.
 * The style elements' types should be "text/propertyName" for aV.aParser to recognize them.
 * propertyName in "text/propertyName" refers to the given parameter's value.
 * 
 * See aV.aParser.retrieveElementsAndSetAttributes for parameters.
 */
aV.aParser.assignAttributesFromStyleTag=function(propertyName, beforeSet, afterSet)
{
	var styleTags=cssQuery('style[type="text/' + propertyName + '"]');
	for (var i=0; i<styleTags.length; i++)
		aV.aParser.assignAttributesFromText(styleTags[i].innerHTML, propertyName, beforeSet, afterSet);
};

aV.aParser.assignAttributesFromInnerDefinitions=function(propertyName, beforeSet, afterSet)
{
	aV.aParser.assignAttributesFromText("*[" + propertyName + "]{*}", propertyName, beforeSet, afterSet);
};
