<?php
	$columnSets['test']['Basic'] = array('tableName'=>'Test Table', 'columns'=> array (
		'ID','Name'
	));
	$columnSets['test']['Detailed'] = array('tableName'=>'Test Table', 'columns'=> array (
		'ID','Name','CountryCode','Population'
	));
	$columnSets['test']['allFields']=array(
		'ID'=>array('visible'=>'0','dontSum'=>'1', 'dataType'=>'int'),'Name'=>array('title'=>'City Name','dataType'=>'string','visible'=>'1','dontSum'=>'1'),
		'CountryCode'=>array('title'=>'Country Code','dataType'=>'string'),'Population'=>array('dataType'=>'int')
	);
	$GLOBALS['DBGridColumnSets']=$columnSets;
	$GLOBALS['DBGridSettings']['exports']=array(
			'xlsb'=>array('alias'=>'Excel 97'),
			'xls'=>array('alias'=>'Excel XML'),
			'xml'=>array('alias'=>'XML'),
			'json'=>array('alias'=>'JSON')
	);		
 ?>