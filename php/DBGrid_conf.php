<?php
	$columnSets['test']['Basic'] = array('tableName'=>'Test Table', 'columns'=> array (
		'ID','Name'
	));
	$columnSets['test']['Detailed'] = array('tableName'=>'Test Table', 'columns'=> array (
		'ID','Name','CountryCode','Population'
	));
	$columnSets['test']['allFields']=array(
		'ID'=>array('visible'=>'0','dontSum'=>'1'),'Name'=>array('title'=>'City Name','type'=>'string','visible'=>'1','dontSum'=>'1'),
		'CountryCode'=>array('title'=>'Country Code','type'=>'string'),'Population'=>array('type'=>'real','dontSum'=>'0')
	);
	$GLOBALS['DBGridColumnSets']=$columnSets;
	$GLOBALS['DBGridSettings']['exports']=array(
			'xlsb'=>array('alias'=>'Excel 97'),
			'xls'=>array('alias'=>'Excel XML'),
			'xml'=>array('alias'=>'XML'),
			'json'=>array('alias'=>'JSON')
	);		
 ?>