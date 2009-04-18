<?php
	if (is_numeric($_REQUEST['itemCount']))
		echo "{value: {$_REQUEST['itemCount']}}";
	else
		echo "{type: 'error', message: 'Only numerical values are accepted.'}";
?>