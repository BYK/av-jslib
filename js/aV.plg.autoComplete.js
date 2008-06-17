/**
 * @fileOverview Allows non obtrusive auto complete functionality for text inputs.
 * @name Auto Complete
 * 
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.2.1
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a> 
 */

if (typeof AutoComplete!="undefined")
	throw new Error('"AutoComplete" namespace had already been taken!', "aV.plg.autoComplete.js@" + window.location.href, 11);
	
/**
 * Represents the namespace for AutoComplete functions.
 * 
 * @namespace
 * @requires {@link String} (aV.ext.string.js)
 * @requires {@link Events} (aV.main.events.js)
 * @requires {@link AJAX} (aV.main.ajax.js)
 * @requires {@link Visual} (aV.main.visual.js)
 * @requires {@link aParser} (aV.main.aParser.js)
 * 
 * @param {String} [config.ruleFile='autoCompleteRules.txt'] Path to the external file which contains the rule definitons for editable items.
 * @param {integer} [config.listBoxOfset=3] The vertical offset from the input boxes for the list boxes which will be displayed.
 * @param {integer} [config.minChars=2] The minimum number of characters to start the auto complete.
 * @param {integer} [config.delay=150] The delay before showing the auto complete list in milliseconds.
 * @param {Boolean} [config.retryOnError=false] Set true to force the system to retry when an AJAX call fails to retrieve the list.
 * @param {String}	[config.regExpPattern="'\\\\b' + filter"] The default RegExp pattern for checking the list.
 * @param {String[]} [config.allowedTags=["INOUT"]] The allowed tag names in uppercase for auto complete system.
 */
AutoComplete = {};

/**
 * Holds the configuration parameters.
 */
AutoComplete.config=
{
	ruleFile: 'autoCompleteRules.txt',
	listBoxOffset: 3,
	minChars: 2,
	delay: 150,
	retryOnError: false,
	regExpPattern: "'\\\\b' + filter",
	allowedTags: ["INPUT"]
};

AutoComplete.listBoxCounter=0;

AutoComplete._getRegExp=function(element)
{
	var filter='(' + element.value.escapeRegExp() + ')';
	var regExpPattern=eval(element.autoComplete.regExpPattern || AutoComplete.config.regExpPattern);
	return new RegExp(regExpPattern, 'i');
}

AutoComplete._removeListBox=function(element)
{
	if (!element.autoComplete.listBox)
		return;
	
	Visual.fade(
		element.autoComplete.listBox,
		0,
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
	
	var seeker=AutoComplete._getRegExp(element);
	for (var i = 0, itemCounter=0, count = element.autoComplete.list.length; i < count; i++) 
	{
		var matchInfo=seeker.exec(element.autoComplete.list[i]);
		if (matchInfo)
		{
			var newLi = document.createElement('LI');
			newLi.itemIndex=itemCounter++;
			newLi.origValue=element.autoComplete.list[i];
			newLi.appendChild(document.createTextNode(element.autoComplete.list[i].substring(0, matchInfo.index)));
			var matchedPart=newLi.appendChild(document.createElement('SPAN'));
			matchedPart.className='aCMatchedPart';
			matchedPart.appendChild(document.createTextNode(matchInfo[0]));
			newLi.appendChild(document.createTextNode(element.autoComplete.list[i].substring(matchInfo.index+matchInfo[0].length)));
			Events.add(newLi, 'mouseover', function(){AutoComplete._onKeyDownHandler({target: element}, this.itemIndex)});
			Events.add(newLi, 'click', function(){AutoComplete._onKeyDownHandler({target: element, which: 13})});
			element.autoComplete.listBox.appendChild(newLi);
		}
	}
	
	if (element.autoComplete.listBox.innerHTML!='')
	{
		if (AutoComplete.onShowListBox)
			AutoComplete.onShowListBox(element.autoComplete.listBox);
		Visual.fade(element.autoComplete.listBox, 1);
		element.autoComplete.list.selectedIndex=0;
		element.autoComplete.listBox.childNodes[0].className='selected';
	}
	else
		AutoComplete._removeListBox(element);
};

AutoComplete._doKeyUp=function(element)
{
	if (element.autoComplete.list==undefined || !(element.autoComplete.dataChecker && element.autoComplete.dataChecker.test(element.value)))
	{
		element.autoComplete.dataChecker=AutoComplete._getRegExp(element);
		
		try 
		{
			var params=eval(element.autoComplete.params);
		} 
		catch(error) 
		{
			var params = element.autoComplete.params;
		}

		AJAX.destroyRequestObject(element.autoComplete.request);
		element.className+=' aCLoading';
		element.autoComplete.request=AJAX.makeRequest(
			"GET",
			element.autoComplete.source,
			params + '=' + encodeURIComponent(element.value),
			function (requestObject)
			{
				if (requestObject.status == 200) 
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
				element.className=element.className.replace(/\s*aCLoading/, "");
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
	{
		clearTimeout(event.target.autoComplete.keyUpTimer);
		delete event.target.autoComplete.keyUpTimer;
	}
	
	var key=event.keyCode || event.which;
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
			var delay=event.target.autoComplete.delay || AutoComplete.config.delay;
			event.target.autoComplete.keyUpTimer = setTimeout('AutoComplete._doKeyUp(document.getElementById("' + event.target.id + '"))', delay);
		}
	}
};

AutoComplete._onKeyDownHandler=function(event, newIndex)
{
	var key=event.keyCode || event.which;

	if (event.target.autoComplete.list==undefined || !event.target.autoComplete.listBox || (key!=13 && (key<37 || key>40) && !(newIndex>-1)))
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
		event.target.value = event.target.autoComplete.listBox.childNodes[event.target.autoComplete.list.selectedIndex].origValue;
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
	element.setAttribute("autocomplete", "off");
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