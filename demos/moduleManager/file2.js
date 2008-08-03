function foo2()
{
	var message="I know that file1.js is " + ((window.foo || window.variable1)?"":"not ") + "loaded before me ;)";
	if (window.console)
		console.log(message);
	else
		alert(message);
}
var variable2="file2's variable";
foo2();