/**
 * @fileOverview A library which extends the Array class with some useful functions.
 * @name Array Extensions
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 1.1
 *
 * @copyright (c)2010 amplioVitam under Apache License, Version 2.0
 */

if(!Array.isArray)
/**
 * Returns true if an variable is an array, if not false.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/isArray
 * @param {Object} obj The object to be checked
 * @return {Boolean} true if obj is an array, false otherwise
 */
Array.isArray = function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; };

if (!Array.prototype.indexOf)
/**
 * Returns the first index at which a given element can be found in the array, or -1 if it is not present.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/indexOf
 * @param {Object} searchElement Element to locate in the array.
 * @param {Number} [fromIndex=0] The index at which to begin the search. Defaults to 0, i.e. the whole array will be searched. If the index is greater than or equal to the length of the array, -1 is returned, i.e. the array will not be searched. If negative, it is taken as the offset from the end of the array. Note that even when the index is negative, the array is still searched from front to back. If the calculated index is less than 0, the whole array will be searched.
 * @return {Number} The index of the found element or -1
 */
Array.prototype.indexOf = function(searchElement, fromIndex)
{
	var len = this.length >>> 0,
	from = Number(fromIndex) || 0;

	from = (from < 0) ? Math.ceil(from) : Math.floor(from);
	if (from < 0)
		from += len;

	for (; from < len; from++)
	{
		if (from in this &&
			this[from] === searchElement)
		return from;
	}
	return -1;
};

if (!Array.prototype.lastIndexOf)
/**
 * Returns the last index at which a given element can be found in the array, or -1 if it is not present. The array is searched backwards, starting at fromIndex.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/lastIndexOf
 * @param {Object} searchElement Element to locate in the array.
 * @param {Number} [fromIndex=0] The index at which to start searching backwards. Defaults to the array's length, i.e. the whole array will be searched. If the index is greater than or equal to the length of the array, the whole array will be searched. If negative, it is taken as the offset from the end of the array. Note that even when the index is negative, the array is still searched from back to front. If the calculated index is less than 0, -1 is returned, i.e. the array will not be searched.
 * @return {Number} The index of the found element or -1
 */
Array.prototype.lastIndexOf = function(searchElement, fromIndex)
{
	var len = this.length;
	
	if (isNaN(fromIndex))
		fromIndex = len - 1;
	else
	{
		fromIndex = (fromIndex < 0) ? Math.ceil(fromIndex) : Math.floor(fromIndex);
		if (fromIndex < 0)
			from += len;
		else if (fromIndex >= len)
			fromIndex = len - 1;
	}
	
	for (; fromIndex > -1; fromIndex--)
	{
		if (fromIndex in this && this[fromIndex] === searchElement)
			return fromIndex;
	}
	return -1;
};

if (!Array.prototype.forEach)
/**
 * Executes a provided function once per array element.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/forEach
 * @param {Function} callback Function to execute for each element.
 * @param {Object} [thisObjet] Object to use as this when executing callback.
 */
Array.prototype.forEach = function(callback , thisObject)
{
  var len = this.length >>> 0;
  if (typeof callback != "function")
    throw new TypeError();

  if (!thisObject)
  	thisObject = this;
  for (var i = 0; i < len; i++)
  {
    if (i in this)
      callback.call(thisObject, this[i], i, this);
  }
};

if (!Array.prototype.map)
/**
 * Creates a new array with the results of calling a provided function on every element in this array.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/map
 * @param {Function} callback Function that produces an element of the new Array from an element of the current one.
 * @param {Object} [thisObject] Object to use as this when executing callback.
 * @return {Array} The newly created/transformed array.
 */
Array.prototype.map = function(callback, thisObject)
{
  var len = this.length >>> 0;
  if (typeof callback != "function")
    throw new TypeError();

  var res = new Array(len);
  
  if (!thisObject)
  	thisObject = this;
  
  for (var i = 0; i < len; i++)
  {
    if (i in this)
      res[i] = callback.call(thisObject, this[i], i, this);
  }

  return res;
};

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

if (!Array.prototype.every)
/**
 * Tests whether all elements in the array pass the test implemented by the provided function.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/every
 * @param {Function} callback Function to test for each element.
 * @param {Object} [thisObject] Object to use as this when executing callback.
 * @return {Boolean} true if all elements pass the test, false otherwise
 */
Array.prototype.every = function(callback, thisObject)
{
	var len = this.length >>> 0;
	if (typeof callback != "function")
		throw new TypeError();
	
	if (!thisObject)
		thisObject = this;

	for (var i = 0; i < len; i++)
	{
		if (i in this && !callback.call(thisObject, this[i], i, this))
			return false;
	}

	return true;
};

if (!Array.prototype.filter)
/**
 * Creates a new array with all elements that pass the test implemented by the provided function.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/filter
 * @param {Function} callback Function to test each element of the array.
 * @param {Object} [thisObject] Object to use as this when executing callback.
 * @return {Array} The new, filtered array.
 */
Array.prototype.filter = function(callback, thisObject)
{
	var len = this.length >>> 0;
	if (typeof fun != "function")
		throw new TypeError();

	var res = [];
	
	if (!thisObject)
		thisObject = this;

	for (var i = 0; i < len; i++)
		if (i in this)
		{
			var val = this[i]; // in case callback mutates this
			if (callback.call(thisObject, val, i, this))
				res.push(val);
		}

	return res;
};

if (!Array.prototype.some)
/**
 * Tests whether some element in the array passes the test implemented by the provided function.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/some
 * @param {Function} callback Function to test each element of the array.
 * @param {Object} [thisObject] Object to use as this when executing callback.
 * @return {Boolean} false if all the elements in the array fails the test, true otherwise
 */
Array.prototype.some = function(callback, thisObject)
{
	var i = 0,
	len = this.length >>> 0;

	if (typeof fun != "function")
		throw new TypeError();
	
	if (!thisObject)
		thisObject = this;
	
	for (; i < len; i++)
		if (i in this && callback.call(thisObject, this[i], i, this))
			return true;

	return false;
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
		
		while ((dupIndex = this.indexOf(this[i], i + 1, compareFunction)) > -1) 
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
 * Sums all the elements in the array and returns the result.
 * 
 * @param {Boolean} [recursive=false] Defines wheter the function should go into possible sub-arrays to sum.
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
 * Calculates the mean average value of the array.
 * @return {Number} The mean average of the array.
 */
Array.prototype.mean=function()
{
	return this.sum()/this.length;
};

/**
 * Multiplies all the elements in the array.
 * 
 * @param {Boolean} [recursive=false] Defines wheter the function should go into possible sub-arrays to multiply.
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
 * Apply a function against an accumulator and each value of the array (from left-to-right) as to reduce it to a single value.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/reduce
 * @param {Function} callback Function to execute on each value in the array.
 * @param {Object} [initialValue] Object to use as the first argument to the first call of the callback.
 * @return {Object} The reduced single value from array.
 */
if (!Array.prototype.reduce)
Array.prototype.reduce = function(callback, initialValue)
{
	var len = this.length >>> 0;
	if (typeof callback != "function")
		throw new TypeError();

	// no value to return if no initial value and an empty array
	if (len == 0 && initialValue === undefined)
		throw new TypeError();

	var i = 0;
	if (initialValue !== undefined)
		var rv = initialValue;
	else
	{
		do
		{
			if (i in this)
			{
				var rv = this[i++];
				break;
			}

			// if array contains no values, no initial value to return
			if (++i >= len)
				throw new TypeError();
		}
		while (true);
	}
	
	for (; i < len; i++)
	{
		if (i in this)
			rv = callback.call(this, rv, this[i], i, this);
	}
	
	return rv;
};

if (!Array.prototype.reduceRight)
/**
 * Apply a function simultaneously against two values of the array (from right-to-left) as to reduce it to a single value.
 * Taken from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/reduceRight
 * @param {Function} callback Function to execute on each value in the array.
 * @param {Object} [initialValue] Object to use as the first argument to the first call of the callback.
 * @return {Object} The right-reduced single value from array.
 */
Array.prototype.reduceRight = function(callback, initialValue)
{
	var len = this.length >>> 0;
	if (typeof callback != "function")
		throw new TypeError();
	
	// no value to return if no initial value, empty array
	if (len == 0 && initialValue === undefined)
		throw new TypeError();
	
	var i = len - 1;
	if (initialValue !== undefined)
		var rv = initialValue;
	else
	{
		do
		{
			if (i in this)
			{
				var rv = this[i--];
				break;
			}

			// if array contains no values, no initial value to return
			if (--i < 0)
				throw new TypeError();
		}
		while (true);
	}
	
	for (; i >= 0; i--)
		if (i in this)
			rv = callback.call(this, rv, this[i], i, this);

	return rv;
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
 * Returns the index of the smallest element in the array.
 * @param {Function(a,b)} [compareFunction] Custom compare function
 * @return {Number} The index of the least element 
 */
Array.prototype.min=function(compareFunction)
{
	if (!compareFunction)
		/**
		 * @ignore
		 */
		compareFunction=function(a, b)
		{
			return a-b;
		};

	var result=0;
	for (var i=1; i<this.length; i++)
		if (compareFunction(this[i], this[result])<0)
			result=i;
	return result;
};

/**
 * Returns the index of the greatest element in the array.
 * @param {Function(a,b)} [compareFunction] Custom compare function
 * @return {Number} The index of the greatest element 
 */
Array.prototype.max=function(compareFunction)
{
	if (!compareFunction)
		compareFunction=function(a, b)
		{
			return a-b;
		};
	var result=0;
	for (var i=1; i<this.length; i++)
		if (compareFunction(this[i], this[result])>0)
			result=i;
	return result;
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
