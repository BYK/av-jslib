/**
 * @fileOverview Defines a class which creates dynamic search ares supporting both basic and advanced options.
 * @name Dynamic Search
 * 
 * @author Burak Yiğit KAYA (byk@amplio-vita.net)
 * @version 1.0
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a> 
 */

/**
 * Constructor of the "DynamicSearch" objects
 * 
 * @constructor
 * @requires {@link String} aV.ext.string.js
 * @requires {@link aV.Events} aV.main.events.js
 * @requires {@link aV.AJAX} aV.main.ajax.js
 * @requires {@link aV.History} aV.main.history.js
 * @requires {@link aV.Visual} aV.main.visual.js
 * @requires {@link aV.Visual.infoBox} aV.plg.infoBox.js
 * @requires {@link aV.DBGrid} aV.module.DBGrid.js
 * 
 * @param {String} name The name of the search, which the object will be associated with.
 * @param {String | HTMLObject} element The element(or its id) where the necessary components of the DynamicSearch object will be created in.
 */
aV.DynamicSearch=function (name, element, guid)
{
	//assign for a unique guid to achive unique id's in the search boxes.
	if (!guid)
		guid=aV.DynamicSearch.$$lastGuid++;
	else if (guid<=aV.DynamicSearch.$$lastGuid)
		aV.DynamicSearch.$$lastGuid=guid+1;
	this.$$guid=guid;
	aV.DynamicSearch.list[this.$$guid]=this;
	this.name=name;
	
	if (!element)
		element=document.body;

	if (typeof this.element=='String') //get the "real" element if its id is given
		this.element=document.getElementById(this.element);

	this.element=element;
	//create the inner container for the object
	this._createContainer();

	//create and configure the DBGrid object which will be used to display the search results
	this.DBGrid=new aV.DBGrid(aV.config.DynamicSearch.paths.results, {}, this.container);
	this.DBGrid.printAfterParse=this.DBGrid.parseDataAfterFetch=true;
	var self=this;
	this.DBGrid.onFetchEnd=function()
	{
		aV.DynamicSearch.releaseForm(self.activeForm);
	};
	
	aV.DynamicSearch.historyList[this.$$guid]={name: this.name, element: element.id, form: 0};
	//create and initialize the basic and the advanced search forms
	this._initForms();
}
	
/**
 * Destroys the associated DBGrid object and removes the container which holds all the necessary components for search.
 */
aV.DynamicSearch.prototype.destroy=function()
{
	if (this.DBGrid)
		this.DBGrid.destroy();

	if (this.element && this.container)
		this.element.removeChild(this.container);

	delete aV.DynamicSearch.historyList[this.$$guid];
	delete aV.DynamicSearch.list[this.$$guid];
};

/**
 * Simply changes the display css property of the basic and the advanced forms according to the which parameter.
 * Also assigns the current form to the object's "activeForm" property.
 * 
 * @param {Integer} which 0 for basic search and 1 for advanced
 */
aV.DynamicSearch.prototype.setActiveForm=function(which)
{
	this.container.formBasic.style.display=(which==0)?'':'none';
	this.container.formAdvanced.style.display=(which==1)?'':'none';
	this.activeForm=(which==0)?this.container.formBasic:this.container.formAdvanced;
	aV.DynamicSearch.historyList[this.$$guid].form=which;
	aV.History._get[aV.config.DynamicSearch.history.key]=aV.DynamicSearch.historyList;
	aV.History.set();
};

/**
 * Creates a new container if there isn't an already created container.
 * If there is already another container created, returns or renews it according to the destructive parameter.
 * @param {Boolean} [destructive=false] If true, the function removes the possibly existing container and all its content.
 */
aV.DynamicSearch.prototype._createContainer=function(destructive)
{
	if (this.container)
	{
		if (destructive)
			this.element.removeChild(this.container);
		else
			return this.container;
	}
	
	//create and assign the container div to the "container" property of the current object.
	this.container=document.createElement("DIV");
	this.container.className=aV.config.DynamicSearch.classNames.container;

	var newA;
	var self=this;

	//create the tab switch links' container
	this.tabsTitle = this.container.appendChild(document.createElement("DIV"));
	this.tabsTitle.className=aV.config.DynamicSearch.classNames.tabTitle;

	//create the "Basic" and "Advanced" tab switch links.
	newA = this.tabsTitle.appendChild(document.createElement("A"));
	newA.href="javascript:aV.DynamicSearch.list[" + this.$$guid + "].setActiveForm(0)";
	newA.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.basic));
	
	newA = this.tabsTitle.appendChild(document.createElement("A"))
	newA.href="javascript:aV.DynamicSearch.list[" + this.$$guid + "].setActiveForm(1)";
	newA.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.advanced));

	//add the tab related objects to the container's content
	this.element.appendChild(this.container);
};

/**
 * Assign the default properties and event handlers to a newly created search condition field.
 * @param {Object} element The newly created condition field
 * @param {String} fieldName The associated field's name
 */
aV.DynamicSearch.prototype._initNewCondition=function(element, fieldName)
{
	if (this.fields[fieldName].isEnum)
		element.className=aV.config.DynamicSearch.classNames.enumInput;
	else if (this.fields[fieldName].noAC)
		element.className=aV.config.DynamicSearch.classNames.noAC;
	else
		element.className=null;
	if (element.aVautoComplete)
		element.aVautoComplete=undefined;
	aV.Events.clear(element);
	aV.Events.add(element, 'keyup', this.fields[fieldName].checkFunction);
};

/**
 * Creates the basic search form in the container.
 * If the form is already creatd returns the existing one or renews it according to the destructive parameter.
 * @param {Boolean} [destructive=false] If true, the function removes the possibly existing form and all its content.
 */
aV.DynamicSearch.prototype._createBasicForm=function(destructive)
{
	if (!this.container) 
		this._createContainer();
	else if (this.container.formBasic) 
	{
		if (destructive) 
			this.container.removeChild(this.container.formBasic);
		else 
			return this.container.formBasic;
	}
			
	this.container.formBasic=document.createElement("FORM");

	this.container.formBasic.className = aV.config.DynamicSearch.classNames.form;
	this.container.formBasic.action = 'javascript:void();';
	this.container.formBasic.method = "GET";
	this.container.formBasic.owner = this;
	
	this.container.formBasic.enlargeShrink=function()
	{
		var enlarge=(this.labels.lastChild.firstChild.firstChild.nodeValue==aV.config.DynamicSearch.texts.enlarge);
		for (var i=this.list.childNodes.length-2; i>=0; i--)
		{
			if (this.owner.fields[this.list.childNodes[i].firstChild.field.value].hidden)
			{
				if (enlarge)
				{
					this.list.childNodes[i].style.display='';
					this.labels.childNodes[i].style.display='';
					aV.Visual.fade(this.list.childNodes[i], 1);
					aV.Visual.fade(this.labels.childNodes[i], 1);
				}
				else
				{
					aV.Visual.fade(this.list.childNodes[i], 0, function(obj){obj.style.display='none';});
					aV.Visual.fade(this.labels.childNodes[i], 0, function(obj){obj.style.display='none';});
				}
			}
		}
		this.labels.lastChild.firstChild.innerHTML='';
		this.labels.lastChild.firstChild.appendChild(document.createTextNode((enlarge)?aV.config.DynamicSearch.texts.shrink:aV.config.DynamicSearch.texts.enlarge));
	};

	aV.Events.add(this.container.formBasic, 'submit', aV.DynamicSearch._onFormSubmit);
	aV.Events.add(this.container.formBasic, 'reset', aV.DynamicSearch.releaseForm);

	this.container.formBasic.labels=document.createElement('UL');
	this.container.formBasic.list=document.createElement('UL');
	
	var newLi;
	
	this.container.formBasic.labels.className=aV.config.DynamicSearch.classNames.labelsUL;
	this.container.formBasic.list.className=aV.config.DynamicSearch.classNames.inputsUL;
	var formEnlargable=false;
	
	for (var fieldName in this.fields) 
	{
		if (!this.fields[fieldName].checkFunction) this.fields[fieldName].checkFunction = aV.config.DynamicSearch.checkFunctions['dt_' + this.fields[fieldName].dataType] || aV.config.DynamicSearch.checkFunctions.dt_default;
		
		newLi = document.createElement('LI');
		newLi.id="avDs_formBasic-" + this.$$guid + "field-" + fieldName;
		var newInput = newLi.appendChild(document.createElement("INPUT"));
		newInput.name='aVdS_input-basic-' + this.$$guid + '-' + fieldName;
		newInput.type = 'TEXT';
		newInput.id = newInput.name;
		newInput.operator = 
		{
			value: (('dt_' + this.fields[fieldName].dataType) in aV.config.DynamicSearch.operators) ? aV.config.DynamicSearch.operators['dt_' + this.fields[fieldName].dataType][0] : aV.config.DynamicSearch.operators.dt_default[0]
		};
		newInput.field = 
		{
			value: fieldName
		};
		
		this._initNewCondition(newInput, fieldName);

		this.container.formBasic.list.appendChild(newLi);
		
		newLi = document.createElement('LI');
		newLi.id="avDs_formBasic-" + this.$$guid + "label-" + fieldName;
		with (newLi.appendChild(document.createElement("LABEL"))) 
		{
			setAttribute("for", newInput.name);
			appendChild(document.createTextNode(this.fields[fieldName].alias));
		}
		this.container.formBasic.labels.appendChild(newLi);
		
		if (this.fields[fieldName].hidden) 
		{
			this.container.formBasic.list.lastChild.style.display = 'none';
			this.container.formBasic.labels.lastChild.style.display = 'none';
			aV.Visual.setOpacity(this.container.formBasic.list.lastChild, 0);
			aV.Visual.setOpacity(this.container.formBasic.labels.lastChild, 0);
			formEnlargable=true;
		}
	}
	
	if (formEnlargable)
	{
		newLi = document.createElement("li");
		var newLink=newLi.appendChild(document.createElement("a"));
		newLink.href="javascript:void(0)";
		var self=this;
		newLink.onclick=function(){self.container.formBasic.enlargeShrink();return false;};
		newLink.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.enlarge));
		this.container.formBasic.labels.appendChild(newLi);
	}
	
	aV.DynamicSearch.addFormButtons(this.container.formBasic.list);
	this.container.formBasic.appendChild(this.container.formBasic.labels);
	this.container.formBasic.appendChild(this.container.formBasic.list);
	this.container.appendChild(this.container.formBasic);
};

aV.DynamicSearch.prototype._createAdvancedForm = function(destructive)
{
	if (!this.container) 
		this._createContainer();
	else if (this.container.formAdvanced)
	{
		if (destructive) 
			this.container.removeChild(this.container.formAdvanced);
		else 
			return this.container.formAdvanced;
	}
	
	this.container.formAdvanced=document.createElement("FORM");
	this.container.formAdvanced.className = aV.config.DynamicSearch.classNames.form;
	this.container.formAdvanced.action = 'javascript:void(0);';
	this.container.formAdvanced.method = "GET";
	this.container.formAdvanced.owner=this;
	this.container.formAdvanced.list = this.container.formAdvanced.appendChild(document.createElement("UL"));
	this.container.formAdvanced.list.className = aV.config.DynamicSearch.classNames.conditions;
	
	aV.Events.add(this.container.formAdvanced, 'submit', aV.DynamicSearch._onFormSubmit);
	aV.Events.add(this.container.formAdvanced, 'reset', aV.DynamicSearch.releaseForm);
	
	aV.DynamicSearch.addFormButtons(this.container.formAdvanced.list);
	
	var self=this;

	this.container.formAdvanced.addButton = document.createElement("A");
	this.container.formAdvanced.addButton.href="javascript:void(0);";
	this.container.formAdvanced.addButton.className=aV.config.DynamicSearch.classNames.addCondition;
	this.container.formAdvanced.addButton.title=aV.config.DynamicSearch.texts.addCondition;
	this.container.formAdvanced.addButton.onclick=function(){self.addCondition(this.parentNode); this.href=document.location; return false;};

	this.container.formAdvanced.removeButton = document.createElement("A");
	this.container.formAdvanced.removeButton.href="javascript:void(0);";
	this.container.formAdvanced.removeButton.className=aV.config.DynamicSearch.classNames.removeCondition;
	this.container.formAdvanced.removeButton.title=aV.config.DynamicSearch.texts.removeCondition;
	this.container.formAdvanced.removeButton.onclick=function(){self.removeCondition(this.parentNode); this.href=document.location; return false;};
	
	this.container.appendChild(this.container.formAdvanced);
	this.addCondition();
	aV.DynamicSearch._onConditionMouseOver({target: this.container.formAdvanced.list.firstChild});
};

aV.DynamicSearch.prototype._initForms=function()
{
	var self=this;
	
	var loadIndicator=this.container.appendChild(document.createElement("DIV"));
	loadIndicator.className=aV.config.DynamicSearch.classNames.loadIndicator;
	loadIndicator.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.loading));
	
	var initializer=function(requestObject)
	{
		if (!aV.AJAX.isResponseOK(requestObject))
			return;
		self.fields=eval('(' + requestObject.responseText + ')');
		for (var fieldName in self.fields)
			if (!("alias" in self.fields[fieldName]))
				self.fields[fieldName].alias = fieldName.replace(/_/g, " ").ucWords();
		self.container.removeChild(loadIndicator);
		self._createBasicForm(true);
		self._createAdvancedForm(true);
		aV.AutoComplete.init();	
		self.setActiveForm(aV.DynamicSearch.historyList[self.$$guid].form);
	};
	
	aV.AJAX.makeRequest('GET', aV.config.DynamicSearch.paths.fields, {name: this.name}, initializer);
};

aV.DynamicSearch.prototype.addCondition=function(afterElement)
{
	var parentElement;
	if (!afterElement) 
	{
		afterElement = this.container.formAdvanced.list.lastChild;
		parentElement = this.container.formAdvanced.list;
	}
	else 
	{
		parentElement = afterElement.parentNode;
		afterElement = afterElement.nextSibling;
	}

	var liList=this.container.formAdvanced.list.getElementsByTagName("LI");
	if (liList.length>1)
	{
		var newLi = document.createElement("LI");
		newLi.className = aV.config.DynamicSearch.classNames.conjunction;
		var conjunctionSelector = newLi.appendChild(document.createElement("SELECT"));
		for (var i = 0; i < aV.config.DynamicSearch.conjunctions.length; i++) 
			conjunctionSelector.add(new Option(aV.config.DynamicSearch.conjunctions[i]), undefined);
		conjunctionSelector.value=conjunctionSelector.options[0].value;
		parentElement.insertBefore(newLi, afterElement);
	}

	var newLi=document.createElement("LI");
	newLi.owner=this;
	var fieldSelector=newLi.appendChild(document.createElement("SELECT"));
	for (var fieldName in this.fields)
		fieldSelector.add(new Option(this.fields[fieldName].alias, fieldName), undefined);
	aV.Events.add(fieldSelector, 'change', aV.DynamicSearch._onFieldSelect);
	var operatorSelector=newLi.appendChild(document.createElement("SELECT"));
	var condition=newLi.appendChild(document.createElement("INPUT"));
	condition.name='aVdS_input-advanced-' + this.$$guid + '-' + liList.length; //might not be unique, TODO: CHECK!
	condition.type='TEXT';
	condition.id=condition.name;
	condition.field=fieldSelector;
	condition.operator=operatorSelector;
	fieldSelector.condition=condition;
	operatorSelector.condition=condition;
	
	parentElement.insertBefore(newLi, afterElement);
	aV.Events.add(newLi, 'click', aV.DynamicSearch._onConditionClick);
	aV.Events.add(newLi, 'dblclick', aV.DynamicSearch._onConditionDblClick);
	aV.Events.add(newLi, 'mouseover', aV.DynamicSearch._onConditionMouseOver);
	fieldSelector.value=fieldSelector.options[0].value;
	aV.DynamicSearch._onFieldSelect({target: fieldSelector});
};

aV.DynamicSearch.prototype.removeCondition = function(condition)
{
	if (!condition)
		condition=liList[liList.length-2];
	var liList=this.container.formAdvanced.list.getElementsByTagName("LI");
	if (liList.length > 2 && condition!=liList[0]) 
	{
		var conjunction=condition.previousSibling;
		while (!conjunction || conjunction.className != aV.config.DynamicSearch.classNames.conjunction || condition.parentNode.childNodes.length<4) 
		{
			aV.DynamicSearch._ungroupCondition(condition);
			conjunction=condition.previousSibling;
		}
		condition.parentNode.removeChild(condition);
		conjunction.parentNode.removeChild(conjunction);
	}
	else
		aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.removeConditionError, aV.config.Visual.infoBox.images.info);
};

aV.DynamicSearch._onFieldSelect=function(event)
{
	event.target.condition.value='';
	var operatorSelector=event.target.condition.operator;
	while (operatorSelector.options.length)
		operatorSelector.remove(operatorSelector.options[0]);
	var operatorList=aV.config.DynamicSearch.operators['dt_' + event.target.form.owner.fields[event.target.value].dataType] || aV.config.DynamicSearch.operators.dt_default;
	for (var i=0; i<operatorList.length; i++)
		operatorSelector.add(new Option(operatorList[i]), undefined);

	event.target.form.owner._initNewCondition(event.target.condition, event.target.value);
	aV.AutoComplete.init();
	if (event.target.condition.aVautoComplete)
		event.target.condition.aVautoComplete.list=undefined;
};

aV.DynamicSearch._onConditionClick=function(event)
{
	if (event.target.tagName!="LI" || !event.target.owner)
		return;
	var currentElement;
	if (event.target.owner.groupSE)
	{
		currentElement=event.target.owner.groupSE;
		aV.Visual.setOpacity(currentElement, 1);
		delete event.target.owner.groupSE;
		
		endElement=aV.DynamicSearch._getTopLevel(event.target);
		
		if (currentElement==endElement)
			return;

		function getRelativeNodeIndex(element)
		{
			for (var i=0; i<element.parentNode.childNodes.length; i++)
				if (element==element.parentNode.childNodes[i])
					return i;
			return -1;
		}
		
		if (getRelativeNodeIndex(currentElement)>getRelativeNodeIndex(endElement))
		{
			var temp=currentElement;
			currentElement=endElement;
			endElement=temp;
		}
		
		var newContainer=document.createElement("DIV");
		newContainer.className=aV.config.DynamicSearch.classNames.groupContainer;
		currentElement.parentNode.insertBefore(newContainer, currentElement);
		var addedElement;
		var loop=true;
		
		while (currentElement && loop)
		{
			temp=currentElement.nextSibling;
			addedElement=newContainer.appendChild(currentElement);

			if (currentElement==endElement)
				loop=false;
			currentElement=temp;
		}
	}
	else
	{
		currentElement=aV.DynamicSearch._getTopLevel(event.target);
		event.target.owner.groupSE=currentElement;
		aV.Visual.setOpacity(currentElement, 0.5);
	}
	event.stopPropagation();
};

aV.DynamicSearch._onConditionDblClick=function(event)
{
	aV.DynamicSearch._ungroupCondition(event.target);
};

aV.DynamicSearch._onConditionMouseOver=function(event)
{
	if (!event.target.owner)
		return;

	event.target.appendChild(event.target.owner.container.formAdvanced.removeButton);
	event.target.appendChild(event.target.owner.container.formAdvanced.addButton);

	event.target.owner.container.formAdvanced.removeButton.style.display='';
	event.target.owner.container.formAdvanced.addButton.style.display='';
};

aV.DynamicSearch._ungroupCondition=function(element, removeAll)
{
	var groupContainer=aV.DynamicSearch._getTopLevel(element);
	while (groupContainer && groupContainer.tagName != 'LI') 
	{
		while (groupContainer.childNodes.length) 
			groupContainer.parentNode.insertBefore(groupContainer.firstChild, groupContainer);
		groupContainer.parentNode.removeChild(groupContainer);
		groupContainer=removeAll && aV.DynamicSearch._getTopLevel(element);
	}
};

aV.DynamicSearch._getTopLevel=function(element)
{
	while (element.parentNode.tagName != "UL") 
		element = element.parentNode;
	return element;
};

aV.DynamicSearch.addFormButtons=function(list)
{
	var newButton;
	var newItem=document.createElement('LI');
	newItem.className=aV.config.DynamicSearch.classNames.controlButtons;

	newButton=document.createElement("INPUT");
	newButton.type='SUBMIT';
	newButton.value=aV.config.DynamicSearch.texts.submit;
	newItem.appendChild(newButton);
	
	newButton=document.createElement("INPUT");
	newButton.type='BUTTON';
	newButton.onclick=function(){this.form.reset();};
	/*
	 * Reason for not using type="RESET" is IE's behavior.
	 * It immediately focuses the reset button when the ESC key is pressed
	 * which is a problem for AutoComplete
	 */
	newButton.value=aV.config.DynamicSearch.texts.reset;
	newItem.appendChild(newButton);

	list.appendChild(newItem);
};

aV.DynamicSearch.releaseForm=function(form)
{
	if (!form.elements)
		form=form.target;

	for (var i = 0; i < form.elements.length; i++) 
		form.elements[i].disabled=form.elements[i].oldDisabled;
};

aV.DynamicSearch._onFormSubmit=function(event)
{
	var form=event.target;
	/*
	 *  Firefox < 2.0.0.15 fix [START]
	 * event.target is not the form itself but the input box where the user presses ENTER key.
	 */
	if (form.form)
		form=form.form;
	/* Firefox < 2.0.0.15 fix [END] */

	
	var params=
	{
		search:
		{
			name: form.owner.name,
			fields: [],
			conjunctions: []
		}
	};
	
	if (form==form.owner.container.formAdvanced && form.addButton.parentNode)
	{
		form.addButton.parentNode.removeChild(form.addButton);
		form.removeButton.parentNode.removeChild(form.removeButton);		
	}
	
	function buildParameters(element, pCount)
	{
		while (element && element.className!=aV.config.DynamicSearch.classNames.controlButtons) 
		{
			if (element.tagName != 'LI') 
			{
				if (!buildParameters(element.firstChild, pCount + 1)) 
					return false;
				params.search.fields[params.search.fields.length - 1].paranthesis--;
			}
			else 
			{
				var inputElement = element.lastChild;
				if (element.className == aV.config.DynamicSearch.classNames.conjunction) 
					params.search.conjunctions.push(inputElement.value);
				else 
				{
					if (!form.owner.fields[inputElement.field.value].checkFunction(inputElement) || (inputElement.value == '' && form == form.owner.container.formAdvanced)) 
					{
						aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.invalidConditionValue, aV.config.Visual.infoBox.images.error);
						aV.DynamicSearch.releaseForm(form);
						return false;
					}
					
					if (inputElement.value != '') 
					{
						params.search.fields.push(
						{
							name: inputElement.field.value,
							value: inputElement.value,
							operator: inputElement.operator.value,
							paranthesis: pCount
						});
						inputElement.oldDisabled = inputElement.disabled;
						inputElement.disabled = true;
					}
				}
			}
			pCount = 0;
			element=element.nextSibling;
		}
		return true;
	}
	
	if (buildParameters(form.list.firstChild, 0) && params.search.fields.length) 
	{
		aV.DynamicSearch.historyList[this.$$guid].state=params;
		aV.History.set();
		form.owner.DBGrid.parameters = params;
		form.owner.DBGrid.refreshData(/*true*/);
	}
	return false;
};

aV.DynamicSearch._historyonchangeHandler=function(event)
{
	if (!aV.config.DynamicSearch.history.active)
		return;
	var matcher=new RegExp("^\\['" + aV.config.DynamicSearch.history.key + "'\\]", "");
	if (!event.changedKeys.reduce(function(a,b){if (!a) a=matcher.test(b); return a;}))
		return;
	aV.DynamicSearch.historyList=aV.History._get[aV.config.DynamicSearch.history.key];

	for (var guid in aV.DynamicSearch.historyList)
	{
		if (!(guid in aV.DynamicSearch.list))
			new aV.DynamicSearch(aV.DynamicSearch.historyList[guid].name, aV.DynamicSearch.historyList[guid].element, guid);
		else	if (aV.DynamicSearch.list[guid].name!=aV.DynamicSearch.historyList[guid].name)
		{
			aV.DynamicSearch.list[guid].name=aV.DynamicSearch.historyList[guid].name;
			aV.DynamicSearch.list[guid]._initForms();
		}
		else
			aV.DynamicSearch.list[guid].setActiveForm(aV.DynamicSearch.historyList[guid].form);
	}
};

aV.DynamicSearch.$$lastGuid=1;

aV.config.DynamicSearch=
{
	classNames:
	{	
		error: 'aVdS_error',
		container: 'aVdS_container',
		tabTitle: 'aVdS_tabTitle',
		form: 'aVdS_form',
		controlButtons: 'aVdS_controlButtons',
		labelsUL: 'aVdS_labels',
		inputsUL: 'aVdS_inputs',
		enumInput: 'aVdS_enum',
		loadIndicator: 'aVdS_loading',
		conditions: 'aVdS_conditions',
		addCondition: 'aVdS_addCondition',
		removeCondition: 'aVdS_removeCondition',
		groupContainer: 'aVdS_groupContainer',
		conjunction: 'aVdS_conjunction',
		noAC: 'aVdS_noAC'
	},
	paths:
	{
		results: '/dynamic/search/search.php',
		fields: '/dynamic/search/fields_info.php'
	},
	history:
	{
		active: true,
		key: 'aVdS'
	},
	texts:
	{
		submit: 'Search',
		reset: 'Clear',
		basic: 'Basic',
		advanced: 'Advanced',
		loading: 'Loading...',
		addCondition: 'Add',
		removeCondition: 'Remove',
		enlarge: 'Enlarge',
		shrink: 'Shrink',
		removeConditionError: 'You cannot remove this item.',
		invalidConditionValue: 'You have invalid data in one or more fields.'
	},
	operators:
	{
		dt_default: ['LIKE', 'NOT LIKE', '=', '<>'],
		dt_integer: ['=', '<=', '<', '>=', '>', '<>'],
		dt_real: ['=', '<=', '<', '>=', '>', '<>'],
		dt_date: ['=', '<=', '<', '>=', '>', '<>']
	},
	conjunctions: ['AND', 'OR'],
	checkFunctions:
	{
		dt_default: function()
		{
			return true;
		},
		dt_int: function(element)
		{
			element=element.target || element.srcElement || element;
			var isValid=element.value.match(/^-?\d*$/);
			element.className=(isValid)?'':aV.config.DynamicSearch.classNames.error;
			return isValid;
		},
		dt_real: function(element)
		{
			element=element.target || element.srcElement || element;
			var isValid=element.value.match(/^-?\d*\.?\d*$/);
			element.className=(isValid)?'':aV.config.DynamicSearch.classNames.error;
			return isValid;
		},
		dt_date: function(element)
		{
			element=element.target || element.srcElement || element;
			var isValid=(element.value=='') || element.value.match(/^\d{4}-\d{2}-\d{2}($| \d{2}:\d{2}$| \d{2}:\d{2}:\d{2}$)/);
			element.className=(isValid)?'':aV.config.DynamicSearch.classNames.error;
			return isValid;
		}
	}
};

aV.DynamicSearch.list={};
aV.DynamicSearch.historyList={};
aV.Events.add(aV.History, "change", aV.DynamicSearch._historyonchangeHandler);
aV.AJAX.loadResource("/JSLib/css/aV.module.dynamicSearch.css", "css", "aVdynamicSearchCSS");