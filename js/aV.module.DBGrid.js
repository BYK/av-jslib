/**
 * @fileOverview Introduces the aV.DBGrid class which fetches and parses XML data
 * and creates a table from the data collected.
 * The generated tables have native sort, filter and grouping support.
 * @name aV.DBGrid
 *
 * @author Burak Yigit KAYA byk@amplio-vita.net
 * @version 1.8
 */

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
 * @param	 {String} dataAddress The address to the data XML
 * @param {String | Object} parameters Parameters for the POST call to the *dataAddress*
 * @param {HTMLObject} printElement The HTML container element where the created table will be placed
 * @param {Boolean} fetch Set true to fetch immediately when the object is created
 * @param {Boolean} print Set true to print the table immediately after the data is fetched.
 */
aV.DBGrid=function(dataAddress, parameters, printElement, fetch, print)
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
	this.dataAddress=dataAddress;
	
	/**
	 * Holds the POST parameters for the data source page whoese
	 * address is given in the dataAddress property.
	 * @type {String|Object}
	 */
	this.parameters=(parameters)?parameters:{};
	
	this.printElement=printElement;
	this.printAfterParse=this.parseDataAfterFetch=print;
	
	/* assign default event hadlers */
	aV.Events.add(this, "fetchbegin", aV.config.DBGrid.defaultEventHandlers.onfetchbegin);
	aV.Events.add(this, "fetcherror", aV.config.DBGrid.defaultEventHandlers.onfetcherror);
	aV.Events.add(this, "parseerror", aV.config.DBGrid.defaultEventHandlers.onparseerror);
	aV.Events.add(this, "printbegin", aV.config.DBGrid.defaultEventHandlers.onprintbegin);
	aV.Events.add(this, "printend", aV.config.DBGrid.defaultEventHandlers.onready);
	aV.Events.add(this, "sortbegin", aV.config.DBGrid.defaultEventHandlers.onsortbegin);
	aV.Events.add(this, "sortend", aV.config.DBGrid.defaultEventHandlers.onready);
	
	if (fetch)
		this.refreshData();
};

if (!aV.config.DBGrid)
	aV.config.DBGrid={};

aV.config.DBGrid.unite(
	{
		maxSortAccumulation: 4,
		resizeLockOffset: 10,
		minColWidth: 20, //show be >= 2*resizeLockOffset
		maxBodyHeight: 400,
		minCharsToFilter: 2,
		keyupTimeout: 200,
		maxRowsInPage: 25,
		texts:
		{
			defaultTableTitle: 'Untitled Table',
			footerRowCount: '%0:s..%1:s of %3:s row(s)',
			fetchError: 'An error occured while gathering the table data. Details are below:<br />',
			parseError: 'Table cannot be generated because the gathered table data is invalid.',
			fetching: 'Gathering data...',
			printing: 'Creating table...',
			sorting: 'Sorting table...',
			grouping: 'Groping rows...',
			ungrouping: 'Ungrouping rows...',
			ready: 'Table is ready to use.',
			columnList: 'Column Manager',
			columnListHint: 'You can set the visibility of the table columns from here',
			groupAll: 'Group all',
			groupAllHint: 'You can group all the rows <b>by the sorted column</b> which means you <u>should</u> sort the table first.<br />You can also group individual rows by double clicking on them.',
			ungroupAll: 'Ungroup all',
			ungroupAllHint: 'You can ungroup all the grouped rows by using this button.<br />You can also ungroup individual row groups by double clicking on them.',
			'export': 'Export',
			filter: 'Filter',
			filterHint: 'You can filter the rows using the filter boxes above the columns. You may use "!" as the "not" operator. You may also use numerical comparators such as "<", ">" in numerical fields. Filters are cumulative.',
			maxRowsInPage: 'Max. rows in page: ',
			totalPages: ' / %s',
			previousPage: ' ',
			nextPage: ' '
		},
		classNames:
		{
			general: 'aVDBGrid',
			columnList: 'aVDBGridColumnList',
			sortedAsc: 'sortedAsc',
			sortedDesc: 'sortedDesc',
			buttonColumnList: 'buttonColumnList',
			buttonGroupAll: 'buttonGroupAll',
			buttonUngroupAll: 'buttonUngroupAll',
			buttonExport: 'buttonExport',
			buttonFilter: 'buttonFilter',
			captionTitle: 'title',
			filterRow: 'filterRow',
			slider: 'slider',
			pageControls: 'pageControls',
			maxRowsInPageInput: 'maxRowsInPage',
			pageInput: 'page',
			previousPage: 'previousPage',
			nextPage: 'nextPage'
		},
		defaultEventHandlers:
		{
			onready: function(event)
			{
				aV.Visual.infoBox.show(aV.config.DBGrid.texts.ready, aV.config.Visual.infoBox.images.info);
			},
			onfetchbegin: function(event)
			{
				aV.Visual.infoBox.show(aV.config.DBGrid.texts.fetching, aV.config.Visual.infoBox.images.loading, true, 60000);
			},
			onfetcherror: function(event)
			{
				aV.Visual.infoBox.show(aV.config.DBGrid.texts.fetchError + '(' + event.target.fetcher.status + ') - ' + event.target.fetcher.responseText, aV.config.Visual.infoBox.images.error, false, 60000);
			},
			onparseerror: function(event)
			{
				aV.Visual.infoBox.show(aV.config.DBGrid.texts.parseError, aV.config.Visual.infoBox.images.error, false, 60000);
			},
			onprintbegin: function(event)
			{
				aV.Visual.infoBox.show(aV.config.DBGrid.texts.printing, aV.config.Visual.infoBox.images.info, true);
			},
			onsortbegin: function(event)
			{
				aV.Visual.infoBox.show(aV.config.DBGrid.texts.sorting, aV.config.Visual.infoBox.images.info, true);
			}
		},
		filterFunctions:
		{
			dt_default: function(value, filter)
			{
				value=value.toLowerCase();
				var expression=(filter.charAt(0)=='*');
				
				if (expression || (filter.charAt(0)==' '))
					filter=filter.substr(1);
				
				filter=new RegExp((expression)?filter:filter.escapeRegExp(), "gi");
		
				return !value.match(filter);
			},	
			dt_int: function(value, filter)
			{
				if (!isNaN(filter))
					filter='==' + filter;
				else if (filter.charAt(0)=='=' && !isNaN(filter.substr(1)))
					filter='=' + filter;
		
				if (filter.match(/^([><]+=*|==)\d+\.?\d*$/))
					return !eval('(' + value + filter + ')');
				else
					return false;
			},
			dt_real: function(value, filter)
			{
				if (!isNaN(filter))
					filter='==' + filter;
				else if (filter.charAt(0)=='=' && !isNaN(filter.substr(1)))
					filter='=' + filter;
		
				if (filter.match(/^([><]+=*|==)\d+\.?\d*$/))
					return !eval('(' + value + filter + ')');
				else
					return false;
			}
		},
		compareFunctions:
		{
			dt_default: function(str1, str2)
			{
				str1=str1.toLowerCase();
				str2=str2.toLowerCase();
				if (str1<str2)
					return -1;
				else if (str1>str2)
					return 1;
				else
					return 0;
			},
			dt_int: function(num1, num2)
			{
				num1=parseInt(num1);
				num2=parseInt(num2);
				return ((num1 - num2) || (isNaN(num1)?-1:1));
			},
			dt_real: function(num1, num2)
			{
				num1=parseFloat(num1);
				num2=parseFloat(num2);
				return ((num1 - num2) || (isNaN(num1)?-1:1));
			}
		}
	}
, false);

/**
 * The guid counter for Window.DBGrids array, do not touch.
 *
 * @private
 */
aV.DBGrid._lastGuid=1;

aV.DBGrid._activeResizer=false;

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

aV.DBGrid.list={};

aV.DBGrid.getOwnerObject=function(element)
{
	while (element!=document.body && element.tagName!="TABLE")
		element=element.parentNode;
	return aV.DBGrid.list[element.guid];
};

aV.DBGrid._columnManagerClickHandler=function(event)
{
	var columnList=event.target.parentNode.parentNode.columnList;
	columnList.style.left=aV.Visual.getElementPositionX(event.target) + "px";
	columnList.style.top=aV.Visual.getElementPositionY(event.target.parentNode.parentNode.tHead) + "px";
	if (columnList.style.height == "0px")
		aV.Visual.fadeNSlide(columnList, Math.min(columnList.scrollHeight, Math.round(event.target.parentNode.parentNode.offsetHeight*.75)), 1);
	else 
		aV.Visual.fadeNSlide(columnList, 0, -1);
};

aV.DBGrid._titleClickHandler=function(event)
{
	if (event.target.cancelClick) 
	{
		event.target.cancelClick=false;
		return false;
	}
	var table=this;
	while (table.tagName!="TABLE" && table.tagName!="HTML")
		table=table.parentNode;

	aV.DBGrid.list[table.guid].sortData(this.colIndex, false, true);
};

aV.DBGrid._titleMouseMoveHandler=function(event)
{
	var obj=event.target;
	if (aV.DBGrid._activeResizer==obj)
		return;
	var cellPosition=aV.Visual.getElementPositionX(obj);
	obj.initialPos=event.clientX;
	if ((cellPosition + obj.offsetWidth - event.clientX)<=aV.config.DBGrid.resizeLockOffset)
		obj.style.cursor="e-resize";
	else if ((event.clientX - cellPosition)<=aV.config.DBGrid.resizeLockOffset)
		obj.style.cursor="w-resize";
	else
		obj.style.cursor="";
};

aV.DBGrid._lockResize=function(event)
{
	var obj=event.target;
	var cellPosition=aV.Visual.getElementPositionX(obj);
	if ((cellPosition + obj.offsetWidth - event.clientX)>aV.config.DBGrid.resizeLockOffset && (event.clientX - cellPosition)>aV.config.DBGrid.resizeLockOffset)
		return;

	obj.visiblePrevSibling=obj.previousSibling
	while (obj.visiblePrevSibling && obj.visiblePrevSibling.style.display!='')
		obj.visiblePrevSibling=obj.visiblePrevSibling.previousSibling;
	if (obj.visiblePrevSibling)
		obj.visiblePrevSibling.visibleNextSibling=obj;
		
	obj.visibleNextSibling=obj.nextSibling
	while (obj.visibleNextSibling && obj.visibleNextSibling.style.display!='')
		obj.visibleNextSibling=obj.visibleNextSibling.nextSibling;

	aV.DBGrid._activeResizer = (event.clientX > (cellPosition + aV.config.DBGrid.resizeLockOffset)) ? obj : obj.visiblePrevSibling;

	if (!(aV.DBGrid._activeResizer && aV.DBGrid._activeResizer.visibleNextSibling)) 
	{
		aV.DBGrid._activeResizer = null;
		return false;
	}

	aV.DBGrid._activeResizer.initialWidth=(aV.DBGrid._activeResizer.style.width)?parseInt(aV.DBGrid._activeResizer.style.width):aV.DBGrid._activeResizer.offsetWidth;
	if (aV.DBGrid._activeResizer.visibleNextSibling)
		aV.DBGrid._activeResizer.visibleNextSibling.initialWidth=(aV.DBGrid._activeResizer.visibleNextSibling.style.width)?parseInt(aV.DBGrid._activeResizer.visibleNextSibling.style.width):aV.DBGrid._activeResizer.visibleNextSibling.offsetWidth;

	aV.DBGrid._activeResizer.initialPos=event.clientX;
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

	var change=event.clientX - obj.initialPos;
	
	if ((obj.initialWidth + change)<aV.config.DBGrid.minColWidth || (obj.visibleNextSibling && (obj.visibleNextSibling.initialWidth - change)<aV.config.DBGrid.minColWidth))
		return false;

	if (obj.visibleNextSibling)
		aV.DBGrid.list[obj.parentNode.parentNode.parentNode.guid]._setColumnWidth(obj.visibleNextSibling.colIndex, obj.visibleNextSibling.initialWidth - change);
	aV.DBGrid.list[obj.parentNode.parentNode.parentNode.guid]._setColumnWidth(obj.colIndex, obj.initialWidth + change);
};

aV.DBGrid._rowGrouper=function(event)
{
	var table=this;
	while (table.tagName!="TABLE" && table.tagName!="HTML")
		table=table.parentNode;
	var groupHeader=this.parentRow;
	if (!groupHeader)
		return false;
		
	if (groupHeader.groupCount)
		aV.DBGrid.list[table.guid]._ungroupRows(groupHeader);
	else
		aV.DBGrid.list[table.guid]._groupRows(groupHeader);
};

aV.DBGrid._rowClickHandler=function(event)
{
	var table=this;
	while (table.tagName!="TABLE" && table.tagName!="HTML")
		table=table.parentNode;
	var selectable=true;
	
	if (aV.DBGrid.list[table.guid].onrowclick)
	{
		var rowData={};
		for (var i=0; i<aV.DBGrid.list[table.guid].colCount; i++)
			rowData[aV.DBGrid.list[table.guid].columns[i].tagName]=this.cells[i].innerHTML.BRtoLB();
		
		if (aV.DBGrid.list[table.guid].triggerEvent("rowclick", {rowData: rowData})===false)
			selectable=false;
	}
	
	if (selectable)
	{
		if (table.selectedIndex>=0 && table.rows[table.selectedIndex])
			table.rows[table.selectedIndex].className='';
		
		table.selectedIndex=this.rowIndex;
		this.className='selected';
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
	
	DBGridObj.columnProperties[event.target.columnHeader.colIndex].filter=event.target.value;
	if (this.value=='' || keyCode==13)
		DBGridObj._printRows();
	else if (event.target.value.length>=aV.config.DBGrid.minCharsToFilter)
		DBGridObj._filterTimer=window.setTimeout("aV.DBGrid.list[%s]._printRows();".format(DBGridObj.guid), aV.config.DBGrid.keyupTimeout);
};

aV.DBGrid._maxRowsInPageKeyUpHandler=function(event)
{
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	if (DBGridObj._maxRowsInPageTimer)
		clearTimeout(DBGridObj._maxRowsInPageTimer);
	var keyCode=(event.which)?event.which:event.keyCode;
	if (keyCode == 27)
		event.target.value=aV.config.DBGrid.maxRowsInPage;
	
	if (keyCode==13)
		DBGridObj.setMaxRowsInPage(parseInt(event.target.value));
	else if (event.target.value.length>=0)
		DBGridObj._maxRowsInPageTimer=window.setTimeout("aV.DBGrid.list[%0:s]._currentPage=1;aV.DBGrid.list[%0:s].setMaxRowsInPage(%1:s);".format(DBGridObj.guid, event.target.value), aV.config.DBGrid.keyupTimeout);
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
	var DBGridObj=aV.DBGrid.getOwnerObject(event.target);
	DBGridObj.setPage(DBGridObj._currentPage+event.target.increment);
};

/**
 * The column index which the data will be sorted by.
 * Would be boolean false if no column is set.
 * @type {integer}
 */
aV.DBGrid.prototype.sortBy=[];

aV.DBGrid.prototype.sortDirection=[];

aV.DBGrid.prototype._activeCompareFunction=[];

aV.DBGrid.prototype.maxSortAccumulation=aV.config.DBGrid.maxSortAccumulation;
aV.DBGrid.prototype.error=false;

/* event definitions */
aV.DBGrid.prototype.onrowclick=null;
aV.DBGrid.prototype.onfetchbegin=null;
aV.DBGrid.prototype.onfetcherror=null;
aV.DBGrid.prototype.onfetchend=null;
aV.DBGrid.prototype.onparseerror=null;
aV.DBGrid.prototype.onprintbegin=null;
aV.DBGrid.prototype.onprintend=null;
aV.DBGrid.prototype.onsortbegin=null;
aV.DBGrid.prototype.onsortend=null;


aV.DBGrid.prototype.triggerEvent=function(type, parameters)
{
	if (this["on" + type]) 
	{
		if (!parameters)
			parameters={};
		parameters.unite({type: type,	target: this});
		return this["on" + type](parameters);
	}
};

/**
 * Fetches the data from the address given in dataAddress
 * property, with posting the parameters given in
 * parameters property.
 * @method
 * @param {Boolean} [fullRefresh] If true, the DHTML table is regenerated after the data is fetched.
 */
aV.DBGrid.prototype.refreshData=function(fullRefresh)
{
	delete this.data;
	
	var self=this;
	
	this.triggerEvent("fetchbegin");
	 
	this.fetcher=aV.AJAX.makeRequest(
		"POST",
		this.dataAddress,
		this.parameters,
		function(requestObject)
		{

			self.loadingData=false;				
			if (!aV.AJAX.isResponseOK(requestObject))
			{
				self.triggerEvent("fetcherror");
				delete self.fetcher;
				return;
			}
			self.data=requestObject.responseXML;
			delete self.fetcher;
			
			self.triggerEvent("fetchend");
			
			if (self.parseDataAfterFetch)
				self.parseData(fullRefresh);
		}
	);
};

aV.DBGrid.prototype.getExportLink=function(type)
{
	var params=this.parameters || {};
	if (typeof params=='object')
		params=params.toQueryString();
	params+='&type=' + encodeURIComponent(type);
	
	return this.dataAddress + '?' + params;
};

aV.DBGrid.prototype.parseData=function(fullRefresh)
{
	fullRefresh=(fullRefresh || !this.tableElement);
	if (fullRefresh) 
	{
		delete this.columnProperties;
		delete this.columns;
		delete this.colCount;
		delete this.exportTypes;
		
		this.sortBy=[];
		this.sortDirection=[];
	}
	
	delete this.rows;
	delete this.rowCount;
	
	this.error=false;
	
	try
	{
		if (fullRefresh) 
		{
			this.columns = aV.AJAX.XML.toArray(this.data.getElementsByTagName("columns")[0].childNodes);
			this.columnProperties = new Array(this.columns.length);
			this.colCount = this.columns.length;
			for (var i=0; i<this.colCount; i++)
			{
				this.columnProperties[i]=
				{
					dataType: aV.AJAX.XML.getValue(this.columns[i], "data_type"),
					hidden: (aV.AJAX.XML.getValue(this.columns[i], "visible")==="0"),
					dontSum: (aV.AJAX.XML.getValue(this.columns[i], "dontSum")==="1"),
					parseHTML: (aV.AJAX.XML.getValue(this.columns[i], "parseHTML")==="1"),
					width: aV.AJAX.XML.getValue(this.columns[i], "width", ''),
					filter: ''
				};
				
				this.columnProperties[i].filterFunction = aV.config.DBGrid.filterFunctions["dt_" + this.columnProperties[i].dataType] || aV.config.DBGrid.filterFunctions.dt_default;
			}
		}
		
		this.exportTypes=aV.AJAX.XML.getValue(this.data, "exportTypes", '');
		if (this.exportTypes != '') 
		{
			this.exportTypes = this.exportTypes.split(',');
			this.exportLinksHTML = '<div style="min-width: 25px;">';
			for (var i = 0; i < this.exportTypes.length; i++) 
				this.exportLinksHTML += '<a href="' + this.getExportLink(this.exportTypes[i]) + '" target="_blank">' + this.exportTypes[i] + '</a><br/>';
			this.exportLinksHTML += '</div>';
		}
		
		this.rows=aV.AJAX.XML.toArray(this.data.getElementsByTagName("row"));
		this.rowCount=this.rows.length;
	}
	
	catch(e)
	{
		this.error=e;
		this.triggerEvent("parseerror", this.error);
	}

	finally
	{
		if (!this.error && this.printAfterParse) 
		{
			if (fullRefresh) 
				this._print(false);
			else 
			{
				this._sortRows();
				this._printRows();
			}
		}
		return !this.error;
	}
};

/* define page variables */
aV.DBGrid.prototype._maxRowsInPage=aV.config.DBGrid.maxRowsInPage;
aV.DBGrid.prototype.setMaxRowsInPage=function(newMaxRowsInPage)
{
	if (newMaxRowsInPage<1 || newMaxRowsInPage!=Math.round(newMaxRowsInPage))
		return false;
	this._maxRowsInPage=newMaxRowsInPage;
	this._printRows();
	return this._maxRowsInPage;
};

aV.DBGrid.prototype._currentPage=1; //internal page number keeper
aV.DBGrid.prototype.setPage=function(newPage)
{
	if (newPage<1 || newPage!=Math.round(newPage) || newPage>Math.ceil(this.rowCount/this._maxRowsInPage))
		return false;
	this._currentPage=newPage;
	this._printRows();
	return this._currentPage;
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
			
		this.triggerEvent("printbegin");
		
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
		this.tableElement.parentNode.removeChild(this.tableElement);

	if (clear) 
	{
		element.innerHTML = '';
		if (this.tableElement)
			delete this.tableElement;
	}

	this.tableElement=document.createElement("table");
	this.tableElement.guid=this.guid;
	this.tableElement.className=aV.config.DBGrid.classNames.general;
	
	var tableCaption=this.tableElement.appendChild(document.createElement("caption"));
	
	this.tableElement.columnList=document.body.appendChild(document.createElement("div"));
	this.tableElement.columnList.owner=this;
	this.tableElement.columnList.id=aV.config.DBGrid.classNames.general + this.guid + "_columnList";
	this.tableElement.columnList.className=aV.config.DBGrid.classNames.columnList;
	this.tableElement.columnList.style.height="0px";
	aV.Visual.setOpacity(this.tableElement.columnList, 0);

	/* Start creating the buttons */
	/* ColumnList button */
	this.tableElement.buttonColumnList=document.createElement("a");
	this.tableElement.buttonColumnList.href="javascript:void(0)";
	this.tableElement.buttonColumnList.className=aV.config.DBGrid.classNames.buttonColumnList;
	this.tableElement.buttonColumnList.appendChild(document.createTextNode(aV.config.DBGrid.texts.columnList));
	this.tableElement.buttonColumnList.setAttribute("hint", aV.config.DBGrid.texts.columnListHint);
	aV.Events.add(this.tableElement.buttonColumnList, "click", aV.DBGrid._columnManagerClickHandler);
	tableCaption.appendChild(this.tableElement.buttonColumnList);
	columnList=null;
	
	/* Export/Save button */
	if (this.exportTypes.length) 
	{
		this.tableElement.buttonExport = document.createElement("a");
		this.tableElement.buttonExport.href = "javascript:void(0)";
		this.tableElement.buttonExport.className = aV.config.DBGrid.classNames.buttonExport;
		this.tableElement.buttonExport.appendChild(document.createTextNode(aV.config.DBGrid.texts["export"]));
		aV.Events.add(
			this.tableElement.buttonExport,
			'click',
			function(event)
			{
				aV.Visual.customHint.pop(
					aV.DBGrid.getOwnerObject(event.target).exportLinksHTML,
					event.clientX + aV.Visual.scrollLeft(),
					event.clientY + aV.Visual.scrollTop()
				);
			}
		);
		tableCaption.appendChild(this.tableElement.buttonExport);
	}

	/* Show/Hide Filters Button */
	this.tableElement.buttonFilter=document.createElement("a");
	this.tableElement.buttonFilter.href="javascript:void(0)";
	this.tableElement.buttonFilter.className=aV.config.DBGrid.classNames.buttonFilter;
	this.tableElement.buttonFilter.appendChild(document.createTextNode(aV.config.DBGrid.texts.filter));
	this.tableElement.buttonFilter.onclick=function() {this.parentNode.parentNode.tHead.filterRow.style.display=(this.parentNode.parentNode.tHead.filterRow.style.display)?'':'none'; return false;};
	this.tableElement.buttonFilter.setAttribute("hint", aV.config.DBGrid.texts.filterHint);
	tableCaption.appendChild(this.tableElement.buttonFilter);

	/* UngroupAll Button */
	this.tableElement.buttonUngroupAll=document.createElement("a");
	this.tableElement.buttonUngroupAll.href="javascript:void(0)";
	this.tableElement.buttonUngroupAll.className=aV.config.DBGrid.classNames.buttonUngroupAll;
	this.tableElement.buttonUngroupAll.appendChild(document.createTextNode(aV.config.DBGrid.texts.ungroupAll));
	this.tableElement.buttonUngroupAll.onclick=function(event) {aV.DBGrid.getOwnerObject(event.target).ungroupAllRows();return false;};
	this.tableElement.buttonUngroupAll.setAttribute('hint', aV.config.DBGrid.texts.ungroupAllHint);
	tableCaption.appendChild(this.tableElement.buttonUngroupAll);

	/* GroupAll button */
	this.tableElement.buttonGroupAll=document.createElement("a");
	this.tableElement.buttonGroupAll.href="javascript:void(0)";
	this.tableElement.buttonGroupAll.className=aV.config.DBGrid.classNames.buttonGroupAll;
	this.tableElement.buttonGroupAll.appendChild(document.createTextNode(aV.config.DBGrid.texts.groupAll));
	this.tableElement.buttonGroupAll.onclick=function(event) {aV.DBGrid.getOwnerObject(event.target).groupAllRows();return false;};
	this.tableElement.buttonGroupAll.setAttribute('hint', aV.config.DBGrid.texts.groupAllHint);
	tableCaption.appendChild(this.tableElement.buttonGroupAll);
	
	/* End of button definitions */
	
	var captionTitle=tableCaption.appendChild(document.createElement("div"));
	captionTitle.className=aV.config.DBGrid.classNames.captionTitle;
	captionTitle.appendChild(document.createTextNode(aV.AJAX.XML.getValue(this.data, "caption", aV.config.DBGrid.texts.defaultTableTitle)));
	
	this.tableElement.setColumnVisibility=function(colIndex, visible)
	{
		var displayState=(visible)?'':'none';
		var rows=this.getElementsByTagName("tr");
		for (var i = rows.length - 1; i >= 0; i--) 
		{
			if (rows[i].parentNode != this.tFoot)
				rows[i].cells[colIndex].style.display = displayState;
			else
				rows[i].cells[0].colSpan+=(visible)?1:-1;
		}
		aV.DBGrid.getOwnerObject(this).columnProperties[colIndex].hidden=!visible;
	};
	
	this.tableElement.appendChild(document.createElement("thead"));
	this.tableElement.tHead.filterRow=this.tableElement.tHead.insertRow(-1);
	this.tableElement.tHead.filterRow.className=aV.config.DBGrid.classNames.filterRow;
	this.tableElement.tHead.filterRow.style.display='none';
	var newRow=this.tableElement.tHead.insertRow(-1);
	var columnTitle, newCell, newLabel, newCheckbox;
	var visibleColCount=this.colCount;
	
	for (var i=0; i<this.colCount; i++)
	{
		columnTitle=aV.AJAX.XML.getValue(this.columns[i], "title");
		
		newLabel=document.createElement("label");
		newLabel.setAttribute("for", "aV.DBGrid" + this.guid + "_columnControl" + i);
		newLabel.appendChild(document.createTextNode(columnTitle));

		newCheckbox=document.createElement("input");
		newCheckbox.type="checkbox";
		newCheckbox.colIndex=i;
		newCheckbox.id=newLabel.getAttribute("for");
		newCheckbox.onclick=function()
		{
			this.parentNode.owner.tableElement.setColumnVisibility(this.colIndex, this.checked);
		};

		this.tableElement.columnList.appendChild(newCheckbox);
		this.tableElement.columnList.appendChild(newLabel);
		
		newCheckbox.checked=!this.columnProperties[i].hidden;
		this.tableElement.columnList.appendChild(document.createElement("br"));
		
		newCell=newRow.insertCell(-1);

		newCell.appendChild(document.createTextNode(columnTitle));
		newCell.setAttribute("alias", this.columns[i].tagName);
		newCell.title=columnTitle;
		newCell.colIndex=i;
		aV.Events.add(newCell, "click", aV.DBGrid._titleClickHandler);
		aV.Events.add(newCell, "mousemove", aV.DBGrid._titleMouseMoveHandler);
		aV.Events.add(newCell, "mousedown", aV.DBGrid._lockResize);
		
		if (this.columnProperties[i].width!='')
			newCell.style.width=this.columnProperties[i].width;
		
		newCell.filterBox=this.tableElement.tHead.filterRow.insertCell(-1).appendChild(document.createElement("input"));
		newCell.filterBox.columnHeader=newCell;
		
		if (this.columnProperties[i].hidden) 
		{
			newCell.style.display = 'none';
			newCell.filterBox.parentNode.style.display = 'none';
			visibleColCount--;
		}
		
		aV.Events.add(newCell.filterBox, "keyup", aV.DBGrid._filterBoxKeyUpHandler);
	}
		
	this.tableElement.appendChild(document.createElement("tfoot"));
	newRow=this.tableElement.tFoot.insertRow(-1);
	/* row count cell */
	newCell=newRow.insertCell(-1);
	newCell.colSpan=Math.floor(visibleColCount/2);
	/* pagination control cell */
	newCell=newRow.insertCell(-1);
	newCell.colSpan=Math.ceil(visibleColCount/2);
	newCell.className=aV.config.DBGrid.classNames.pageControls;
	/* max rows in page part */
	newCell.appendChild(document.createTextNode(aV.config.DBGrid.texts.maxRowsInPage));
	newCell.maxRowsInPage=document.createElement("INPUT");
	newCell.maxRowsInPage.type="TEXT";
	newCell.maxRowsInPage.className=aV.config.DBGrid.classNames.maxRowsInPageInput;
	aV.Events.add(newCell.maxRowsInPage, "keyup", aV.DBGrid._maxRowsInPageKeyUpHandler);
	newCell.appendChild(newCell.maxRowsInPage);
	/* pages part */
	newCell.previousPage=document.createElement('A');
	newCell.previousPage.className=aV.config.DBGrid.classNames.previousPage;
	newCell.previousPage.href="javascript:void(0)";
	newCell.previousPage.appendChild(document.createTextNode(aV.config.DBGrid.texts.previousPage));
	newCell.previousPage.increment=-1;
	aV.Events.add(newCell.previousPage, "click", aV.DBGrid._pageControlsClickHandler);
	newCell.appendChild(newCell.previousPage);
	
	newCell.page=document.createElement("INPUT");
	newCell.page.type="TEXT";
	newCell.page.className=aV.config.DBGrid.classNames.pageInput;
	aV.Events.add(newCell.page, "keyup", aV.DBGrid._pageInputKeyUpHandler);
	newCell.appendChild(newCell.page);
	
	newCell.nextPage=document.createElement('A');
	newCell.nextPage.className=aV.config.DBGrid.classNames.nextPage;
	newCell.nextPage.href="javascript:void(0)";
	newCell.nextPage.appendChild(document.createTextNode(aV.config.DBGrid.texts.nextPage));
	newCell.nextPage.increment=1;
	aV.Events.add(newCell.nextPage, "click", aV.DBGrid._pageControlsClickHandler);
	newCell.appendChild(newCell.nextPage);
	
	newCell.totalPageCount=document.createElement("SPAN");
	newCell.appendChild(newCell.totalPageCount);
	
	this.tableElement.appendChild(document.createElement("tbody"));
	this._printRows();
	
	element.appendChild(this.tableElement);
};

aV.DBGrid.prototype.sortData=function(columnIndex, direction, print)
{
	if (!this._sortCache)
	{
		if (typeof columnIndex!='number')
			columnIndex=0;
		
		if (typeof direction!='number')
			direction=(this.sortBy[0]===columnIndex)?-this.sortDirection[0]:1;
		
		if (!this.columns || !this.rows || (this.sortBy[0]===columnIndex && this.sortDirection[0]===direction))
			return false;
		
		this.triggerEvent("sortbegin", {columnIndex: columnIndex, direction: direction});
		
		if (typeof this.sortBy[0]=='number')
			this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[this.sortBy[0]].className='';
		this.tableElement.tHead.rows[this.tableElement.tHead.rows.length-1].cells[columnIndex].className=(direction==1)?aV.config.DBGrid.classNames.sortedAsc:aV.config.DBGrid.classNames.sortedDesc;

		this._sortCache=[columnIndex, direction, print];
		window.setTimeout("aV.DBGrid.list[" + this.guid + "].sortData()", 0);
		return;
	}
	else
	{
		print=this._sortCache[2];
		direction=this._sortCache[1];
		columnIndex=this._sortCache[0];
		delete this._sortCache;
	}
	
	if (columnIndex != this.sortBy[0]) 
	{
		this.sortBy.unshift(columnIndex);
		this.sortDirection.unshift(direction);
		
		if (this.sortBy.length > this.maxSortAccumulation)
			this.sortBy=this.sortBy.slice(0, this.maxSortAccumulation - 1);
		if (this.sortDirection.length > this.maxSortAccumulation)
			this.sortDirection=this.sortDirection.slice(0, this.maxSortAccumulation - 1);
		
		this._activeCompareFunction.unshift(aV.config.DBGrid.compareFunctions["dt_" + this.columnProperties[this.sortBy[0]].dataType] || aV.config.DBGrid.compareFunctions.dt_default);
	}
	else
		this.sortDirection[0]=direction;
	
	var currentObject=this;
	
	this._sortRows();

	this.triggerEvent("sortend");

	if (print)
	{
		if (this.tableElement)
			this._printRows();
		else
			this._print();
	}
};

aV.DBGrid.prototype.groupAllRows=function()
{
	if (!this.tableElement)
		return false;
	var currentRow=this.tableElement.getElementsByTagName('tbody')[0].firstChild;
	while (currentRow)
	{
		if (!currentRow.groupCount)
			this._groupRows(currentRow, this.tableElement);
		currentRow=currentRow.nextSibling;
	}
};

aV.DBGrid.prototype.ungroupAllRows=function()
{
	if (!this.tableElement)
		return false;
	var currentRow=this.tableElement.getElementsByTagName('tbody')[0].firstChild;
	while (currentRow)
	{
		if (currentRow.groupCount)
			currentRow=this._ungroupRows(currentRow, this.tableElement);
		currentRow=currentRow.nextSibling;
	}
};

aV.DBGrid.prototype.destroy=function()
{
	if (this.tableElement)
	{
		document.body.removeChild(this.tableElement.columnList);
		this.tableElement.parentNode.removeChild(this.tableElement);
		delete this.tableElement;
	}
	aV.Events.clear(this);
	delete aV.DBGrid.list[this.guid];
};

aV.DBGrid.prototype._sortRows=function()
{
	if (this._activeCompareFunction.length<=0)
		return;
	var currentObject=this;
	this.rows.sort(
		function(row1, row2)
		{
			var result=0;
			var val1, val2;
			for (var i = 0; i < currentObject.sortBy.length && !result; i++) 
			{
				val1=currentObject._extractCellValue(row1, currentObject.sortBy[i]);
				val2=currentObject._extractCellValue(row2, currentObject.sortBy[i]);
				result = currentObject._activeCompareFunction[i](val1, val2) * currentObject.sortDirection[i];
			}
			return result;
		}
	);
}

aV.DBGrid.prototype._extractCellValue=function(row, colIndex)
{
	try
	{
		return row.childNodes[colIndex].firstChild.nodeValue;
	}
	catch(error)
	{
		return false;
	}
};

aV.DBGrid.prototype._printRows=function(clear, i, count, insertBefore)
{
	if (!this.tableElement)
		return false;
	
	if (typeof clear!='boolean')
		clear=true;

	if (typeof i!='number' || isNaN(i))
		i=(this._currentPage-1)*this._maxRowsInPage;

	if (typeof count!='number')
		count=this._maxRowsInPage;

	var addedRows=0;
	var tableBody=this.tableElement.getElementsByTagName('tbody')[0];
	var filtered=false;
	var cellValue;
	
	if (clear)
		while (tableBody.firstChild)
			tableBody.removeChild(tableBody.firstChild);

	tableBody.style.height=aV.config.DBGrid.maxBodyHeight + 'px';
	var originalStart=i+1;
	var newRow, newCell, lastKeyRow, lastKeyData, currentKeyData, rowContent;
	for (; (addedRows<count && i<this.rowCount); i++)
	{
		newRow=document.createElement("tr");
		newRow.index=i;
		newRow.onclick=aV.DBGrid._rowClickHandler;

		if (this.sortBy.length>0)
		{
			newRow.ondblclick=aV.DBGrid._rowGrouper;			
			currentKeyData=this._extractCellValue(this.rows[i], this.sortBy[0]);
			if (currentKeyData==lastKeyData)
				newRow.parentRow=lastKeyRow;
			else
			{
				newRow.parentRow=lastKeyRow=newRow;
				lastKeyData=currentKeyData;
			}
		}
		
		filtered=false;
		for (var j=0; j<this.colCount; j++)
		{
			if (filtered=(filtered || this._applyFilter(this.rows[i], j)))
				break;

			newCell=document.createElement("td");
			newCell.setAttribute("datatype", this.columnProperties[j].dataType);
			newCell.setAttribute("hint", "%self%");
			
			if (this.columnProperties[j].hidden)
				newCell.style.display='none';
			
			if (this.columnProperties[j].parseHTML)
				newCell.innerHTML=this._extractCellValue(this.rows[i], j);
			else
				newCell.appendChild(document.createTextNode(this._extractCellValue(this.rows[i], j)));
			newCell.lastStr=newCell.innerHTML;
			newRow.appendChild(newCell);
		}
		
		if (filtered)
			continue;
		
		addedRows++;
		if (insertBefore)
			tableBody.insertBefore(newRow, insertBefore);
		else
			tableBody.appendChild(newRow);
	}

	if (!aV.config.DBGrid.maxBodyHeight || tableBody.scrollHeight<=tableBody.offsetHeight)
		tableBody.style.height='auto';

	var totalPages=Math.ceil(this.rowCount/this._maxRowsInPage);
	this.tableElement.tFoot.rows[0].cells[0].innerHTML=aV.config.DBGrid.texts.footerRowCount.format(originalStart, originalStart + tableBody.rows.length - 1, tableBody.rows.length, this.rowCount);
	this.tableElement.tFoot.rows[0].cells[1].maxRowsInPage.value=this._maxRowsInPage;
	this.tableElement.tFoot.rows[0].cells[1].page.value=this._currentPage;
	this.tableElement.tFoot.rows[0].cells[1].totalPageCount.innerHTML=aV.config.DBGrid.texts.totalPages.format(totalPages);
	this.tableElement.tFoot.rows[0].cells[1].previousPage.setAttribute("disabled", this._currentPage<2);
	this.tableElement.tFoot.rows[0].cells[1].nextPage.setAttribute("disabled", this._currentPage>=totalPages);
	
	this.triggerEvent("printend");

	return newRow;
};

aV.DBGrid.prototype._applyFilter=function(row, colIndex)
{
	var result=false;
	
	if (this.columnProperties[colIndex].filterFunction && this.columnProperties[colIndex].filter)
	{
		var filterStr=this.columnProperties[colIndex].filter;
		var invert=(filterStr.charAt(0)=='!');
		
		if (invert || filterStr.charAt(0)==' ')
			filterStr=filterStr.substr(1);
		
		result=this.columnProperties[colIndex].filterFunction(this._extractCellValue(row, colIndex), filterStr);
		
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
		for (var i=0; i<this.colCount; i++)
		{
			if (i==this.sortBy[0] || this.columnProperties[i].hidden)
				continue;
			dataType=(this.columnProperties[i].dontSum)?"string":this.columnProperties[i].dataType;
			switch(dataType)
			{
				case 'int':
				case 'real':
					groupHeader.childNodes[i].firstChild.nodeValue=parseFloat(groupHeader.childNodes[i].firstChild.nodeValue) + parseFloat(currentRow.childNodes[i].firstChild.nodeValue);
					break;
				default:
					groupHeader.childNodes[i].appendChild(document.createElement('br'));
					if (groupHeader.childNodes[i].lastStr!=currentRow.childNodes[i].innerHTML)
					{
						groupHeader.childNodes[i].innerHTML+=currentRow.childNodes[i].innerHTML;
						groupHeader.childNodes[i].lastStr=currentRow.childNodes[i].firstChild.nodeValue;
					}
			}
		}
		groupHeader.groupCount++;
		groupHeader.parentNode.removeChild(currentRow);
		currentRow=groupHeader.nextSibling;
	}
};

aV.DBGrid.prototype._ungroupRows=function(groupHeader)
{
	var lastAdded=this._printRows(false, groupHeader.index, (groupHeader.groupCount+1), groupHeader.nextSibling);
	groupHeader.parentNode.removeChild(groupHeader);
	return lastAdded;
};

aV.DBGrid.prototype._setColumnWidth=function(colIndex, newWidth)
{
	for (var i=0; i<this.tableElement.tHead.rows.length; i++)
		this.tableElement.tHead.rows[i].cells[colIndex].style.width=newWidth + "px";
};

aV.Events.add(document, "mouseup", aV.DBGrid._unlockResize);
aV.Events.add(document, "mousemove", aV.DBGrid._doResize);
aV.Events.add(document, "selectstart", function() {return !aV.DBGrid._activeResizer});
aV.Events.add(document, "dragstart", function() {return !aV.DBGrid._activeResizer});

aV.AJAX.loadResource("/JSLib/css/aV.module.DBGrid-css.php", "css", "aVDBGridCSS");
