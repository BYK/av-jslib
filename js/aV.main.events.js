/**
 * @fileOverview A cross-browser event management library
 * @name Core Event Management Library
 *
 * @author 
 * <br />Dean Edwards with input from Tino Zijdel, Matthias Miller, Diego Perini dean@edwards.name
 * <br />Adomas Paltanavičius adomas.paltanavicius@gmail.com
 * <br />Burak Yiğit Kaya byk@amplio-vita.net
 * @version 1.2.1
 * @copyright &copy;2005 - 2008
 */

if (!aV)
	var aV={config: {}};

/**
 * Represents the namespace, aV.Events, for creating and managing event handler queues for any element.
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

/**
 * Adds the given event handler to element's the on-type event's event handler queue.
 *
 * @return {Function(EventObject)} The assigned function
 * @param {Object} element The element which the event handler will be added
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
aV.Events.add=function(element, type, handler)
{
	// assign each event handler a unique ID
	if (!handler.$$guid) handler.$$guid = aV.Events.guid++;
	// create a hash table of event types for the element
	if (!element.events) element.events = {};
	// create a hash table of event handlers for each element/event pair
	var handlers = element.events[type];
	if (!handlers) {
		handlers = element.events[type] = {};
		// store the existing event handler (if there is one)
		if (element["on" + type]) {
			handlers[0] = element["on" + type];
		}
	}
	// store the event handler in the hash table
	handlers[handler.$$guid] = handler;
	// assign a global event handler to do all the work
	element["on" + type] = aV.Events._handle;
	return handler;
};

/**
 * Removes the given event handler from element's the on-type event's event handler queue.
 *
 * @param {Object} element The element which the event handler will be removed
 * @param {String} type The name of the event without the "on" prefix
 * @param {Function(EventObject)} handler The event handler function
 *
 * @example
 * aV.Events.remove(window, "resize", resizeAlert);
 */
aV.Events.remove=function(element, type, handler)
{
	// delete the event handler from the hash table
	if (element.events && element.events[type]) {
		delete element.events[type][handler.$$guid];
	}
};

/**
 * Clears all the event handlers attached to the given element.
 * 
 * @param {Object} element
 */
aV.Events.clear=function(element)
{
	if (!element.events)
		return;
	for (var event in element.events)
	{
		for (var guid in element.events[event])
			delete element.events[event][guid];
		delete element.events[event];
		element["on" + event]=undefined;
	}
	delete element.events;
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
	var handlers = this.events[event._type];
	// execute each event handler
	for (var i in handlers) {
		this.$$handleEvent = handlers[i];
		if (this.$$handleEvent(event) === false) {
			returnValue = false;
		}
	}
	//delete this.$$handleEvent;
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

/**
 * Handles the mouse wheel event and iterprets it for a browser independent usage.
 * <br />Adds support for the new event <b>onwheel</b> for all applicable elements.
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
