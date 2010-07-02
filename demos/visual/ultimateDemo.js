/**
 * @fileOverview A JS file for DEMO purposes.
 * @name Ultimate Demo JS File
 *
 * @author Şenol Özkan <snlzkn@ampliovitam.com>
 * @version 1.0
 *
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">Apache License, Version 2.0</a>
 */

function startUltimateDemo()
{
	if (this.table) this.table.destroy();
	this.table = new aV.DBGrid('source_file.php',{},document.getElementById('ultDBGrid'), true, true);
}
