/**
 * @fileOverview Introduces the aV.DBGrid class which fetches and parses XML data
 * and creates a table from the data collected.
 * The generated tables have native sort, filter and grouping support.
 * @name aV.DBGrid
 *
 * @author Burak Yiğit KAYA byk@amplio-vita.net
 * @version 1.7
 */

/**
 * @classDescription A dynamically filled DBGrid class
 * @constructor * 
 * @requires {@link String} (aV.ext.string.js)
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
	
	/**
	 * The column index which the data will be sorted by.
	 * Would be boolean false if no column is set.
	 * @type {integer}
	 */
	this.sortBy=[];
	
	this.sortDirection=[];
	
	this._activeCompareFunction=[];
	
	this.maxSortAccumulation=aV.config.DBGrid.maxSortAccumulation;
	this.error=false;
	
	/* event definitions */
	this.onRowClick=false;
	this.onFetchBegin=aV.config.DBGrid.defaultEventHandlers.onFetchBegin;
	this.onFetchError=aV.config.DBGrid.defaultEventHandlers.onFetchError;
	this.onFetchEnd=false;
	this.onPrintBegin=aV.config.DBGrid.defaultEventHandlers.onPrintBegin;
	this.onPrintEnd=aV.config.DBGrid.defaultEventHandlers.onReady;
	this.onSortBegin=aV.config.DBGrid.defaultEventHandlers.onSortBegin;
	this.onSortEnd=aV.config.DBGrid.defaultEventHandlers.onReady;
	
	/**
	 * Fetches the data from the address given in dataAddress
	 * property, with posting the parameters given in
	 * parameters property.
	 * @method
	 * @param {Boolean} [fullRefresh] If true, the DHTML table is regenerated after the data is fetched.
	 */
	this.refreshData=function(fullRefresh)
	{
		delete this.data;
		
		var currentObject=this;
		
		if (this.onFetchBegin)
			this.onFetchBegin();
		 
		this.fetcher=aV.AJAX.makeRequest(
			"POST",
			this.dataAddress,
			this.parameters,
			function(requestObject)
			{

				currentObject.loadingData=false;				
				if ((requestObject.status && requestObject.status!=200) || !requestObject.responseXML)
				{
					if (currentObject.onFetchError)
						currentObject.onFetchError(requestObject);
					else
						delete currentObject.fetcher;
					return;
				}
				currentObject.data=requestObject.responseXML;
				delete currentObject.fetcher;
				
				if (currentObject.onFetchEnd)
					currentObject.onFetchEnd();
				
				if (currentObject.parseDataAfterFetch)
					currentObject.parseData(fullRefresh);
			}
		);
	};
	
	this.getExportLink=function(type)
	{
		var params=this.parameters || {};
		if (typeof params=='object')
			params=aV.AJAX.serializeParameters(params);
		params+='&type=' + encodeURIComponent(type);
		
		return this.dataAddress + '?' + params;
	};
	
	this.parseData=function(fullRefresh)
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
		
		if (!this.data)
			return false;
		
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
					
					this.exportTypes=aV.AJAX.XML.getValue(this.data, "exportTypes", '');
					if (this.exportTypes!='')
						this.exportTypes=this.exportTypes.split(',');
				}
			}
			this.rows=aV.AJAX.XML.toArray(this.data.getElementsByTagName("row"));
			this.rowCount=this.rows.length;
		}
		
		catch(e)
		{
			this.error=e;
		}

		finally
		{
			if (this.printAfterParse) 
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
	
	this._print=function(clear, element)
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
			
			if (typeof clear=='undefined')
				clear=true;
				
			if (this.onPrintBegin)
				this.onPrintBegin(element);
			
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
		
		if (this.error)
			throw new Error("Parse Error: Bad or empty data.", 'aV.module.DBGrid.js@' + this.dataAddress + '?' + aV.AJAX.serializeParameters(this.parameters));

		this.tableElement=document.createElement("table");
		this.tableElement.creator=this;
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
		this.tableElement.buttonColumnList.onclick=function()
		{
			var columnList=this.parentNode.parentNode.columnList;
			columnList.style.left=aV.Visual.getElementPositionX(this) + "px";
			columnList.style.top=aV.Visual.getElementPositionY(this) + "px";
			if (columnList.style.height=="0px")
				aV.Visual.fadeNSlide(columnList, columnList.scrollHeight, 1);
			else
				aV.Visual.fadeNSlide(columnList, 0, -1);
		};
		tableCaption.appendChild(this.tableElement.buttonColumnList);
		
		/* Export/Save button */
		if (this.exportTypes.length) 
		{
			this.exportLinksHTML='<div style="min-width: 25px;">';
			for (var i=0; i<this.exportTypes.length; i++)
				this.exportLinksHTML+='<a href="' + this.getExportLink(this.exportTypes[i]) + '" target="_blank">' + this.exportTypes[i] + '</a><br/>';
			this.exportLinksHTML+='</div>';
			this.tableElement.buttonExport = document.createElement("a");
			this.tableElement.buttonExport.href = "javascript:void(0)";
			this.tableElement.buttonExport.className = aV.config.DBGrid.classNames.buttonExport;
			this.tableElement.buttonExport.appendChild(document.createTextNode(aV.config.DBGrid.texts["export"]));
			aV.Events.add(
				this.tableElement.buttonExport,
				'click',
				function(event)
				{
					var creator=event.target.parentNode.parentNode.creator;
					aV.Visual.customHint.pop(
						creator.exportLinksHTML,
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
		this.tableElement.buttonUngroupAll.onclick=function() {this.parentNode.parentNode.creator.ungroupAllRows();return false;};
		this.tableElement.buttonUngroupAll.setAttribute('hint', aV.config.DBGrid.texts.ungroupAllHint);
		tableCaption.appendChild(this.tableElement.buttonUngroupAll);

		/* GroupAll button */
		this.tableElement.buttonGroupAll=document.createElement("a");
		this.tableElement.buttonGroupAll.href="javascript:void(0)";
		this.tableElement.buttonGroupAll.className=aV.config.DBGrid.classNames.buttonGroupAll;
		this.tableElement.buttonGroupAll.appendChild(document.createTextNode(aV.config.DBGrid.texts.groupAll));
		this.tableElement.buttonGroupAll.onclick=function() {this.parentNode.parentNode.creator.groupAllRows();return false;};
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
			this.creator.columnProperties[colIndex].hidden=!visible;
		};
		
		var tableHeader=this.tableElement.appendChild(document.createElement("thead"));
		this.tableElement.tHead.filterRow=tableHeader.insertRow(-1);
		this.tableElement.tHead.filterRow.className=aV.config.DBGrid.classNames.filterRow;
		this.tableElement.tHead.filterRow.style.display='none';
		var newRow=tableHeader.insertRow(-1);
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
			newCell.filterBox.creator=this;
			newCell.filterBox.columnHeader=newCell;
			
			if (this.columnProperties[i].hidden) 
			{
				newCell.style.display = 'none';
				newCell.filterBox.parentNode.style.display = 'none';
				visibleColCount--;
			}
			
			aV.Events.add(newCell.filterBox, "keydown", aV.DBGrid._filterBoxKeyDownHandler);
		}
			
		var tableFooter=this.tableElement.appendChild(document.createElement("tfoot"));
		var newRow=tableFooter.insertRow(-1);
		var newCell=newRow.insertCell(-1);
		newCell.colSpan=visibleColCount;
		tableFooter.rowCount=document.createElement("span");
		newCell.appendChild(tableFooter.rowCount);
		newCell.appendChild(document.createTextNode(aV.config.DBGrid.texts.rows));
		
		this.tableElement.appendChild(document.createElement("tbody"));
		this._printRows();
		
		element.appendChild(this.tableElement);
	};
	
	this.sortData=function(columnIndex, direction, print)
	{
		if (!this._sortCache)
		{
			if (typeof columnIndex!='number')
				columnIndex=0;
			
			if (typeof direction!='number')
				direction=(this.sortBy[0]===columnIndex)?-this.sortDirection[0]:1;
			
			if (!this.columns || !this.rows || (this.sortBy[0]===columnIndex && this.sortDirection[0]===direction))
				return false;
			
			if (this.onSortBegin)
				this.onSortBegin(columnIndex, direction);
			
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

		if (this.onSortEnd)
			this.onSortEnd(columnIndex, direction);
		if (print)
		{
			if (this.tableElement)
				this._printRows();
			else
				this._print();
		}
	};
	
	this.groupAllRows=function()
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
	
	this.ungroupAllRows=function()
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
	
	this.destroy=function()
	{
		if (this.tableElement)
		{
			document.body.removeChild(this.tableElement.columnList);
			this.tableElement.parentNode.removeChild(this.tableElement);
		}
		delete aV.DBGrid.list[this.guid];
	};
	
	this._sortRows=function()
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
	
	this._extractCellValue=function(row, colIndex)
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
	
	this._printRows=function(clear, i, count, insertBefore)
	{
		if (!this.tableElement)
			return false;
		
		if (typeof clear!='boolean')
			clear=true;

		if (typeof i!='number')
			i=0;

		if (typeof count!='number')
			count=this.rowCount;

		var addedRows=0;
		var tableBody=this.tableElement.getElementsByTagName('tbody')[0];
		var filtered=false;
		var cellValue;
		
		if (clear)
			while (tableBody.firstChild)
				tableBody.removeChild(tableBody.firstChild);

		tableBody.style.height=aV.config.DBGrid.maxBodyHeight + 'px';
		var newRow, newCell, lastKeyRow, lastKeyData, currentKeyData, rowContent;
		for (i; (addedRows<count && i<this.rowCount); i++)
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

		this.tableElement.tFoot.rowCount.innerHTML=tableBody.rows.length;
		
		if (this.onPrintEnd)
			this.onPrintEnd(this.tableElement);

		return newRow;
	};
	
	this._applyFilter=function(row, colIndex)
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
	
	this._groupRows=function(groupHeader)
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
		this.tableElement.tFoot.rowCount.innerHTML=groupHeader.parentNode.rows.length;
	};
	
	this._ungroupRows=function(groupHeader)
	{
		var lastAdded=this._printRows(false, groupHeader.index, (groupHeader.groupCount+1), groupHeader.nextSibling);
		groupHeader.parentNode.removeChild(groupHeader);
		this.tableElement.tFoot.rowCount.innerHTML=lastAdded.parentNode.rows.length;
		return lastAdded;
	};
	
	this._setColumnWidth=function(colIndex, newWidth)
	{
		for (var i=0; i<this.tableElement.tHead.rows.length; i++)
			this.tableElement.tHead.rows[i].cells[colIndex].style.width=newWidth + "px";
	};
	
	if (fetch)
		this.refreshData();
}

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

	table.creator.sortData(this.colIndex, false, true);
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

	aV.DBGrid._activeResizer=(event.clientX>(cellPosition+aV.config.DBGrid.resizeLockOffset))?obj:obj.visiblePrevSibling;

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
		obj.parentNode.parentNode.parentNode.creator._setColumnWidth(obj.visibleNextSibling.cellIndex, obj.visibleNextSibling.initialWidth - change);
	obj.parentNode.parentNode.parentNode.creator._setColumnWidth(obj.cellIndex, obj.initialWidth + change);
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
		table.creator._ungroupRows(groupHeader);
	else
		table.creator._groupRows(groupHeader);
};

aV.DBGrid._rowClickHandler=function(event)
{
	var table=this;
	while (table.tagName!="TABLE" && table.tagName!="HTML")
		table=table.parentNode;
	var selectable=true;
	
	if (table.creator.onRowClick)
	{
		var rowData={};
		for (var i=0; i<table.creator.colCount; i++)
			rowData[table.creator.columns[i].tagName]=this.cells[i].innerHTML.BRtoLB();
		
		if (table.creator.onRowClick(this, rowData)===false)
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

aV.DBGrid._filterBoxKeyDownHandler=function(event)
{
	var keyCode=(event.which)?event.which:event.keyCode;
	if (keyCode == 27)
	{
		this.value='';
		keyCode=13;
	}
	
	if (keyCode==13)
	{
		this.creator.columnProperties[this.columnHeader.colIndex].filter=this.value;
		this.creator._printRows();
		return false;
	}
};

aV.config.DBGrid=
{
	maxSortAccumulation: 4,
	resizeLockOffset: 10,
	minColWidth: 20, //show be >= 2*resizeLockOffset
	maxBodyHeight: 400,
	texts:
	{
		defaultTableTitle: 'Untitled Table',
		rows: ' row(s)',
		error: 'An error occured while preparing the table. Details are below:<br />',
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
		filterHint: 'You can filter the rows using the filter boxes above the columns. You may use "!" as the "not" operator. You may also use numerical comparators such as "<", ">" in numerical fields. Filters are cumulative.'
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
		slider: 'slider'
	},
	defaultEventHandlers:
	{
		onReady: function()
		{
			aV.Visual.infoBox.show(aV.config.DBGrid.texts.ready, aV.config.Visual.infoBox.images.info);
		},
		onFetchBegin: function()
		{
			aV.Visual.infoBox.show(aV.config.DBGrid.texts.fetching, aV.config.Visual.infoBox.images.loading, true, 60000);
		},
		onFetchError: function(requestObject)
		{
			aV.Visual.infoBox.show(aV.config.DBGrid.texts.error + '(' + requestObject.status + ') - ' + requestObject.responseText, aV.config.Visual.infoBox.images.error, false, 60000);
		},
		onPrintBegin: function()
		{
			aV.Visual.infoBox.show(aV.config.DBGrid.texts.printing, aV.config.Visual.infoBox.images.info, true);
		},
		onSortBegin: function()
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
};

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
		aV.DBGrid.list[guid].destroy();
};

aV.DBGrid.list={};
aV.Events.add(document, "mouseup", aV.DBGrid._unlockResize);
aV.Events.add(document, "mousemove", aV.DBGrid._doResize);
aV.Events.add(document, "selectstart", function() {return !aV.DBGrid._activeResizer});
aV.Events.add(document, "dragstart", function() {return !aV.DBGrid._activeResizer});

aV.AJAX.loadResource("/JSLib/css/aV.module.DBGrid-css.php", "css", "aVDBGridCSS");