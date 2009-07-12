<?php
	require_once("../../php/aV.main.DBGrid.php");
//Project specific database connection code, update this according to your website
	$GLOBALS['link'] = mysql_connect('mysql300.ixwebhosting.com', 'snlBYK_jsltest', 'jsltestpwd');
	if (!$GLOBALS['link']) {echo "Connection Failed";exit;};
	mysql_select_db('snlBYK_jslib');
	mysql_query('SET NAMES utf8');
	$query = 'SELECT * FROM City LIMIT 100';
//Now function that creates DBGrid compatible output.
    echo queryToOutput($query);
?>