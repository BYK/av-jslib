/**
 * @fileOverview Simple history manager
 * @name aV.main.history
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.1
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	var aV={config: {}};

if (!aV.config.History)
	aV.config.History={};

aV.config.History.unite(
	{
		compression: true,
		startOnLoad: true,
		listenPeriod: 1000,
		useIFrame: false,
		listenerIFrameURL: '/JSLib/blank.html',
		listenerIFrameId: 'aVHistoryListenerIFrame'
	}
);

//IE conditional comments to force the use of IFrame
/*@cc_on
aV.config.History.useIFrame=true;
@*/

aV.History=
{
	_get: {},
	onchange: null
};

aV.History._URIComponentComparator=function(a, b)
{
	return (decodeURIComponent(a)==decodeURIComponent(b));
};

aV.History._listener=function()
{
	if (!aV.History.onchange || document.location.hash.length<=1)
		return false;

	var changedKeys=[];
	var paramStr = document.location.href.substring(document.location.href.indexOf('#')+1);
	if (paramStr.charAt(0)=='!' && ULZSS && Base64)
		paramStr = ULZSS.decode(Base64.decode(paramStr.substring(1)));
	var newList = paramStr.split('&');
	var changeList = newList.concat(aV.History._get.toQueryString().split('&')).simplify(false, aV.History._URIComponentComparator);
	var pair;
	var matcher=/^([^&=]+)=([^&]+)$/;
	for (var i = 0; i < changeList.length; i++) 
	{
		pair = changeList[i].match(matcher);
		if (!(pair && pair[1]))
			continue;
		if (changedKeys.indexOf(pair[1])==-1)
			changedKeys.push(pair[1]);
	}

	if (changedKeys.length)
	{
		aV.History._get=Object.fromQueryString(newList);
		aV.History.onchange({type: "change", changedKeys: changedKeys});
	}
};

aV.History._iframeListener=function()
{
	if (aV.History._oldIframeLocation==aV.History._iframe.contentWindow.location.search)
		return;
		
	aV.History._oldIframeLocation=aV.History._iframe.contentWindow.location.search;
	document.location.replace(document.location.pathname + document.location.search + '#' + aV.History._iframe.contentWindow.location.search.substring(1));
};

aV.History.set=function(newGet)
{
	if (!newGet)
		newGet = {};
	var paramStr = newGet.toQueryString();
	if (aV.config.History.compression && ULZSS)
		paramStr = '!' + Base64.encode(ULZSS.encode(paramStr));
	document.location.hash = '#' + paramStr;
	if (aV.History._iframe)
		aV.History._iframe.contentWindow.location.search = '?' + paramStr;
};

aV.History.startListener=function()
{
	if (aV.History._listenerHandle)
		return aV.History._listenerHandle;
	
	if (aV.config.History.useIFrame) 
	{
		aV.History._iframe = document.createElement('IFRAME');
		aV.History._iframe.style.display = 'none';
		aV.History._iframe.src = aV.config.History.listenerIFrameURL;
		aV.History._iframe.id = aV.config.History.listenerIFrameId;
		document.body.appendChild(aV.History._iframe);
		if (document.location.hash.length>1)
			aV.History._oldIframeLocation=aV.History._iframe.contentWindow.location.search=document.location.href.substring(document.location.href.indexOf('#')+1);
		
		aV.History._iframeListenerHandle = window.setInterval(aV.History._iframeListener, aV.config.History.listenPeriod);
	}
	
	aV.History._listenerHandle=window.setInterval(aV.History._listener, aV.config.History.listenPeriod);
};

aV.History.stopListener=function()
{
	if (!aV.History._listenerHandle)
		return false;
	window.clearInterval(aV.History._listenerHandle);
	return delete aV.History._listenerHandle;
	
	if (aV.config.History.useIFrame)
	{
		window.clearInterval(aV.History._iframeListenerHandle);
		delete aV.History._iframeListenerHandle;

		if (aV.History._iframe && aV.History._iframe.parentNode)
			aV.History._iframe.parentNode.removeChild(aV.History._iframe);
	}
};

aV.AJAX.loadResource("/JSLib/js/webtoolkit.base64.js", "js", "base64Library");
aV.AJAX.loadResource("/JSLib/js/ulzss.js", "js", "ulzssCompressionLibrary");
if (aV.config.History.startOnLoad)
	aV.Events.add(window, 'domready', aV.History.startListener);