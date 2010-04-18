/**
 * @fileOverview Error handling and reporting module
 * @name Error
 *
 * @author Burak Yigit KAYA <byk@ampliovitam.com>
 * @version 1.0
 *
 * @copyright &copy;2010 amplioVitam under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

if (!aV)
	throw new Error("aV namespace cannot be found.", "aV.main.error.js@" + window.location.href);

aV.Error = {};

if (!aV.config.Error)
	aV.config.Error={};

aV.config.Error.unite(
	{
		loggerPath: '',
		message: ''
	},
	false
);

aV.Error.handler=function(message, url, line)
{
	if (aV.AJAX && aV.config.Error.loggerPath)
		aV.AJAX.makeRequest(
			"POST",
			aV.config.Error.loggerPath,
			{
				message: message,
				url: url,
				line: line
			},
			null,
			null,
			null,
			false
		);
	
	if (aV.Visual.infoBox && aV.config.Error.message)
		aV.Visual.infoBox.show(aV.config.Error.message, aV.config.Visual.infoBox.images.error);
};

/**
 * @ignore
 */
//window.onerror=aV.Error.handler;
