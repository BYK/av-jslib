<?php
  header("Content-type: text/javascript; charset=UTF-8");
	if ($_REQUEST["basepath"])
		chdir($_REQUEST["basepath"]);
	$filePath=realpath($_REQUEST["filename"]);
	if (!file_exists($filePath))
	{
		header("HTTP/1.1 404 Not Found");
		exit;
	}
	else if (!is_numeric($_REQUEST["UID"]))
	{
		header("HTTP/1.1 401 Bad Request");
		exit;
	}
	include($filePath);
	echo "\nif (window.onscriptload)\n\twindow.onscriptload({type: 'scriptload', module: '".basename($_REQUEST["filename"])."', moduleUID: {$_REQUEST["UID"]}});";
?>