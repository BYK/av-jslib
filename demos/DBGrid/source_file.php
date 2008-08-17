<?php
	require_once("DBGrid_functions.php");
	$link = mysql_connect('mysql300.ixwebhosting.com', 'snlBYK_jsltest', 'jsltestpwd');
	if (!$link) {echo "Connection Failed";exit;};
	mysql_select_db('snlBYK_jslib');
	mysql_query('SET NAMES utf8');
	
    $qTitles=array('tableCaption'=>'Results from World Cities Table','exportTypes'=>'xml,xls','ID'=>array('visible'=>'0','dontSum'=>'1'),'Name'=>array('alias'=>'City Name','type'=>'string','visible'=>'1','dontSum'=>'1'),'CountryCode'=>array('alias'=>'Country Code','type'=>'string'),'Population'=>array('type'=>'real','dontSum'=>'0'));
    query_to_table_source('SELECT * FROM City LIMIT 50',$qTitles);
?>
