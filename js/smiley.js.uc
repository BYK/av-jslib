var smileyDiv;
var activeSmileyElement;
var suspend;
var smileys=new Array(':sansür:',
											':sakın:',
											':deli:',											
											':DD',
											':D',
											':)',
											';)',
											':P',
											'(6)',
											':\'(',
											':E',
											':@',
											':grr:',
											':$',
											':(',
											':S',
											';P',
											'>)',
											':hıh:',
											':beta:',
											':bum:',
											':alkış:',
											'??',
											':artist:',
											':bilmem:',
											':anlamadım:',
											':hürmetler:',
											':aşık:',
											':masum:',
											':tamam:',
											':kus:',
											':özür:',
											':bayıl:',
											':olmamış:',
											':olmuş:',
											':vay:',
											':|',
											':imdat:',
											':şok:',
											':zafer:',
											':teslim:',
											':şerefe:');
var images=new Array('censored.gif',
										 'nono.gif',
										 'crazy.gif',
										 'hysterical.gif',
										 'biggrin.gif',
										 'smile.gif',
										 'wink.gif',
										 'tongue.gif',
										 'evil.gif',
										 'cry.gif',
										 'lol.gif',
										 'mad.gif',
										 'ranting.gif',
										 'ups.gif',
										 'sad.gif',
										 'confusedS.gif',
										 'winktongue.gif',
										 'threat.gif',
										 'beee.gif',
										 'beta.gif',
										 'blow.gif',
										 'clap.gif',
										 'confused.gif',
										 'cool.gif',
										 'dntknw.gif',
										 'dontgetit.gif',
										 'hi.gif',
										 'in_love.gif',
										 'innocent.gif',
										 'ok.gif',
										 'puke.gif',
										 'sorry.gif',
										 'swoon.gif',
										 'thumbdown.gif',
										 'thumbup.gif',
										 'wow.gif',
										 'eek.gif',
										 'help.gif',
										 'shocking.gif',
										 'victory.gif',
										 'surrender.gif',
										 'cheers.gif');

function text2smiley(theText)
{
	var expression='';
	var replacementArray=new Array();
	for (var i=0; i<smileys.length; i++)
	{
		expression+='|' + escapeRegExp(smileys[i]);
		replacementArray[smileys[i]]=images[i];
	}
	expression=expression.substr(1);
	var matcher=new RegExp(expression, "gi");
	var result;
	var outText='';
	var lastMatch=0;
	while (result=matcher.exec(theText))
	{
		outText+=theText.substring(lastMatch, result.index);
		outText+='<img class="smiley" src="smiley/' + replacementArray[result[0]] + '" alt="' + result[0] + '" title="' + result[0] + '" />';
		lastMatch=result.index+result[0].length;
	}
	delete matcher;
	delete replacementArray;
	outText+=theText.substr(lastMatch);
	return outText;	
}

function smileyElement(element)
{
	if (typeof(element)=='string')
		element=document.getElementById(element);
	element.innerHTML=text2smiley(element.innerHTML);	
}

function unsmileyElement(element)
{
	if (typeof(element)=='string')
		element=document.getElementById(element);
	var imgs=element.getElementsByTagName('img');
	var i=0;
	while (i<imgs.length)
	{
		if (imgs[i].className=='smiley')
		{
			var textVer=document.createTextNode(imgs[i].getAttribute("alt"));
			imgs[i].parentNode.insertBefore(textVer, imgs[i]);
			imgs[i].parentNode.removeChild(imgs[i]);
		}
		else
			i++;
	}
}

function createSmileyList(colCount)
{
	smileyDiv=document.createElement("div");
	smileyDiv.id="smileyDiv";

	var outText='';//'<div style="background: #FFFFFF; padding: 2px; margin: 0px;" align="right"><a style="text-decoration: none" href="javascript: activeSmileyElement.focus();">[x]</a></div>';
	for (var i=0; i<smileys.length; i++)
	{
		if (i>0 && i%colCount==0)
			outText+='<br />';
		outText+='<img style="cursor: pointer; margin: 2px;" onmousedown="suspend=true;" onclick="if(activeSmileyElement)insertText(activeSmileyElement,this.getAttribute(\'alt\'))" alt="' + smileys[i] + '" title="' + smileys[i] + '" src="smiley/' + images[i] + '" />';
	}
	smileyDiv.innerHTML=outText;
	document.body.appendChild(smileyDiv);
}

function showSmileyList(e)
{
	if (suspend)
	{
		suspend=!suspend;
		return;
	}
	
	if (!e) e=window.event;
	var element=(e.srcElement)?e.srcElement:e.target;
	if (activeSmileyElement==element)
		return;
	
	if (!smileyDiv)
		createSmileyDiv(6);
		
	activeSmileyElement=element;
	smileyDiv.style.display="block";
	smileyDiv.style.top=(getElementPositionY(element) - Math.round((smileyDiv.offsetHeight - element.offsetHeight)/2)) + "px";
	smileyDiv.style.left=(getElementPositionX(element) - smileyDiv.offsetWidth - 30) + "px";
}

function hideSmileyList(back)
{
	if (suspend)
	{
		suspend=!suspend;
		return;
	}
		
	if (smileyDiv)
		smileyDiv.style.display="none";
	
	if (back===true)
		suspend=true;
	
	activeSmileyElement=false;
}

function destroySmileyList()
{
	if (smileyDiv)
		document.body.removeChild(smileyDiv);
	return true;
}

function insertText(element, text)
{
	if (!document.all)
	{
		var selStart=element.selectionStart;
		var val=element.value;
		element.value=val.substring(0, selStart) + text + val.substring(selStart);
		element.focus();
		element.setSelectionRange(selStart + text.length, selStart + text.length);
	}
	else
	{
		element.value+=text;
		element.focus();
	}
}

function attachSmileyDivToElements()
{
	textareas=document.getElementsByTagName("textarea");
	for (var i=0; i<textareas.length; i++)
	{
		if (/*textareas[i].className=='smiley' && */!textareas[i].onfocus && !textareas[i].onblur)
		{
			textareas[i].onfocus=showSmileyList;
			textareas[i].onblur=hideSmileyList;
		}
	}
}