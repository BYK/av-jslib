/**
 * @fileOverview Module manager extension to AJAX library.
 * @name ModuleManager
 *
 * @author Burak Yiğit KAYA	byk@amplio-vita.net
 * @version 1.0
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

aV.AJAX.ModuleManager=
{
	loadedModules: [],
	moduleUIDs: [],
	callbackQueue: [],
	$$moduleUID: 0
};

aV.AJAX.ModuleManager.moduleExists=function(moduleName)
{
	return (aV.AJAX.ModuleManager.loadedModules.indexOf(moduleName)>-1);
};

aV.AJAX.ModuleManager.load=function(modules, callback, forceReload)
{
	if (typeof modules=="String")
		modules=[modules];
	
	var moduleIndex, moduleUID;
	for (var i=0; i<modules.length; i++)
	{
		moduleUID=null;
		moduleIndex=aV.AJAX.ModuleManager.loadedModules.indexOf(modules[i]);
		if (forceReload || moduleIndex==-1)
		{
			if (moduleIndex > -1) 
			{
				aV.AJAX.ModuleManager.loadedModules.splice(moduleIndex, 1);
				moduleUID=aV.AJAX.ModuleManager.moduleUIDs.splice(moduleIndex, 1)[0];
			}
			if (moduleUID===null)
			
				moduleUID=++aV.AJAX.ModuleManager.$$moduleUID;
			aV.AJAX.loadResource(modules[i] + "--JSLE" + moduleUID, "js", "moduleManager-" + moduleUID, forceReload);
		}
	}
	
	if (callback) 
	{
		aV.AJAX.ModuleManager.callbackQueue.push({callback: callback, modules: modules});
		aV.AJAX.ModuleManager._processCallbackQueue();
	}
};

aV.AJAX.ModuleManager.unload=function(modules)
{
	var moduleIndex, moduleUID;
	var counter=0;
	var documentHead=document.getElementsByTagName("head")[0];
	for (var i=0; i<modules.length; i++)
	{
		moduleIndex=aV.AJAX.ModuleManager.loadedModules.indexOf(modules[i]);
		if (moduleIndex>-1)
		{
			aV.AJAX.ModuleManager.loadedModules.splice(moduleIndex, 1);
			moduleUID=aV.AJAX.ModuleManager.moduleUIDs.splice(moduleIndex, 1)[0];
			documentHead.removeChild(document.getElementById("moduleManager-" + moduleUID));
			counter++;
		}
	}
	return counter;
};

aV.AJAX.ModuleManager.onscriptloadHandler=function(event)
{
	aV.AJAX.ModuleManager.loadedModules.push(event.module.substr(event.module.lastIndexOf('/')+1));
	aV.AJAX.ModuleManager.moduleUIDs.push(event.moduleUID);
	aV.AJAX.ModuleManager._processCallbackQueue();
};

aV.AJAX.ModuleManager._processCallbackQueue=function()
{
	var i=0;
	while (i<aV.AJAX.ModuleManager.callbackQueue.length)
	{
		if (aV.AJAX.ModuleManager.callbackQueue[i].modules.reduce(function(a, b){return (aV.AJAX.ModuleManager.loadedModules.indexOf(b)>-1)?a+1:a;})==aV.AJAX.ModuleManager.callbackQueue[i].modules.length) 
		{
			aV.AJAX.ModuleManager.callbackQueue[i].callback(aV.AJAX.ModuleManager.callbackQueue[i].modules);
			aV.AJAX.ModuleManager.callbackQueue.splice(i, 1);
		}
		else
			i++;
	}
};

aV.Events.add(window, "scriptload", aV.AJAX.ModuleManager.onscriptloadHandler);