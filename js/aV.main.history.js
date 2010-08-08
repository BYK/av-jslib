/**
 * @fileOverview Simple history manager
 * @name aV.main.history
 *
 * @author Burak Yiğit KAYA byk@ampliovitam.com
 * @version 1.1
 * 
 * @requires webtoolkit.main.base64
 * @requires llamerada.main.ulzss
 * @requires aV.ext.object
 * @requires aV.ext.string
 * @requires aV.ext.array
 * @requires aV.main.events
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
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
		useHashChangeEvent: true && ('onhashchange' in window),
		listenerIFrameURL: '/JSLib/blank.html',
		listenerIFrameId: 'aVHistoryListenerIFrame'
	},false
);

//IE conditional comments to force the use of IFrame
/*@cc_on
aV.config.History.useIFrame=true && !aV.config.History.useHashChangeEvent;
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

	var changedKeys=[], paramStr,
	hashStr = paramStr = document.location.href.substring(document.location.href.indexOf('#')+1);
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
		if (aV.History._iframe)
			aV.History._iframe.contentWindow.location.search = '?' + hashStr;
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
	else if (aV.config.History.useHashChangeEvent) 
	{
		aV.Events.add(window, 'hashchange', aV.History._listener)();
		return true;
	}
	else 
	{
		if (aV.config.History.useIFrame) 
		{
			aV.History._iframe = document.createElement('IFRAME');
			aV.History._iframe.style.display = 'none';
			aV.History._iframe.src = aV.config.History.listenerIFrameURL;
			aV.History._iframe.id = aV.config.History.listenerIFrameId;
			document.body.appendChild(aV.History._iframe);
			if (document.location.hash.length > 1) 
				aV.History._oldIframeLocation = aV.History._iframe.contentWindow.location.search = document.location.href.substring(document.location.href.indexOf('#') + 1);
			
			aV.History._iframeListenerHandle = window.setInterval(aV.History._iframeListener, aV.config.History.listenPeriod);
		}
		return aV.History._listenerHandle = window.setInterval(aV.History._listener, aV.config.History.listenPeriod);
	}
};

aV.History.stopListener=function()
{
	if (aV.History._listenerHandle) 
	{
		window.clearInterval(aV.History._listenerHandle);
		delete aV.History._listenerHandle;
		
		if (aV.config.History.useIFrame) 
		{
			window.clearInterval(aV.History._iframeListenerHandle);
			delete aV.History._iframeListenerHandle;
			
			if (aV.History._iframe && aV.History._iframe.parentNode) 
				aV.History._iframe.parentNode.removeChild(aV.History._iframe);
		}
	}
	else if (aV.config.History.useHashChangeEvent) 
		return aV.Events.remove(window, 'hashchange', aV.History._listener);
};
/*
aV.AJAX.loadResource("/JSLib/js/webtoolkit.main.base64.js", "js", "base64Library");
aV.AJAX.loadResource("/JSLib/js/llamerada.main.ulzss.js", "js", "ulzssCompressionLibrary");
*/
if (aV.config.History.startOnLoad)
	aV.Events.add(window, 'domready', aV.History.startListener);
