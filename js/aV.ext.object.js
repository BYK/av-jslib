/**
 * @fileOverview A library which extends the base Object class with some useful functions.
 * @name Object Extensions
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.0
 *
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

/**
 * This function serializes the object to a standart URI query string.
 * 
 * @return {String} The URI query string.
  */
Object.prototype.toQueryString=function(format)
{
	if (format==undefined)
		format='%s';
	var result='';
	for (var paramName in this) 
	{
		if (this.constructor==Array && isNaN(parseInt(paramName)) || !this.hasOwnProperty(paramName))
			continue;

		if (this[paramName].constructor==Object || this[paramName].constructor==Array)
			result += '&' + this[paramName].toQueryString(format.format(paramName) + '[%s]');
		else
			result += '&' + format.format(paramName) + '=' + encodeURIComponent(this[paramName]);
	}
	return result.substr(1);
};

Object.prototype.unite=function(additive, overwrite)
{
	if (overwrite!==false)
		overwrite=true;
	for (var property in additive) 
	{
		if (!additive.hasOwnProperty(property))
			continue;
		if (this[property] && this[property].constructor == Object && this.hasOwnProperty(property)) 
			this[property].unite(additive[property], overwrite);
		else if (overwrite || !(property in this))
			this[property] = additive[property];
	}

	return this;
};

/*
 * if the JSON library at http://www.json.org/json2.js is included,
 * add a "toJSON" methdo to all objects.
 */
if (window.JSON)
{
	Object.prototype.toJSONStr=function(replacer, space)
	{
		return JSON.stringify(this, replacer, space);
	};
}
