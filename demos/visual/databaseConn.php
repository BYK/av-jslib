<?php
	$GLOBALS['link'] = mysql_connect('localhost', 'snlbyk_jsltest', 'jsltestpwd');
	if (!$GLOBALS['link']) {echo "Connection Failed";exit;};
	mysql_select_db('snlbyk_jslibtest');
	mysql_query('SET NAMES utf8');
?>