/**
 * @fileOverview Defines a class which creates dynamic search ares supporting both basic and advanced options.
 * @name Dynamic Search
 * 
 * @author Burak Yiğit KAYA <byk@amplio-vita.net>
 * @version 1.2
 * @copyright &copy;2008 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a> 
 */

/**
 * Constructor of the "DynamicSearch" objects
 * 
 * @constructor
 * @requires {@link String} aV.ext.string.js
 * @requires {@link Object} aV.ext.object.js
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

	if (typeof element=='string') //get the "real" element if its id is given
		element=document.getElementById(element);

	this.element=element;
	//create the inner container for the object
	this._createContainer();

	if (!aV.DynamicSearch.historyList[this.$$guid])
		aV.DynamicSearch.historyList[this.$$guid]={name: this.name, element: element.id, form: 0};

	//create and initialize the basic and the advanced search forms
	this._initialize();
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
	aV.DynamicSearch.updateHistory();
};

aV.DynamicSearch.prototype.isFieldHidden=function(fieldName, form)
{
	return (this.properties.fieldList[fieldName].hiddenIn && this.properties.fieldList[fieldName].hiddenIn.indexOf(form)>-1);
};

aV.DynamicSearch.prototype._initialize=function()
{
	var self=this;
	
	aV.AJAX.destroyRequestObject(this.loader);
	
	var loadIndicator=this.container.insertBefore(document.createElement("DIV"), this.container.tabsTitle.nextSibling);
	loadIndicator.className=aV.config.DynamicSearch.classNames.loadIndicator;
	loadIndicator.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.loading));
	
	var initializer=function(requestObject)
	{
		self.container.removeChild(loadIndicator);
		
		if (!aV.AJAX.isResponseOK(requestObject, "application/json")) 
		{
			aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.responseNotValid, aV.config.Visual.infoBox.images.error);
			return;
		}
		
		self.properties=aV.AJAX.getResponseAsObject(requestObject);

		for (var fieldName in self.properties.fieldList)
		{
			if (!self.properties.fieldList.hasOwnProperty(fieldName))
				continue;

			if (!("alias" in self.properties.fieldList[fieldName])) 
				self.properties.fieldList[fieldName].alias = fieldName.replace(/_/g, " ").ucWords();

			if (!(self.properties.fieldList[fieldName].checkFunction instanceof Function))
				self.properties.fieldList[fieldName].checkFunction = aV.config.DynamicSearch.checkFunctions['dt_' + self.properties.fieldList[fieldName].dataType] || aV.config.DynamicSearch.checkFunctions.dt_default;
		}

		self._createDBGrid(true);
		self._createBasicForm(true);
		self._createAdvancedForm(true);
		aV.AutoComplete.init();
		self.setActiveForm(aV.DynamicSearch.historyList[self.$$guid].form, false);
	};
	this.loader=aV.AJAX.makeRequest('GET', aV.config.DynamicSearch.paths.fields, {name: this.name}, initializer);
};

/**
 * Simply changes the display css property of the basic and the advanced forms according to the which parameter.
 * Also assigns the current form to the object's "activeForm" property.
 * 
 * @param {Integer} which 0 for basic search and 1 for advanced
 */
aV.DynamicSearch.prototype.setActiveForm=function(which)
{
	which=parseInt(which);
	if (which<0 || which>=aV.config.DynamicSearch.formTypes.length)
		return false;

	for (var i = 0; i < aV.config.DynamicSearch.formTypes.length; i++) 
	{
		this.container.content['form' + aV.config.DynamicSearch.formTypes[i]].style.display = (which == i) ? '' : 'none';
		this.container.tabsTitle.childNodes[i].className = (which == i) ? aV.config.DynamicSearch.classNames.acitveTabTitle : '';
	}
	this.activeForm = this.container.content['form' + aV.config.DynamicSearch.formTypes[which]];

	if (aV.DynamicSearch.historyList[this.$$guid].form != which) 
	{
		aV.DynamicSearch.historyList[this.$$guid].form = which;
		aV.DynamicSearch.updateHistory();
	}

	if (aV.DynamicSearch.historyList[this.$$guid] && aV.DynamicSearch.historyList[this.$$guid].state)
	{
		if (aV.DynamicSearch.historyList[this.$$guid].form == 0)
		{
			this.container.content['form' + aV.config.DynamicSearch.formTypes[0]].reset();
			for (var i = 0; i < aV.DynamicSearch.historyList[this.$$guid].state.fields.length; i++) 
				document.getElementById(aV.config.DynamicSearch.idFormats.formBasicInput.format(this.$$guid, aV.DynamicSearch.historyList[this.$$guid].state.fields[i].name)).value = aV.DynamicSearch.historyList[this.$$guid].state.fields[i].value || '';
		}
		else if (aV.DynamicSearch.historyList[this.$$guid].form == 1)
		{
			this.supressRemoveWarning=true;
			while (this.removeCondition()) ;
			this.supressRemoveWarning=false;
			this.container.content.formAdvanced.list.removeChild(this.container.content.formAdvanced.list.firstChild);
			var newCondition;
			for (var i = 0; i < aV.DynamicSearch.historyList[this.$$guid].state.fields.length; i++)
			{
				newCondition=this.addCondition();
				newCondition.field.value=aV.DynamicSearch.historyList[this.$$guid].state.fields[i].name;
				newCondition.field.onchange({type: "change", target: newCondition.field});
				newCondition.operator.value=aV.DynamicSearch.historyList[this.$$guid].state.fields[i].operator;
				newCondition.value=aV.DynamicSearch.historyList[this.$$guid].state.fields[i].value || '';
				if (i>0 && aV.DynamicSearch.historyList[this.$$guid].state.conjunctions && aV.DynamicSearch.historyList[this.$$guid].state.conjunctions.length>=i)
					newCondition.parentNode.previousSibling.firstChild.value=aV.DynamicSearch.historyList[this.$$guid].state.conjunctions[i-1];
			}

			var compareFunction=function(a, b)
			{
				return a.paranthesis-b.paranthesis;
			};
			var liList=this.container.content.formAdvanced.list.getElementsByTagName("LI");
			var doClick=function(index)
			{
				liList[index*2].onclick(
					{
						type: "click",
						target: liList[index * 2],
						stopPropagation: function()
						{
							return true;
						}
					});
			};
			
			var startPos;
			while ((startPos=aV.DynamicSearch.historyList[this.$$guid].state.fields.min(compareFunction))>0)
			{
				doClick(startPos);
				aV.DynamicSearch.historyList[this.$$guid].state.fields[startPos].paranthesis++;
				while (aV.DynamicSearch.historyList[this.$$guid].state.fields[startPos].paranthesis<=0 && startPos>=0)
					startPos--;
				doClick(startPos);
				aV.DynamicSearch.historyList[this.$$guid].state.fields[startPos].paranthesis--;
			}
		}
		if (aV.DynamicSearch.historyList[this.$$guid].state.setName)
			document.getElementById(aV.config.DynamicSearch.idFormats.columnSetBox.format(this.$$guid, aV.DynamicSearch.list[this.$$guid].activeForm.type)).value=aV.DynamicSearch.historyList[this.$$guid].state.setName;

		this.supressEmptyFieldWarning = true;
		aV.DynamicSearch._onFormSubmit({target: this.activeForm});
		this.supressEmptyFieldWarning = false;
	}
};

aV.DynamicSearch.prototype.toggleContextualHelp=function()
{
	if (aV.DOM.hasClass(this.container, aV.config.DynamicSearch.classNames.helpEnabled))
		aV.DOM.removeClass(this.container, aV.config.DynamicSearch.classNames.helpEnabled);
	else
		aV.DOM.addClass(this.container, aV.config.DynamicSearch.classNames.helpEnabled);
}

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
	this.container.aVdSGuid=this.$$guid;

	var newLi;
	var self=this;

	//create the tab switch links' container
	this.container.tabsTitle = this.container.appendChild(document.createElement("UL"));
	this.container.tabsTitle.className=aV.config.DynamicSearch.classNames.tabTitle;

	//create the forms' tabs
	for (var i = 0; i < aV.config.DynamicSearch.formTypes.length; i++) 
	{
		newLi = this.container.tabsTitle.appendChild(document.createElement("LI"));
		newLi.formIndex=i;
		aV.Events.add(newLi, "click", aV.DynamicSearch._tabClickHandler);
		if (aV.config.DynamicSearch.wrapTitles)
		{
			var rightDiv=newLi.appendChild(document.createElement("DIV"));
			rightDiv.className=aV.config.DynamicSearch.classNames.rightDiv;
			newLi=newLi.insertBefore(document.createElement("DIV"), rightDiv);
		}
		newLi.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.forms[i]));
	}
	
	var contextualHelpButton = this.container.tabsTitle.appendChild(document.createElement("DIV"));
	contextualHelpButton.className = aV.config.DynamicSearch.classNames.contextualHelpButton;
	contextualHelpButton.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.contextualHelpButton));
	aV.Events.add(contextualHelpButton, "click", aV.DynamicSearch._contextualHelpClickHandler);

	var generalHelpButton = this.container.tabsTitle.appendChild(document.createElement("DIV"));
	generalHelpButton.className = aV.config.DynamicSearch.classNames.generalHelpButton;
	generalHelpButton.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.generalHelpButton));
	aV.Events.add(generalHelpButton, "click", aV.DynamicSearch._generalHelpClickHandler);

	
	this.container.content = this.container.appendChild(document.createElement("DIV"));
	this.container.content.className = aV.config.DynamicSearch.classNames.content;
	this.container.content.formBasic = this.container.content.formAdvanced = null;
	
	this.container.content.generalHelpBox = this.container.content.appendChild(document.createElement("DIV"));
	this.container.content.generalHelpBox.id = aV.config.DynamicSearch.idFormats.generalHelpBox.format(this.$$guid);
	this.container.content.generalHelpBox.className = aV.config.DynamicSearch.classNames.generalHelpBox;
	var helpList = this.container.content.generalHelpBox.appendChild(document.createElement("UL"));
	var newHelpItem;
	for (var i=0; i<aV.config.DynamicSearch.texts.generalHelpBoxItems.length; i++)
	{
		newHelpItem = document.createElement("LI");
		newHelpItem.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.generalHelpBoxItems[i]));
		helpList.appendChild(newHelpItem);
	}	
	
	//add the tab related objects to the container's content
	this.element.appendChild(this.container);
};

aV.DynamicSearch.prototype._createDBGrid=function(destructive)
{
	if (this.DBGrid)
	{
		if (destructive)
			this.DBGrid.destroy();
		else
			return this.DBGrid;
	}
	
	this.DBGrid=new aV.DBGrid(aV.config.DynamicSearch.paths.results, {}, this.container.content);
	this.DBGrid.aVdSGuid=this.$$guid;
	this.DBGrid.tableElement=null;
	this.DBGrid.printAfterParse=this.DBGrid.parseDataAfterFetch=true;
	var self=this;
	aV.Events.add(this.DBGrid, "fetchend", aV.DynamicSearch._DBGridFormReleaseEvent);
	aV.Events.add(this.DBGrid, "fetcherror", aV.DynamicSearch._DBGridFormReleaseEvent);
	aV.Events.add(this.DBGrid, "parseerror", aV.DynamicSearch._DBGridFormReleaseEvent);
	aV.Events.add(this.DBGrid, "printend", aV.DynamicSearch._DBGridOnPrintEndHandler);
}

/**
 * Assign the default properties and event handlers to a newly created search condition field.
 * @param {Object} element The newly created condition field
 * @param {String} fieldName The associated field's name
 */
aV.DynamicSearch.prototype._initNewCondition=function(element, fieldName)
{
	if (this.properties.fieldList[fieldName].isEnum)
		element.className=aV.config.DynamicSearch.classNames.enumInput;
	else if (this.properties.fieldList[fieldName].isParsable)
		element.className=aV.config.DynamicSearch.classNames.parsableInput;
	else if (this.properties.fieldList[fieldName].noAC)
		element.className=aV.config.DynamicSearch.classNames.noAC;
	else
		element.className=null;
	
	if (!element.addition) 
	{
		element.addition = element.parentNode.insertBefore(document.createElement("SPAN"), element.nextSibling);
		element.addition.className = aV.config.DynamicSearch.classNames.fieldAddition;
	}
	if (this.properties.fieldList[fieldName].addition)
		element.addition.innerHTML = this.properties.fieldList[fieldName].addition;

	if (element.aVautoComplete)
		element.aVautoComplete={};
	element.setAttribute("datatype", "dt_" + this.properties.fieldList[fieldName].dataType);
	aV.Events.clear(element);
	aV.Events.add(element, 'keyup', this.properties.fieldList[fieldName].checkFunction);
	aV.Events.add(element, 'focus', aV.DynamicSearch._fieldOnFocusHandler);
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
	else if (this.container.content.formBasic) 
	{
		if (destructive) 
			this.container.content.removeChild(this.container.content.formBasic);
		else 
			return this.container.content.formBasic;
	}

	this.container.content.formBasic=document.createElement("FORM");
	this.container.content.formBasic.type=0;

	this.container.content.formBasic.className = aV.config.DynamicSearch.classNames.form;
	this.container.content.formBasic.action = 'javascript:void();';
	this.container.content.formBasic.method = "GET";
	
	this.container.content.formBasic.enlargeShrink=function()
	{
		var enlarge=(this.labels.lastChild.firstChild.firstChild.nodeValue==aV.config.DynamicSearch.texts.enlarge);
		var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(this);
		for (var i=this.list.childNodes.length-2; i>=0; i--)
		{
			if (DynamicSearchObject.properties.fieldList[this.list.childNodes[i].firstChild.field.value].hidden)
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

	aV.Events.add(this.container.content.formBasic, 'submit', aV.DynamicSearch._onFormSubmit);
	aV.Events.add(this.container.content.formBasic, 'reset', aV.DynamicSearch.releaseForm);

	this.container.content.formBasic.labels=document.createElement('UL');
	this.container.content.formBasic.list=document.createElement('UL');
	
	var newLi;
	
	this.container.content.formBasic.labels.className=aV.config.DynamicSearch.classNames.labelsUL;
	this.container.content.formBasic.list.className=aV.config.DynamicSearch.classNames.inputsUL;
	var formEnlargable=false;
	
	for (var fieldName in this.properties.fieldList) 
	{
		if (!this.properties.fieldList.hasOwnProperty(fieldName) || this.isFieldHidden(fieldName, 0))
			continue;

		newLi = document.createElement('LI');
		newLi.id=aV.config.DynamicSearch.idFormats.formBasicField.format(this.$$guid, fieldName);
		var condition = newLi.condition = newLi.appendChild(document.createElement("INPUT"));
		newLi.condition.name=aV.config.DynamicSearch.idFormats.formBasicInput.format(this.$$guid, fieldName);
		newLi.condition.type = "TEXT";
		newLi.condition.id = newLi.condition.name;
		newLi.condition.operator = 
		{
			value: (('dt_' + this.properties.fieldList[fieldName].dataType) in aV.config.DynamicSearch.operators) ? aV.config.DynamicSearch.operators.defaults['dt_' + this.properties.fieldList[fieldName].dataType] : aV.config.DynamicSearch.operators.defaults.dt_default
		};
		newLi.condition.field = 
		{
			value: fieldName
		};
		
		this._initNewCondition(newLi.condition, fieldName);
		var helpDiv=newLi.appendChild(document.createElement("DIV"));
		helpDiv.className=aV.config.DynamicSearch.classNames.help;
//		helpDiv.appendChild(document.createTextNode(this.properties.fieldList[fieldName].helpText || aV.config.DynamicSearch.texts.defaultHelpText));
		helpDiv.innerHTML=this.properties.fieldList[fieldName].helpText || aV.config.DynamicSearch.texts.defaultHelpText;

		this.container.content.formBasic.list.appendChild(newLi);
		
		newLi = document.createElement('LI');
		newLi.id=aV.config.DynamicSearch.idFormats.formBasicLabel.format(this.$$guid, fieldName);
		with (newLi.appendChild(document.createElement("LABEL"))) 
		{
			setAttribute("for", condition.name);
			appendChild(document.createTextNode(this.properties.fieldList[fieldName].alias));
		}
		this.container.content.formBasic.labels.appendChild(newLi);
		
		if (this.properties.fieldList[fieldName].hidden) 
		{
			this.container.content.formBasic.list.lastChild.style.display = 'none';
			this.container.content.formBasic.labels.lastChild.style.display = 'none';
			aV.Visual.setOpacity(this.container.content.formBasic.list.lastChild, 0);
			aV.Visual.setOpacity(this.container.content.formBasic.labels.lastChild, 0);
			formEnlargable=true;
		}
	}
	
	if (formEnlargable)
	{
		newLi = document.createElement("li");
		var newLink=newLi.appendChild(document.createElement("a"));
		newLink.href="javascript:void(0)";
		var self=this;
		newLink.onclick=function(){self.container.content.formBasic.enlargeShrink();return false;};
		newLink.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.enlarge));
		this.container.content.formBasic.labels.appendChild(newLi);
	}
	
	this.addFormButtons(0);
	this.container.content.formBasic.appendChild(this.container.content.formBasic.labels);
	this.container.content.formBasic.appendChild(this.container.content.formBasic.list);
	this.container.content.insertBefore(this.container.content.formBasic, this.container.content.formAdvanced);
};

aV.DynamicSearch.prototype._createAdvancedForm = function(destructive)
{
	if (!this.container) 
		this._createContainer();
	else if (this.container.content.formAdvanced)
	{
		if (destructive) 
			this.container.content.removeChild(this.container.content.formAdvanced);
		else 
			return this.container.content.formAdvanced;
	}
	
	this.container.content.formAdvanced=document.createElement("FORM");
	this.container.content.formAdvanced.type=1;
	this.container.content.formAdvanced.className = aV.config.DynamicSearch.classNames.form;
	this.container.content.formAdvanced.action = 'javascript:void(0);';
	this.container.content.formAdvanced.method = "GET";
	this.container.content.formAdvanced.list = this.container.content.formAdvanced.appendChild(document.createElement("UL"));
	this.container.content.formAdvanced.list.className = aV.config.DynamicSearch.classNames.conditions;
	
	aV.Events.add(this.container.content.formAdvanced, 'submit', aV.DynamicSearch._onFormSubmit);
	aV.Events.add(this.container.content.formAdvanced, 'reset', aV.DynamicSearch.releaseForm);
	
	this.addFormButtons(1);
	
	var self=this;

	this.container.content.formAdvanced.addButton = document.createElement("A");
	this.container.content.formAdvanced.addButton.href="javascript:void(0);";
	this.container.content.formAdvanced.addButton.className=aV.config.DynamicSearch.classNames.addCondition;
	this.container.content.formAdvanced.addButton.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.addCondition));
	aV.Events.add(this.container.content.formAdvanced.addButton, "click", aV.DynamicSearch._addRemoveButtonClickHandler);

	this.container.content.formAdvanced.removeButton = document.createElement("A");
	this.container.content.formAdvanced.removeButton.href="javascript:void(0);";
	this.container.content.formAdvanced.removeButton.className=aV.config.DynamicSearch.classNames.removeCondition;
	this.container.content.formAdvanced.removeButton.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.removeCondition));
	aV.Events.add(this.container.content.formAdvanced.removeButton, "click", aV.DynamicSearch._addRemoveButtonClickHandler);
	
	this.container.content.formAdvanced.groupButton = document.createElement("DIV");
	this.container.content.formAdvanced.groupButton.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.group));
	this.container.content.formAdvanced.groupButton.className=aV.config.DynamicSearch.classNames.groupButton;
	aV.Events.add(this.container.content.formAdvanced.groupButton, 'click', aV.DynamicSearch._onConditionClick);
	
	this.container.content.formAdvanced.ungroupButton = document.createElement("DIV");
	this.container.content.formAdvanced.ungroupButton.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.ungroup));
	this.container.content.formAdvanced.ungroupButton.className = aV.config.DynamicSearch.classNames.ungroupButton;
	aV.Events.add(this.container.content.formAdvanced.ungroupButton, 'click', aV.DynamicSearch._onConditionDblClick);
	
	this.container.content.insertBefore(this.container.content.formAdvanced, this.DBGrid.tableElement);
	this.addCondition();
	aV.DynamicSearch._onConditionMouseOver({target: this.container.content.formAdvanced.list.firstChild});
};

aV.DynamicSearch.prototype.addCondition=function(afterElement)
{
	var parentElement;
	
	var defaultField;
	if (afterElement && afterElement.condition && afterElement.condition.field)
		defaultField=afterElement.condition.field.value;

	if (!afterElement) 
	{
		afterElement = this.container.content.formAdvanced.list.lastChild;
		parentElement = this.container.content.formAdvanced.list;
	}
	else 
	{
		parentElement = afterElement.parentNode;
		afterElement = afterElement.nextSibling;
	}

	var liList=this.container.content.formAdvanced.list.getElementsByTagName("LI");
	if (liList.length>1)
	{
		var newLi = document.createElement("LI");
		newLi.className = aV.config.DynamicSearch.classNames.conjunction;
		newLi.conjunction = newLi.appendChild(document.createElement("SELECT"));
		for (var name in aV.config.DynamicSearch.conjunctions) 
		{
			if (aV.config.DynamicSearch.conjunctions.hasOwnProperty(name))
				newLi.conjunction.add(new Option(aV.config.DynamicSearch.conjunctions[name], name), undefined);
		}
		newLi.conjunction.value=newLi.conjunction.options[0].value;
		parentElement.insertBefore(newLi, afterElement);
	}

	var newLi=document.createElement("LI");
	var fieldSelector=newLi.appendChild(document.createElement("SELECT"));
	for (var fieldName in this.properties.fieldList)
		if (this.properties.fieldList.hasOwnProperty(fieldName) && !this.isFieldHidden(fieldName, 1))
			fieldSelector.add(new Option(this.properties.fieldList[fieldName].alias, fieldName), undefined);
	
	aV.Events.add(fieldSelector, 'change', aV.DynamicSearch._onFieldSelect);
	var operatorSelector=newLi.appendChild(document.createElement("SELECT"));
	newLi.condition=newLi.appendChild(document.createElement("INPUT"));
	newLi.condition.name=aV.config.DynamicSearch.idFormats.formAdvancedInput.format(this.$$guid, liList.length); //might not be unique, TODO: CHECK!
	newLi.condition.type='TEXT';
	newLi.condition.id=newLi.condition.name;
	newLi.condition.field=fieldSelector;
	newLi.condition.operator=operatorSelector;
	fieldSelector.condition=newLi.condition;
	operatorSelector.condition=newLi.condition;
	
	parentElement.insertBefore(newLi, afterElement);
	aV.Events.add(newLi, 'click', aV.DynamicSearch._onConditionClick);
	aV.Events.add(newLi, 'dblclick', aV.DynamicSearch._onConditionDblClick);
	aV.Events.add(newLi, 'mouseover', aV.DynamicSearch._onConditionMouseOver);
	fieldSelector.value=(defaultField)?defaultField:fieldSelector.options[0].value;
	aV.DynamicSearch._onFieldSelect({target: fieldSelector});
	
	return newLi.condition;
};

aV.DynamicSearch.prototype.removeCondition = function(condition)
{
	var liList=this.container.content.formAdvanced.list.getElementsByTagName("LI");

	if (!condition)
		condition=liList[liList.length-2];

	if (liList.length > 2 && condition!=liList[0]) 
	{
		var conjunction=condition.previousSibling;
		while (!conjunction || conjunction.className != aV.config.DynamicSearch.classNames.conjunction || condition.parentNode.getElementsByTagName("LI").length<4) 
		{
			aV.DynamicSearch._ungroupCondition(condition);
			conjunction=condition.previousSibling;
		}
		condition.parentNode.removeChild(condition);
		conjunction.parentNode.removeChild(conjunction);
		return true;
	}
	else if (!this.supressRemoveWarning)
		aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.removeConditionError, aV.config.Visual.infoBox.images.info);
	return false;
};

aV.DynamicSearch.prototype.addFormButtons=function(formType)
{
	var form=this.container.content['form' + aV.config.DynamicSearch.formTypes[formType]];
	var newButton, newLabel, newSelectBox;
	var newItem=document.createElement('LI');
	newItem.className=aV.config.DynamicSearch.classNames.controlButtons;

	newButton=document.createElement("INPUT");
	newButton.type='RESET';
	newButton.value=aV.config.DynamicSearch.texts.reset;
	newItem.appendChild(newButton);
	form.resetButton=newButton;

	newButton=document.createElement("INPUT");
	newButton.type='SUBMIT';
	newButton.value=aV.config.DynamicSearch.texts.submit;
	newItem.appendChild(newButton);
	form.submitButton=newButton;

	for (var operation in this.properties.externalOperations)
	{
		if (!this.properties.externalOperations.hasOwnProperty(operation))
			continue;
	
		newButton=document.createElement("INPUT");
		newButton.type='BUTTON';
		newButton.name=operation;
		newButton.value=this.properties.externalOperations[operation].alias;
		newButton.onclick=function(){this.form.onsubmit({type: 'submit', target: this})};
		newItem.appendChild(newButton);
	}
	
	newSelectBox=document.createElement("SELECT");
	newSelectBox.id=aV.config.DynamicSearch.idFormats.columnSetBox.format(this.$$guid, formType);
	for (var columnSetName in this.properties.columnSets)
	{
		if (!this.properties.columnSets.hasOwnProperty(columnSetName))
			continue;
		
		newSelectBox.add(new Option(columnSetName, columnSetName), undefined);
	}
	newItem.appendChild(newSelectBox);
	
	newLabel=document.createElement("LABEL");
	newLabel.appendChild(document.createTextNode(aV.config.DynamicSearch.texts.columnSet));
	newLabel.setAttribute('for', newSelectBox.id);
	newItem.appendChild(newLabel);

	form.list.appendChild(newItem);
};

aV.DynamicSearch._tabClickHandler=function(event)
{
	var li=("formIndex" in event.target)?event.target:event.target.parentNode;
	aV.DynamicSearch.getOwnerObject(event.target).setActiveForm(li.formIndex);
};

aV.DynamicSearch._DBGridFormReleaseEvent=function(event)
{
	var ownerObject=aV.DynamicSearch.list[event.target.aVdSGuid];
	aV.DynamicSearch.releaseForm(ownerObject.activeForm);
};

aV.DynamicSearch._DBGridOnPrintEndHandler=function(event)
{
	var ownerObject=aV.DynamicSearch.list[event.target.aVdSGuid];
	try
	{
		if (ownerObject.properties.redirectLink && event.target.properties.row.length == 1) 
		{
			var linkElementCell=event.target.tableElement.tBodies[0].rows[0].cells[event.target.properties.columns[ownerObject.properties.redirectLink].index];
			if (linkElementCell)
				document.location=linkElementCell.getElementsByTagName('a')[0].href;
		}
	}
	catch(error)
	{
		if (window.onerror)
			window.onerror(error.message, error.fileName, error.lineNumber);
	}
};

aV.DynamicSearch._addRemoveButtonClickHandler=function(event)
{
	aV.DynamicSearch.getOwnerObject(event.target)[((event.target.className==aV.config.DynamicSearch.classNames.addCondition)?'add':'remove') + "Condition"](event.target.parentNode);
	event.target.href=document.location;
	return false;
};

aV.DynamicSearch._onFieldSelect=function(event)
{
	event.target.condition.value='';
	var operatorSelector=event.target.condition.operator;
	var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(event.target);
	while (operatorSelector.options.length)
		operatorSelector.remove(operatorSelector.options[0]);
	var operatorList=aV.config.DynamicSearch.operators['dt_' + DynamicSearchObject.properties.fieldList[event.target.value].dataType] || aV.config.DynamicSearch.operators.dt_default;
	for (var name in operatorList)
	{
		if (operatorList.hasOwnProperty(name))
			operatorSelector.add(new Option(operatorList[name], name), undefined);
	}

	DynamicSearchObject._initNewCondition(event.target.condition, event.target.value);
	aV.AutoComplete.init();
	if (event.target.condition.aVautoComplete)
		event.target.condition.aVautoComplete.list=null;
};

aV.DynamicSearch._onConditionClick=function(event)
{
	if (event.target.tagName!="LI" && event.target.tagName!="DIV")
		return;
	var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(event.target);
	var currentElement;
	if (DynamicSearchObject.groupSE)
	{
		currentElement=DynamicSearchObject.groupSE;
		aV.Visual.setOpacity(currentElement, 1);
		delete DynamicSearchObject.groupSE;
		
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
		DynamicSearchObject.groupSE=currentElement;
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
	if (event.target.tagName!="LI")
		return;

	var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(event.target);
	event.target.appendChild(DynamicSearchObject.container.content.formAdvanced.addButton);
	event.target.appendChild(DynamicSearchObject.container.content.formAdvanced.removeButton);
	
	var topLevel=aV.DynamicSearch._getTopLevel(event.target);
	topLevel.appendChild(DynamicSearchObject.container.content.formAdvanced.groupButton);
	if (topLevel != event.target)
	{
		topLevel.insertBefore(DynamicSearchObject.container.content.formAdvanced.ungroupButton, topLevel.firstChild);
		DynamicSearchObject.container.content.formAdvanced.ungroupButton.style.display='';
	}
	else
	{
		DynamicSearchObject.container.content.formAdvanced.ungroupButton.style.display='none';
		if (DynamicSearchObject.container.content.formAdvanced.ungroupButton.parentNode)
			DynamicSearchObject.container.content.formAdvanced.ungroupButton.parentNode.removeChild(DynamicSearchObject.container.content.formAdvanced.ungroupButton);
	}
};

aV.DynamicSearch._ungroupCondition=function(element, removeAll)
{
	var groupContainer=aV.DynamicSearch._getTopLevel(element);
	if (groupContainer.firstChild.className==aV.config.DynamicSearch.classNames.ungroupButton)
		groupContainer.removeChild(groupContainer.firstChild);
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

aV.DynamicSearch.releaseForm=function(form)
{
	if (!form.elements)
		form=form.target;
	if (!form.elements) //to avoid Firefox 2.x behavior(gives the button as the target, not the form)
		form=form.form;

	for (var i = 0; i < form.elements.length; i++) 
		form.elements[i].disabled=false;//form.elements[i].oldDisabled;
};

aV.DynamicSearch._onFormSubmit=function(event)
{
	var form=event.target;
	/*
	 * Firefox < 2.0.0.15 fix [START]
	 * event.target is not the form itself but the input box where the user presses ENTER key.
	 */
	if (form.form)
		form=form.form;
	/* Firefox < 2.0.0.15 fix [END] */

	var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(event.target);
	var params=
	{
		search:
		{
			name: DynamicSearchObject.name,
			fields: [],
			conjunctions: []
		}
	};
	
	if (form==DynamicSearchObject.container.content.formAdvanced && form.addButton.parentNode)
	{
		form.addButton.parentNode.removeChild(form.addButton);
		form.removeButton.parentNode.removeChild(form.removeButton);
		form.groupButton.parentNode.removeChild(form.groupButton);
		if (form.ungroupButton.parentNode)
			form.ungroupButton.parentNode.removeChild(form.ungroupButton);
	}
	
	function buildParameters(element, pCount)
	{
		while (
			element &&
			(element.tagName=='LI' || element.tagName=="DIV") && 
			(
				element.className!=aV.config.DynamicSearch.classNames.controlButtons &&
				element.className!=aV.config.DynamicSearch.classNames.help
			)
		)			 
		{
			if (element.tagName != 'LI') 
			{
				if (!buildParameters(element.firstChild, pCount + 1)) 
					return false;
				params.search.fields[params.search.fields.length - 1].paranthesis--;
			}
			else 
			{
				if (element.className == aV.config.DynamicSearch.classNames.conjunction) 
					params.search.conjunctions.push(element.conjunction.value);
				else 
				{
					if (!DynamicSearchObject.properties.fieldList[element.condition.field.value].checkFunction(element.condition) || (element.condition.value == '' && form == DynamicSearchObject.container.content.formAdvanced)) 
					{
						if (element.condition.value != '')
							aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.invalidConditionValue, aV.config.Visual.infoBox.images.error);
						else if (!DynamicSearchObject.supressEmptyFieldWarning && form == DynamicSearchObject.container.content.formAdvanced)
							aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.emptyFieldinAdvanced, aV.config.Visual.infoBox.images.warning);
						aV.DynamicSearch.releaseForm(form);
						return false;
					}
					
					if (element.condition.value != '') 
					{
						params.search.fields.push(
						{
							name: element.condition.field.value,
							value: element.condition.value,
							operator: element.condition.operator.value,
							paranthesis: pCount
						});
						//inputElement.oldDisabled = element.condition.disabled;
						element.condition.disabled = true;
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
		params.search.setName=document.getElementById(aV.config.DynamicSearch.idFormats.columnSetBox.format(DynamicSearchObject.$$guid, form.type)).value;//set the column set
		if (DynamicSearchObject.properties.externalOperations && (event.target.name in DynamicSearchObject.properties.externalOperations) && (DynamicSearchObject.properties.externalOperations.hasOwnProperty(event.target.name))) 
			document.location=DynamicSearchObject.properties.externalOperations[event.target.name].address + params.toQueryString();
		else
		{
			var refreshColumns=(!aV.DynamicSearch.historyList[DynamicSearchObject.$$guid].state || aV.DynamicSearch.historyList[DynamicSearchObject.$$guid].state.setName!=params.search.setName);
			if (event.type)
			{
				aV.DynamicSearch.historyList[DynamicSearchObject.$$guid].state = params.search;
				aV.DynamicSearch.updateHistory();
			}
			if (!refreshColumns && DynamicSearchObject.DBGrid.parameters && DynamicSearchObject.DBGrid.parameters.columns)
				params.columns=DynamicSearchObject.DBGrid.parameters.columns;
			DynamicSearchObject.DBGrid.parameters = params;
			DynamicSearchObject.DBGrid.refreshData(refreshColumns, !refreshColumns);
			form.submitButton.disabled=true;
		}
	}
	else if (!DynamicSearchObject.supressEmptyFieldWarning && form != DynamicSearchObject.container.content.formAdvanced)
		aV.Visual.infoBox.show(aV.config.DynamicSearch.texts.noCriteria, aV.config.Visual.infoBox.images.error);

	return false;
};

aV.DynamicSearch.updateHistory=function(ignoreUpdate)
{
	if (!aV.config.DynamicSearch.history.active)
		return false;
	var newHistory=aV.History._get.clone();
	var result=1;
	if (!(aV.config.DynamicSearch.history.key in newHistory))
		result=-1;
	newHistory[aV.config.DynamicSearch.history.key]=aV.DynamicSearch.historyList;
	if (ignoreUpdate!==false)
		aV.DynamicSearch._ignoreNextHistoryEvent=true;

	aV.History.set(newHistory);
	return result;
};

aV.DynamicSearch._historyOnChangeHandler=function(event)
{
	if (!aV.config.DynamicSearch.history.active || !aV.History._get[aV.config.DynamicSearch.history.key])
		return;
	if (aV.DynamicSearch._ignoreNextHistoryEvent)
	{
		aV.DynamicSearch._ignoreNextHistoryEvent=false;
		return;
	}

	var matcher=new RegExp("^" + aV.config.DynamicSearch.history.key, "");
	if (!event.changedKeys.reduce(function(a,b){if (!a) a=matcher.test(b); return a;}))
		return;
	
	aV.DynamicSearch.historyList=aV.History._get[aV.config.DynamicSearch.history.key].clone();

	for (var guid in aV.DynamicSearch.historyList)
	{
		if (!aV.DynamicSearch.historyList.hasOwnProperty(guid))
			continue;

		if (!(guid in aV.DynamicSearch.list))
			new aV.DynamicSearch(aV.DynamicSearch.historyList[guid].name, aV.DynamicSearch.historyList[guid].element, guid);
		else	if (aV.DynamicSearch.list[guid].name!=aV.DynamicSearch.historyList[guid].name)
		{
			aV.DynamicSearch.list[guid].name=aV.DynamicSearch.historyList[guid].name;
			aV.DynamicSearch.list[guid]._initialize();
		}
		else
			aV.DynamicSearch.list[guid].setActiveForm(aV.DynamicSearch.historyList[guid].form);
	}
};

aV.DynamicSearch._autoCompleteSelectItemHandler=function(event)
{
	if (event.target.form == aV.DynamicSearch.getOwnerObject(event.target).container.content.formAdvanced && event.target.operator.value=='LIKE')
		event.target.operator.value='=';
};

aV.DynamicSearch._autoCompleteShowListboxHandler=function(event)
{
	if (event.target.operator.value=='=')
		event.target.operator.value='LIKE';
};

aV.DynamicSearch._fieldOnFocusHandler=function(event)
{
	event.target.select();
};

aV.DynamicSearch.getOwnerObject=function(element)
{
	while (element && element!=document.body && !element.aVdSGuid)
		element=element.parentNode;
	return aV.DynamicSearch.list[element.aVdSGuid];
};

aV.DynamicSearch._contextualHelpClickHandler=function(event)
{
	var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(event.target);
	DynamicSearchObject.toggleContextualHelp();
};

aV.DynamicSearch._generalHelpClickHandler=function(event)
{
	var DynamicSearchObject=aV.DynamicSearch.getOwnerObject(event.target);
	aV.Visual.slideToggle(DynamicSearchObject.container.content.generalHelpBox, 0, 10);
};

aV.DynamicSearch.$$lastGuid=1;

if (!aV.config.DynamicSearch)
	aV.config.DynamicSearch={};

aV.config.DynamicSearch.unite(
	{
		idFormats:
		{
			formBasicField: 'aVdS_formBasic-%0:s-field-%1:s',
			formBasicInput: 'aVdS_input-basic-%0:s-%1:s',
			formBasicLabel: 'aVdS_formBasic-%0:s-%1:s',
			formAdvancedInput: 'aVdS_input-advanced-%0:s-%1:s',
			columnSetBox: 'aVdS_columnSetBox-%0:s-%1:s',
			generalHelpBox: 'aVdS_generalHelpBox-%0:s'
		},
		classNames:
		{	
			error: 'aVdS_error',
			container: 'aVdS_container',
			content: 'aVdS_content',
			tabTitle: 'aVdS_tabTitle',
			acitveTabTitle: 'aVdS_activeTabTitle',
			form: 'aVdS_form',
			controlButtons: 'aVdS_controlButtons',
			labelsUL: 'aVdS_labels',
			inputsUL: 'aVdS_inputs',
			enumInput: 'aVdS_enum',
			parsableInput: 'aVdS_parsable',
			loadIndicator: 'aVdS_loading',
			conditions: 'aVdS_conditions',
			addCondition: 'aVdS_addCondition',
			removeCondition: 'aVdS_removeCondition',
			groupButton: 'aVdS_groupButton',
			ungroupButton: 'aVdS_ungroupButton',
			groupContainer: 'aVdS_groupContainer',
			conjunction: 'aVdS_conjunction',
			noAC: 'aVdS_noAC',
			help: 'aVdS_help',
			helpEnabled: 'aVdS_helpEnabled',
			contextualHelpButton: 'aVdS_contextualHelpButton',
			generalHelpBox: 'aVdS_generalHelpBox',
			generalHelpButton: 'aVdS_generalHelpButton',
			fieldAddition: 'aVdS_fieldAddition'
		},
		paths:
		{
			results: '/search/_search.php',
			fields: '/search/_search_info.php',
			css: ['/JSLib/css/aV.module.dynamicSearch.css']
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
			forms: ['Detailed', 'Flexible'],
			loading: 'Loading...',
			addCondition: 'Add',
			removeCondition: 'Remove',
			group: 'Click to group',
			ungroup: 'Ungroup',
			enlarge: 'More search fields',
			shrink: 'Less search fields',
			removeConditionError: 'You cannot remove this item.',
			invalidConditionValue: 'You have invalid data in one or more fields.',
			emptyFieldinAdvanced: 'You have one or more empty fields. Remove or fill them to perform the search.',
			noCriteria: 'You did not define any search criteria.',
			columnSet: 'Result Set: ',
			contextualHelpButton: 'Content Help',
			generalHelpButton: 'General Help',
			defaultHelpText: '(No help text available)',
			responseNotValid: 'Cannot build search interface since the server response is invalid.',
			generalHelpBoxItems:
			[
				'You can enter multiple values in enumerated fields(boxes having an arrow on right) by separating them with a comma(,).',
				'The expected date format for date required fields is: YYYY or YYYY-MM or YYYY-MM-DD',
				'You can decide how much detail you would like to have in the resulting XML Table by selecting one of the options from the drop down menu provided for Result Set field.',
				'Many of the boxes are equipped with an auto-fill mechanism that brings up the available options in the selected category as a keyword is typed in the space.',
				'Please use flexible search for numerical values, since they are more suitable for searching with operators like >, <, =, and combinations of those.'
			]
		},
		formTypes: ["Basic", "Advanced"],
		operators:
		{
			dt_default:
			{
				'LIKE': 'contains',
				'NOT LIKE': 'does not contain',
				'=': 'is exactly equal to',
				'<>': 'is not equal to'
			},
			dt_integer:
			{
				'=': '=',
				'<=': '<=',
				'<': '<',
				'>=': '>=',
				'>': '>',
				'<>': 'not ='
			},
			dt_real:
			{
				'=': '=',
				'<=': '<=',
				'<': '<',
				'>=': '>=',
				'>': '>',
				'<>': 'not ='
			},
			dt_date:
			{
				'=': 'is equal to',
				'<=': 'is before than or equal to',
				'<': 'is before than',
				'>=': 'is after than or equal to',
				'>': 'is after than',
				'<>': 'is not equal to'
			},
			defaults:
			{
				dt_default: 'LIKE',
				dt_integer: '=',
				dt_real: '=',
				dt_date: '='
			}
		},
		conjunctions:
		{
			'AND': 'and',
			'OR': 'or'
		},
		checkFunctions:
		{
			dt_default: function(element)
			{
				var keyCode=element.which || element.keyCode;
				element=element.target || element.srcElement || element;
				if (element.operator.value == '=' && keyCode!=undefined && keyCode != 13) 
					element.operator.selectedIndex = 0;
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
				var keyCode=element.which || element.keyCode;
				element=element.target || element.srcElement || element;
				var isValid=(element.value=='') || element.value.match(/^(\d{4})($|-\d{2}($|-\d{2}($|( \d{2}:\d{2}($|:\d{2}$)))))/);
				element.className=(isValid)?'':aV.config.DynamicSearch.classNames.error;
				var addendum='';
				if (isValid && !keyCode)
				{
					for (var i = 2; i < 4; i++) 
					{
						if (isValid[i]) 
						{
							addendum = isValid[i];
							break;
						}
						else 
							addendum += '-00';
					}
					if (addendum && isValid[1])
						element.value=isValid[1] + addendum;
					for (var i=4; i<6; i++)
						if (isValid[i])
							element.value+=isValid[i];
				}
				return isValid;
			}
		}
	}
, false);

aV.DynamicSearch.list={};
aV.DynamicSearch.historyList={};
aV.Events.add(aV.History, "change", aV.DynamicSearch._historyOnChangeHandler);
for (var i=0; i<aV.config.DynamicSearch.paths.css.length; i++)
	aV.AJAX.loadResource(aV.config.DynamicSearch.paths.css[i], "css", "aVdynamicSearchCSS" + i);