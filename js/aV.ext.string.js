/**
 * @fileOverview A library which extends the String class with some useful functions.
 * @name String Extensions
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 1.2
 *
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

/**
 * Escapes the special characters for a regular expression in the string.
 *
 * @return {String} The escaped string.
 */
String.prototype.escapeRegExp = function()
{
	var matcher = new RegExp('\\\\|\\||\\(|\\)|\\[|\\{|\\^|\\$|\\*|\\+|\\?|\\.', 'gi');
	var result;
	var outText = '';
	var lastMatch = 0;
	while (result = matcher.exec(this))
	{
		outText += this.substring(lastMatch, result.index);
		outText += '\\' + result[0];
		lastMatch = result.index + 1;
	}
	outText += this.substr(lastMatch);
	return outText;
};

/**
 * Makes the first letters of the words in the string uppercase.
 *
 * @return {String} The "word-uppercased" string.
 * @example
 * var myText = "javascript is lovely.";
 * myText.ucWords();
 * <br />Will give you "Javascript Is Lovely."
 */
String.prototype.ucWords = function() 
{
	var matcher = /\b\S+/g;
	var result;
	var outText = '';
	var lastMatch = 0;
	while (result = matcher.exec(this))
	{
		outText += this.substring(lastMatch, result.index);
		outText += result[0].charAt(0).toUpperCase() + result[0].substr(1).toLowerCase();
		lastMatch = result.index + result[0].length;
	}
	return outText;
};

/**
 * Replaces the occurences of the strings given in the fromArray with the toArray respectively.
 *
 * @param {String[]} fromArray The string array which holds the strings-to-be-replaced
 * @param {String[]} toArray The string array which holds the "replacements".
 * If the length of this array is smaller than the fromArray, the last item of this array is used for undefined indexes.
 * @param {Boolean} [dontEscape=false] If false, the strings in the fromArray are used directly as/in regular expressions.
 * @return {String} The replaced string
 *
 * @example
 * var myText = "I love Visual Basic, CGI-Script and Ruby very much!";
 * myText.arrayReplace(["Visual Basic", "CGI-Script", "Ruby"], ["PHP", "JavaScript"]);
 * <br />Will give you "I love PHP, JavaScript and JavaScript very much!"
 */
String.prototype.arrayReplace = function(fromArray, toArray, dontEscape)
{
	var expression = '';
	var replacementArray = {};
	var maxToIndex = toArray.length - 1;
	
	for (var i = 0; i < fromArray.length; i++)
	{
		expression += '|' + ((dontEscape)?fromArray[i]:fromArray[i].escapeRegExp());
		replacementArray[fromArray[i]]=toArray[Math.min(i, maxToIndex)];
	}
	
	expression = expression.substr(1);
	var matcher = new RegExp(expression, "gi");
	
	var result;
	var outText = '';
	var lastMatch = 0;
	
	while (result = matcher.exec(this))
	{
		outText += this.substring(lastMatch, result.index);
		outText += replacementArray[result[0]];
		lastMatch = result.index + result[0].length;
	}
	
	outText += this.substr(lastMatch);
	return outText;	
};

/**
 * Counts and returns the given string's occurances in the current string.
 *
 * @param {String} searchStr The string whose occurenses will be counted.
 * @param {Boolean} [dontEscape=false] If false, the searchStr is used directly as/in a regular expression.
 * @return {Number} The occurance count.
 */
String.prototype.strCount = function(searchStr, dontEscape)
{
	var occurance = 0;
	if (!dontEscape)
		searchStr = searchStr.escapeRegExp();
	var matcher = new RegExp(searchStr, "gi");
	while (matcher.exec(this))
		occurance++;
	return occurance;
};

/**
 * Replaces any line breaks (\n, \r, \r\n) with &lt;br&gt; tags.
 *
 * @return {String} The "html-friendly" string.
 */
String.prototype.LBtoBR = function()
{
	var outText = this.replace(/\r\n|\r|\n/g, "<br>");
	return outText;
};

/**
 * Replaces any &lt;br&gt; or &lt;br /&gt; tags with line breaks(\n). 
 *
 * @return {String} The "native" string.
 */
String.prototype.BRtoLB = function()
{
	outText = this.replace(/<br>|<br\s\/>/gi, "\n");
	return outText;
};

/**
 * Trims the string to the given length and puts the replacement in the end of the string.
 *
 * @param {Number} length The desired maximum length of the string.
 * @param {String} [replacement="..."] The replacement which will be added to the end of the trimmed string.
 * @return {String} The trimmed string.
 */
String.prototype.trimToLength = function(length, replacement)
{
	if (replacement === undefined)
		replacement = "...";

	return (this.length > length)?(this.substr(0, length - replacement.length) + replacement):this;
};

/**
 * Trims the whitespace in the beginning of the text.
 *
 * @return {String} The left-trimmed string.
 */
String.prototype.trimLeft = function(trimChars)
{
	if (!trimChars)
		trimChars = "\\s";
	else
		trimChars = trimChars.escapeRegExp();
	var trimmer = new RegExp("^[" + trimChars + "]+", "g");
	return this.replace(trimmer, "");
};

/**
 * Trims the whitespace in the end of the text.
 *
 * @return {String} The right-trimmed string.
 */
String.prototype.trimRight = function(trimChars)
{
	if (!trimChars)
		trimChars = "\\s";
	else
		trimChars = trimChars.escapeRegExp();
	var trimmer = new RegExp("[" + trimChars + "]+$", "g");
	return this.replace(trimmer, "");
};

/**
 * Trims the whitespace around the text.
 *
 * @return {String} The trimmed string.
 */
String.prototype.trim = function(trimChars)
{
	if (!trimChars)
		trimChars = "\\s";
	else
		trimChars = trimChars.escapeRegExp();
	var trimmer = new RegExp("^[" + trimChars + "]+|[" + trimChars + "]+$", "g");
	return this.replace(trimmer, "");
};

/**
 * Strips all the HTML tags in the string.
 * Removes only the given tags if tags is given
 * 
 * @param {String|Array} [tags] The tags which will be stripped out.
 * @return {String} The "html-free" string.
 */
String.prototype.stripHTML = function(tags)
{
	if (tags && tags.join)
		tags = '(' + tags.join('|') + ')';
	else if (!tags)
		tags = '[^>]+';
	tags = '(<[\/]?' + tags + '>)';
	var matcher = new RegExp(tags, "gi");
	return this.replace(matcher, "");
};

/**
 * Formats a string according to the given parameters.
 * Currently supports only string replacement (%s).
 * 
 * @param {String|Number} replacements The strings to be replaced, any number of parameters can be given.
 * @return {String} The formatted string.
 * 
 * @example
 * "%s says this function is great but %2:s claims it's not".format("BYK", "useless", "snlzkn") will give you
 * "BYK says this function is great but snlzkn claims it's not"
 */
String.prototype.format = function()
{
	var matcher=/(%(\w+):s)|(%s)/g;
	var index = 0;

	var result;
	var outText = '';
	var lastMatch = 0;
	
	if (arguments.length == 1 && arguments[0]!==undefined && ((arguments[0] instanceof Array) || (arguments[0].constructor == Object)))
		arguments = arguments[0];

	while (result = matcher.exec(this))
	{
		outText += this.substring(lastMatch, result.index);

		if (!result[2])
			outText += arguments[(arguments.length - 1 > index) ? index++ : index];
		else if (result[2] in arguments)
			outText += arguments[result[2]];
		else
			outText += result[0];

		lastMatch = result.index + result[0].length;
	}
	
	outText += this.substr(lastMatch);
	return outText;		
};

String.prototype.camelize = function()
{
	return this.replace(/[-\s](\w)/g, arguments.callee._replacer);
};

/**
 * @ignore
 */
String.prototype.camelize._replacer = function(matched, letter)
{
	return letter.toUpperCase();
};
