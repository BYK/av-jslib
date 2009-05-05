<?php
    function queryToOutput($query,$tableName=NULL,$setName=Null,$outputType='json')
	{
		require_once("../../php/DBGrid_conf.php");
		$qResult = mysql_query($query,$GLOBALS['link']);
		$parameters = returnParameters($tableName,$setName,$_REQUEST['columns']);
		if (!$_REQUEST['export'])
		{
			if ($outputType=='xml')
			{
				require_once('../../php/xml_functions.php');
				Header("Content-type: application/xml; charset=UTF-8;");
				return qResultToSXML($qResult,$parameters);
			}
			else
			{
				Header("Content-type: application/json; charset=UTF-8;");
				return queryResultToJSON($qResult,$parameters,returnParameters($tableName));
			}	
		};
		$fields = extractFields($parameters);
		require_once("../../php/excel_functions.php");
		switch ($_REQUEST['export'])
		{
			case 'xls':
				header("Content-type: application/x-msexcel");
				header('Content-Disposition: attachment; filename="'.$parameters['tableName'].'.xls"');
				return resultToExcel($qResult,$fields,$parameters['tableName']);
			break;
			case 'xlsb':
				header("Content-type: application/x-msexcel");
				header('Content-Disposition: attachment; filename="'.$parameters['tableName'].'.xls"'); 
				return resultToExcel($qResult,$fields,$parameters['tableName'],false);
			break;
			case 'xml':
				require_once('../../php/xml_functions.php');
				header("Content-type: application/xml; charset=UTF-8;");
				header('Content-Disposition: attachment; filename="'.$parameters['tableName'].'.xml"'); 
				return qResultToSXML($qResult,$parameters);
			break;
			case 'json':
				header("Content-type: application/json;  charset=UTF-8;");
				header('Content-Disposition: attachment; filename="'.$parameters['tableName'].'.json"'); 
				return queryResultToJSON($qResult,$parameters);
			break;
		}
	}
	/**
	 * This function returns search result from a query
	 * @return 
	 * @param $query String 
	 * @param $parameters Array[optional] parameters related to that table. i.e. Columns or sort info...
	 */
	function queryResultToJSON($qResult,$parameters=NULL,$allFields=NULL)
	{
//If configuration is not defined we add the fields in the result of the query by default.
		if (!is_array($parameters['columns']))
		{
			$fieldNum = mysql_num_fields($qResult);
			for ($i=0; $i<$fieldNum; $i++)
				$parameters['columns'][mysql_field_name($qResult,$i)]['title']='';
		}
		return resultToJSON($qResult,$parameters,$allFields);
	}
	/**
	 * json_encode function is preferred now. This is obsolete and will be removed when the places where this function is used 
	 * @return string JSON
	 * @param array $array array that will be converted Javascript Object.
	 */
//DBGrid source creators
	/**
	 * This function get you the column sets as an associated array. If no $setName defined it gives you all columns.
	 * @return array A parameters array that can be used to call arrayToJSON. To get fields use extractFields on this function.
	 * @param array $searchName Name of the Search
	 * @param string[optional] $setName Name of the columnSet
	 * @param array[optional] $columnList If a column configuration that is not a set is wanted, this array is used. List of colunmNames.
	 */
	function returnParameters($tableName=NULL,$setName=NULL,$columns=NULL)
	{
		$result = $GLOBALS['DBGridSettings'];
		if (!isset($tableName)) return $result;
		$result = array_merge((array)$GLOBALS['DBGridColumnSets'][$tableName][$setName],$result);
		if ($columns)
		{//We are asked for specific columns not the all columns defined in DBGrid_conf. So we shall send them only!
			$columns = Fill_Void_Titles($columns);
			$result['columns']=$columns;
		}
		else if (isset($setName) && (isset($tableName)) && ($setName!='allFields'))
		{
//We will send all the columnSet specific settings but columnSet name is not necessary so we delete it. Also we add the titles to the columns from the allFields
			unset($result['columns']);
			foreach ($GLOBALS['DBGridColumnSets'][$tableName][$setName]['columns'] as $fieldName)
				$result['columns'][$fieldName] = $GLOBALS['DBGridColumnSets'][$tableName]['allFields'][$fieldName];
		}
		else//return all fields
			$result['columns'] = $GLOBALS['DBGridColumnSets'][$tableName]['allFields'];
		return $result;
	}
	/**
	 * This function returns the columnSet list of a search.
	 * @return array columnSet=>array('name'=>'columnSetName');
	 * @param array $searchName Name of the search whose columnSets shall be returned.
	 */
	function returnColumnSetNames($searchName)
	{
		require_once('DBGrid_conf.php');
		$result = array();
		if (!isset($GLOBALS['DBGridColumnSets'][$searchName])) return '';
		foreach ($GLOBALS['DBGridColumnSets'][$searchName] as $setName=>$setProperties)
			if ($setName!='allFields') $result[$setName]['name'] = $setProperties['name'];	
		return $result;
	}
	/**
	 * This function extracts the columns from the parameters array.
	 * @return array array('fieldName'=>'fieldTitle');
	 * @param array $parameters DBGrid configuration parameters which may include exports, columns, row array.
	 */
	function extractFields($parameters)
	{
		$values = array_values($parameters['columns']);
		$notArray = (!is_array($values[0]));
		if ($notArray) return Fill_Void_Titles($parameters['columns']);
		$result = array();
		foreach ($parameters['columns'] as  $fieldName=>$fieldProperties)
			$result[$fieldName] = $fieldProperties['title'];
		$result= Fill_Void_Titles($result);
		return $result;
	}	
	/**
	 * return an array containing the column name and values for each row from the query result
	 * 
	 * @param mysql_resource $result a query result that will be processed for the DBGrid
	 * @param array $fields the fields wanted from the query result. It should be an associated array with field names adn their aliases.
	 * @return array $result_array = Array that will be used in order to convert to JSON.
	 */
	function resultToArray($result,$fields,$encoding='')
	{
		$i=0;
		while ($one_row=mysql_fetch_assoc($result)) 
		{
			foreach ($fields as $field_name=>$field_title)
				$result_array[$i][$field_name]=(is_numeric($one_row[$field_name]))?$one_row[$field_name]:mb_convert_encoding($one_row[$field_name],$encoding);
			$i++;
		}
		return $result_array;
	}
	/**
	 * This function returns JSON encoded version of the query result. Source for the DBGrid.
 	 * @return string JSON string
	 * @param mysql_resource $result
	 * @param array $fields 
	 * @param string $distinct_field 
	 * @see resultToArray
	 */
	function resultToJSON($result,$parameters,$allFields=null)
	{
		$array=resultToArray($result,extractFields($parameters));
		return arrayToJSON($array,$parameters,$allFields);
	}
	/**
	 * This function adds the parameters to the initially prepared array and converts to the JSON
	 * @return string JSON
	 * @param $array array
	 * @param $fields array
	 */
	function arrayToJSON($array,$parameters,$allFields=null)
	{
//We get the values that are in allFields but if none given then it will be only the $parameters
		if (!isset($allFields)) $allFields=$parameters;
		$fieldNamesAndTitles = extractFields($allFields);//extractFields also completes the columnTitles that are not given
//First add the caption
		$result = $parameters;
		$result['caption']=($parameters['tableName'])?($parameters['tableName']):'DBGrid';
		foreach ($fieldNamesAndTitles as $fieldName=>$fieldTitle)
		{
			$currentColumn = $result['columns'][$fieldName];
			$currentColumn['title'] = $fieldTitle;
//To understand which ones will be initially hidden we check whether it is wanted (is it in the $parameters['columns] array?)
			if (!array_key_exists($fieldName,$parameters['columns']) && ($fieldName != 'news_header'))
			{
				$currentColumn = array_merge($currentColumn,(array)$allFields['columns'][$fieldName]);
				$currentColumn['hidden'] = 1;
			}
//If the dataType is not given then we try to decide it. 
			if (!isset($currentColumn['dataType']))	$currentColumn['dataType'] = (is_float($array[0][$field_name]+0))?('real'):('string'); 
			//not the safest code to find float entities, what if first cell is void?
			if (!isset($currentColumn['parseHTML']))	$currentColumn['parseHTML']=1;
			$result['columns'][$fieldName] = $currentColumn;
		}
		$result['row']=$array;
		return json_encode($result);
	}
	function tagName($tag_name)
	{
		return str_replace('/','_',$tag_name);
	}
	function Fill_Void_Titles($fields)
	{
		if (array_key_exists('0',$fields))
		{
			foreach ($fields as $field)
				$output[$field]=ucwords(
			str_replace('_',' ',$field_name));
		}
		else
		{		
			foreach ($fields as $field_name=>$field_title)
				if($field_title)
					$output[$field_name]= $field_title;
				else 
					$output[$field_name]=ucwords(
			str_replace('_',' ',$field_name));
		}	
		return $output;
	}
?>