/**
 * @fileOverview Allows non obtrusive auto complete functionality for text inputs.
 * @name Auto Complete
 * 
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.4
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a> 
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.plg.autoComplete.js@" + window.location.href);

/**
 * Represents the namespace for AutoComplete functions.
 * 
 * @namespace
 * @requires {@link String} (aV.ext.string.js)
 * @requires {@link aV.Events} (aV.main.events.js)
 * @requires {@link aV.AJAX} (aV.main.ajax.js)
 * @requires {@link aV.Visual} (aV.main.visual.js)
 * @requires {@link aV.aParser} (aV.main.aParser.js)
 * 
 * @param {String} [config.ruleFile='autoCompleteRules.txt'] Path to the external file which contains the rule definitons for editable items.
 * @param {integer} [config.listBoxOfset=3] The vertical offset from the input boxes for the list boxes which will be displayed.
 * @param {integer} [config.minChars=2] The minimum number of characters to start the auto complete.
 * @param {integer} [config.delay=150] The delay before showing the auto complete list in milliseconds.
 * @param {Boolean} [config.retryOnError=false] Set true to force the system to retry when an AJAX call fails to retrieve the list.
 * @param {String}	[config.regExpPattern="'\\\\b' + filter"] The default RegExp pattern for checking the list.
 * @param {String[]} [config.allowedTags=["INPUT"]] The allowed tag names in uppercase for auto complete system.
 */
aV.AutoComplete = {};

if (!aV.config.AutoComplete)
	aV.config.AutoComplete={};
/**
 * Holds the configuration parameters.
 */
aV.config.AutoComplete.unite(
	{
		ruleFile: 'autoCompleteRules.txt',
		listBoxOffset: 1,
		minChars: 2,
		delay: 200,
		retryOnError: false,
		defaultInnerHTMLPattern: '<span class="%activeClass:s">%beforeMatched:s<span class="%matchedClass:s">%matched:s</span>%afterMatched:s</span>',
		regExpPattern: "'^(' + filter + ')|\\\\W+(' + filter + ')'",
		regExpBackferenceIndex: 1,
		filterPattern: "'^(.+)$'", //"'([' + separator + ']?)([^' + separator + ']+|$)'", //uncomment previous if you want multiple select by default
		filterBackferenceIndex: 1, // 2, //uncomment previous if you want multiple select by default
		allowedTags: ["INPUT"],
		separator: ',',
		defaultHTTPMethod: "GET",
		classNames:
		{
			listbox: 'aCListBox',
			matchedPart: 'aCMatchedPart',
			activePart: 'aCActivePart',
			selectedItem: 'selected',
			loading: 'aCLoading'
		}
	},
	false
);

aV.AutoComplete.listBoxCounter=0;

/**
 * Adapted from http://javascript.nwbox.com/cursor_position/
 * @param {Object} element
 */
aV.AutoComplete._getCursorPosition=function(element)
{
	if (element.createTextRange)
	{
		var r = document.selection.createRange().duplicate();
		r.moveEnd('character', element.value.length);
		if (r.text == '')
			return element.value.length;
		return element.value.lastIndexOf(r.text);
	}
	else
		return element.selectionStart
};

aV.AutoComplete._getFilter=function(element)
{
	var separator=(element.aVautoComplete.separator || aV.config.AutoComplete.separator).escapeRegExp();
	element.aVautoComplete.filterRegExp=new RegExp(eval(element.aVautoComplete.filterPattern || aV.config.AutoComplete.filterPattern), "ig");
	var filter;
	var currentValue=element.value;
	var cursorPos=element.aVautoComplete._cursorPosition;
	while (filter = element.aVautoComplete.filterRegExp.exec(currentValue)) 
	{
		if (filter.index <= cursorPos && cursorPos <= filter.index + filter[0].length) 
		{
			var filterBackferenceIndex=element.aVautoComplete.filterBackferenceIndex || aV.config.AutoComplete.filterBackferenceIndex;
			var endIndex=filter.index;
			for (i=1; i<filterBackferenceIndex; i++)
				endIndex+=filter[i].length;
			element.aVautoComplete.currentBaseStr = element.value.substring(0, endIndex) + '%s' + element.value.substring(filter.index+filter[0].length);
			filter = filter[filterBackferenceIndex].trim();
			break;
		}
	}
	if (typeof filter!='string')
	{
		element.aVautoComplete.currentBaseStr = '%s';
		filter = '';
	}
	return filter;
};

aV.AutoComplete._getRegExp=function(element)
{
	var filter=element.aVautoComplete.currentFilter.escapeRegExp();
	var regExpPattern=eval(element.aVautoComplete.regExpPattern || aV.config.AutoComplete.regExpPattern);
	return new RegExp(regExpPattern, 'i');
}

aV.AutoComplete._removeListBox=function(element)
{
	if (!element.aVautoComplete.listBox)
		return;
	
	aV.Visual.fade(
		element.aVautoComplete.listBox,
		0,
		function(listBox)
		{
			listBox.parentNode.removeChild(listBox);
			delete element.aVautoComplete.listBox;
		}
	);
};

aV.AutoComplete._showListBox=function(element)
{
	if (!element.aVautoComplete.listBox) 
	{
		element.aVautoComplete.listBox = document.createElement("UL");
		element.aVautoComplete.listBox.id=aV.config.AutoComplete.classNames.listbox + aV.AutoComplete.listBoxCounter++;
		element.aVautoComplete.listBox.className=aV.config.AutoComplete.classNames.listbox;
		element.aVautoComplete.listBox.style.position='absolute';
		aV.Visual.setOpacity(element.aVautoComplete.listBox, 0);
		document.body.appendChild(element.aVautoComplete.listBox);
	}
	
	element.aVautoComplete.listBox.innerHTML='';
	var elementCoordinates=aV.DOM.getElementCoordinates(element);
	element.aVautoComplete.listBox.style.left=elementCoordinates.x + "px";
	element.aVautoComplete.listBox.style.top=(elementCoordinates.y + element.offsetHeight + aV.config.AutoComplete.listBoxOffset) + "px";
	element.aVautoComplete.listBox.style.width=element.offsetWidth + "px";
	
	element.aVautoComplete.list.selectedIndex=-1;
	var seeker=aV.AutoComplete._getRegExp(element);
	for (var i = 0, itemCounter=0, count = element.aVautoComplete.list.length; i < count; i++) 
	{
		var matchInfo=seeker.exec(element.aVautoComplete.list[i].value);
		if (matchInfo)
		{
			var newLi = document.createElement('LI');
			newLi.itemIndex=itemCounter++;
			newLi.listIndex=i;
			var matchedStr=matchInfo.coalesce(1) || '';
			var matchedStrIndex=matchInfo[0].indexOf(matchedStr);
			var formatInfo={};
			formatInfo.beforeMatched=element.aVautoComplete.list[i].value.substring(0, matchInfo.index + matchedStrIndex);
			formatInfo.matched=matchedStr;
			formatInfo.afterMatched=element.aVautoComplete.list[i].value.substring(matchInfo.index + matchedStrIndex + matchedStr.length);
			formatInfo.originalText=element.aVautoComplete.list[i].value;
			formatInfo.matchedClass=aV.config.AutoComplete.classNames.matchedPart;
			formatInfo.activeClass=aV.config.AutoComplete.classNames.activePart;
			newLi.innerHTML=element.aVautoComplete.currentBaseStr.format((element.aVautoComplete.innerHTMLPattern || aV.config.AutoComplete.defaultInnerHTMLPattern).format(formatInfo));
			aV.Events.add(newLi, 'mouseover', function(){aV.AutoComplete._onKeyDownHandler({target: element}, this.itemIndex)});
			aV.Events.add(newLi, 'click', function(){aV.AutoComplete._onKeyDownHandler({target: element, which: 13})});
			element.aVautoComplete.listBox.appendChild(newLi);
		}
	}
	
	if (element.aVautoComplete.listBox.innerHTML!='')
	{
		if (element.aVautoComplete.onshowlistbox)
			element.aVautoComplete.onshowlistbox({type: 'showlistbox',	target: element});
		aV.Visual.fade(element.aVautoComplete.listBox, 1);
		if (element.aVautoComplete.autoSelectFirst) 
		{
			element.aVautoComplete.list.selectedIndex = 0;
			element.aVautoComplete.listBox.childNodes[0].className = aV.config.AutoComplete.classNames.selectedItem;
		}
		if (element.aVautoComplete.listBox.scrollHeight > element.aVautoComplete.listBox.clientHeight) //check if there is a vertical scrollbar
			element.aVautoComplete.listBox.style.width=(element.aVautoComplete.listBox.clientWidth + 37) + 'px'; //expand the width according to the default scrollbar width to avoid overlapping with it
	}
	else
		aV.AutoComplete._removeListBox(element);
};

aV.AutoComplete._doKeyUp=function(element)
{
	if (element.aVautoComplete.list==undefined || !(element.aVautoComplete.dataChecker && element.aVautoComplete.dataChecker.test(element.aVautoComplete.currentFilter)))
	{
		element.aVautoComplete.dataChecker=aV.AutoComplete._getRegExp(element);
		
		try 
		{
			var params=eval(element.aVautoComplete.params);
		} 
		catch(error) 
		{
			var params = element.aVautoComplete.params;
		}

		/**
		 * @ignore
		 */
		var processResponse=function(requestObject)
		{
			if (aV.AJAX.isResponseOK(requestObject)) 
			{
				if (aV.AJAX.getMimeType(requestObject)!='text/plain')
					element.aVautoComplete.list = aV.AJAX.getResponseAsObject(requestObject);
				else
				{
					element.aVautoComplete.list = requestObject.responseText.split("\n");
					element.aVautoComplete.list.each(function(x){return {value: x}});
				}
				if (element.aVautoComplete.listProcessor)
					element.aVautoComplete.list=element.aVautoComplete.listProcessor(element);
				else
					element.aVautoComplete.list.each(function(x){x.value=x.value.trim(); return x;});
				element.aVautoComplete.list.selectedIndex=-1;
				aV.AutoComplete._showListBox(element);
			}
			else 
			{
				if (element.aVautoComplete.list)
					delete element.aVautoComplete.list;
				
				if (aV.config.AutoComplete.retryOnError)
					aV.AutoComplete._doKeyUp(element);
				else
					aV.AutoComplete._removeListBox(element);
			}
			aV.DOM.removeClass(element, aV.config.AutoComplete.classNames.loading);
		};
		
		params=params + '=' + encodeURIComponent(element.aVautoComplete.currentFilter);// + '&_cursorPos=' + element.aVautoComplete._cursorPosition;
		aV.AJAX.destroyRequestObject(element.aVautoComplete.request);
		aV.DOM.addClass(element, aV.config.AutoComplete.classNames.loading);
		element.aVautoComplete.request=aV.AJAX.makeRequest(
			element.aVautoComplete.HTTPMethod || aV.config.AutoComplete.defaultHTTPMethod,
			element.aVautoComplete.source,
			params,
			processResponse
		);
	}
	else
		aV.AutoComplete._showListBox(element);
	
	delete element.aVautoComplete.keyUpTimer;
};

aV.AutoComplete._onKeyUpHandler=function(event)
{
	if (event.target.aVautoComplete.keyUpTimer) 
	{
		clearTimeout(event.target.aVautoComplete.keyUpTimer);
		delete event.target.aVautoComplete.keyUpTimer;
	}

	var key=event.keyCode || event.which;
	var minChars=(event.target.aVautoComplete.minChars!=undefined)?event.target.aVautoComplete.minChars:aV.config.AutoComplete.minChars;
	event.target.aVautoComplete._cursorPosition=aV.AutoComplete._getCursorPosition(event.target);
	event.target.aVautoComplete.currentFilter=aV.AutoComplete._getFilter(event.target);

	if (event.target.aVautoComplete.currentFilter.length < minChars || key==27) 
	{
		if (event.target.aVautoComplete.list)
			event.target.aVautoComplete.list.selectedIndex=-1;
		aV.AutoComplete._removeListBox(event.target);
		return false;
	}
	
	if (key != 13 && (key > 40 || key < 37 || key == undefined)) 
	{
		if (event.target.aVautoComplete.listBox)
			aV.AutoComplete._doKeyUp(event.target);
		else
		{
			var delay=event.target.aVautoComplete.delay || aV.config.AutoComplete.delay;
			event.target.aVautoComplete.keyUpTimer = setTimeout(function() {aV.AutoComplete._doKeyUp(event.target)}, delay);
		}
	}
};

aV.AutoComplete._onKeyDownHandler=function(event, newIndex)
{
	var key=event.keyCode || event.which;

	if (key == 27) 
		event.preventDefault(); //to prevent IE from clearing the form

	if (event.target.aVautoComplete.list==undefined || !event.target.aVautoComplete.listBox || (key!=13 && (key<37 || key>40) && !(newIndex>-1)))
		return;

	if (event.target.aVautoComplete.list.selectedIndex>-1 && event.target.aVautoComplete.listBox)
		event.target.aVautoComplete.listBox.childNodes[event.target.aVautoComplete.list.selectedIndex].className='';
	else
		event.target.aVautoComplete.list.selectedIndex=-1;
	
	if (newIndex>-1)
		event.target.aVautoComplete.list.selectedIndex=newIndex;

	if (key == 38) 
		event.target.aVautoComplete.list.selectedIndex--;
	else if (key == 40) 
		event.target.aVautoComplete.list.selectedIndex++;
	else if (key == 13)
	{
		var result=true;
		if (event.target.aVautoComplete.list.selectedIndex > -1) 
		{
			result=false;
			event.target.value = event.target.aVautoComplete.currentBaseStr.format(event.target.aVautoComplete.list[event.target.aVautoComplete.listBox.childNodes[event.target.aVautoComplete.list.selectedIndex].listIndex].value);
			if (event.target.aVautoComplete.onselectitem) 
				event.target.aVautoComplete.onselectitem({type: 'selectitem',	target: event.target, selectedIndex: event.target.aVautoComplete.list.selectedIndex});
		}
		delete event.target.aVautoComplete.list.selectedIndex;
		aV.AutoComplete._removeListBox(event.target);
		return result;
	}
	
	event.target.aVautoComplete.list.selectedIndex=(event.target.aVautoComplete.listBox.childNodes.length + event.target.aVautoComplete.list.selectedIndex) % event.target.aVautoComplete.listBox.childNodes.length;
	
	var selectedItem=event.target.aVautoComplete.listBox.childNodes[event.target.aVautoComplete.list.selectedIndex];
	selectedItem.className=aV.config.AutoComplete.classNames.selectedItem;
	if (event.target.aVautoComplete.listBox.scrollTop > selectedItem.offsetTop)
		event.target.aVautoComplete.listBox.scrollTop=selectedItem.offsetTop;
	else if ((event.target.aVautoComplete.listBox.scrollTop + event.target.aVautoComplete.listBox.clientHeight) < (selectedItem.offsetTop + selectedItem.offsetHeight))
		event.target.aVautoComplete.listBox.scrollTop=selectedItem.offsetTop - event.target.aVautoComplete.listBox.clientHeight + selectedItem.offsetHeight + 2;
};

aV.AutoComplete._onBlurHandler=function(event)
{
	if (event.target.aVautoComplete.force && (!event.target.aVautoComplete.list || event.target.aVautoComplete.list.selectedIndex<0))
		event.target.value = event.target.aVautoComplete.currentBaseStr.format('');

	if (event.target.aVautoComplete.selectOnExit) 
	{
		if (!event.keyCode)
			event.keyCode = 13/*enter*/;
		aV.AutoComplete._onKeyDownHandler(event);
	}
	else
		aV.AutoComplete._removeListBox(event.target);

	aV.AJAX.destroyRequestObject(event.target.aVautoComplete.request);
};

aV.AutoComplete._checkElement=function(element)
{
	for (var i=aV.config.AutoComplete.allowedTags.length-1; i>=0; i--)
		if (element.tagName==aV.config.AutoComplete.allowedTags[i])
			return true;
	return false;
};

aV.AutoComplete._setElement=function(element)
{
	if (element.aVautoComplete.source || element.aVautoComplete.params)
	{
		element.setAttribute("autocomplete", "off");
		aV.Events.add(element, 'keyup', aV.AutoComplete._onKeyUpHandler, 0);
		aV.Events.add(element, 'focus', aV.AutoComplete._onKeyUpHandler, 0);
		aV.Events.add(element, 'keydown', aV.AutoComplete._onKeyDownHandler, 0);
		aV.Events.add(element, 'blur', aV.AutoComplete._onBlurHandler, 100);
	}
	else
	{
		element.aVautoComplete=undefined;
		aV.Events.remove(element, 'keyup', aV.AutoComplete._onKeyUpHandler);
		aV.Events.remove(element, 'focus', aV.AutoComplete._onKeyUpHandler);
		aV.Events.remove(element, 'keydown', aV.AutoComplete._onKeyDownHandler);
		aV.Events.remove(element, 'blur', aV.AutoComplete._onBlurHandler);
	}
};

aV.AutoComplete.init=function()
{
	aV.aParser.assignAttributesFromFile(
		aV.config.AutoComplete.ruleFile,
		'aVautoComplete',
		aV.AutoComplete._checkElement,
		aV.AutoComplete._setElement
	);	
};

aV.AJAX.loadResource("/JSLib/css/aV.plg.autoComplete.css", "css", "aVautoCompleteCSS");
aV.Events.add(window, 'domready', aV.AutoComplete.init);