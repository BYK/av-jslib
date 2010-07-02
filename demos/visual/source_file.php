<?php
	require_once("../../php/aV.main.DBGrid.php");
	require_once("DBGridConf.php");
//Project specific database connection code, update this according to your website
	require_once('databaseConn.php');
	$query = 'SELECT * FROM Country LIMIT 100';
//Now function that creates DBGrid compatible output.
    echo queryToOutput($query,NULL,'ultimateDemo','Detailed');
?>