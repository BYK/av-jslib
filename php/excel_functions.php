<?php
	function xlsBOF() 
	{ 
	    echo pack("ssssss", 0x809, 0x8, 0x0, 0x10, 0x0, 0x0);  
    	return; 
	} 

	function xlsEOF() 
	{ 
	    echo pack("ss", 0x0A, 0x00); 
    	return; 
	} 

	function xlsWriteNumber($Row, $Col, $Value) 
	{ 
	    echo pack("sssss", 0x203, 14, $Row, $Col, 0x0); 
    	echo pack("d", $Value); 
	    return; 
	} 

	function xlsWriteLabel($Row, $Col, $Value )
	{ 
	    $L = strlen($Value); 
    	echo pack("ssssss", 0x204, 8 + $L, $Row, $Col, 0x0, $L); 
	    echo $Value; 
		return; 
	}	
	
	function arrayToExcel97($array,$fields,$tableName)
	{
		xlsBOF();
		xlsWriteLabel(0,0,$tableName);
		$j=0;
		foreach ($fields as $field_name=>$field_title)
		{
			$values=str_replace('_',' ',$field_name);
			$values=ucwords($values);
			xlsWriteLabel(1,$j,$values);
			$j++;
		}
		$i=2;
		foreach ($array as $one_row)
		{
			$j=0;
			foreach ($fields as $field_name=>$field_title)
			{
				$one_row[$field_name]=html_entity_decode(strip_tags($one_row[$field_name]));//strip html tags for excel
				$fieldValue = ($one_row[$field_name]?($one_row[$field_name]):'-');
				if (is_numeric($fieldValue))
					xlsWriteNumber($i,$j,$fieldValue);
				else
					xlsWriteLabel($i,$j,$fieldValue);
				$j++;
			}
			$i++;
		}
		xlsEOF();
	}
	
	/**
	 * Creates Excel XML string from the given organised array. Same array with the arrayToJSON
	 * @return string Excel XML
	 * @param $array Array
	 * @param $fields Array
	 * @param $is_chart Boolean[optional]
	 */
	function arrayToExcelXML($array,$fields,$tableName='DBGRid Table in Excel')
	{
		$cellFormat = '<Cell%0:s><Data ss:Type="%1:s">%2:s</Data></Cell>';
		$format = array('%0:s','%1:s','%2:s');
		$columnCount = count($fields); $rowCount = count($array) + 2;
		$outText=  '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<?mso-application progid="Excel.Sheet"?>'."\n".'<Workbook'.
						 ' xmlns="urn:schemas-microsoft-com:office:spreadsheet"'.
						 ' xmlns:o="urn:schemas-microsoft-com:office:office"'.
						 ' xmlns:x="urn:schemas-microsoft-com:office:excel"'.
						 ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"'.
						 ' xmlns:html="http://www.w3.org/TR/REC-html40">'."\n".
						 ' <Styles><Style ss:ID="s21"><Font ss:FontName="Arial" x:CharSet="162" ss:Bold="1"/><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style><Style ss:ID="s27"><Font ss:FontName="Arial" x:CharSet="162"/><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style><Style ss:ID="s13"><Font ss:FontName="Century Gothic" x:CharSet="162" ss:Bold="1" ss:Italic="1" ss:Color="#4F81BD"/><Alignment ss:Vertical="Bottom" ss:WrapText="1"/></Style></Styles>'."\n".
						 '<Worksheet ss:Name="Page1"><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><PageSetup><Layout x:Orientation="Landscape"/></PageSetup></WorksheetOptions>';
//Headers written               
		$outText.='<Table>';
		//Width
		foreach ($fields as $field_name=>$field_title)
				$outText .='<ss:Column ss:Width="150"/>';
		// Title
		$outText .='<Row><Cell ss:MergeAcross="'.count($fields).'" ss:StyleID="s13"><Data ss:Type="String">'.$tableName.'</Data></Cell></Row>';
	//Titles row			
		$outText .= "\n<Row>\n";
		foreach ($fields as $field_name=>$field_title)
		{
			$fName = tagName($field_title);
			for($i=0;1;$i++)
				if(ctype_alnum($fName[$i]))
					break;
				else
					$fName[$i]='';
			$values = array(" ss:StyleID=\"s21\"",'String','<![CDATA['.$fName.']]>');
			$text=str_replace($format, $values, $cellFormat);
			$outText .= $text;
		}
		$outText.="\n</Row>";
//Data rows			
		foreach ($array as $one_row)
		{
			$outText.="\n<Row>\n";
			$j=0;
			foreach ($fields as $field_name=>$field_title)
			{
				$one_row[$field_name]=html_entity_decode(strip_tags($one_row[$field_name]));//strip html tags for excel
				$fieldValue = trim(($one_row[$field_name]?($one_row[$field_name]):'-'));
				if (is_numeric($fieldValue))
					$fieldType = 'Number';
				else
					$fieldType = 'String';
				$values = array(" ss:StyleID=\"s27\"",$fieldType,'<![CDATA['.$fieldValue.']]>');
				$outText.=str_replace($format, $values, $cellFormat);
				$j++;		
			}

			$outText.="\n</Row>\n";
		}
		$outText.="\n</Table>\n</Worksheet>\n</Workbook>";
		return $outText;			
	 }

	function resultToExcel($result,$fields,$tableName,$is_new=true)
	{
		if ($is_new)
		{
			$array=resultToArray($result,$fields);
			return arrayToExcelXML($array,$fields,$tableName);
		}	
		else
		{
			$array=resultToArray($result,$fields);
			return arrayToExcel97($array,$fields,$tableName);
		}	
	}
?>