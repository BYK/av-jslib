/**
 * @fileOverview A library which introduces an easy to use Effect class
 * @name Effects Library
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 2.1
 *
 * @requires aV.ext.object
 * @requires aV.main.CSS
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.main.effect.js@" + window.location.href);

if (!aV.config.Effect)
	aV.config.Effect = {};
	
aV.config.Effect.unite(
	{
		defaults: 
		{
			interval: 50,
			duration: 750,
			converger: 'exponential'
		},
		uniqueOptions: ['onfinish', 'ontick', 'id'],
		convergers: 
		{
			linear: function(step, steps)
			{
				return step / steps;
			},
			exponential: function(step, steps)
			{
				return 1 - Math.exp(-5 * step / steps);
			},
			trigonometric: function(step, steps)
			{
				return (Math.cos((step / steps - 1) * Math.PI) + 1) / 2;
			},
			power: function(step, steps)
			{
				var x = 12 * step / steps;
				return 1 - Math.pow(x / 2, -x / 4);
			}
		},
		animations: 
		{
			fade: function(element, options)
			{
				var pattern = /^([.\d]+_|)([.\d]+)/, matchInfo, startValue;
				matchInfo = pattern.exec(options.value);
				startValue = parseFloat(matchInfo[1]) || aV.CSS.getOpacity(element) || 0;
				
				return [
					{
						start: startValue,
						end: parseFloat(matchInfo[2]) || ((startValue < 0.5) ? 1 : 0),
						set: aV.CSS.setOpacity,
						converger: options.converger
					}
				];
			},
			style: function(element, options)
			{
				var animations = [], pattern = /^(-?[.\d]+_|)(-?[.\d]+|\*)(pt|px|em|\%|)$/, currentValue, inputMatch, currentMatch;
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
								end: (inputMatch[2] !== '*') ? parseFloat(inputMatch[2]) || 0 : element['scroll' + propertyName.ucWords()], //the last part here is actually only for height and width values
								propertyName: propertyName.camelize(),
								unit: inputMatch[3] || currentMatch[3] || '',
								set: function(element, value){element.style[this.propertyName] = value + this.unit;},
								converger: options.converger
							}
						);
					}
				return animations;
			},
			color: function(element, options)
			{
				var animations = [], pattern = /^(.{3,7}_|)(.{3,7})$/, startColor, endColor, inputMatch;
				for (var propertyName in options)
					if (options.hasOwnProperty(propertyName) && propertyName != 'converger')
					{
						inputMatch = pattern.exec(options[propertyName]);
						startColor = aV.Color.RGBtoHSL(
							aV.Color.StringtoRGB(inputMatch[1].substring(0, inputMatch[1].length - 1)) || aV.Color.StringtoRGB(aV.CSS.getElementStyle(element, propertyName))
						);
						endColor = aV.Color.RGBtoHSL(aV.Color.StringtoRGB(inputMatch[2]));
						//the if statements below are for smoother transitions from/to full black and from/to full white color animations
						if (endColor.l == 1 || endColor.l == 0)
						{
							endColor.h = startColor.h;
							endColor.s = startColor.s;
						}
						else if (startColor.l == 1 || startColor.l == 0)
						{
							startColor.h = endColor.h;
							startColor.s = endColor.s;
						}

						animations.push(
							{
								start: 0,
								end: 1,
								startColor: startColor,
								newColor: {h: 0, s:0, l: 0},
								colorDiff: {h: endColor.h - startColor.h, s: endColor.s - startColor.s, l: endColor.l - startColor.l},
								propertyName: propertyName.camelize(),
								set: function(element, value)
								{
									this.newColor.h = this.startColor.h + this.colorDiff.h*value;
									this.newColor.s = this.startColor.s + this.colorDiff.s*value;
									this.newColor.l = this.startColor.l + this.colorDiff.l*value;
									element.style[this.propertyName] = aV.Color.RGBtoString(aV.Color.HSLtoRGB(this.newColor));
								},
								converger: options.converger
							}
						);
					}
				return animations;
			}
		},
		sets:
		{
			fade: function()
			{
				var show = aV.CSS.getOpacity(this.element) < 0.5 || this.element.style.display == 'none',
				animations = {fade: {value: show ? 1 : 0}};
				if (show)
					this.element.style.display = ''; //to remove 'none' if exists
				else
					this.options.onfinish.push(function(){this.element.style.display = 'none'});
				return animations;
			},
			slideToggle: function()
			{
				var toHeight = (this.element.clientHeight < this.element.scrollHeight) ? this.element.scrollHeight : 0;
        return {style: {height: toHeight + "px"}, fade: {value: (toHeight) ? 1 : 0}};
			}
		}
	},
	false
);

aV.Effect = function(element, animations, options)
{
	if (!element)
		return false;

	/**
	 * 
	 */
	this.element = element;
	/**
	 * 
	 */
	this.options = (options || {}).unite(
		{
			interval: aV.config.Effect.defaults.interval,
			duration: aV.config.Effect.defaults.duration,
			defaultConverger: aV.config.Effect.defaults.converger,
			onfinish: [],
			ontick: function(){}
		},
		false
	);

	if (!(this.options.onfinish instanceof Array))
		this.options.onfinish = [this.options.onfinish];

	this.step = 0;
	this.steps = Math.round(this.options.duration / this.options.interval)
	
	if (typeof animations == 'string')
		animations = aV.config.Effect.sets[animations] || {};
	
	if (typeof animations == 'function')
		animations = animations.call(this);
	
	if (this.options.id)
	{
		if (!this.element.aVactiveEffects)
			this.element.aVactiveEffects = {};
		
		if (this.element.aVactiveEffects[this.options.id])
			this.element.aVactiveEffects[this.options.id].stop(true);
		
		this.element.aVactiveEffects[this.options.id] = this;
	}
	
	if (animations instanceof Array)
	{
		var activeEffect = this;
		this.animationInitializers = animations[0];
		for (var i = 1, length = animations.length; i < length; i++)
			activeEffect = activeEffect.chain(animations[i]);
		
		return activeEffect;
	}
	else
	{
		this.animationInitializers = animations;
		return this;
	}
};

aV.Effect.prototype._progressAnimation = function(index, finished)
{
	var animation = this.animations[index];
	animation.set(this.element, ((finished) ? 1 : animation.converger(this.step, this.steps))*animation.diff + animation.start);
};

aV.Effect.prototype._progress = function()
{
	var finished = ++this.step == this.steps;
	for (var i = 0, length = this.animations.length; i < length; i++) 
		this._progressAnimation(i, finished);
	this.options.ontick.call(this);
	if (finished)
		this.stop();
	return this;
};

aV.Effect.prototype.start = function()
{
	if (this.baseEffect)
	{
		var effect = this.baseEffect;
		this.baseEffect = undefined;
		return effect.start();
	}
	
	this.animations = [];
	var animations = this.animationInitializers,
	start, animationName, animationSet, animation;

	for (var animationName in animations)
		if (animations.hasOwnProperty(animationName) && (animationName in aV.config.Effect.animations)) 
		{
			animationSet = aV.config.Effect.animations[animationName](this.element, animations[animationName]);
			for (var i = 0, length = animationSet.length; i < length; i++)
			{
				animation = animationSet[i];

				animation.start = animation.start || 0;
				if (typeof animation.end != 'number')
					animation.end = 1;
				animation.diff = animation.end - animation.start;
				if (!(animation.converger instanceof Function))
					animation.converger = aV.config.Effect.convergers[animation.converger] || aV.config.Effect.convergers[this.options.defaultConverger];
				this.animations.push(animation);
			}
		}
	
	this.resume();
	return this;
};
	
aV.Effect.prototype.stop = function(stopAll)
{
	if (this.ticker) 
	{
		window.clearInterval(this.ticker);
		this.ticker = undefined;
		for (var i = 0, length = this.options.onfinish.length; i < length; i++)
			this.options.onfinish[i].call(this);
		if (!stopAll && this.chainEffect)
			this.chainEffect.start();
	}
	else if (stopAll && this.chainEffect)
		this.chainEffect.stop(true);
	
	if (this.options.id && this.element.aVactiveEffects)
		delete this.element.aVactiveEffects[this.options.id];

	return this;
};

aV.Effect.prototype.resume = function()
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

aV.Effect.prototype.pause = function()
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

aV.Effect.prototype.chain = function(animations, options, element)
{
	if (!options)
	{
		options = this.options.clone();
		for (var i = 0, length = aV.config.Effect.uniqueOptions.length; i < length; i++)
			if (options[aV.config.Effect.uniqueOptions])
				delete options[aV.config.Effect.uniqueOptions];
	}//reset event handlers to prevent chaos

	this.chainEffect = new aV.Effect(element || this.element, animations, options);
	this.chainEffect.baseEffect = this.baseEffect || this;
	this.baseEffect = undefined;
	return this.chainEffect;
};
