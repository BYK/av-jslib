<?php
	if ($_REQUEST['var']=='idPicture')
		echo "{path: 'images/byk.gif'}";
	else
		echo "{value: '".addslashes($_REQUEST['val'])."'}";
?>