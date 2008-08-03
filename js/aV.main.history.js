/**
 * @fileOverview Simple history manager
 * @name aV.main.history
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.0
 */

if (!aV)
	var aV={config: {}};

aV.History=
{
	_get: {},
	onchange: null
};

aV.History._listener=function()
{
	if (!aV.History.onchange)
		return false;

	var oldGet=aV.History._get;
	aV.History._get={};
	var changedKeys=[];
	if (document.location.hash.length > 1) 
	{
		var tempArray = document.location.hash.substring(1).split('&');
		var pair, keyChanged;
		for (var i = 0; i < tempArray.length; i++) 
		{
			pair = tempArray[i].split('=');
			pair[0] = aV.History._unserializeElement(pair[0], decodeURIComponent(pair[1]), aV.History._get);
			try
			{
				keyChanged=eval("(oldGet" + pair[0] + "!=aV.History._get" + pair[0] + ")");
			}
			catch (error)
			{
				keyChanged=true;
			}
			if (keyChanged)
				changedKeys.push(pair[0]);
		}
	}
	
	if (changedKeys.length) 
		aV.History.onchange({type: "change",	changedKeys: changedKeys});
};

aV.History.set=function(newGet)
{
	if (!newGet)
		newGet=aV.History._get;
	document.location.hash='#' + aV.AJAX.serializeParameters(newGet);
};

aV.History.startListener=function()
{
	if (aV.History._listenerHandle)
		return aV.History._listenerHandle;

	aV.History._listenerHandle=window.setInterval(aV.History._listener, 500);
};

aV.History.stopListener=function()
{
	if (!aV.History._listenerHandle)
		return false;
	window.clearInterval(aV.History._listenerHandle);
	return delete aV.History._listenerHandle;
};

aV.History._unserializeElement=function(str, value, result)
{
	var arr=str.match(/([^\s\[\]]+)/g);
	for (var i = 0; i < arr.length - 1; i++) 
	{
		if (!result[arr[i]])
			result[arr[i]] = (parseInt(arr[i+1]==0)) ? [] : {};
		result = result[arr[i]];
	}
	result[arr[i]] = value;
	arr.each(function(x){return "['" + x + "']";});
	return arr.join('');
};

aV.Events.add(window, "load", aV.History.startListener);