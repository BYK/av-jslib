/**
 * @fileOverview A library which extends the Math class with some useful functions.
 * @name Math Extensions
 *
 * @author Burak Yiğit KAYA <byk@amplio-vita.net>
 * @version 1.0
 *
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

Math.logBase=function(x, base)
{
	return Math.log(x) / Math.log(base || 10);
};

Math.sinh=function(x)
{
	return (exp(x) - exp(-x))/2;
};

Math.cosh=function(x)
{
	return (exp(x) + exp(-x))/2;
};

Math.tanh=function(x)
{
	return Math.sinh(x)/Math.cosh(x);
};

Math.coth=function(x)
{
	return Math.cosh(x)/Math.sinh(x);
};

Math.sech=function(x)
{
	return 2/(exp(x) + exp(-x));
};

Math.cosech=function(x)
{
	return 2/(exp(x) - exp(-x));
};

Math.arcsinh=function(x)
{
	return Math.log(x + Math.sqrt(x*x + 1));
};

Math.arccosh=function(x)
{
	return (x>=1)?Math.log(x + Math.sqrt(x*x - 1)):false;
};

Math.arctanh=function(x)
{
	return (x<1)?0.5*Math.log((1 + x)/(1 - x)):false;
};

Math.arccoth=function(x)
{
	return (x>1)?0.5*Math.log((x + 1)/(x - 1)):false;
};

Math.arcsech=function(x)
{
	return (x>0 && x<=1)?Math.log((1 + Math.sqrt(1 - x*x))/x):false;
};

Math.arccosech=function(x)
{
	return Math.log(1/x + Math.sqrt(1 + x*x)/Math.abs(x));
};

/**
 * Converts a given string number in a different base to decimal base.
 * @param {String} x The string containing the different based number.
 * @param {Number} base The base, which the given number is in.
 * @param {String} [decimalSeperator='.'] The character which seperates the integer and the decimal parts.
 * @return {Number} Returns the decimal correspondence of the given number x.
 */
Math.convertToDecimal=function(x, base, decimalSeperator)
{
	if (!x)
		return 0;

	if (!decimalSeperator)
		decimalSeperator='.';
	if (!base)
		base=10;
	
	x=x.toUpperCase();
	var result=0;
	var sign=1;
	if (x.charAt(0) == '-') 
	{
		sign = -1;
		x=x.substring(1);
	}

	var separatorPos=x.indexOf(decimalSeperator);
	if (separatorPos<0)
		separatorPos=x.length;

	var processCharCode=function(charCode)
	{
		if (charCode < 58 && charCode > 47) 
			charCode -= 48;
		else if (charCode < 91 && charCode > 64) 
			charCode -= 55;
		else //exit with error if an abnormal character is entered
 			return false;
		if (charCode > base) //exit if numerical value is greater than the base
			return false;
		
		return charCode;
	};

	var currentCode;
	//convert the integer part;
	for (var i = 0; i < separatorPos; i++) 
	{
		currentCode = x.charCodeAt(i);
		if ((currentCode=processCharCode(currentCode))===false)
			return false;
		result += currentCode * Math.pow(base, separatorPos-i-1);
	}
	
	//convert the float part
	for (var i = separatorPos+1; i < x.length; i++) 
	{
		currentCode = x.charCodeAt(i);
		if ((currentCode=processCharCode(currentCode))===false)
			return false;
		result += currentCode * Math.pow(base, separatorPos-i);
	}

	return result*sign;
};

/**
 * Converts a given number to the given base.
 * @param {Number} x The number which will be converted.
 * @param {Number} base The desired output base.
 * @param {String} [decimalSeperator='.'] The character which seperates the integer and the decimal parts in the output.
 * @return {String} The number as string in the desired base.
 */
Math.convertToBase=function(x, base, decimalSeperator)
{
	if (x==0)
		return '0';
	
	var processDigit=function(value)
	{
		var result;
		if (value>=0 && value<10)
			result=value.toString();
		else
			result=String.fromCharCode(value+55);
		
		return result;
	};
	
	if (!decimalSeperator)
		decimalSeperator='.';

	var result='';
	if (x<0)
	{
		x=-x;
		result='-';
	}

	var digits=Math.floor(Math.logBase(x, base));
	
	for (var i=digits; x!=0 || i>=0; i--)
	{
		var currentExponent=Math.pow(base, i);
		var multiplier=(x!=0)?Math.floor(x/currentExponent):0;

		if (i==-1)
			result+=decimalSeperator;

		result+=processDigit(multiplier);
		x-=Math.pow(base, i)*multiplier;
	}
	return result;
};