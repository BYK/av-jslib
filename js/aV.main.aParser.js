/**
 * @fileOverview A parser library which assignes elements some properties from a CSS-like external file, from a special style tag or from an inline HTML attribute.
 * @name aParser
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version	1.2
 * 
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (typeof AJAX=="undefined")
	throw new Error("AJAX functions library cannot be found!", "aV.main.aParser.js@" + window.location.href, 16);

if (typeof aParser!="undefined")
	throw new Error('"aParser" namespace had already been taken!', "aV.main.aParser.js@" + window.location.href, 25);

/**
 * Represents the name space for aParser's functions and methods.
 * 
 * @namespace
 * @requires {@link String} (aV.ext.string.js)
 * @requires {@link AJAX} (aV.main.ajax.js)
 * @requires <a href="http://dean.edwards.name/my/cssQuery/" target="_blank">cssQuery</a> (dE.cssQuery.js)
 */
aParser = {};

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
aParser.setElementAttributes=function(element, propertyName, attributeStr)
{
	try 
	{
		var attributes=eval("({" + attributeStr + "})");
	} 
	catch(error) 
	{
		return false;
	}
	
	if (propertyName in element)
	{
		for (var attrName in attributes)
			element[propertyName][attrName]=attributes[attrName];
	}
	else
		element[propertyName]=attributes;
	
	return element;
};

/**
 * Collects the elements which satisfies the CSS query given in queryString and
 * assigns them the attributes given in attributeStr as text. If attributeStr
 * is *, then it uses the elements' inline attribute whose name is given in
 * propertyName to gather the element spesific attributeStr.
 * 
 * @deprecated Used internally, in most cases you shouldn't be in a need for calling this function.
 * @param {String} queryStr The CSS query string for determination of the proper elements.
 * @param {String} propertyName The name of the property which the parsed attributes will be assigned to.
 * @param {String} attributeStr The string which containts the attributes.
 * @param {Function(HTMLElement)} [beforeSet] The function, which will be called for each found element before
 * setting its attributes. If the function returns false, the element is skipped. You may use this parameter to
 * do additional checks on the found elements.
 * @param {Function(HTMLElement)} [afterSet] The function, which will be called for each found element after
 * successfully setting the attributes. You may do additional operations on the found elements by giving a
 * proper function to this paramter.
 */
aParser.retrieveElementsAndSetAttributes=function(queryStr, propertyName, attributeStr, beforeSet, afterSet)
{
	var elements=cssQuery(queryStr);
	
	if (!beforeSet)
		beforeSet=function(){return true;};
	
	for (var i=elements.length-1; i>=0; i--)
	{
		if (beforeSet(elements[i])===false)
			continue;
		
		if (
					aParser.setElementAttributes(
						elements[i],
						propertyName,
						(attributeStr!='*')?attributeStr:elements[i].getAttribute(propertyName)
					)
					&&
					afterSet
				)
			afterSet(elements[i]);
	}	
};

/**
 * Assigns the elements' attributes rules from the ruleText
 * See {@link aParser.retrieveElementsAndSetAttributes} for other parameters.
 * 
 * @param {String} ruleText The text which contains the rules in an external CSS file like structure.
 */
aParser.assignAttributesFromText=function(ruleText, propertyName, beforeSet, afterSet)
{
	ruleText+="\n*[" + propertyName + "]{*}";
	ruleText=ruleText.replace(/\/\*.*\*\//g, '');
	var matcher=/([^\{]+)\s*\{\s*([^\}]+)\s*\}/g;
	
	var result, queryStr, attributeStr;
	while (result=matcher.exec(ruleText))
	{
		queryStr=result[1].trim();
		attributeStr=result[2].trim();
		
		aParser.retrieveElementsAndSetAttributes(queryStr, propertyName, attributeStr, beforeSet, afterSet);
	}
};

/**
 * Assigns the elements' attributes using the rules from the given text file.
 * Loads the file and then calls the assignAttributesFromText to
 * parse its text content.
 * See {@link aParser.retrieveElementsAndSetAttributes} for other parameters.
 * 
 * @method
 * @param {String} fileAddress The address of the file which contains the rules with a CSS file like structure.
 * @param {Boolean} [includeStyleTags=true] Tells the function that whether it should use the inline style tags for additional rules.
 */
aParser.assignAttributesFromFile=function(fileAddress, propertyName, beforeSet, afterSet, includeStyleTags)
{
	AJAX.makeRequest(
		'GET',
		fileAddress,
		'',
		function(requestObject)
		{
			var ruleText='';
			if (requestObject.status==200 || requestObject.status==0 && requestObject.responseText)
				ruleText=requestObject.responseText;
			
			aParser.assignAttributesFromText(ruleText, propertyName, beforeSet, afterSet);
			if (includeStyleTags || includeStyleTags===undefined)
				aParser.assignAttributesFromStyleTag(propertyName, beforeSet, afterSet);
		}
	);
};

/**
 * Assigns the element's attributes using the inline style elements defined in the document.
 * The style elements' types should be "text/propertyName" for aParser to recognize them.
 * propertyName in "text/propertyName" refers to the given parameter's value.
 * See {@link aParser.retrieveElementsAndSetAttributes} for parameters.
 */
aParser.assignAttributesFromStyleTag=function(propertyName, beforeSet, afterSet)
{
	var styleTags=cssQuery('style[type="text/' + propertyName + '"]');
	for (var i=0; i<styleTags.length; i++)
		aParser.assignAttributesFromText(styleTags[i].innerHTML, propertyName, beforeSet, afterSet);
};
