<?php
	function Fill_Void_Titles($fields)
  {
			foreach ($fields as $field_name=>$field_title)
			 if($field_title)
			   $output[$field_name]= $field_title;
			  else 
			   $output[$field_name]=ucwords(str_replace('_',' ',$field_name));
			return $output;
  }

 function tagName($tag_name)
  {
  	return str_replace('/','_',$tag_name);
  }
	function arrayToExcelXML($array,$fields)
	 {
			$fields=Fill_Void_Titles($fields);
			$outText='<query>';
			$outText.="<columns>";
			foreach ($fields as $field_name=>$field_title)
			 {
				 $outText.='<'.tagName($field_name).'>';
				 $outText.="<title>$field_title</title>";
				 $outText.="<data_type>string</data_type>";//is_numeric eklenecek
				 $outText.="<parseHTML>1</parseHTML>";				 
				 $outText.='</'.tagName($field_name).'>';
			 }
			$outText.="</columns>";
			$outText.="<data>";
			foreach ($array as $one_row)
			 {
					$outText.="<row>";
  			foreach ($fields as $field_name=>$field_title)
						$outText.='<'.tagName($field_name).'>'.($one_row[$field_name]?'<![CDATA['.mb_convert_encoding($one_row[$field_name],'utf-8', CHAR_SET).']]>':'-').'</'.tagName($field_name).'>';//boşluk eklendi aksi takdirde boş bir veri gelince basmıyor
						//htmlspecialchars($one_row[$field_name], ENT_QUOTES, "UTF-8")//CDATA'dan farkı yok sanırım.
					$outText.="</row>";
			 }
			$outText.="</data>";
			$outText.="</query>";
			return $outText;			
	 }
	function Query2ExcelXML($query,$outfname,$queryTitles=NULL)
	{
		$cellFormat = '<Cell%0:s><Data ss:Type="%1:s">%2:s</Data></Cell>';
		$format = array('%0:s','%1:s','%2:s');
//Get the data we must know how many rows and columns we have
		$sql_connection_for_user = new sql_works_for_user();
//		$sql_connection_for_user->Continue_Session();		
		$qResult = $sql_connection_for_user->Query($query);
		$fieldNum = mysql_num_fields($qResult);
		
		$rowCount = mysql_num_rows($qResult)+ 2; $columnCount = $fieldNum;
		$path = '/var/www/JSLib/php/';
		$fullFileName = $path.$outfname.'.xls';
		$myFile = fopen($fullFileName,'w');
		$headers = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<?mso-application progid="Excel.Sheet"?>'."\n".'<Workbook'.
							 ' xmlns="urn:schemas-microsoft-com:office:spreadsheet"'.
							 ' xmlns:o="urn:schemas-microsoft-com:office:office"'.
							 ' xmlns:x="urn:schemas-microsoft-com:office:excel"'.
							 ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"'.
							 ' xmlns:html="http://www.w3.org/TR/REC-html40">'."\n".
							 ' <Styles><Style ss:ID="s21"><Font ss:FontName="Arial Tur" x:CharSet="162" ss:Bold="1"/></Style></Styles>'."\n".
							 '<Worksheet ss:Name="Page1">';
		fwrite($myFile,$headers);
		fwrite($myFile,'<Table ss:ExpandedColumnCount="'.$columnCount.'" ss:ExpandedRowCount="'.$rowCount.'" x:FullColumns="1" x:FullRows="1">');
//First the table Caption
/**		fwrite($myFile,"\n<Row>\n");
		$values = array(" ss:StyleID=\"s21\"",'String',(($queryTitles['tableCaption'])?($queryTitles['tableCaption']):('Tablo')));
		$outText = str_replace($format, $values, $cellFormat);		
		fwrite($myFile,$outText);
		fwrite($myFile,"\n</Row>");
**/		
//Now we write the columns
		fwrite($myFile,"\n<Row>\n");
		for ($i=0; $i<$fieldNum; $i++)			
		{
			$fName = mysql_field_name($qResult,$i);
			$fNameAlias = (isset($queryTitles[$fName]) && ($queryTitles[$fName]))?($queryTitles[$fName]):($fName);
			if (isset($queryTitles[$fName.'_vis'])?($queryTitles[$fName.'_vis']):1)
			{
				$values = array(" ss:StyleID=\"s21\"",'String',(($convertSpecialChars)?htmlspecialchars($fNameAlias, ENT_QUOTES, "UTF-8"):$fNameAlias));
				$outText = str_replace($format, $values, $cellFormat);
				fwrite($myFile,$outText);				
			};
		};
		fwrite($myFile,"\n</Row>");
//Column names are written now the data
		while ($oneRecord=mysql_fetch_assoc($qResult))
		{
			fwrite($myFile,"\n<Row>\n");
			for ($i=0; $i<$fieldNum; $i++)			
			{
				$fName = mysql_field_name($qResult,$i);
				if (isset($queryTitles[$fName.'_vis'])?($queryTitles[$fName.'_vis']):1)
				{
					$fieldValue = $oneRecord[$fName];
					if (!isset($fieldValue)) $fieldValue="-";
					$fieldType = (mysql_field_type($qResult,$i)=='int')?('Number'):('String');
					$values = array(' ',$fieldType,(($convertSpecialChars)?htmlspecialchars($fieldValue, ENT_QUOTES, "UTF-8"):$fieldValue));
					$outText = str_replace($format, $values, $cellFormat);
					fwrite($myFile,$outText);
				}	
			};
			fwrite($myFile,"\n</Row>");
		};
		fwrite($myFile,"\n</Table>\n</Worksheet>\n</Workbook>");
		fclose($myFile);
//Now give it to the requester
		$myFile = fopen($fullFileName,'r');		
		$filesize = filesize($fullFileName);
	  header("Content-Type: archive/xls");
	  header("Content-Disposition: attachment; filename=$fullFileName");
	  header("Content-Length: $filesize");
	  return fpassthru($myFile);
		fclose($myFile);
	};
?>