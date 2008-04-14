function initCustomSelectBoxes(mainNode)
{
	if (!mainNode)
		mainNode=document;
	var ulElements=mainNode.getElementsByTagName("ul");
	var textbox, checkbox, childLi;
	for (var i=ulElements.length-1; i>=0; i--)
	{
		if (ulElements[i].className=='customSelect')
		{
			textbox=document.createElement("INPUT");
			textbox.type="text";
			textbox.className="customSelectTextInput";
			textbox.onfocus=openCustomSelect;
			textbox.onblur=closeCustomSelect;
			textbox.setAttribute('title', ulElements[i].getAttribute('title'));
			ulElements[i].setAttribute('title', null);
			ulElements[i].parentNode.insertBefore(textbox, ulElements[i]);
			ulElements[i].onmouseover=function() {this.inUse=true;};
			ulElements[i].onmouseout=function() {this.inUse=false;this.previousSibling.focus();};
			/* scan through the childs to add checkboxes */
			liElements=ulElements[i].getElementsByTagName("li");
			for (var j=liElements.length-1; j>=0; j--)
			{
				childLi=liElements[j];
				checkbox=document.createElement("INPUT");
				checkbox.type="checkbox";
				checkbox.name=childLi.getAttribute('itemName');
				checkbox.onclick=selectLine;
				//childLi.setAttribute('text', childLi.innerHTML);
				childLi.insertBefore(checkbox, childLi.firstChild);
			}
			/* scan completed */
			ulElements[i].style.display='none';
		}
	}
}

/* "private" functions for checkboxes-start */
function selectLine(e)
{
	if (!e) e=window.event;
	var element=(e.srcElement)?e.srcElement:e.target;
	element.parentNode.className=(element.checked)?'selected':null;
}
/* "private" functions for checkboxes-end */

/* "private" functions for textboxes-start */
function openCustomSelect(e)
{
	if (!e) e=window.event;
	var element=(e.srcElement)?e.srcElement:e.target;
	var element=element.nextSibling;
	if (element.tagName=='UL' && element.className=='customSelect')
		element.style.display='block';
}

function closeCustomSelect(e)
{
	if (!e) e=window.event;
	var element=(e.srcElement)?e.srcElement:e.target;
	var element=element.nextSibling;
	if (element.tagName=='UL' && element.className=='customSelect' && !element.inUse)
	{
		element.style.display='none';
		updateTextboxContent(element);
	}
}

function updateTextboxContent(listContainer)
{
	/* scan through the childs to add checkboxes */
	var liElements=listContainer.getElementsByTagName("li");
	var listArray=new Array();
	var childLi;
	for (var i=0; i<liElements.length; i++)
	{
		childLi=liElements[i];
		if (childLi.className=='selected')
			listArray.push(childLi.getAttribute("text"));
	}
	/* scan completed */
	listContainer.previousSibling.value=listArray.join(', ');
}
/* "private" functions for textkboxes-end */