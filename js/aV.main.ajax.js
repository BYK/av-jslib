/**
 * @fileOverview A function-based AJAX library which also comes with useful XML functions such as <a href="#aV.AJAX.XML.getValue">aV.AJAX.XML.getValue</a> and <a href="#aV.AJAX.XML.setValue">aV.AJAX.XML.setValue</a>.
 * @name Core AJAX and XML Library
 *
 * @author Burak Yiğit KAYA	byk@amplio-vita.net
 * @version 1.5
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (!aV)
	var aV={config: {}};
	
/**
 * Represents the namespace, aV.AJAX, for the core AJAX functions and global parameters of those functions.
 *
 * @namespace
 * @param {String} [config.noAjax="You need an AJAX supported browser to use this page."] The error message which user will see if his/her browser does not support AJAX.
 * If you want to disable this warning, just set this to false.
 * @param {String} [config.loadImgPath="images/loading_img.gif"] The "loading" gif's path, which might be used in various places. 
 * @param {String} [config.loadingText] The "loading" message which will be placed into a dynamically filled container while the content is being loaded.
 * If you want to disable this text, just set this to false.
 * @param {String} [config.pageLeaveWarning="There are one or more requests in progress. If you exit, there might be data loss."] The warning message which will be displayed to user if (s)he tries to leave the page while an AJAX request is loading.
 * If you want to disable this warning, just set this to false.
 */
aV.AJAX = {};

/**
 * Holds the configuration parameters.
 */
aV.config.AJAX=
{
	noAjax: "You need an AJAX supported browser to use this page.",
	loadImgPath: "images/loading_img.gif",
	loadingText: "<br><center><img src=\"" + this.loadImgPath + "\">Loading, please wait...</center>",
	pageLeaveWarning: "There are one or more requests in progress. If you exit, there might be data loss."
};

/**
 * Tries to get an XMLHttpRequest object, returns false if the browser does not support AJAX.
 * 
 * @deprecated You should not need to use this function directly, use {@link aV.AJAX.makeRequest} to make AJAX calls.
 * @return {XMLHttpRequestObject | false} A new XMLHttpRequest object or false
 */
aV.AJAX.createRequestObject=function()
{
	var requestObject = false;
	if(window.XMLHttpRequest && !(window.ActiveXObject))
	{
		try
		{
			requestObject = new XMLHttpRequest();
		}
		catch(e)
		{
			requestObject = false;
		}
	}
	else if(window.ActiveXObject)
	{
		try
		{
			requestObject = new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch(e)
		{
			try
			{
				requestObject = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch(e)
			{
				requestObject = false;
			}
		}
	}
	return requestObject;
}

/**
 * Destroys the given XMLHttpRequest object safely.
 * Aborts the request if it is active.
 *
 * @param {XMLHttpRequestObject} requestObject The requestObject which will be destroyed
 */
aV.AJAX.destroyRequestObject=function(requestObject)
{
	if (requestObject)
	{
		if ((requestObject.readyState!=4) && (requestObject.readyState!=0))
			requestObject.abort();
		delete requestObject;
		requestObject=undefined;
	}
};

/**
 * This function is assigned to the page's onbeforeunload event for pageLeaveWarning feature.
 * See {@link aV.AJAX}.config.pageLeaveWarning
 *
 * @deprecated Should not be called directly, it is for the page's onbeforeunload event.
 * @return {String | null} pageLeaveWarning config variable or null
 */
aV.AJAX.checkActiveRequests=function()
{
	if (aV.config.AJAX.pageLeaveWarning && aV.AJAX.activeRequestCount>0)
		return aV.config.AJAX.pageLeaveWarning;
};

/**
 * This function serializes the parameters object to a standart URI query string.
 * 
 * @return {String} The URI query string.
 * @param {Object} parameters
 */
aV.AJAX.serializeParameters=function(parameters, format)
{
	if (format==undefined)
		format='%s';
	var paramsTemp=parameters;
	parameters='';
	for (var paramName in paramsTemp) 
	{
		if ((paramsTemp instanceof Array) && isNaN(parseInt(paramName)))
			continue;

		if ((paramsTemp[paramName] instanceof Object) || paramsTemp[paramName] instanceof Array)
		{
			parameters += '&' + aV.AJAX.serializeParameters(paramsTemp[paramName], format.replace(/%s/g, paramName) + '[%s]');
		}
		else 
			parameters += '&' + format.replace(/%s/g, paramName) + '=' + encodeURIComponent(paramsTemp[paramName]);
	}
	return parameters.substr(1);
};

/**
 * Creates a new XMLHttpRequest object which connects to the adress, which includes the URI encoded and merged GET parameters.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @return {XMLHttpRequestObject}
 * @param {String} adress The adress of the page which will be connected. Should include the URI encoded GET parameters.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 */
aV.AJAX.makeGetRequest=function(adress, changeFunction)
{
	var resultRequest = this.createRequestObject(); //try to create an XMLHttpRequest object
	if (resultRequest) //if the XMLHttpRequest object is valid
	{
		resultRequest.open("GET", adress, true); //set the adress and HTTP method to GET
		resultRequest.onreadystatechange = function()
		{
			try
			{
				if (changeFunction) //if there is an assigned changeFunction, assign it to the onreadystatechange event specially, that it recieves the XMLHttpRequest object as its parameter		
					changeFunction(resultRequest);
			}
			catch(e)
			{
				if (window.handleError)
					handleError(e.message, e.fileName, e.lineNumber);
			}
			finally
			{
				if (resultRequest.readyState==4)
				{
					aV.AJAX.activeRequestCount--;
					delete resultRequest;
					resultRequest=undefined;
				}
			}
		};
		resultRequest.send(null); //start the request
		aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return resultRequest; //return the created XMLHttpRequest object for any further use
};

/**
 * Creates a new XMLHttpRequest object which posts the given URI query string to the given adress.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @return {XMLHttpRequestObject}
 * @param {String} adress The adress of the page which will be connected. Should  NOT include any parameters.
 * @param {String} parameters The URI encoded and merged POST parameters for the HTTP request.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 */
aV.AJAX.makePostRequest=function(adress, parameters, changeFunction)
{
	var resultRequest = this.createRequestObject(); //try to create a XMLHttpRequest object
	if (resultRequest) //if XMLHttpRequest object is valid
	{
		resultRequest.open("POST", adress, true); //set the adress and HTTP method to GET
		resultRequest.onreadystatechange = function()
		{
			try
			{
				if (changeFunction) //if there is an assigned changeFunction, assign it to the onreadystatechange event specially, that it recieves the XMLHttpRequest object as its parameter		
					changeFunction(resultRequest);
			}/*
			catch(e)
			{
				if (console)
					console.error(e);
			}*/
			finally
			{
				if (resultRequest.readyState==4)
				{
					aV.AJAX.activeRequestCount--;
					delete resultRequest;
					resultRequest=undefined;
				}
			}
		};
		resultRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    resultRequest.setRequestHeader("Content-length", parameters.length);
    resultRequest.setRequestHeader("Connection", "close");
		//set some headers for POST method
		resultRequest.send(parameters); //send the request with parameters attached
		aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return resultRequest; //return the created XMLHttpRequest object for any further use
};

/**
 * Takes "GET" or "POST" as method parameter and then according to this, creates a SELF-MANAGED
 * XMLHttpRequest object using internal makeGetRequest or makePostRequest according to the method parameter.
 * Developers are strongly recommended to use THIS function instead of the above POST and GET specific functions.
 *
 * @return {XMLHttpRequestObject} The newly created XMLHttpRequest object for this specific AJAX call.
 * @param {String} method Should be either POST or GET according to the type of the HTTP request.
 * @param {String} adress The adress of the page which will be connected. Should  NOT include any parameters.
 * @param {String | Object} parameters The parameters which are either URI encoded and merged or given in the JSON format
 * @param {Function(XMLHttpRequestObject)} [completedFunction] The function which will be called when the HTTP call is completed. (readyState==4)
 * @param {Function(XMLHttpRequestObject)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4. Might be called several times before the call is completed.
 */
aV.AJAX.makeRequest=function(method, adress, parameters, completedFunction, loadingFunction)
{
	var triggerFunction=function (requestObject) //define the custom changeFunction as triggerFunction
	{
		if (requestObject.readyState == 4 && completedFunction) //if the request is finished and there is a  completedFunction assigned
			completedFunction(requestObject); //call the completedFunction sending the requestObject as its parameter
		else if (loadingFunction) //if request is in progress and there is an assigned loadingFunction
			loadingFunction(requestObject); //call the loadingFunction passing the requestObject as its parameter
	}; //finished defining the custom changeFunction
	//checking parameters
	if (typeof parameters=='object')
		parameters=aV.AJAX.serializeParameters(parameters);
	
	if (method.toUpperCase()=="GET") //if requested method is GET, then call the aV.AJAX.makeGetRequest function
		return this.makeGetRequest(adress + ((parameters)?'?' + parameters:''), triggerFunction);
	else if (method.toUpperCase()=="POST") //else if requested method is POST, then call the aV.AJAX.makePostRequest function
		return this.makePostRequest(adress, parameters, triggerFunction);
	else //if requested method is invalid, return false
		return false;
};

aV.AJAX.isResponseOK=function(requestObject, responseType)
{
	if (!responseType)
		responseType='Text';
	return (requestObject.status==200 && requestObject["response" + responseType]);
};

/**
 * Loads content to the given container element using an asynchronous HTTP GET call.
 * If the config.loadingText is defined, target container element's innerHTML is filled with its valye while the content is loading.
 *
 * @result {XMLHttpRequestObject}
 * @param {String} theURL The URL of the content which will be loaded dynamically into the given container.
 * @param {String|Object} element The container element itself or its id, which the dynamic content will be loaded into.
 * @param {Function(Object, String)} [completedFunction] The function which will be called when the loading of the content is finished. It is called with the target container element and the URL as parameters.
 * @param {Function(Object, String)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4 while loading the dynamic content. It is called with the target container element and the URL as parameters.
 */
aV.AJAX.loadContent=function(theURL, element, completedFunction, loadingFunction)
{
	if (typeof(element)=='string') //if id of the object is given instead of the object itself
		element=document.getElementById(element); //assign the element the object corresponding to the given id
	var triggerFunction = function(requestObject) //define the custom changeFunction
	{
		if (requestObject.readyState == 4) //if the request is finished
		{
			element.innerHTML=requestObject.responseText; //fill the element's innerHTML with the returning data
			if (completedFunction) //if a callback function assigned to *callbackFunc*
				completedFunction(element, theURL); //call it with the element object and the given URL as its parameters
		}
		else
		{
			if (loadingFunction) //if a custom loadingFunction is assigned
				loadingFunction(element, theURL); //call it with the element object and the given URL as its parameters
			else if (aV.config.AJAX.loadingText)
				element.innerHTML=aV.config.AJAX.loadingText; //set the given element's innerHTML the loading text to inform the user
		}
	};
	return (this.makeGetRequest(theURL, triggerFunction)); //make the GET request and return the used XMLHttpRequest object
};

/**
 * Loads an external style-sheet or Javascript file on-demand.
 * Removes the old node if a resourceId is given.
 * 
 * @return {HTMLElementObject} The newly added script or link DOM node.
 * @param {String} theURL The address of the resource-to-be-loaded.
 * @param {String} [type="js"] The type of the resource.
 * Should be either js or css.
 * @param {String} [resourceId]	The id which will be assigned to newly created DOM node.
 * If not given, no id is assigned to the created node.
 * @param {Boolean} [forceRefresh] Addes a "?time" value at the end of the file URL to force the browser reload the file and not to use cache.
 */
aV.AJAX.loadResource=function(theURL, type, resourceId, forceRefresh)
{
	if (!type)
		type="js";
	if (forceRefresh)
		theURL+="?" + Date.parse(new Date());
	var attr, newNode;
	var head=document.getElementsByTagName("head")[0];
	if (type=="js")
	{
		newNode=document.createElement("script");
		newNode.type="text/javascript";
		attr="src";
	}
	else if (type=="css")
	{
		newNode=document.createElement("link");
		newNode.type="text/css";
		newNode.rel="stylesheet";
		attr="href";
	}
	if (resourceId)
	{
		old=document.getElementById(resourceId);
		if (old) old.parentNode.removeChild(old);
		delete old;
		newNode.id=resourceId;
	}
	newNode[attr]=theURL;
	return head.appendChild(newNode);
};

/**
 * @ignore
 * @param {Object} theURL
 * @param {Object} parameters
 * @param {Object} element
 * @param {Object} incremental
 * @param {Object} completedFunction
 * @param {Object} loadingFunction
 */
aV.AJAX.loadSelectOptions=function(theURL, parameters, element, incremental, completedFunction, loadingFunction)
{
	
};

/**
 * Sends the form data using AJAX when the form's onSubmit event is triggered.
 * @return {Boolean} Returns always false to prevent "real" submission.
 * @param {Object} event
 */
aV.AJAX.sendForm=function(event)
{
	var form=event.target;
/*
	if (checkRequiredFormElements)
		if (!checkRequiredFormElements(form))
		return false;
*/	
	var params={};
	for (var i = 0; i < form.elements.length; i++) 
	{
		if (form.elements[i].type=='submit' || form.elements[i].value=='' || ((form.elements[i].type=='checkbox' || form.elements[i].type=='radio') && form.elements[i].checked==false))
			continue;
		params[form.elements[i].name] = form.elements[i].value;
		form.elements[i].oldDisabled=form.elements[i].disabled;
		form.elements[i].disabled=true;
	}
	
	var completedFunction=function(requestObject)
	{
		for (var i = 0; i < form.elements.length; i++) 
			form.elements[i].disabled=form.elements[i].oldDisabled;
		if (form.callback)
			form.callback(requestObject);
	};
	
	aV.AJAX.makeRequest(form.method, form.action, params, completedFunction);
	return false;
};

/**
 * The current active requests number.
 * Changing this value is highly discouraged.
 *
 * @type integer
 */
aV.AJAX.activeRequestCount=0;

/**
 * Introduces some useful functions for XML parsing, which are returned by the XMLHttpRequest objects's responseXML property.
 * @namespace
 */
aV.AJAX.XML = {};
/**
 * Tries to extract the node value whose name is given with nodeName and is contained by mainItem node. Returns the defaultVal if any error occurs.
 *
 * @return {String} The value of the node whose name is given with nodeName and which is contained by mainItem node.
 * @param {Object} mainItem The main node item which holds the sub nodes and their values.
 * @param {String} nodeName Name of the sub node whose value will be extracted from the mainItem.
 * @param {String} [defaultVal] The default value which will be returned if the sub node whose name is given in nodeName is not found.
 */
aV.AJAX.XML.getValue=function(mainItem, nodeName, defaultVal)
{
	defaultVal=(defaultVal) ? defaultVal : "";
	var val;
	try
	{
		val=mainItem.getElementsByTagName(nodeName)[0].firstChild.nodeValue;
		val=(val!=undefined) ? val : defaultVal;
	}
	catch(e)
	{
		val=defaultVal;
	}
	finally
	{
		return val;
	}
};

/**
 * Tries to set the node value whose name is given with nodeName and is contained by mainItem node. Returns false if any error occurs.
 *
 * @return {String} The value set by the function is returned. If an error occures, the function returns false.
 * @param {Object} mainItem The main node item which holds the sub nodes and their values.
 * @param {String} nodeName Name of the sub node whose value will be set.
 * @param {String} val The new value of the sub node whose name is given in nodeName.
 */
aV.AJAX.XML.setValue=function(mainItem, nodeName, val)
{
	try
	{
		mainItem.getElementsByTagName(nodeName)[0].firstChild.nodeValue=val;
		return val;
	}
	catch(e)
	{
		return false;
	}
};

/**
 * Converts an element/node collection, which acts as an array usually, to an actual array and returns it, which allows developers to use array-spesific functions.
 *
 * @return {HTMLElementObject[]} The array version of the given collection.
 * @param {HTMLCollectionObject} collection The collection which will be converted to array.
 */
aV.AJAX.XML.toArray=function(collection)
{
	var result = new Array();
	for (i = 0; i < collection.length; i++)
		result.push(collection[i]);
	return result;
};

window.onbeforeunload=aV.AJAX.checkActiveRequests;
