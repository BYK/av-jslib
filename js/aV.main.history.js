/**
 * @fileOverview Simple history manager
 * @name aV.main.history
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.1
 */

if (!aV)
	var aV={config: {}};

aV.config.History=
{
	compression: true,
	startOnLoad: true
};

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
		var paramStr = document.location.hash.substring(1);
		if (paramStr.charAt(0)=='!' && ULZSS && Base64)
			paramStr = ULZSS.decode(Base64.decode(paramStr));
		var tempArray = paramStr.split('&');
		var pair, keyChanged;
		var matcher=/^([^&=]+)=([^&]+)$/;
		for (var i = 0; i < tempArray.length; i++) 
		{
			pair = tempArray[i].match(matcher);
			if (!(pair && pair[1]))
				continue;
			pair[1] = aV.History._unserializeElement(pair[1], decodeURIComponent(pair[2]), aV.History._get);
			try
			{
				keyChanged=eval("(oldGet" + pair[1] + "!=aV.History._get" + pair[1] + ")");
			}
			catch (error)
			{
				keyChanged=true;
			}
			if (keyChanged)
				changedKeys.push(pair[1]);
		}
	}
	
	if (changedKeys.length) 
	{
		aV.History.onchange({type: "change", changedKeys: changedKeys});
	}
};

aV.History.set=function(newGet)
{
	if (!newGet)
		newGet = aV.History._get;
	var paramStr = newGet.toQueryString();
	if (aV.config.History.compression && ULZSS)
		paramStr = '!' + Base64.encode(ULZSS.encode(paramStr));
	document.location.hash = '#' + paramStr;
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
			result[arr[i]] = (parseInt(arr[i+1])==0) ? [] : {};
		result = result[arr[i]];
	}
	result[arr[i]] = value;
	arr.each(function(x){return "['" + x + "']";});
	return arr.join('');
};

aV.AJAX.loadResource("/JSLib/js/webtoolkit.base64.js", "js", "base64Library");
aV.AJAX.loadResource("/JSLib/js/ulzss.js", "js", "ulzssCompressionLibrary");
if (aV.config.History.startOnLoad)
	aV.Events.add(window, "load", aV.History.startListener);