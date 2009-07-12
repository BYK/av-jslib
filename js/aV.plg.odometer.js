/**
 * @author BYK
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.plg.odometer.js@" + window.location.href);

aV.config.Odometer=
{
	digitsImage: '/JSLib/images/Odometer/digits.gif',
	ruleFile: 'aVodometerRules.txt',
	digitCount: 6,
	transition:
	{
		type: 'power',
		duration: 2000
	},
	classNames:
	{
		general: 'aVodometer',
		digit: 'aVodometerDigit'
	}
};

aV.Odometer={};

aV.Odometer.elementList=[];

aV.Odometer._setElement=function(element)
{
	aV.DOM.addClass(element, aV.config.Odometer.classNames.general)
	element.aVodometer.number=parseInt(element.innerHTML.stripHTML()) || 0;
	if (!element.aVodometer.digits)
		element.aVodometer.digits=aV.config.Odometer.digitCount;
	
	element.innerHTML='';
	for (var i=0; i<element.aVodometer.digits; i++)
	{
		var newDiv=element.appendChild(document.createElement("div"));
		newDiv.style.width=aV.config.Odometer.digitWidth + "px";
		newDiv.style.height=aV.config.Odometer.digitHeight + "px";
		aV.DOM.addClass(newDiv, aV.config.Odometer.classNames.digit);
	}
	
	aV.Odometer.setNumber(element, false);
	if (element.aVodometer.refreshURL && element.aVodometer.refreshInterval)
		aV.Odometer.refreshElement(element);
};

aV.Odometer.setNumber=function(element, animation)
{
	var digits=element.getElementsByTagName("div");
	var newPositions=new Array(digits.length);
	var number=element.aVodometer.number;
	for (var i=digits.length-1; i>=0; i--)
	{
		var currentExponent=Math.pow(10, i);
		newPositions[digits.length - i - 1]=Math.floor(number/currentExponent);
		number-=currentExponent*newPositions[digits.length - i - 1];
		newPositions[digits.length - i - 1]=(newPositions[digits.length - i - 1] + 1)%10;
		newPositions[digits.length - i - 1]*=aV.config.Odometer.digitHeight;
	}
	
	if (animation===false)
	{
		for (var i=0; i<digits.length; i++)
			digits[i].style.backgroundPosition="0 " + newPositions[i] + "px";
	}
	else
	{
		for (var i = 0; i < digits.length; i++) 
		{
			/**
			 * @ignore
			 */
			digits[i].tickFunction=function(ticker)
			{
				ticker.element.style.backgroundPosition = "0 " + Math.round(ticker.currentVal) + "px";
			};
			digits[i].ticker=new aV.Visual.animationTicker(parseInt(digits[i].style.backgroundPosition.split(" ")[1]), newPositions[i], digits[i].tickFunction, aV.config.Odometer.transition.type, aV.config.Odometer.transition.duration);
			digits[i].ticker.element=digits[i];
		}
	}
};

aV.Odometer.refreshElement=function(element)
{
	var completedFunction=function(requestObject)
	{
		if (aV.AJAX.isResponseOK(requestObject)) 
		{
			element.aVodometer.number = parseInt(requestObject.responseText);
			aV.Odometer.setNumber(element);
		}
		window.setTimeout(function(){aV.Odometer.refreshElement(element);}, element.aVodometer.refreshInterval);
	};
	aV.AJAX.makeRequest("GET", element.aVodometer.refreshURL, '', completedFunction);
};

aV.Odometer.init = function()
{
	aV.Odometer.digitsImage = new Image();
	aV.Events.add(aV.Odometer.digitsImage, "load", function(event)
	{
		aV.config.Odometer.digitHeight = aV.Odometer.digitsImage.height / 10;
		aV.config.Odometer.digitWidth = aV.Odometer.digitsImage.width;
		aV.aParser.assignAttributesFromFile(
		aV.config.Odometer.ruleFile,
		'aVodometer',
		false,
		aV.Odometer._setElement
	);	
	});
	aV.Odometer.digitsImage.src = aV.config.Odometer.digitsImage;
}
aV.AJAX.loadResource("/JSLib/css/aV.plg.odometer.css", "css", "aVodometerCSS");
aV.Events.add(window, "load", aV.Odometer.init);