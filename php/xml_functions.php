<?php
 function qResultToXML($queryName, $recordsName, $qResult= NULL)
	{
		while ($oneRecord=mysql_fetch_assoc($qResult))
			$outText.=dataRecordToXML($recordsName, $oneRecord);
		if ($queryName!='') $outText="<$queryName>$outText</$queryName>";
		return $outText;
	}

	function dataRecordToXML($recordName, $record)
	{
		foreach ($record as $fieldName => $fieldValue)
		{
			if (!isset($fieldValue)) $fieldValue="-";
			$outText.="<$fieldName>".addCDATA($fieldValue)."</$fieldName>";
		}	
		if ($recordName!='') $outText="<$recordName>$outText</$recordName>";
		return $outText;
	}
	
	function qResultToSXML($qResult,$qTitles= NULL)
	{
		$fieldNum = mysql_num_fields($qResult);
		$outText='<query>';
		$outText.='<caption>'.(($qTitles['tableName'])?($qTitles['tableName']):('DBGrid Table')).'</caption>';
		if (is_array($qTitles['exports']))
		{
			foreach($qTitles['exports'] as $name=>$prop)
				$outText2.=dataRecordToXML($name,$prop);
			$outText.="<exports>$outText2</exports>";
		}		
		$outText.="<columns>";
		for ($i=0; $i<$fieldNum; $i++)			
		{
			$fName = mysql_field_name($qResult,$i);
			$fNameAlias = (isset($qTitles[$fName]) && ($qTitles[$fName]['alias']))?($qTitles[$fName]['alias']):($fName);			
			$outText.='<'.$fName.">";
			$outText.='<title>'.addCDATA($fNameAlias).'</title>';
			$outText.='<data_type>'.mysql_field_type($qResult,$i)."</data_type>";
			$outText.=(isset($qTitles[$fName]['visible']))?('<visible>'.($qTitles[$fName]['visible']).'</visible>'):'';
			$outText.=(isset($qTitles[$fName]['dontSum']))?('<dontSum>'.($qTitles[$fName]['dontSum']).'</dontSum>'):'';
			$outText.='</'.$fName.">";				
		}
		$outText.="</columns>";
		$outText.=qResultToXML('','row',$qResult);
		$outText.="</query>";
		return $outText;			
	}
	function addCDATA($string)
	{
		return '<![CDATA['.$string.']]>';
	}
	function queryToExcelFile($query,$path=NULL,$qTitles=NULL)
	{
		$xmlString = queryToExcelXML($query,$qTitles);
		return $xmlString;
	}

	function queryToExcelXML($query,$qTitles=NULL)
	{
		$cellFormat = '<Cell%0:s><Data ss:Type="%1:s">%2:s</Data></Cell>';
		$format = array('%0:s','%1:s','%2:s');
//Get the data we must know how many rows and columns we have
		$qResult=mysql_query($query);
		$fieldNum = mysql_num_fields($qResult);
		
		$rowCount = mysql_num_rows($qResult)+ 2; $columnCount = $fieldNum;
		$headers = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<?mso-application progid="Excel.Sheet"?>'."\n".'<Workbook'.
							 ' xmlns="urn:schemas-microsoft-com:office:spreadsheet"'.
							 ' xmlns:o="urn:schemas-microsoft-com:office:office"'.
							 ' xmlns:x="urn:schemas-microsoft-com:office:excel"'.
							 ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"'.
							 ' xmlns:html="http://www.w3.org/TR/REC-html40">'."\n".
							 ' <Styles><Style ss:ID="s21"><Font ss:FontName="Arial" x:CharSet="162" ss:Bold="1"/></Style></Styles>'."\n".
							 '<Worksheet ss:Name="Page1">';
		$xml = $headers;
		$xml .='<Table ss:ExpandedColumnCount="'.$columnCount.'" ss:ExpandedRowCount="'.$rowCount.'" x:FullColumns="1" x:FullRows="1">';
//Lets write the default column lengths
		for ($i=0; $i<$fieldNum; $i++)
		{
			$fName = mysql_field_name($qResult,$i);
			$width = ($qTitles[$fName]['width'])?($qTitles[$fName]['width']):100;
			$xml .= "\n".'<Column ss:Index="'.($i+1).'" ss:AutoFitWidth="0" ss:Width="'.$width.'"/>';
		}
		$i=0;
//Now we write the columns
		$xml .="\n<Row>\n";
		for ($i=0; $i<$fieldNum; $i++)
		{
			$fName = mysql_field_name($qResult,$i);
			$fNameAlias = (isset($qTitles[$fName]) && ($qTitles[$fName]))?($qTitles[$fName]):($fName);
			if (isset($qTitles[$fName]['vis'])?($qTitles[$fName]['vis']):1)
			{
				$values = array(" ss:StyleID=\"s21\"",'String',addCDATA($fNameAlias));
				$outText = str_replace($format, $values, $cellFormat);
				$xml .=$outText;				
			};
		};
		$xml .="\n</Row>";
//Column names are written now the data
		while ($oneRecord=mysql_fetch_assoc($qResult))
		{
			$xml .="\n<Row>\n";
			for ($i=0; $i<$fieldNum; $i++)			
			{
				$fName = mysql_field_name($qResult,$i);
				if (isset($qTitles[$fName]['vis'])?($qTitles[$fName]['vis']):1)
				{
					$fieldValue = $oneRecord[$fName];
					if (!isset($fieldValue)) $fieldValue="-";
					$fieldType = (mysql_field_type($qResult,$i)=='int')?('Number'):('String');
					$values = array(' ',$fieldType,addCDATA($fieldValue));
					$outText = str_replace($format, $values, $cellFormat);
					$xml .=$outText;
				}	
			};
			$xml .="\n</Row>";
		};
		$xml .="\n</Table>\n</Worksheet>\n</Workbook>";
		return $xml;
	};
?>
