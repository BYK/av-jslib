/**
 * @fileOverview A library which extends the Math class with some useful functions.
 * @name Math Extensions
 *
 * @author Burak Yiğit KAYA <byk@ampliovitam.com>
 * @version 1.0
 *
 * @copyright (c)2010 amplioVitam under Apache License, Version 2.0
 */

Math.logBase=function(x, base)
{
	return Math.log(x) / Math.log(base || 10);
};

Math.sinh=function(x)
{
	return (exp(x) - exp(-x))/2;
};

Math.cosh=function(x)
{
	return (exp(x) + exp(-x))/2;
};

Math.tanh=function(x)
{
	return Math.sinh(x)/Math.cosh(x);
};

Math.coth=function(x)
{
	return Math.cosh(x)/Math.sinh(x);
};

Math.sech=function(x)
{
	return 2/(exp(x) + exp(-x));
};

Math.cosech=function(x)
{
	return 2/(exp(x) - exp(-x));
};

Math.arcsinh=function(x)
{
	return Math.log(x + Math.sqrt(x*x + 1));
};

Math.arccosh=function(x)
{
	return (x>=1)?Math.log(x + Math.sqrt(x*x - 1)):false;
};

Math.arctanh=function(x)
{
	return (x<1)?0.5*Math.log((1 + x)/(1 - x)):false;
};

Math.arccoth=function(x)
{
	return (x>1)?0.5*Math.log((x + 1)/(x - 1)):false;
};

Math.arcsech=function(x)
{
	return (x>0 && x<=1)?Math.log((1 + Math.sqrt(1 - x*x))/x):false;
};

Math.arccosech=function(x)
{
	return Math.log(1/x + Math.sqrt(1 + x*x)/Math.abs(x));
};
