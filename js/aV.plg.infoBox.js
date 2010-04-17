/**
 * @fileOverview	Extens visual effects library to have an info box on top of the page.
 * @name infoBox Extension
 *
 * @author	Burak Yiğit KAYA	byk@ampliovitam.com
 * @version	1.3
 *
 * @requires	aV.main.effect.js
 * @copyright &copy;2010 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.plg.infoBox.js@" + window.location.href);

if (!aV.Effect)
	throw new Error("aV.Effects library cannot be found!", "aV.plg.infoBox.js@" + window.location.href);

aV.config.infoBox =
{
	/**
	 * The time interval before the infoBox is automatically hid in milliseconds. Default is 3000.
	 * 
	 * @type {integer}
	 */
	timeout: 3000,
	images:
	{
		info: '/JSLib/images/infoBox/info.png',
		warning: '/JSLib/images/infoBox/warning.png',
		error: '/JSLib/images/infoBox/error.png',
		loading: '/JSLib/images/loading.gif'				
	}
};
/**
 * @type	HTMLDivElementObject
 */
aV.infoBox=document.createElement("DIV");
aV.infoBox.id='infoBox';

/**
 * Clears the timer which is set to hide the infoBox after some interval.
 *
 * @method
 */
aV.infoBox.clearTimer=function()
{
	if (aV.infoBox.hideTimer)
			clearTimeout(aV.infoBox.hideTimer);	
};

/**
 * Shows the info box with the given message.
 *
 * @method
 * @param {String} [message] The message which will appear in the info box.
 * The string here is assigned to the innerHTML of the infoBox object.
 * <br />If not set, the innerHTML of the infoBox is left the same.
 * @param {Boolean} [showImmediately] If set, the infoBox appears instantly, without the fade effect.
 * @param {Integer} [timeout] The message spesific timeout in milliseconds. If not given, config.timeout is used.
 */
aV.infoBox.show=function(message, image, showImmediately, timeout)
{
	aV.infoBox.clearTimer();
	if (typeof image=='string' && image!='')
		message='<img src="' + image + '" />' + message;
	if (message)
		aV.infoBox.innerHTML = message;

	aV.infoBox.style.visibility="visible";
	
	if (!timeout)
		timeout=aV.config.infoBox["timeout"];
	
	if (showImmediately)
		aV.CSS.setOpacity(aV.infoBox, 1);
	else
		new aV.Effect(aV.infoBox, {fade: {value: "0_1"}},
			{
				onfinish: function()
				{
					if (aV.config.infoBox["timeout"])
						aV.infoBox.hideTimer = setTimeout(aV.infoBox.hide, timeout);
				},
				id: 'aVinfoBoxEffect'
			}
		).start();
};
		
/**
 * Hides the infoBox with a fade effect and clears the hide timer.
 *
 * @method
 */
aV.infoBox.hide=function()
{
	aV.infoBox.clearTimer();
	new aV.Effect(aV.infoBox, {fade: {value: 0}}, {id: 'aVinfoBoxEffect', onfinish: function() {this.element.style.visibility='hidden';}}).start();
};
		
/**
 * The onclick event is assigned directly to the <a href="#aV.infoBox.hide">hide</a> method
 * of the infoBox to provide hide-on-click support.
 *
 * @private
 * @event
 */
aV.infoBox.onclick=aV.infoBox.hide;

aV.Events.add(window, 'domready',
	function(event)
	{
//		if (aV.AJAX)
//			aV.AJAX.loadResource("/JSLib/css/aV.plg.infoBox.css", "css", "aVinfoBoxCSS");
		document.body.appendChild(aV.infoBox);
	}		
);
