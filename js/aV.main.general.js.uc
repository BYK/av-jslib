var pageVars;

DOM=
{
	function collectElements(container, condition, recursive, collection)
	{
		if (!collection)
			collection=new Array();
		if (!condition)
			condition="1";
		var elements;
		elements = container.childNodes; //get all sub elements under the container

		for (var i=0; i<elements.length; i++)
		{ //scan through the sub elements
			theElement=elements[i];
			if (theElement.nodeType==1 && eval(condition))
				collection.push(theElement);
			else if (recursive && theElement.hasChildNodes()) //if the element has sub nodes
				collectElements(theElement, condition, collection); //call to iterate over the sub nodes
		}
		return collection;
	}

	function removeChildren(container)
	{
		while (container.firstChild)
			container.removeChild(container.firstChild);
	}
	
	function checkRequiredFormElements(theForm)
	{
		var result=true;
		for(var i=0; (result && (i<theForm.elements.length)); i++)
		{
			if (theForm.elements[i].getAttribute("reqLen"))
				result=result && (theForm.elements[i].value.length>=parseInt(theForm.elements[i].getAttribute("reqLen")))
		}
		if (!result)
		{
			if (Visual && Visual.infoBox)
				Visual.infoBox.show(generalVars["invalidInfoMsg"]);
			else
				alert(generalVars["invalidInfoMsg"]);
		}
		return result;
	}
};

Location=
{
	function fillPageVars()
	{
		pageVars=undefined;
		pageVars=(document.location.hash.length>1) ? document.location.hash.substring(1).split('&') : new Array(0);
		for (var i=0; i<pageVars.length; i++)
		{
			tempArray=pageVars[i].split('=');
			pageVars[tempArray[0]]=decodeURIComponent(tempArray[1]);
			delete tempArray;
		}
	}
};