<?php
	require_once("../../php/functions.php");
	$GLOBALS['link'] = mysql_connect('mysql300.ixwebhosting.com', 'snlBYK_jsltest', 'jsltestpwd');
	if (!$GLOBALS['link']) {echo "Connection Failed";exit;};
	mysql_select_db('snlBYK_jslib');
	mysql_query('SET NAMES utf8');
    echo queryToOutput('SELECT * FROM City LIMIT 100','test','Basic',$_REQUEST['outputType']);
?>
