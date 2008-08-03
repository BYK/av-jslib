<?php
/*
 * File:        c-css.php
 * CVS:         $Id$
 * Description: Conditional CSS parser
 * Author:      Allan Jardine
 * Created:     Sun May 20 14:05:46 GMT 2007
 * Modified:    $Date$ by $Author$
 * Language:    PHP
 * License:     CDDL v1.0
 * Project:     COnditional-CSS
 * 
 * Copyright 2007-2008 Allan Jardine, all rights reserved.
 *
 * This source file is free software, under the U4EA Common Development and
 * Distribution License (U4EA CDDL) v1.0 only, as supplied with this software.
 * This license is also available online:
 *   http://www.sprymedia.co.uk/license/u4ea_cddl
 * 
 * This source file is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the CDDL for more details.
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DESCRIPTION
 * 
 * c-css is a program which allows IE style conditional comments to be
 * inserted inline with CSS statements, and then be parsed out as required
 * for individual web browsers. This allows easy targeting of styles to 
 * different browsers, and different versions of browsers as required by the
 * developer, such that browser CSS bugs can be easily over come.
 * 
 * The bowsers which are currently supported are:
 *   Internet Explorer (v2 up) - IE
 *   Internet Explorer Mac - IEMac
 *   Gecko (Firefox etc) - Gecko
 *   Webkit (Safari etc) - Webkit
 *   Opera - Opera
 *   Konqueror - Konq
 *   IE Mobile - IEmob
 *   PSP Web browser - PSP
 *   NetFront - NetF
 * 
 * The syntax used for the conditional comments is:
 *   [if {!} {browser}]
 *   [if {!} {browser_group}]
 *   [if {!} {browser} {version}]
 *   [if {!} {condition} {browser} {version}]
 * 
 * Examples:
 *   [if ! Gecko]#column_right {
 *     [if cssA]float:left;
 *     width:250px;
 *     [if Webkit] opacity: 0.8;
 *     [if IE 6] ie6: 100%;
 *     [if lt IE 6] lt-ie6: 100%;
 *     [if lte IE 6] lte-ie6: 100%;
 *     [if eq IE 6] eq-ie6: 100%;
 *     [if gte IE 6] gte-ie6: 100%;
 *     [if gt IE 6] gt-ie6: 100%;
 *     [if ! lte IE 6] not-lte-ie6: 100%;
 *   }
 * 
 * As can be seen from above a conditional comment can be applied to either 
 * a whole CSS block, or to individual rules.
 */



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Globals - configuration options
 */

/*
 * Always include files
 * Define your CSS files to be included here. Remember that CSS Euphoria will
 * automatically expand @import statements into the full css file. For 
 * example:
 *   $gaCssFiles = array( 'site.css', 'fonts.css' );
 */
$gaCssFiles = array(
  'aV.module.DBGrid.css'
);

/* 
 * Browser groups
 * Browsers can be groups together such that a  single conditional statement
 * can refer to multiple browsers. For example 'cssA' might be top level css
 * support
 */
$gaGroups = array(
	array( 
		'sGrade'=>'cssA', 
		'sEngine'=>'IE',     
		'iGreaterOrEqual'=>1,
		'dVersion'=>6 ), /* IE 6 and up */
	array( 
		'sGrade'=>'cssA', 
		'sEngine'=>'Gecko',  
		'iGreaterOrEqual'=>1, 
		'dVersion'=>1.0 ), /* Mozilla 1.0 and up */
	array( 
		'sGrade'=>'cssA', 
		'sEngine'=>'Webkit', 
		'iGreaterOrEqual'=>1, 
		'dVersion'=>312 ), /* Safari 1.3 and up  */
	array( 
		'sGrade'=>'cssA', 
		'sEngine'=>'Opera',  
		'iGreaterOrEqual'=>1, 
		'dVersion'=>7 ), /* Opera 7 and up */
	array( 
		'sGrade'=>'cssA', 
		'sEngine'=>'Konq',   
		'iGreaterOrEqual'=>1, 
		'dVersion'=>3.3 ), /* Konqueror 3.3 and up  */
	array( 
		'sGrade'=>'cssX', 
		'sEngine'=>'IE',     
		'iGreaterOrEqual'=>0, 
		'dVersion'=>4   ), /* IE 4 and down */
	array( 
		'sGrade'=>'cssX', 
		'sEngine'=>'IEMac',  
		'iGreaterOrEqual'=>0, 
		'dVersion'=>4.5 )  /* IE Mac 4 and down */
);



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Class
 *
 * Class:   ccss
 * Purpose: Preform c-css parsing
 * Notes:   No need to edit below this line unless you know what you are doing
 */
class ccss
{
	// string:sVersion - version information {major.minor.language.bugfix}*/
	var $sVersion = '1.0.php.1';
	
	// array string:asCSSFiles - CSS files to be read 
	var $_asCSSFiles;
	
	// string:sCSS - css buffer
	var $_sCSS = '';
	
	/*
	 * Function: __construct
	 * Purpose:  ccss constructor
	 * Returns:  -
	 * Inputs:   string:... - any number of string variables pointing to files
	 * Errors:   -
	 */
	function __construct ()
	{
		// If the object is created with arguments, store them as files
		$this->_asCSSFiles = func_get_args();
	}
	
	
	/*
	 * Function: fnAddFiles
	 * Purpose:  add new files to be processed
	 * Returns:  -
	 * Inputs:   string:... - any number of string variables pointing to files
	 * Errors:   -
	 */
	function fnAddFiles ()
	{
		for ( $i=0 ; $i<func_num_args() ; $i++ )
		{
			$this->_asCSSFiles[] = func_get_arg( $i );
		}
	}
	
	
	/*
	 * Function: fnReadCSSFiles
	 * Purpose:  Read the CSS files
	 * Returns:  -
	 * Inputs:   string:... - any number of string variables pointing to files
	 * Errors:   -
	 */
	function fnReadCSSFiles ()
	{
		$this->_sCSS = '';
		for ( $i=0 ; $i<count($this->_asCSSFiles) ; $i++ )
		{
			$this->_sCSS .= $this->_readCSSFile ( $this->_asCSSFiles[$i] );
		}
	}
	
	
	/*
	 * Function: _readCSSFile
	 * Purpose:  Read a CSS file
	 * Returns:  array string: aCSS - the contents of the css file
	 * Inputs:   string:sPath - the file name and path to be read
	 * Errors:   -
	 */
	function _readCSSFile ( $sPath )
	{
		// We use output buffering here to read the required file using 'readfile'
		// as this allows us to over come some of the problems when safe mode is
		// turned on
		if ( is_file( $sPath ) )
		{
			ob_start();
			readfile( $sPath );
			$sCSS = ob_get_contents();
			ob_end_clean();
			
			// If there is a hash-bang line - strip it out for compatability with C
			$sCSS = preg_replace( '/^(#!.*?\n)/', '', $sCSS, 1 );
			
			return $sCSS;
		}
		else
		{
			echo "/*** Warning: The file $sPath could not be found ***/\n";
		}
	}
	
	
	/*
	 * Function: fnCssIncludes
	 * Purpose:  Check the input for @import statements and include files found
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnCssIncludes ()
	{
		// Find all @import statements
		while ( preg_match( '/@import .*;/', $this->_sCSS, $aMatch ) )
		{
			// Parse @import to get the URL
			$sCSSFile = $this->_parseImport( $aMatch[0] );
			
			// Read the CSS file
			$sTmpCSS = $this->_readCSSFile( $sCSSFile );
			
			// Save it back into the main css string
			$this->_sCSS = preg_replace( '/@import .*;/', $sTmpCSS, $this->_sCSS, 1 );
			
			unset ( $aMatch );
		}
	}
	
	
	/*
	 * Function: _parseImport
	 * Purpose:  Get the import URI from the import statement
	 * Returns:  string:  - Import URL
	 * Inputs:   string:sImport - @import CSS statement
	 * Errors:   -
	 */
	function _parseImport ( $sImport )
	{
		$aImport = split ( " ", $sImport );
		$sURL = str_replace ( "(", "", $aImport[1] );
		$sURL = str_replace ( "'", "", $sURL );
		$sURL = str_replace ( '"', "", $sURL );
		$sURL = str_replace ( ';', "", $sURL );
		return $sURL;
	}
	
	
	/*
	 * Function: fnStripComments
	 * Purpose:  Strip multi-line comments from the target css
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnStripComments ()
	{
		$this->_sCSS = preg_replace ( '/\/\*.*?\*\//s', "", $this->_sCSS );
	}
	
	
	/*
	 * Function: fnProcess
	 * Purpose:  Strip multi-line comments from the target css
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnProcess ()
	{
		// Break the CSS down into blocks
		// Match all blacks - with or without nested blocks
		preg_match_all( "/.*?\{((?>[^{}]*)|(?R))*\}/s", $this->_sCSS, $aCSSBlock );
		
		for ( $i=0 ; $i<count($aCSSBlock[0]) ; $i++ )
		{
			$iProcessBlock = 1;
			$sBlock = $aCSSBlock[0][$i];
			
			// Find if the block has a conditional comment
			if ( preg_match( "/\[if .*?\].*?\{/", $sBlock ) )
			{
				preg_match( "/\[if .*?\]/", $sBlock, $aCCBlock );
				
				// Find out if the block should be included or not
				if ( $this->_checkCC ( $aCCBlock[0] ) == 0 )
				{
					$iProcessBlock = 0;
					
					// Drop the block from the output string
					$this->_sCSS = str_replace ( $aCSSBlock[0][$i], "", $this->_sCSS );
				}
				// If it should be then remove the conditional comment from the start 
				// of the block
				else
				{
					$sBlock = preg_replace( "/\[if .*?\]/", "", $sBlock, 1 );	
				}
			}
			
			
			// If the block should be processed
			if ( $iProcessBlock == 1 )
			{
				// Loop over the block looking for conditional comment statements
				while ( preg_match( "/\[if .*?\]/", $sBlock, $aCSSRule ) )
				{
					// See if statement should be included or not
					if ( $this->_checkCC( $aCSSRule[0] ) == 0 )
					{
						// Remove statement - note that this might remove the trailing
						// } of the block! This is valid css as the last statement is
						// implicitly closed by the }. So we moke sure there is one at the
						// end later on
						$sBlock = preg_replace( '/\[if .*?\].*?(;|\})/', "", $sBlock, 1 );
						
					}
					// Include statement
					else
					{
						// Remove CC
						$sBlock = preg_replace( "/\[if .*?\]/", "", $sBlock, 1 );
					}
				}
				
				// Ensure the block has a closing }
				if ( preg_match ( '/\}$/', $sBlock ) == 0 )
				{
					$sBlock .= "}";
				}
				
				// Write the modifed block back into the CSS string
				$this->_sCSS = str_replace( $aCSSBlock[0][$i], $sBlock, $this->_sCSS );
			}
		}
	}
	
	
	/*
	 * Function: fnOutput
	 * Purpose:  Remove extra white space and output
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnOutput ()
	{
		// Remove the white space in the css - while preserving the needed spaces
		$this->_sCSS = preg_replace( '/\s/s', ' ', $this->_sCSS );
		while ( preg_match ( '/  /', $this->_sCSS ) )
		{
			$this->_sCSS = preg_replace( '/  /', ' ', $this->_sCSS );
		}
		
		// Add new lines for basic legibility
		$this->_sCSS = preg_replace( '/} /', "}\n", $this->_sCSS );
		
		// Phew - we finally got there...
		echo $this->_sCSS;
		echo "\n";
	}
	
	
	/*
	 * Function: fnOutputHeader
	 * Purpose:  Header output with information
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnOutputHeader ()
	{
		// Give a CSS MIME type so the browser knows this is a css file
		header('Content-type: text/css');
		
		// Add comment to output
		echo "/*\n";
		echo " * c-css by U4EA Technologies - Allan Jardine\n";
		echo " * Version: ".$this->sVersion."\n";
		echo " * Browser: ".$this->sUserBrowser." ".$this->sUserVersion."\n";
		echo " * Browser group: ".$this->sUserGroup."\n";
		echo " */\n";
		
  	/* X grade CSS means the browser doesn't see the CSS at all */
		if ( $this->sUserGroup == "cssX" )
		{
			exit(0);
		}
	}
	
	
	/*
	 * Function: _checkCC
	 * Purpose:  See if a conditional comment should be processed
	 * Returns:  int: 1-process, 0-don't process
	 * Inputs:   string:sCC - the conditional comment
	 * Errors:   -
	 *
	 * Notes:
	 * The browser conditions are:
	 *  [if {!} {browser}]
	 *  [if {!} {browser} {version}]
	 *  [if {!} {condition} {browser} {version}]
	 */
	function _checkCC ( $sCC )
	{
		// Strip brackets from the CC
		$sCC = str_replace( '[', '', $sCC );
		$sCC = str_replace( ']', '', $sCC );
		
		$aCC = split ( " ", $sCC );
		
		$bNegate = false;
		if ( $aCC[1] == "!" )
		{
			$bNegate = true;
			
			// Remove the negation operator so all the other operators are in place
			array_splice ( $aCC, 1, 1 );
		}
		
		//
		// Do the logic checking
		//
		$bInclude = false;
		
		// If the CC is an integer, then we drop the minor version number from the
		// users browser. This means that if the user is using v5.5, and the
		// statement is for v5, then it matches. To stop this a CC with v5.0 would
		// have to be used
		$sLocalUserVersion = $this->sUserVersion;
		/*
		if ( !strpos ( $aCC[2], "." ) )
			$sLocalUserVersion = intval ( $sLocalUserVersion );
		*/
		
		// Just the browser
		if ( count( $aCC ) == 2 )
		{
			if ( $this->sUserBrowser == $aCC[1] ||
				   $this->sUserGroup == $aCC[1] )
			{
				$bInclude = true;
			}
		}
		// Browser and version
		else if ( count( $aCC ) == 3 )
		{
			if ( $this->sUserBrowser == $aCC[1] && (float)$sLocalUserVersion == (float)$aCC[2] )
			{
				$bInclude = true;
			}
		}
		// Borwser and version with operator
		else if ( count( $aCC ) == 4 )
		{
			if ( $aCC[1] == "lt" )
			{
				if ( $this->sUserBrowser == $aCC[2] && (float)$sLocalUserVersion < (float)$aCC[3] )
				{
					$bInclude = true;
				}
			}
			else if ( $aCC[1] == "lte" )
			{
				if ( $this->sUserBrowser == $aCC[2] && (float)$sLocalUserVersion <= (float)$aCC[3] )
				{
					$bInclude = true;
				}
			}
			else if ( $aCC[1] == "eq" )
			{
				if ( $this->sUserBrowser == $aCC[2] && (float)$sLocalUserVersion == (float)$aCC[3] )
				{
					$bInclude = true;
				}
			}
			else if ( $aCC[1] == "gte" )
			{
				if ( $this->sUserBrowser == $aCC[2] && (float)$sLocalUserVersion >= (float)$aCC[3] )
				{
					$bInclude = true;
				}
			}
			else if ( $aCC[1] == "gt" )
			{
				if ( $this->sUserBrowser == $aCC[2] && (float)$sLocalUserVersion > (float)$aCC[3] )
				{
					$bInclude = true;
				}
			}
		}
		
		// Perform negation if required
		if ( $bNegate )
		{
			if ( $bInclude )
				$bInclude = false;
			else
				$bInclude = true;
		}
		
		// Return the required type
		if ( $bInclude )
			return 1;
		else
			return 0;
	}
	
	
	/*
	 * Function: fnSetUserBrowser
	 * Purpose:  Set the user's browser information
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnSetUserBrowser ()
	{
		if ( isset( $this->sUserBrowser ) )
		{
			return;
		}
		
		if ( !isset( $this->sUserAgent ) )
		{
			$this->sUserAgent = $_SERVER['HTTP_USER_AGENT'];
		}
		
		
		// Webkit (Safari, Shiira etc)
		if ( preg_match( '/mozilla.*applewebkit\/([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "Webkit";
			$this->sUserVersion = $aUserAgent[1];
		}
		
		// Opera
		else if ( preg_match( '/mozilla.*opera ([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $tmp_array ) 
		  || preg_match( '/^opera\/([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $tmp_array ) )
		{
			$this->sUserBrowser = "Opera";
			$this->sUserVersion = $aUserAgent[1];
    }
		
		// Gecko (Firefox, Mozilla, Camino etc)
		else if ( preg_match( '/mozilla.*rv:([0-9a-z\+\-\.]+).*gecko.*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "Gecko";
			$this->sUserVersion = $aUserAgent[1];
		}
		
    // IE Mac
		else if( preg_match( '/mozilla.*MSIE ([0-9a-z\+\-\.]+).*Mac.*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "IEMac";
			$this->sUserVersion = $aUserAgent[1];
		}
		
    // MS mobile
		else if( preg_match( '/PPC.*IEMobile ([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "IEMob";
			$this->sUserVersion = "1.0";
		}
		
		// MSIE
		else if( preg_match( '/mozilla.*MSIE ([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "IE";
			$this->sUserVersion = $aUserAgent[1];
		}
		
		// Konqueror
		else if( preg_match( '/mozilla.*konqueror\/([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "Konq";
			$this->sUserVersion = $aUserAgent[1];
		}
		
		// Konqueror
		else if( preg_match( '/mozilla.*PSP.*; ([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "PSP";
			$this->sUserVersion = $aUserAgent[1];
		}
		
		// NetFront
		else if( preg_match( '/mozilla.*NetFront\/([0-9a-z\+\-\.]+).*/si', $this->sUserAgent, $aUserAgent ) )
		{
			$this->sUserBrowser = "NetF";
			$this->sUserVersion = $aUserAgent[1];
		}
		
		
		// Round the version number to one decimal place
		$iDot = strpos( $this->sUserVersion, '.' );
		if ( $iDot > 0 )
		{
			$this->sUserVersion = substr( $this->sUserVersion, 0, $iDot+2 );
		}
	}
	
	
	/*
	 * Function: fnSetUserBrowserGET
	 * Purpose:  Set the user's browser information based on GET vars is there
	 *   are any
	 * Returns:  -
	 * Inputs:   -
	 * Errors:   -
	 */
	function fnSetUserBrowserGET ()
	{
		if ( isset( $_GET['b'] ) )
		{
			$this->sUserBrowser = $_GET['b'];
		}
		
		if ( isset( $_GET['browser'] ) )
		{
			$this->sUserBrowser = $_GET['browser'];
		}
		
		if ( isset( $_GET['v'] ) )
		{
			$this->sUserVersion = $_GET['v'];
		}
		
		if ( isset( $_GET['version'] ) )
		{
			$this->sUserVersion = $_GET['version'];
		}
	}
	
	
	/*
	 * Function: fnSwitches
	 * Purpose:  Deal with command line switches
	 * Returns:  int:i - Where the sitches end in argc/v
	 * Inputs:   -
	 * Errors:   -
	 * Notes:    This is a short hand method to make this script look use
	 *   the same cli options as the 'c' version of this program. It won't do
	 *   well with dodgy input - but it's not expected to be used to much.
	 */
	function fnSwitches ()
	{
		global $argc;
		global $argv;
		
		for ( $i=1 ; $i<$argc ; $i++ )
		{
			if ( $argv[$i][0] == "-" )
			{
				if ( $argv[$i][1] == "b" )
				{
					$i++;
					$this->sUserBrowser = $argv[$i];
				}
				else if ( $argv[$i][1] == "v" )
				{
					$i++;
					$this->sUserVersion = $argv[$i];
				}
				else if ( $argv[$i][1] == "u" )
				{
					$i++;
					$this->sUserAgent = $argv[$i];
				}
				else if ( $argv[$i][1] == "h" )
				{
					$this->fnOutputUsage();
					exit(0);
				}
			}
			else
			{
				return $i;
			}
		}
		
		return 1;
	}
	
	
	/*
	 * Function: fnOutputUsage()
	 * Purpose:  Output the usage to the user
	 * Returns:  void
	 * Inputs:   void
	 * Errors:   
	 */
	function fnOutputUsage(  )
	{
	  printf (
	     "Usage: php c-css.php [OPTIONS]... [FILE]...\n"
	    ."Parse a CSS file which contains IE style conditional comments into a\n"
	    ."stylesheet which is specifically suited for a particular web-browser.\n"
	    ."\n"
	    ." -b     Use this particular browser. Requires that the \n"
	    ."        browser version must also be set, -v. Options are:\n"
	    ."          IE\n"
	    ."          IEMac\n"
	    ."          Gecko\n"
	    ."          Webkit\n"
	    ."          Opera\n"
	    ."          Konq\n"
	    ." -h     This help information.\n"
	    ." -u     Browser user agent string.\n"
	    ." -v     Use this particular browser version. Requires that\n"
	    ."        the browser must also be set using -b.\n"
	    ."\n"
	    ."The resulting stylesheet will be printed to stdout. Note that expected\n"
	    ."usage for this PHP version of c-css is through the standard PHP\n"
	    ."interpreter, rather than the CLI.\n"
	    ."\n"
	    ."Example usage:\n"
	    ." php c-css.php -b IE -v 6 example.css\n"
	    ."        Parse a style sheet for Internet Explorer v6\n"
	    ."\n"
	    ." php c-css.php -b Webkit -v 897 demo1.css demo2.css\n"
	    ."        Parse two style sheets for Webkit (Safari) v897\n"
	    ."\n"
	    ." php c-css.php -u \"Mozilla/4.0 (compatible; MSIE 5.5;)\" example.css\n"
	    ."        Parse stylesheet for the specified user agent string\n"
	    ."\n"
	    ."Report bugs to <allan.jardine@u4eatech.com>\n"
	  );
	}
	
	
	/*
	 * Function: fnSetBrowserGroup
	 * Purpose:  Based on the browser grouping we set a short hand method for 
	 *   access
	 * Returns:  void
	 * Inputs:   array:aGroups - group information
	 * Errors:   
	 */
	function fnSetBrowserGroup ( $aGroups )
	{
		for ( $i=0 ; $i<count($aGroups) ; $i++ )
		{
			if ( $aGroups[$i]['sEngine'] == $this->sUserBrowser )
			{
				if ( $aGroups[$i]['iGreaterOrEqual'] == 1 &&
				     $aGroups[$i]['dVersion'] <= $this->sUserVersion )
				{
					$this->sUserGroup = $aGroups[$i]['sGrade'];
					break;
				}
				else if ( $aGroups[$i]['iGreaterOrEqual'] == 0 &&
				          $aGroups[$i]['dVersion'] >= $this->sUserVersion )
				{
					$this->sUserGroup = $aGroups[$i]['sGrade'];
					break;
				}
			}
		}
	}
};




/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Processing
 *
 * The fun stuff where it all happens. First create an instance of the 
 * ccss class, then add the files, and finally process the output
 */
$oCss = new ccss();

/*
 * Set up the required variables based on input
 */
$oCss->fnSetUserBrowserGET();   /* Allow GET vars */
$iOptind = $oCss->fnSwitches(); /* CLI switches */
$oCss->fnSetUserBrowser();
$oCss->fnSetBrowserGroup( $gaGroups );

$oCss->fnOutputHeader();

/*
 * Add files
 */
for ( $i=$iOptind ; $i<$argc ; $i++ )
{
	$oCss->fnAddFiles( $argv[$i] );
}

for ( $i=0 ; $i<count($gaCssFiles) ; $i++ )
{
	$oCss->fnAddFiles( $gaCssFiles[$i] );
}

/*
 * Read all required files
 */
$oCss->fnReadCSSFiles();
$oCss->fnCssIncludes();

/*
 * Do the c-css magic on the imported files
 */
$oCss->fnStripComments();
$oCss->fnProcess();
$oCss->fnOutput();


?>
