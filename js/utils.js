/* Saltline Swim — utilities: DOM lookup, currency, HTML escaping, safe localStorage */
const $=i=>document.getElementById(i),m=n=>"$"+n.toFixed(2),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const L=(k,d)=>{try{const v=JSON.parse(localStorage.getItem("sl-"+k));return v==null?d:v}catch(e){return d}},Wr=(k,v)=>{try{localStorage.setItem("sl-"+k,JSON.stringify(v))}catch(e){}};
