/**
 * @fileOverview	A parser library which assignes elements some properties from a CSS-like external file or a set HTML attribute.
 * @name	aParser
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.0
 * 
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (typeof AJAX=="undefined")
	throw new Error("AJAX functions library cannot be found!", "aV.main.aParser.js@" + window.location.href, 16);

if (typeof aParser!="undefined")
	throw new Error('"aParser" namespace had already been taken!', "aV.main.aParser.js@" + window.location.href, 25);

/**
 * Represents a name space for aParser's functions and methods.
 * 
 * @namespace
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
	var attributes;
	if (!eval("attributes={" + attributeStr + "};"))
		return false;
	
	if (!element[propertyName])
		element[propertyName]=attributes;
	else
	{
		for (var attrName in attributes)
			element[propertyName][attrName]=attributes[attrName];
	}
	
	return element;
};

/**
 * Collects the elements which satisfies the CSS query given in queryString and
 * assigns them the attributes given in attributeStr as text. If attributeStr
 * is *, then it uses the elements' inline attribute whose name is given in
 * propertyName to gather the element spesific attributeStr.
 * 
 * @method
 * @deprecated Used internally, in most cases you shouldn't be in a need for calling this function.
 * @param {String} queryStr The CSS query string for determination of the proper elements.
 * @param {String} propertyName The name of the property which the parsed attributes will be assigned to.
 * @param {String} attributeStr The string which containts the attributes.
 * @param {Function(HTMLElement)} [additionalOp] The function, which will be called for each found element.
 */
aParser.retrieveElementsAndSetAttributes=function(queryStr, propertyName, attributeStr, additionalOp)
{
	var elements=cssQuery(queryStr);
	
	for (var i=elements.length-1; i>=0; i--)
	{
		if (
					aParser.setElementAttributes(
						elements[i],
						propertyName,
						(attributeStr!='*')?attributeStr:elements[i].getAttribute(propertyName)
					)
				)
			additionalOp(elements[i]);
	}	
};

/**
 * Assigns the elements' attributes rules from the ruleText
 * 
 * @method
 * @param {String} ruleText The text which contains the rules in an external CSS file like structure.
 * @param {String} propertyName The name of the property which the parsed attributes will be assigned to.
 * @param {Function(HTMLElement)} [additionalOp] The function, which will be called for each found element.
 */
aParser.assignAttributesFromText=function(ruleText, propertyName, additionalOp)
{
	ruleText+="\n*[quickEdit]{*}";
	ruleText=ruleText.replace(/\/\*.+\*\//ig, '');
	var matcher=/([^\{]+)\s*\{\s*([^\}]+)\s*\}/ig;
	
	var result, queryStr, attributeStr;
	while (result=matcher.exec(ruleText))
	{
		queryStr=result[1].trim();
		attributeStr=result[2].trim();
		
		aParser.retrieveElementsAndSetAttributes(queryStr, propertyName, attributeStr, additionalOp);
	}
};

/**
 * Assigns the elements' attributes rules from the given text file.
 * Loads the file and then calls the assignAttributesFromText to
 * parse its text content.
 * 
 * @method
 * @param {String} fileAddress The address of the file which contains the rules with a CSS file like structure.
 * @param {String} propertyName The name of the property which the parsed attributes will be assigned to.
 * @param {Function(HTMLElement)} [additionalOp] The function, which will be called for each found element.
 */
aParser.assignAttributesFromFile=function(fileAddress, propertyName, additionalOp)
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
			
			aParser.assignAttributesFromText(ruleText, propertyName, additionalOp);
		}
	);
}
