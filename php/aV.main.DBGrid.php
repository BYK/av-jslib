<?php
	/**
	 * This function is the only function that will be used by standard users. 
	 * @param string $query The query whose results will be tabulated.
	 * @param array  $parameters The parameters can include the columns that should be sent, aliases for the columns, some settings for DBGrid like the Height, number of rows in a page, some JS code to be executed when a row is clicked or printed.  
	 * @param string $tableName Should be given if the parameters should be taken from a DBGrid_conf.php file
	 * @param string $setName Each table can have different settings. Examine the sample DBGrid?conf.php file for further details.
	 * @param string $outputType This can be json or xml. Client side of DBGrid can work with both type of data. Soon only option will be JSON since XML tags take too much bandwidth.
	 * @return binary/string Depends on the parameter can return an MS-Excel file or DBGrid source data.
	 */
    function queryToOutput($query,$parameters=NULL,$tableName=NULL,$setName=NULL,$outputType='json')
	{
		$qResult = mysql_query($query,$GLOBALS['link']);
//If no parameters we generate the parameters.
		if (!isset($parameters))
			$parameters = returnParameters($tableName,$setName,$_REQUEST['columns']);
		if (!$parameters['caption']) $parameters['caption'] = 'aV DBGrid';
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
//When returnParameters is called with only tableName allFields are received.
				return queryResultToJSON($qResult,$parameters,returnParameters($tableName));
			}	
		};
//$fields is $field_name=>$field_alias associated array. Without properties like hidden, dontSum since they are only used in DBGrid.
		$fields = extractFields($parameters);
		require_once("../../php/excel_functions.php");
		switch ($_REQUEST['export'])
		{
			case 'xls':
				header("Content-type: application/x-msexcel");
				header('Content-Disposition: attachment; filename="'.$parameters['caption'].'.xls"');
				return resultToExcel($qResult,$fields,$parameters['tableName']);
			break;
			case 'xlsb':
				header("Content-type: application/x-msexcel");
				header('Content-Disposition: attachment; filename="'.$parameters['caption'].'.xls"'); 
				return resultToExcel($qResult,$fields,$parameters['tableName'],false);
			break;
			case 'xml':
				require_once('../../php/xml_functions.php');
				header("Content-type: application/xml; charset=UTF-8;");
				header('Content-Disposition: attachment; filename="'.$parameters['caption'].'.xml"'); 
				return qResultToSXML($qResult,$parameters);
			break;
			case 'json':
				header("Content-type: application/json;  charset=UTF-8;");
				header('Content-Disposition: attachment; filename="'.$parameters['caption'].'.json"'); 
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
			$fields = array();
			for ($i=0; $i<$fieldNum; $i++)
				$fields []= mysql_field_name($qResult,$i);
			$parameters['columns'] = fieldsToParams($fields);	
		}
		return resultToJSON($qResult,$parameters,$allFields);
	}

//DBGrid source creators
	/**
	 * This function get you the column sets as an associated array. If no $setName defined it gives you all columns.
	 * @return array A parameters array that can be used to call arrayToDBGridJSON. To get fields use extractFields on this function.
	 * @param array $searchName Name of the Search
	 * @param string[optional] $setName Name of the columnSet
	 * @param array[optional] $columnList If a column configuration that is not a set is wanted, this array is used. List of columnNames.
	 */
	function returnParameters($tableName=NULL,$setName=NULL,$columns=NULL)
	{
		$result = array();
		if ($columns)
		{//We are asked for specific columns. Convert columns into DBGrid structure. It will use the user defined names is tableName is given.
			$columns = fieldsToParams($columns,$tableName);
			$result['columns']=$columns;
			return $result;
		}
		if (!isset($tableName)) return $result;
		$result = array_merge((array)$GLOBALS['DBGridColumnSets'][$tableName][$setName],$result);
		if (isset($setName) && (isset($tableName)) && ($setName!='allFields'))
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
	 * @param array $parameters DBGrid configuration parameters which may include exports, columns array.
	 */
	function extractFields($parameters)
	{
		$result = array();
		foreach ($parameters['columns'] as  $fieldName=>$fieldProperties)
			$result[$fieldName] = $fieldProperties['title'];
		return $result;
	}	
	/**
	 * return an array containing the column name and values for each row from the query result
	 * 
	 * @param mysql_resource $result a query result that will be processed for the DBGrid
	 * @param array $fields the fields wanted from the query result. It should be an associated array with field names and their aliases.
	 * @return array $result_array = Array that will be used in order to convert to JSON.
	 */
	function resultToArray($result,$fields,$encoding='')
	{
		$result_array = array();
		while ($one_row=mysql_fetch_assoc($result))
				$result_array[]=$one_row;
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
		return arrayToDBGridJSON($array,$parameters,$allFields);
	}
	/**
	 * This function adds the parameters to the initially prepared array and converts to the JSON
	 * @return string JSON
	 * @param $array array
	 * @param $fields array
	 */
	function arrayToDBGridJSON($array,$parameters,$allFields=null)
	{
		$parameters['exports'] = supportedExports();
//We get the values that are in allFields but if none given then it will be only the $parameters
		if (!$allFields)	$allFields=$parameters;
		$fieldNamesAndTitles = extractFields($allFields);
		$result = $parameters;
		foreach ($fieldNamesAndTitles as $fieldName=>$fieldTitle)
		{
			$currentColumn = $result['columns'][$fieldName];
			$currentColumn['title'] = $fieldTitle;
//Now merge the properties defined in allFields with the parameters array
			$currentColumn = array_merge($currentColumn,(array)$allFields['columns'][$fieldName]);
//To understand which ones will be initially hidden we check whether it is wanted (is it in the $parameters['columns] array?)
			if (!array_key_exists($fieldName,$parameters['columns']))
				$currentColumn['hidden'] = 1;
//If the dataType is not given then we try to decide it. 
			if (!isset($currentColumn['dataType']))	$currentColumn['dataType'] = (is_float($array[0][$field_name]+0))?('real'):('string'); 
			//not the safest code to find float entities, what if first cell is void?
			if (!isset($currentColumn['parseHTML']))	$currentColumn['parseHTML']=1;
			$result['columns'][$fieldName] = $currentColumn;
		}
		$result['row']=$array;
		return json_encode($result);
	}
	/**
	 * This function converts fields array into columns array that is supported by DBGrid.
	 * fieldName=>fieldTitle or just array of fields will be converted.
	 * @param $fields can be an array or an associated array with preferred field Titles
	 * @param $tableName if given the information corresponding to columns will be taken from the configuration file.
	 * @return array Array will have at least title property. field=>array('title'=>'  ','...'=>'');
	 */
	function fieldsToParams($fields,$tableName=NULL)
	{
		if (array_key_exists('0',$fields))
		{
			foreach ($fields as $fieldName)
			{
				$output[$fieldName]['title']= makeFieldName($fieldName);
				if (is_array($GLOBALS['DBGridColumnSets'][$tableName]['allFields'][$fieldName]))
					$output[$fieldName]=array_merge($output[$fieldName],$GLOBALS['DBGridColumnSets'][$tableName]['allFields'][$fieldName]);
			}	
		}
		else
		{		
			foreach ($fields as $fieldName=>$fieldTitle)
			{
				$output[$fieldName]['title']= (!$fieldTitle)?makeFieldName($fieldName):$fieldTitle;
				if (is_array($GLOBALS['DBGridColumnSets'][$tableName]['allFields'][$fieldName]))
					$output[$fieldName]=array_merge($output[$fieldName],$GLOBALS['DBGridColumnSets'][$tableName]['allFields'][$fieldName]);
			}
		}	
		return $output;
	}
	function makeFieldName($fieldName)
	{
		return ucwords(str_replace('_',' ',$fieldName));
	}
	function supportedExports()
	{
			return array(
			'xlsb'=>array('alias'=>'Excel 97'),
			'xls'=>array('alias'=>'Excel XML'),
			'xml'=>array('alias'=>'XML'),
			'json'=>array('alias'=>'JSON')
	);	
	}
?>