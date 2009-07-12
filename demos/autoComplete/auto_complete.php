<?
	header('Content-Type: application/json; charset=iso-8859-1');
	$list = fopen((($_REQUEST['table']==0)?"names":"surnames").".txt","r");
	$filtered = array();
	$counter = 0;
	while(!feof($list))
	{
		$one_name = fgets($list);
		if(!strcasecmp(substr($one_name,0,strlen($_REQUEST['filter'])), $_REQUEST['filter']))
			array_push($filtered, array('id' => ++$counter, 'value' => $one_name));
	}
	fclose($list);
	echo json_encode($filtered);
?>
