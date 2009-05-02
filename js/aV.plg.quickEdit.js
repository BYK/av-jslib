/**
 * @fileOverview	Allows non obtrusive in-place-editing functionality for both images and text based elements.
 * @name aV.QuickEdit
 *
 * @author	Burak Yiğit KAYA	<byk@amplio-vita.net>
 * @version	2.2
 *
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.ext.string.js">aV.ext.string.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.events.js">aV.main.events.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.aParser.js">aV.main.aParser.js</a> 	
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.plg.quickEdit.js@" + window.location.href);

if (!aV.Events)
	throw new Error("aV event manager library is not loaded.", "aV.plg.quickEdit.js@" + window.location.href);

if (!aV.AJAX)
	throw new Error("aV AJAX functions library is not loaded.", "aV.plg.quickEdit.js@" + window.location.href);

if (!aV.aParser)
	throw new Error("aV aParser functions library is not loaded.", "aV.plg.quickEdit.js@" + window.location.href);

if (!aV.Visual)
	throw new Error("aV visual functions library is not loaded.", "aV.plg.quickEdit.js@" + window.location.href);

/**
 * Represents a namespace, aV.QuickEdit, for the new functions and global parameters of those functions.
 *
 * @namespace
 */
aV.QuickEdit = {};

aV.config.QuickEdit=
{
	texts: 
	{
		closeButtonHTML: '<sup>x</sup>',
		loadingDivHTML: '<img src="/JSLib/images/loading.gif" alt="Uploading..." />',
		imgUploadTitle: "Please select new image",
		defaultErrorMessage: "An error occurred sending the changes you have made. Please try again."
	},
	classNames:
	{
		editableElement: 'aVqE_editable',
		editee: 'aVqE_editee',
		editor: 'aVqE_editor',
		uploadBox: 'aVqE_uploadBox',
		uploadBoxTitle: 'aVqE_uploadBoxTitle',
		uploadBoxTitleText: 'aVqE_uploadBoxTitleText',
		uploadBoxCloseButton: 'aVqE_uploadBoxCloseButton',
		uploadBoxForm: 'aVqE_uploadBoxForm',
		uploadBoxLoadingDiv: 'aVqE_uploadBoxLoadingDiv'
	},
	idFormats:
	{
		uploadBox: 'aVqE_uploadBox-%s',
		uploadBoxIFrame: 'aVqE_uploadBoxIFrame-%s',
		uploadBoxForm: 'aVqE_uploadBoxForm-%s',
		uploadBoxLoadingDiv: 'aVqE_uploadBoxLoadingDiv-%s'
	},
	editors:
	{
		"default": 
		{
			constructor: function(element)
			{
				var editor=document.createElement("INPUT");
				editor.value=editor.originalValue=aV.QuickEdit.getElementValue(element);
				element.aVquickEdit.oldInnerHTML=element.innerHTML;
				element.innerHTML='';
				return element.appendChild(editor);			
			},
			eventHandlers:
			{
				blur: function(event) 
				{
					if (event.target.value == event.target.originalValue/* || !event.target.value*/) 
					{
						event.target.editee.aVquickEdit.active = false;
						event.target.editee.onmouseout({type: "mouseout",	target: event.target.editee});
						event.target.editee.innerHTML = event.target.editee.aVquickEdit.oldInnerHTML;
					}
					else 
					{
						event.target.disabled=true;
						aV.QuickEdit._makeSetRequest(event.target, event.target.value);
					}
				},
				keydown: function(event)
				{
					var key = event.keyCode;
					if (key == 27) 
					{
						event.target.value = event.target.originalValue;
						event.target.blur();
					}
					else if (key == 13 && event.target.tagName.toLowerCase()=='input') 
					{
						event._type='blur';
						event.target.onblur(event);
					}
				},
				setresponse: function(event)
				{
					var responseObject=aV.AJAX.getResponseAsObject(event.requestObject);
					var editee=event.target.editee;
					if (responseObject && responseObject.type!='error')
					{
						editee.aVquickEdit.active=false;
						event.target.editee=undefined;
						if (aV.QuickEdit.triggerEvent("endedit", {target: editee, responseText: event.responseText, responseObject: responseObject, editor: event.target}, editee)===false)
							return false;
						aV.QuickEdit.setElementValue(editee, responseObject.value);
						editee.onmouseout({type: "mouseout", target: editee});
						aV.QuickEdit.triggerEvent("afteredit", {target: editee}, editee);
					}
					else
					{
						event.target.disabled=false;
						aV.QuickEdit.triggerEvent("editerror", {target: event.target.editee, responseText: event.responseText, responseObject: responseObject, editor: event.target});
					}
				}
			}
		},
		textarea:
		{
			constructor: function(element)
			{
				var editor=document.createElement("TEXTAREA");
				editor.value=editor.originalValue=aV.QuickEdit.getElementValue(element);
				editor.style.height=(element.scrollHeight - 4) + "px";
				element.aVquickEdit.oldInnerHTML=element.innerHTML;
				element.innerHTML='';
				return element.appendChild(editor);
			},
			eventHandlers:
			{
				blur: function(event)
				{
					return aV.config.QuickEdit.editors['default'].eventHandlers.blur(event);
				},
				keydown: function(event)
				{
					return aV.config.QuickEdit.editors['default'].eventHandlers.keydown(event);
				},
				keyup: function(event)
				{
					if (event.target.scrollHeight>event.target.clientHeight)
						event.target.style.height=(event.target.scrollHeight) + "px";
				},
				setresponse: function(event)
				{
					return aV.config.QuickEdit.editors['default'].eventHandlers.setresponse(event);
				}
			}
		},
		select: 
		{
			constructor: function(element)
			{
				if ((typeof element.aVquickEdit.selectValues != "string") && !(element.aVquickEdit.selectValues instanceof Array) && !(element.aVquickEdit.selectValues instanceof Object)) 
					return false;
				var editor = document.createElement("SELECT");
				var selectValues = element.aVquickEdit.selectValues;

				if (typeof selectValues == "string")
					selectValues=Object.fromJSON(selectValues);

				if (selectValues instanceof Array) 
				{
					var temp={};
					for (var i = 0; i < selectValues.length; i++) 
						temp[selectValues[i]] = selectValues[i];
					selectValues = temp;
				}
				
				for (var value in selectValues) 
					if (selectValues.hasOwnProperty(value)) 
						editor.add(new Option(value, selectValues[value]), undefined);
				
				editor.value = editor.originalValue = aV.QuickEdit.getElementValue(element);
				element.aVquickEdit.oldInnerHTML = element.innerHTML;
				element.innerHTML = '';
				return element.appendChild(editor);
			}
		},
		image:
		{
			constructor: function(element)
			{
				var editor=document.createElement("div");
				editor.className=aV.config.QuickEdit.classNames.uploadBox;
				element.aVquickEdit.editorGuid=aV.QuickEdit.uploadBoxCount++;
				editor.id=aV.config.QuickEdit.idFormats.uploadBox.format(element.aVquickEdit.editorGuid); //assign the unique upload div id
				
				//start defining the onload function of the upcoming iframe in text format for compatibility with IE
				var onloadFunc="var responseText=(this.contentDocument)?this.contentDocument.body.innerHTML:this.contentWindow.document.body.innerHTML;if(!responseText)return;var destroyContainer=true;if(this.parentNode.onsetresponse)destroyContainer=this.parentNode.onsetresponse({type: 'setresponse', target: this.parentNode, responseText: responseText});if(destroyContainer)setTimeout('aV.config.QuickEdit.editors.image.destructor(' + this.parentNode.editee.aVquickEdit.editorGuid + ')', 0);";

				//prepare the inner visual structure of the uploadBox container div - this part might be customized
				var inHTML='<div class="%s">'.format(aV.config.QuickEdit.classNames.uploadBoxTitle);
				inHTML+='<div class="%s">%s</div>'.format(aV.config.QuickEdit.classNames.uploadBoxTitleText, aV.config.QuickEdit.texts.imgUploadTitle);
				inHTML+='<div class="%s" onclick="aV.config.QuickEdit.editors.image.destructor(%s)">%s</div>'.format(aV.config.QuickEdit.classNames.uploadBoxCloseButton, element.aVquickEdit.editorGuid, aV.config.QuickEdit.texts.closeButtonHTML);
				inHTML+='</div>';
				
				//add the necessary hidden iframe code
				inHTML+='<iframe id="%0:s" name="%0:s" style="display:none" src="about:blank" onload="%1:s"></iframe>'.format(aV.config.QuickEdit.idFormats.uploadBoxIFrame.format(element.aVquickEdit.editorGuid), onloadFunc);
				
				//add the necessary form code to the container div. Keeping this part as is, is strongly recommended but might be customized
				inHTML+='<form action="%0:s" id="%1:s" class="%2:s" method="post" enctype="multipart/form-data" target="%3:s">'.format(element.aVquickEdit.action, aV.config.QuickEdit.idFormats.uploadBoxForm.format(element.aVquickEdit.editorGuid), aV.config.QuickEdit.classNames.uploadBoxForm, aV.config.QuickEdit.idFormats.uploadBoxIFrame.format(element.aVquickEdit.editorGuid));
				
				var params;
				try
				{
					params=eval("(" + element.aVquickEdit.params + ")");
				}
				catch (error)
				{
					params=(typeof element.aVquickEdit.params=="string")?element.aVquickEdit.params:element.aVquickEdit.params.toQueryString();
				}
				
				var paramList=params.split('&');
				for (var i=0; i<paramList.length-1; i++)
				{
					var tempArray=paramList[i].split('=');
					inHTML+='<input type="hidden" name="%s" value="%s" />'.format(tempArray);
				}
				//inHTML+='<input type="hidden" name="MAX_FILE_SIZE" value="500000" />';
				inHTML+='<input type="file" name="%s" onchange="if(this.value){this.form.submit();this.disabled=true;document.getElementById(\'%s\').style.display=\'\'}" />'.format(paramList[paramList.length-1], aV.config.QuickEdit.idFormats.uploadBoxLoadingDiv.format(element.aVquickEdit.editorGuid));
				inHTML+='<div id="%s" class="%s" style="display: none">%s</div>'.format(aV.config.QuickEdit.idFormats.uploadBoxLoadingDiv.format(element.aVquickEdit.editorGuid), aV.config.QuickEdit.classNames.uploadBoxLoadingDiv, aV.config.QuickEdit.texts.loadingDivHTML);
				inHTML+='</form>';
				//assign the dynamically generated HTML code to the container div's innerHTML property
				editor.innerHTML=inHTML;
				document.body.appendChild(editor); //add the container div to the document

				//position the upload box, in the middle of the image
				var elementCoordinates=aV.DOM.getElementCoordinates(element);
				editor.style.top=Math.round(elementCoordinates.y + (element.offsetHeight - editor.offsetHeight)/2) + "px";
				editor.style.left=Math.round(elementCoordinates.x + (element.offsetWidth - editor.offsetWidth)/2) + "px";	
				
				return editor;
			},
			destructor: function(editorGuid)
			{
				var editor=document.getElementById(aV.config.QuickEdit.idFormats.uploadBox.format(editorGuid));
				editor.editee.aVquickEdit.active=false;
				editor.editee.onmouseout({type: "mouseout",	target: editor.editee});
				editor.editee=undefined;
				editor.parentNode.removeChild(editor);
			},
			eventHandlers:
			{
				setresponse: function(event)
				{
					event.responseText=event.responseText.trim();

					var temp=event.responseText.match(/<pre>(.*)<\/pre>/i);
					if (temp)
						event.responseText=temp[1];

					var responseObject=Object.fromJSON(event.responseText);
					if (!responseObject || responseObject.type=='error')
					{
						//enable the "file" input box again for a retry
						var inputAreas=event.target.getElementsByTagName("input");
						for (var i=0; i<inputAreas.length; i++)
							inputAreas[i].disabled=false;
		
						//reset the form and hide the "in-progress" image
						document.getElementById(aV.config.QuickEdit.idFormats.uploadBoxForm.format(event.target.editee.aVquickEdit.editorGuid)).reset();
						document.getElementById(aV.config.QuickEdit.idFormats.uploadBoxLoadingDiv.format(event.target.editee.aVquickEdit.editorGuid)).style.display="none";
						
						aV.QuickEdit.triggerEvent("editerror", {target: event.target.editee, responseText: event.responseText, responseObject: responseObject, editor: event.target});
						return false;
					}
					if (aV.QuickEdit.triggerEvent("endedit", {target: event.target.editee, responseText: event.responseText, responseObject: responseObject, editor: event.target}, event.target.editee)===false)
						return false;
					var now=new Date();
					if (!responseObject.path)
						responseObject.path=event.target.editee.src;
					
					event.target.editee.src=responseObject.path + ((responseObject.path.indexOf('?')>=0)?'&':'?') + now.getTime();
					aV.QuickEdit.triggerEvent("afteredit", {target: event.target.editee}, event.target.editee);
					return true;
				}
			}
		}
	},
	valueHandlers:
	{
		get:
		{
			"default": function(element)
			{
				element.innerHTML=element.innerHTML.BRtoLB();
				return (element.textContent || element.innerText || '');
			},
			html: function(element)
			{
				return element.innerHTML;
			}
		},
		set:
		{
			"default": function(element, value)
			{
				element.innerHTML='';
				var lines=value.split(/\r\n|\r|\n/g);
				element.appendChild(document.createTextNode(lines[0]));
				for (var i=1; i<lines.length; i++)
				{
					element.appendChild(document.createElement('br'));
					element.appendChild(document.createTextNode(lines[i]));
				}
				return element.innerHTML;
			},
			html: function(element, value)
			{
				return element.innerHTML=value;
			}
		}
	},
	ruleFile: "editableRules.txt",
	useInfoBox: true,
	forbiddenTags: ["INPUT", "SELECT", "OPTION", "TEXTAREA", "FORM", "HR", "BR", "IFRAME"]
};

/**
 * Used internally to assign unique id's to the created upload boxes.
 * <br />You should <b><u>never</u></b> change this value.
 *
 * @type integer
 */
aV.QuickEdit.uploadBoxCount=1;

aV.QuickEdit.onediterror=undefined;
aV.QuickEdit.onbeforeedit=undefined;
aV.QuickEdit.onstartedit=undefined;
aV.QuickEdit.onendedit=undefined;
aV.QuickEdit.onafteredit=undefined;

aV.QuickEdit.triggerEvent=function(type, parameters, element)
{
	if (!parameters)
		parameters={};
	parameters=({type: type}).unite(parameters, false);
	var result=true;

	if (aV.QuickEdit["on" + type])
		result=aV.QuickEdit["on" + type](parameters);
	
	if (result!==false && element && element.aVquickEdit["on" + type])
		result=element.aVquickEdit["on" + type](parameters);

	/*else*/
	aV.QuickEdit.defaultEventHandler(parameters);
	return result;
};

aV.QuickEdit.defaultEventHandler=function(event)
{
	if (event.type.match(/error$/))
	{
		var message=(event.responseObject && event.responseObject.message)?event.responseObject.message:aV.config.QuickEdit.texts.defaultErrorMessage;
		if (aV.config.QuickEdit.useInfoBox)
			aV.Visual.infoBox.show(message, aV.config.Visual.infoBox.images.error);
		else
			alert(message);
	}
};

aV.QuickEdit.getElementValue=function(element)
{
	var valueHandlerId=(element.aVquickEdit.valueHandler in aV.config.QuickEdit.valueHandlers.get)?element.aVquickEdit.valueHandler:"default";
	return aV.config.QuickEdit.valueHandlers.get[valueHandlerId](element);
};

aV.QuickEdit.setElementValue=function(element, value)
{
	var valueHandlerId=(element.aVquickEdit.valueHandler in aV.config.QuickEdit.valueHandlers.get)?element.aVquickEdit.valueHandler:"default";
	return aV.config.QuickEdit.valueHandlers.set[valueHandlerId](element, value);
};

/**
 * This function is assigned to all editable elements' onMouseOver event by <a href="#aV.QuickEdit.init">init</a>
 * <br />Might be customized, but it is not suggested.
 *
 * @method
 * @private
 * @deprecated It is an event handler, do not call directly
 * @param {EventObject} event
 */
aV.QuickEdit._editableElementHover=function(event)
{
	var element=event.target;
	if (!element.aVquickEdit)
		return;

	if(eval(element.aVquickEdit.condition))
	{//evaluate the given editing condition and if it is true, continue the operation.
		aV.DOM.addClass(element, aV.config.QuickEdit.classNames.editableElement);
		if (element.aVquickEdit.fade!=null) //if there is a "fade" variable, fade the element
			aV.Visual.fade(element, element.aVquickEdit.fade);
	}	
};

/**
 * This function is assigned to all editable elements' onMouseOut event by <a href="#aV.QuickEdit.init">init</a>
 * <br />Might be customized, but it is not suggested.
 *
 * @method
 * @private
 * @deprecated It is an event handler, do not call directly.
 * @param {EventObject} event
 */
aV.QuickEdit._editableElementMouseOut=function(event)
{
	var element=event.target; //get the element from event object
	if (!element.aVquickEdit)
		return;
	
	if(!element.aVquickEdit.active) //if the element is not clicked (or being edited)
	{
		if (element.aVquickEdit.fade!=null) //if fading assigned, return to opaque mode
			aV.Visual.fade(element, 1);
		aV.DOM.removeClass(element, aV.config.QuickEdit.classNames.editableElement);
	}
};

/**
 * This function is assigned to all editable elements' onClick event by <a href="#aV.QuickEdit.init">init</a>
 * <br />Might be customized, but it is not suggested.
 *
 * @method
 * @private
 * @deprecated It is an event handler, do not call directly.
 * @param {EventObject} event
 */
aV.QuickEdit._editableElementClick=function(event)
{
	var element=event.target;
	if (!element.aVquickEdit)
		return;
	
	if(aV.DOM.hasClass(element, aV.config.QuickEdit.classNames.editableElement))
		aV.QuickEdit._startEdit(element);
};

aV.QuickEdit._startEdit=function(element)
{
	if (element.aVquickEdit.active)
		return;
	
	var editorId=(element.aVquickEdit.editor in aV.config.QuickEdit.editors)?element.aVquickEdit.editor:"default";
	
	if (aV.QuickEdit.triggerEvent("beforeedit", {target: element, editor: editorId}, element)===false)
		return false;
	
	var editor=aV.config.QuickEdit.editors[editorId].constructor(element);
	editor.editee=element;

	for (var eventType in aV.config.QuickEdit.editors[editorId].eventHandlers)
		if (aV.config.QuickEdit.editors[editorId].eventHandlers.hasOwnProperty(eventType))
			aV.Events.add(editor, eventType, aV.config.QuickEdit.editors[editorId].eventHandlers[eventType]);

	aV.DOM.addClass(editor, aV.config.QuickEdit.classNames.editor);

	aV.DOM.removeClass(element, aV.config.QuickEdit.classNames.editableElement);
	aV.DOM.addClass(element, aV.config.QuickEdit.classNames.editee);
	
	element.aVquickEdit.active=true;
	
	if (editor.focus)
		editor.focus();
	
	if (editor.select)
		editor.select();
	
	aV.QuickEdit.triggerEvent("startedit", {target: element, editor: editor}, element);
	aV.Events.trigger(window, 'domready', {caller: element});
};

aV.QuickEdit._makeSetRequest=function(editor, value)
{
	var params;
	try
	{
		params=eval("(" + editor.editee.aVquickEdit.params + ")");
	}
	catch (error)
	{
		params=(typeof editor.editee.aVquickEdit.params=="string")?editor.editee.aVquickEdit.params:editor.editee.aVquickEdit.params.toQueryString();
	}

	var responseHandler=function(requestObject)
	{
		delete editor.editee.aVquickEdit.requestObject;
		editor.onsetresponse({type: 'setresponse', target: editor, requestObject: requestObject});
		aV.Events.trigger(window, 'domready');
	};

	editor.editee.aVquickEdit.requestObject=aV.AJAX.makeRequest(
		"POST",
		editor.editee.aVquickEdit.action,
		params + '=' + encodeURIComponent(value),
		responseHandler
	);
};

/**
 * Returns true if the element's TAG is not in the config.forbiddenTags list.
 * 
 * @private
 * @deprecated Used internally for element initialization.
 * @return {Boolean}
 * @param {HTMLObject} element
 */
aV.QuickEdit._checkElement=function(element)
{
	for (var i=aV.config.QuickEdit.forbiddenTags.length-1; i>=0; i--)
		if (element.tagName==aV.config.QuickEdit.forbiddenTags[i])
			return false;
	return true;
};

/**
 * Assigns the necessary functions to the editable element which
 * is gathered and whose attributes are set by aV.aParser.setElementAttributes
 * 
 * @private
 * @deprecated Used internally, might be used if a new element is dynamically added to the page and it should be editable.
 * @method
 * @param {HTMLElementObject} element The element whose attributes will be set.
 * @param {String} attributeStr The string which containts the editability properties.
 */
aV.QuickEdit._setEditableElement=function(element)
{
	if (!element.aVquickEdit.editor)
		element.aVquickEdit.editor='default';
	aV.Events.add(element, "mouseover", aV.QuickEdit._editableElementHover); //assign the "private" editableElementHover function to onmouseover event
	aV.Events.add(element, "mouseout", aV.QuickEdit._editableElementMouseOut); //assign the "private" editableElementMouseOut function to onmouseout event
	aV.Events.add(element, "click", aV.QuickEdit._editableElementClick); //assign the "private" editableElementClick function to onclick event
};

/**
 * This function initializes the aV.QuickEdit system.
 * Downloads the ruleFile if there is one, assigns the necessary property
 * and event handlers to the editable elements.
 * Attached to the window.onload event automatically.
 *
 * @method
 */
aV.QuickEdit.init=function()
{
	for (var editorId in aV.config.QuickEdit.editors)
		if (aV.config.QuickEdit.editors.hasOwnProperty(editorId) && editorId!="default")
			if (!("eventHandlers" in aV.config.QuickEdit.editors[editorId]))
				aV.config.QuickEdit.editors[editorId].eventHandlers=aV.config.QuickEdit.editors["default"].eventHandlers;

	aV.aParser.assignAttributesFromFile(
		aV.config.QuickEdit.ruleFile,
		'aVquickEdit',
		aV.QuickEdit._checkElement,
		aV.QuickEdit._setEditableElement
	);

	aV.config.QuickEdit.useInfoBox=(aV.config.QuickEdit.useInfoBox && aV.Visual.infoBox);
};

aV.AJAX.loadResource("/JSLib/css/aV.plg.quickEdit.css", "css", "aVquickEditCSS");
aV.Events.add(window, 'domready', aV.QuickEdit.init);