/**
 * @fileOverview A functional AJAX library
 * @name aV.main.ajax
 *
 * @author Burak Yiğit KAYA	<byk@ampliovitam.com>
 * @version 1.8
 * 
 * @requires aV.ext.object
 * @requires aV.ext.string
 * @requires aV.ext.array
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!window.aV)
	var aV = {config: {}};
	
/**
 * Represents the namespace, aV.AJAX, for the core AJAX functions.
 *
 * @namespace
 */
aV.AJAX = {};

if (!aV.config.AJAX)
	/**
	 * @namespace
	 * Holds the configuration parameters for aV.AJAX.
	 */
	aV.config.AJAX = {};

aV.config.AJAX.unite(
	{
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The error, wchich will be shown to the user if his/her browser does not support XMLHTTPRequest object.
		 */
		noAjax: "You need an AJAX supported browser to use this page.",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The path of the "loading image" which will be used in various places like in the content of loadContent's target.
		 */
		loadImgPath: "/JSLib/images/loading.gif",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The HTML string which will be placed into the target of loadContent function.
		 */
		loadingText: "<img src=\"/JSLib/images/loading.gif\" style=\"border: none\">Loading, please wait...",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The warning message which will be displayed to the user when (s)he tries to leave the page while an AJAX request is in-progress. Set to false or '' to not to show any message.
		 */
		pageLeaveWarning: "There are one or more requests in progress. If you exit, there might be data loss.",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The path of the "blank.html" which is need for cross-domain requests.
		 */
		blankPageURL: "/JSLib/blank.html",
		defaultDomain: document.domain,
		defaultPath: document.location.pathname.substring(0, document.location.pathname.lastIndexOf('/') + 1),
		/**
		 * @memberOf aV.config.AJAX
		 * @type {Object} Contains the list of the data-parses to process the AJAX result into a native JavaScript object. You can add your data-type and data-parser to this object if you need.
		 */
		dataParsers:
		{
			'text/xml': function(requestObject)
			{
				return Object.fromXML(requestObject.responseXML);
			},
			'application/xml': function(requestObject)
			{
				return Object.fromXML(requestObject.responseXML);
			},
			'application/json': function(requestObject)
			{
				return Object.fromJSON(requestObject.responseText);
			},
			'application/compressed-json': function(requestObject)
			{
				return Object.fromJSON(eval(requestObject.responseText));
			}
		}
	},
	false
);

/**
 * Tries to create an XMLHttpRequest object, returns false if the browser does not support AJAX.
 * 
 * @deprecated You should not need to use this function directly, use {@link aV.AJAX.makeRequest} to make AJAX calls.
 * @return {XMLHttpRequestObject | false} A new XMLHttpRequest object or false.
 */
aV.AJAX.createRequestObject = function()
{
	var requestObject = false;
	if(window.XMLHttpRequest)
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
			requestObject = new ActiveXObject("MSXML2.XMLHTTP.3.0");
		}
		catch(error)
		{
			requestObject = false;
		}
	}
	return requestObject;
}

/**
 * Aborts the given XMLHttpRequest object safely.
 *
 * @param {XMLHttpRequestObject} requestObject The requestObject which will be destroyed
 */
aV.AJAX.destroyRequestObject = function(requestObject)
{
	if (requestObject)
	{
		if ((requestObject.readyState!=4) && (requestObject.readyState!=0))
			requestObject.abort();
	}
};

/**
 * Creates an interface which is nearly the same as native XMLHttpRequestObject for a cross-borwser request based on window.name method.
 * 
 * @deprecated You should not need to use this function directly, use {@link aV.AJAX.makeRequest} to make AJAX calls.
 * @return {XMLHttpRequestObject}
 */
aV.AJAX.createCrossDomainRequestObject = function()
{
	var requestObject = {};
	var callBackUrl = window.location.protocol + '//' + window.location.host + '/' + aV.config.AJAX.blankPageURL;
	requestObject.$$guid = aV.AJAX._crossDomainRequestLastGuid++;
	requestObject._container = document.createElement("span");
	requestObject._container.innerHTML = '<iframe style="display:none" id="aVAJAXFrame' + requestObject.$$guid + '" name="aVAJAXFrame' + requestObject.$$guid + '" onload="this.loaded()"></iframe>';
	requestObject._container.iframe = requestObject._container.firstChild;
	requestObject._container.iframe.loaded = function()
	{
		if (!requestObject.status)
		{
			requestObject.status = 200;
			this.contentWindow.location = callBackUrl;
			return;
		}
		requestObject.responseText = this.contentWindow.name;
		try
		{
			if (window.DOMParser)
				requestObject.responseXML = (new DOMParser()).parseFromString(requestObject.responseText, "application/xml");
			else if (window.ActiveXObject)
			{
				requestObject.responseXML = new ActiveXObject("Microsoft.XMLDOM");
				requestObject.responseXML.async = false;
				requestObject.responseXML.loadXML(requestObject.responseText);
			}
			else
				throw new Error("Cannot find an XML parser!");
		}
		catch(error)
		{
			requestObject.responseXML=null;
		}
		requestObject.readyState = 4;
		requestObject._doReadyStateChange();

		setTimeout(function(){document.body.removeChild(requestObject._container); delete requestObject._container;}, 0);
	};
	
	requestObject.readyState = 1;
	requestObject.status = 0;
	
	requestObject._doReadyStateChange = function()
	{
		if (requestObject.onreadystatechange)
			requestObject.onreadystatechange({type: "readystatechange", target: requestObject});
	};

	requestObject.open = function(method, address)
	{
		if (this._container.form)
			this._container.removeChild(this._container.form);

		this._container.form = this._container.appendChild(document.createElement("form"));
		this._container.form.style.display = 'none';
		this._container.form.target = requestObject._container.iframe.name;
		this._container.form.method = method;
		this._container.form.action = address;
		requestObject.readyState = 2;
		requestObject._doReadyStateChange();
	};
	
	requestObject.setRequestHeader = function(header, value)
	{
		header = header.toLowerCase();
		header = aV.AJAX.headerTranslations[header];
		if (!(this._container.form && (header in this._container.form)))
			return false;
		this._container.form[header] = value;
		return true;
	};
	
	requestObject.send = function(parameters)
	{
		parameters = (parameters) ? parameters.split('&') : [];
		var matcher = /^([^&=]+)=([^&]+)$/;
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
		requestObject.readyState = 3;
		requestObject._doReadyStateChange();
		this._container.form.submit();
	};
	
	document.body.appendChild(requestObject._container);	
	
	return requestObject;
};

/**
 * This function is assigned to the page's onbeforeunload event for pageLeaveWarning feature.
 * See aV.config.AJAX.pageLeaveWarning
 *
 * @deprecated Should not be called directly, it is for the page's onbeforeunload event.
 * @return {String | null} pageLeaveWarning config variable or null
 */
aV.AJAX.checkActiveRequests = function()
{
	if (aV.config.AJAX.pageLeaveWarning && aV.AJAX.activeRequestCount>0)
		return aV.config.AJAX.pageLeaveWarning;
};

aV.AJAX.assureDomain = function(address)
{
	return (address.match(/https?:\/\//)) ? address : document.location.protocol + '//' + aV.config.AJAX.defaultDomain + ((address.charAt(0) == '/') ? '' : aV.config.AJAX.defaultPath) + address;
}

/**
 * Creates a new XMLHttpRequest object which connects to the address, which includes the URI encoded and merged GET parameters.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @param {String} address The address of the page which will be connected. Should include the URI encoded GET parameters.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 * @param {Boolean} [crossDomain=false] If true, aV.createCrossDomainRequestObject function is used to create the request object.
 * @return {XMLHttpRequestObject} The created XMLHttpRequest.
 */
aV.AJAX.makeGetRequest = function(address, changeFunction, headers, crossDomain, warnOnPageLeave)
{
	var requestObject = (crossDomain) ? this.createCrossDomainRequestObject() : this.createRequestObject(); //try to create an XMLHttpRequest object
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
				if (requestObject.readyState == 4)
				{
					if (warnOnPageLeave !== false)
						aV.AJAX.activeRequestCount--;
				}
			}
		};

		if (headers)
			for (var header in headers)
				if (headers.hasOwnProperty(header))
					requestObject.setRequestHeader(header, headers[header]);
					
		requestObject.send((crossDomain) ? '&windowname=true' : null); //start the request
		if (warnOnPageLeave !== false)
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
 * @param {String} address The address of the page which will be connected. Should  NOT include any parameters.
 * @param {String} parameters The URI encoded and merged POST parameters for the HTTP request.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 * @param {Boolean} [crossDomain=false] If true, aV.createCrossDomainRequestObject function is used to create the request object.
 * @return {XMLHttpRequestObject} The created request object.
 */
aV.AJAX.makePostRequest = function(address, parameters, changeFunction, headers, crossDomain, warnOnPageLeave)
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
				if (requestObject.readyState == 4)
				{
					if (warnOnPageLeave !== false)
						aV.AJAX.activeRequestCount--;
				}
			}
		};
		if (!parameters)
			parameters = '';
			
		if (crossDomain)
			parameters += '&windowname=true';

		headers = (headers || {}).unite({'Content-type': 'application/x-www-form-urlencoded'});
		for (var header in headers)
			if (headers.hasOwnProperty(header))
				requestObject.setRequestHeader(header, headers[header]);

		requestObject.send(parameters); //send the request with parameters attached
		if (warnOnPageLeave !== false)
			aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return requestObject; //return the created XMLHttpRequest object for any further use
};

/**
 * Determines wheter the given URL is outside of the current domain or not.
 * 
 * @param {String} url The URL to be tested.
 * @return {Boolean} Returns true if the URL is outside of the current domain.
 */
aV.AJAX.isCrossDomain = function(url)
{
	var matchResult = url.match(/^\w+:\/\/([^\/@ ]+)/i);
	var domain = (matchResult) ? matchResult[1] : null;
	return (domain && (('.' + domain).indexOf('.' + document.domain) < 0));
};

/**
 * Takes "GET" or "POST" as method parameter and then according to this, creates a SELF-MANAGED
 * XMLHttpRequest object using internal makeGetRequest or makePostRequest according to the method parameter.
 * Developers are strongly recommended to use THIS function instead of the above POST and GET specific functions.
 *
 * @param {String} method Should be either "POST" or "GET" according to the type of the HTTP request.
 * @param {String} address The address of the page which will be connected. Should  NOT include any parameters.
 * @param {String | Object} parameters The parameters which are either URI encoded and merged or given in the JSON format
 * @param {Function(XMLHttpRequestObject)} [completedFunction] The function which will be called when the HTTP call is completed. (readyState==4)
 * @param {Function(XMLHttpRequestObject)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4. Might be called several times before the call is completed.
 * @return {XMLHttpRequestObject} The newly created XMLHttpRequest object for this specific AJAX call.
 */
aV.AJAX.makeRequest = function(method, address, parameters, completedFunction, loadingFunction, headers, warnOnPageLeave)
{
	var crossDomain = aV.AJAX.isCrossDomain(address);
	var triggerFunction = function (requestObject) //define the custom changeFunction as triggerFunction
	{
		if (requestObject.readyState == 4 && completedFunction) //if the request is finished and there is a  completedFunction assigned
		{
			var rangeInfo = aV.AJAX.getRangeInfo(requestObject);
			var handlerResult = completedFunction(requestObject, rangeInfo);
			if (handlerResult !== false && rangeInfo && (rangeInfo.start <= rangeInfo.end) && (isNaN(rangeInfo.total) || ((rangeInfo.end + 1) < rangeInfo.total))) 
			{
				var newRangeEnd = 2 * rangeInfo.end - rangeInfo.start + 1;
				if (!isNaN(rangeInfo.total)) 
					newRangeEnd = Math.min(newRangeEnd, rangeInfo.total - 1);
				
				headers = (headers ||	{}).unite({'Range': '%s=%s-%s'.format(rangeInfo.type, rangeInfo.end + 1, newRangeEnd)});
				aV.AJAX.makeRequest(method, address, parameters, completedFunction, loadingFunction, headers, warnOnPageLeave);
			}
		}
		else if (loadingFunction && !requestObject.loadingFunctionTriggered) 
		{
			loadingFunction(requestObject);
			requestObject.loadingFunctionTriggered = true;
		}
	};
	
	if (!parameters)
		parameters = '';
	if (parameters.constructor == Object)
		parameters = parameters.toQueryString();
	
	if (method.toUpperCase() == "GET") //if requested method is GET, then call the aV.AJAX.makeGetRequest function
		return this.makeGetRequest(address + ((parameters) ? '?' + parameters : ''), triggerFunction, headers, crossDomain, warnOnPageLeave);
	else if (method.toUpperCase() == "POST") //else if requested method is POST, then call the aV.AJAX.makePostRequest function
		return this.makePostRequest(address, parameters, triggerFunction, headers, crossDomain, warnOnPageLeave);
	else //if requested method is invalid, return false
		return false;
};

/**
 * Tries to extract the mime-type from the requestObjects "Content-type" header.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @return {String} The extracted mime type or 'text/plain' as default.
 */
aV.AJAX.getMimeType = function(requestObject)
{
	var responseMimeType = ("getResponseHeader" in requestObject) ? requestObject.getResponseHeader("Content-Type") : 'text/plain';
	return responseMimeType.substring(0, (responseMimeType.indexOf(';') + responseMimeType.length + 1) % (responseMimeType.length + 1)).toLowerCase();	
};

/**
 * Tries to extract the encoding from the requestObjects "Content-type" header.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @return {String} The extracted encoding or 'utf-8' as default.
 */
aV.AJAX.getEncoding = function(requestObject)
{
	var result = requestObject.getResponseHeader("Content-Type").match(/charset=(.+)/i);
	return (result) ? result[1].toLowerCase() : 'utf-8';	
};

aV.AJAX.getRangeInfo = function(requestObject)
{
	if (requestObject.status != 206 || !("getResponseHeader" in requestObject))
		return false;

	var rangeInfo = requestObject.getResponseHeader("Content-Range").trim();
	rangeInfo = rangeInfo.match(/(\w+)\s+(\d+)\-(\d+)\/(\d+|\*)/);
	if (rangeInfo) 
		rangeInfo = 
		{
			type: rangeInfo[1],
			start: parseInt(rangeInfo[2]),
			end: parseInt(rangeInfo[3]),
			total: parseInt(rangeInfo[4])
		};
	return rangeInfo;
};

/**
 * Checks the given requestObject for successfull return by means of HTTP status, non-empty responseText and if given mime-type.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @param {String} [mimeType] The mime-type which will be checked on.
 * @return {Boolean} Returns true if all the conditions are staisfied for a successfull response, false otherwise.
 */
aV.AJAX.isResponseOK = function(requestObject, mimeType)
{
	var result = (Math.floor(requestObject.status/100) == 2 && requestObject.responseText);
	if (result)
	{
		var rangeInfo = aV.AJAX.getRangeInfo(requestObject);
		if (rangeInfo)
			result = (rangeInfo.start >= 0) && (rangeInfo.end >= rangeInfo.start) && (rangeInfo.end < rangeInfo.total || isNaN(rangeInfo.total));

		if (mimeType) 
		{
			if (!(mimeType instanceof Array))
				mimeType = [mimeType];
			result = (mimeType.indexOf(aV.AJAX.getMimeType(requestObject)) > -1);
		}
	}
	return result;
};

/**
 * AUto parses the given requestObject's data using the dataParsers available in the config according to the response's mime-type.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @return {Object} The native JAvaScript object which is parsed via the appropriate data parser.
 */
aV.AJAX.getResponseAsObject = function(requestObject)
{
	var mimeType = aV.AJAX.getMimeType(requestObject);
	return aV.config.AJAX.dataParsers[(mimeType in aV.config.AJAX.dataParsers) ? mimeType : 'application/json'](requestObject);
};

/**
 * Loads content to the given container element using an asynchronous HTTP GET call.
 * If the aV.config.AJAX.loadingText is defined, target container element's innerHTML is filled with its value while the content is loading.
 *
 * @param {String} address The URL of the content which will be loaded dynamically into the given container.
 * @param {String|Object} element The container element itself or its id, which the dynamic content will be loaded into.
 * @param {Function(Object, String)} [completedFunction] The function which will be called when the loading of the content is finished. It is called with the target container element and the URL as parameters.
 * @param {Function(Object, String)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4 while loading the dynamic content. It is called with the target container element and the URL as parameters.
 * @return {XMLHttpRequestObject} The created XMLHttoRequestObject.
 */
aV.AJAX.loadContent = function(address, element, completedFunction, loadingFunction, cancelDOMReady)
{
	var crossDomain = aV.AJAX.isCrossDomain(address);
	if (typeof(element) == 'string') //if id of the object is given instead of the object itself
		element = document.getElementById(element); //assign the element the object corresponding to the given id
	var triggerFunction = function(requestObject) //define the custom changeFunction
	{
		if (requestObject.readyState == 4) //if the request is finished
		{
			element.innerHTML = requestObject.responseText; //fill the element's innerHTML with the returning data
			if (completedFunction) //if a callback function assigned to *callbackFunc*
				completedFunction(element, address); //call it with the element object and the given URL as its parameters
			if (!cancelDOMReady)
				aV.Events.trigger(window, 'domready', {caller: element});
		}
		else
		{
			if (loadingFunction) //if a custom loadingFunction is assigned
				loadingFunction(element, address); //call it with the element object and the given URL as its parameters
			else if (aV.config.AJAX.loadingText)
				element.innerHTML = aV.config.AJAX.loadingText; //set the given element's innerHTML the loading text to inform the user
		}
	};
	return this.makeGetRequest(address, triggerFunction, false, crossDomain, false); //make the GET request and return the used XMLHttpRequest object
};

/**
 * Loads an external style-sheet or Javascript file on-demand.
 * Removes the old node if a resourceId is given.
 * 
 * @param {String} address The address of the resource-to-be-loaded.
 * @param {String} [type="js"] The type of the resource. Should be either js or css.
 * @param {String} [resourceId]	The id which will be assigned to newly created DOM node. If not given, no id is assigned to the created node.
 * @param {Boolean} [forceRefresh=false] Addes a "?time" value at the end of the file URL to force the browser reload the file and not to use cache.
 * @return {HTMLElementObject} The newly added script or link DOM node.
 */
aV.AJAX.loadResource = function(address, type, resourceId, forceRefresh, documentObject)
{
	if (!documentObject)
		documentObject = window.document;

	address = aV.AJAX.assureDomain(address);
	if (!type)
		type = "js";
	if (forceRefresh)
		address += "?" + Date.parse(new Date());
	var attr, newNode;
	var head = documentObject.getElementsByTagName("head")[0];
	if (type == "js")
	{
		newNode = documentObject.createElement("script");
		newNode.type = "text/javascript";
		attr = "src";
	}
	else if (type == "css")
	{
		newNode = documentObject.createElement("link");
		newNode.type = "text/css";
		newNode.rel = "stylesheet";
		attr = "href";
	}
	if (resourceId)
	{
		var old = documentObject.getElementById(resourceId);
		if (old) old.parentNode.removeChild(old);
		newNode.id = resourceId;
	}
	newNode[attr] = address;
	return head.appendChild(newNode);
};

/**
 * @ignore
 */
aV.AJAX.activeRequestCount = 0;

/**
 * @ignore
 */
aV.AJAX._crossDomainRequestLastGuid = 1;

/**
 * @ignore
 */
aV.AJAX.headerTranslations =
{
	'content-type': 'enctype',
	'accept-charset': 'acceptCharset',
	'accept-language': 'lang'
};

/**
 * @ignore
 */
window.onbeforeunload=aV.AJAX.checkActiveRequests;