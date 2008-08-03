/**
 * @fileOverview	Allows non obtrusive in-place-editing functionality for both images and text based elements.
 * @name aV.QuickEdit
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	2.1.2
 *
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.ext.string.js">aV.ext.string.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.events.js">aV.main.events.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.aParser.js">aV.main.aParser.js</a> 	
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
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
 * @config {String} uploadImgPath The path to the image which will be shown while uploading a file via an upload box.
 * @config {String} imgUploadTitle The default upload box title for image replacements.
 * @config {String} imgUploadError The error message which will be showed when an error is occured while uploading the new image.
 * @config {String} textEditError The error message which will be showed when an error is occured while uploading the new text content.
 * @config {String} ruleFile Path to the external file which contains the rule definitons for editable items.
 * @config {Boolean} useInfoBox The script will try to use the InfoBox extension(if exists) to display messages instead of <b>alert</b> function.
 * @config {String[]} forbiddenTags The tag names in uppercase which should not be assigned for quickEdit in any case.
 */
aV.QuickEdit = {};

aV.config.QuickEdit=
{
	uploadImgPath: "images/uploading.gif",
	imgUploadTitle: "Please select new image",
	imgUploadError: "An error occurred while uploading the new image. Please try again.",
	textEditError: "An error occurred while changing the value. Please try again.",
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
aV.QuickEdit.uploadBoxCount=0;

/**
 * Creates a tiny little upload box which has the class name <b>uploadContainer</b>.
 * It asynchronously uploads selected file immediately after the user have selected it.
 *
 * @return {HTMLDivElementObject} The object reference to the created upload box div.
 * @param {String} titleText	The title of the upload box.
 * @param {String} postAdress	The adress of the server-side page, where the file will be uploaded.
 * @param {String} params	A "&" delimited string which contains the parameters which will be passed
 * to the server-side page. Just like the GET paramters of a page, the parameter values should be URIEncoded.
 * <br /><b>Note: </b>The last item should not be a name-value pair. Instead, it should only have the name of the file variable.
 * <br />An example params string will be like this: <br />
 * <br />var1=hello%20world&var2=hello%20again&theFileVar
 * @param {Function(HTMLDivElementObject, String)} [callBackFunc] The function which is called when the upload process is finished.
 * It should take the parent object of the uploadBox div, which is the same element what the createUploadBox function returns,
 * as its first paramter. The text result of the server-side page's response, which is defined in <b>postAddress</b> parameter, as its second parameter.
 * <br /> If this function returns false, the upload box will remain and if this function returns nothing or true the upload box will dissappear after
 * the POST operation is completed.
 * <br />The upload box will automatically dissappear if callBackFunction is not assigned also.
 */
aV.QuickEdit.createUploadBox=function(titleText, postAddress, params, callBackFunc)
{
	var containerDiv=document.createElement("div"); //create the container div, which contains the necessary elements for the upload box.
	containerDiv.className="uploadContainer"; //set the div's class to uploadContainer both for CSS and identification
	containerDiv.id="uplContainer" + aV.QuickEdit.uploadBoxCount; //assign the unique upload div id
	containerDiv.callBackFunc=callBackFunc; //define a new property for the containerDiv for storing the *callBackFunc*
	
	//start defining the onload function of the upcoming iframe in text format for compatibility with IE
	var onloadFunc="var responseText=(this.contentDocument)?this.contentDocument.body.innerHTML:this.contentWindow.document.body.innerHTML;if(!responseText)return;var destroyContainer=true;if(this.parentNode.callBackFunc)destroyContainer=this.parentNode.callBackFunc(this.parentNode,responseText);if(destroyContainer)setTimeout('aV.QuickEdit._destroyUploadBox(document.getElementById(\\'" + containerDiv.id + "\\'));', 0);";
	
	//prepare the inner visual structure of the uploadBox container div - this part might be customized
	var inHTML='<div class="uploadTitle" style="float: left; clear: both; width: 100%">';
	inHTML+='<div class="uploadTitleText">' + titleText + '</div>';
	inHTML+='<div class="uploadCloseButton" onclick="aV.QuickEdit._destroyUploadBox(this.parentNode.parentNode)"><sup>x</sup></div>';
	inHTML+='</div>';
	
	//add the necessary hidden iframe code
	inHTML+='<iframe id="uploadIframe' + aV.QuickEdit.uploadBoxCount + '" name="uploadIframe' + aV.QuickEdit.uploadBoxCount + '" style="display:none" src="about:blank" onload="' + onloadFunc + '"></iframe>';
	
	//add the necessary form code to the container div. Keeping this part as is, is strongly recommended but might be customized
	inHTML+='<form style="float: left; width: 100%" action="' + postAddress + '" id="uploadForm' + aV.QuickEdit.uploadBoxCount + '" method="post" enctype="multipart/form-data" target="uploadIframe' + aV.QuickEdit.uploadBoxCount + '">';
	
	try
	{
		eval("params=" + params);
	}
	catch (error)
	{
		params=params;
	}
	
	var paramList=params.split('&');
	for (var i=0; i<paramList.length-1; i++)
	{
		var tempArray=paramList[i].split('=');
		inHTML+='<input type="hidden" name="' + tempArray[0] + '" value="' + tempArray[1] + '" />';
	}
	//inHTML+='<input type="hidden" name="MAX_FILE_SIZE" value="500000" />';
	inHTML+='<input type="file" name="' + paramList[paramList.length-1] + '" onchange="if(this.value){this.form.submit();this.disabled=true;document.getElementById(\'uploadImg' + aV.QuickEdit.uploadBoxCount + '\').style.display=\'block\'}" />';
	//place the hidden "in-progress" image at the bottom of the form, might be customized except the id part
	inHTML+='<center><img src="' + aV.config.QuickEdit["uploadImgPath"] + '" id="uploadImg' + aV.QuickEdit.uploadBoxCount + '" style="display: none; margin: 1px;" /></center>';
	inHTML+='</form>';
	//assign the dynamically generated HTML code to the container div's innerHTML property
	containerDiv.innerHTML=inHTML;
	document.body.appendChild(containerDiv); //add the container div to the document
	aV.QuickEdit.uploadBoxCount++;
	return containerDiv; //return the created, final container div as an object
};

/**
 * Destroys the given uploadbox (either by id or directly the object) safely.
 * <br />Should not be used directly by the user.
 *
 * @method
 * @private
 * @deprecated Used internally by <a href="#aV.QuickEdit.createUploadBox">createUploadBox</a>
 * @param {HTMLDivElementObject | String} uploadBox The id or the object referance of the upload box, which will be destroyed.
 */
aV.QuickEdit._destroyUploadBox=function(uploadBox)
{
	if (typeof(uploadBox)=='string')
		uploadBox=document.getElementById(uploadBox);
	if (!uploadBox) return false;
	if (uploadBox.callerElement)
	{
		uploadBox.callerElement.aVquickEdit.active=false;
		if (uploadBox.callerElement.onmouseout) uploadBox.callerElement.onmouseout({type: "mouseout", target: uploadBox.callerElement});
	}
	document.body.removeChild(uploadBox);
	delete uploadBox;
	//aV.QuickEdit.uploadBoxCount--;
	return true;
};

/**
 * Creates a special uploadBox in the middle of the image element given by <b>imgElement</b> parameter
 * and uploads the image to the <b>uploadAdress</b> using the uploadBox system which is explained in the
 * <a href="#aV.QuickEdit.createUploadBox">createUploadBox</a>.
 *
 * @method
 * @private
 * @deprecated Direct call to this function is not suggested, see <a href="#aV.QuickEdit.init">init</a> for details.
 * @param {HTMLImageElementObject} imgElement The object reference of the image which will be dynamically replaced.
 * @param {String} uploadAddress The address of the server-side sccripting page, where the image will be uploaded(POSTed)
 * @param {Strimg} params The additional parameters while posting the image.
 * See <a href="#aV.QuickEdit.createUploadBox">createUploadBox</a>'s <b>params</b> paramter for further details.
 * @param {String} [title] The title of the upload box created for the replacement operation of the image.
 * If not given, config["imgUploadTitle"]is used.
 */
aV.QuickEdit._changeImage=function(imgElement, uploadAddress, params, title)
{
	/*
	if (typeof(imgElement)=='string')
		imgElement=document.getElementById(imgElement);
	*/
	
	if (imgElement.aVquickEdit.active) //if there is already an uploadBox, return false
		return false;
				
	if (!title) //if no spesific title is defined, use the default one
		title=aV.config.QuickEdit["imgUploadTitle"];
	var uplBox=aV.QuickEdit.createUploadBox(title, uploadAddress, params, aV.QuickEdit._imgLoaded); //create an upload box, just as we want :)
	imgElement.aVquickEdit.active=true; //set the image's aVquickEdit.active mode to true, to indicate it now has an uploadBox
	uplBox.callerElement=imgElement; //set the uploadBox's callerElement as our image, for further use
	uplBox.style.width="200px";
	//position the upload box, in the middle of the image
	uplBox.style.top=Math.round(aV.Visual.getElementPositionY(imgElement) + (imgElement.offsetHeight - uplBox.offsetHeight)/2) + "px";
	uplBox.style.left=Math.round(aV.Visual.getElementPositionX(imgElement) + (imgElement.offsetWidth - uplBox.offsetWidth)/2) + "px";	
};

/**
 * Used internally by <a href="#aV.QuickEdit._changeImage">_changeImage</a> when the image is uploaded.
 *
 * @private
 * @deprecated
 * @return {Boolean} Returns true if the new image is uploaded and the response is in the correct format, false otherwise.
 * @param {HTMLDivElementObject} container The upload box container element's object referance
 * @param {String} responseText The response text, returned from the server-sided-script file
 */

aV.QuickEdit._imgLoaded=function(container, responseText)
{
	responseText=responseText.stripHTML().trim();
	if (responseText && responseText.substr(0, 5)=="path=")
	{
		//if there *is* a response text and it starts with "path=" prefix,
		//which indicates a successfull upload operation and gives us the new image's http adress
		//we will set the given adress to the image's src property,
		//but if they are the same(image.src and the new path), browsers will continue to use
		//the cache. To prevent this, we add a dummy get parameter which is actually the current
		//time, which forces a refresh.
		var now=new Date();
		container.callerElement.src=responseText.substring(5) + '?' + now.getTime();
		return true;
	}
	else
	{
		//if the responseText is not in the format we expected, raise an error and inform the user
		if (aV.config.QuickEdit["useInfoBox"])
			aV.Visual.infoBox.show(aV.config.QuickEdit["imgUploadError"]);
		else
			alert(aV.config.QuickEdit["imgUploadError"]);
		//alert(responseText);
		//enable the "file" input box again for a retry
		var inputAreas=container.getElementsByTagName("input");
		for (var i=0; i<inputAreas.length; i++)
			inputAreas[i].disabled=false;
		delete inputAreas;
		
		//reset the form and hide the "in-progress" image
		container.getElementsByTagName("form")[0].reset();
		container.getElementsByTagName("img")[0].style.display="none";
		return false;
	}
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
		element.className='editable'; //set the class to the general "editable" class
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
		element.className=element.baseClass; //revert the class name to its original
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
	
	if(element.className=='editable')
	{//if editing condition is satisfied on the mouseover event and the element has "editable" as its className, start editing
		if (element.tagName=="IMG") //if the element is an image, use the "changeImage" function
			aV.QuickEdit._changeImage(element, element.aVquickEdit.action, element.aVquickEdit.params);
		else //else if the element is a text-based element, use the regular "editLabel" function
			aV.QuickEdit._editLabel(element);
	}	
};

/**
 * This function is used to send the newly edited element's data to the server-sde-scripting page
 * and to set the new data if it is confirmed by the <i>action</i> page.
 *
 * @method
 * @private
 * @deprecated Used internally, should not be called directly.
 * @param {HTMLElementObject} nameContainer
 */
aV.QuickEdit._setEditedValue=function(nameContainer)
{
	var labelObject=nameContainer.parentNode;
	var completedFunction=function(requestObject)
	{
		if (parseInt(requestObject.responseText)>0) //expecting "1" from the response page
		{
			var newName=nameContainer.value;
			labelObject.innerHTML="";
			labelObject.appendChild(document.createTextNode(newName));
			labelObject.innerHTML=labelObject.innerHTML.LBtoBR();

			labelObject.aVquickEdit.active=false;
			labelObject.onmouseout({type: "mouseout", target: labelObject});
		}
		else
		{
			if (aV.config.QuickEdit["useInfoBox"])
				aV.Visual.infoBox.show(aV.config.QuickEdit["textEditError"]);
			else
				alert(aV.config.QuickEdit["textEditError"]);
			nameContainer.disabled=false;
		}
	};
	
	var loadFunction=function()
	{
		nameContainer.disabled=true;
	};
	
	var params;
	try
	{
		eval("params=" + labelObject.aVquickEdit.params);
	}
	catch (error)
	{
		params=labelObject.aVquickEdit.params;
	}
	
	aV.AJAX.makeRequest(
		"POST",
		labelObject.aVquickEdit.action,
		labelObject.aVquickEdit.params + '=' + encodeURIComponent(nameContainer.value.LBtoBR()),
		completedFunction,
		loadFunction
	);
};

/**
 * Starts the editing processes of text based elements.
 *
 * @method
 * @private
 * @deprecated Used internally, should not be used directly.
 * @param {HTMLElementObject} labelObject
 */
aV.QuickEdit._editLabel=function(labelObject)
{
	if (labelObject.aVquickEdit.active)
		return;
	
	var editBox;
	
	switch(labelObject.aVquickEdit.type)
	{
		case 'select':
			if (typeof labelObject.aVquickEdit.selectValues == 'string') 
			{
				try 
				{
					eval('labelObject.aVquickEdit.selectValues=' + labelObject.aVquickEdit.selectValues + ';');
				} 
				catch (error) 
				{
					labelObject.aVquickEdit.selectValues = labelObject.aVquickEdit.selectValues;
				};
			}
			else if (typeof labelObject.aVquickEdit.selectValues=='undefined')
				return false;
			editBox=document.createElement("SELECT");			
			for (var i=0; i<labelObject.aVquickEdit.selectValues.length; i++)
				editBox.add(new Option(labelObject.aVquickEdit.selectValues[i], labelObject.aVquickEdit.selectValues[i]), undefined);
			break;
		case 'textarea':
			editBox=document.createElement("TEXTAREA");
			editBox.style.width=(labelObject.clientWidth>79)?(labelObject.clientWidth - 4) + "px":'auto';
			editBox.style.height=(labelObject.scrollHeight - 4) + "px";
			break;
		default: 
			editBox=document.createElement("INPUT");
	};

	if (labelObject.aVquickEdit.type!='select')
	{
		editBox.onkeydown=function(e)
		{
			var key = e ? e.which : window.event.keyCode;
			if (key==27)
			{
				this.value=this.originalValue;
				this.onblur();
			}
			else if (this.tagName=='INPUT' && key==13)
			{
				this.onblur();
			}
			else if (this.tagName=='TEXTAREA' && parseInt(this.style.height)<this.scrollHeight)
			{
				this.style.height=Math.max(this.scrollHeight - 2, 20) + "px";
			}
			
			return true;
		};
	}
	
	editBox.onblur=function() 
	{
		if (this.value==this.originalValue || !this.value)
		{			
			labelObject.innerHTML=labelObject.oldHTML;
			labelObject.aVquickEdit.active=false;
			labelObject.onmouseout({type: "mouseout", target: labelObject});
		}
		
		else
		{
			aV.QuickEdit._setEditedValue(this);
			this.disabled=true;
		}
		
	};
	
	labelObject.oldHTML=labelObject.innerHTML;
	labelObject.innerHTML=labelObject.innerHTML.BRtoLB();

	if (labelObject.firstChild && labelObject.firstChild.nodeValue)
		editBox.value=labelObject.firstChild.nodeValue;
	else if (labelObject.innerText)
		editBox.value=labelObject.innerText;
	else
		editBox.value='';

	editBox.originalValue=editBox.value;

	labelObject.innerHTML="";

	labelObject.appendChild(editBox);
	labelObject.aVquickEdit.active=true;
	
//	editBox.className="editLabel";
	editBox.focus();
	if (editBox.select)
		editBox.select();
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
	element.baseClass=element.className; //note its current class for roll back as baseClass
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
	aV.AJAX.loadResource("/JSLib/css/aV.plg.quickEdit.css", "css", "aVquickEditCSS");
	aV.aParser.assignAttributesFromFile(
		aV.config.QuickEdit['ruleFile'],
		'aVquickEdit',
		aV.QuickEdit._checkElement,
		aV.QuickEdit._setEditableElement
	);

	aV.config.QuickEdit["useInfoBox"]=(aV.config.QuickEdit["useInfoBox"] && aV.Visual.infoBox);
};

aV.Events.add(window, 'load', aV.QuickEdit.init);