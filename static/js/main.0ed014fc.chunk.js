(this["webpackJsonpmy-app"]=this["webpackJsonpmy-app"]||[]).push([[0],{48:function(e,t,a){e.exports=a(62)},53:function(e,t,a){},54:function(e,t,a){},62:function(e,t,a){"use strict";a.r(t);var n=a(0),l=a.n(n),r=a(13),s=a.n(r),c=(a(53),a(35)),i=(a(54),a(93)),o=a(94),m=a(95),u=a(100),h=a(42),p=a.n(h),d=a(92),E=a(43),g=a(36),f=a(37),b=a(18),k=a(45),y=a(44),x=a(84),v=a(64),S=a(99),C=a(98),T=a(97),M=a(86),A=a(87),F=a(88),j=a(89),w=a(90),O=a(96),W=a(91),I={2021:{s:{deduction:12550,brackets:{0:{p:.1,s:0},9950:{p:.12,s:995},40525:{p:.22,s:4664},86375:{p:.24,s:14751},164925:{p:.32,s:33603},209425:{p:.35,s:47843},523600:{p:.37,s:157804.25},999999999:{p:.37,s:0}}},m:{deduction:25100,brackets:{0:{p:.1,s:0},19900:{p:.12,s:1990},81050:{p:.22,s:9328},172750:{p:.24,s:29502},329850:{p:.32,s:67206},418850:{p:.35,s:95686},628300:{p:.37,s:168993.5},999999999:{p:.37,s:0}}}},2022:{s:{deduction:12950,brackets:{0:{p:.1,s:0},10275:{p:.12,s:1027.5},41775:{p:.22,s:4807.5},89075:{p:.24,s:15213.5},170050:{p:.32,s:34647.5},215950:{p:.35,s:49335.5},539900:{p:.37,s:162718}}},m:{deduction:25900,brackets:{0:{p:.1,s:0},20550:{p:.12,s:2055},83550:{p:.22,s:9615},178150:{p:.24,s:30427},340100:{p:.32,s:69295},431900:{p:.35,s:98671},647850:{p:.37,s:174253.5}}}}},z={2021:{s:{deduction:4803,brackets:{0:{p:.01,s:0},9325:{p:.02,s:93.25},22107:{p:.04,s:348.89},34892:{p:.06,s:860.29},48435:{p:.08,s:1672.87},61214:{p:.093,s:2695.19},312686:{p:.103,s:26082.09},375221:{p:.113,s:32523.2},625369:{p:.123,s:60789.92},1e6:{p:.133,s:106869.53}}},m:{deduction:9606,brackets:{0:{p:.01,s:0},18650:{p:.02,s:186.5},44214:{p:.04,s:697.78},69784:{p:.06,s:1720.58},96870:{p:.08,s:3345.74},122428:{p:.093,s:5390.38},625372:{p:.103,s:52164.17},750442:{p:.113,s:65046.38},1e6:{p:.123,s:93246.43},1250738:{p:.133,s:124087.2}}}},2022:{s:{deduction:4803,brackets:{0:{p:.01,s:0},9325:{p:.02,s:93.25},22107:{p:.04,s:348.89},34892:{p:.06,s:860.29},48435:{p:.08,s:1672.87},61214:{p:.093,s:2695.19},312686:{p:.103,s:26082.09},375221:{p:.113,s:32523.2},625369:{p:.123,s:60789.92},1e6:{p:.133,s:106869.53}}},m:{deduction:9606,brackets:{0:{p:.01,s:0},18650:{p:.02,s:186.5},44214:{p:.04,s:697.78},69784:{p:.06,s:1720.58},96870:{p:.08,s:3345.74},122428:{p:.093,s:5390.38},625372:{p:.103,s:52164.17},750442:{p:.113,s:65046.38},1e6:{p:.123,s:93246.43},1250738:{p:.133,s:124087.2}}}}},D=function(e,t,a,n){var l=e[n],r=t-l[a].deduction,s=r;if(r<0)return{tax:0,taxableAmount:0};for(var c=l[a].brackets,i=Object.keys(c),o=0;o<i.length;o++)if(i[o]>r||999999999==i[o]){r-=i[o-1];var m=(i=c[i[o-1]]).p*r+i.s;return{tax:Math.round(m),taxableAmount:s}}r-=i[(o=i.length-1)-1];m=(i=c[i[o-1]]).p*r+i.s;return{tax:Math.round(m),taxableAmount:s}},N=function(e,t,a,n){var l=function(e,t,a){return D(I,e,t,a)}(e,t,a),r=function(e,t,a){return D(z,e,t,a)}(e,t,a),s=function(e,t,a){var n=Math.min(e,132900);return Math.round(.062*n)}(e),c=function(e,t,a){return Math.round(.009*Math.max(0,e-2e5)+.0145*Math.min(2e5,e))}(e),i=l.tax+r.tax+s+c;return{fed:l,state:r,social:s,medicare:c,totals:{net:e-i,netMonthly:Math.round((e-i)/12),tax:i}}},Y=function(e){Object(k.a)(a,e);var t=Object(y.a)(a);function a(e){var n;return Object(g.a)(this,a),(n=t.call(this,e)).formatter=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}),n.percentageFormatter=new Intl.NumberFormat("en-US",{style:"percent",minimumFractionDigits:2,maximumFractionDigits:2}),n.handlechange=n.handlechange.bind(Object(b.a)(n)),n.handleSatusClick=n.handleSatusClick.bind(Object(b.a)(n)),n.handleYearClick=n.handleYearClick.bind(Object(b.a)(n)),n.state={income:1e5,status:"s",year:"2022",state:"CA",calculation:N(1e5,"s","2022")},n}return Object(f.a)(a,[{key:"handlechange",value:function(e){this.setState({income:e.target.value,calculation:N(e.target.value,this.state.status,this.state.year,this.state.state)})}},{key:"handleSatusClick",value:function(e){var t="Single"==e.target.textContent?"s":"m";this.setState({status:t,calculation:N(this.state.income,t,this.state.year,this.state.state)})}},{key:"handleYearClick",value:function(e){var t=e.target.textContent;this.setState({year:t,calculation:N(this.state.income,this.state.status,t,this.state.state)})}},{key:"render",value:function(){return l.a.createElement("form",{className:this.props.useClasses.root,noValidate:!0,autoComplete:"off"},l.a.createElement(x.a,{container:!0,spacing:2},l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(v.a,{variant:"h5",align:"center"},"US Income Tax Calculator (beta)")),l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(S.a,{fullWidth:!0,className:this.props.useClasses.margin,variant:"outlined"},l.a.createElement(C.a,{htmlFor:"outlined-adornment-amount"},"Annual Income Amount"),l.a.createElement(T.a,{id:"outlined-income-amount",value:this.state.income,onChange:this.handlechange,startAdornment:l.a.createElement(M.a,{position:"start"},"$"),labelWidth:200,type:"number",style:{fontSize:"2em"}}))),l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(A.a,{size:"small"},l.a.createElement(F.a,null,l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Status"),l.a.createElement(w.a,{align:"right"},l.a.createElement(O.a,{variant:"outlined",clickable:!0,label:"Single",onClick:this.handleSatusClick,color:"s"==this.state.status?"secondary":""}),"\xa0",l.a.createElement(O.a,{variant:"outlined",clickable:!0,label:"Married",onClick:this.handleSatusClick,color:"m"==this.state.status?"secondary":""}))),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Year"),l.a.createElement(w.a,{align:"right"},l.a.createElement(O.a,{variant:"outlined",clickable:!0,label:"2021",onClick:this.handleYearClick,color:"2021"==this.state.year?"secondary":""}),l.a.createElement(O.a,{variant:"outlined",clickable:!0,label:"2022",onClick:this.handleYearClick,color:"2022"==this.state.year?"secondary":""}))),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"State"),l.a.createElement(w.a,{align:"right"},l.a.createElement(O.a,{variant:"outlined",clickable:!0,label:"CA",color:"secondary"})))))),l.a.createElement(x.a,{item:!0,xs:12},l.a.createElement(A.a,{size:"small"},l.a.createElement(W.a,null,l.a.createElement(j.a,null,l.a.createElement(w.a,{colSpan:2,style:{fontWeight:600}},"Federal Taxes"))),l.a.createElement(F.a,null,l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Taxable Income"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.fed.taxableAmount))),"                            ",l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Federal Tax"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.fed.tax))),l.a.createElement(j.a,null,l.a.createElement(w.a,{colSpan:2,style:{fontWeight:600}},"FICA")),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Social Security"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.social))),"                            ",l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Medicare"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.medicare))),l.a.createElement(j.a,null,l.a.createElement(w.a,{colSpan:2,style:{fontWeight:600}},"California State Taxes")),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Taxable Income"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.state.taxableAmount))),"                            ",l.a.createElement(j.a,null,l.a.createElement(w.a,null,"State Tax"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.state.tax))),l.a.createElement(j.a,null,l.a.createElement(w.a,{colSpan:2,style:{fontWeight:600}},"Totals")),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Effective Tax Rate"),l.a.createElement(w.a,{align:"right"},this.percentageFormatter.format(this.state.calculation.totals.tax/this.state.income))),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Total Tax"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.totals.tax))),l.a.createElement(j.a,null,l.a.createElement(w.a,null,"Monthly Take Home"),l.a.createElement(w.a,{align:"right"},this.formatter.format(this.state.calculation.totals.netMonthly))),l.a.createElement(j.a,null,l.a.createElement(w.a,{style:{fontWeight:600,fontSize:"1.1em"}},"Annual Take Home"),l.a.createElement(w.a,{style:{fontWeight:600,fontSize:"1.1em"},align:"right"},this.formatter.format(this.state.calculation.totals.net))))))))}}]),a}(l.a.Component),U=(a(59),Object(d.a)((function(e){return{paper:Object(c.a)({marginTop:e.spacing(8),display:"flex",flexDirection:"column",alignItems:"center"},"marginTop",e.spacing(1)),avatar:{margin:e.spacing(1),backgroundColor:e.palette.secondary.main},form:{width:"100%",marginTop:e.spacing(1)},submit:{margin:e.spacing(3,0,2)}}})));var B=function(){var e=U(),t=Object(E.a)({typography:{fontSize:16}});return l.a.createElement(i.a,{theme:t},l.a.createElement(o.a,{component:"main",maxWidth:"xs"},l.a.createElement(m.a,null),l.a.createElement("div",{className:e.paper},l.a.createElement(u.a,{className:e.avatar},l.a.createElement(p.a,null)),l.a.createElement(Y,{useClasses:e}))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));s.a.render(l.a.createElement(l.a.StrictMode,null,l.a.createElement(B,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[48,1,2]]]);
//# sourceMappingURL=main.0ed014fc.chunk.js.map