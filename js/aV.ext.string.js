/**
 * @fileOverview A library which extens the String class with some useful functions.
 * @name String Extensions
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.1
 *
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

/**
 * Escapes the special characters for a regular expression in the string.
 *
 * @return {String}
 */
String.prototype.escapeRegExp=function()
{
	matcher=new RegExp('\\\\|\\||\\(|\\)|\\[|\\{|\\^|\\$|\\*|\\+|\\?|\\.', 'gi');
	var result;
	var outText='';
	var lastMatch=0;
	while (result=matcher.exec(this))
	{
		outText+=this.substring(lastMatch, result.index);
		outText+='\\' + result[0];
		lastMatch=result.index+1;
	}
	delete matcher;
	outText+=this.substr(lastMatch);
	return outText;
};

/**
 * Replaces the occurences of the strings given in the fromArray with the toArray respectively.
 *
 * @return {String}
 * @param {String[]} fromArray	The string array which holds the strings-to-be-replaced
 * @param {String[]} toArray	The string array which holds the strings-to-be-replaces-with.
 * If the length of this array is smaller than the fromArray, then the last item of this array is used for undefined indexes.
 * @param {Boolean} [dontEscape] If given false the strings in the fromArray are used directly as regular expressions.
 *
 * @example
 * var myText="I love Visual Basic, CGI-Script and Ruby very much!";
 * myText.arrayReplace(["Visual Basic", "CGI-Script", "Ruby"], ["PHP", "JavaScript"]);
 * <br />Will give you "I love PHP, JavaScript and JavaScript very much!"
 */
String.prototype.arrayReplace=function(fromArray, toArray, dontEscape)
{
	var expression='';
	var replacementArray=new Object();
	var maxToIndex=toArray.length-1;
	
	for (var i=0; i<fromArray.length; i++)
	{
		expression+='|' + ((dontEscape)?fromArray[i]:fromArray[i].escapeRegExp());
		replacementArray[fromArray[i]]=toArray[Math.min(i, maxToIndex)];
	}
	
	expression=expression.substr(1);
	var matcher=new RegExp(expression, "gi");
	
	var result;
	var outText='';
	var lastMatch=0;
	
	while (result=matcher.exec(this))
	{
		outText+=this.substring(lastMatch, result.index);
		outText+=replacementArray[result[0]];
		lastMatch=result.index+result[0].length;
	}
	
	outText+=this.substr(lastMatch);
	return outText;	
};

/**
 * Counts and returns the given string's occurances.
 *
 * @return {integer}
 * @param {String} searchStr The string whose occurenses will be counted.
 * @param {Boolean} [dontEscape] If given false, the searchStr is used directly as a regular expression.
 */
String.prototype.strCount=function(searchStr, dontEscape)
{
	var occurance=0;
	if (!dontEscape)
		searchStr=searchStr.escapeRegExp();
	var matcher=new RegExp(searchStr, "gi");
	while (matcher.exec(this))
		occurance++;
	return occurance;
};

/**
 * Replaces any line breaks (\n, \r, \r\n) with &lt;br&gt; tags.
 *
 * @return {String}
 */
String.prototype.LBtoBR=function()
{
	var outText=this.replace(/(\r|\n)/g, "<br>");
	return outText;
};

/**
 * Replaces any &lt;br&gt; or &lt;br /&gt; tags with line breaks(\n). 
 *
 * @return {String}
 */
String.prototype.BRtoLB=function()
{
	outText=this.replace(/(<br>|<br \/>)/gi, "\n");
	return outText;
};

/**
 * Trims the string to the given length and puts "..." in the end of the string.
 *
 * @return {String}
 * @param {integer} length The desired maximum length of the string.
 */
String.prototype.trimToLength=function(length)
{
	return (this.length>length)?(this.substr(0, length-3) + "..."):this;
};

/**
 * Trims the whitespaces in the beginning of the text.
 *
 * @return {String}
 */
String.prototype.trimLeft=function()
{
	return this.replace(/^(\s)+/g, "");
};

/**
 * Trims the whitespaces in the end of the text.
 *
 * @return {String}
 */
String.prototype.trimRight=function()
{
	return this.replace(/(\s)+$/g, "");
};

/**
 * Trims the whitespaces around the text.
 *
 * @return {String}
 */
String.prototype.trim=function()
{
	return this.replace(/^(\s)+|(\s)+$/g, "");
};

/**
 * Strips all the HTML tags in the string.
 * Removes only the given tags if tags is given
 * 
 * @param {String|Array} [tags] The tags which will be stripped out.
 * @return {String}
 */
String.prototype.stripHTML = function(tags)
{
	if (tags && tags.join)
		tags='(' + tags.join('|') + ')';
	else if (!tags)
		tags='[^>]+';
	tags='(<[\/]?' + tags + '>)';
	var matcher=new RegExp(tags, "gi");
	return this.replace(matcher, "");
}