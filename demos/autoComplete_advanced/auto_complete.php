<?php
	header('Content-Type: text/plain; charset=iso-8859-1');
	$list = fopen("names.txt","r");
	$pattern = "/".substr($_REQUEST["filter"], 0, $_REQUEST["cPos"]).".*".substr($_REQUEST["filter"], $_REQUEST["cPos"])."/i";  
	$filtered = array();
	while (!feof($list))
	{
		$one_name = fgets($list);
		if (preg_match($pattern, $one_name))
			array_push($filtered, $one_name);
	}
	fclose($list);
	echo implode($filtered, "\n");
?>
