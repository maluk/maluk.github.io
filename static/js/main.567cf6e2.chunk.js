(this["webpackJsonpmy-app"]=this["webpackJsonpmy-app"]||[]).push([[0],{48:function(e,t,a){e.exports=a(62)},53:function(e,t,a){},54:function(e,t,a){},62:function(e,t,a){"use strict";a.r(t);var n=a(0),l=a.n(n),r=a(13),s=a.n(r),c=(a(53),a(24)),i=(a(54),a(93)),o=a(94),m=a(95),u=a(100),p=a(42),h=a.n(p),d=a(92),E=a(43),g=a(36),f=a(37),b=a(18),y=a(45),k=a(44),x=a(84),v=a(64),S=a(99),C=a(98),T=a(97),M=a(86),j=a(87),A=a(88),O=a(89),W=a(90),w=a(96),I=a(91),F={2018:{s:{deduction:12200,brackets:{0:{p:.1,s:0},9700:{p:.12,s:970},39475:{p:.22,s:4543},84200:{p:.24,s:14382},160725:{p:.32,s:32748},204100:{p:.35,s:46628},510300:{p:.37,s:153798},999999999:{p:.37,s:334987}}},m:{deduction:24400,brackets:{0:{p:.1,s:0},19400:{p:.12,s:1940},78950:{p:.22,s:9086},168400:{p:.24,s:28765},321450:{p:.32,s:65497},408200:{p:.35,s:93257},612350:{p:.37,s:164709},999999999:{p:.37,s:226569}}}},2019:{s:{deduction:12200,brackets:{0:{p:.1,s:0},9700:{p:.12,s:970},39475:{p:.22,s:4543},84200:{p:.24,s:14382},160725:{p:.32,s:32748},204100:{p:.35,s:46628},510300:{p:.37,s:153798},999999999:{p:.37,s:334987}}},m:{deduction:24400,brackets:{0:{p:.1,s:0},19400:{p:.12,s:1940},78950:{p:.22,s:9086},168400:{p:.24,s:28765},321450:{p:.32,s:65497},408200:{p:.35,s:93257},612350:{p:.37,s:164709},999999999:{p:.37,s:226569}}}},2020:{s:{deduction:12200,brackets:{0:{p:.1,s:0},9700:{p:.12,s:970},39475:{p:.22,s:4543},84200:{p:.24,s:14382},160725:{p:.32,s:32748},204100:{p:.35,s:46628},510300:{p:.37,s:153798},999999999:{p:.37,s:334987}}},m:{deduction:24400,brackets:{0:{p:.1,s:0},19400:{p:.12,s:1940},78950:{p:.22,s:9086},168400:{p:.24,s:28765},321450:{p:.32,s:65497},408200:{p:.35,s:93257},612350:{p:.37,s:164709},999999999:{p:.37,s:226569}}}}},z={2019:{m:{deduction:9074,brackets:{0:{p:.01,s:0},17618:{p:.02,s:176.18},41766:{p:.04,s:659.14},65920:{p:.06,s:1625.3},91506:{p:.08,s:3160.46},115648:{p:.093,s:5091.82},590746:{p:.103,s:49275.93},708890:{p:.113,s:61444.77},1181484:{p:.123,s:94340.2},999999999:{p:.133,s:0}}},s:{deduction:9074,brackets:{0:{p:.01,s:0},8809:{p:.02,s:88.09},20883:{p:.04,s:329.56},32960:{p:.06,s:812.65},45753:{p:.08,s:1580.23},57824:{p:.093,s:2545.91},295373:{p:.103,s:24637.97},354445:{p:.113,s:30772.39},590742:{p:.123,s:57423.95},999999999:{p:.133,s:0}}}}},N=function(e,t,a,n){var l=e[n],r=t-l[a].deduction,s=r;if(r<0)return{tax:0,taxableAmount:0};for(var c=l[a].brackets,i=Object.keys(c),o=0;o<i.length;o++)if(i[o]>r||999999999==i[o]){r-=i[o-1];var m=(i=c[i[o-1]]).p*r+i.s;return{tax:Math.round(m),taxableAmount:s}}return{tax:0,taxableAmount:0}},Y=function(e,t,a,n){var l=function(e,t,a){return N(F,e,t,a)}(e,t,a),r=function(e,t,a){return N(z,e,t,a)}(e,t,a),s=function(e,t,a){var n=Math.min(e,132900);return Math.round(.062*n)}(e),c=function(e,t,a){return Math.round(.009*Math.max(0,e-2e5)+.0145*Math.min(2e5,e))}(e),i=l.tax+r.tax+s+c;return{fed:l,state:r,social:s,medicare:c,totals:{net:e-i,netMonthly:Math.round((e-i)/12),tax:i}}},D=function(e){Object(y.a)(a,e);var t=Object(k.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).formatter=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}),n.handlechange=n.handlechange.bind(Object(b.a)(n)),n.handleSatusClick=n.handleSatusClick.bind(Object(b.a)(n)),n.handleYearClick=n.handleYearClick.bind(Object(b.a)(n)),n.state={income:1e5,status:"m",year:"2019",state:"CA",calculation:Y(1e5,"m","2019")},n}return Object(f.a)(a,[{key:"handlechange",value:function(e){this.setState({income:e.target.value,calculation:Y(e.target.value,this.state.status,this.state.year,this.state.state)})}},{key:"handleSatusClick",value:function(e){var t="Single"==e.target.textContent?"s":"m";this.setState({status:t,calculation:Y(this.state.income,t,this.state.year,this.state.state)})}},{key:"handleYearClick",value:function(e){var t=e.target.textContent;this.setState({year:t,calculation:Y(this.state.income,this.state.status,t,this.state.state)})}},{key:"render",value:function(){return l.a.createElement("form",{className:this.props.useClasses.root,noValidate:!0,autoComplete:"off"},l.a.createElement(x.a,{container:!0,spacing:2},l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(v.a,{variant:"h5",align:"center"},"US Income Tax Calculator")),l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(S.a,{fullWidth:!0,className:this.props.useClasses.margin,variant:"outlined"},l.a.createElement(C.a,{htmlFor:"outlined-adornment-amount"},"Annual Income Amount"),l.a.createElement(T.a,{id:"outlined-income-amount",value:this.state.income,onChange:this.handlechange,startAdornment:l.a.createElement(M.a,{position:"start"},"$"),labelWidth:200,type:"number",style:{fontSize:"2em"}}))),l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(j.a,{size:"small"},l.a.createElement(A.a,null,l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Status"),l.a.createElement(W.a,{align:"right"},l.a.createElement(w.a,{variant:"outlined",clickable:!0,label:"Single",onClick:this.handleSatusClick,color:"s"==this.state.status?"secondary":""}),"\xa0",l.a.createElement(w.a,{variant:"outlined",clickable:!0,label:"Married",onClick:this.handleSatusClick,color:"m"==this.state.status?"secondary":""}))),l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Year"),l.a.createElement(W.a,{align:"right"},l.a.createElement(w.a,Object(c.a)({variant:"outlined",clickable:!0,label:"2019",onClick:this.handleYearClick,color:"secondary"},"color","2019"==this.state.year?"secondary":"")))),l.a.createElement(O.a,null,l.a.createElement(W.a,null,"State"),l.a.createElement(W.a,{align:"right"},l.a.createElement(w.a,{variant:"outlined",clickable:!0,label:"CA",color:"secondary"})))))),l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(j.a,{size:"small"},l.a.createElement(I.a,null,l.a.createElement(O.a,null,l.a.createElement(W.a,{colSpan:2,style:{fontWeight:600}},"Federal Taxes"))),l.a.createElement(A.a,null,l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Taxable Income"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.fed.taxableAmount))),"                            ",l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Federal Tax"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.fed.tax))),l.a.createElement(O.a,null,l.a.createElement(W.a,{colSpan:2,style:{fontWeight:600}},"FICA")),l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Social Security"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.social))),"                            ",l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Medicare"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.medicare))),l.a.createElement(O.a,null,l.a.createElement(W.a,{colSpan:2,style:{fontWeight:600}},"California State Taxes")),l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Taxable Income"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.state.taxableAmount))),"                            ",l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Satet Tax"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.state.tax))),l.a.createElement(O.a,null,l.a.createElement(W.a,{colSpan:2,style:{fontWeight:600}},"Totals")),l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Total Tax"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.totals.tax))),l.a.createElement(O.a,null,l.a.createElement(W.a,null,"Monthly Take Home"),l.a.createElement(W.a,{align:"right"},this.formatter.format(this.state.calculation.totals.netMonthly))),l.a.createElement(O.a,null,l.a.createElement(W.a,{style:{fontWeight:600,fontSize:"1.1em"}},"Annual Take Home"),l.a.createElement(W.a,{style:{fontWeight:600,fontSize:"1.1em"},align:"right"},this.formatter.format(this.state.calculation.totals.net))))))))}}]),a}(l.a.Component),U=(a(59),Object(d.a)((function(e){return{paper:Object(c.a)({marginTop:e.spacing(8),display:"flex",flexDirection:"column",alignItems:"center"},"marginTop",e.spacing(1)),avatar:{margin:e.spacing(1),backgroundColor:e.palette.secondary.main},form:{width:"100%",marginTop:e.spacing(1)},submit:{margin:e.spacing(3,0,2)}}})));var B=function(){var e=U(),t=Object(E.a)({typography:{fontSize:16}});return l.a.createElement(i.a,{theme:t},l.a.createElement(o.a,{component:"main",maxWidth:"xs"},l.a.createElement(m.a,null),l.a.createElement("div",{className:e.paper},l.a.createElement(u.a,{className:e.avatar},l.a.createElement(h.a,null)),l.a.createElement(D,{useClasses:e}))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));s.a.render(l.a.createElement(l.a.StrictMode,null,l.a.createElement(B,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[48,1,2]]]);
//# sourceMappingURL=main.567cf6e2.chunk.js.map