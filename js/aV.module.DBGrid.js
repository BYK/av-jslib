/**
 * @fileOverview Introduces the aV.DBGrid class which fetches and parses XML data
 * and creates a table from the data collected.
 * The generated tables have native sort, filter and grouping support.
 * @name aV.DBGrid
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 2.4
 * @copyright &copy;2010 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV.config.DBGrid)
	aV.config.DBGrid = {};

aV.config.DBGrid.unite(
	{
		maxSortAccumulation: 4,
		resizeLockOffset: 10,
		minColWidth: 20, //should be >= 2*resizeLockOffset
		maxBodyHeight: -1,
		minCharsToFilter: 2,
		maxCharsInColumnList: 25,
		keyupTimeout: 200, //in milliseconds
		maxRowsInPage: 50,
		infoBoxTimeout: 180000, //in milliseconds
		exportTypeId: 'export',
		paths:
		{
			css:
			[
				'/JSLib/css/aV.module.DBGrid-css.php',
				'/css/file_types.css'
			]
		},
		texts:
		{
			title: '%s - %s/%s records',
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
				printend: 'Table is ready to use.',
				fetchend: 'Table data received.'
			},
			buttonColumnList: 'Column Manager',
			buttonColumnListHint: 'You can set the visibility of the table columns from here',
			buttonGroupAll: 'Group Rows',
			buttonGroupAllHint: 'You can group all the rows <b>by the sorted column</b> which means you <u>should</u> sort the table first.',
			buttonUngroupAll: 'Separate Rows',
			buttonUngroupAllHint: 'You can ungroup all the grouped rows by using this button.',
			buttonFilter: 'Filter',
			buttonFilterHint: 'You can filter the rows using the filter boxes above the columns. You may use "!" as the "not" operator. You may also use numerical comparators such as "<", ">" in numerical fields. Filters are cumulative.',
			maxRowsInPage: 'Max. rows in page: ',
			totalPages: ' / %s',
			previousPage: ' ',
			nextPage: ' ',
			newCellText: '(empty cell)',
			emptyCellText: 'Loading...',
			na: 'N/A'
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
				value = parseInt(value);
				if (!column.parsedFilter) 
				{
					column.parsedFilter = filterStr;
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
				value = parseFloat(value);
				if (!column.parsedFilter) 
				{
					column.parsedFilter = filterStr;
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
				a = a.stripHTML().toLowerCase();
				b = b.stripHTML().toLowerCase();
				if (a < b)
					return -1;
				else if (a > b)
					return 1;
				else
					return 0;
			},
			dt_int: function(a, b)
			{
				a = parseInt(a);
				b = parseInt(b);
				return ((a - b) || (isNaN(a)?-1:1));
			},
			dt_real: function(a, b)
			{
				a = parseFloat(a);
				b = parseFloat(b);
				return ((a - b) || (isNaN(a)?-1:1));
			}
		},
		groupFunctions:
		{
			dontGroup: function(row, activeCell, cellContent)
			{
				activeCell.newInnerHTML += '<br/>' + cellContent;
			},
			dt_default: function(row, activeCell, cellContent)
			{
				activeCell.newInnerHTML += '<br/>';
				if (activeCell.lastStr != cellContent)
				{
					activeCell.newInnerHTML += cellContent;
					activeCell.lastStr = cellContent;
				}
			},
			dt_int: function(row, activeCell, cellContent)
			{
				var newValue = parseInt(activeCell.newInnerHTML) + parseInt(cellContent); 
				activeCell.newInnerHTML = (isNaN(newValue))?aV.config.DBGrid.texts.na:newValue;
			},
			dt_real: function(row, activeCell, cellContent)
			{
				var newValue = parseFloat(activeCell.newInnerHTML) + parseFloat(cellContent); 
				activeCell.newInnerHTML = (isNaN(newValue))?aV.config.DBGrid.texts.na:newValue;
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
aV.DBGrid = function(sourceURL, parameters, printElement, fetch, print)
{
	/**
	 * Holds the unique identifier and index of the DBGrid object.
	 * @type	{integer}
	 */
	this.guid = aV.DBGrid._lastGuid++;
	
	aV.DBGrid.list[this.guid] = this;
	
	/**
	 * Holds the address of the XML table data.
	 * @type {String}
	 */
	this.sourceURL = sourceURL;
	
	/**
	 * Holds the POST parameters for the data source page whoese
	 * address is given in the sourceURL property.
	 * @type {String|Object}
	 */
	if (typeof parameters == 'string')
		this.parameters = Object.fromQueryString(parameters);
	else if (parameters && parameters.constructor == Object)
		this.parameters = parameters;
	else
		this.parameters = {};
	
	this.printElement = printElement;
	this.printAfterParse = print;
	
	this._printInfo = {start: 0, end: 0};
	
	if (fetch)
		this.refreshData();
};

/**
 * The guid counter for Window.DBGrids array, do not touch.
 *
 * @private
 */
aV.DBGrid._lastGuid = 1;

aV.DBGrid._activeResizer = false;

aV.DBGrid.list = {};

/**
 * Removes and destroys all the DBGrids on a page
 *
 * @static
 * @method
 */
aV.DBGrid.clearAll = function()
{
	for (var guid in aV.DBGrid.list)
		if (aV.DBGrid.list.hasOwnProperty(guid))
			aV.DBGrid.list[guid].destroy();
};

aV.DBGrid.getOwnerObject = function(element)
{
	while (element && !(element.guid && (element.tagName == 'TABLE' && aV.DOM.hasClass(element, aV.config.DBGrid.classNames.general)) || (element.tagName == 'UL' && aV.DOM.hasClass(element, aV.config.DBGrid.classNames.columnList))))
		element = element.parentNode;
	if (element)
		return aV.DBGrid.list[element.guid];

	return undefined;
};

aV.DBGrid._toggleMenu = function(guid, menuIdentifier, alignElement, offset)
{
	var margin = 8,
	    subElement = document.getElementById(aV.config.DBGrid.idFormats[menuIdentifier].format(guid)),
	    topCoordinate,
	    possibleHeights;
	
	if (offset === undefined)
		offset = {x: 0, y: 0};
	else if (typeof offset == "number")
		offset = {x: offset, y: offset};
	if (subElement.offsetHeight <= margin) 
	{
		subElement.style.left = (aV.DOM.getElementCoordinates(alignElement.x).x + offset.x) + "px";
		topCoordinate = aV.DOM.getElementCoordinates(alignElement.y).y + offset.y;
		subElement.style.top = topCoordinate + "px";
		possibleHeights = [subElement.scrollHeight, Math.floor(aV.DOM.windowClientHeight() * 0.5), aV.DOM.windowClientHeight() - topCoordinate + aV.DOM.windowScrollTop() - 20];
		subElement.style.overflowY = 'hidden';
		subElement.style.visibility = 'visible';
		aV.Visual.slideToggle(subElement, Math.min.call(window, possibleHeights), margin, false, function(obj){obj.style.overflowY = 'auto';});
	}
	else
		aV.Visual.fadeNSlide(subElement, 0, -1, false, function(obj){obj.style.visibility = 'hidden';});
};

aV.DBGrid._documentClickHandler = function(event)
{
	var targetOwner = aV.DBGrid.getOwnerObject(event.target),
	    excludeId = (targetOwner && (aV.DOM.hasAsParent(event.target, targetOwner.tableElement.columnList, 2) || event.target == targetOwner.tableElement.buttonColumnList))?targetOwner.guid:0,
			guid;
	for (guid in aV.DBGrid.list)
		if (guid != excludeId && aV.DBGrid.list.hasOwnProperty(guid) && aV.DBGrid.list[guid].tableElement)
			aV.Visual.fadeNSlide(aV.DBGrid.list[guid].tableElement.columnList, 0, -1, false, function(obj){obj.style.visibility = 'hidden';});
};

aV.DBGrid._windowResizeHandler = function(event)
{
	for (var guid in aV.DBGrid.list)
		if (aV.DBGrid.list.hasOwnProperty(guid))
			aV.DBGrid.list[guid]._adjustHeight();
};

aV.DBGrid._columnManagerClickHandler = function(event)
{
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target);
	aV.DBGrid._toggleMenu(DBGridObj.guid, 'columnList', {x: event.target, y: event.target}, {x: -2, y: event.target.offsetHeight + 1});
};

aV.DBGrid._columnHeaderClickHandler = function(event)
{
	if (event.target.cancelClick) 
	{
		event.target.cancelClick = false;
		return false;
	}
	aV.DBGrid.getOwnerObject(event.target).sortData(this.getAttribute("alias"), false);
};

aV.DBGrid._titleMouseMoveHandler = function(event)
{
	var obj = event.target;
	
	if (aV.DBGrid._activeResizer == obj)
		return;
	
	var clientX = (event.layerX)?event.layerX-obj.offsetLeft:event.clientX-aV.DOM.getElementCoordinates(obj).x;
	obj.initialPos = clientX;
	if ((obj.offsetWidth - clientX) <= aV.config.DBGrid.resizeLockOffset)
		obj.style.cursor = "e-resize";
	else if (clientX <= aV.config.DBGrid.resizeLockOffset)
		obj.style.cursor = "w-resize";
	else
		obj.style.cursor = "";
};

aV.DBGrid._lockResize = function(event)
{
	var obj = event.target,
	    clientX = (event.layerX)?event.layerX-obj.offsetLeft:event.clientX-aV.DOM.getElementCoordinates(obj).x;
	
	if ((obj.offsetWidth - clientX) > aV.config.DBGrid.resizeLockOffset && clientX > aV.config.DBGrid.resizeLockOffset)
		return;

	obj.visiblePrevSibling = obj.previousSibling
	while (obj.visiblePrevSibling && obj.visiblePrevSibling.style.display != '')
		obj.visiblePrevSibling = obj.visiblePrevSibling.previousSibling;
	if (obj.visiblePrevSibling)
		obj.visiblePrevSibling.visibleNextSibling = obj;
		
	obj.visibleNextSibling = obj.nextSibling
	while (obj.visibleNextSibling && (obj.visibleNextSibling.style.display != '' || obj.visibleNextSibling.className == aV.config.DBGrid.classNames.dummyColumn))
		obj.visibleNextSibling = obj.visibleNextSibling.nextSibling;

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

	aV.DBGrid._activeResizer.initialWidth = (aV.DBGrid._activeResizer.style.width)?parseInt(aV.DBGrid._activeResizer.style.width):aV.DBGrid._activeResizer.clientWidth;
	if (aV.DBGrid._activeResizer.visibleNextSibling)
		aV.DBGrid._activeResizer.visibleNextSibling.initialWidth = (aV.DBGrid._activeResizer.visibleNextSibling.style.width)?parseInt(aV.DBGrid._activeResizer.visibleNextSibling.style.width):aV.DBGrid._activeResizer.visibleNextSibling.clientWidth;

	aV.DBGrid._activeResizer.initialPos = clientX;
	obj.cancelClick = true;
	aV.Events.add(document, "mousemove", aV.DBGrid._doResize);
	return false;
};

aV.DBGrid._unlockResize = function(event)
{
	var obj = aV.DBGrid._activeResizer;
	if (!obj)
		return true;
	obj.initialPos = false;
	aV.DBGrid._activeResizer = false;
	aV.Events.remove(document, "mousemove", aV.DBGrid._doResize);
	return false;
};

aV.DBGrid._doResize = function(event)
{
	var obj = aV.DBGrid._activeResizer;
	
	if (!obj)
		return true;
	if (!obj.initialPos)
		return true;

	var clientX = (event.layerX)?event.layerX-obj.offsetLeft:event.clientX-aV.DOM.getElementCoordinates(obj).x,
	    change = clientX - obj.initialPos;
	
	if ((obj.initialWidth + change) < aV.config.DBGrid.minColWidth || (obj.visibleNextSibling && (obj.visibleNextSibling.initialWidth - change) < aV.config.DBGrid.minColWidth))
		return false;

	if (obj.visibleNextSibling)
		aV.DBGrid.list[obj.parentNode.parentNode.parentNode.guid]._setColumnWidth(obj.visibleNextSibling.cellIndex, obj.visibleNextSibling.initialWidth - change);
	aV.DBGrid.list[obj.parentNode.parentNode.parentNode.guid]._setColumnWidth(obj.cellIndex, obj.initialWidth + change);
};

aV.DBGrid._groupButtonClickHandler = function(event)
{
	aV.DBGrid.getOwnerObject(event.target).changeGroupedState();
	return false;
};

aV.DBGrid._rowClickHandler = function(event)
{
	//we should should use 'this' keyword since event.target gives the TD object instead of the row object
	var DBGridObj = aV.DBGrid.getOwnerObject(this),
	    selectable = true;
	
	if (DBGridObj.onrowclick)
	{
		if (DBGridObj.triggerEvent("rowclick", {row: this, rowData: DBGridObj.properties.row[this.dataIndex], ownerObject: DBGRidObj}) === false)
			selectable = false;
	}

	if (selectable)
	{
		if (DBGridObj.tableElement.selectedIndex >= 0 && DBGridObj.tableElement.rows[DBGridObj.tableElement.selectedIndex])
			aV.DOM.removeClass(DBGridObj.tableElement.rows[DBGridObj.tableElement.selectedIndex], 'selected');
		
		DBGridObj.tableElement.selectedIndex = this.rowIndex;
		aV.DOM.addClass(this, 'selected');
	}
};

aV.DBGrid._filterBoxKeyUpHandler = function(event)
{
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target),
	    keyCode = (event.which)?event.which:event.keyCode;

	if (DBGridObj._filterTimer)
		clearTimeout(DBGridObj._filterTimer);

	if (keyCode == 27)
		event.target.value = '';
	
	DBGridObj.properties.columns[event.target.columnHeader.getAttribute("alias")].parsedFilter = null;
	DBGridObj.properties.columns[event.target.columnHeader.getAttribute("alias")].filter = event.target.value;
	if (this.value == '' || keyCode == 13)
		DBGridObj._printRows();
	else if (event.target.value.length >= aV.config.DBGrid.minCharsToFilter)
		DBGridObj._filterTimer = window.setTimeout("aV.DBGrid.list[%s]._printRows();".format(DBGridObj.guid), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._maxRowsInPageKeyUpHandler = function(event)
{
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target),
	    keyCode = (event.which)?event.which:event.keyCode;

	if (DBGridObj.properties.maxRowsInPageTimer)
		clearTimeout(DBGridObj.properties.maxRowsInPageTimer);

	if (keyCode == 27) //if esc
		event.target.value = aV.config.DBGrid.maxRowsInPage;
	
	if (keyCode == 13) //if enter
		DBGridObj.setMaxRowsInPage(parseInt(event.target.value));
	else if (event.target.value.length >= 0)
		DBGridObj.properties.maxRowsInPageTimer = window.setTimeout("aV.DBGrid.list[%0:s].properties.currentPage = 1;aV.DBGrid.list[%0:s].setMaxRowsInPage(%1:s);".format(DBGridObj.guid, event.target.value), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._pageInputKeyUpHandler = function(event)
{
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target),
	    keyCode = (event.which)?event.which:event.keyCode;

	if (DBGridObj._pageInputTimer)
		clearTimeout(DBGridObj._pageInputTimer);

	if (keyCode == 27)
		event.target.value = aV.config.DBGrid.page;
	
	if (keyCode == 13)
		DBGridObj.setPage(parseInt(event.target.value));
	else if (event.target.value.length >= 0)
		DBGridObj._pageInputTimer = window.setTimeout("aV.DBGrid.list[%0:s].setPage(%1:s);".format(DBGridObj.guid, event.target.value), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._pageControlsClickHandler = function(event)
{
	if (event.target.getAttribute("disabled") == 'true')
		return false;
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target);
	DBGridObj.setPage(DBGridObj.properties.currentPage + event.target.increment);
};

aV.DBGrid._addCaptionButton = function(tableElement, type, prefix)
{
	if (!prefix)
		prefix = "button";
	var name = prefix + type;
	tableElement[name] = document.createElement("a");
	tableElement[name].href = "javascript:void(0)";
	tableElement[name].className = aV.config.DBGrid.classNames[name];
	tableElement[name].appendChild(document.createTextNode(aV.config.DBGrid.texts[name]));
	tableElement[name].setAttribute("hint", aV.config.DBGrid.texts[name + "Hint"]);
	return tableElement.caption.appendChild(tableElement[name]);
};

aV.DBGrid._exportLinkClickHandler = function(event)
{
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target);
	DBGridObj.parameters[aV.config.DBGrid.exportTypeId] = event.target.type; 
	event.target.href = DBGridObj.getFullSourceURL();
	delete DBGridObj.parameters[aV.config.DBGrid.exportTypeId];
	return true;
};

aV.DBGrid._onAfterEditHandler = function(event)
{
	var DBGridObj = aV.DBGrid.getOwnerObject(event.target);
	if (!DBGridObj)
		return;
	
	DBGridObj.properties.row[event.target.parentNode.dataIndex][DBGridObj.properties.columnNames[event.target.cellIndex]] = event.responseObject.value;
};

aV.DBGrid.prototype.maxSortAccumulation = aV.config.DBGrid.maxSortAccumulation;
aV.DBGrid.prototype.error = false;

/* event definitions */
aV.DBGrid.prototype.onrowclick = null;
aV.DBGrid.prototype.onfetchbegin = null;
aV.DBGrid.prototype.onfetcherror = null;
aV.DBGrid.prototype.onfetchend = null;
aV.DBGrid.prototype.onparseerror = null;
aV.DBGrid.prototype.onprintbegin = null;
aV.DBGrid.prototype.onrowprint = null;
aV.DBGrid.prototype.onprintend = null;
aV.DBGrid.prototype.onsortbegin = null;
aV.DBGrid.prototype.onsortend = null;

aV.DBGrid.prototype.destroy = function()
{
	if (this.fetcher)
		aV.AJAX.destroyRequestObject(this.fetcher);

	if (this.tableElement)
	{
		var subElement, idFormat;
		for (idFormat in aV.config.DBGrid.idFormats)
		{
			if (!aV.config.DBGrid.idFormats.hasOwnProperty(idFormat))
				continue;
			subElement = document.getElementById(aV.config.DBGrid.idFormats[idFormat].format(this.guid));
			if (subElement)
				subElement.parentNode.removeChild(subElement);
		}
		this.tableElement.parentNode.removeChild(this.tableElement);
		delete this.tableElement;
	}
	aV.Events.clear(this);
	delete aV.DBGrid.list[this.guid];
};

aV.DBGrid.prototype.getFullSourceURL = function()
{
	var strParams;

	this._addStateToParameters();
	if (this.properties && this.properties.parameterEncoder == 'json' && this.parameters.toJSONStr) 
	{
		strParams = this.parameters.toJSONStr();
		if (this.properties.parameterCompression)
			strParams = ULZSS.encode(strParams);
		strParams = 'json=' + encodeURIComponent(Base64.encode(strParams));
		if (this.properties.parameterCompression)
			strParams = 'c=1&' + strParams;
	}
	else 
		strParams = this.parameters.toQueryString();
	return this.sourceURL + '?' + strParams;
};

aV.DBGrid.prototype.triggerEvent = function(type, parameters)
{
	if (!parameters)
		parameters = {};
	parameters = ({type: type,	target: this}).unite(parameters);
	var result = true;

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

	if (result !== false)
		aV.config.DBGrid.defaultEventHandler(parameters);
	return result;
};

aV.DBGrid.prototype.addRow = function(row, index)
{
	//TODO: Add event triggers (beforeAddRow, afterAddRow)
	if (!row)
	{
		row = [{}];
		for (var column in this.properties.columns)
			if (this.properties.columns.hasOwnProperty(column) && !this.properties.columns[column].hidden)
				row[0][column] = aV.config.DBGrid.texts.newCellText;
	}
	if (!(row instanceof Array))
		row = [row];
	if (typeof index != "number")
		index = this.properties.row.length;
	this.properties.row = this.properties.row.slice(0, index).concat(row, this.properties.row.slice(index));
	this._printRows();
};

aV.DBGrid.prototype.deleteRow = function(index)
{
	//TODO: Add event triggers (beforeDeleteRow, afterDeleteRow)
	if (!(index instanceof Array))
		index = [index];
	else
		index.sort();
	
	var currentIndex = 0,
	    newRows = [],
			i;

	for (i = 0; i < index.length; i++)
	{
		newRows = newRows.concat(this.properties.row.slice(currentIndex, index[i]));
		currentIndex = index[i]+1;
	}
	this.properties.row = newRows.concat(this.properties.row.slice(currentIndex));
	
	this._printRows();
};

aV.DBGrid.prototype._addExportButton = function(type)
{
	var button = document.createElement("a");
	
	button.type = type;
	button.href = 'javascript:void(0)';
	aV.Events.add(button, "click", aV.DBGrid._exportLinkClickHandler);
	
	button.className = aV.config.DBGrid.classNames.buttonExport.format(type);
	button.appendChild(document.createTextNode(this.properties.exports[type].alias || type));
	if (this.properties.exports[type].forceNewWindow) //exception for html
		button.target = "_blank";
	return this.tableElement.caption.appendChild(button);
};

aV.DBGrid.prototype._addStateToParameters = function()
{
	if (this.properties)
	{
		//collect visible columns
		var activeColumns = [],
		    column;

		for (column in this.properties.columns)
			if (this.properties.columns.hasOwnProperty(column) && !this.properties.columns[column].hidden)
				activeColumns.push(column);

		this.parameters.columns = activeColumns;
	}
};

/**
 * Fetches the data from the address given in sourceURL
 * property, with posting the parameters given in
 * parameters property.
 * @method
 * @param {Boolean} [fullRefresh] If true, the DHTML table is regenerated after the data is fetched.
 */
aV.DBGrid.prototype.refreshData = function(fullRefresh, preserveState)
{
	if (this.fetcher)
		aV.AJAX.destroyRequestObject(this.fetcher);
	
	var self = this,
	    supportedMimeTypes = [],
			mimeType,
			loadingFunction,
			completedFunction;

	if (preserveState !== false)
		this._addStateToParameters();
	else
		this._printInfo.start = this._printInfo.end = 0;
	
	for (mimeType in aV.config.AJAX.dataParsers)
		if (aV.config.AJAX.dataParsers.hasOwnProperty(mimeType))
			supportedMimeTypes.push(mimeType);

	loadingFunction = function(requestObject)
	{
		self.triggerEvent("fetchbegin", {status: 'loading'});
		self.fetcher = requestObject;
	};
	
	completedFunction = function(requestObject, rangeInfo)
	{
		if (rangeInfo && ((rangeInfo.end + 1) >= rangeInfo.total) && self.loadingData)
			delete self.loadingData;
		else
			self.loadingData = rangeInfo;				
		
		if (!aV.AJAX.isResponseOK(requestObject, supportedMimeTypes))
		{
			self.triggerEvent("fetcherror", {status: 'error', messages: [requestObject.status, requestObject.responseText.stripHTML()], forceInfoBox: true});
			delete self.fetcher;
			return false;
		}

		self.triggerEvent("fetchend", {status: 'info'});
		if (!rangeInfo || rangeInfo.start === 0)
			self.parseData(fullRefresh, preserveState);
		else if (rangeInfo.type == 'rows')
		{
			var parsedData = aV.AJAX.getResponseAsObject(requestObject);
			if (!parsedData || !parsedData.row)
				throw new Error("Invalid DBGrid data.", self.getFullSourceURL());
			self.properties.row = self.properties.row.concat(parsedData.row);
			
			if ((rangeInfo.start >= self._printInfo.start && rangeInfo.start <= self._printInfo.end) || (((rangeInfo.end + 1) >= rangeInfo.total) && self.properties.sort.length)) 
			{
				if (self.properties.sort.length)
					self._sortRows();
				self._printRows();
			}
			else 
				self._updateInfoFields();
		}
		else
			return false;
		
		delete self.fetcher;
	};
	
	this.fetcher = aV.AJAX.makeRequest(
		"POST",
		this.sourceURL,
		this.parameters,
		completedFunction,
		loadingFunction,
		null,
		false
	);
};

aV.DBGrid._assureColumnFunction = function(column, functionName, defaultFunction)
{
	//convert the given function body to a Function object if it is a string
	if (typeof column[functionName] == 'string')
		column[functionName] = new Function("a", "b", column[functionName]);
	if (!(column[functionName] instanceof Function))
		column[functionName] = defaultFunction;
};

aV.DBGrid.prototype.parseData = function(fullRefresh, preserveState)
{
	var eventType, i, parsedData, column, grouperFunction;
	fullRefresh = (fullRefresh || !this.tableElement);
	
	//remove previously added dynamic event handlers
	if (this.properties && this.properties.eventHandlers)
		for (eventType in this.properties.eventHandlers)
			if (this.properties.eventHandlers.hasOwnProperty(eventType))
				for (i = 0; i < this.properties.eventHandlers[eventType].length; i++)
					aV.Events.remove(this, eventType, this.properties.eventHandlers[eventType][i]);
	
	if ((fullRefresh && preserveState === false) || !this.properties) 
		this.properties = {};
	else 
	{
		delete this.properties.row;
		if (fullRefresh)
			delete this.properties.columns;
	}
	
	this.error = false;
	
	try
	{
		parsedData = aV.AJAX.getResponseAsObject(this.fetcher);
		if (!parsedData)
			throw new Error("Invalid DBGrid data.", this.getFullSourceURL());
		this.properties.unite(parsedData, false);

		if (!this.properties.row)
			this.properties.row = [];
		else if (!(this.properties.row instanceof Array))
			this.properties.row = [this.properties.row];
		if (!this.properties.maxRowsInPage)
			this.properties.maxRowsInPage = aV.config.DBGrid.maxRowsInPage;
		if (!this.properties.currentPage)
			this.properties.currentPage = 1;
		
		this.properties.columnNames = [];
		for (column in this.properties.columns) 
		{
			if (!this.properties.columns.hasOwnProperty(column)) 
				continue;
			this.properties.columns[column].index = this.properties.columnNames.push(column)-1;
			
			aV.DBGrid._assureColumnFunction(this.properties.columns[column], 'comparator', aV.config.DBGrid.compareFunctions["dt_" + this.properties.columns[column].dataType] || aV.config.DBGrid.compareFunctions.dt_default);
			aV.DBGrid._assureColumnFunction(this.properties.columns[column], 'filterFunction', aV.config.DBGrid.filterFunctions["dt_" + this.properties.columns[column].dataType] || aV.config.DBGrid.filterFunctions.dt_default);

			if (this.properties.columns[column].dontGroup)
				grouperFunction = aV.config.DBGrid.groupFunctions.dontGroup;
			else if (this.properties.columns[column].dontSum || !(("dt_" + this.properties.columns[column].dataType) in aV.config.DBGrid.groupFunctions))
				grouperFunction = aV.config.DBGrid.groupFunctions.dt_default;
			else
				 grouperFunction = aV.config.DBGrid.groupFunctions["dt_" + this.properties.columns[column].dataType];
			aV.DBGrid._assureColumnFunction(this.properties.columns[column], 'grouper', grouperFunction);
			
			if (!this.properties.columns[column].title)
				this.properties.columns[column].title = column.replace(/_/g, " ").ucWords();
		}
		
		//add dynamic event handlers
		if (this.properties.eventHandlers)
			for (eventType in this.properties.eventHandlers)
				if (this.properties.eventHandlers.hasOwnProperty(eventType))
				{
					if (!(this.properties.eventHandlers[eventType] instanceof Array)) 
						this.properties.eventHandlers[eventType] = [this.properties.eventHandlers[eventType]];
					for (i = 0; i < this.properties.eventHandlers[eventType].length; i++) 
					{
						if ((typeof this.properties.eventHandlers[eventType][i]) == "string")
							this.properties.eventHandlers[eventType][i] = new Function("event", this.properties.eventHandlers[eventType][i]);
						if (!(this.properties.eventHandlers[eventType][i] instanceof Function)) 
							continue;
						aV.Events.add(this, eventType, this.properties.eventHandlers[eventType][i]);
					}
				}

		if (!(this.properties.sort instanceof Array))
			if (this.properties.sort)
				this.properties.sort = [this.properties.sort];
			else
				this.properties.sort = [];

		if (this.properties.sort.length)
			this._sortRows();

	}
	catch(e)
	{
		this.error = e;
		this.triggerEvent("parseerror", {status: 'error',	messages: [200, this.error.message], forceInfoBox: true});
	}

	finally
	{
		if (!this.error && this.printAfterParse) 
		{
			if (fullRefresh) 
				this._print(false);
			else
				this._printRows();
		}
		return !this.error;
	}
};

aV.DBGrid.prototype.setMaxRowsInPage = function(newMaxRowsInPage)
{
	if (newMaxRowsInPage < 1 || newMaxRowsInPage != Math.round(newMaxRowsInPage))
		return false;
	this.properties.maxRowsInPage = newMaxRowsInPage;
	this._printRows();
	return this.properties.maxRowsInPage;
};

aV.DBGrid.prototype.setPage = function(newPage)
{
	if (newPage < 1 || this.properties.currentPage == newPage || newPage != Math.round(newPage) || newPage > Math.ceil(this.rowCount/this.properties.maxRowsInPage))
		return false;
	
	var incremental = this.properties.grouped,
	    column;
	if (!incremental) //check for filter to decide whether we need incremental paging or standrt paging
		for (column in this.properties.columns)
			if (this.properties.columns.hasOwnProperty(column) && this.properties.columns[column].filter)
			{
				incremental = true;
				break;
			}

	if (incremental) 
	{
		this.properties.currentPage = 1;
		this._printInfo.end = -1;
		this._printInfo.reduction = 0;
		for (; this.properties.currentPage <= newPage && this._printInfo.end < this.properties.row.length; this.properties.currentPage++) 
			this._printRows(true, this._printInfo.end + 1, undefined, undefined, this.properties.currentPage != newPage, true);
		this.properties.currentPage--;
	}
	else
	{
		this.properties.currentPage = newPage;
		this._printRows(true, (this.properties.currentPage - 1)*this.properties.maxRowsInPage);
	}
	return this.properties.currentPage;
};

aV.DBGrid.prototype._print = function(clear, element)
{
	if (!this._printCache)
	{
		if (element)
		{
			if (typeof element == 'string')
				element = document.getElementById(element);
		}
		else if (this.printElement)
			element = this.printElement;
		else
			return false;
		
		if (clear !== false)
			clear = true;
			
		this.triggerEvent("printbegin", {status: 'loading'});
		
		this._printCache = [clear, element];
		window.setTimeout("aV.DBGrid.list[" + this.guid + "]._print();", 0);
		return;
	}
	else
	{
		element = this._printCache[1];
		clear = this._printCache[0];
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
	var newRow, newCell, newLi, newLabel, newCheckbox, column, exportType, visibleColCount = 0;

	this.tableElement = document.createElement("table");
	this.tableElement.guid = this.guid;
	this.tableElement.className = aV.config.DBGrid.classNames.general;
	
	this.tableElement.appendChild(document.createElement("caption"));
	
	this.tableElement.columnList = document.body.appendChild(document.createElement("ul"));
	this.tableElement.columnList.guid = this.guid;
	this.tableElement.columnList.id = aV.config.DBGrid.idFormats.columnList.format(this.guid);
	this.tableElement.columnList.className = aV.config.DBGrid.classNames.columnList;
	this.tableElement.columnList.style.height = "0";
	aV.CSS.setOpacity(this.tableElement.columnList, 0);

	/* Start creating the buttons */
	/* ColumnList button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "ColumnList"), "click", aV.DBGrid._columnManagerClickHandler);
	/* Show/Hide Filters Button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "Filter"), "click", function() {aV.Visual.toggle(this.parentNode.parentNode.tHead.filterRow);});
	/* GroupAll / UngroupAll button */
	aV.Events.add(aV.DBGrid._addCaptionButton(this.tableElement, "GroupAll"), "click", aV.DBGrid._groupButtonClickHandler);

	/* Export buttons */
	if (this.properties.exports)
	{
		for (exportType in this.properties.exports)
			if (this.properties.exports.hasOwnProperty(exportType))
				this._addExportButton(exportType);
	}

	/* End of button definitions */
	
	this.tableElement.captionTitle = this.tableElement.caption.appendChild(document.createElement("div"));
	this.tableElement.captionTitle.className = aV.config.DBGrid.classNames.captionTitle;

	this.tableElement.statusArea = this.tableElement.caption.appendChild(document.createElement("div"));
	this.tableElement.statusArea.className = aV.config.DBGrid.classNames.statusArea;
	
	this.tableElement.setColumnVisibility = function(column, visible)
	{
		var displayState = (visible)?'':'none',
		    DBGridObj = aV.DBGrid.getOwnerObject(this),
		    colIndex = DBGridObj.properties.columns[column].index,
		    i;

		for (i = DBGridObj.tableElement.tHead.rows.length-1; i >= 0; i--)
			this.tHead.rows[i].cells[colIndex].style.display = displayState;

		for (i = DBGridObj.tableElement.tFoot.rows.length-1; i >= 0 ; i--)
			this.tFoot.rows[i].cells[0].colSpan += (visible)?1:-1;
 
		for (i = DBGridObj.tableElement.tBodies[0].rows.length-1; i >= 0 ; i--)
			this.tBodies[0].rows[i].cells[colIndex].style.display = displayState;

		DBGridObj.properties.columns[column].hidden =! visible;
		if (visible && DBGridObj.properties.row.length && !(column in DBGridObj.properties.row[0]))
			DBGridObj.refreshData();
	};
	
	this.tableElement.appendChild(document.createElement("thead"));
	this.tableElement.tHead.filterRow = this.tableElement.tHead.appendChild(document.createElement('tr'));
	this.tableElement.tHead.filterRow.className = aV.config.DBGrid.classNames.filterRow;
	this.tableElement.tHead.filterRow.style.display = 'none';
	
	newRow = this.tableElement.tHead.appendChild(document.createElement('tr'))
	for (column in this.properties.columns)
	{
		if (!this.properties.columns.hasOwnProperty(column))
			continue;
		
		newLi = this.tableElement.columnList.appendChild(document.createElement("LI"));
		
		newLabel = document.createElement("label");
		newLabel.setAttribute("for", aV.config.DBGrid.idFormats.columnControl.format(this.guid, column));
		newLabel.appendChild(document.createTextNode(this.properties.columns[column].title.trimToLength(aV.config.DBGrid.maxCharsInColumnList)));
		newLabel.setAttribute("title", this.properties.columns[column].title);

		newCheckbox = document.createElement("input");
		newCheckbox.type = "checkbox";
		newCheckbox.id = newLabel.getAttribute("for");
		newCheckbox.column = column;
		newCheckbox.onclick = function()
		{
			aV.DBGrid.list[this.parentNode.parentNode.guid].tableElement.setColumnVisibility(this.column, this.checked);
		};

		newLi.appendChild(newCheckbox);
		newLi.appendChild(newLabel);

		newCheckbox.checked =! this.properties.columns[column].hidden;

		newCell = newRow.appendChild(document.createElement('td'));

		newCell.appendChild(document.createTextNode(this.properties.columns[column].title));
		newCell.setAttribute("alias", column);
		newCell.title = this.properties.columns[column].title;
		aV.Events.add(newCell, "click", aV.DBGrid._columnHeaderClickHandler);
		aV.Events.add(newCell, "mousemove", aV.DBGrid._titleMouseMoveHandler);
		aV.Events.add(newCell, "mousedown", aV.DBGrid._lockResize);
		
		if (this.properties.columns[column].width)
			newCell.style.width = this.properties.columns[column].width + "px";
		
		newCell.filterBox = this.tableElement.tHead.filterRow.appendChild(document.createElement('td')).appendChild(document.createElement("input"));
		newCell.filterBox.columnHeader = newCell;
		
		if (this.properties.columns[column].hidden)
		{
			newCell.style.display = 'none';
			newCell.filterBox.parentNode.style.display = 'none';
		}
		else
			visibleColCount++;
		
		aV.Events.add(newCell.filterBox, "keyup", aV.DBGrid._filterBoxKeyUpHandler);
	}
	this.tableElement.dummyColumn = [this.tableElement.tHead.rows[0].appendChild(document.createElement('td')), this.tableElement.tHead.rows[1].appendChild(document.createElement('td'))];
	this.tableElement.dummyColumn.each(function(element){element.className = aV.config.DBGrid.classNames.dummyColumn; return element});
	
	this.tableElement.appendChild(document.createElement("tfoot"));
	/* footer cell */
	this.tableElement.tFoot.appendChild(document.createElement('tr')).appendChild(document.createElement('td'));
	if (visibleColCount > 1)
		this.tableElement.tFoot.rows[0].cells[0].colSpan = visibleColCount;
	
	//TODO: Make the below part a seperate function or iterations of a function
	this.tableElement.tFoot.rowInfo = this.tableElement.tFoot.rows[0].cells[0].appendChild(document.createElement("DIV"));
	this.tableElement.tFoot.pageControls = this.tableElement.tFoot.rows[0].cells[0].appendChild(document.createElement("DIV"));
	this.tableElement.tFoot.pageControls.className = aV.config.DBGrid.classNames.pageControls;
	/* max rows in page part */
	this.tableElement.tFoot.pageControls.appendChild(document.createTextNode(aV.config.DBGrid.texts.maxRowsInPage));
	this.tableElement.tFoot.pageControls.maxRowsInPage = document.createElement("INPUT");
	this.tableElement.tFoot.pageControls.maxRowsInPage.type = "TEXT";
	this.tableElement.tFoot.pageControls.maxRowsInPage.className = aV.config.DBGrid.classNames.maxRowsInPageInput;
	aV.Events.add(this.tableElement.tFoot.pageControls.maxRowsInPage, "keyup", aV.DBGrid._maxRowsInPageKeyUpHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.maxRowsInPage);
	/* pages part */
	this.tableElement.tFoot.pageControls.previousPage = document.createElement('A');
	this.tableElement.tFoot.pageControls.previousPage.className = aV.config.DBGrid.classNames.previousPage;
	this.tableElement.tFoot.pageControls.previousPage.href = "javascript:void(0)";
	this.tableElement.tFoot.pageControls.previousPage.appendChild(document.createTextNode(aV.config.DBGrid.texts.previousPage));
	this.tableElement.tFoot.pageControls.previousPage.increment=-1;
	aV.Events.add(this.tableElement.tFoot.pageControls.previousPage, "click", aV.DBGrid._pageControlsClickHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.previousPage);
	
	this.tableElement.tFoot.pageControls.page = document.createElement("INPUT");
	this.tableElement.tFoot.pageControls.page.type = "TEXT";
	this.tableElement.tFoot.pageControls.page.className = aV.config.DBGrid.classNames.pageInput;
	aV.Events.add(this.tableElement.tFoot.pageControls.page, "keyup", aV.DBGrid._pageInputKeyUpHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.page);
	
	this.tableElement.tFoot.pageControls.nextPage = document.createElement('A');
	this.tableElement.tFoot.pageControls.nextPage.className = aV.config.DBGrid.classNames.nextPage;
	this.tableElement.tFoot.pageControls.nextPage.href = "javascript:void(0)";
	this.tableElement.tFoot.pageControls.nextPage.appendChild(document.createTextNode(aV.config.DBGrid.texts.nextPage));
	this.tableElement.tFoot.pageControls.nextPage.increment = 1;
	aV.Events.add(this.tableElement.tFoot.pageControls.nextPage, "click", aV.DBGrid._pageControlsClickHandler);
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.nextPage);
	
	this.tableElement.tFoot.pageControls.totalPageCount = document.createElement("SPAN");
	this.tableElement.tFoot.pageControls.appendChild(this.tableElement.tFoot.pageControls.totalPageCount);
	
	this.tableElement.appendChild(document.createElement("tbody"));
	this._printRows();
	
	element.appendChild(this.tableElement);
};

aV.DBGrid.prototype._updateInfoFields = function()
{
	var tableBody = this.tableElement.tBodies[0],
	    correctedLength = this.properties.row.length - this._printInfo.reduction,
	    correctedStart = this._printInfo.end - this._printInfo.reduction - tableBody.rows.length + 1,
		  totalPages = Math.ceil(correctedLength / this.properties.maxRowsInPage);
	
	this.tableElement.captionTitle.innerHTML = '';
	this.tableElement.captionTitle.appendChild(document.createTextNode(aV.config.DBGrid.texts.title.format(this.properties.caption || aV.config.DBGrid.texts.defaultTitle, this.properties.row.length, (this.loadingData)?((isNaN(this.loadingData.total))?'*':this.loadingData.total):this.properties.row.length)));
	
	this.tableElement.tFoot.rowInfo.innerHTML = aV.config.DBGrid.texts.footerRowCount.format(correctedStart + 1, correctedStart + tableBody.rows.length, tableBody.rows.length, correctedLength);
	this.tableElement.tFoot.pageControls.maxRowsInPage.value = this.properties.maxRowsInPage;
	this.tableElement.tFoot.pageControls.page.value = this.properties.currentPage;
	this.tableElement.tFoot.pageControls.totalPageCount.innerHTML = aV.config.DBGrid.texts.totalPages.format(totalPages);
	this.tableElement.tFoot.pageControls.previousPage.setAttribute("disabled", this.properties.currentPage < 2);
	this.tableElement.tFoot.pageControls.previousPage.disabled = this.properties.currentPage < 2;
	this.tableElement.tFoot.pageControls.nextPage.setAttribute("disabled", this.properties.currentPage >= totalPages);
	this.tableElement.tFoot.pageControls.nextPage.disabled = this.properties.currentPage >= totalPages;
};

aV.DBGrid.prototype.sortData = function(column, direction)
{
	if (!this._sortCache)
	{
		if (typeof direction != 'number')
			direction = (this.properties.sort.length && this.properties.sort[0].column === column)?-this.properties.sort[0].direction:1;
		
		if (!this.properties.columns || !this.properties.row || (this.properties.sort.length && this.properties.sort[0].column === column && this.properties.sort[0].column === direction))
			return false;
		
		this.triggerEvent("sortbegin", {status: 'loading', column: column, direction: direction});

		if (this.properties.sort.length)
			this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[this.properties.columns[this.properties.sort[0].column].index].className = '';

		this._sortCache = [column, direction];
		var self = this;
		window.setTimeout(function(){self.sortData()}, 0);
		return;
	}
	else
	{
		direction = this._sortCache[1];
		column = this._sortCache[0];
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
			this.properties.sort = this.properties.sort.slice(0, this.maxSortAccumulation - 1);
	}
	else
		this.properties.sort[0].direction = direction;
	
	this._sortRows();

	this.triggerEvent("sortend", {status: 'info'});
	
	this._printRows();
};

aV.DBGrid.prototype.changeGroupedState = function(grouped)
{
	if (grouped === undefined)
		grouped = !this.properties.grouped;
	
	if (!this.tableElement || !(this.properties.grouped ^ grouped) || !this.properties.sort.length)
		return false;

	this.properties.grouped = grouped;
	this.properties.currentPage = 1;
	this._printRows(true, 0);
};

aV.DBGrid.prototype._setGroupButtonState = function()
{
	var name = (this.properties.grouped) ? 'UngroupAll' : 'GroupAll';
	this.tableElement.buttonGroupAll.removeChild(this.tableElement.buttonGroupAll.firstChild);
	this.tableElement.buttonGroupAll.appendChild(document.createTextNode(aV.config.DBGrid.texts['button' + name]));
	this.tableElement.buttonGroupAll.className = aV.config.DBGrid.classNames['button' + name];
	this.tableElement.buttonGroupAll.setAttribute('hint', aV.config.DBGrid.texts['button' + name + 'Hint']);
};

aV.DBGrid.prototype._sortRows = function()
{
	if (!this.properties.sort.length)
		return;
	var currentObject = this;
	this.properties.row.sort(
		function(row1, row2)
		{
			var result = 0, i;
			for (i = 0; i < currentObject.properties.sort.length && !result; i++) 
				result = currentObject.properties.columns[currentObject.properties.sort[i].column].comparator(row1[currentObject.properties.sort[i].column], row2[currentObject.properties.sort[i].column])*currentObject.properties.sort[i].direction;
			return result;
		}
	);
};

aV.DBGrid.prototype._adjustHeight = function()
{
	if (!this.tableElement)	return;

	var tableBody = this.tableElement.tBodies[0],
	    maxBodyHeight = (this.properties.maxBodyHeight !== undefined)?this.properties.maxBodyHeight:aV.config.DBGrid.maxBodyHeight,
	    calculatedHeight = (maxBodyHeight > 0)?maxBodyHeight:aV.DOM.windowClientHeight() - this.tableElement.caption.offsetHeight - this.tableElement.tHead.offsetHeight - this.tableElement.tFoot.offsetHeight - 10
	//IE conditional comments to force unlimited height
	/*@cc_on
	calculatedHeight = 0;
	@*/

	if (!calculatedHeight || !this.properties.row.length || tableBody.scrollHeight <= calculatedHeight) 
	{
		tableBody.style.height = 'auto';
		this.tableElement.dummyColumn.each(function(element){element.style.display = 'none'; return element;});
	}
	else
	{
		tableBody.style.height = calculatedHeight + 'px';
		this.tableElement.dummyColumn.each(function(element){element.style.display = ''; return element;});
	}
};

aV.DBGrid.prototype._printRows = function(clear, i, count, insertBefore, pseudo, incremental)
{
	//console.time('DBGrid[' + this.guid + ']._printRows');
	if (!this.tableElement)
		return false;
	
	if (clear !== false)
		clear = !pseudo;

	if (typeof i != 'number' || isNaN(i))
		i = this._printInfo.start;

	if (typeof count != 'number')
		count = this.properties.maxRowsInPage;

	var addedRows = 0,
	    tableBody = this.tableElement.tBodies[0],
	    filtered = false,
	    c, newRow, newCell, cellData, cellText, column, keyCell,
	    newCellStorage, lastKeyRow, lastKeyData, currentKeyData;
	
	if (clear)
		while (tableBody.firstChild)
			tableBody.removeChild(tableBody.firstChild);

	for (c = 0; c < this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells.length-1; c++)
		this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[c].className = '';
	
	if (this.properties.sort && this.properties.sort.length > 0)
		this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[this.properties.columns[this.properties.sort[0].column].index].className = (this.properties.sort[0].direction == 1)?aV.config.DBGrid.classNames.sortedAsc:aV.config.DBGrid.classNames.sortedDesc;
	else
		this.properties.grouped = false;

	if (this.properties.grouped)
		count++;

	this._printInfo.start = i;
	if (!pseudo) 
		var tempArea = document.createDocumentFragment();
	
	if (!incremental)
		this._printInfo.reduction = 0;

	for (; (addedRows < count && i < this.properties.row.length); i++)
	{
		newRow = document.createElement("tr");
		aV.Events.add(newRow, "click", aV.DBGrid._rowClickHandler);
		filtered = false;

		if (this.properties.sort.length > 0)
		{
			currentKeyData = this.properties.row[i][this.properties.sort[0].column];
			if (currentKeyData === lastKeyData) 
				newRow.parentRow = lastKeyRow || newRow;
			else 
			{
				newRow.parentRow = newRow;
				lastKeyData = currentKeyData;
			}
		}

		newCellStorage = {};
		for (column in this.properties.columns) 
		{
			if (!this.properties.columns.hasOwnProperty(column)) 
				continue;
			
			newCell = newCellStorage[column] = document.createElement("td");
			newCell.setAttribute("datatype", this.properties.columns[column].dataType);
			newCell.setAttribute("column", column);
			
			if (this.properties.columns[column].hidden) 
				newCell.style.display = 'none';
			
			
			cellData = (this.properties.row[i][column] !== undefined) ? this.properties.row[i][column] : aV.config.DBGrid.texts.emptyCellText;
			if (this.properties.columns[column].parseHTML) 
				newCell.innerHTML = cellData;
			else 
				newCell.appendChild(document.createTextNode(cellData));
			
			cellText = newCell.textContent || newCell.innerText || '';
			if (filtered = (filtered || this._applyFilter(cellText, column))) 
				break;
		}

		if (filtered) 
		{
			newRow = null;
			continue;
		}

		for (column in this.properties.columns)
		{
			if (!this.properties.columns.hasOwnProperty(column))
				continue;
			
			newCell = newCellStorage[column];
			delete newCellStorage[column];

			if (this.properties.grouped && (this.properties.sort[0].column != column) && !pseudo) 
			{
				if (newRow != newRow.parentRow) 
					this.properties.columns[column].grouper(newRow, newRow.parentRow.getElementsByTagName('td')[this.properties.columns[column].index], newCell.innerHTML);
				else 
				{
					if (lastKeyRow) 
					{
						keyCell = lastKeyRow.getElementsByTagName('td')[this.properties.columns[column].index];
						keyCell.innerHTML = keyCell.newInnerHTML;
					}
					newCell.newInnerHTML = newCell.lastStr = newCell.innerHTML;
				}
			}

			cellText = newCell.textContent || newCell.innerText || '';
			newCell.setAttribute("title", cellText);
			newRow.appendChild(newCell);
		}

		if (this.properties.grouped)
			if (newRow != newRow.parentRow) 
			{
				aV.DOM.addClass(newRow.parentRow, aV.config.DBGrid.classNames.groupedRow);
				newRow = null;
				continue;
			}
			else if (addedRows == count) 
			{
				i--;
				break;
			}

		lastKeyRow = newRow;
		newRow.dataIndex = i;
		addedRows++;
		
		if (!pseudo) 
		{
			tempArea.appendChild(newRow);
			this.triggerEvent("rowprint", 
			{
				row: newRow,
				rowData: this.properties.row[i],
				rowStart: this._printInfo.start,
				rowsAdded: addedRows
			});
		}
	}

	this._printInfo.end = i-1;
	this._printInfo.count = addedRows;
	this._printInfo.reduction += this._printInfo.end - this._printInfo.start - addedRows + 1;

	if (!pseudo) 
	{
		if (this.properties.grouped && lastKeyRow) 
			for (column in this.properties.columns) 
				if (this.properties.columns.hasOwnProperty(column) && this.properties.sort[0].column != column) 
				{
					keyCell = lastKeyRow.getElementsByTagName('td')[this.properties.columns[column].index];
					keyCell.innerHTML = keyCell.newInnerHTML;
					keyCell.newInnerHTML = undefined;
				}
		
		if (insertBefore) 
			tableBody.insertBefore(tempArea, insertBefore);
		else 
			tableBody.appendChild(tempArea);
		
		setTimeout("aV.DBGrid.list[%s]._adjustHeight();".format(this.guid), 0);
		this._setGroupButtonState();
		aV.Events.trigger(window, 'domready', 
		{
			caller: this,
			changedNode: tableBody
		});
		
		if (!insertBefore) 
			this._updateInfoFields();
		
		this.triggerEvent("printend", {status: 'info'});
	}
	
	//console.timeEnd('DBGrid[' + this.guid + ']._printRows');
	return newRow;
};

aV.DBGrid.prototype._applyFilter = function(value, column)
{
	var result = false;

	if (this.properties.columns[column].filterFunction && this.properties.columns[column].filter)
	{
		var filterStr = this.properties.columns[column].filter,
		    invert = (filterStr.charAt(0) == '!');
		
		if (invert || filterStr.charAt(0) == ' ')
			filterStr = filterStr.substr(1);
		
		result = this.properties.columns[column].filterFunction(value, filterStr, this.properties.columns[column]);
		
		if (invert)
			result =! result;
	}
	
	return result;
};

aV.DBGrid.prototype._setColumnWidth = function(colIndex, newWidth)
{
	for (var i = 0; i < this.tableElement.tHead.rows.length; i++)
		this.tableElement.tHead.rows[i].cells[colIndex].style.width = newWidth + "px";
};

aV.DBGrid.prototype.updateStatus = function(text, type, forceInfoBox)
{
	if (this.tableElement && !forceInfoBox) 
	{
		aV.Visual.infoBox.hide();
		this.tableElement.statusArea.innerHTML = ' <img src="%1:s" alt="(%0:s)"/>'.format(type, aV.config.Visual.infoBox.images[type]) + text;
	}
	else 
		aV.Visual.infoBox.show("DBGrid[%0:s] - ".format(this.guid) + text, aV.config.Visual.infoBox.images[type], false, aV.config.DBGrid.infoBoxTimeout);
};

aV.Events.add(document, "mouseup", aV.DBGrid._unlockResize);
aV.Events.add(document, "click", aV.DBGrid._documentClickHandler);
aV.Events.add(window, "resize", aV.DBGrid._windowResizeHandler);
aV.Events.add(document, "selectstart", function() {return !aV.DBGrid._activeResizer});
aV.Events.add(document, "dragstart", function() {return !aV.DBGrid._activeResizer});
if (aV.QuickEdit)
	aV.Events.add(aV.QuickEdit, "afteredit", aV.DBGrid._onAfterEditHandler);

for (var i = 0; i < aV.config.DBGrid.paths.css.length; i++)
	aV.AJAX.loadResource(aV.config.DBGrid.paths.css[i], "css", "aVDBGridCSS" + i);
