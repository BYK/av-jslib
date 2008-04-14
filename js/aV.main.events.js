/**
 * @fileOverview	A good, cross-browser event management library
 * @name	Event Management Library
 *
 * @author Dean Edwards with input from Tino Zijdel, Matthias Miller, Diego Perini
 * @version 1.0
 * @copyright &copy;2005
 * @original <a href="http://dean.edwards.name/weblog/2005/10/add-event/" target="_blank">http://dean.edwards.name/weblog/2005/10/add-event/</a>
 * @extra ScripDoc documentation, namespace adaptation and implementation of the new <b>onwheel</b> event by BYK, byk@amplio-vita.net (2008)
 */

if (typeof Events!="undefined")
	throw new Error('"Events" namespace had already been taken!', "events.js@" + window.location.href, 13);

/**
 * Represents a namespace, Events, for creating and managing an event handler queue for any element.
 *
 * @namespace
 */
Events = {};

/**
 * A counter used to create unique IDs for given event handlers.
 *
 * @private
 * @type integer
 */
Events.guid=1;

/**
 * Adds the given event handler to element's the on-type event's event handler queue.
 *
 * @method
 * @param {Object} element The element which the event handler will be added
 * @param {String} type The name of the event without the "on" prefix
 * @param {Function(EventObject)} handler The event handler function
 *
 * @example
 * function resizeAlert(e)
 * {
 * 	alert("You have resized the window!");
 * }
 * Events.add(window, "resize", resizeAlert);
 */
Events.add=function(element, type, handler)
{
	// assign each event handler a unique ID
	if (!handler.$$guid) handler.$$guid = Events.guid++;
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
	element["on" + type] = Events._handle;
};

/**
 * Removes the given event handler from element's the on-type event's event handler queue.
 *
 * @method
 * @param {Object} element The element which the event handler will be removed
 * @param {String} type The name of the event without the "on" prefix
 * @param {Function(EventObject)} handler The event handler function
 *
 * @example
 * Events.remove(window, "resize", resizeAlert);
 */
Events.remove=function(element, type, handler)
{
	// delete the event handler from the hash table
	if (element.events && element.events[type]) {
		delete element.events[type][handler.$$guid];
	}
};

/**
 * The generic event handler which manages the event queue
 *
 * @private
 * @param {EventObject}
 * @return {Boolean}
 */
Events._handle=function(event)
{
	var returnValue = true;
	// grab the event object (IE uses a global event object)
	event = event || Events.fix(((this.ownerDocument || this.document || this).parentWindow || window).event);
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
 * Adds W3C standard event methods to an IE non-standard event object
 *
 * @param {EventObject} event The IE non-standard event object
 * @return {EventObject} The event object which supports W3C standard event methods
 */
Events.fix=function(event)
{
	if (event.srcElement)
		event.target=event.srcElement;
	event.preventDefault = function() {this.returnValue=false;};
	event.stopPropagation = function() {this.cancelBubble=true;};
	return event;
},

/**
 * Handles the mouse wheel event and iterprets it for a browser independent usage.
 * <br />Adds support for the new event <b>onwheel</b> for all applicable elements.
 *	<br /><br /><i>Main handling code from	<a href="http://adomas.org/javascript-mouse-wheel/" target="_blank">http://adomas.org/javascript-mouse-wheel/</a>
 * <br />Implemantation and adaptation by BYK</i>
 *
 * @private
 * @deprecated
 * @return {Boolean}
 */
Events._handleMouseWheelEvent=function(event)
{
	if (!event) /* For IE. */
		event = Events.fix(window.event);

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
	window.addEventListener('DOMMouseScroll', Events._handleMouseWheelEvent, false);
// IE/Opera
window.onmousewheel = document.onmousewheel = Events._handleMouseWheelEvent;