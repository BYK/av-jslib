<?php
	$phase = array('enumValues'=>array('Marketed','Approved','Approvable','Tentative Approval','Registration','ANDA','Phase 3','Phase 2','Phase 1','Bioequivalancy',
	'Pre Clinical','Research','Discontinued/Inactive','Non-Approvable','Undisclosed'),
	'getEnumIndex'=>'var matcher=new RegExp("^([\\\w\\\s]+)\s*(Finished|Ongoing|)\s*(<br/>|$)");
		value=value.replace(/&nbsp;/g," ").trim("[\\\s\\\xB7]").match(matcher);
		value=this.enumValues.indexOf((value)?value[1].trim():"");
		if (value<0)
			value=this.enumValues.length;
		return value;',
	'comparator'=>'if (!(this.getEnumIndex instanceof Function))
	this.getEnumIndex=new Function("value", this.getEnumIndex);
	return this.getEnumIndex(a) - this.getEnumIndex(b);');
	$columnSets['company']['Basic(no summary)'] = array('name'=>'Basic(no summary)', 'columns'=>array(
		'composite_company_name',
		'acquiring_company_id','investor_company_id',
		'private_public','business_model',
		'development_capabilities',
		'year_founded',
		'telephone','fax','address',
		'city','US_state',
		'country','market_cap')
	);
	$columnSets['company']['Detailed'] = array('name'=>'Detailed', 'columns'=>array(
		'composite_company_name',
		'acquiring_company_id','investor_company_id',
		'company_summary','private_public','business_model',
		'development_capabilities',
		'year_founded',
		'telephone','fax','address',
		'city','US_state',
		'country','market_cap')
	);
	$columnSets['company']['Only Names'] = array(
		'name'=>'Only Names',
		'columns'=> array ('composite_company_name')
	);
	$columnSets['company']['allFields']=array('composite_company_name'=>array('title'=>'Company Name'), 'private_public'=>array('title'=>'Private/Public'), 'business_model'=>array()
		, 'country'=>array(), 'acquiring_company_id'=>array('title'=>'Acquired By'), 'investor_company_id'=>array('title'=>'VC Investors')
		, 'subsidiary'=>array('title'=>'Subsidiary of'), 'development_capabilities'=>array(), 'year_founded'=>array('dataType'=>'real','dontSum'=>'1')
		, 'telephone'=>array(), 'fax'=>array(), 'address'=>array()
		, 'city'=>array(), 'US_state'=>array(), 'company_summary'=>array()
		, 'number_of_employees'=>array('dataType'=>'real')
		, 'market_cap'=>array('dataType'=>'real')
	);
//compound
	$columnSets['compound']['Basic'] = array(
		'name'=>'Basic',
		'columns'=> array ('composite_product_name',
		'therapeutic_category_id_1',
		'phase_1',
		'molecule_id_1',
		'generic_or_innovator',
		'product_owner_company_id','partner_company_id_1',
		'drug_delivery_branch_id_1','dds_technology_owner_company_id')
	);
	$columnSets['compound']['Semi-Detailed'] = array(
		'name'=>'Semi-Detailed',
		'columns'=> array ('composite_product_name',
		'therapeutic_category_id_1',
		'phase_1',
		'molecule_id_1',
		'generic_or_innovator',
		'product_owner_company_id','partner_company_id_1',
		'drug_delivery_branch_id_1',
		'dosing',
		'composite_mechanism_types',
		'grouped_molecule_type',
		'technology_id_1',
		'dds_technology_owner_company_id',
		'approval_exclusivity')
	);				
	$columnSets['compound']['Detailed'] = array(
		'name'=>'Detailed',
		'columns'=> array ('composite_product_name',
		'therapeutic_category_id_1',
		'phase_1',
		'molecule_id_1',
		'generic_or_innovator',
		'product_owner_company_id','partner_company_id_1',
		'drug_delivery_branch_id_1',
		'dosing',
		'composite_mechanism_types',
		'composite_mechanism',
		'grouped_molecule_type',
		'PK_properties',
		'elimination_half_life',
		'molecular_weight',
		'water_solubility',
		'technology/formulation','how_supplied/administered',
		'technology_id_1',
		'physical_chemical_properties',
		'dds_technology_owner_company_id',
		'approval_exclusivity')
	);
	$columnSets['compound']['Only Names'] = array(
		'name'=>'Only Names',
		'columns'=> array ('composite_product_name')
	);
	$columnSets['compound']['allFields']=array('composite_product_name'=>array('title'=>'Product/Pipeline Name'), 'therapeutic_category_id_1'=>array('title'=>'Therapeutic Categories'), 'phase_1'=>array_merge(array('title'=>'Phases'), $phase)
		, 'molecule_id_1'=>array('title'=>'Molecules'), 'generic_or_innovator'=>array('title'=>'Product Type')
		, 'product_owner_company_id'=>array('title'=>'Product Owner'), 'partner_company_id_1'=>array('title'=>'Partners')
		, 'drug_delivery_branch_id_1'=>array('title'=>'Drug Delivery Route'), 'dosing'=>array('title'=>'Dosing')
		, 'composite_mechanism_types'=>array('title'=>'Mechanism Type'), 'grouped_molecule_type'=>array('title'=>'Molecule Type'), 'technology_id_1'=>array('title'=>'DDS Technologies')
		, 'dds_technology_owner_company_id'=>array('title'=>'DDS Technology Owner'), 'approval_exclusivity'=>array('title'=>'Approval / Exclusivity'), 'composite_territory'=>array('title'=>'Territories(owner then partners)')
		, 'composite_mechanism'=>array('title'=>'Mechanisms Explanation'), 'PK_properties'=>array(), 'elimination_half_life'=>array()
		, 'molecular_weight'=>array('title'=>'Molecular Weight','dontSum'=>'1','dataType'=>'real'), 'water_solubility'=>array(), 'technology/formulation'=>array('title'=>'Technology/Formulation')
		, 'how_supplied/administered'=>array('title'=>'How Supplied/Administered'), 'physical_chemical_properties'=>array()
	);
//EMEA
	$columnSets['EMEA']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'product_name', 'emea_product_hyperlink', 
		'emea_europa_company_id','active_substance',
		'common_name','therapeutic_group',
		'indication')
	);
	$columnSets['EMEA']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'product_name', 'emea_product_hyperlink', 
		'emea_europa_company_id','active_substance',
		'common_name','therapeutic_group','ATC_code',
		'indication','marketing_authorisation_date',
		'orphan_product_designation_date'
	));
	$columnSets['EMEA']['Only Names'] = array(
		'name'=>'Only Names',
		'columns'=> array ('product_name')
	);
	$columnSets['EMEA']['allFields']=array('product_name'=>array(), 'emea_product_hyperlink'=>array(), 'emea_europa_company_id'=>array('title'=>'Company')
		, 'active_substance'=>array(), 'common_name'=>array(), 'therapeutic_group'=>array()
		, 'indication'=>array(), 'ATC_code'=>array(), 'marketing_authorisation_date'=>array()
		, 'orphan_product_designation_date'=>array()
	);
//fda_package
	$columnSets['fda_package']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'TRADENAME','applicant','FIRM_NAME','package_ndc','package_strength','PACKTYPE','PACKSIZE'
	));
	$columnSets['fda_package']['allFields']=array('TRADENAME'=>array('title'=>'Trade Name'), 'applicant'=>array('title'=>'Product Owner Company'), 'FIRM_NAME'=>array('title'=>'Package Supplier')
		, 'package_ndc'=>array('title'=>'NDC Number'), 'package_strength'=>array('title'=>'Dosage Strength','dataType'=>'real','dontSum'=>'1'), 'PACKTYPE'=>array('title'=>'Package Type')
		, 'PACKSIZE'=>array('title'=>'Package Size','dataType'=>'real','dontSum'=>'1')
	);
//fda_product
//sort array for fda_product
	$sortArray = array(array('column'=>'application_number','direction'=>'1'),array('column'=>'composite_fda_strength',direction=>'1'));
	$grouped = '1';
	$columnSets['fda_product']['Basic'] = array('name'=>'Basic', 'sort'=>$sortArray, 'grouped'=>$grouped,
		'columns'=> array (
		'composite_proprietary','application_number','active_ingredient','dosage_form','composite_fda_strength','compound_id',
		'applicant','approval_date','rx_otc_discn','ReferenceDrug','Chemical_Type',
		'grouped_exclusivity_expiration','grouped_Patent_Expire_Date'
	));
	$columnSets['fda_product']['Detailed'] = array('name'=>'Detailed', 'sort'=>$sortArray, 'grouped'=>$grouped,
		'columns'=> array (
		'composite_proprietary','application_number','active_ingredient','dosage_form','composite_fda_strength','compound_id',
		'applicant','approval_date','rx_otc_discn','ReferenceDrug','ANDA','Chemical_Type',
		'grouped_exclusivity_expiration','grouped_Patent_Expire_Date'
	));
	$columnSets['fda_product']['Only Names'] = array('name'=>'Only Names', 'columns'=> array (
		'proprietary'
	));
	$columnSets['fda_product']['allFields']=array('proprietary'=>array()
		, 'composite_proprietary'=>array()
		, 'application_number'=>array()
		, 'active_ingredient'=>array('title'=>'Molecule Name')
		, 'dosage_form'=>array()
		, 'composite_fda_strength'=>array('title'=>'Strength','dataType'=>'real','dontSum'=>'1')
		, 'compound_id'=>array('title'=>'PharmaCircle Entity')
		, 'applicant'=>array()
		, 'approval_date'=>array()
		, 'ReferenceDrug'=>array('title'=>'Reference Drug')
		, 'Chemical_Type'=>array('title'=>'Application Category')
		, 'rx_otc_discn'=>array('title'=>'RX / OTC / DISCN')
		, 'ANDA'=>array()
		, 'grouped_exclusivity_expiration'=>array()
		, 'grouped_Patent_Expire_Date'=>array()
		);
//fda_adverse
	$columnSets['fda_adverse']['Demographic (Only)'] = array('name'=>'Demographic (Only)', 'columns'=> array (
		'isr','mfr_sndr','aers_age','aers_weight','aers_gender','rept_dt','death_dt'
	));
	$columnSets['fda_adverse']['Demographic (With Outcome)'] = array('name'=>'Demographic (With Outcome)', 'columns'=> array (
		'isr','aers_pt','aers_outc','mfr_sndr','aers_age','aers_weight','aers_gender','rept_dt','death_dt'
	));
	$columnSets['fda_adverse']['Demographic (With Drug)'] = array('name'=>'Demographic (With Drug)', 'columns'=> array (
		'isr','aers_drugname','aers_indi','aers_ther','mfr_sndr','aers_age','aers_weight','aers_gender','rept_dt','death_dt'
	));
	$columnSets['fda_adverse']['Demographic (With Drug & Outcome)'] = array('name'=>'Demographic (With Drug & Outcome)', 'columns'=> array (
		'isr','aers_drugname','aers_indi','aers_ther','mfr_sndr','aers_pt','aers_outc','aers_age','aers_weight','aers_gender','rept_dt','death_dt'
	));
	$columnSets['fda_adverse']['allFields']=array('isr'=>array('title'=>'ISR'), 'mfr_sndr'=>array('title'=>'Manufacturer'), 'aers_age'=>array('title'=>'Age','dontSum'=>'1','dataType'=>'real')
		, 'aers_weight'=>array('title'=>'Weight','dontSum'=>'1','dataType'=>'real'), 'aers_gender'=>array('title'=>'Gender'), 'rept_dt'=>array('title'=>'Report Date')
		, 'death_dt'=>array('title'=>'Death Date'), 'aers_pt'=>array('title'=>'Adverse Event'), 'aers_outc'=>array('title'=>'Outcome')
		, 'aers_drugname'=>array('title'=>'Drug (Role)'), 'aers_indi'=>array('title'=>'Indication')
		, 'aers_ther'=>array('title'=>'Duration of Therapy')
	);
//deal
	$columnSets['deal']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'news_header', 'date', 'news_branch','company_id_1','source','event_type',
		'drug_delivery_branch_id','therapeutic_category_id',
		'technology_id','compound_id'
	));
	$columnSets['deal']['Financial'] = array('name'=>'Financial', 'columns'=> array (
		'news_header', 'date', 'news_branch','company_id_1',
		'territory_company_1',
		'deal_contract',
		'venture_type',
		/*'event_comment',*/'total_deal_value',
		'total_deal_value_in_million_dollars','total_deal_currency',
		'upfront_payment','equity',
		'milestones','royalty_percent',
		'royalty_value'
	));
	$columnSets['deal']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'news_header', 'date', 'news_branch','company_id_1','source','event_type',
		'drug_delivery_branch_id','therapeutic_category_id',
		'technology_id','compound_id',
		'territory_company_1',
		'deal_contract','hyperlink',
		'explanation',
		'venture_type',
		/*'event_comment',*/'total_deal_value',
		'total_deal_value_in_million_dollars','total_deal_currency',
		'upfront_payment','equity',
		'milestones','royalty_percent',
		'royalty_value'
	));
	$columnSets['deal']['Only Abstract'] = array('name'=>'Only Abstract', 'columns'=> array (
		'news_header', 'date'
	));
		/*$columnSets['deal']['Basic'] = array('name'=>'Basic', 'columns'=> array ('explanation','content','company_id_1');
		$columnSets['deal']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
			'explanation','content','company_id_1','technology_id',
			'drug_delivery_branch_id','therapeutic_category_id','source'
		));
		$columnSets['deal']['Only Names'] = array('name'=>'Only Names', 'columns'=> array ('explanation');*/
	$columnSets['deal']['allFields']=array('news_header'=>array(),'news_header'=>array('title'=>'Header'), 'date'=>array(), 'news_branch'=>array('title'=>'Deal Type')
		, 'company_id_1'=>array('title'=>'Owner|Licenser Companies'), 'source'=>array(), 'event_type'=>array_merge(array('title'=>'Phase'),$phase)
		, 'territory_company_1'=>array('title'=>'Territories'), 'deal_contract'=>array(), 'venture_type'=>array()
		, 'total_deal_value'=>array(), 'total_deal_value_in_million_dollars'=>array('dataType'=>'real'), 'total_deal_currency'=>array()
		, 'upfront_payment'=>array('dataType'=>'real'), 'equity'=>array('dataType'=>'real'), 'milestones'=>array('dataType'=>'real')
		, 'royalty_percent'=>array('dataType'=>'real','dontSum'=>'1'), 'royalty_value'=>array('dataType'=>'real'), 'drug_delivery_branch_id'=>array('title'=>'Drug Delivery Branch')
		, 'therapeutic_category_id'=>array('title'=>'Therapeutic Category'), 'technology_id'=>array('title'=>'Technology'), 'compound_id'=>array('title'=>'Product/Pipeline')
		, 'hyperlink'=>array(), 'explanation'=>array()
	);
//dds_patent
	$columnSets['dds_patent']['Basic'] = array('name'=>'Basic(no abstract)', 'columns'=> array (
		'patent_title','patent_date',
		'drug_delivery_branch_id_1', 'company_id', 
		'inventors', 'patent_number', 
		'issued_or_published', 'patent_hyperlink'
	));
	$columnSets['dds_patent']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'patent_title','patent_date', 'explanation', 
		'drug_delivery_branch_id_1', 'company_id',
		'inventors', 'patent_number', 
		'issued_or_published', 'patent_hyperlink'
	));
	$columnSets['dds_patent']['Only Names'] = array('name'=>'Only Names', 'columns'=> array (
		'patent_title'
	));
	$columnSets['dds_patent']['allFields']=array('patent_number'=>array(), 'patent_title'=>array(), 'patent_date'=>array()
		, 'drug_delivery_branch_id_1'=>array('title'=>'Drug Delivery Branch'), 'company_id'=>array('title'=>'Company Name'), 'inventors'=>array()
		, 'issued_or_published'=>array(), 'patent_hyperlink'=>array('title'=>'Hyperlink'), 'explanation'=>array()
	);
//molecule
	$columnSets['molecule']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'composite_molecule_name', 'molecular_formula', 
		'chemical_name', 'CAS_registry', 
		'chiral_form', 'molecular_weight', 
		'molecule_type','antibody_type',
		'mechanism_type_id_1', 'source'
	));
	$columnSets['molecule']['Semi-Detailed'] = array('name'=>'Semi-Detailed', 'columns'=> array (
		'composite_molecule_name', 'molecular_formula', 
		'chemical_name', 'CAS_registry', 
		'chiral_form', 'molecular_weight', 
		'molecule_type','antibody_type', 
		'source', 'water_solubility', 
		'physical_form', 'polymorphism', 
		'melting_point', 'BCS_classification', 
		'show_reference_BCS',
		'physical_chemical_properties',
		'charged_molecule',
		'pKa1','pKa2','pl','molecule_PK_information',
		'mechanism_type_id_1',
		'explanation','hyperlinks_to_patents','references'
	));	
	$columnSets['molecule']['Bioavailability'] = array('name'=>'Bioavailability', 'columns'=> array (
		'composite_molecule_name', 
		'molecule_type',
		'oral_bioavailability','oral_bioavailability_percent',
		'oral_bioavailability_percent_high','nasal_bioavailability_percent',
		'nasal_bioavailability_percent_high','skin_bioavailability_percent',
		'skin_bioavailability_percent_high','SC/IM_bioavailability_percent',
		'SC/IM_bioavailability_percent_high','inhalation_bioavailability_percent',
		'inhalation_bioavailability_percent_high','buccal/sublingual_bioavailability_percent',
		'buccal/sublingual_bioavailability_percent_high'
	));
	$columnSets['molecule']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'composite_molecule_name', 'molecular_formula', 
		'chemical_name', 'CAS_registry', 
		'chiral_form', 'molecular_weight', 
		'molecule_type','antibody_type', 
		'source', 'water_solubility', 
		'physical_form', 'polymorphism', 
		'melting_point', 'BCS_classification', 
		'show_reference_BCS',
		'physical_chemical_properties',
		'charged_molecule',
		'pKa1','pKa2','pl','molecule_PK_information',
		'elimination_half_life','elimination_half_life_high','volume_of_distribution',
		'volume_of_distribution_high','clearance',
		'clearance_high','mechanism','mechanism_type_id_1',
		'bitter_taste','elimination_pathway',
		'is_the_metabolite_active','plasma_protein_binding',
		'oral_bioavailability','oral_bioavailability_percent',
		'oral_bioavailability_percent_high','nasal_bioavailability_percent',
		'nasal_bioavailability_percent_high','skin_bioavailability_percent',
		'skin_bioavailability_percent_high','SC/IM_bioavailability_percent',
		'SC/IM_bioavailability_percent_high','inhalation_bioavailability_percent',
		'inhalation_bioavailability_percent_high','buccal/sublingual_bioavailability_percent',
		'buccal/sublingual_bioavailability_percent_high','first_pass_extraction',
		'pass_extraction_percent','food_effect','food_effect_percent',
		'brain/CSF_uptake','octanol_type','logP','clogp',
		'p_gp_effect','CYP3A4','explanation','hyperlinks_to_patents','references'
	));
	$columnSets['molecule']['Only Names'] = array('name'=>'Only Names', 'columns'=> array (
		'composite_molecule_name'
	));
	$columnSets['molecule']['allFields']=array('composite_molecule_name'=>array('title'=>'Name'), 'molecular_formula'=>array(), 'chemical_name'=>array()
		, 'CAS_registry'=>array(), 'chiral_form'=>array(), 'molecular_weight'=>array('dataType'=>'1','dontSum'=>'1')
		, 'molecule_type'=>array(), 'antibody_type'=>array(), 'mechanism_type_id_1'=>array()
		, 'source'=>array(), 'water_solubility'=>array(), 'physical_form'=>array()
		, 'polymorphism'=>array(), 'melting_point'=>array('dataType'=>'real','dontSum'=>'1'), 'BCS_classification'=>array()
		, 'show_reference_BCS'=>array(), 'physical_chemical_properties'=>array(), 'charged_molecule'=>array()
		, 'pKa1'=>array(), 'pKa2'=>array(), 'pl'=>array()
		, 'molecule_PK_information'=>array(), 'explanation'=>array(), 'hyperlinks_to_patents'=>array()
		, 'references'=>array(), 'oral_bioavailability'=>array(), 'oral_bioavailability_percent'=>array('dataType'=>'real','dontSum'=>'1')
		, 'oral_bioavailability_percent_high'=>array('dataType'=>'real','dontSum'=>'1'), 'nasal_bioavailability_percent'=>array('dataType'=>'real','dontSum'=>'1'), 'nasal_bioavailability_percent_high'=>array('dataType'=>'real','dontSum'=>'1')
		, 'skin_bioavailability_percent'=>array('dataType'=>'real','dontSum'=>'1'), 'skin_bioavailability_percent_high'=>array('dataType'=>'real','dontSum'=>'1'), 'SC/IM_bioavailability_percent'=>array('dataType'=>'real','dontSum'=>'1')
		, 'SC/IM_bioavailability_percent_high'=>array('dataType'=>'real','dontSum'=>'1'), 'inhalation_bioavailability_percent'=>array('dataType'=>'real','dontSum'=>'1'), 'inhalation_bioavailability_percent_high'=>array('dataType'=>'real','dontSum'=>'1')
		, 'buccal/sublingual_bioavailability_percent'=>array(), 'buccal/sublingual_bioavailability_percent_high'=>array(), 'elimination_half_life'=>array('dataType'=>'real','dontSum'=>'1')
		, 'elimination_half_life_high'=>array('dataType'=>'real','dontSum'=>'1'), 'volume_of_distribution'=>array('dataType'=>'real','dontSum'=>'1'), 'volume_of_distribution_high'=>array('dataType'=>'real','dontSum'=>'1')
		, 'clearance'=>array(), 'clearance_high'=>array(), 'mechanism'=>array()
		, 'bitter_taste'=>array(), 'elimination_pathway'=>array(), 'is_the_metabolite_active'=>array()
		, 'plasma_protein_binding'=>array('dataType'=>'real','dontSum'=>'1'), 'first_pass_extraction'=>array(), 'pass_extraction_percent'=>array()
		, 'food_effect'=>array(), 'food_effect_percent'=>array('dataType'=>'real','dontSum'=>'1'), 'brain/CSF_uptake'=>array()
		, 'octanol_type'=>array(), 'logP'=>array(), 'clogp'=>array()
		, 'p_gp_effect'=>array(), 'CYP3A4'=>array()
	);
//news
	$columnSets['news']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'news_header', 'date', 'news_branch','company_id_1','source','event_type',
		'drug_delivery_branch_id','therapeutic_category_id',
		'technology_id','compound_id'
	));
	$columnSets['news']['Financial'] = array('name'=>'Financial', 'columns'=> array (
		'news_header', 'date', 'news_branch','company_id_1',
		'territory_company_1',
		'deal_contract',
		'venture_type',
		/*'event_comment',*/'total_deal_value',
		'total_deal_value_in_million_dollars','total_deal_currency',
		'upfront_payment','equity',
		'milestones','royalty_percent',
		'royalty_value'
	));
	$columnSets['news']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'news_header', 'date', 'news_branch','company_id_1','source','event_type',
		'drug_delivery_branch_id','therapeutic_category_id',
		'technology_id','compound_id',
		'territory_company_1',
		'deal_contract','hyperlink',
		'explanation',
		'venture_type',
		/*'event_comment',*/'total_deal_value',
		'total_deal_value_in_million_dollars','total_deal_currency',
		'upfront_payment','equity',
		'milestones','royalty_percent',
		'royalty_value'
	));
	$columnSets['news']['Only Abstract'] = array('name'=>'Only Abstract', 'columns'=> array (
		'news_header', 'date'
	));
	$columnSets['news']['allFields']=array('news_header'=>array('title'=>'Header'), 'date'=>array(), 'news_branch'=>array()
		, 'company_id_1'=>array('title'=>'Companies'), 'source'=>array(), 'event_type'=>array_merge(array('title'=>'Phase'), $phase['enumValues'])
		, 'territory_company_1'=>array('title'=>'Territories'), 'deal_contract'=>array(), 'venture_type'=>array()
		, 'total_deal_value'=>array(), 'total_deal_value_in_million_dollars'=>array('dataType'=>'real'), 'total_deal_currency'=>array()
		, 'upfront_payment'=>array('dataType'=>'real','dontSum'=>'1'), 'equity'=>array('dataType'=>'real'), 'milestones'=>array('dataType'=>'real','dontSum'=>'1')
		, 'royalty_percent'=>array('dataType'=>'real','dontSum'=>'1'), 'royalty_value'=>array('dataType'=>'real','dontSum'=>'1'), 'drug_delivery_branch_id'=>array('title'=>'Drug Delivery Branch')
		, 'therapeutic_category_id'=>array('title'=>'Therapeutic Category'), 'technology_id'=>array('title'=>'Technology'), 'compound_id'=>array('title'=>'Product/Pipeline')
		, 'hyperlink'=>array(), 'explanation'=>array()
	);
//sales
	$sortSales = array(array('column'=>'world_sales','direction'=>'-1'));
	$columnSets['sales']['Basic'] = array('name'=>'Basic', 'sort'=>$sortSales, 'columns'=> array (
		'compound_id_1',
		'world_sales',
		'us_sales',
		'ex_us_sales',
		'europe_sales',
		'japan_sales'
	));
	
	$columnSets['sales']['Detailed'] = array('name'=>'Detailed', 'sort'=>$sortSales, 'columns'=> array (
		'compound_id_1',
		'world_sales',
		'us_sales',
		'ex_us_sales',
		'europe_sales',
		'japan_sales',
		'therapeutic_category_id_1',
		'drug_delivery_branch_id_1',
		'molecule_mechanism_type_id_1',
		'product_originator_company_id',
		'dds_technology_owner_company_id',
		'product_owner_company_id',
		'partner_company_id_1'
	));

	$columnSets['sales']['allFields']=array(
		'compound_id_1'=>array('title'=>'Product Name')
		, 'world_sales'=>array('title'=>'World Sales in M$', 'dataType'=>'real')
		, 'us_sales'=>array('title'=>'US Sales(M$)', 'dataType'=>'real')
		, 'ex_us_sales'=>array('title'=>'Ex US Sales(M$)', 'dataType'=>'real')
		, 'europe_sales'=>array('title'=>'Europe Sales(M$)', 'dataType'=>'real')
		, 'japan_sales'=>array('title'=>'Japan Sales(M$)', 'dataType'=>'real')
		, 'therapeutic_category_id_1'=>array('title'=>'Major Therepeutic Categories')
		, 'drug_delivery_branch_id_1'=>array('title'=>'DDS Branches')
		, 'molecule_mechanism_type_id_1'=>array('title'=>'Mechanism Type')
		, 'product_originator_company_id'=>array('title'=>'Product Originator')
		, 'dds_technology_owner_company_id'=>array('title'=>'DDS Technology Owner')
		, 'product_owner_company_id'=>array('title'=>'Owner')
		, 'partner_company_id_1'=>array('title'=>'Partners')
	);
	
//sales_percentages
	$sortSalesPercentage = array(array('column'=>'world_sales','direction'=>'-1'));
	$eventSalesPercentage = array('rowprint'=>
		'var change;
		for (var column in event.target.properties.columns)
			if (event.target.properties.columns.hasOwnProperty(column) && event.target.properties.columns[column].title.indexOf("%")>-1)
			{
				change=parseFloat(event.rowData[column]);
				if (isNaN(change) || !change)
					continue;
				event.row.cells[event.target.properties.columns[column].index].style.background=aV.Visual.composeRGBCode(aV.Visual.HSLtoRGB({s: 1, l: ((Math.abs(change)>100)?100:Math.abs(change))/ /*-250+.9*/-200+1, h:(change<0)?0:120}));
			}'
	);
	$columnSets['sales_percentages']['Basic'] = array('name'=>'Basic', 'sort'=>$sortSalesPercentage, 'eventHandlers'=>$eventSalesPercentage,
		'columns'=> array (
		"compound_id_1",
		"world_sales",
		"world_percent_change",
		"us_sales",
		"us_percent_change",
		"ex_us_sales",
		"ex_us_percent_change"
	));

	$columnSets['sales_percentages']['allFields']=array(
		'compound_id_1'=>array('title'=>'Product Name'), 
		"world_percent_change"=>array('title'=>"World Sales Change %", 'dataType'=>'real'),
		"world_sales"=>array('title'=>"2008 World Sales(M$)", 'dataType'=>'real'),
		"us_percent_change"=>array('title'=> "US Sales Change %", 'dataType'=>'real'),
		"us_sales"=>array('title'=>"2008 US Sales(M$)", 'dataType'=>'real'),
		"ex_us_percent_change"=>array('title'=> "Ex-US Sales Change %", 'dataType'=>'real'), 
		"ex_us_sales"=>array('title'=>"2008 Ex-US Sales(M$)", 'dataType'=>'real'),
	);
	
	
//tech
	$columnSets['tech']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'grouped_technology_name','drug_delivery_branch_id_1','explanation','company_id_1'
	));
	$columnSets['tech']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'grouped_technology_name','drug_delivery_branch_id_1','explanation',
		'original_technology_owner_company_id','company_id_1','hyperlink','compounds_use_tech'
	));
	$columnSets['tech']['Only Names'] = array('name'=>'Only Names', 'columns'=> array (
		'name'
	));
	$columnSets['tech']['allFields']=array('name'=>array('title'=>'Technology'),'grouped_technology_name'=>array('title'=>'Technology(with links)'),
		'drug_delivery_branch_id_1'=>array('title'=>'Drug Delivery Branch'),'explanation'=>array('title'=>'Abstract'),
		'company_id_1'=>array('title'=>'Companies'),'original_technology_owner_company_id'=>array('title'=>'Original Technology Owner'),'hyperlink'=>array(),
		'compounds_use_tech'=>array('title'=>'Products That Use This Technology')
	);
//uni_research
	$columnSets['uni_research']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'name','drug_delivery_branch_id_1', 'faculty_department_id','university_name','country','email','university_hyperlink'
	));
	$columnSets['uni_research']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'name', 
		'drug_delivery_branch_id_1', 
		'hyperlink', 'email', 
		'explanation', 
		'patents','faculty_department_id','university_name','country','university_hyperlink','department_hyperlink'
	));
	$columnSets['uni_research']['Only Names'] = array('name'=>'Only Names', 'columns'=> array (
		'name', 'researcher_title'
	));
	$columnSets['uni_research']['allFields']=array('name'=>array(), 'faculty_department_id'=>array('title'=>'Faculty Department')
		, 'drug_delivery_branch_id_1'=>array('title'=>'Drug Delivery Branch'), 'hyperlink'=>array(), 'email'=>array()
		, 'explanation'=>array(), 'patents'=>array(),'university_name'=>array(),'country'=>array(),'university_hyperlink'=>array(),'department_hyperlink'=>array()
	);
//us_label
	$columnSets['us_label']['Basic'] = array('name'=>'Basic', 'columns'=> array (
		'dailymed_data_id','company_name','label_info_route_of_administration',
		'label_info_dosage_form', 'label_info_color',
		'label_info_color_detailed', 'label_info_shape', 'label_info_shape_secondary',
		'label_info_size', 'label_info_size_unit'
	));
	$columnSets['us_label']['Detailed'] = array('name'=>'Detailed', 'columns'=> array (
		'dailymed_data_id','company_name','label_info_route_of_administration',
		'label_info_dosage_form', 'label_info_dea_schedule', 'label_info_color',
		'label_info_color_detailed', 'label_info_shape', 'label_info_shape_secondary',
		'label_info_imprint_code', 'label_info_size', 'label_info_size_unit',
		'label_info_score', 'label_info_symbol', 'label_info_coating',
		'label_info_ingredients','label_info_packaging'
	));
	$columnSets['us_label']['Only Names'] = array('name'=>'Only Names', 'columns'=> array (
		'dailymed_data_id'
	));
	$columnSets['us_label']['allFields']=array('dailymed_data_id'=>array('title'=>'Product Name'), 'company_name'=>array(), 'label_info_route_of_administration'=>array()
		, 'label_info_dosage_form'=>array(), 'label_info_color'=>array(), 'label_info_color_detailed'=>array()
		, 'label_info_shape'=>array(), 'label_info_shape_secondary'=>array(), 'label_info_size'=>array()
		, 'label_info_size_unit'=>array(), 'label_info_dea_schedule'=>array(), 'label_info_imprint_code'=>array()
		, 'label_info_score'=>array(), 'label_info_symbol'=>array(), 'label_info_coating'=>array()
		, 'label_info_ingredients'=>array(), 'label_info_packaging'=>array()
		, 'description'=>array()
	);
//IIG
	$columnSets['IIG']['Basic'] = array('name'=>'Basic', 'columns'=>array(
		'inactive_ingredient','route_dosage_form',
		'CAS_number','UNII',
		'maximum_potency_amount','potency_unit',
		'info_iig_labels'
	));
	$columnSets['IIG']['Only Names'] = array('name'=>'Only Names', 'columns'=>array(
		'inactive_ingredient'
	));
	$columnSets['IIG']['allFields']=array('inactive_ingredient'=>array('title'=>'Excipient Name'), 'route_dosage_form'=>array('title'=>'DD Route; Dosage Form'), 'CAS_number'=>array('dontSum'=>'1','dataType'=>'real')
		, 'UNII'=>array(), 'maximum_potency_amount'=>array('dataType'=>'real'), 'potency_unit'=>array()
		, 'info_iig_labels'=>array('title'=>'Labels')
	);
//keyword
	$columnSets['keyword']['Basic'] = array('name'=>'IIG', 'columns'=>array(
		'search_name','result'
	));
	$columnSets['keyword']['allFields'] = array(
		'search_name'=>array(),'result'=>array()
	);
	
	
//therapeutic
	$columnSets['therapeutic'] = $columnSets['compound'];
	$sets=array_keys($columnSets['therapeutic']);
	foreach ($sets as $one_set)
		{
			if(!is_array($columnSets['therapeutic'][$one_set]['columns']))//that means it's a set
			 continue;
			$columnSets['therapeutic'][$one_set]['columns'][array_search('therapeutic_category_id_1',$columnSets['therapeutic'][$one_set]['columns'])]='therapeutic_category';
			$columnSets['therapeutic'][$one_set]['columns'][array_search('phase_1',$columnSets['therapeutic'][$one_set]['columns'])]='phase';
		}
	$columnSets['therapeutic']['Only Names'] = array(
		'name'=>'Only Names',
		'columns'=> array ('composite_product_name',
		'therapeutic_category',
		'phase'
	));

	$columnSets['therapeutic']['allFields'] = array_merge(array('therapeutic_category'=>array(),'phase'=>array()),$columnSets['therapeutic']['allFields']);	
	
//clinical
	$columnSets['clinical']['Basic'] = array('name'=>'Basic', 'columns'=>array(
		'brief_title', 'phase', 'study_type', 'age_group', 'first_received'
	));
	$columnSets['clinical']['Only Names'] = array('name'=>'Only Names', 'columns'=>array(
		'brief_title'
	));
	$columnSets['clinical']['allFields']=array('brief_title'=>array(), 'official_title'=>array(), 'information_provider'=>array()
		, 'identifier'=>array(), 'brief_summary'=>array(), 'phase'=>array()
		, 'study_type'=>array(), 'study_design'=>array(), 'primary_outcome_measure'=>array()
		, 'secondary_outcome_measure'=>array(), 'recruitment_status'=>array(), 'age_group'=>array('dataType'=>'real','dontSum'=>'1')
		, 'gender_group'=>array(), 'healthy_volunteers'=>array(), 'criteria'=>array()
		, 'contacts'=>array(), 'first_received'=>array(), 'last_updated'=>array()
		, 'CLT_Condition'=>array(), 'CLT_Intervention'=>array(), 'CLT_Intervention_Type'=>array()
		, 'CLT_Keyword'=>array(), 'CLT_Location_Country'=>array(), 'CLT_Location_State'=>array()
		, 'CLT_Sponsor'=>array()
	);	
	
	
	
	$GLOBALS['DBGridColumnSets'] = $columnSets;
	$GLOBALS['DBGridSettings']['exports']=array(
			'xlsb'=>array('alias'=>'Excel 97'),
			'html'=>array('alias'=>'View as HTML'),
			'xls'=>array('alias'=>'Excel')
			/*,
			'xml'=>array('alias'=>'XML')*/
	);
		
 ?>