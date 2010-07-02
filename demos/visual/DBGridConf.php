<?php
	$columnSets['ultimateDemo']['Basic'] = array('tableName'=>'Countries and Populations'
		,'maxBodyHeight'=>400
		,'columns'=> array (
			'Name','Population'
	));
	$columnSets['ultimateDemo']['Detailed'] = array('tableName'=>'Country Informations (Detailed)'
		,'maxBodyHeight'=>0
		,'sort'=>array(array('column'=>'Region','direction'=>1),array('column'=>'SurfaceArea','direction'=>1),array('column'=>'Population','direction'=>-1))
//		,'grouped'=>1
		,'eventHandlers'=>array(
//			'rowprint'=>'if (parseFloat(event.rowData.Population)>20000) event.row.style.backgroundColor="#DF3040";')
			'rowprint'=>'if (parseFloat(event.rowData.Population)>20000) event.row.style.backgroundColor=event.target.properties.columns.Population.highPopulationColor;'
			,'printend'=>'if (console) console.log(event); aV.infoBox.show("Fetching process of Detailed Country Information is Completed.",aV.config.infoBox.images.info);return false;')
		,'maxRowsInPage'=>50
		,'columns'=> array (
			'Code','Name','Continent','Region','SurfaceArea','Population'
	));
	$columnSets['ultimateDemo']['allFields']=array(
		'Code'=>array()
		,'Name'=>array('title'=>'Country Name')
		,'Continent'=>array()
		,'Region'=>array()
		,'SurfaceArea'=>array('title'=>'Surface Area','dataType'=>'real','dontSum'=>1)
		,'Population'=>array('dataType'=>'int','highPopulationColor'=>'#DF5040')
	);
	$GLOBALS['DBGridColumnSets']=$columnSets;		
 ?>