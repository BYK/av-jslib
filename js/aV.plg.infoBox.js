/**
 * @fileOverview	Extens visual effects library to have an info box on top of the page.
 * @name Visual Effects - infoBox Extension
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.3
 *
 * @requires	<a href="http://amplio-vita.net/JSLib_files/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.plg.infoBox.js@" + window.location.href);

if (!aV.Visual)
	throw new Error("aV Visual functions library cannot be found!", "aV.plg.infoBox.js@" + window.location.href);

aV.config.Visual.infoBox=
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
 * @memberOf	aV.Visual
 * @name	aV.Visual.infoBox
 * @type	HTMLDivElementObject
 */
aV.Visual.infoBox=document.createElement("DIV");
aV.Visual.infoBox.id='infoBox';
aV.Visual.infoBox.setAttribute("xOffset", "0");	
aV.Visual.infoBox.setAttribute("yOffset", "0");

/**
 * Clears the timer which is set to hide the infoBox after some interval.
 *
 * @method
 */
aV.Visual.infoBox.clearTimer=function()
{
	if (aV.Visual.infoBox.hideTimer)
			clearTimeout(aV.Visual.infoBox.hideTimer);	
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
aV.Visual.infoBox.show=function(message, image, showImmediately, timeout)
{
	aV.Visual.infoBox.clearTimer();
	if (typeof image=='string' && image!='')
		message='<img src="' + image + '" />' + message;
	if (message)
		aV.Visual.infoBox.innerHTML=message;
	aV.Visual.setOpacity(aV.Visual.infoBox, (showImmediately)?1:0);
	aV.Visual.infoBox.style.visibility="visible";
	
	if (!timeout)
		timeout=aV.config.Visual.infoBox["timeout"];

	aV.Visual.fade(aV.Visual.infoBox, 1, function()
	{
		if (aV.config.Visual.infoBox["timeout"])
			aV.Visual.infoBox.hideTimer=setTimeout('aV.Visual.infoBox.hide();', timeout);
	}
	);
};
		
/**
 * Hides the infoBox with a fade effect and clears the hide timer.
 *
 * @method
 */
aV.Visual.infoBox.hide=function()
{
	aV.Visual.infoBox.clearTimer();
	aV.Visual.fade(aV.Visual.infoBox, 0, function() {aV.Visual.infoBox.style.visibility='hidden';});
};
		
/**
 * The onclick event is assigned directly to the <a href="#aV.Visual.infoBox.hide">hide</a> method
 * of the infoBox to provide hide-on-click support.
 *
 * @private
 * @event
 */
aV.Visual.infoBox.onclick=aV.Visual.infoBox.hide;

aV.Visual.initFunctions.push(
	function()
	{
		if (aV.AJAX)
			aV.AJAX.loadResource("/JSLib/css/aV.plg.infoBox.css", "css", "aVinfoBoxCSS");
		document.body.appendChild(aV.Visual.infoBox);
	}		
);