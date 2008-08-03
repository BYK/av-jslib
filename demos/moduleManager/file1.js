function foo()
{
	var message="Hello there from file1.js!";
	if (window.console)
		console.log(message);
	else
		alert(message);
}
var variable1="file1's variable";
foo();