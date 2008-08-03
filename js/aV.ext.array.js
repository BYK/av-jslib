/**
 * @fileOverview A library which extends the Array class with some useful functions.
 * @name Array Extensions
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.0
 *
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (Array.prototype.indexOf)
	Array.prototype.indexOfOriginal=Array.prototype.indexOf;

/**
 * Finds the index of the given element int the array.
 * Returns -1 if there is no match
 * 
 * @param {Object} element The element whose index should be found.
 * @param {Boolean} [strictMatch=false] Indicates wheter the comparison would be type sensitive (uses === comparator)
 * @param {Integer} [startFrom=0] Where to start searching from
 * @return {Integer} The index of the found element or -1
 */
Array.prototype.indexOf=function(element, strictMatch, startFrom)
{
	var isEqual=(strictMatch)?function(e1, e2){return (e1===e2)}:function(e1, e2){return (e1==e2)};
	if (!(startFrom>0))
		startFrom=0;
	for (; startFrom<this.length; startFrom++)
		if (isEqual(this[startFrom], element))
			return startFrom;
	return -1;
};
/**
 * Applies the given unitFunction to each element in the array and replaces it with the result.
 * @param {Function(x)} unitFunction The unit function which will be applied to the elements
 * @param {Boolean} [recursive=false] Indicates wheter the function should be applied to possible sub-elements.
 * @return {Array} Returns the modified array, a.k.a itself.
 */
Array.prototype.each=function(unitFunction, recursive)
{
	if (!unitFunction)
		return false;
	
	for (var i=0; i<this.length; i++)
		if (recursive && (this[i] instanceof Array))
			this[i]=this[i].each(unitFunction, true);
		else
			this[i]=unitFunction(this[i]);
	
	return this;
};
/**
 * Pads the array to the given length appending the given value to the end of the string iteratively.
 * 
 * @param {Integer} newLength
 * @param {Object} value
 * @return {Array} Returns the new version of itself.
 */
Array.prototype.pad=function(newLength, value)
{
	while (this.length<newLength)
		this.push(value);
	return this;
};
/**
 * Sums all the elements in the array.
 * 
 * @param {Boolean} [recursive=false] Defines wheter the function should go into sub-arrays to sum.
 * @return {Number} The sum of all the items in the arrray and possible sub-arrays according to recursive parameter.
 */
Array.prototype.sum=function(recursive)
{
	var result=0;
	for (var i = 0; i < this.length; i++) 
	{
		if (recursive && (this[i] instanceof Array))
			result+=this[i].sum(true);
		else
			result+=parseFloat(this[i]);
	}
	return result;
};
/**
 * Multiplies all the elements in the array.
 * 
 * @param {Boolean} [recursive=false] Defines wheter the function should go into sub-arrays to multiply.
 * @return {Number} The product of all the items in the arrray and possible sub-arrays according to recursive parameter.
 */
Array.prototype.product=function(recursive)
{
	var result=1;
	for (var i = 0; result && i < this.length; i++) 
	{
		if (recursive && (this[i] instanceof Array))
			result*=this[i].product(true);
		else
			result*=parseFloat(this[i]);
	}
	return result;
};
/**
 * Returns the given number of randomly selected elements from the array.
 * The items may repeat since there is no check a uniqueness test on the result.
 * 
 * @param {Integer} [count=1]
 * @return {Object|Array} Returns the randomly selected elements from the array. If count is 1 the result is not an array but the picked element itself.
 */
Array.prototype.rand=function(count)
{
	if (!(count>0))
		count=1;
	var result=[];
	while (count)
	{
		result.push(this[Math.floor(Math.random()*this.length)]);
		count--;
	}
	
	if (result.length==1)
		return result[0];
	else
		return result;
};
/**
 * Recursively reduces the array to a single value using the given unitFunction.
 * To understand how reduce exactly works, see PHP array_reduce at http://php.net/array_reduce
 * 
 * @param {Function(x,y)} unitFunction
 * @param {Object} [initialValue=null]
 * @param {Boolean} [recursive=false]
 * @return {Object} The reduced value.
 */
Array.prototype.reduce=function(unitFunction, initialValue, recursive)
{
	if (initialValue===undefined)
		initialValue=null;
	var result=initialValue;
	var currentValue;
	for (var i=0; i<this.length; i++)
	{
		currentValue=(recursive && (this[i] instanceof Array))?this[i].reduce(unitFunction, initialValue, true):this[i];
		result=unitFunction(result, currentValue);
	}
	return result;
};
/**
 * Shuffles the array and returnes the shuffled version.
 * 
 * @return {Array} The new, shuffled array.
 */
Array.prototype.shuffle=function()
{
	var result=[];
	var temp=this;
	while (temp.length)
	{
		var index=Math.floor(Math.random()*temp.length);
		result.push(temp.splice(index, 1)[0]);
	}
	return result;
};