/**
 * @fileOverview A library which extends the Array class with some useful functions.
 * @name Array Extensions
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 1.2
 *
 * @copyright (c)2010 amplioVitam under Apache License, Version 2.0
 */

/**
 * Scans the whole array and removes all the duplicates of the elements.
 * @return {Array} The deduplicated array, itself.
 */
Array.prototype.deduplicate = function()
{
	var dupIndex;
	for (var i = 0; i < this.length; i++)
		while ((dupIndex = this.indexOf(this[i], i + 1)) > -1)
			this.splice(dupIndex, 1);

	return this;
};

/**
 * Scans the whole array and destroys any element which the array has more than one copy of it.
 * Note that this function is just like Array.prototype.deduplicate but it removes the original elements having duplicates also. 
 * 
 * @return {Array} The simplified array, itself.
 */
Array.prototype.simplify = function()
{
	var dupIndex, i = 0, erased;
	while (i < this.length) 
	{
		erased=false;
		
		while ((dupIndex = this.indexOf(this[i], i + 1)) > -1) 
		{
			this.splice(dupIndex, 1);
			erased = true;
		}
		
		if (erased) 
			this.splice(i, 1);
		else 
			i++;
	}
	
	return this;
};

/**
 * Pads the array to the given length by appending the given value to the end of the string iteratively.
 * 
 * @param {Integer} newLength
 * @param {Object} value
 * @return {Array} Returns the new version of itself.
 */
Array.prototype.pad=function(newLength, value)
{
	while (this.length < newLength)
		this.push(value);
	return this;
};

/**
 * Returns the given number of randomly selected elements from the array.
 * The items may repeat since there is no check for a uniqueness test on the result.
 * 
 * @param {Integer} [count=1] The number of elements should be returned.
 * @return {Object|Array} The randomly selected elements from the array. If count is 1 the result is not an array but the picked element itself.
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
 * Shuffles the array and returnes the shuffled version.
 * Idea from http://code.google.com/p/jslibs/wiki/JavascriptTips
 * 
 * @return {Array} The new, shuffled array.
 */
Array.prototype.shuffle=function()
{
	return this.sort(function(){Math.random() - 0.5});
};

/**
 * Returns the first non "falsy" element in the array.
 * @param {Number} [startFrom=0] The index where to start looking for.
 * @return {Object} The first non-null element in the array after the index given instartFrom.
 */
Array.prototype.coalesce=function(startFrom)
{
	var result;
	if (!startFrom)
		startFrom=0;

	while (!result && startFrom<this.length)
		result = this[startFrom++];
	return result;
};
