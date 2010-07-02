<?
	header('Content-Type: application/json; charset=UTF-8');
	require_once('databaseConn.php');
	$code = mysql_escape_string($_REQUEST['code']);
	$column = mysql_escape_string($_REQUEST['column']);
	$value = mysql_escape_string($_REQUEST['value']);
	$qResult = mysql_query("UPDATE Country SET $column = '$value' WHERE Code = '$code'");
	echo json_encode(array('value'=>($qResult)?$value:''));
?>
