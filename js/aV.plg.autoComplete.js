/**
 * @fileOverview	Allows non obtrusive auto complete functionality for text inputs.
 * @name Auto Complete
 * 
 * @author Burak Yiğit KAYA (byk@amplio-vita.net)
 * @version 1.0
 * 
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.ext.string.js">aV.ext.string.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.events.js">aV.main.events.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.aParser.js">aV.main.aParser.js</a> 	
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a> 
 */

if (typeof Events=="undefined")
	throw new Error("Event functions cannot be found!", "aV.module.autoComplete.js@" + window.location.href, 17);

if (typeof AJAX=="undefined")
	throw new Error("AJAX functions library cannot be found!", "aV.module.autoComplete.js@" + window.location.href, 20);

if (typeof aParser=="undefined")
	throw new Error("aParser functions library cannot be found!", "aV.module.autoComplete.js@" + window.location.href, 23);

if (typeof Visual=="undefined")
	throw new Error("Visual functions library cannot be found!", "aV.module.autoComplete.js@" + window.location.href, 26);

if (typeof AutoComplete!="undefined")
	throw new Error('"AutoComplete" namespace had already been taken!', "aV.module.autoComplete.js@" + window.location.href, 29);
	
/**
 * Represents the namespace for AutoComplete functions.
 * 
 * @namespace
 * 
 * @config {String} ruleFile Path to the external file which contains the rule definitons for editable items.
 * @config {integer} listBoxOfset The vertical offset from the input boxes for the list boxes which will be displayed.
 * @config {integer} minChars The minimum number of characters to start the auto complete.
 * @config {integer} delay The delay before showing the auto complete list in milliseconds.
 * @config {Boolean} retryOnError Set true to force the system to retry when an AJAX call fails to retrieve the list.
 * @config {String[]} allowedTags The allowed tag names in uppercase for auto complete system.
 */
AutoComplete = {};

AutoComplete.config=
{
	ruleFile: 'autoCompleteRules.txt',
	listBoxOffset: 3,
	minChars: 2,
	delay: 150,
	retryOnError: false,
	allowedTags: ["INPUT"]
};

AutoComplete.listBoxCounter=0;

AutoComplete._removeListBox=function(element)
{
	if (!element.autoComplete.listBox)
		return;
	
	Visual.fade(
		element.autoComplete.listBox,
		0,
		true,
		function(listBox)
		{
			listBox.parentNode.removeChild(listBox);
			delete element.autoComplete.listBox;
		}
	);
};

AutoComplete._showListBox=function(element)
{
	if (!element.autoComplete.listBox) 
	{
		element.autoComplete.listBox = document.createElement("UL");
		element.autoComplete.listBox.id="aCListBox" + AutoComplete.listBoxCounter++;
		element.autoComplete.listBox.className="aCListBox";
		element.autoComplete.listBox.style.position='absolute';
		Visual.setOpacity(element.autoComplete.listBox, 0);
		document.body.appendChild(element.autoComplete.listBox);
	}
	
	element.autoComplete.listBox.innerHTML='';
	element.autoComplete.listBox.style.left=Visual.getElementPositionX(element) + "px";
	element.autoComplete.listBox.style.top=(Visual.getElementPositionY(element) + element.offsetHeight + AutoComplete.config.listBoxOffset) + "px";
	
	for (var i = 0, itemCounter=0, count = element.autoComplete.list.length; i < count; i++) 
	{
		if (element.autoComplete.list[i].match(new RegExp('^' + element.value.escapeRegExp(), 'i'))) 
		{
			var newLi = document.createElement('LI');
			newLi.itemIndex=itemCounter++;
			newLi.appendChild(document.createTextNode(element.autoComplete.list[i]));
			Events.add(newLi, 'mouseover', function(){AutoComplete._onKeyDownHandler({target: element}, this.itemIndex)});
			Events.add(newLi, 'click', function(){AutoComplete._onKeyDownHandler({target: element, which: 13})});
			element.autoComplete.listBox.appendChild(newLi);
		}
	}
	
	if (element.autoComplete.listBox.innerHTML!='')
	{
		Visual.fade(element.autoComplete.listBox, 1, true);
		element.autoComplete.list.selectedIndex=0;
		element.autoComplete.listBox.childNodes[0].className='selected';
	}
	else
		AutoComplete._removeListBox(element);
};

AutoComplete._doKeyUp=function(element)
{
	if (!element.autoComplete.list || !element.value.match(new RegExp('^' + element.autoComplete.filter.escapeRegExp(), 'i')))
	{
		element.autoComplete.filter=element.value;
		
		var params;
		try 
		{
			eval('params=' + element.autoComplete.params + ';');
		} 
		catch(error) 
		{
			params = element.autoComplete.params;
		}

		AJAX.makeRequest(
			"GET",
			element.autoComplete.source,
			params + '=' + encodeURIComponent(element.value),
			function (requestObject)
			{
				if (requestObject.status == 200 && requestObject.responseText) 
				{
					element.autoComplete.list = requestObject.responseText.split("\n");
					AutoComplete._showListBox(element);
				}
				else 
				{
					delete element.autoComplete.list;
					delete element.autoComplete.filter;
					
					if (AutoComplete.config.retryOnError)
						AutoComplete._doKeyUp(element);
					else
						AutoComplete._removeListBox(element);
				}
			}
		);
	}
	else
		AutoComplete._showListBox(element);
	
	delete element.autoComplete.keyUpTimer;
};

AutoComplete._onKeyUpHandler=function(event)
{
	if (event.target.autoComplete.keyUpTimer)
		clearTimeout(event.target.autoComplete.keyUpTimer);
	var key=(event.which)?event.which:event.keyCode;
	var minChars=(event.target.autoComplete.minChars!=undefined)?event.target.autoComplete.minChars:AutoComplete.config.minChars;
	
	if (event.target.value.length < minChars || key==27) 
	{
		AutoComplete._removeListBox(event.target);
		return;
	}
	
	if (key != 13 && (key > 40 || key < 37)) 
	{
		if (event.target.autoComplete.listBox)
			AutoComplete._doKeyUp(event.target);
		else
		{
			var delay = (event.target.autoComplete.delay) ? event.target.autoComplete.delay : AutoComplete.config.delay;
			event.target.autoComplete.keyUpTimer = setTimeout('AutoComplete._doKeyUp(document.getElementById("' + event.target.id + '"))', delay);
		}
	}
};

AutoComplete._onKeyDownHandler=function(event, newIndex)
{
	var key=(event.which)?event.which:event.keyCode;
	
	if (!event.target.autoComplete.list || !event.target.autoComplete.listBox || (key!=13 && (key<37 || key>40) && !(newIndex>-1)))
		return;
	
	if (event.target.autoComplete.list.selectedIndex>-1 && event.target.autoComplete.listBox)
		event.target.autoComplete.listBox.childNodes[event.target.autoComplete.list.selectedIndex].className='';
	else
		event.target.autoComplete.list.selectedIndex=0;
	
	if (newIndex>-1)
		event.target.autoComplete.list.selectedIndex=newIndex;

	if (key == 38) 
		event.target.autoComplete.list.selectedIndex--;
	else if (key == 40) 
		event.target.autoComplete.list.selectedIndex++;
	else if (key == 13 && event.target.autoComplete.list.selectedIndex > -1) 
	{
		event.target.value = event.target.autoComplete.listBox.childNodes[event.target.autoComplete.list.selectedIndex].firstChild.nodeValue;
		delete event.target.autoComplete.list.selectedIndex;
		AutoComplete._removeListBox(event.target);
		return false;
	}
	
	event.target.autoComplete.list.selectedIndex=(event.target.autoComplete.listBox.childNodes.length + event.target.autoComplete.list.selectedIndex) % event.target.autoComplete.listBox.childNodes.length;
	
	var selectedItem=event.target.autoComplete.listBox.childNodes[event.target.autoComplete.list.selectedIndex];
	selectedItem.className='selected';
	if (event.target.autoComplete.listBox.scrollTop > selectedItem.offsetTop)
		event.target.autoComplete.listBox.scrollTop=selectedItem.offsetTop;
	else if ((event.target.autoComplete.listBox.scrollTop + event.target.autoComplete.listBox.clientHeight) < (selectedItem.offsetTop + selectedItem.offsetHeight))
		event.target.autoComplete.listBox.scrollTop=selectedItem.offsetTop - event.target.autoComplete.listBox.clientHeight + selectedItem.offsetHeight + 2;
};

AutoComplete._checkElement=function(element)
{
	if (!element.id)
		return false;

	for (var i=AutoComplete.config.allowedTags.length-1; i>=0; i--)
		if (element.tagName==AutoComplete.config.allowedTags[i])
			return true;
	return false;
};

AutoComplete._setAutoCompleteElement=function(element)
{
	Events.add(element, 'keyup', AutoComplete._onKeyUpHandler);
	Events.add(element, 'keydown', AutoComplete._onKeyDownHandler);
	Events.add(element, 'blur', function(){AutoComplete._removeListBox(this)});
};

AutoComplete.init=function()
{
	aParser.assignAttributesFromFile(
		AutoComplete.config.ruleFile,
		'autoComplete',
		AutoComplete._checkElement,
		AutoComplete._setAutoCompleteElement
	);	
};

Events.add(window, 'load', AutoComplete.init);