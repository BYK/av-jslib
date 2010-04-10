/**
 * @fileOverview A cross-browser event management library
 * @name Core Event Management Library
 *
 * @author 
 * <br />Dean Edwards with input from Tino Zijdel, Matthias Miller, Diego Perini <dean@edwards.name>
 * <br />Adomas Paltanavicius <adomas.paltanavicius@gmail.com>
 * <br />Burak Yiğit Kaya <byk@ampliovitam.com>
 * @version 1.4.1
 * @copyright &copy;2010 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	var aV={config: {}};

/**
 * Represents the namespace, aV.Events, for creating and managing event handler queues for any object.
 *
 * @namespace
 */
aV.Events = {};

/**
 * A counter used to create unique IDs for given event handlers.
 *
 * @private
 * @type integer
 */
aV.Events.guid=1;

aV.Events._sortHandlers=function(target, type)
{
	var eventComparator=function(a,b)
	{
		return target.events[type].priorities[b.$$guid] - target.events[type].priorities[a.$$guid];
	};
	target.events[type].list.sort(eventComparator);
};

/**
 * Adds the given event handler to element's the on-type event's event handler queue.
 *
 * @return {Function(EventObject)} The assigned function
 * @param {Object} target The object which the event handler will be added
 * @param {String} type The name of the event without the "on" prefix
 * @param {Function(EventObject)} handler The event handler function
 *
 * @example
 * function resizeAlert(e)
 * {
 * 	alert("You have resized the window!");
 * }
 * aV.Events.add(window, "resize", resizeAlert);
 */
aV.Events.add=function(target, type, handler, priority)
{
	if (typeof priority!='number')
		priority=1;
	// assign each event handler a unique ID
	if (!handler.$$guid) handler.$$guid = aV.Events.guid++;
	// create a hash table of event types for the target
	if (!target.events) target.events = {};
	// create a hash table of event handlers for each target/event pair
	var handlers = target.events[type];
	if (!handlers) {
		handlers = target.events[type] = {list: [], priorities: {}};
	}
	// store the event handler in the hash table
	if (target.events[type].list.indexOf(handler)>-1)
		return handler;
	handlers.list.push(handler);
	handlers.priorities[handler.$$guid] = priority;
	//sort the handler list according to priorities
	aV.Events._sortHandlers(target, type);
	// assign a global event handler to do all the work
	target["on" + type] = aV.Events._handle;
	return handler;
};

/**
 * Removes the given event handler from target's the on-type event's event handler queue.
 *
 * @param {Object} target The target which the event handler will be removed
 * @param {String} type The name of the event without the "on" prefix
 * @param {Function(EventObject)} handler The event handler function
 *
 * @example
 * aV.Events.remove(window, "resize", resizeAlert);
 */
aV.Events.remove=function(target, type, handler)
{
	if (handler.$$guid && target.events && target.events[type])
	{
		var handlerIndex=target.events[type].list.indexOf(handler);
		if (handlerIndex>-1)
		{
			target.events[type].list.splice(handlerIndex, 1);
			return (delete target.events[type].priorities[handler.$$guid]);
		}
	}
	return false;
};

/**
 * Clears all the event handlers attached to the given target.
 * 
 * @param {Object} target
 */
aV.Events.clear=function(target)
{
	if (!target.events)
		return;
	for (var event in target.events)
	{
		if (!target.events.hasOwnProperty(event))
			continue;

		for (var guid in target.events[event]) 
			if (target.events[event].hasOwnProperty(guid))
				delete target.events[event][guid];
		delete target.events[event];
		target["on" + event]=null;
	}
	target.events=undefined;
}

/**
 * The generic event handler which manages the event queue
 *
 * @private
 * @param {EventObject}
 * @return {Boolean}
 */
aV.Events._handle=function(event)
{
	var returnValue = true;
	// grab the event object (IE uses a global event object)
	event = event || aV.Events.fix(((this.ownerDocument || this.document || this).parentWindow || window).event);
	if (!event._type)
		event._type=event.type;
	// get a reference to the hash table of event handlers
	if (!this.events[event._type])
		return;

	var handlers = this.events[event._type].list;
	// execute each event handler
	for (var i=0; i<handlers.length; i++)
	{
		try 
		{
			if (handlers[i].call(this, event) === false) 
				returnValue = false;
		}
		catch(error)
		{
			if (window.onerror)
				window.onerror(error.message, error.fileName, error.lineNumber);
		}
	}
	return returnValue;
};

/**
 * Adds W3C standard event methods and properties to an IE non-standard event object
 *
 * @param {EventObject} event The IE non-standard event object
 * @return {EventObject} The event object which supports W3C standard event methods
 */
aV.Events.fix=function(event)
{
	event.target=event.srcElement;
	event.preventDefault = function() {this.returnValue=false;};
	event.stopPropagation = function() {this.cancelBubble=true;};
	return event;
},

aV.Events.trigger=function(target, type, parameters)
{
	if (!parameters)
		parameters={};

	parameters=({type: type,	target: target}).unite(parameters, false);

	if (target["on" + type])
		window.setTimeout(function(){target["on" + type](parameters)}, 0);
};

/**
 * Handles the mouse wheel event and iterprets it for a browser independent usage.
 * <br />Adds support for the new event <b>onwheel</b> for all applicable objects.
 *
 * @private
 * @return {Boolean}
 */
aV.Events._handleMouseWheelEvent=function(event)
{
	if (!event) /* For IE. */
		event = aV.Events.fix(window.event);

	event._type="wheel";
	event.delta=0;
	if (event.wheelDelta) /* IE/Opera. */
	{
		event.delta = event.wheelDelta/120;
		/** In Opera 9, delta differs in sign as compared to IE.
		 */
		if (window.opera)
			event.delta = -event.delta;
	}
	else if (event.detail) /** Mozilla case. */
	{
		/** In Mozilla, sign of delta is different than in IE.
		 * Also, delta is multiple of 3.
		 */
		event.delta = -event.detail/3;
	}
	/** If delta is nonzero, handle it.
	 * Basically, delta is now positive if wheel was scrolled up,
	 * and negative, if wheel was scrolled down.
	 */
	if (event.target && event.delta)
	{
		event._target=event.target;
		while (event._target!=document && !event._target.onwheel)
			event._target=event._target.parentNode;
		if (event._target.onwheel)
			event._target.onwheel(event);
	}
};

/* Initialization code for onwheel */
if (window.addEventListener)
	// DOMMouseScroll is for mozilla
	window.addEventListener('DOMMouseScroll', aV.Events._handleMouseWheelEvent, false);
// IE/Opera
window.onmousewheel = document.onmousewheel = aV.Events._handleMouseWheelEvent;

aV.Events._handleDOMReadyEvent=function(event)
{
	aV.Events.trigger(document, 'domready', event);
	aV.Events.trigger(window, 'domready', event);
};

/* for Mozilla/Opera9 */
if (document.addEventListener)
{
	document.addEventListener("DOMContentLoaded", aV.Events._handleDOMReadyEvent, false);
	aV.Events._onDOMReadyEventBinded=true;
}

//The cross-browser binding codes below are adapted from http://dean.edwards.name/weblog/2006/06/again/

// for Internet Explorer (using conditional comments)
/*@cc_on @*/
/*@if (@_win32)
document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
var script = document.getElementById("__ie_onload");
script.onreadystatechange = function()
{
	if (this.readyState == "complete")
		aV.Events._handleDOMReadyEvent(); // call the onload handler
};
aV.Events._onDOMReadyEventBinded=true;
/*@end @*/

if (/WebKit/i.test(navigator.userAgent)) // sniff
{
  var _timer = setInterval(
		function()
		{
			if (/loaded|complete/.test(document.readyState))
			{
				clearInterval(_timer);
				aV.Events._handleDOMReadyEvent(); // call the onload handler
			}
		}, 10);
	aV.Events._onDOMReadyEventBinded=true;
}

if (!aV.Events._onDOMReadyEventBinded)
	aV.Events.add(window, "load", aV.Events._handleDOMReadyEvent);
