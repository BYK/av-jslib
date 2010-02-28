/**
 * @fileOverview A visual effects function library.
 * @name Visual Effects and Functions Library
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 2.1
 *
 * @requires aV.ext.object
 * @requires aV.main.CSS
 * @copyright &copy;2010 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.main.visual.js@" + window.location.href);

/**
 * Represents a namespace, aV.Visual, for the new functions and global parameters of those functions.
 *
 * @namespace
 */
aV.Visual = {};

if (!aV.config.Visual)
	aV.config.Visual = {};
	
aV.config.Visual.unite(
	{
		defaults: 
		{
			interval: 50,
			duration: 750,
			converger: 'exponential'
		},
		convergers: 
		{
			linear: function(start, end, steps)
			{
				this.step = 0;
				this.steps = steps;
				this.m = (end - start) / this.steps;
				this.c = start;
				this.next = function()
				{
					this.step++;
					return this.m * this.step + this.c;
				};
			},
			exponential: function(start, end, steps)
			{
				this.step = 0;
				this.steps = steps;
				this.increment = 5 / this.steps;
				this.c = start;
				this.m = (end - start);
				this.next = function()
				{
					this.step++;
					return (1 - Math.exp(-this.step * this.increment)) * this.m + this.c;
				};
			},
			trigonometric: function(start, end, steps)
			{
				this.step = 0;
				this.steps = steps;
				this.m = (end - start);
				this.c = start;
				this.next = function()
				{
					this.step++;
					return (Math.cos((this.step / this.steps - 1) * Math.PI) + 1) * this.m / 2 + this.c;
				};
			},
			power: function(start, end, steps)
			{
				this.step = 0;
				this.steps = steps;
				this.increment = 12 / this.steps;
				this.c = start;
				this.m = (end - start);
				this.next = function()
				{
					this.step++;
					var x = this.step * this.increment;
					return (1 - Math.pow(x / 2, -x / 4)) * this.m + this.c;
				};
			}
		},
		animations: 
		{
			custom: function(element, options) {return [options];},
			fade: function(element, options)
			{
				if (typeof options.start != 'number') 
					options.start = aV.CSS.getOpacity(element);
				
				if (typeof options.end != 'number') 
					options.end = (options.start < 0.5) ? 1 : 0;
				
				options.set = aV.CSS.setOpacity;
				return [options];
			},
			style: function(element, options)
			{
				var animations = [], pattern = /^(-?[.\d]+_|)(-?[.\d]+)(pt|px|em|\%|)$/, currentValue, inputMatch, currentMatch;
				for (var propertyName in options)
					if (options.hasOwnProperty(propertyName) && propertyName != 'converger')
					{
						currentValue = aV.CSS.getElementStyle(element, propertyName);
						if (currentValue == 'auto') //IE returns auto for unset width and height values
							currentValue = element['client' + propertyName.ucWords()] + "px";
						currentMatch = pattern.exec(currentValue);
						inputMatch = pattern.exec(options[propertyName]);
						animations.push(
							{
								start: parseFloat(inputMatch[1] || currentMatch[2]) || 0,
								end: parseFloat(inputMatch[2]) || 0,
								propertyName: propertyName,
								unit: inputMatch[3] || currentMatch[3],
								set: function(element, value){element.style[this.propertyName] = value + this.unit;},
								converger: options.converger
							}
						);
					}
				return animations;
			}
		},
		effects:
		{
			
		}
	},
	false
);

aV.Visual.Effect = function(element, animations, options)
{
	if (!element)
		return false;

	this.element = element;
	this.options = (options || {}).unite(
		{
			interval: aV.config.Visual.defaults.interval,
			duration: aV.config.Visual.defaults.duration,
			defaultConverger: aV.config.Visual.defaults.converger,
			ontick: function(){}
		},
		false
	);

	this.animationInitializers = animations;
	return this;
};

aV.Visual.Effect.prototype._progressAnimation = function(index, finished)
{
	var animation = this.animations[index];
	animation.set(this.element, (finished) ? animation.end : animation.converger.next());
};

aV.Visual.Effect.prototype._progress = function()
{
	var finished = this.animations[0].converger.step == this.animations[0].converger.steps;
	for (var i = 0, length = this.animations.length; i < length; i++) 
		this._progressAnimation(i, finished);
	this.options.ontick(this);
	if (finished)
		this.stop();
	return this;
};

aV.Visual.Effect.prototype.start = function()
{
	if (this.baseEffect)
	{
		var effect = this.baseEffect;
		this.baseEffect = undefined;
		return effect.start();
	}
	
	this.animations = [];
	var animations = this.animationInitializers, start, animationName, animationSet, animation;
	for (var animationName in animations)
		if (animations.hasOwnProperty(animationName) && (animationName in aV.config.Visual.animations)) 
		{
			animationSet = aV.config.Visual.animations[animationName](this.element, animations[animationName]);
			for (var i = 0, length = animationSet.length; i < length; i++)
			{
				animation = animationSet[i];
				if (!(animation.converger in aV.config.Visual.convergers))
					animation.converger = this.options.defaultConverger;

				animation.start = animation.start || 0;
				animation.converger = new aV.config.Visual.convergers[animation.converger](
					animation.start,
					animation.end,
					Math.round(this.options.duration / this.options.interval)
				);
				this.animations.push(animation);
			}
		}
	
	this.resume();
	return this;
};
	
aV.Visual.Effect.prototype.stop = function(stopAll)
{
	if (this.ticker) 
	{
		window.clearInterval(this.ticker);
		this.ticker = undefined;
		if (this.options.onfinish instanceof Function)
			this.options.onfinish(this);
		if (!stopAll && this.chainEffect)
			this.chainEffect.start();
	}
	else if (stopAll && this.chainEffect)
		this.chainEffect.stop(true);
	return this;
};

aV.Visual.Effect.prototype.resume = function()
{
	if (this.activeEffect) 
		return this.activeEffect.resume();
	else 
	{
		var self = this;
		this.ticker = window.setInterval(function() {self._progress()}, this.options.interval);
		return this;
	}
};

aV.Visual.Effect.prototype.pause = function()
{
	if (this.ticker) 
	{
		window.clearInterval(this.ticker);
		this.ticker = undefined;
		return this;
	}
	else if (this.chainEffect)
		return this.activeEffect = this.chainEffect.pause();
};

aV.Visual.Effect.prototype.chain = function(animations, options, element)
{
	this.chainEffect = new aV.Visual.Effect(element || this.element, animations, options || this.options);
	this.chainEffect.baseEffect = this.baseEffect || this;
	this.baseEffect = undefined;
	return this.chainEffect;
};

/**
 * Slides the given HTML element to the given dimension with a combined fade efect. The effects slow down non-linearly.
 *
 * @deprecated
 * @param	{HTMLElementObject}	obj	The HTML element ITSELF which will be slided. It *MUST* have an ID.
 * @param	{Integer}	newDimension	The desired/target height/width to be slided to.
 * @param	{Integer [-1,1]}	opcDirection	The opacity change direction identifier. If it is positive the opacity INCREASES with the continuing slide operation and vice versa.
 * @param	{Boolean}	horizontalSlide	Defines if the newDimension is a height value or a width value. (Width if true)
 * @param	{Function(HTMLElementObject)}	[callback]	The function which will be called immediately after the slide operation is finished.
 */
aV.Visual.fadeNSlide = function(element, newValue, opcDirection, isHorizontal, callback)
{
	var propertyName = (isHorizontal) ? "width" : "height",
	isFadeIn = (opcDirection >= 0),
	styleInfo = {converger: 'trigonometric'};

	styleInfo[propertyName] = newValue + 'px';
  return new aV.Visual.Effect(element, {fade: {start: (isFadeIn) ? 0 : 1, end: (isFadeIn) ? 1 : 0}, style: styleInfo}, {onfinish: function(effect){if (callback) callback(element);}}).start();
};

aV.Visual.toggle=function(element, display)
{
	if (!display)
		display = '';

	if (element.style.display == 'none')
		element.style.display = display;
	else
		element.style.display = 'none';
};

aV.Visual.slideToggle=function (element, maxDimension, offset, horizontal, callback)
{
	var newDimension, direction;
	var propertyStr=(horizontal)?'Width':'Height';
	if (!offset)
		offset=0;
	if (!maxDimension)
		maxDimension=element['scroll' + propertyStr];
	if (element['client' + propertyStr]<maxDimension)
	{
		newDimension=maxDimension + offset;
		direction=1;
	}
	else
	{
		newDimension=0;
		direction=-1
	}
	aV.Visual.fadeNSlide(element, newDimension, direction, horizontal, callback);
};
