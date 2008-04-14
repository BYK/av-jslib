/**
 * @fileOverview	Introduces the DBGrid class which fetches and parses XML data
 * and creates a table from the data collected.
 * <br />The generated tables have native sort, filter and grouping support.
 * @name DBGrid class
 *
 * @author	Burak Yi�it KAYA	byk@amplio-vita.net
 * @version	1.4
 *
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.ext.string.js">aV.ext.string</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.events.js">aV.main.events.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.ajax.js">aV.main.ajax.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.main.visual.js">aV.main.visual.js</a>
 * @requires	<a href="http://amplio-vita.net/JSLib/js/aV.plg.customHint.js">aV.plg.customHint.js</a>
 */

eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('7 N(l,m,n,o,p){4(S L==\'1r\')2F 1n 28("L 4t 4g 49 47 44!","N.2Z",16);3.O=N.2J++;y.Q[3.O]=3;3.1T=l;3.25=(m)?m:{};3.1S=n;3.2u=3.3d=p;3.C=9;3.1l=9;3.1B=9;3.2l=9;3.2j=9;3.2i=9;3.2h=9;3.2g=9;3.2e=9;3.2d=9;3.2a=9;3.2U=7(b){H 3.12;8 c=3;4(3.2j)3.2j();3.21=L.3G("3F",3.1T,3.25,7(a){c.3C=9;4((a.2y!=0&&a.2y!=3u)||!a.3f){4(c.2i)c.2i(a);z H c.21;r}c.12=a.3f;H c.21;4(c.2h)c.2h();4(c.3d)c.30(b)})};3.30=7(a){a=(a||!3.6);4(a){H 3.t;H 3.F;H 3.Y;3.C=9;3.1l=9}H 3.P;H 3.2n;3.1B=9;4(!3.12)r 9;4c{4(a){3.F=L.17.38(3.12.15("F")[0].E);3.t=1n 48(3.F.1L);3.Y=3.F.1L;J(8 i=0;i<3.Y;i++){3.t[i]={14:L.17.1y(3.F[i],"43"),1i:(L.17.1y(3.F[i],"42")==="0"),2f:(L.17.1y(3.F[i],"2f")==="1"),1w:\'\'};2c(3.t[i].14){1h\'2b\':1h\'29\':3.t[i].1J=3.2S;1R;2k:3.t[i].1J=3.2P}}}3.P=L.17.38(3.12.15("3Q"));3.2n=3.P.1L}3O(e){3.1B=e}3J{4(3.2u){4(a)3.1Q(9);z{3.2p();3.1d()}}r!3.1B}};3.1Q=7(e,f){4(!3.1q){4(f){4(S f==\'2E\')f=s.3E(f)}z 4(3.1S)f=3.1S;z r 9;4(S e==\'1r\')e=I;4(3.2g)3.2g(f);3.1q=[e,f];y.1H("y.Q["+3.O+"].1Q();",0);r}z{f=3.1q[1];e=3.1q[0];H 3.1q}4(e)f.2z=\'\';4(3.6){3.1V();3.6.x.1p(3.6)}4(3.1B){2F 1n 28("3z 28: 3x 3w 3t 12.",\'N.2Z@\'+3.1T+\'?\'+3.25.3s(),3r);}3.6=s.A("3p");3.6.u=3;3.6.X="N";3.6.w=[];8 g=3.6.v(s.A("2t"));3.6.M=g.v(s.A("4r"));3.6.M.2s="N"+3.O+"4o";3.6.M.X="M";3.6.M.D.3b="2o";19.4j(3.6.M,0);3.6.1D=s.A("1E");3.6.1D.1N="2q";3.6.1D.1a="*";3.6.1D.1C=7(){8 a=3.x.x.M;4(a.D.3b=="2o")19.1M(a,a.4a,1,9,I);z 19.1M(a,0,-1,9,I)};g.v(3.6.1D);3.6.Z=s.A("1E");3.6.Z.1N="2q";3.6.Z.1a="-";3.6.Z.1C=7(){3.x.x.u.37()};3.6.Z.1k=I;g.v(3.6.Z);3.6.T=s.A("1E");3.6.T.1N="2q";3.6.T.1a="+";3.6.T.1C=7(){3.x.x.u.36()};3.6.T.1k=I;g.v(3.6.T);g.v(s.1A(L.17.1y(3.12,"2t")));3.6.35=7(a,b){8 c=(b)?\'\':\'1o\';8 d=3.15("34");J(8 i=d.1L-1;i>=0;i--)d[i].15("33")[a].D.1j=c;3.u.t[a].1i=!b};8 h=3.6.v(s.A("46"));8 j=h.45(-1);8 k,q,1f,W;J(8 i=0;i<3.Y;i++){k=L.17.1y(3.F[i],"41");1f=s.A("40");1f.1x("J","N"+3.O+"3Z"+i);1f.v(s.1A(k));3.6.M.v(1f);W=s.A("1E");W.1N="3Y";W.R=i;W.2s=1f.3X("J");W.1C=7(){3.x.x.x.35(3.R,3.2Y)};3.6.M.v(W);W.2Y=!3.t[i].1i;3.6.M.v(s.A("2X"));q=j.3W(-1);q.v(s.1A(k));q.1x("3V",3.F[i].G);q.1x("2W","%2V%");q.R=i;11.10(q,"3U",3.2T);11.10(q,"3T",3.32);11.10(q,"3S",3.2R);11.10(q,"3R",3.2Q);4(3.t[i].1i)q.D.1j=\'1o\';4(3.C===i)q.X="2O";q.B=s.2N.v(s.A("1E"));3.6.w.3P(q.B);q.B.u=3;q.B.1g=q;q.B.2s="N"+3.O+"3N"+3.F[i].G+\'3M\';q.B.X="B";q.B.D.3K="3I";q.B.D.1j="1o";q.B.D.23="2o";11.10(q.B,"22",3.2K);11.10(q.B,"2I",3.2H);11.10(q.B,"3H",3.2G)}3.6.v(s.A("1F"));3.1d();f.v(3.6);4(3.2e)3.2e(f)};3.20=7(a,b,c){4(!3.1b){4(S a!=\'1t\')a=0;4(S b!=\'1t\')b=(3.C===a)?-3.1l:1;4(!3.F||!3.P||(3.C===a&&3.1l===b))r 9;4(3.2d)3.2d(a,b);3.1b=[a,b,c];y.1H("y.Q["+3.O+"].20()",0);r}z{c=3.1b[2];b=3.1b[1];a=3.1b[0];H 3.1b}3.C=a;3.1l=b;8 d=3;2c(3.t[3.C].14){1h\'2b\':1h\'29\':3.1Z=3.2D;1R;2k:3.1Z=3.2C}3.2p();4(3.2a)3.2a(a,b);4(c){4(3.6)3.1d();z 3.1Q();3.6.Z.1k=9;3.6.T.1k=9}};3.37=7(){4(!3.6)r 9;8 a=3.6.15(\'1F\')[0].K;V(a){4(!a.1e)3.1Y(a,3.6);a=a.1s}};3.36=7(){4(!3.6)r 9;8 a=3.6.15(\'1F\')[0].K;V(a){4(a.1e)a=3.1X(a,3.6);a=a.1s}};3.2A=7(){4(3.6){3.1V();3.6.x.1p(3.6);H 3.6}H y.Q[3.O]};3.2p=7(){8 c=3;3.P.3D(7(a,b){a=c.1c(a,c.C);b=c.1c(b,c.C);r c.1Z(a,b)*c.1l})}3.1c=7(a,b){r a.E[b].K.U};3.1d=7(a,i,b,c){4(!3.6)r 9;4(S a!=\'3B\')a=I;4(S i!=\'1t\')i=0;4(S b!=\'1t\')b=3.2n;b=b+i;8 d=3.6.15(\'1F\')[0];8 e=9;8 f;4(a)3A(d);8 g,q,1U,1W,1I,3y;J(i;i<b;i++){g=s.A("34");g.2x=i;g.1C=3.2B;4(3.C!==9){g.3v=3.2M;1I=3.1c(3.P[i],3.C);4(1I==1W)g.1P=1U;z{g.1P=1U=g;1W=1I}}e=9;J(8 j=0;j<3.Y;j++){4(e=(e||3.2w(3.P[i],j)))1R;q=s.A("33");q.1x("3L",3.t[j].14);q.1x("2W","%2V%");4(3.t[j].1i)q.D.1j=\'1o\';q.v(s.1A(3.1c(3.P[i],j)));q.24=q.K.U;g.v(q)}4(e)2L;4(c)d.3q(g,c);z d.v(g)}r g};3.2D=7(a,b){r(1G(a)-1G(b))};3.2C=7(a,b){4(a<b)r-1;z 4(a>b)r 1;z r 0};3.2w=7(a,b){8 c=9;4(3.t[b].1J&&3.t[b].1w){8 d=3.t[b].1w;8 e=(d.1u(0)==\'!\');4(e||d.1u(0)==\' \')d=d.26(1);c=3.t[b].1J(3.1c(a,b),d);4(e)c=!c}r c};3.2P=7(a,b){a=a.3o();8 c=(b.1u(0)==\'*\');4(c||(b.1u(0)==\' \'))b=b.26(1);b=1n 3n((c)?b:b.3m(),"3l");r!a.2v(b)};3.2S=7(a,b){4(!31(b))b=\'==\'+b;z 4(b.1u(0)==\'=\'&&!31(b.26(1)))b=\'=\'+b;4(b.2v(/^([><]+=*|==)\\d+\\.?\\d*$/))r!3k(\'(\'+a+b+\')\');z r 9};3.2T=7(a){8 b=3;V(b.G!="1m"&&b.G!="1v")b=b.x;4(S b.u.C==\'1t\')3.x.E[b.u.C].X=\'\';3.X=\'2O\';b.u.20(3.R,9,I)};3.2M=7(a){8 b=3;V(b.G!="1m"&&b.G!="1v")b=b.x;8 c=3.1P;4(!c)r 9;4(c.1e)b.u.1X(c);z b.u.1Y(c)};3.2B=7(a){8 b=3;V(b.G!="1m"&&b.G!="1v")b=b.x;8 c=I;4(b.u.2l){8 d={};J(8 i=0;i<b.u.Y;i++)d[b.u.F[i].G]=3.3j[i].2z.3i();4(b.u.2l(3,d)===9)c=9}4(c){4(b.1K>=0&&b.P[b.1K])b.P[b.1K].X=\'\';b.1K=3.3h;3.X=\'3g\'}};3.3e=7(b){3.1z(b);3.6.w[b].D.4q=19.4p(3.6.w[b].1g)+"2r";3.6.w[b].1a=3.t[b].1w;3.6.w[b].D.1j="";3.6.w[b].D.4n=(19.4m(3.6.w[b].1g)-3.6.w[b].4l)+"2r";19.1M(3.6.w[b],3.6.w[b].1g.3c-5,1,I,I,7(a){a.22()})};3.3a=7(b){3.1z(b);19.1M(3.6.w[b],0,-1,I,I,7(a){a.D.1j="1o"})};3.1z=7(a){4(3.6.w[a].18){y.2m(3.6.w[a].18);3.6.w[a].18=1r}4(3.6.w[a].1O){y.2m(3.6.w[a].1O);3.6.w[a].1O=1r}};3.1V=7(){J(8 i=0;i<3.Y;i++)s.2N.1p(3.6.w[i])};3.32=7(a){8 b=4k(3.D.23)||3.3c;b-=5*a.4i;3.D.23=b+"2r";a.4h()};3.2R=7(a){8 b=3;V(b.G!="1m"&&b.G!="1v")b=b.x;b.u.1z(3.R);3.B.1O=y.1H("y.Q["+b.u.O+"].3e("+3.R+");",4f)};3.2Q=7(a){8 b=3;V(b.G!="1m"&&b.G!="1v")b=b.x;b.u.1z(3.R)};3.2H=7(a){3.18=y.1H("y.Q["+3.u.O+"].3a("+3.1g.R+");",4e)};3.2K=7(a){4(3.18){y.2m(3.18);3.18=1r}};3.2G=7(a){8 b=(a.39)?a.39:a.4d;4(b==27){3.1a=\'\';b=13}4(b==13){3.u.t[3.1g.R].1w=3.1a;3.u.1d();3.2I();4(3.1a)3.22()}};3.1Y=7(a){8 b=a.1s;a.1e=0;V(b&&b.1P==a){J(8 i=0;i<3.Y;i++){4(i==3.C||3.t[i].1i)2L;14=(3.t[i].2f)?"2E":3.t[i].14;2c(14){1h\'2b\':1h\'29\':a.E[i].K.U=1G(a.E[i].K.U)+1G(b.E[i].K.U);1R;2k:a.E[i].v(s.A(\'2X\'));4(a.E[i].24!=b.E[i].K.U){a.E[i].v(s.1A(b.E[i].K.U));a.E[i].24=b.E[i].K.U}}}a.1e++;a.x.1p(b);b=a.1s}3.6.T.1k=9};3.1X=7(a){8 b=3.1d(9,a.2x,(a.1e+1),a.1s);a.x.1p(a);3.6.Z.1k=9;r b};4(o)3.2U()}N.2J=1;N.4b=7(){J(8 a 4s y.Q)y.Q[a].2A()};y.Q=1n 4u();',62,279,'|||this|if||tableElement|function|var|false|||||||||||||||||newCell|return|document|columnProperties|creator|appendChild|filterBoxes|parentNode|window|else|createElement|filterBox|sortBy|style|childNodes|columns|tagName|delete|true|for|firstChild|AJAX|columnList|DBGrid|guid|rows|DBGrids|colIndex|typeof|expandButton|nodeValue|while|newCheckbox|className|colCount|collapseButton|add|Events|data||dataType|getElementsByTagName||XML|hideTimer|Visual|value|_sortCache|_extractCellValue|_printRows|groupCount|newLabel|columnHeader|case|hidden|display|disabled|sortDirection|TABLE|new|none|removeChild|_printCache|undefined|nextSibling|number|charAt|HTML|filter|setAttribute|getValue|_cancelFilterBoxTimers|createTextNode|error|onclick|columnsButton|input|tbody|parseFloat|setTimeout|currentKeyData|filterFunction|selectedIndex|length|fadeNSlide|type|showTimer|parentRow|_print|break|printElement|dataAddress|lastKeyRow|_removeFilterBoxes|lastKeyData|_expandRowGroup|_collapseRowGroup|_activeCompareFunction|sortData|fetcher|focus|width|lastStr|parameters|substr||Error|real|onSortEnd|int|switch|onSortBegin|onPrintEnd|dontSum|onPrintBegin|onFetchEnd|onFetchError|onFetchBegin|default|onRowClick|clearTimeout|rowCount|0px|_sortRows|button|px|id|caption|printAfterParse|match|_applyFilter|index|status|innerHTML|destroy|_onRowClick|_alphaNumericCompare|_numericCompare|string|throw|_filterBoxKeyDownHandler|_filterBoxBlurHandler|blur|_lastGuid|_filterBoxFocusHandler|continue|_rowGrouper|body|sorted|_alphaNumericFilter|_titleMouseOutHandler|_titleMouseOverHandler|_numericFilter|_titleClickHandler|refreshData|self|hint|br|checked|js|parseData|isNaN|_titleWheelHandler|td|tr|setColumnVisibility|expandAllRows|collapseAllRows|toArray|which|_hideFilterBox|height|offsetWidth|parseDataAfterFetch|_showFilterBox|responseXML|selected|rowIndex|BRtoLB|cells|eval|gi|escapeRegExp|RegExp|toLowerCase|table|insertBefore|150|toSource|empty|200|ondblclick|or|Bad|rowContent|Parse|removeChildren|boolean|loadingData|sort|getElementById|POST|makeRequest|keydown|absolute|finally|position|datatype|_filter|_|catch|push|row|mouseout|mouseover|wheel|click|alias|insertCell|getAttribute|checkbox|_columnControl|label|title|visible|data_type|found|insertRow|thead|be|Array|cannot|scrollHeight|clearAll|try|keyCode|500|750|library|preventDefault|delta|setOpacity|parseInt|offsetHeight|getElementPositionY|top|_columnList|getElementPositionX|left|div|in|functions|Object'.split('|'),0,{}))