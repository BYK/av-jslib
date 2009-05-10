/**
 * @fileOverview Introduces the aV.DBGrid class which fetches and parses XML data
 * and creates a table from the data collected.
 * The generated tables have native sort, filter and grouping support.
 * @name aV.DBGrid
 *
 * @author Burak Yiğit KAYA <byk@amplio-vita.net>
 * @version 2.1
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (!aV.config.DBGrid)
	aV.config.DBGrid={};

aV.config.DBGrid.unite(
	{
		maxSortAccumulation: 4,
		resizeLockOffset: 10,
		minColWidth: 20, //should be >= 2*resizeLockOffset
		maxBodyHeight: 400,
		minCharsToFilter: 2,
		maxCharsInColumnList: 25,
		keyupTimeout: 200, //in milliseconds
		maxRowsInPage: 50,
		infoBoxTimeout: 180000, //in milliseconds
		exportTypeId: 'export',
		paths:
		{
			css: ['/JSLib/css/aV.module.DBGrid-css.php']
		},
		texts:
		{
			title: '%0:s - %1:s records',
			defaultTitle: 'Untitled Table',
			footerRowCount: '%0:s..%1:s of %3:s row(s)',
			statusMessages:
			{
				fetcherror: 'An error occured while gathering the table data.<br />(%0:s) - %1:s',
				parseerror: 'Table cannot be generated because the gathered table data is invalid.',
				fetchbegin: 'Gathering data...',
				printbegin: 'Creating table...',
				sortbegin: 'Sorting table...',
				groupbegin: 'Groping rows...',
				ungroupbegin: 'Ungrouping rows...',
				printend: 'Table is ready to use.'
			},
			buttonColumnList: 'Column Manager',
			buttonColumnListHint: 'You can set the visibility of the table columns from here',
			buttonGroupAll: 'Group all',
			buttonGroupAllHint: 'You can group all the rows <b>by the sorted column</b> which means you <u>should</u> sort the table first.<br />You can also group individual rows by double clicking on them.',
			buttonUngroupAll: 'Ungroup all',
			buttonUngroupAllHint: 'You can ungroup all the grouped rows by using this button.<br />You can also ungroup individual row groups by double clicking on them.',
			buttonFilter: 'Filter',
			buttonFilterHint: 'You can filter the rows using the filter boxes above the columns. You may use "!" as the "not" operator. You may also use numerical comparators such as "<", ">" in numerical fields. Filters are cumulative.',
			maxRowsInPage: 'Max. rows in page: ',
			totalPages: ' / %s',
			previousPage: ' ',
			nextPage: ' ',
			newCellText: '(empty cell)',
			emptyCellText: 'Loading...'
		},
		classNames:
		{
			general: 'aVDBGrid',
			columnList: 'aVDBGridColumnList',
			dummyColumn: 'dummyColumn',
			sortedAsc: 'sortedAsc',
			sortedDesc: 'sortedDesc',
			buttonColumnList: 'buttonColumnList',
			buttonGroupAll: 'buttonGroupAll',
			buttonUngroupAll: 'buttonUngroupAll',
			buttonFilter: 'buttonFilter',
			buttonExport: 'buttonExport %0:s_file',
			captionTitle: 'title',
			filterRow: 'filterRow',
			slider: 'slider',
			pageControls: 'pageControls',
			maxRowsInPageInput: 'maxRowsInPage',
			pageInput: 'page',
			previousPage: 'previousPage',
			nextPage: 'nextPage',
			groupedRow: 'groupedRow',
			statusArea: 'statusArea'
		},
		idFormats:
		{
			columnList: 'aVDBGrid%s-columnList',
			columnControl: 'aV.DBGrid%0:s-column-%1:s-controler'
		},
		defaultEventHandler: function(event)
		{
			if (event.status == 'error' && window.onerror) 
				window.onerror(event.messages, event.target.getFullSourceURL(), 0);
			if (event.status && aV.config.DBGrid.texts.statusMessages[event.type])
				event.target.updateStatus(aV.config.DBGrid.texts.statusMessages[event.type].format(event.messages), event.status, event.forceInfoBox);
		},
		filterFunctions:
		{
			dt_default: function(value, filterStr, column)
			{
				if (!column.parsedFilter)
				{
					var expression = (filterStr.charAt(0) == '*');
					
					if (expression || (filterStr.charAt(0) == ' ')) 
						filterStr = filterStr.substr(1);
					
					column.parsedFilter = new RegExp((expression) ? filterStr : filterStr.escapeRegExp(), "i");
				}		
				return !value.match(column.parsedFilter);
			},	
			dt_int: function(value, filterStr, column)
			{
				if (!column.parsedFilter) 
				{
					column.parsedFilter=filterStr;
					if (!isNaN(column.parsedFilter)) 
						column.parsedFilter = '==' + column.parsedFilter;
					else if (column.parsedFilter.charAt(0) == '=' && !isNaN(column.parsedFilter.substr(1))) 
						column.parsedFilter = '=' + column.parsedFilter;
				}
		
				if (column.parsedFilter.match(/^([><]+=*|==)\d+\.?\d*$/))
					return !eval('(' + value + column.parsedFilter + ')');
				else
					return false;
			},
			dt_real: function(value, filterStr, column)
			{
				if (!column.parsedFilter) 
				{
					column.parsedFilter=filterStr;
					if (!isNaN(column.parsedFilter)) 
						column.parsedFilter = '==' + column.parsedFilter;
					else if (column.parsedFilter.charAt(0) == '=' && !isNaN(column.parsedFilter.substr(1))) 
						column.parsedFilter = '=' + column.parsedFilter;
				}
		
				if (column.parsedFilter.match(/^([><]+=*|==)\d+\.?\d*$/))
					return !eval('(' + value + column.parsedFilter + ')');
				else
					return false;
			}
		},
		compareFunctions:
		{
			dt_default: function(a, b)
			{
				a=a.toLowerCase();
				b=b.toLowerCase();
				if (a<b)
					return -1;
				else if (a>b)
					return 1;
				else
					return 0;
			},
			dt_int: function(a, b)
			{
				a=parseInt(a);
				b=parseInt(b);
				return ((a - b) || (isNaN(a)?-1:1));
			},
			dt_real: function(a, b)
			{
				a=parseFloat(a);
				b=parseFloat(b);
				return ((a - b) || (isNaN(a)?-1:1));
			}
		}
	}
, false);

/**
 * @classDescription A dynamically filled DBGrid class
 * @constructor
 * @requires {@link String} (aV.ext.string.js)
 * @requires {@link Object} (aV.ext.object.js)
 * @requires {@link aV.Events} (aV.main.events.js)
 * @requires {@link aV.AJAX} (aV.main.ajax.js)
 * @requires {@link aV.Visual} (aV.main.visual.js)
 * @requires {@link aV.Visual.customHint} (aV.plg.customHint.js)
 * @requires {@link aV.Visual.infoBox} (aV.plg.infoBox.js)
 * 
 * @param	 {String} sourceURL The address to the data XML
 * @param {String | Object} parameters Parameters for the POST call to the *sourceURL*
 * @param {HTMLObject} printElement The HTML container element where the created table will be placed
 * @param {Boolean} fetch Set true to fetch immediately when the object is created
 * @param {Boolean} print Set true to print the table immediately after the data is fetched.
 */
aV.DBGrid=function(sourceURL, parameters, printElement, fetch, print)
{
	/**
	 * Holds the unique identifier and index of the DBGrid object.
	 * @type	{integer}
	 */
	this.guid=aV.DBGrid._lastGuid++;
	
	aV.DBGrid.list[this.guid]=this;
	
	/**
	 * Holds the address of the XML table data.
	 * @type {String}
	 */
	this.sourceURL=sourceURL;
	
	/**
	 * Holds the POST parameters for the data source page whoese
	 * address is given in the sourceURL property.
	 * @type {String|Object}
	 */
	this.parameters=(parameters)?parameters:{};
	
	this.printElement=printElement;
	this.printAfterParse=print;
	
	if (fetch)
		this.refreshData();
};

/**
 * The guid counter for Window.DBGrids array, do not touch.
 *
 * @private
 */
aV.DBGrid._lastGuid=1;

aV.DBGrid._activeResizer=false;

aV.DBGrid.list={};

/**
 * Removes and destroys all the DBGrids on a page
 *
 * @static
 * @method
 */
aV.DBGrid.clearAll=function()
{
	for (var guid in aV.DBGrid.list)
		if (aV.DBGrid.list.hasOwnProperty(guid))
			aV.DBGrid.list[guid].destroy();
};

aV.DBGrid.getOwnerObject=function(element)
{
	while (element && !(element.guid && (element.tagName=='TABLE' && aV.DOM.hasClass(element, aV.config.DBGrid.classNames.general)) || (element.tagName=='UL' && aV.DOM.hasClass(element, aV.config.DBGrid.classNames.columnList))))
		element=element.parentNode;
	if (element)
		return aV.DBGrid.list[element.guid];

	return undefined;
};

aV.DBGrid._toggleMenu=function(guid, menuIdentifier, alignElement, offset)
{
	var margin=8;
	var tableElement=aV.DBGrid.list[guid].tableElement;
	var subElement=document.getElementById(aV.config.DBGrid.idFormats[menuIdentifier].format(guid));
	if (offset===undefined)
		offset={x: 0, y: 0};
	else if (typeof offset=="number")
		offset={x: offset, y: offset};
	if (subElement.offsetHeight <= margin) 
	{
		subElement.style.left = (aV.DOM.getElementCoordinates(alignElement.x).x + offset.x) + "px";
		var topCoordinate = aV.DOM.getElementCoordinates(alignElement.y).y + offset.y;
		subElement.style.top = topCoordinate + "px";
		var possibleHeights = [subElement.scrollHeight, Math.floor(aV.DOM.windowClientHeight() * 0.5), aV.DOM.windowClientHeight() - topCoordinate + aV.DOM.windowScrollTop() - 20];
		subElement.style.overflowY = 'hidden';
		subElement.style.visibility = 'visible';
		aV.Visual.slideToggle(subElement, possibleHeights[possibleHeights.min()], margin, false, function(obj){obj.style.overflowY = 'auto';});
	}
	else
		aV.Visual.fadeNSlide(subElement, 0, -1, false, function(obj){obj.style.visibility = 'hidden';});
};

aV.DBGrid._documentClickHandler=function(event)
{
	var targetOwner=aV.DBGrid.getOwnerObject(event.target);
	var excludeId=(targetOwner && (aV.DOM.hasAsParent(event.target, targetOwner.tableElement.columnList, 2) || event.target==targetOwner.tableElement.buttonColumnList))?targetOwner.guid:0;
	for (var guid in aV.DBGrid.list)
		if (guid!=excludeId && aV.DBGrid.list.hasOwnProperty(guid) && aV.DBGrid.list[guid].tableElement)
			aV.Visual.fadeNSlide(aV.DBGrid.list[guid].tableElement.columnList, 0, -1, false, function(obj){obj.style.visibility = 'hidden';});
};

aV.DBGrid._columnManagerClickHandler=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	aV.DBGrid._toggleMenu(DBGridObj.guid, 'columnList', {x: event.target, y: DBGridObj.tableElement.tHead}, {x: -2, y: -event.target.offsetHeight-16});
};

aV.DBGrid._columnHeaderClickHandler=function(event)
{
	if (event.target.cancelClick) 
	{
		event.target.cancelClick=false;
		return false;
	}
	aV.DBGrid.getOwnerObject(event.target).sortData(this.getAttribute("alias"), false);
};

aV.DBGrid._titleMouseMoveHandler=function(event)
{
	var obj=event.target;
	if (aV.DBGrid._activeResizer==obj)
		return;
	var clientX=(event.layerX)?event.layerX-obj.offsetLeft:event.clientX-aV.DOM.getElementCoordinates(obj).x;
	obj.initialPos=clientX;
	if ((obj.offsetWidth - clientX)<=aV.config.DBGrid.resizeLockOffset)
		obj.style.cursor="e-resize";
	else if (clientX<=aV.config.DBGrid.resizeLockOffset)
		obj.style.cursor="w-resize";
	else
		obj.style.cursor="";
};

aV.DBGrid._lockResize=function(event)
{
	var obj=event.target;
	var clientX=(event.layerX)?event.layerX-obj.offsetLeft:event.clientX-aV.DOM.getElementCoordinates(obj).x;
	if ((obj.offsetWidth - clientX)>aV.config.DBGrid.resizeLockOffset && clientX>aV.config.DBGrid.resizeLockOffset)
		return;

	obj.visiblePrevSibling=obj.previousSibling
	while (obj.visiblePrevSibling && obj.visiblePrevSibling.style.display!='')
		obj.visiblePrevSibling=obj.visiblePrevSibling.previousSibling;
	if (obj.visiblePrevSibling)
		obj.visiblePrevSibling.visibleNextSibling=obj;
		
	obj.visibleNextSibling=obj.nextSibling
	while (obj.visibleNextSibling && (obj.visibleNextSibling.style.display!='' || obj.visibleNextSibling.className==aV.config.DBGrid.classNames.dummyColumn))
		obj.visibleNextSibling=obj.visibleNextSibling.nextSibling;

	if (clientX > aV.config.DBGrid.resizeLockOffset)
		aV.DBGrid._activeResizer = obj;
	else
	{
		aV.DBGrid._activeResizer = obj.visiblePrevSibling;
		clientX = aV.DBGrid._activeResizer.offsetWidth - clientX;
	}

	if (!(aV.DBGrid._activeResizer && aV.DBGrid._activeResizer.visibleNextSibling)) 
	{
		aV.DBGrid._activeResizer = null;
		return false;
	}

	aV.DBGrid._activeResizer.initialWidth=(aV.DBGrid._activeResizer.style.width)?parseInt(aV.DBGrid._activeResizer.style.width):aV.DBGrid._activeResizer.offsetWidth;
	if (aV.DBGrid._activeResizer.visibleNextSibling)
		aV.DBGrid._activeResizer.visibleNextSibling.initialWidth=(aV.DBGrid._activeResizer.visibleNextSibling.style.width)?parseInt(aV.DBGrid._activeResizer.visibleNextSibling.style.width):aV.DBGrid._activeResizer.visibleNextSibling.offsetWidth;

	aV.DBGrid._activeResizer.initialPos=clientX;
	obj.cancelClick=true;
	return false;
};

aV.DBGrid._unlockResize=function(event)
{
	var obj=aV.DBGrid._activeResizer;
	if (!obj)
		return true;
	obj.initialPos=false;
	aV.DBGrid._activeResizer=false;
	return aV.DBGrid._activeResizer;
};

aV.DBGrid._doResize=function(event)
{
	var obj=aV.DBGrid._activeResizer;
	if (!obj)
		return false;
	if (!obj.initialPos)
		return false;

	var clientX=(event.layerX)?event.layerX-obj.offsetLeft:event.clientX-aV.DOM.getElementCoordinates(obj).x;
	var change=clientX - obj.initialPos;
	
	if ((obj.initialWidth + change)<aV.config.DBGrid.minColWidth || (obj.visibleNextSibling && (obj.visibleNextSibling.initialWidth - change)<aV.config.DBGrid.minColWidth))
		return false;

	if (obj.visibleNextSibling)
		aV.DBGrid.list[obj.parentNode.parentNode.parentNode.guid]._setColumnWidth(obj.visibleNextSibling.cellIndex, obj.visibleNextSibling.initialWidth - change);
	aV.DBGrid.list[obj.parentNode.parentNode.parentNode.guid]._setColumnWidth(obj.cellIndex, obj.initialWidth + change);
};

aV.DBGrid._rowGrouper=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	var row=event.target;
	while (row.tagName.toUpperCase()!='TR')
		row=row.parentNode;
	if (!row.parentRow)
		return false;
	if (row.parentRow.groupCount)
		DBGridObj._ungroupRows(row.parentRow);
	else
		DBGridObj._groupRows(row.parentRow);
};

aV.DBGrid._rowClickHandler=function(event)
{
	//we should should use 'this' keyword since event.target gives the TD object instead of the row object
	var DBGridObj=aV.DBGrid.getOwnerObject(this);
	var selectable=true;
	
	if (DBGridObj.onrowclick)
	{
		//TODO: convert the below rowIndex conversion to a function and use in grouping
		if (DBGridObj.triggerEvent("rowclick", {row: this, rowData: DBGridObj.properties.row[this.dataIndex]})===false)
			selectable=false;
	}

	if (selectable)
	{
		if (DBGridObj.tableElement.selectedIndex>=0 && DBGridObj.tableElement.rows[DBGridObj.tableElement.selectedIndex])
			aV.DOM.removeClass(DBGridObj.tableElement.rows[DBGridObj.tableElement.selectedIndex], 'selected');
		
		DBGridObj.tableElement.selectedIndex=this.rowIndex;
		aV.DOM.addClass(this, 'selected');
	}
};

aV.DBGrid._filterBoxKeyUpHandler=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	if (DBGridObj._filterTimer)
		clearTimeout(DBGridObj._filterTimer);
	var keyCode=(event.which)?event.which:event.keyCode;
	if (keyCode == 27)
		event.target.value='';
	
	DBGridObj.properties.columns[event.target.columnHeader.getAttribute("alias")].parsedFilter=null;
	DBGridObj.properties.columns[event.target.columnHeader.getAttribute("alias")].filter=event.target.value;
	if (this.value=='' || keyCode==13)
		DBGridObj._printRows();
	else if (event.target.value.length>=aV.config.DBGrid.minCharsToFilter)
		DBGridObj._filterTimer=window.setTimeout("aV.DBGrid.list[%s]._printRows();".format(DBGridObj.guid), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._maxRowsInPageKeyUpHandler=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	if (DBGridObj.properties.maxRowsInPageTimer)
		clearTimeout(DBGridObj.properties.maxRowsInPageTimer);
	var keyCode=(event.which)?event.which:event.keyCode;
	if (keyCode == 27) //if esc
		event.target.value=aV.config.DBGrid.maxRowsInPage;
	
	if (keyCode==13) //if enter
		DBGridObj.setMaxRowsInPage(parseInt(event.target.value));
	else if (event.target.value.length>=0)
		DBGridObj.properties.maxRowsInPageTimer=window.setTimeout("aV.DBGrid.list[%0:s].properties.currentPage=1;aV.DBGrid.list[%0:s].setMaxRowsInPage(%1:s);".format(DBGridObj.guid, event.target.value), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._pageInputKeyUpHandler=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	if (DBGridObj._pageInputTimer)
		clearTimeout(DBGridObj._pageInputTimer);
	var keyCode=(event.which)?event.which:event.keyCode;
	if (keyCode == 27)
		event.target.value=aV.config.DBGrid.page;
	
	if (keyCode==13)
		DBGridObj.setPage(parseInt(event.target.value));
	else if (event.target.value.length>=0)
		DBGridObj._pageInputTimer=window.setTimeout("aV.DBGrid.list[%0:s].setPage(%1:s);".format(DBGridObj.guid, event.target.value), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._pageControlsClickHandler=function(event)
{
	if (event.target.getAttribute("disabled")=='true')
		return false;
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	DBGridObj.setPage(DBGridObj.properties.currentPage+event.target.increment);
};

aV.DBGrid._addCaptionButton=function(tableElement, type, prefix)
{
	if (!prefix)
		prefix="button";
	var name=prefix + type;
	tableElement[name]=document.createElement("a");
	tableElement[name].href="javascript:void(0)";
	tableElement[name].className=aV.config.DBGrid.classNames[name];
	tableElement[name].appendChild(document.createTextNode(aV.config.DBGrid.texts[name]));
	tableElement[name].setAttribute("hint", aV.config.DBGrid.texts[name + "Hint"]);
	return tableElement.caption.appendChild(tableElement[name]);
};

aV.DBGrid._exportLinkClickHandler=function(event)
{
	return event.target.href=aV.DBGrid.getOwnerObject(event.target).getFullSourceURL() + '&' + aV.config.DBGrid.exportTypeId + '=' + encodeURIComponent(event.target.type);
};

aV.DBGrid._onAfterEditHandler=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	if (!DBGridObj)
		return;
	
	DBGridObj.properties.row[event.target.parentNode.dataIndex][DBGridObj.properties.columnNames[event.target.cellIndex]]=event.responseObject.value;
};

aV.DBGrid.prototype.maxSortAccumulation=aV.config.DBGrid.maxSortAccumulation;
aV.DBGrid.prototype.error=false;

/* event definitions */
aV.DBGrid.prototype.onrowclick=null;
aV.DBGrid.prototype.onfetchbegin=null;
aV.DBGrid.prototype.onfetcherror=null;
aV.DBGrid.prototype.onfetchend=null;
aV.DBGrid.prototype.onparseerror=null;
aV.DBGrid.prototype.onprintbegin=null;
aV.DBGrid.prototype.onrowprint=null;
aV.DBGrid.prototype.onprintend=null;
aV.DBGrid.prototype.onsortbegin=null;
aV.DBGrid.prototype.onsortend=null;

aV.DBGrid.prototype.destroy=function()
{
	if (this.tableElement)
	{
		for (var idFormat in aV.config.DBGrid.idFormats)
		{
			if (!aV.config.DBGrid.idFormats.hasOwnProperty(idFormat))
				continue;
			var subElement=document.getElementById(aV.config.DBGrid.idFormats[idFormat].format(this.guid));
			if (subElement)
				subElement.parentNode.removeChild(subElement);
		}
		this.tableElement.parentNode.removeChild(this.tableElement);
		delete this.tableElement;
	}
	aV.Events.clear(this);
	delete aV.DBGrid.list[this.guid];
};

aV.DBGrid.prototype.getFullSourceURL=function()
{
	var params=this.parameters || {};
	this._addStateToParameters();
	if (typeof params!="string")
		params=params.toQueryString();
	return this.sourceURL + '?' + params;
};

aV.DBGrid.prototype.triggerEvent=function(type, parameters)
{
	if (!parameters)
		parameters={};
	parameters=({type: type,	target: this}).unite(parameters);
	var result=true;

	try 
	{
		if (this["on" + type]) 
			result = this["on" + type](parameters);
	}
	catch(error)
	{
		if (window.onerror)
			window.onerror(error.message, error.fileName, error.lineNumber);
	}

	/*else*/
	aV.config.DBGrid.defaultEventHandler(parameters);
	return result;
};

aV.DBGrid.prototype.addRow=function(row, index)
{
	//TODO: Add event triggers (beforeAddRow, afterAddRow)
	if (!row)
	{
		row=[{}];
		for (var column in this.properties.columns)
			if (this.properties.columns.hasOwnProperty(column) && !this.properties.columns[column].hidden)
				row[0][column]=aV.config.DBGrid.texts.newCellText;
	}
	if (!(row instanceof Array))
		row=[row];
	if (typeof index!="number")
		index=this.properties.row.length;
	this.properties.row = this.properties.row.slice(0, index).concat(row, this.properties.row.slice(index));
	this._printRows();
};

aV.DBGrid.prototype.deleteRow=function(index)
{
	//TODO: Add event triggers (beforeDeleteRow, afterDeleteRow)
	if (!(index instanceof Array))
		index=[index];
	else
		index.sort();
	
	var currentIndex=0;
	var newRows=[];
	for (var i=0; i<index.length; i++)
	{
		newRows=newRows.concat(this.properties.row.slice(currentIndex, index[i]));
		currentIndex=index[i]+1;
	}
	this.properties.row=newRows.concat(this.properties.row.slice(currentIndex));
	
	this._printRows();
};

aV.DBGrid.prototype._addExportButton=function(type)
{
	var button=document.createElement("a");
	
	button.type=type;
	button.href='javascript:void(0)';
	aV.Events.add(button, "click", aV.DBGrid._exportLinkClickHandler);
	
	button.className=aV.config.DBGrid.classNames.buttonExport.format(type);
	button.appendChild(document.createTextNode(this.properties.exports[type].alias || type));
	if (this.properties.exports[type].forceNewWindow) //exception for html
		button.target="_blank";
	return this.tableElement.caption.appendChild(button);
};

aV.DBGrid.prototype._addStateToParameters=function()
{
	if (this.properties)
	{
		//collect visible columns
		var activeColumns=[];
		for (var column in this.properties.columns)
			if (this.properties.columns.hasOwnProperty(column) && !this.properties.columns[column].hidden)
				activeColumns.push(column);

		if (typeof this.parameters=="string")
			this.parameters+='&' + activeColumns.toQueryString("columns[%s]");
		else
			this.parameters.columns=activeColumns;
	}
};

/**
 * Fetches the data from the address given in sourceURL
 * property, with posting the parameters given in
 * parameters property.
 * @method
 * @param {Boolean} [fullRefresh] If true, the DHTML table is regenerated after the data is fetched.
 */
aV.DBGrid.prototype.refreshData=function(fullRefresh, preserveState)
{
	if (this.fetcher)
		aV.AJAX.destroyRequestObject(this.fetcher);
	
	var self=this;
	
	this.triggerEvent("fetchbegin", {status: 'loading'});
	if (preserveState!==false)
		this._addStateToParameters();
	 
	this.fetcher=aV.AJAX.makeRequest(
		"POST",
		this.sourceURL,
		this.parameters,
		function(requestObject)
		{
			self.loadingData=false;				
			var supportedMimeTypes=[];
			for (var mimeType in aV.config.AJAX.dataParsers)
				if (aV.config.AJAX.dataParsers.hasOwnProperty(mimeType))
					supportedMimeTypes.push(mimeType);
			if (!aV.AJAX.isResponseOK(requestObject, supportedMimeTypes))
			{
				self.triggerEvent("fetcherror", {status: 'error', messages: [requestObject.status, requestObject.responseText.stripHTML()], forceInfoBox: true});
				delete self.fetcher;
				return;
			}
			self.triggerEvent("fetchend", {status: 'info'});

			self.parseData(fullRefresh, preserveState);
			delete self.fetcher;
		}
	);
};

aV.DBGrid.prototype.parseData=function(fullRefresh, preserveState)
{
	fullRefresh=(fullRefresh || !this.tableElement);
	
	//remove previously added dynamic event handlers
	if (this.properties && this.properties.eventHandlers)
		for (var eventType in this.properties.eventHandlers)
			if (this.properties.eventHandlers.hasOwnProperty(eventType))
				for (var i=0; i<this.properties.eventHandlers[eventType].length; i++)
					aV.Events.remove(this, eventType, this.properties.eventHandlers[eventType][i]);
	
	if ((fullRefresh && preserveState === false) || !this.properties) 
		this.properties = {};
	else 
	{
		delete this.properties.row;
		if (fullRefresh)
			delete this.properties.columns;
	}
	
	this.error=false;
	
	try
	{
		var parsedData=aV.AJAX.getResponseAsObject(this.fetcher);
		if (!parsedData)
			throw new Error("Invalid DBGrid data.", this.getFullSourceURL());
		this.properties.unite(parsedData, false);

		if (!this.properties.row)
			this.properties.row=[];
		else if (!(this.properties.row instanceof Array))
			this.properties.row=[this.properties.row];
		if (!this.properties.maxRowsInPage)
			this.properties.maxRowsInPage=aV.config.DBGrid.maxRowsInPage;
		if (!this.properties.currentPage)
			this.properties.currentPage=1;
		
		this.properties.columnNames=[];
		for (var column in this.properties.columns) 
		{
			if (!this.properties.columns.hasOwnProperty(column)) 
				continue;
			this.properties.columns[column].index=this.properties.columnNames.push(column)-1;
			
			//convert the given function body to a Function object if it is a string
			if (typeof this.properties.columns[column].comparator=='string')
				this.properties.columns[column].comparator=new Function("a", "b", this.properties.columns[column].comparator);
			if (!(this.properties.columns[column].comparator instanceof Function))
				this.properties.columns[column].comparator = aV.config.DBGrid.compareFunctions["dt_" + this.properties.columns[column].dataType] || aV.config.DBGrid.compareFunctions.dt_default;
			
			//convert the given function body to a Function object if it is a string
			if (typeof this.properties.columns[column].filterFunction=='string')
				this.properties.columns[column].filterFunction=new Function("value", "filter", this.properties.columns[column].filterFunction);
			if (!(this.properties.columns[column].filterFunction instanceof Function))
				this.properties.columns[column].filterFunction = aV.config.DBGrid.filterFunctions["dt_" + this.properties.columns[column].dataType] || aV.config.DBGrid.filterFunctions.dt_default;
			
			if (!this.properties.columns[column].title)
				this.properties.columns[column].title = column.replace(/_/g, " ").ucWords();
		}
		
		//add dynamic event handlers
		if (this.properties.eventHandlers)
			for (var eventType in this.properties.eventHandlers)
				if (this.properties.eventHandlers.hasOwnProperty(eventType))
				{
					if (!(this.properties.eventHandlers[eventType] instanceof Array)) 
						this.properties.eventHandlers[eventType] = [this.properties.eventHandlers[eventType]];
					for (var i = 0; i < this.properties.eventHandlers[eventType].length; i++) 
					{
						if ((typeof this.properties.eventHandlers[eventType][i])=="string")
							this.properties.eventHandlers[eventType][i]=new Function("event", this.properties.eventHandlers[eventType][i]);
						if (!(this.properties.eventHandlers[eventType][i] instanceof Function)) 
							continue;
						aV.Events.add(this, eventType, this.properties.eventHandlers[eventType][i]);
					}
				}

		if (!(this.properties.sort instanceof Array))
			if (this.properties.sort)
				this.properties.sort=[this.properties.sort];
			else
				this.properties.sort=[];

		if (this.properties.sort.length)
			this._sortRows();

	}
	catch(e)
	{
		this.error=e;
		this.triggerEvent("parseerror", {status: 'error',	messages: [200, this.error.message], forceInfoBox: true});
	}

	finally
	{
		if (!this.error && this.printAfterParse) 
		{
			if (fullRefresh) 
				this._print(false);
			else
			{
				this.tableElement.captionTitle.innerHTML='';
				this.tableElement.captionTitle.appendChild(document.createTextNode(aV.config.DBGrid.texts.title.format(this.properties.caption || aV.config.DBGrid.texts.defaultTitle, this.properties.row.length)));
				this._printRows();
			}
		}
		return !this.error;
	}
};

aV.DBGrid.prototype.setMaxRowsInPage=function(newMaxRowsInPage)
{
	if (newMaxRowsInPage<1 || newMaxRowsInPage!=Math.round(newMaxRowsInPage))
		return false;
	this.properties.maxRowsInPage=newMaxRowsInPage;
	this._printRows();
	return this.properties.maxRowsInPage;
};

aV.DBGrid.prototype.setPage=function(newPage)
{
	if (newPage<1 || newPage!=Math.round(newPage) || newPage>Math.ceil(this.rowCount/this.properties.maxRowsInPage))
		return false;
	this.properties.currentPage=newPage;
	this._printRows();
	return this.properties.currentPage;
};

aV.DBGrid.prototype._print=function(clear, element)
{
	if (!this._printCache)
	{
		if (element)
		{
			if (typeof element=='string')
				element=document.getElementById(element);
		}
		else if (this.printElement)
			element=this.printElement;
		else
			return false;
		
		if (clear!==false)
			clear=true;
			
		this.triggerEvent("printbegin", {status: 'loading'});
		
		this._printCache=[clear, element];
		window.setTimeout("aV.DBGrid.list[" + this.guid + "]._print();", 0);
		return;
	}
	else
	{
		element=this._printCache[1];
		clear=this._printCache[0];
		delete this._printCache;
	}
	
	if (this.tableElement)
	{
		this.tableElement.columnList.parentNode.removeChild(this.tableElement.columnList);
		this.tableElement.parentNode.removeChild(this.tableElement);
	}

	if (clear) 
	{
		element.innerHTML = '';
		if (this.tableElement)
			delete this.tableElement;
	}

	this.tableElement=document.createElement("table");
	this.tableElement.guid=this.guid;
	this.tableElement.className=aV.config.DBGrid.classNames.general;
	
	this.tableElement.appendChild(document.createElement("caption"));
	
	this.tableElement.columnList=document.body.appendChild(document.createElement("ul"));
	this.tableElement.columnList.guid=this.guid;
	this.tableElement.columnList.id=aV.config.DBGrid.idFormats.columnList.format(this.guid);
	this.tableElement.columnList.className=aV.config.DBGrid.classNames.columnList;
	this.tableElement.columnList.style.height="0";
	aV.Visual.setOpacity(this.tableElement.columnList, 0);

	/* Start creating the buttons */
	/* ColumnList button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "ColumnList"), "click", aV.DBGrid._columnManagerClickHandler);
	/* Show/Hide Filters Button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "Filter"), "click", function() {aV.Visual.toggle(this.parentNode.parentNode.tHead.filterRow);});
	/* GroupAll button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "GroupAll"), "click", function(event) {aV.DBGrid.getOwnerObject(event.target).groupAllRows();return false;});
	/* UngroupAll Button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "UngroupAll"), "click", function(event) {aV.DBGrid.getOwnerObject(event.target).ungroupAllRows();return false;});

	/* Export buttons */
	if (this.properties.exports)
	{
		for (var exportType in this.properties.exports)
			if (this.properties.exports.hasOwnProperty(exportType))
				this._addExportButton(exportType);
	}

	/* End of button definitions */
	
	this.tableElement.captionTitle=this.tableElement.caption.appendChild(document.createElement("div"));
	this.tableElement.captionTitle.className=aV.config.DBGrid.classNames.captionTitle;
	this.tableElement.captionTitle.appendChild(document.createTextNode(aV.config.DBGrid.texts.title.format(this.properties.caption || aV.config.DBGrid.texts.defaultTitle, this.properties.row.length)));
	
	this.tableElement.statusArea=this.tableElement.caption.appendChild(document.createElement("div"));
	this.tableElement.statusArea.className=aV.config.DBGrid.classNames.statusArea;
	
	this.tableElement.setColumnVisibility=function(column, visible)
	{
		var displayState=(visible)?'':'none';
		var rows=this.getElementsByTagName("tr");
		var DBGridObj=aV.DBGrid.getOwnerObject(this);
		//for (var i = rows.length - 1; i >= 0; i--) 
		for (var i = 0; i < rows.length; i++)
		{
			if (rows[i].parentNode != this.tFoot)
				rows[i].cells[DBGridObj.properties.columns[column].index].style.display = displayState;
			else
				rows[i].cells[0].colSpan+=(visible)?1:-1;
		}
		DBGridObj.properties.columns[column].hidden=!visible;
		if (visible && DBGridObj.properties.row.length && !(column in DBGridObj.properties.row[0]))
			DBGridObj.refreshData();
	};
	
	this.tableElement.appendChild(document.createElement("thead"));
	this.tableElement.tHead.filterRow=this.tableElement.tHead.insertRow(-1);
	this.tableElement.tHead.filterRow.className=aV.config.DBGrid.classNames.filterRow;
	this.tableElement.tHead.filterRow.style.display='none';
	var newRow=this.tableElement.tHead.insertRow(-1);
	var columnTitle, newCell, newLi, newLabel, newCheckbox;
	var visibleColCount=0;
	
	for (var column in this.properties.columns)
	{
		if (!this.properties.columns.hasOwnProperty(column))
			continue;
		
		newLi = this.tableElement.columnList.appendChild(document.createElement("LI"));
		
		newLabel=document.createElement("label");
		newLabel.setAttribute("for", aV.config.DBGrid.idFormats.columnControl.format(this.guid, column));
		newLabel.appendChild(document.createTextNode(this.properties.columns[column].title.trimToLength(aV.config.DBGrid.maxCharsInColumnList)));
		newLabel.setAttribute("title", this.properties.columns[column].title);

		newCheckbox=document.createElement("input");
		newCheckbox.type="checkbox";
		newCheckbox.id=newLabel.getAttribute("for");
		newCheckbox.column=column;
		newCheckbox.onclick=function()
		{
			aV.DBGrid.list[this.parentNode.parentNode.guid].tableElement.setColumnVisibility(this.column, this.checked);
		};

		newLi.appendChild(newCheckbox);
		newLi.appendChild(newLabel);

		newCheckbox.checked=!this.properties.columns[column].hidden;

		newCell=newRow.insertCell(-1);

		newCell.appendChild(document.createTextNode(this.properties.columns[column].title));
		newCell.setAttribute("alias", column);
		newCell.title=this.properties.columns[column].title;
		aV.Events.add(newCell, "click", aV.DBGrid._columnHeaderClickHandler);
		aV.Events.add(newCell, "mousemove", aV.DBGrid._titleMouseMoveHandler);
		aV.Events.add(newCell, "mousedown", aV.DBGrid._lockResize);
		
		if (this.properties.columns[column].width)
			newCell.style.width=this.properties.columns[column].width + "px";
		
		newCell.filterBox=this.tableElement.tHead.filterRow.insertCell(-1).appendChild(document.createElement("input"));
		newCell.filterBox.columnHeader=newCell;
		
		if (this.properties.columns[column].hidden)
		{
			newCell.style.display = 'none';
			newCell.filterBox.parentNode.style.display = 'none';
		}
		else
			visibleColCount++;
		
		aV.Events.add(newCell.filterBox, "keyup", aV.DBGrid._filterBoxKeyUpHandler);
	}
	this.tableElement.dummyColumn=[this.tableElement.tHead.rows[0].insertCell(-1), this.tableElement.tHead.rows[1].insertCell(-1)];
	this.tableElement.dummyColumn.each(function(element){element.className=aV.config.DBGrid.classNames.dummyColumn; return element});
	
	this.tableElement.appendChild(document.createElement("tfoot"));
	/* footer cell */
	this.tableElement.tFoot.insertRow(-1).insertCell(-1);
	if (visibleColCount>1)
		this.tableElement.tFoot.rows[0].cells[0].colSpan=visibleColCount;
	this.tableElement.tFoot.rowInfo=this.tableElement.tFoot.rows[0].cells[0].appendChild(document.createElement("DIV"));
	this.tableElement.tFoot.pageControls=this.tableElement.tFoot.rows[0].cells[0].appendChild(document.createElement("DIV"));
	this.tableElement.tFoot.pageControls.className=aV.config.DBGrid.classNames.pageControls;
	/* max rows in page part */
	this.tableElement.tFoot.pageControls.appendChild(document.createTextNode(aV.config.DBGrid.texts.maxRowsInPage));
	this.tableElement.tFoot.pageControls.maxRowsInPage=document.createElement("INPUT");
	this.tableElement.tFoot.pageControls.maxRowsInPage.type="TEXT";
	this.tableElement.tFoot.pageControls.maxRowsInPage.className=aV.config.DBGrid.classNames.maxRowsInPageInput;
	aV.Events.add(this.tableElement.tFoot.pageControls.maxRowsInPage, "keyup", aV.DBGrid._maxRowsInPageKeyUpHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.maxRowsInPage);
	/* pages part */
	this.tableElement.tFoot.pageControls.previousPage=document.createElement('A');
	this.tableElement.tFoot.pageControls.previousPage.className=aV.config.DBGrid.classNames.previousPage;
	this.tableElement.tFoot.pageControls.previousPage.href="javascript:void(0)";
	this.tableElement.tFoot.pageControls.previousPage.appendChild(document.createTextNode(aV.config.DBGrid.texts.previousPage));
	this.tableElement.tFoot.pageControls.previousPage.increment=-1;
	aV.Events.add(this.tableElement.tFoot.pageControls.previousPage, "click", aV.DBGrid._pageControlsClickHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.previousPage);
	
	this.tableElement.tFoot.pageControls.page=document.createElement("INPUT");
	this.tableElement.tFoot.pageControls.page.type="TEXT";
	this.tableElement.tFoot.pageControls.page.className=aV.config.DBGrid.classNames.pageInput;
	aV.Events.add(this.tableElement.tFoot.pageControls.page, "keyup", aV.DBGrid._pageInputKeyUpHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.page);
	
	this.tableElement.tFoot.pageControls.nextPage=document.createElement('A');
	this.tableElement.tFoot.pageControls.nextPage.className=aV.config.DBGrid.classNames.nextPage;
	this.tableElement.tFoot.pageControls.nextPage.href="javascript:void(0)";
	this.tableElement.tFoot.pageControls.nextPage.appendChild(document.createTextNode(aV.config.DBGrid.texts.nextPage));
	this.tableElement.tFoot.pageControls.nextPage.increment=1;
	aV.Events.add(this.tableElement.tFoot.pageControls.nextPage, "click", aV.DBGrid._pageControlsClickHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.nextPage);
	
	this.tableElement.tFoot.pageControls.totalPageCount=document.createElement("SPAN");
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.totalPageCount);
	
	this.tableElement.appendChild(document.createElement("tbody"));
	this._printRows();
	
	element.appendChild(this.tableElement);
};

aV.DBGrid.prototype._printFooter=function(originalStart)
{
	var totalPages=Math.ceil(this.properties.row.length/this.properties.maxRowsInPage);
	var tableBody=this.tableElement.tBodies[0];
	this.tableElement.tFoot.rowInfo.innerHTML=aV.config.DBGrid.texts.footerRowCount.format(originalStart, originalStart + tableBody.rows.length - 1, tableBody.rows.length, this.properties.row.length);
	this.tableElement.tFoot.pageControls.maxRowsInPage.value=this.properties.maxRowsInPage;
	this.tableElement.tFoot.pageControls.page.value=this.properties.currentPage;
	this.tableElement.tFoot.pageControls.totalPageCount.innerHTML=aV.config.DBGrid.texts.totalPages.format(totalPages);
	this.tableElement.tFoot.pageControls.previousPage.setAttribute("disabled", this.properties.currentPage<2);
	this.tableElement.tFoot.pageControls.nextPage.setAttribute("disabled", this.properties.currentPage>=totalPages);
};

aV.DBGrid.prototype.sortData=function(column, direction)
{
	if (!this._sortCache)
	{
		if (typeof direction!='number')
			direction=(this.properties.sort.length && this.properties.sort[0].column===column)?-this.properties.sort[0].direction:1;
		
		if (!this.properties.columns || !this.properties.row || (this.properties.sort.length && this.properties.sort[0].column===column && this.properties.sort[0].column===direction))
			return false;
		
		this.triggerEvent("sortbegin", {status: 'loading', column: column, direction: direction});

		if (this.properties.sort.length)
			this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[this.properties.columns[this.properties.sort[0].column].index].className='';

		this._sortCache=[column, direction];
		window.setTimeout("aV.DBGrid.list[" + this.guid + "].sortData()", 0);
		return;
	}
	else
	{
		direction=this._sortCache[1];
		column=this._sortCache[0];
		delete this._sortCache;
	}
	
	if (!this.properties.sort.length || column != this.properties.sort[0].column) 
	{
		this.properties.sort.unshift(
			{
				column: column,
				direction: direction
			}
		);
		
		if (this.properties.sort.length > this.maxSortAccumulation)
			this.properties.sort=this.properties.sort.slice(0, this.maxSortAccumulation - 1);
	}
	else
		this.properties.sort[0].direction=direction;
	
	var currentObject=this;
	
	this._sortRows();

	this.triggerEvent("sortend", {status: 'info'});
	
	this._printRows();
};

aV.DBGrid.prototype.groupAllRows=function()
{
	if (!this.tableElement || this.properties.grouped)
		return false;
	var currentRow=this.tableElement.tBodies[0].firstChild;
	while (currentRow)
	{
		if (!currentRow.groupCount)
			this._groupRows(currentRow, this.tableElement);
		currentRow=currentRow.nextSibling;
	}
	this.properties.grouped=true;
};

aV.DBGrid.prototype.ungroupAllRows=function()
{
	if (!this.tableElement)
		return false;
	var currentRow=this.tableElement.tBodies[0].firstChild;
	while (currentRow)
	{
		if (currentRow.groupCount)
			currentRow=this._ungroupRows(currentRow, this.tableElement);
		currentRow=currentRow.nextSibling;
	}
	this.properties.grouped=false;
};

aV.DBGrid.prototype._sortRows=function()
{
	if (!this.properties.sort.length)
		return;
	var currentObject=this;
	this.properties.row.sort(
		function(row1, row2)
		{
			var result=0;
			for (var i = 0; i < currentObject.properties.sort.length && !result; i++) 
				result = currentObject.properties.columns[currentObject.properties.sort[i].column].comparator(row1[currentObject.properties.sort[i].column], row2[currentObject.properties.sort[i].column])*currentObject.properties.sort[i].direction;
			return result;
		}
	);
};

aV.DBGrid.prototype._adjustHeight=function()
{
	var tableBody=this.tableElement.tBodies[0];
	var maxBodyHeight=(this.properties.maxBodyHeight!==undefined)?this.properties.maxBodyHeight:aV.config.DBGrid.maxBodyHeight;
	if (!maxBodyHeight || !tableBody.clientHeight || tableBody.scrollHeight <= tableBody.clientHeight) 
	{
		tableBody.style.height = 'auto';
		this.tableElement.dummyColumn.each(function(element){element.style.display='none'; return element;});
	}
};

aV.DBGrid.prototype._printRows=function(clear, i, count, insertBefore)
{
	if (!this.tableElement)
		return false;
	
	if (clear!==false)
		clear=true;

	if (typeof i!='number' || isNaN(i))
		i=(this.properties.currentPage-1)*this.properties.maxRowsInPage;

	if (typeof count!='number')
		count=this.properties.maxRowsInPage;

	var addedRows=0;
	var tableBody=this.tableElement.tBodies[0];
	var filtered=false;
	
	if (clear)
		while (tableBody.firstChild)
			tableBody.removeChild(tableBody.firstChild);

	if (aV.config.DBGrid.maxBodyHeight > 0) 
	{
		tableBody.style.height = aV.config.DBGrid.maxBodyHeight + 'px';
		this.tableElement.dummyColumn.each(function(element){element.style.display=''; return element;});
	}

	for (var c=0; c<this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells.length-1; c++)
		this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[c].className='';
	if (this.properties.sort && this.properties.sort.length>0)
		this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[this.properties.columns[this.properties.sort[0].column].index].className=(this.properties.sort[0].direction==1)?aV.config.DBGrid.classNames.sortedAsc:aV.config.DBGrid.classNames.sortedDesc;

	var originalStart=i+1;
	var newRow, newCell, lastKeyRow, lastKeyData, currentKeyData, rowContent;
	for (; (addedRows<count && i<this.properties.row.length); i++)
	{
		newRow=document.createElement("tr");
		aV.Events.add(newRow, "click", aV.DBGrid._rowClickHandler);

		if (this.properties.sort.length>0)
		{
			aV.Events.add(newRow, "dblclick", aV.DBGrid._rowGrouper);
			currentKeyData=this.properties.row[i][this.properties.sort[0].column];
			if (currentKeyData==lastKeyData)
				newRow.parentRow=lastKeyRow;
			else
			{
				if (this.properties.grouped && lastKeyRow)
					this._groupRows(lastKeyRow);
				newRow.parentRow=lastKeyRow=newRow;
				lastKeyData=currentKeyData;
			}
		}
		
		filtered=false;
		for (var column in this.properties.columns)
		{
			if (!this.properties.columns.hasOwnProperty(column))
				continue;

			newCell=document.createElement("td");
			newCell.setAttribute("datatype", this.properties.columns[column].dataType);
			newCell.setAttribute("column", column);

			if (this.properties.columns[column].hidden)
				newCell.style.display='none';
			
			
			var cellData=(this.properties.row[i][column]!==undefined)?this.properties.row[i][column]:aV.config.DBGrid.texts.emptyCellText;
			if (this.properties.columns[column].parseHTML)
				newCell.innerHTML=cellData;
			else
				newCell.appendChild(document.createTextNode(cellData));
				
			if (filtered=(filtered || this._applyFilter(/*this.properties.row[i]*/newCell.textContent || newCell.innerText, column)))
				break;
			
			newCell.lastStr=newCell.innerHTML;
			newCell.setAttribute("title", newCell.innerText || newCell.textContent);
			newRow.appendChild(newCell);
		}
		
		if (filtered) 
		{
			newRow=null;
			continue;
		}
		
		newRow.dataIndex = i;
		addedRows++;
		if (insertBefore)
			tableBody.insertBefore(newRow, insertBefore);
		else
			tableBody.appendChild(newRow);

		this.triggerEvent("rowprint", {row: newRow, rowData: this.properties.row[i], rowStart: originalStart, rowsAdded: addedRows});
	}
	if (this.properties.grouped && lastKeyRow)
		this._groupRows(lastKeyRow);

	setTimeout("aV.DBGrid.list[%s]._adjustHeight();".format(this.guid),0);
	aV.Events.trigger(window, 'domready', {caller: this, changedNode: tableBody});

	this._printFooter(originalStart);

	this.triggerEvent("printend", {status: 'info'});

	return newRow;
};

aV.DBGrid.prototype._applyFilter=function(value, column)
{
	var result=false;
	
	if (this.properties.columns[column].filterFunction && this.properties.columns[column].filter)
	{
		var filterStr=this.properties.columns[column].filter;
		var invert=(filterStr.charAt(0)=='!');
		
		if (invert || filterStr.charAt(0)==' ')
			filterStr=filterStr.substr(1);
		
		result=this.properties.columns[column].filterFunction(value, filterStr, this.properties.columns[column]);
		
		if (invert)
			result=!result;
	}
	
	return result;
};

aV.DBGrid.prototype._groupRows=function(groupHeader)
{
	var currentRow=groupHeader.nextSibling;
	groupHeader.groupCount=0;
	while (currentRow && currentRow.parentRow==groupHeader)
	{
		for (var column in this.properties.columns)
		{
			if (!this.properties.columns.hasOwnProperty(column))
				continue;
			
			if (column==this.properties.sort[0].column/* || this.properties.columns[column].hidden*/)
				continue;

			var columnIndex=this.properties.columns[column].index;
			dataType=(this.properties.columns[column].dontSum)?"string":this.properties.columns[column].dataType;
			switch(dataType)
			{
				case 'int':
				case 'real':
					groupHeader.cells[columnIndex].firstChild.nodeValue=parseFloat(groupHeader.cells[columnIndex].textContent || groupHeader.cells[columnIndex].innerText) + parseFloat(currentRow.cells[columnIndex].textContent || currentRow.cells[columnIndex].innerText);
					break;
				default:
					groupHeader.cells[columnIndex].appendChild(document.createElement('br'));
					if (groupHeader.childNodes[columnIndex].lastStr!=currentRow.cells[columnIndex].innerHTML)
					{
						groupHeader.cells[columnIndex].innerHTML+=currentRow.cells[columnIndex].innerHTML;
						groupHeader.cells[columnIndex].lastStr=currentRow.cells[columnIndex].textContent || currentRow.cells[columnIndex].innerText;
					}
			}
		}
		groupHeader.groupCount++;
		groupHeader.parentNode.removeChild(currentRow);
		groupHeader.className=aV.config.DBGrid.classNames.groupedRow;
		currentRow=groupHeader.nextSibling;
	}
};

aV.DBGrid.prototype._ungroupRows=function(groupHeader)
{
	this.properties.grouped=false;
	var lastAdded=this._printRows(false, groupHeader.dataIndex, (groupHeader.groupCount+1), groupHeader.nextSibling);
	groupHeader.parentNode.removeChild(groupHeader);
	return lastAdded;
};

aV.DBGrid.prototype._setColumnWidth=function(colIndex, newWidth)
{
	for (var i=0; i<this.tableElement.tHead.rows.length; i++)
		this.tableElement.tHead.rows[i].cells[colIndex].style.width=newWidth + "px";
};

aV.DBGrid.prototype.updateStatus=function(text, type, forceInfoBox)
{
	if (this.tableElement && !forceInfoBox) 
	{
		aV.Visual.infoBox.hide();
		this.tableElement.statusArea.innerHTML = '<img src="%1:s" alt="(%0:s)" />'.format(type, aV.config.Visual.infoBox.images[type]) + text;
	}
	else 
		aV.Visual.infoBox.show("DBGrid[%0:s] - ".format(this.guid) + text, aV.config.Visual.infoBox.images[type], false, aV.config.DBGrid.infoBoxTimeout);
};

aV.Events.add(document, "mouseup", aV.DBGrid._unlockResize);
aV.Events.add(document, "mousemove", aV.DBGrid._doResize);
aV.Events.add(document, "click", aV.DBGrid._documentClickHandler);
aV.Events.add(document, "selectstart", function() {return !aV.DBGrid._activeResizer});
aV.Events.add(document, "dragstart", function() {return !aV.DBGrid._activeResizer});
if (aV.QuickEdit)
	aV.Events.add(aV.QuickEdit, "afteredit", aV.DBGrid._onAfterEditHandler);

for (var i=0; i<aV.config.DBGrid.paths.css.length; i++)
	aV.AJAX.loadResource(aV.config.DBGrid.paths.css[i], "css", "aVDBGridCSS" + i);