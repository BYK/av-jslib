/**
 * @fileOverview Extends visual effects library to provide custom hints support.
 * @name Visual Effects - customHint Extension
 *
 * @author Burak Yiğit KAYA	byk@amplio-vita.net
 * @version 1.2
 *
 * @requires <a href="http://amplio-vita.net/JSLib_files/aV.main.visual.js">aV.main.visual.js</a>
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

/**
 * @memberOf Visual
 * @name Visual.customHint
 * @type HTMLDivElementObject
 *
 * @config {integer} offsetX The distance between the mouse cursor and the customHint's upper corner in the x direction. Default is 2.
 * @config {integer} offsetY The distance between the mouse cursor and the customHint's upper corner in the y direction. Default is 2.
 * @config {integer} timeout The time interval before the customHint is automatically hid in milliseconds. Default is 500.
 * @config {integer} maxWidth The maximum width of the customHint div in pixels when showinh a hint. Default is 300.
 */

if (typeof Visual=="undefined")
			throw new Error("Visual functions library cannot be found!", "aV.plg.customHint.js@" + window.location.href, 37);

Visual.initFunctions.push(
	function()
	{
		Visual.customHint=document.createElement("DIV");
		Visual.customHint.id='customHint';
		Visual.customHint.style.position="absolute";

		Visual.customHint.config=
		{
			offsetX: 2,
			offsetY: 2,
			timeout: 500,
			maxWidth: 300
		};
		
		/**
		 * Clears the timer which is set to hide the CustomHint after some interval.
		 *
		 * @method
		 */
		Visual.customHint.clearTimer=function()
		{
			if (this.hideTimer)
			{
				clearTimeout(this.hideTimer);	
				this.hideTimer=null;
			}
		};
		
		/**
		 * Adjusts the size and the position of the hint div according to the data inside it
		 * and the given pop coordinates.
		 *
		 * @method
		 * @param {integer} [xPos] The x coordinate on the page where the hint box will be popped.
		 * @param {integer} [yPos] The y coordinate on the page where the hint box will be popped.
		 */
		Visual.customHint.adjustSizeNPosition=function(xPos, yPos)	
		{
			if (!xPos)
				xPos=this.lastXPos;
			if (!yPos)
				yPos=this.lastYPos;

			this.style.height="auto";
			this.style.width="auto";
			var widthVar=Math.min(this.scrollWidth, Visual.clientWidth()/3);
			this.style.width=widthVar + 'px';
			var heightVar=Math.min(this.scrollHeight, Visual.clientHeight()/3);
			this.style.height=heightVar + 'px';
			this.style.left=((Visual.customHint.config["offsetX"] + xPos + widthVar) < (Visual.clientWidth() + Visual.scrollLeft())) ? (Visual.customHint.config["offsetX"] + xPos + 'px') : (Visual.customHint.config["offsetX"] + xPos - widthVar + 'px');
			this.style.top=((Visual.customHint.config["offsetY"] + yPos + heightVar) < (Visual.clientHeight() + Visual.scrollTop())) ? (Visual.customHint.config["offsetY"] + yPos + 'px') : (Visual.customHint.config["offsetY"] + yPos - heightVar + 'px');
			
			this.lastXPos=xPos;
			this.lastYPos=yPos;
		};
		
		/**
		 * Pops up the hint div with a fade effect at the given coordinates with the given message.
		 * Automatically called by the generated mousemove event handler but might be called manually to show hints.
		 *
		 * @method
		 * @param {String} [message] The message which will appear in the hint.
		 * The string here is assigned to the innerHTML of the customHint.
		 * @param	{integer} xPos The x coordinate on the page where the hint box will be popped.
		 * @param	{integer} yPos The y coordinate on the page where the hint box will be popped.
		 */
		Visual.customHint.pop=function(message, xPos, yPos)
		{
			this.clearTimer();
			if (message)
				this.innerHTML=message;
			Visual.setOpacity(this, 0);
			this.style.visibility="visible";		
			this.adjustSizeNPosition(xPos, yPos);
			
			Visual.fade(this, 1, true/*, function()
			{
				if (Visual.customHint.config["timeout"])
					this.hideTimer=setTimeout('Visual.customHint.hide();', Visual.customHint.config["timeout"]);
			}*/
			);
		};
		
		/**
		 * Hides the customHint with a fade effect and clears the hide timer.
		 *
		 * @method
		 */
		Visual.customHint.hide=function()
		{
			this.clearTimer();
			this.innerHTML='';
			Visual.fade(this, 0, true, function() {this.style.visibility='hidden';});
		};
		
		/**
		 * The onclick event is assigned directly to the <a href="#Visual.customHint.hide">hide</a> method
		 * of the customHint to provide hide-on-click support.
		 *
		 * @private
		 * @event
		 */
		Visual.customHint.onclick=Visual.customHint.hide;
		
		/**
		 * The onmouseover event is assigned directly to the <a href="#Visual.customHint.clearTimeout">clearTimeout</a> method
		 * of the customHint to prevent it hiding when the cursor is over the hint.
		 *
		 * @private
		 * @event
		 */
		Visual.customHint.onmouseover=Visual.customHint.clearTimer;
		
		/**
		 * Sets the hide timer of customHint when the cursor moves away from it.
		 * <br />This event assignment should <b>not</b> be overridden but developers
		 * can use Visual.customHint.onmouseout() to manually set the timer for hiding.
		 *
		 * @method
		 * @event
		 */
		Visual.customHint.onmouseout=function()
		{
			this.hideTimer=setTimeout('Visual.customHint.hide();', Visual.customHint.config["timeout"]);
		};
		
		document.body.appendChild(Visual.customHint);
		
		Events.add(document,
			"mousemove",
			/**
			 * The event handler for the document's onmousemove event to trigger the hints.
			 */
			function(e)
			{
				var element=(e.srcElement)?e.srcElement:e.target;
				var hint;
				if (element && element!=Visual.customHint && element.getAttribute)
				{
					while (element!=Visual.customHint && element.getAttribute && !element.getAttribute("hint") && element.parentNode && element.getAttribute("showParentHint")!="false")
						element=element.parentNode;
					hint=(element.getAttribute)?element.getAttribute("hint"):null;
					if (hint=="%self%")
						hint=element.innerHTML;
				}
				if (element && (hint==Visual.customHint.innerHTML || element==Visual.customHint))
				{
					Visual.customHint.clearTimer();
				}
				else if (!hint && element!=Visual.customHint && Visual.customHint.style.visibility=='visible' && !Visual.customHint.hideTimer)
				{
					Visual.customHint.onmouseout();
				}
				else if (element && hint && element!=Visual.customHint.lastElement)
				{
					Visual.customHint.pop(hint, e.clientX + Visual.scrollLeft(), e.clientY + Visual.scrollTop());
				}
				if (element && element!=Visual.customHint)
					Visual.customHint.lastElement=element;
			}
		);
	}
);