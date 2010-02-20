/**
 * @fileOverview A collection of useful color functions.
 * @name Color Functions Library
 *
 * @author Burak Yiğit KAYA	<byk@amplio-vita.net>
 * @version 1.0
 *
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!window.aV)
	var aV={config: {}};
	
/**
 * Represents the namespace for color functions
 * @namespace
 */
aV.Color = {};

if (!aV.config.Color)
	aV.config.Color = {};
aV.config.Color.unite(
	{
		_RGBPattern: /rgb\(\s*(\d{1,3})\,\s*(\d{1,3})\,\s*(\d{1,3})\)|\#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
		_hexRGBFormat: '#%r:s%g:s%b:s',
		_RGBFormat: 'rgb(%r:s, %g:s, %b:s)'
	}
);

/**
 * Calculates the hue value in degrees for a given RGB color object.
 * Also includes the maximum and minimum color values in the result for further use in HSL and HSV conversions.
 * 
 * @param {RGBColorObject} color
 * @return {Object} The hue value is stored in the "h" property[0,360] and max-min values are stored in the "max" and "min" properties repectively.
 */
aV.Color._calcHue = function(color)
{
	var result = 
	{
		max: Math.max(color.r, color.g, color.b),
		min: Math.min(color.r, color.g, color.b)
	};
	switch(result.max)
	{
		case result.min:
			result.h = 0;
			break;
		case color.r:
			result.h = (60 * (color.g - color.b) / (result.max - result.min) + 360) % 360;
			break;
		case color.g:
			result.h = 60 * (color.b - color.r) / (result.max - result.min) + 120;
			break;
		case color.b:
			result.h = 60 * (color.r - color.g) / (result.max - result.min) + 240;
			break;
	}
	return result;
};

/**
 * Converts a given RGB color object to CSS compatible color code string
 * @param {RGBColorObject} color
 * @param {Boolean} [hex=true] If true the output is in #xxxxxx format, if false the output is in rgb(xxx, xxx, xxx) format.
 * @return {String}
 */
aV.Color.RGBtoString = function(color, hex)
{
	if (!color) 
		color = {r: 0, g: 0, b: 0};
	var len, base = (hex !== false) ? 16 : 10, part;
	for (part in color) 
	{
		if (color.hasOwnProperty(part)) 
		{
			color[part] = Math.round(color[part]).toString(base);
			if (base == 16) 
			{
				len = color[part].length;
				if (len == 1) 
					color[part] = '0' + color[part];
				else if (len > 2) 
					color[part] = '00';
			}
		}
	}
	return ((base == 16) ? aV.config.Color._hexRGBFormat : aV.config.Color._RGBFormat).format(color);
};

/**
 * Covnerts a valid CSS color code string into an RGB color object.
 * Accepts the following formats: #xxx, #xxxxxx, rgb(xxx, xxx, xxx)
 * @param {Object} rgbString
 * @return {RGBColorObject}
 */
aV.Color.StringtoRGB = function(rgbString)
{
	var colors, startFrom, base, shortCheck = rgbString.length - 3;
	if (shortCheck < 2) //to accept both #xxx and xxx
		rgbString += rgbString.substr(shortCheck, 3);
	colors = aV.config.Color._RGBPattern.exec(rgbString);
	if (!colors) 
		return false;
	
	if (colors[1]) //means the rgb(xxx, xxx, xxx) pattern is matched 
	{
		startFrom = 1; //sets the match index start for the matched pattern
		base = 10;
	}
	else if (colors[4]) //means the #?xxxxxx pattern is matched
	{
		startFrom = 4;
		base = 16;
	}
	else //means something really weird is going on, run away!
		return false;
	
	return {
		r: parseInt(colors[startFrom], base),
		g: parseInt(colors[startFrom + 1], base),
		b: parseInt(colors[startFrom + 2], base)
	};
};

/**
 * Converts an HSLColorObject to an RGBColorObject
 * @param {HSLColorObject} color
 * @return {RGBColorObject}
 */
aV.Color.HSLtoRGB = function(color)
{
	/** conversion function taken from 
	 * http://en.wikipedia.org/wiki/HSL_and_HSV
	 */
	var i, q = (color.l < 0.5) ? color.l * (1 + color.s) : (color.l + color.s - color.l * color.s), p = 2 * color.l - q, hk = color.h / 360, t = [hk + 1 / 3, hk, hk - 1 / 3];
	for (i=0; i<3; i++)
	{
		if (t[i] < 0) 
			t[i] += 1;
		else if (t[i] > 1) 
			t[i] -= 1;
		//above code assures that the value is in the range [0, 1]
		//code below is the magic, I have no idea how it does that but it converts the colors :D
		if (t[i] < 1 / 6) 
			t[i] = p + (q - p) * 6 * t[i];
		else if (t[i] < 0.5)
			t[i] = q;
		else if (t[i] < 2 / 3) 
			t[i] = p + (q - p) * 6 * (2 / 3 - t[i]);
		else
			t[i] = p;
		
		t[i] = Math.round(t[i] * 255);
	}

	return {r: t[0], g: t[1],	b: t[2]};
};

/**
 * Converts an RGB color object to an HSL color object
 * @param {RGBColorObject} color
 * @return {HSLColorObject}
 */
aV.Color.RGBtoHSL = function(color)
{
	/** conversion function taken from 
	 * http://en.wikipedia.org/wiki/HSL_and_HSV
	 */
	var result = aV.Color._calcHue(color);

	result.l = (result.max + result.min) / 510;
	if (result.max == result.min) 
		result.s = 0;
	else if (result.l > 0.5) 
		result.s = (result.max - result.min) / (510 - result.max - result.min);
	else 
		result.s = (result.max - result.min) / (result.max + result.min);
	return result;
};

/**
 * Covnerts an HSV color object to an RGB color object
 * @param {HSVColorObject} color
 * @return {RGBColorObject}
 */
aV.Color.HSVtoRGB = function(color)
{
	/** conversion function taken from 
	 * http://en.wikipedia.org/wiki/HSL_and_HSV
	 */
	var d = color.h / 60,
	v = color.v * 255, 
	h_i = Math.floor(d) % 6,
	f = d - Math.floor(d),
	p = v * (1 - color.s),
	q = v * (1 - f * color.s),
	t = v * (1 - ((1 - f) * color.s));
	switch (h_i)
	{
		case 0:
			return {r: v, g: t, b: p};
		case 1:
			return {r: q, g: v, b: p};
		case 2:
			return {r: p, g: v, b: t};
		case 3:
			return {r: p, g: q, b: v};
		case 4:
			return {r: t, g: p, b: v};
		case 5:
			return {r: v, g: p, b: q};
		default:
			return false;
	}
};

/**
 * Converts an RGB color object to HSV color object
 * @param {RGBColorObject} color
 * @return {HSVColorObject}
 */
aV.Color.RGBtoHSV = function(color)
{
	/** conversion function taken from 
	 * http://en.wikipedia.org/wiki/HSL_and_HSV
	 */
	var result = aV.Color._calcHue(color);
	result.v = result.max / 255;
	result.s = (result.max) ? (1 - result.min / result.max) : 0;
	return result;
};
