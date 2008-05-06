<?
 header('Content-Type: text/plain; charset=iso-8859-1');
 $list = fopen((($_REQUEST['table']==0)?"names":"surnames").".txt","r");
 $filtered = array();
 while(!feof($list))
  {
   $one_name = fgets($list);
   if(!strcasecmp(substr($one_name,0,strlen($_REQUEST['filter'])), $_REQUEST['filter']))
   	array_push($filtered, $one_name);

  }
 fclose($list);
 foreach($filtered as $one_filter)
 {
 	echo $one_filter."\n";
 }
?>
