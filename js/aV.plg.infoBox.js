/**
 * @fileOverview	Extens visual effects library to have an info box on top of the page.
 * @name Visual Effects - infoBox Extension
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.2
 *
 * @requires	<a href="http://amplio-vita.net/JSLib_files/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (typeof Visual=="undefined")
			throw new Error("Visual functions library cannot be found!", "aV.plg.infoBox.js@" + window.location.href, 13);

/**
 * @memberOf	Visual
 * @name	Visual.infoBox
 * @type	HTMLDivElementObject
 *
 * @config	{integer}	timeout	The time interval before the infoBox is automatically hid in milliseconds. Default is 3000.
 */
Visual.initFunctions.push(
	function()
	{
		Visual.infoBox=document.createElement("DIV");
		Visual.infoBox.id='infoBox';
		Visual.infoBox.setAttribute("xOffset", "0");	
		Visual.infoBox.setAttribute("yOffset", "0");
		document.body.appendChild(Visual.infoBox);
		
		Visual.infoBox.config=
		{
			/**
			 * The time interval before the infoBox is automatically hid in milliseconds. Default is 3000.
			 * 
			 * @type {integer}
			 */
			timeout: 3000
		};
		
		/**
		 * Clears the timer which is set to hide the infoBox after some interval.
		 *
		 * @method
		 */
		Visual.infoBox.clearTimer=function()
		{
			if (this.hideTimer)
					clearTimeout(this.hideTimer);	
		}
		
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
		Visual.infoBox.show=function(message, showImmediately, timeout)
		{
			this.clearTimer();
			if (message)
				this.innerHTML=message;
			Visual.setOpacity(this, (showImmediately)?1:0);
			this.style.visibility="visible";
			
			if (!timeout)
				timeout=Visual.infoBox.config["timeout"];

			Visual.fade(this, 1, function()
			{
				if (Visual.infoBox.config["timeout"])
					this.hideTimer=setTimeout('Visual.infoBox.hide();', timeout);
			}
			);
		};
		
		/**
		 * Hides the infoBox with a fade effect and clears the hide timer.
		 *
		 * @method
		 */
		Visual.infoBox.hide=function()
		{
			this.clearTimer();
			Visual.fade(this, 0, function() {this.style.visibility='hidden';});
		};
		
		/**
		 * The onclick event is assigned directly to the <a href="#Visual.infoBox.hide">hide</a> method
		 * of the infoBox to provide hide-on-click support.
		 *
		 * @private
		 * @event
		 */
		Visual.infoBox.onclick=Visual.infoBox.hide;
	}
);
