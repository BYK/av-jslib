/**
 * @fileOverview	Allows non obtrusive asynchornous dynamic language management.
 * @name dynamicLanguage
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.2
 *
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (typeof AJAX=="undefined")
	throw new Error("AJAX functions library cannot be found!", "aV.plg.dynamicLanguage.js@" + window.location.href, 13);

if (typeof AJAX.dynamicLanguage!="undefined")
	throw new Error('"AJAX.dynamicLanguage" namespace had already been taken!', "aV.plg.dynamicLanguage.js@" + window.location.href, 16);

/**
 * Represents a namespace under AJAX, AJAX.dynamicLanguage, for the new functions and global parameters of those functions.
 *
 * @config	{Boolean}	retryOnError	Set true for recursive retries if a language file request fails.
 * @config	{Function(String)}	loadingNotifier	The callback function which is called when the language file is loading.
 * The language code of the loaded language is passed as the only parameter.
 * @namespace
 */
AJAX.dynamicLanguage = {};

AJAX.dynamicLanguage.config=
{
	retryOnError: false,
	loadingNotifier: false
};

/**
 * The XMLHttpRequestObject which is used to load the language asynchronously
 *
 * @private
 * @type	XMLHttpRequestObject
 */
AJAX.dynamicLanguage._loader=false;

/**
 * The collection which holds the retrieved language strings
 *
 * @private
 * @type XMLElementCollectionObject
 */
AJAX.dynamicLanguage._strings=false;

/**
 * An internal function which is made for quick&easy language text retrieving from the active language
 *
 * @private
 * @return	{String}	The retrieved language string
 * @param	{String}	fieldName	The identifier of the language string
 */
AJAX.dynamicLanguage._getString=function(fieldName)
{
	return AJAX.XML.getValue(AJAX.dynamicLanguage._strings, fieldName, '');
};

/**
 * This function scans the sub elements of the given object for <b>langText</b> defined elements
 * and then sets their innerHTML's to the appropriate text, retrieved dynamically from the
 * XML language file.
 *
 * @method
 * @param	{HTMLElementObject | String}	[container]	The id or the object reference of the element-to-be-scanned
 * for dynamic language text associations.
 * <br />If not spesified, the function automatically scans the whole document(usually this is useful).
 */
AJAX.dynamicLanguage.fillTexts=function(container)
{ 
	if (!container) //if container is not defined
		container=document.body; //assign the document object
		
	if (typeof(container)=='string') //or it is an id of the object
		container=document.getElementById(container); //then get the object with the given id
		
	var elements;
	elements = container.childNodes; //get all sub elements under the container

	for (var i=0; i<elements.length; i++) { //scan through the sub elements
		if (elements[i].nodeType==1 && elements[i].getAttribute("langText")) //if the element has a defined "langText" attribute
			elements[i].innerHTML = AJAX.dynamicLanguage._getString(elements[i].getAttribute("langText")); //set its innerHTML from the language xml
		else if (elements[i].hasChildNodes()) //if the element has sub nodes
			AJAX.dynamicLanguage.fillTexts(elements[i]); //call to iterate over the sub nodes
	}
};

/**
 * Loads and fills the language texts whose code is given as the parameter.
 * <br />'lang/'+code+'.xml' is the path for the language file. You may change this pattern @ line 100
 *
 * @return	{XMLHttpRequestObject}	The created XMLHttpRequest object which is used to load the language file.
 * @param	{String}	code	The language code which is used to load the language file
 */
AJAX.dynamicLanguage.load=function(code)
{
	if (AJAX.dynamicLanguage._loader) //if there is an ongoing languge load request
		AJAX.destroyRequestObject(AJAX.dynamicLanguage._loader); //abort it
	var filePath = 'lang/'+code+'.xml'; //determine the file name from the language code. This line can be edited for personalisation
	var loadedFunction=function(requestObject)//start defining the callBack function for the language load request
	{
		if (requestObject.readyState==4 && (requestObject.status==200 || requestObject.status==0)) //if the XML file loaded succesfully
		{
			AJAX.dynamicLanguage._strings = requestObject.responseXML.getElementsByTagName('language')[0]; //assign the response to the _strings object
			AJAX.dynamicLanguage.fillTexts(); //change all the language texts across the page
		}
		else if (requestObject.readyState==4 && AJAX.dynamicLanguage.retryOnError) //if the operation failed and retryOnError is true
			AJAX.dynamicLanguage.load(code); //try to reload
	};
	var loadingFunction=function(requestObject)
	{
		if (requestObject.readyState!=4 && AJAX.dynamicLanguage.loadingNotifier) //if the request is in progress and a loadingNotifier function is defined
			AJAX.dynamicLanguage.loadingNotifier(code); //call the given loadingNotifier function
	};
	return (AJAX.dynamicLanguage._loader=AJAX.makeRequest("GET", filePath, "", loadedFunction, loadingFunction)); //assign the created request object to the _loader object and return it.
};