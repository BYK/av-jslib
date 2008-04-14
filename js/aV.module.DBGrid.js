/**
 * @fileOverview	Introduces the DBGrid class which fetches and parses XML data
 * and creates a table from the data collected.
 * <br />The generated tables have native sort, filter and grouping support.
 * @name DBGrid class
 *
 * @author	Burak Yiğit KAYA	byk@amplio-vita.net
 * @version	1.4
 *
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.ext.string.js">aV.ext.string</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.events.js">aV.main.events.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.visual.js">aV.main.visual.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.plg.customHint.js">aV.plg.customHint.js</a>
 */

/**
 * @classDescription A dynamic filled DBGrid class
 * @constructor
 * @param	 {String} dataAddress The address to the data XML
 * @param {String | Object} parameters Parameters for the POST call to the *dataAddress*
 * @param {HTMLObject} printElement The HTML container element where the created table will be placed
 * @param {Boolean} fetch Set true to fetch immediately when the object is created
 * @param {Boolean} print Set true to print the table immediately after the data is fetched.
 */
function DBGrid(dataAddress, parameters, printElement, fetch, print)
{
	if (typeof AJAX=='undefined')
		throw new Error("AJAX functions library cannot be found!", "DBGrid.js", 16);
		
	/**
	 * Holds the unique identifier and index of the DBGrid object.
	 * @type	{integer}
	 */
	this.guid=DBGrid._lastGuid++;
	
	window.DBGrids[this.guid]=this;
	
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
	this.sortBy=false;
	
	this.sortDirection=false;
	this.error=false;
	
	/* event definitions */
	this.onRowClick=false;
	this.onFetchBegin=false;
	this.onFetchError=false;
	this.onFetchEnd=false;
	this.onPrintBegin=false;
	this.onPrintEnd=false;
	this.onSortBegin=false;
	this.onSortEnd=false;
	
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
		 
		this.fetcher=AJAX.makeRequest(
			"POST",
			this.dataAddress,
			this.parameters,
			function(requestObject)
			{

				currentObject.loadingData=false;				
				if ((requestObject.status!=0 && requestObject.status!=200) || !requestObject.responseXML)
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
	
	this.parseData=function(fullRefresh)
	{
		fullRefresh=(fullRefresh || !this.tableElement);
		if (fullRefresh) 
		{
			delete this.columnProperties;
			delete this.columns;
			delete this.colCount;
			
			this.sortBy=false;
			this.sortDirection=false;
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
				this.columns = AJAX.XML.toArray(this.data.getElementsByTagName("columns")[0].childNodes);
				this.columnProperties = new Array(this.columns.length);
				this.colCount = this.columns.length;
				
				for (var i=0; i<this.colCount; i++)
				{
					this.columnProperties[i]=
					{
						dataType: AJAX.XML.getValue(this.columns[i], "data_type"),
						hidden: (AJAX.XML.getValue(this.columns[i], "visible")==="0"),
						dontSum: (AJAX.XML.getValue(this.columns[i], "dontSum")==="1"),
						parseHTML: (AJAX.XML.getValue(this.columns[i], "parseHTML")==="1"),
						width: AJAX.XML.getValue(this.columns[i], "width", ''),
						filter: ''
					};
					
					switch(this.columnProperties[i].dataType)
					{
						case 'int':
						case 'real':
							this.columnProperties[i].filterFunction=this._numericFilter;
							break;
						default:
							this.columnProperties[i].filterFunction=this._alphaNumericFilter;
					}
				}
			}
			
			this.rows=AJAX.XML.toArray(this.data.getElementsByTagName("row"));
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
			window.setTimeout("window.DBGrids[" + this.guid + "]._print();", 0);
			return;
		}
		else
		{
			element=this._printCache[1];
			clear=this._printCache[0];
			delete this._printCache;
		}
		
		if (clear)
			element.innerHTML='';
		
		if (this.tableElement) 
		{
			this._removeFilterBoxes();
			this.tableElement.parentNode.removeChild(this.tableElement);
		}
		
		if (this.error)
		{
			throw new Error("Parse Error: Bad or empty data.", 'DBGrid.js@' + this.dataAddress + '?' + this.parameters.toSource(), 150);
		}
		
		this.tableElement=document.createElement("table");
		this.tableElement.creator=this;
		this.tableElement.className="DBGrid";
		this.tableElement.filterBoxes=[];
		
		var tableCaption=this.tableElement.appendChild(document.createElement("caption"));
		
		this.tableElement.columnList=tableCaption.appendChild(document.createElement("div"));
		this.tableElement.columnList.id="DBGrid" + this.guid + "_columnList";
		this.tableElement.columnList.className="columnList";
		this.tableElement.columnList.style.height="0px";
		Visual.setOpacity(this.tableElement.columnList, 0);

		this.tableElement.columnsButton=document.createElement("input");
		this.tableElement.columnsButton.type="button";
		this.tableElement.columnsButton.value="*";
		this.tableElement.columnsButton.onclick=function()
		{
			var columnList=this.parentNode.parentNode.columnList;
			if (columnList.style.height=="0px")
				Visual.fadeNSlide(columnList, columnList.scrollHeight, 1, false, true);
			else
				Visual.fadeNSlide(columnList, 0, -1, false, true);
		};
		tableCaption.appendChild(this.tableElement.columnsButton);
		
		this.tableElement.collapseButton=document.createElement("input");
		this.tableElement.collapseButton.type="button";
		this.tableElement.collapseButton.value="-";
		this.tableElement.collapseButton.onclick=function() {this.parentNode.parentNode.creator.collapseAllRows();};
		this.tableElement.collapseButton.disabled=true;
		tableCaption.appendChild(this.tableElement.collapseButton);
		
		this.tableElement.expandButton=document.createElement("input");
		this.tableElement.expandButton.type="button";
		this.tableElement.expandButton.value="+";
		this.tableElement.expandButton.onclick=function() {this.parentNode.parentNode.creator.expandAllRows();};
		this.tableElement.expandButton.disabled=true;
		tableCaption.appendChild(this.tableElement.expandButton);

		tableCaption.appendChild(document.createTextNode(AJAX.XML.getValue(this.data, "caption")));
		
		this.tableElement.setColumnVisibility=function(colIndex, visible)
		{
			var displayState=(visible)?'':'none';
			var rows=this.getElementsByTagName("tr");
			for (var i=rows.length-1; i>=0; i--)
				rows[i].getElementsByTagName("td")[colIndex].style.display=displayState;
			this.creator.columnProperties[colIndex].hidden=!visible;
		};
		
		var tableHeader=this.tableElement.appendChild(document.createElement("thead"));
		var newRow=tableHeader.insertRow(-1);
		var columnTitle, newCell, newLabel, newCheckbox;
		
		for (var i=0; i<this.colCount; i++)
		{
			columnTitle=AJAX.XML.getValue(this.columns[i], "title");
			
			newLabel=document.createElement("label");
			newLabel.setAttribute("for", "DBGrid" + this.guid + "_columnControl" + i);
			newLabel.appendChild(document.createTextNode(columnTitle));
			this.tableElement.columnList.appendChild(newLabel);
			newCheckbox=document.createElement("input");
			newCheckbox.type="checkbox";
			newCheckbox.colIndex=i;
			newCheckbox.id=newLabel.getAttribute("for");
			newCheckbox.onclick=function()
			{
				this.parentNode.parentNode.parentNode.setColumnVisibility(this.colIndex, this.checked);
			};
			this.tableElement.columnList.appendChild(newCheckbox);
			newCheckbox.checked=!this.columnProperties[i].hidden;
			this.tableElement.columnList.appendChild(document.createElement("br"));
			
			newCell=newRow.insertCell(-1);
			newCell.appendChild(document.createTextNode(columnTitle));
			newCell.setAttribute("alias", this.columns[i].tagName);
			newCell.setAttribute("hint", "%self%");
			newCell.colIndex=i;
			Events.add(newCell, "click", this._titleClickHandler);
			Events.add(newCell, "wheel", this._titleWheelHandler);
			Events.add(newCell, "mouseover", this._titleMouseOverHandler);
			Events.add(newCell, "mouseout", this._titleMouseOutHandler);
			
			if (this.columnProperties[i].hidden)
				newCell.style.display='none';
			
			if (this.columnProperties[i].width!='')
				newCell.style.width=this.columnProperties[i].width;
			
			if (this.sortBy===i)
				newCell.className="sorted";
			
			newCell.filterBox=document.body.appendChild(document.createElement("input"));
			this.tableElement.filterBoxes.push(newCell.filterBox);
			newCell.filterBox.creator=this;
			newCell.filterBox.columnHeader=newCell;
			newCell.filterBox.id="DBGrid" + this.guid + "_" + this.columns[i].tagName + '_filter';
			newCell.filterBox.className="filterBox";
			newCell.filterBox.style.position="absolute";
			newCell.filterBox.style.display="none";
			newCell.filterBox.style.width="0px";
			Events.add(newCell.filterBox, "focus", this._filterBoxFocusHandler);
			Events.add(newCell.filterBox, "blur", this._filterBoxBlurHandler);
			Events.add(newCell.filterBox, "keydown", this._filterBoxKeyDownHandler);
		}
			
		this.tableElement.appendChild(document.createElement("tbody"));
		this._printRows();
		element.appendChild(this.tableElement);

		if (this.onPrintEnd)
			this.onPrintEnd(element);
	};
	
	this.sortData=function(columnIndex, direction, print)
	{
		if (!this._sortCache)
		{
			if (typeof columnIndex!='number')
				columnIndex=0;
			
			if (typeof direction!='number')
				direction=(this.sortBy===columnIndex)?-this.sortDirection:1;
			
			if (!this.columns || !this.rows || (this.sortBy===columnIndex && this.sortDirection===direction))
				return false;
			
			if (this.onSortBegin)
				this.onSortBegin(columnIndex, direction);
			
			this._sortCache=[columnIndex, direction, print];
			window.setTimeout("window.DBGrids[" + this.guid + "].sortData()", 0);
			return;
		}
		else
		{
			print=this._sortCache[2];
			direction=this._sortCache[1];
			columnIndex=this._sortCache[0];
			delete this._sortCache;
		}
		
		this.sortBy=columnIndex;
		this.sortDirection=direction;
		
		var currentObject=this;
		switch (this.columnProperties[this.sortBy].dataType)
		{
			case 'int':
			case 'real':
				this._activeCompareFunction=this._numericCompare;
				break;
			default:
				this._activeCompareFunction=this._alphaNumericCompare;
		}
		
		this._sortRows();

		if (this.onSortEnd)
			this.onSortEnd(columnIndex, direction);
		if (print)
		{
			if (this.tableElement)
				this._printRows();
			else
				this._print();
				
			this.tableElement.collapseButton.disabled=false;
			this.tableElement.expandButton.disabled=false;
		}
	};
	
	this.collapseAllRows=function()
	{
		if (!this.tableElement)
			return false;
		var currentRow=this.tableElement.getElementsByTagName('tbody')[0].firstChild;
		while (currentRow)
		{
			if (!currentRow.groupCount)
				this._collapseRowGroup(currentRow, this.tableElement);
			currentRow=currentRow.nextSibling;
		}
	};
	
	this.expandAllRows=function()
	{
		if (!this.tableElement)
			return false;
		var currentRow=this.tableElement.getElementsByTagName('tbody')[0].firstChild;
		while (currentRow)
		{
			if (currentRow.groupCount)
				currentRow=this._expandRowGroup(currentRow, this.tableElement);
			currentRow=currentRow.nextSibling;
		}
	};
	
	this.destroy=function()
	{
		if (this.tableElement)
		{
			this._removeFilterBoxes();
			this.tableElement.parentNode.removeChild(this.tableElement);
			
			delete this.tableElement;
		}
		delete window.DBGrids[this.guid];
		//delete this;
	};
	
	this._sortRows=function()
	{
		var currentObject=this;
		this.rows.sort(
			function(row1, row2)
			{
				row1=currentObject._extractCellValue(row1, currentObject.sortBy);
				row2=currentObject._extractCellValue(row2, currentObject.sortBy);
				return currentObject._activeCompareFunction(row1, row2)*currentObject.sortDirection;
			}
		);
	}
	
	this._extractCellValue=function(row, colIndex)
	{
		return row.childNodes[colIndex].firstChild.nodeValue;
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

		count=count + i;
		var tableBody=this.tableElement.getElementsByTagName('tbody')[0];
		var filtered=false;
		var cellValue;
		
		if (clear)
			removeChildren(tableBody);

		var newRow, newCell, lastKeyRow, lastKeyData, currentKeyData, rowContent;
		for (i; i<count; i++)
		{
			newRow=document.createElement("tr");
			newRow.index=i;
			newRow.onclick=this._onRowClick;

			if (this.sortBy!==false)
			{
				newRow.ondblclick=this._rowGrouper;			
				currentKeyData=this._extractCellValue(this.rows[i], this.sortBy);
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
				newCell.lastStr=newCell.firstChild.nodeValue;
				newRow.appendChild(newCell);
			}
			
			if (filtered)
				continue;
			
			if (insertBefore)
				tableBody.insertBefore(newRow, insertBefore);
			else
				tableBody.appendChild(newRow);
		}
		return newRow;
	};
	
	this._numericCompare=function(num1, num2)
	{
		return (parseFloat(num1) - parseFloat(num2));
	};
	
	this._alphaNumericCompare=function(str1, str2)
	{
		if (str1<str2)
			return -1;
		else if (str1>str2)
			return 1;
		else
			return 0;
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
	
	this._alphaNumericFilter=function(value, filter)
	{
		value=value.toLowerCase();
		var expression=(filter.charAt(0)=='*');
		
		if (expression || (filter.charAt(0)==' '))
			filter=filter.substr(1);
		
		filter=new RegExp((expression)?filter:filter.escapeRegExp(), "gi");

		return !value.match(filter);
	};
	
	this._numericFilter=function(value, filter)
	{
		if (!isNaN(filter))
			filter='==' + filter;
		else if (filter.charAt(0)=='=' && !isNaN(filter.substr(1)))
			filter='=' + filter;

		if (filter.match(/^([><]+=*|==)\d+\.?\d*$/))
			return !eval('(' + value + filter + ')');
		else
			return false;
	};
	
	this._titleClickHandler=function(event)
	{
		var table=this;
		while (table.tagName!="TABLE" && table.tagName!="HTML")
			table=table.parentNode;

		if (typeof table.creator.sortBy=='number')
			this.parentNode.childNodes[table.creator.sortBy].className='';
		
		this.className='sorted';
		
		table.creator.sortData(this.colIndex, false, true);
	};

	this._rowGrouper=function(event)
	{
		var table=this;
		while (table.tagName!="TABLE" && table.tagName!="HTML")
			table=table.parentNode;
		var groupHeader=this.parentRow;
		if (!groupHeader)
			return false;
			
		if (groupHeader.groupCount)
			table.creator._expandRowGroup(groupHeader);
		else
			table.creator._collapseRowGroup(groupHeader);
	};
	
	this._onRowClick=function(event)
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
	
	this._showFilterBox = function(index)
	{
		this._cancelFilterBoxTimers(index);
		this.tableElement.filterBoxes[index].style.left=Visual.getElementPositionX(this.tableElement.filterBoxes[index].columnHeader) + "px";
		this.tableElement.filterBoxes[index].value=this.columnProperties[index].filter;
		this.tableElement.filterBoxes[index].style.display="";
		this.tableElement.filterBoxes[index].style.top=(Visual.getElementPositionY(this.tableElement.filterBoxes[index].columnHeader) - this.tableElement.filterBoxes[index].offsetHeight) + "px";		
		Visual.fadeNSlide(
			this.tableElement.filterBoxes[index],
			this.tableElement.filterBoxes[index].columnHeader.offsetWidth - 5,
			1,
			true,
			true,
			function(obj)
			{
				obj.focus();
			}
		);
	};
	
	this._hideFilterBox=function(index)
	{
		this._cancelFilterBoxTimers(index);
		Visual.fadeNSlide(
			this.tableElement.filterBoxes[index],
			0,
			-1,
			true,
			true,
			function(obj) {obj.style.display="none"}
		);
	};
	
	this._cancelFilterBoxTimers=function(index)
	{
		if (this.tableElement.filterBoxes[index].hideTimer)
		{
			window.clearTimeout(this.tableElement.filterBoxes[index].hideTimer);
			this.tableElement.filterBoxes[index].hideTimer=undefined;
		}
		if (this.tableElement.filterBoxes[index].showTimer)
		{
			window.clearTimeout(this.tableElement.filterBoxes[index].showTimer);
			this.tableElement.filterBoxes[index].showTimer=undefined;
		}
	};
	
	this._removeFilterBoxes=function()
	{
		for (var i=0; i<this.colCount; i++)
			document.body.removeChild(this.tableElement.filterBoxes[i]);
	};
	
	this._titleWheelHandler=function(event)
	{
		var newWidth=parseInt(this.style.width) || this.offsetWidth;
		newWidth-=5*event.delta;
		this.style.width=newWidth + "px";
		event.preventDefault();
	};
	
	this._titleMouseOverHandler=function(event)
	{
		var table=this;
		while (table.tagName!="TABLE" && table.tagName!="HTML")
			table=table.parentNode;

		table.creator._cancelFilterBoxTimers(this.colIndex);
		this.filterBox.showTimer=window.setTimeout("window.DBGrids[" + table.creator.guid + "]._showFilterBox(" + this.colIndex + ");", 750);
	};

	this._titleMouseOutHandler=function(event)
	{
		var table=this;
		while (table.tagName!="TABLE" && table.tagName!="HTML")
			table=table.parentNode;

		table.creator._cancelFilterBoxTimers(this.colIndex);
	};

	this._filterBoxBlurHandler=function(event)
	{
		this.hideTimer=window.setTimeout("window.DBGrids[" + this.creator.guid + "]._hideFilterBox(" + this.columnHeader.colIndex + ");", 500);
	};
	
	this._filterBoxFocusHandler=function(event)
	{
		if (this.hideTimer)
		{
			window.clearTimeout(this.hideTimer);
			this.hideTimer=undefined;
		}
	};
	
	this._filterBoxKeyDownHandler=function(event)
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
			this.blur();
			if (this.value)
				this.focus();
		}
	};
	
	this._collapseRowGroup=function(groupHeader)
	{
		var currentRow=groupHeader.nextSibling;
		groupHeader.groupCount=0;
		while (currentRow && currentRow.parentRow==groupHeader)
		{
			for (var i=0; i<this.colCount; i++)
			{
				if (i==this.sortBy || this.columnProperties[i].hidden)
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
						if (groupHeader.childNodes[i].lastStr!=currentRow.childNodes[i].firstChild.nodeValue)
						{
							groupHeader.childNodes[i].appendChild(document.createTextNode(currentRow.childNodes[i].firstChild.nodeValue));
							groupHeader.childNodes[i].lastStr=currentRow.childNodes[i].firstChild.nodeValue;
						}
				}
			}
			groupHeader.groupCount++;
			groupHeader.parentNode.removeChild(currentRow);
			currentRow=groupHeader.nextSibling;
		}
		this.tableElement.expandButton.disabled=false;
	};
	
	this._expandRowGroup=function(groupHeader)
	{
		var lastAdded=this._printRows(false, groupHeader.index, (groupHeader.groupCount+1), groupHeader.nextSibling);
		groupHeader.parentNode.removeChild(groupHeader);
		this.tableElement.collapseButton.disabled=false;
		return lastAdded;
	};
	
	if (fetch)
		this.refreshData();
}

/**
 * The guid counter for Window.DBGrids array, do not touch.
 *
 * @private
 */
DBGrid._lastGuid=1;

/**
 * Removes and destroys all the DBGrids on a page
 *
 * @static
 * @method
 */
DBGrid.clearAll=function()
{
	for (var guid in window.DBGrids)
		window.DBGrids[guid].destroy();
};

window.DBGrids=new Object();