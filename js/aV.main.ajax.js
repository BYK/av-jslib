/**
 * @fileOverview A function-based AJAX library which also comes with useful XML functions such as <a href="#aV.AJAX.XML.getValue">aV.AJAX.XML.getValue</a> and <a href="#aV.AJAX.XML.setValue">aV.AJAX.XML.setValue</a>.
 * @name Core AJAX and XML Library
 *
 * @author Burak Yiğit KAYA	byk@amplio-vita.net
 * @version 1.6
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

if (!aV.config.AJAX)
	aV.config.AJAX={};
/**
 * Holds the configuration parameters.
 */
aV.config.AJAX.unite(
	{
		noAjax: "You need an AJAX supported browser to use this page.",
		loadImgPath: "/JSLib/images/loading.gif",
		loadingText: "<br><center><img src=\"/JSLib/images/loading.gif\">Loading, please wait...</center>",
		pageLeaveWarning: "There are one or more requests in progress. If you exit, there might be data loss.",
		blankPageURL: "/JSLib/blank.html"
	}
, false);

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
		catch(error)
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
		catch(error)
		{
			try
			{
				requestObject = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch(error)
			{
				requestObject = false;
			}
		}
	}
	return requestObject;
};

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
		requestObject=undefined;
	}
};

aV.AJAX.createCrossDomainRequestObject=function()
{
	var requestObject={};
	var callBackUrl=window.location.protocol + '//' + window.location.host + '/' + aV.config.AJAX.blankPageURL;
	requestObject.$$guid=aV.AJAX._crossDomainRequestLastGuid++;
	requestObject._container=document.createElement("span");
	requestObject._container.innerHTML='<iframe style="display:none" id="aVAJAXFrame' + requestObject.$$guid + '" name="aVAJAXFrame' + requestObject.$$guid + '" onload="this.loaded()"></iframe>';
	requestObject._container.iframe=requestObject._container.firstChild;
	requestObject._container.iframe.loaded=function()
	{
		if (!requestObject.status)
		{
			requestObject.status=200;
			this.contentWindow.location = callBackUrl;
			return;
		}
		requestObject.responseText=this.contentWindow.name;
		try
		{
			if (window.DOMParser)
				requestObject.responseXML=(new DOMParser()).parseFromString(requestObject.responseText, "application/xml");
			else if (window.ActiveXObject)
			{
				requestObject.responseXML=new ActiveXObject("Microsoft.XMLDOM");
				requestObject.responseXML.async=false;
				requestObject.responseXML.loadXML(requestObject.responseText);
			}
			else
				throw new Error("Cannot find an XML parser!");
		}
		catch(error)
		{
			requestObject.responseXML=null;
		}
		requestObject.readyState=4;
		requestObject._doReadyStateChange();

		setTimeout(function(){document.body.removeChild(requestObject._container); delete requestObject._container;}, 0);
	};
	
	requestObject.readyState=1;
	requestObject.status=0;
	
	requestObject._doReadyStateChange=function()
	{
		if (requestObject.onreadystatechange)
			requestObject.onreadystatechange({type: "readystatechange", target: requestObject});
	};

	requestObject.open=function(method, address)
	{
		if (this._container.form)
			this._container.removeChild(this._container.form);

		this._container.form=this._container.appendChild(document.createElement("form"));
		this._container.form.style.display='none';
		this._container.form.target=requestObject._container.iframe.name;
		this._container.form.method=method;
		this._container.form.action=address;
		requestObject.readyState=2;
		requestObject._doReadyStateChange();
	};
	
	requestObject.setRequestHeader=function(header, value)
	{
		header=header.toLowerCase();
		header=aV.AJAX.headerTranslations[header];
		if (!(this._container.form && (header in this._container.form)))
			return false;
		this._container.form[header]=value;
		return true;
	};
	
	requestObject.send=function(parameters)
	{
		parameters=(parameters)?parameters.split('&'):[];
		var matcher=/^([^&=]+)=([^&]+)$/;
		var pair, parameterObj;
		for (var i = 0; i < parameters.length; i++) 
		{
			pair = parameters[i].match(matcher);
			if (!(pair && pair[1]))
				continue;
			parameterObj = document.createElement("input");
			parameterObj.type = "hidden";
			parameterObj.name = pair[1];
			parameterObj.value = decodeURIComponent(pair[2]);
			this._container.form.appendChild(parameterObj);
		}
		requestObject.readyState=3;
		requestObject._doReadyStateChange();
		this._container.form.submit();
	};
	
	document.body.appendChild(requestObject._container);	
	
	return requestObject;
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
 * Creates a new XMLHttpRequest object which connects to the address, which includes the URI encoded and merged GET parameters.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @return {XMLHttpRequestObject}
 * @param {String} address The address of the page which will be connected. Should include the URI encoded GET parameters.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 */
aV.AJAX.makeGetRequest=function(address, changeFunction, crossDomain)
{
	var requestObject = (crossDomain)?this.createCrossDomainRequestObject():this.createRequestObject(); //try to create an XMLHttpRequest object
	if (requestObject) //if the XMLHttpRequest object is valid
	{
		requestObject.open("GET", address, true); //set the address and HTTP method to GET
		requestObject.onreadystatechange = function()
		{
			try
			{
				if (changeFunction) //if there is an assigned changeFunction, assign it to the onreadystatechange event specially, that it recieves the XMLHttpRequest object as its parameter		
					changeFunction(requestObject);
			}
			catch(error)
			{
				if (window.onerror)
					window.onerror(error.message, error.fileName, error.lineNumber);
			}
			finally
			{
				if (requestObject.readyState==4)
				{
					aV.AJAX.activeRequestCount--;
					requestObject=undefined;
				}
			}
		};
		requestObject.send((crossDomain)?'&windowname=true':null); //start the request
		aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return requestObject; //return the created XMLHttpRequest object for any further use
};

/**
 * Creates a new XMLHttpRequest object which posts the given URI query string to the given address.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @return {XMLHttpRequestObject}
 * @param {String} address The address of the page which will be connected. Should  NOT include any parameters.
 * @param {String} parameters The URI encoded and merged POST parameters for the HTTP request.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 */
aV.AJAX.makePostRequest=function(address, parameters, changeFunction, crossDomain)
{
	var requestObject = (crossDomain)?this.createCrossDomainRequestObject():this.createRequestObject(); //try to create a XMLHttpRequest object
	if (requestObject) //if XMLHttpRequest object is valid
	{
		requestObject.open("POST", address, true); //set the address and HTTP method to GET
		requestObject.onreadystatechange = function()
		{
			try
			{
				if (changeFunction) //if there is an assigned changeFunction, assign it to the onreadystatechange event specially, that it recieves the XMLHttpRequest object as its parameter		
					changeFunction(requestObject);
			}
			catch(error)
			{
				if (window.onerror)
					window.onerror(error.message, error.fileName, error.lineNumber);
			}
			finally
			{
				if (requestObject.readyState==4)
				{
					aV.AJAX.activeRequestCount--;
					requestObject=undefined;
				}
			}
		};
		if (!parameters)
			parameters='';
		requestObject.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    requestObject.setRequestHeader("Content-length", parameters.length);
    requestObject.setRequestHeader("Connection", "close");
		//set some headers for POST method
		if (crossDomain)
			parameters+='&windowname=true';
		requestObject.send(parameters); //send the request with parameters attached
		aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return requestObject; //return the created XMLHttpRequest object for any further use
};

aV.AJAX.isCrossDomain=function(url)
{
	var matchResult=url.match(/^\w+:\/\/([^\/@ ]+)/i);
	var domain=(matchResult)?matchResult[1]:null;
	return (domain && (domain!=document.domain));
};

/**
 * Takes "GET" or "POST" as method parameter and then according to this, creates a SELF-MANAGED
 * XMLHttpRequest object using internal makeGetRequest or makePostRequest according to the method parameter.
 * Developers are strongly recommended to use THIS function instead of the above POST and GET specific functions.
 *
 * @return {XMLHttpRequestObject} The newly created XMLHttpRequest object for this specific AJAX call.
 * @param {String} method Should be either POST or GET according to the type of the HTTP request.
 * @param {String} address The address of the page which will be connected. Should  NOT include any parameters.
 * @param {String | Object} parameters The parameters which are either URI encoded and merged or given in the JSON format
 * @param {Function(XMLHttpRequestObject)} [completedFunction] The function which will be called when the HTTP call is completed. (readyState==4)
 * @param {Function(XMLHttpRequestObject)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4. Might be called several times before the call is completed.
 */
aV.AJAX.makeRequest=function(method, address, parameters, completedFunction, loadingFunction)
{
	var crossDomain=aV.AJAX.isCrossDomain(address);
	var triggerFunction=function (requestObject) //define the custom changeFunction as triggerFunction
	{
		if (requestObject.readyState == 4 && completedFunction) //if the request is finished and there is a  completedFunction assigned
			completedFunction(requestObject); //call the completedFunction sending the requestObject as its parameter
		else if (loadingFunction) //if request is in progress and there is an assigned loadingFunction
			loadingFunction(requestObject); //call the loadingFunction passing the requestObject as its parameter
	}; //finished defining the custom changeFunction
	//checking parameters
	if (!parameters)
		parameters='';
	if (parameters.constructor==Object)
		parameters=parameters.toQueryString();
	
	if (method.toUpperCase()=="GET") //if requested method is GET, then call the aV.AJAX.makeGetRequest function
		return this.makeGetRequest(address + ((parameters)?'?' + parameters:''), triggerFunction, crossDomain);
	else if (method.toUpperCase()=="POST") //else if requested method is POST, then call the aV.AJAX.makePostRequest function
		return this.makePostRequest(address, parameters, triggerFunction, crossDomain);
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
 * @param {String} address The URL of the content which will be loaded dynamically into the given container.
 * @param {String|Object} element The container element itself or its id, which the dynamic content will be loaded into.
 * @param {Function(Object, String)} [completedFunction] The function which will be called when the loading of the content is finished. It is called with the target container element and the URL as parameters.
 * @param {Function(Object, String)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4 while loading the dynamic content. It is called with the target container element and the URL as parameters.
 */
aV.AJAX.loadContent=function(address, element, completedFunction, loadingFunction)
{
	var crossDomain=aV.AJAX.isCrossDomain(address);
	if (typeof(element)=='string') //if id of the object is given instead of the object itself
		element=document.getElementById(element); //assign the element the object corresponding to the given id
	var triggerFunction = function(requestObject) //define the custom changeFunction
	{
		if (requestObject.readyState == 4) //if the request is finished
		{
			element.innerHTML=requestObject.responseText; //fill the element's innerHTML with the returning data
			if (completedFunction) //if a callback function assigned to *callbackFunc*
				completedFunction(element, address); //call it with the element object and the given URL as its parameters
		}
		else
		{
			if (loadingFunction) //if a custom loadingFunction is assigned
				loadingFunction(element, address); //call it with the element object and the given URL as its parameters
			else if (aV.config.AJAX.loadingText)
				element.innerHTML=aV.config.AJAX.loadingText; //set the given element's innerHTML the loading text to inform the user
		}
	};
	return this.makeGetRequest(address, triggerFunction, crossDomain); //make the GET request and return the used XMLHttpRequest object
};

/**
 * Loads an external style-sheet or Javascript file on-demand.
 * Removes the old node if a resourceId is given.
 * 
 * @return {HTMLElementObject} The newly added script or link DOM node.
 * @param {String} address The address of the resource-to-be-loaded.
 * @param {String} [type="js"] The type of the resource.
 * Should be either js or css.
 * @param {String} [resourceId]	The id which will be assigned to newly created DOM node.
 * If not given, no id is assigned to the created node.
 * @param {Boolean} [forceRefresh] Addes a "?time" value at the end of the file URL to force the browser reload the file and not to use cache.
 */
aV.AJAX.loadResource=function(address, type, resourceId, forceRefresh)
{
	if (!type)
		type="js";
	if (forceRefresh)
		address+="?" + Date.parse(new Date());
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
	newNode[attr]=address;
	return head.appendChild(newNode);
};

/**
 * @ignore
 * @param {Object} address
 * @param {Object} parameters
 * @param {Object} element
 * @param {Object} incremental
 * @param {Object} completedFunction
 * @param {Object} loadingFunction
 */
aV.AJAX.loadSelectOptions=function(address, parameters, element, incremental, completedFunction, loadingFunction)
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

aV.AJAX._crossDomainRequestLastGuid=1;

aV.AJAX.headerTranslations=
{
	'content-type': 'enctype',
	'accept-charset': 'acceptCharset',
	'accept-language': 'lang'
};

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
	catch(error)
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
	catch(error)
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

aV.AJAX.XML.toObject=function(source, includeRoot)
{
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
				result[source.tagName].push(aV.AJAX.XML.toObject(source));
			}
			else
				result[source.tagName] = aV.AJAX.XML.toObject(source);
		}
		else 
			result = source.nodeValue;
		source=source.nextSibling;
	}

	return result;
};

window.onbeforeunload=aV.AJAX.checkActiveRequests;
