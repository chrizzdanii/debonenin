const $=s=>document.querySelector(s);
const h=(t,a,...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a||{})){if(x==='on'){for(const[n,f]of Object.entries(v))e.addEventListener(n,f)}else if(x==='class')e.className=v;else if(x==='html')e.innerHTML=v;else if(v!==false&&v!=null)e.setAttribute(x,v)}k.flat(9).forEach(c=>{if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(String(c)))});return e};
/* static icon set (inline SVG paths, no user data) */
const I={
dash:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
wallet:'<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14" r="1"/>',
plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',swap:'<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',shieldck:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
finger:'<path d="M6 11a6 6 0 0 1 12 0v2M9 20c0-3 0-5 0-8a3 3 0 0 1 6 0c0 3 0 6-1 8M12 12v3c0 2-.5 3.5-1 5M6 15c0 2 0 3-.5 4M18 14c0 2-.5 4-1 5"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M3 3l18 18M10.5 6.2A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.8M6.5 7.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4-.9"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
check:'<path d="M5 12l4 4 10-10"/>',circle:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/>',
bank:'<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
idcard:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c0-2 6-2 6 0M14 10h4M14 14h4"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5 7-5s7 1.5 7 5M16 5a3.5 3.5 0 0 1 0 7M22 20c0-3-2-4.5-4-5"/>',
car:'<path d="M4 16v-4l2-5h12l2 5v4zM4 16v2M20 16v2M4 12h16"/>',bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
wa:'<path d="M3 21l1.5-5A9 9 0 1 1 8 19.5z"/><path d="M9 9c0 3 3 6 6 6l1-2-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
out:'<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>',
chev:'<path d="M11 6l-6 6 6 6M18 6l-6 6 6 6"/>',panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
badge:'<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c1-3 7-3 8 0"/>',
demo:'<path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17c1-3 8-3 9 0"/>',
receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',building:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
chart:'<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
down:'<path d="M12 4v12M6 12l6 6 6-6"/>',card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'};
const logoEl=()=>{const d=h('div',{class:'logo'},'D'),im=h('img',{src:'/logo.png',alt:'DEBONE'});im.onload=()=>d.replaceChildren(im);return d};
try{document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}
const flipTheme=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{}};
const ic=(n,s=18)=>h('span',{class:'ic',html:'<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(I[n]||'')+'</svg>'});
const N=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const fmt=s=>{const t=String(s),d=new Date(/(Z|[+-]\d\d:?\d\d)$/.test(t)?t:t.replace(' ','T')+'Z');return isNaN(d)?s:d.toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'})};
const api=(a,d={})=>fetch('/api/'+a,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(r=>r.json()).catch(()=>({ok:false,msg:'Network problem. Check your connection and try again.'}));
function toast(t){const e=h('div',{class:'toast'},t);document.body.append(e);setTimeout(()=>e.remove(),4200)}
let ME=null,CF={},SV={},PAGES=[],hideBal=false,tabSel='All Services',tileQ='';
const root=$('#root');
const copyTxt=t=>{navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast('Copied'))};
const greet=()=>{const x=new Date().getHours();return x<12?'Good Morning':x<17?'Good Afternoon':'Good Evening'};

/* ===== payments helpers ===== */
const grossFor=a=>{if(!CF.passFee)return a;let g=Math.ceil(a/0.985);if(g>=2500)g=Math.ceil((a+100)/0.985);if(g-a>2000)g=a+2000;return g};
async function payList(m){
  const r=await api('pay/list');if(!r.ok||!r.rows.length)return;
  const c=h('div',{class:'cd pad ov',style:'margin-top:22px'},h('h3',{style:'margin:0 0 6px'},'Your recent payments'),h('p',{class:'mut',style:'margin-bottom:10px;font-size:13px'},'Paid but your balance has not changed? Press "Check now" next to the payment.'));
  const t=h('table',{class:'tbl'},h('tr',{},['Date','Amount','Status',''].map(x=>h('th',{},x))));
  r.rows.forEach(p=>{const st=h('span',{class:'badge '+(p.status==='paid'?'':p.status==='pending'?'y':'r')},p.status==='paid'?'credited':p.status==='pending'?'waiting':'needs review');
    const b=h('button',{class:'btn out sm'},'Check now');b.onclick=async()=>{b.disabled=true;const x=await api('pay/verify',{ref:p.ref});b.disabled=false;if(x.bal!=null)setBal(x.bal);toast(x.status==='paid'?'Payment confirmed. Wallet credited.':x.status==='failed'?'This payment did not go through.':'Not confirmed yet. If you have paid, try again in a minute.');if(x.status==='paid'){st.textContent='credited';st.className='badge';b.remove()}};
    t.append(h('tr',{},h('td',{class:'mut'},fmt(p.at)),h('td',{style:'font-weight:700'},N(p.amt)),h('td',{},st),h('td',{},p.status==='pending'?b:'')))});
  c.append(t);m.append(c);
}

/* ===== modal & terms ===== */
function modal(title,...body){const m=h('div',{class:'modal',role:'dialog','aria-modal':'true','aria-label':title,on:{click:e=>{if(e.target===m)m.remove()}}},h('div',{class:'cd pad mbox'},h('h2',{style:'margin-bottom:10px'},title),body,h('div',{style:'margin-top:18px'},h('button',{class:'btn',on:{click:()=>m.remove()}},'Close'))));document.body.append(m);return m}
const TERMS=[['Authorised use','Use these services only with the consent of the person whose details you check, and only for lawful purposes. Misuse can lead to account suspension and a report to the authorities.'],
['Data protection','We handle personal data in line with the Nigeria Data Protection Act 2023. Results are shown to you on screen. So that a lost download can be recovered and disputes can be settled, a copy of each successful result is kept for up to 30 days, visible only to our administrator, then deleted. Results of agency requests (IPE, validation, personalisation) are kept for 7 days so you can collect them. We do not sell data.'],
['Payments','All wallet funding is done through Paystack. We never see or store your card details. Paystack charges a processing fee; it is shown before you pay and is added to your payment, so your wallet is credited with the full amount you choose. Wallet balances are used only for services on this site.'],
['Charges and refunds','The price is shown before every check. If a check cannot be completed, or an agency request fails, the fee returns to your wallet automatically. Some lookup services charge even when no record is found; the result screen says so.'],
['Your account','Keep your password private. Accounts used for fraud or abuse may be suspended without notice.']];
function showTerms(){modal('Terms & Privacy',TERMS.map(([t,b])=>[h('h4',{style:'margin:14px 0 4px'},t),h('p',{class:'mut'},b)]))}
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal').forEach(x=>x.remove())});

/* ===== auth ===== */
async function authView(){
  let reg=false;const pub=await api('public');
  const name=h('input',{type:'text',placeholder:'Your full name',autocomplete:'name'}),email=h('input',{type:'email',placeholder:'name@example.com',autocomplete:'email'}),pass=h('input',{type:'password',placeholder:'Password',autocomplete:'current-password'});
  const eye=h('button',{type:'button','aria-label':'Show or hide password',on:{click:()=>{pass.type=pass.type==='password'?'text':'password'}}},ic('eye'));
  const msg=h('div',{class:'msg',role:'alert'}),go=h('button',{class:'btn w'},'Sign in to account'),title=h('h2',{},'Welcome back'),sub=h('p',{class:'mut'},'Enter your credentials to securely access your account dashboard.');
  const nmW=h('div',{class:'hide'},h('label',{class:'lbl'},'Full name'),h('div',{class:'ig'},ic('user'),name));
  const agree=h('input',{type:'checkbox'});
  const agW=h('label',{class:'hide',style:'display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--mut);margin-top:14px'},agree,h('span',{},'I agree to the ',h('a',{href:'#',style:'color:var(--y)',on:{click:e=>{e.preventDefault();showTerms()}}},'Terms & Privacy'),' and will only verify details with the owner’s consent.'));
  const sw=h('a',{href:'#',style:'color:var(--y);font-weight:700'},'Create one now'),q=h('span',{class:'mut'},"Don't have an account? ");
  sw.onclick=e=>{e.preventDefault();reg=!reg;nmW.classList.toggle('hide',!reg);agW.classList.toggle('hide',!reg);pass.autocomplete=reg?'new-password':'current-password';pass.placeholder=reg?'At least 8 characters':'Password';title.textContent=reg?'Create account':'Welcome back';go.textContent=reg?'Create account':'Sign in to account';q.textContent=reg?'Already registered? ':"Don't have an account? ";sw.textContent=reg?'Sign in':'Create one now';msg.textContent=''};
  const code=h('input',{placeholder:'123456',inputmode:'numeric',autocomplete:'one-time-code',maxlength:7}),codeW=h('div',{class:'hide'},h('label',{class:'lbl'},'Authenticator code'),h('div',{class:'ig'},ic('shield'),code));
  const submit=async()=>{if(reg&&!agree.checked){msg.textContent='Please accept the Terms & Privacy to continue.';return}go.disabled=true;const r=await api(reg?'register':'login',{name:name.value,email:email.value,pass:pass.value,agree:agree.checked,code:code.value});go.disabled=false;if(r.ok)boot();else{if(r.needCode){codeW.classList.remove('hide');code.focus()}msg.textContent=r.msg||'Something went wrong.'}};
  go.onclick=submit;pass.addEventListener('keydown',e=>{if(e.key==='Enter')submit()});code.addEventListener('keydown',e=>{if(e.key==='Enter')submit()});
  const fc=(i,t,d)=>h('div',{class:'fcard'},ic(i,20),h('div',{},h('b',{},t),h('span',{},d)));
  root.replaceChildren(h('div',{class:'auth'},
    h('div',{class:'l'},h('div',{class:'brand'},logoEl(),h('div',{},h('b',{},'DEBONE'),h('small',{},'Digital Hub'))),
      h('div',{},h('span',{class:'pill'},ic('shield',14),'Secure Access Portal')),
      h('h1',{},'Fast and secure agency services and verifications'),
      fc('shield','Secure by design','Encrypted connections and protected accounts.'),fc('bolt','Instant results','NIN, BVN, CAC, TIN and more in seconds.'),fc('wallet','One wallet','Fund once with Paystack and use every service.'),
      h('small',{class:'mut'},'© 2026 DEBONE PHOTOS. All rights reserved.')),
    h('div',{class:'r'},h('div',{class:'acard'},h('span',{class:'pill'},ic('lock',14),'Secure authentication'),title,sub,nmW,
      h('label',{class:'lbl'},'Email address'),h('div',{class:'ig'},ic('mail'),email),
      h('label',{class:'lbl'},'Password'),h('div',{class:'ig'},ic('lock'),pass,eye),agW,codeW,msg,go,
      h('p',{style:'text-align:center;margin-top:16px'},q,sw),
      h('p',{style:'text-align:center;margin-top:10px;font-size:12.5px'},h('a',{href:'#',class:'mut',on:{click:e=>{e.preventDefault();showTerms()}}},'Terms & Privacy'),pub.whatsapp?[' · ',h('a',{class:'mut',href:'https://wa.me/'+pub.whatsapp,target:'_blank',rel:'noopener'},'Forgot password? Contact support')]:null)))));
}
/* ===== pages & navigation ===== */
const LI={'Tax & TIN':'receipt','CAC':'building','ID documents':'idcard','Vehicle':'car','Bank & meter':'bank'};
function buildPages(list){
  SV={};list.forEach(s=>SV[s.key]=s);
  const b=[
    {id:'nin',t:'NIN Verification',i:'finger',tab:'Identity',hot:1,keys:['nin_premium','nin_standard','nin_regular','nin_vnin','nin_basic'],d:'Enter the 11-digit National Identity Number (NIN) below to query official NIMC records.',crumb:'Identity Verifications'},
    {id:'phone',t:'NIN via Phone',i:'phone',tab:'Identity',keys:['phone_premium','phone_standard','phone_regular'],d:'Enter the 11-digit phone number registered with the NIN.',crumb:'Identity Verifications'},
    {id:'demo',t:'NIN Demographic',i:'demo',tab:'Identity',keys:['nin_demo'],d:'Find a NIN record using personal details.',crumb:'Identity Verifications'},
    {id:'bvn',t:'BVN Verification',i:'shieldck',tab:'Identity',hot:1,keys:['bvn_premium','bvn_standard'],d:'Enter the 11-digit Bank Verification Number (BVN) below.',crumb:'Identity Verifications'},
    {id:'ipe',t:'IPE Clearance',i:'shield',tab:'NIN Agency',hot:1,keys:['ipe'],d:'Submit an IPE clearance request. Our team processes it and you track progress under My Requests.',crumb:'NIN Services'},
    {id:'validation',t:'NIN Validation',i:'circle',tab:'NIN Agency',keys:['validation'],d:'Submit a NIN validation request. Track the result under My Requests.',crumb:'NIN Services'},
    {id:'personalization',t:'NIN Personalisation',i:'badge',tab:'NIN Agency',keys:['personalization'],d:'Enter the enrolment tracking ID to get the NIN slip. Track the result under My Requests.',crumb:'NIN Services'}];
  const lk=list.filter(s=>s.kind==='lookup').map(s=>({id:s.key,t:s.label,i:LI[s.group]||'file',tab:'Business & ID',keys:[s.key],d:'Fill in the details below to run this check.',crumb:'More Verifications',grp:s.group}));
  PAGES=[...b,...lk].map(p=>({...p,keys:p.keys.filter(k=>SV[k]&&SV[k].active)})).filter(p=>p.keys.length);
}
const NAV=()=>[
  ['MAIN PORTAL',[['dashboard','Dashboard','dash','Live']]],
  ...(ME.admin?[['ADMIN',[['a/overview','Admin Overview','chart'],['a/prices','Set Prices','tag'],['a/transfers','Bank Transfers','bank'],['a/payments','Paystack Payments','card'],['a/requests','Agency Requests','file'],['a/results','Saved Results','file'],['a/users','Users','users'],['a/settings','Support Settings','gear']]]]:[]),
  ['FINANCE & WALLET',[['wallet','My Wallet','wallet'],['deposit','Deposit / Fund','plus'],['transactions','Transactions','swap']]],
  ['IDENTITY & VERIFICATIONS',[['nin','NIN Verification','finger'],['phone','NIN via Phone','phone'],['demo','NIN Demographic','demo'],['bvn','BVN Verification','shieldck'],['more','More Verifications','idcard']]],
  ['NIN SERVICES',[['ipe','IPE Clearance','shield'],['personalization','NIN Personalisation','badge'],['validation','NIN Validation','circle'],['requests','My Requests','file']]],
  ['ACCOUNT & SUPPORT',[['profile','Profile Settings','user'],['wa','Direct WhatsApp','wa','24/7'],['logout','Log Out','out']]]];
const curView=()=>location.hash.slice(2)||'dashboard';
function sidebar(){
  const sb=h('aside',{class:'sb'},h('div',{class:'top'},h('div',{class:'brand'},logoEl(),h('div',{},h('b',{},'DEBONE'),h('small',{},'DIGITAL HUB'))),h('button',{'aria-label':'Collapse menu',on:{click:toggleSide}},ic('chev',20))));
  NAV().forEach(([t,items])=>{sb.append(h('div',{class:'sec'},t));items.forEach(([v,l,i,bd])=>{
    const kids=[ic(i,19),h('span',{class:'lb'},l),bd?h('span',{class:'bd'},bd):null];
    if(v==='wa'){if(CF.whatsapp)sb.append(h('a',{class:'it',href:'https://wa.me/'+CF.whatsapp,target:'_blank',rel:'noopener'},kids))}
    else if(v==='logout')sb.append(h('button',{class:'it red',on:{click:async()=>{await api('logout');location.hash='';location.reload()}}},kids));
    else sb.append(h('a',{class:'it','data-v':v,href:'#/'+v,title:l},kids))})});
  return sb;
}
function toggleSide(){const a=$('#app');if(innerWidth<=900)a.classList.toggle('open');else a.classList.toggle('mini')}
function topbar(){
  const inp=h('input',{placeholder:'Search services, NIN, BVN, wallet…',autocomplete:'off'}),dd=h('div',{class:'dd hide'});
  const find=()=>{const t=inp.value.trim().toLowerCase();dd.replaceChildren();if(!t){dd.classList.add('hide');return}
    const all=[...PAGES.map(p=>[p.id,p.t,p.i]),['wallet','My Wallet','wallet'],['deposit','Deposit / Fund','plus'],['transactions','Transactions','swap'],['requests','My Requests','file']].filter(x=>x[1].toLowerCase().includes(t)).slice(0,7);
    all.forEach(([v,l,i])=>dd.append(h('a',{href:'#/'+v,on:{click:()=>{inp.value='';dd.classList.add('hide')}}},ic(i,16),l)));
    if(!all.length)dd.append(h('div',{class:'mut',style:'padding:12px 14px'},'No matching service.'));dd.classList.remove('hide')};
  inp.addEventListener('input',find);inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const a=dd.querySelector('a');if(a)a.click()}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();inp.focus()}});
  const um=h('div',{class:'um hide'},h('a',{class:'it',href:'#/profile'},ic('user',17),'Profile Settings'),h('button',{class:'it red',on:{click:async()=>{await api('logout');location.hash='';location.reload()}}},ic('out',17),'Log Out'));
  const uc=h('div',{class:'uc',role:'button',tabindex:'0',style:'cursor:pointer',on:{click:()=>um.classList.toggle('hide')}},h('div',{class:'av'},(ME.name||ME.email)[0].toUpperCase()),h('div',{style:'text-align:left'},h('b',{},(ME.name||ME.email.split('@')[0]).slice(0,18)),h('small',{},ME.admin?'Admin':'Personal')),um);
  return h('div',{class:'tbar'},h('button',{class:'sq','aria-label':'Toggle menu',on:{click:toggleSide}},ic('panel',19)),h('div',{class:'srch'},h('div',{class:'ig'},ic('search',17),inp,h('kbd',{},'Ctrl K')),dd),
    h('button',{class:'sq','aria-label':'Switch light or dark mode',on:{click:flipTheme},html:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'}),
    h('a',{class:'sq',href:'#/requests','aria-label':'Requests',style:'position:relative'},ic('bell',19),CF.pending?h('i',{class:'dot'}):null),uc);
}
function shell(){root.replaceChildren(h('div',{id:'app'},sidebar(),h('div',{class:'mn'},topbar(),h('main',{id:'main'}),h('footer',{class:'foot'},'© 2026 DEBONE PHOTOS · ',h('a',{href:'#',on:{click:e=>{e.preventDefault();showTerms()}}},'Terms & Privacy')))));window.addEventListener('click',e=>{if(!e.target.closest('.uc'))document.querySelectorAll('.um').forEach(x=>x.classList.add('hide'));if(!e.target.closest('.srch'))document.querySelectorAll('.dd').forEach(x=>x.classList.add('hide'))})}
const setBal=n=>{ME.bal=n;paintBal()};
const balTxt=()=>hideBal?'₦ ••••••':N(ME.bal);
const paintBal=()=>document.querySelectorAll('.balv').forEach(e=>e.textContent=balTxt());
const crumb=(...p)=>h('div',{class:'crumb'},p.map((x,i)=>[i?' / ':'',i===p.length-1?h('b',{},x[0]):h('a',{href:x[1]||'#/dashboard'},x[0])]));
const titleRow=(icn,t,pill,...extra)=>h('div',{class:'trow'},h('div',{class:'tav'},ic(icn,18)),h('h1',{},t),pill?h('span',{class:'pill'},pill):null,h('div',{class:'sp'},extra));
const emptyBox=(i,t,s)=>h('div',{class:'empty'},h('div',{class:'ci'},ic(i,36)),h('b',{},t),h('span',{},s));

/* ===== router ===== */
function render(){
  if(!ME)return;const v=curView(),m=$('#main');m.replaceChildren();$('#app').classList.remove('open');window.scrollTo(0,0);
  document.querySelectorAll('.it[data-v]').forEach(a=>a.classList.toggle('on',a.dataset.v===v||(v==='more'&&0)));
  const p=PAGES.find(x=>x.id===v);
  if(p)return pageView(m,p);
  if(v.startsWith('transfer/'))return transferPage(m,decodeURIComponent(v.slice(9)));
  const map={dashboard,wallet,deposit,transactions,requests,profile,more,'a/transfers':aTransfers,'a/overview':aOverview,'a/prices':aPrices,'a/users':aUsers,'a/results':aResults,'a/payments':aPayments,'a/requests':aRequests,'a/settings':aSettings};
  if(v.startsWith('a/')&&!ME.admin)return location.hash='#/dashboard';
  (map[v]||dashboard)(m);
}
window.addEventListener('hashchange',render);

/* ===== dashboard ===== */
function hero(){
  const eye=h('button',{'aria-label':'Show or hide balance',on:{click:()=>{hideBal=!hideBal;paintBal();eye.replaceChildren(ic(hideBal?'eyeoff':'eye',22))}}},ic(hideBal?'eyeoff':'eye',22));
  return h('div',{class:'hero'},h('div',{class:'chips'},h('span',{class:'chip'},ic('wallet',14),ME.admin?'Admin wallet':'Main wallet'),h('span',{class:'chip'},ic('shield',14),'Secure account'),h('span',{class:'chip'},ic('sun',14),greet()+', '+(ME.name||ME.email.split('@')[0]))),
    h('div',{class:'hl'},'AVAILABLE BALANCE'),h('div',{class:'big'},h('span',{class:'balv'},balTxt()),eye),
    h('div',{class:'hf'},h('div',{class:'acct'},ic('shield',16),'Fund securely with Paystack: card, bank transfer or USSD'),
      h('div',{class:'bt'},h('a',{class:'btn lt',href:'#/deposit'},ic('plus',16),'Fund Wallet'),h('a',{class:'btn dk',href:'#/wallet'},'Wallet Hub',ic('arrow',14)))));
}
const tile=(t,i,hot,href,n)=>h('a',{class:'tile',href},h('div',{class:'tc c'+(n%5)},ic(i,24),hot?h('i',{class:'hot'},'HOT'):null),h('span',{},t));
function dashboard(m){
  const box=h('div',{class:'tiles'});
  const tabs=['All Services','Identity','NIN Agency','Business & ID',...(ME.admin?['Admin']:[])];
  const ADM=[['a/overview','Admin Overview','chart'],['a/prices','Set Prices','tag'],['a/transfers','Bank Transfers','bank'],['a/payments','Paystack Payments','card'],['a/requests','Agency Requests','file'],['a/results','Saved Results','file'],['a/users','Users','users'],['a/settings','Support Settings','gear']];
  const draw=()=>{box.replaceChildren();let n=0;const t=tileQ.toLowerCase();
    if(tabSel!=='Admin')PAGES.filter(p=>(tabSel==='All Services'||p.tab===tabSel)&&p.t.toLowerCase().includes(t)).forEach(p=>box.append(tile(p.t,p.i,p.hot,'#/'+p.id,n++)));
    if(tabSel==='All Services'&&'history fund wallet'.includes(t)){box.append(tile('Fund Wallet','plus',1,'#/deposit',n++),tile('History','clock',0,'#/transactions',n++))}
    if(ME.admin&&(tabSel==='Admin'||tabSel==='All Services'))ADM.filter(a=>a[1].toLowerCase().includes(t)).forEach(a=>box.append(tile(a[1],a[2],0,'#/'+a[0],n++)));
    if(!box.children.length)box.append(h('p',{class:'mut'},'No service matches your search.'))};
  const tb=h('div',{class:'tabs'});
  const paintTabs=()=>{tb.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.textContent===tabSel))};
  tabs.forEach(t=>tb.append(h('button',{class:'tab',on:{click:()=>{tabSel=t;paintTabs();draw()}}},t)));
  const s=h('input',{placeholder:'Search service…',value:tileQ});s.addEventListener('input',()=>{tileQ=s.value;draw()});
  tb.append(h('div',{class:'ig'},ic('search',16),s));
  m.append(hero(),h('div',{class:'cd pad'},tb,box));paintTabs();draw();
}
function more(m){
  m.append(crumb(['Dashboard'],['More Verifications']),titleRow('idcard','More Verifications','Instant API'));
  const c=h('div',{class:'cd pad'});let n=0;
  [...new Set(PAGES.filter(p=>p.tab==='Business & ID').map(p=>p.grp))].forEach(g=>{c.append(h('h3',{style:'margin:18px 0 14px;font-size:14px;color:var(--mut)'},g));
    const t=h('div',{class:'tiles'});PAGES.filter(p=>p.grp===g).forEach(p=>t.append(tile(p.t,p.i,0,'#/'+p.id,n++)));c.append(t)});
  m.append(c);
}

/* ===== service page ===== */
function fmtVal(v,lab){ // nested records are shown as tidy labelled lines, never as JSON
  if(v===null||v===undefined)return '';
  if(Array.isArray(v)){const items=v.filter(i=>i!==''&&i!=null);if(items.every(i=>typeof i!=='object'))return items.join(', ');return h('div',{class:'sub2'},items.map(i=>h('div',{class:'sub1'},fmtVal(i,lab))))}
  if(typeof v==='object'){const e=Object.entries(v).filter(([,z])=>z!=null&&z!==false);return h('div',{},e.map(([k,z])=>h('div',{},h('span',{class:'mut'},lab(k)+': '),z===''||(Array.isArray(z)&&!z.length)?'None':typeof z==='object'?fmtVal(z,lab):String(z))))}
  return String(v);
}
function resultCard(x,pageId){
  const d=x.data||{},LBL={nin:'NIN',rc_number:'RC number',tin:'TIN',bvn:'BVN',vin:'VIN',lga:'LGA',birthdate:'Date of birth',dob:'Date of birth',telephoneno:'Phone number',birthlga:'Birth LGA',birthstate:'Birth state',birthcountry:'Birth country',residence_state:'State of residence',residence_lga:'LGA of residence',residence_town:'Town',residence_adressline1:'Address',trackingid:'Tracking ID',newnin:'New NIN',newtrackingid:'New tracking ID'};
  const lab=k=>LBL[k.toLowerCase()]||k.replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
  const NAME=['firstname','first_name','middlename','middle_name','surname','last_name','lastname'],nm=['firstname','first_name','middlename','middle_name','surname','last_name','lastname'].map(k=>d[k]).filter(Boolean).join(' ');
  const showHead=!!(nm||x.photo),dl=h('dl',{class:'kv'});
  Object.entries(d).forEach(([k,v])=>{if(showHead&&(NAME.includes(k)||k==='nin'))return;const empty=v===''||v==null||(Array.isArray(v)&&!v.length);dl.append(h('dt',{},lab(k)),h('dd',{class:empty?'mut':''},empty?'None':fmtVal(v,lab)))});
  const head=showHead?h('div',{class:'person'},x.photo?h('img',{src:'data:image/jpeg;base64,'+x.photo,alt:'Photo'}):null,h('div',{},h('h3',{},nm||'Record found'),d.nin?h('div',{class:'nin'},'NIN ',h('b',{},d.nin)):null)):null;
  return h('div',{class:'cb'},h('span',{class:'badge'},ic('check',13),'Record found'),h('div',{style:'height:14px'}),head,dl,x.notice?h('p',{style:'color:var(--y);margin:0 0 14px'},x.notice):null,x.pdf?pdfBtn(x.pdf,pageId+'_slip.pdf'):null);
}
function pageResult(box,x,pageId){
  box.replaceChildren();
  if(x.submitted){box.append(emptyBox('circle','Request submitted',x.msg),h('div',{style:'text-align:center;padding-bottom:26px'},h('a',{class:'btn',href:'#/requests'},'Track request')));return}
  box.append(resultCard(x,pageId));
}
function pdfBtn(pdf,name){return h('button',{class:'btn',on:{click:()=>{const bin=atob(pdf),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const a=h('a',{href:URL.createObjectURL(new Blob([u],{type:'application/pdf'})),download:name});a.click()}}},ic('down',16),'Download slip (PDF)')}
function pageView(m,p){
  let cur=SV[p.keys[0]];const async_=cur.kind==='async';
  m.append(crumb(['Dashboard'],[p.crumb,'#/'+(p.crumb==='More Verifications'?'more':'dashboard')],[p.t]),titleRow(p.i,p.t,async_?'Agency request':'Instant API'));
  const fields=h('div'),feeV=h('b',{},N(cur.price)),msg=h('div',{class:'msg'}),inputs={};
  const build=()=>{fields.replaceChildren();Object.keys(inputs).forEach(k=>delete inputs[k]);
    Object.entries(cur.fields).forEach(([k,l])=>{const ch=cur.choices&&cur.choices[k],opt=(cur.optional||[]).includes(k);const big=ch&&ch.length>40&&ch.every(c=>Array.isArray(c));const dlId='dl_'+cur.key+'_'+k;const i=big?(()=>{const m={};ch.forEach(c=>{m[c[0]]=c[0];m[c[1]+' ('+c[0]+')']=c[0];if(!(c[1] in m))m[c[1]]=c[0]});const x=h('input',{list:dlId,placeholder:'Type the bank name or code…',autocomplete:'off'});x.map=m;document.getElementById(dlId)?.remove();document.body.append(h('datalist',{id:dlId},ch.map(c=>h('option',{value:c[1]+' ('+c[0]+')'}))));return x})():ch?h('select',{},[h('option',{value:''},opt?'Not sure / any':'Choose…'),...ch.map(c=>h('option',{value:Array.isArray(c)?c[0]:c},Array.isArray(c)?c[1]:c))]):h('input',{placeholder:l,autocomplete:'off',inputmode:(/^(nin|bvn|bankAccount|bankCode|bank_code|meter_number|tcc_number|tax_number)$/.test(k)||(k==='number'&&['bank_account','bank_account_match','tin_by_nin','tin_by_phone','tin_by_cac'].includes(cur.key)))?'numeric':null,maxlength:(k==='nin'||k==='bvn')?11:null});inputs[k]=i;
      fields.append(h('label',{class:'lbl'},l,' ',opt?null:h('i',{},'*')),h('div',{class:'ig'},ic(k==='nin'?'finger':k==='bvn'?'shieldck':'file',17),i))});feeV.textContent=N(cur.price)};
  const tier=p.keys.length>1?h('select',{on:{change:e=>{cur=SV[e.target.value];build()}}},p.keys.map(k=>h('option',{value:k},SV[k].label.replace(/^.*?- /,'')+' — '+N(SV[k].price)))):null;
  build();
  const res=h('div',{class:'cd'}),resBody=h('div');const emptyR=()=>resBody.replaceChildren(emptyBox('idcard','Results will appear here','Fill in the details on the left and click "'+(async_?'Submit Request':'Verify Now')+'" to begin.'));emptyR();
  res.append(h('div',{class:'ch r'},ic('user',18),async_?'Request Status':'Verification Result'),resBody);
  const go=h('button',{class:'btn w'},ic('search',17),async_?'Submit Request':'Verify Now');
  go.onclick=async()=>{go.disabled=true;msg.className='msg';msg.textContent='';
    const f={};Object.keys(inputs).forEach(k=>{const v=inputs[k].value.trim(),m=inputs[k].map;f[k]=m&&v in m?m[v]:v});
    const x=await api('run',{service:cur.key,f});go.disabled=false;
    if(x.bal!=null){setBal(x.bal)}
    if(!x.ok){msg.textContent=x.msg||'Something went wrong.';return}
    pageResult(resBody,x,p.id);if(x.submitted)CF.pending=(CF.pending||0)+1};
  const fc=h('div',{class:'cd'},h('div',{class:'ch'},ic('shield',18),p.t,h('span',{class:'pl2'},async_?'Agency Service':'Instant Verification')),
    h('div',{class:'cb'},h('p',{class:'d'},p.d),tier?[h('label',{class:'lbl'},'Slip type'),h('div',{class:'ig'},ic('tag',17),tier)]:null,fields,
      h('div',{class:'fee'},ic('tag',18),h('span',{style:'font-weight:600'},ME.admin?'Provider price (no markup):':'Service Fee:'),feeV),
      h('div',{class:'sub'},h('span',{},'Prepaid wallet deduction'),h('span',{},'Wallet Balance: ',h('b',{class:'balv'},balTxt()))),msg,go));
  m.append(h('div',{class:'two'},fc,res));
}

/* ===== wallet / deposit / transactions / requests / profile ===== */
function wallet(m){
  const eye=h('button',{class:'btn out',on:{click:()=>{hideBal=!hideBal;paintBal();eye.lastChild.textContent=hideBal?'Show Balances':'Hide Balances'}}},ic('eye',16),h('span',{},hideBal?'Show Balances':'Hide Balances'));
  m.append(crumb(['Dashboard'],['Wallet & Finance']),h('div',{class:'trow'},h('h1',{style:'font-size:24px'},'My Digital Wallet'),h('span',{class:'badge'},ic('check',13),'ACTIVE'),h('div',{class:'sp'},eye,h('a',{class:'btn',href:'#/deposit'},ic('plus',16),'Fund Wallet'))));
  m.append(h('p',{class:'mut',style:'margin:-14px 0 22px'},'Manage your funds, spending and wallet history.'));
  const card=h('div',{class:'wc'},h('div',{style:'display:flex;align-items:center;gap:12px'},h('div',{class:'chipc'}),h('span',{class:'badge y'},CF.paystack?'PAYSTACK READY':'PAYMENTS OFF')),
    h('div',{class:'hl'},'TOTAL AVAILABLE FUNDS'),h('div',{class:'big'},h('span',{class:'balv'},balTxt())),
    h('div',{class:'hl'},'FUNDING METHOD'),h('div',{style:'margin-top:6px;font-weight:600'},'Paystack · Card, bank transfer, USSD'),
    h('div',{class:'hl'},'ACCOUNT HOLDER'),h('div',{style:'margin-top:6px'},ME.name||ME.email));
  const st=(l,v,s)=>h('div',{class:'cd stat'},h('small',{},l),h('b',{},v),h('span',{class:'mut',style:'font-size:12px'},s));
  const info=h('div',{class:'cd pad',style:'margin-top:16px'},h('h3',{style:'margin-bottom:6px'},'Wallet Status & Limits'),
    [['Status',h('span',{class:'badge'},'Active')],['Minimum deposit',N(100)],['Maximum single deposit',N(500000)],['Pending requests',String(CF.pending||0)]].map(([a,b])=>h('div',{class:'rowk'},h('span',{class:'mut'},a),h('b',{},b))));
  m.append(h('div',{class:'wg'},h('div',{},card,info),h('div',{},h('div',{class:'s3'},st('MAIN BALANCE',balTxt(),'Available to spend'),st('TOTAL FUNDED',N(CF.funded),'All deposits'),st('TOTAL SPENT',N(CF.spent),'Verifications and services')),
    h('div',{class:'cd pad',style:'margin-top:16px'},h('h3',{style:'margin-bottom:10px'},'How funding works'),h('ul',{class:'ck'},['Pay securely with Paystack (card, bank transfer or USSD).','Your wallet is credited automatically once payment is confirmed.','Failed or empty checks are refunded to this wallet.','Verification results are never stored on our servers.'].map(t=>h('li',{},ic('check',15),t)))))));
}
function deposit(m){
  const live=!!CF.paystackLive;let mode='bank';
  m.append(crumb(['Dashboard'],['Wallet','#/wallet'],['Deposit & Funding']),h('div',{class:'trow'},h('div',{},h('h1',{style:'font-size:24px'},'Fund Your Wallet'),h('p',{class:'mut'},live?'Pay by bank transfer or with Paystack.':'Fund your wallet by bank transfer. Paystack is temporarily unavailable.')),h('div',{class:'sp'},h('a',{class:'btn out',href:'#/wallet'},'← Back to Wallet'))));
  const amt=h('input',{type:'number',min:100,max:500000,step:1,inputmode:'numeric',placeholder:'Enter amount in naira'}),msg=h('div',{class:'msg',role:'alert'});
  const go=h('button',{class:'btn w'},ic('bank',17),'Continue to bank transfer');
  const quote=h('div',{class:'sub',style:'margin-top:0'});
  const upd=()=>{const a=Math.floor(Number(amt.value));quote.replaceChildren();if(mode==='paystack'&&a>=100&&a<=500000){const g=grossFor(a);quote.append(h('span',{},'Paystack fee: '+N(g-a)),h('span',{},'You pay: ',h('b',{},N(g))))}};amt.addEventListener('input',upd);
  const bankTile=h('button',{class:'mt on',type:'button'},ic('bank',22),h('div',{},h('b',{},'Bank transfer'),h('span',{},'Send from any bank app · confirmed by us')));
  const psTile=h('button',{class:'mt'+(live?'':' off'),type:'button'},ic('card',22),h('div',{},h('b',{},'Paystack'),h('span',{},live?'Card · Bank transfer · USSD':'Temporarily unavailable')),live?null:h('span',{class:'badge y',style:'margin-left:auto'},'Unavailable'));
  const pick=k=>{if(k==='paystack'&&!live){msg.textContent='Paystack is temporarily unavailable. Please fund your wallet by bank transfer.';return}mode=k;msg.textContent='';bankTile.classList.toggle('on',k==='bank');psTile.classList.toggle('on',k==='paystack');go.replaceChildren(ic(k==='bank'?'bank':'card',17),k==='bank'?'Continue to bank transfer':'Pay with Paystack');upd()};
  bankTile.onclick=()=>pick('bank');psTile.onclick=()=>pick('paystack');
  go.onclick=async()=>{go.disabled=true;msg.textContent='';
    if(mode==='bank'){const x=await api('transfer/create',{amount:Number(amt.value)});go.disabled=false;if(x.ok)location.hash='#/transfer/'+x.transfer.ref;else msg.textContent=x.msg;return}
    const x=await api('pay/init',{amount:Number(amt.value)});go.disabled=false;if(x.ok)location.href=x.url;else msg.textContent=x.msg};
  const left=h('div',{class:'cd pad'},h('div',{class:'mts'},bankTile,psTile),
    CF.bankReady?null:h('p',{class:'msg'},'Bank transfer is not set up yet. Please contact support.'),
    h('label',{class:'lbl',style:'margin-top:18px'},'Amount'),h('div',{class:'ig'},ic('wallet',17),amt),h('div',{class:'qa'},[1000,2000,5000,10000,20000].map(n=>h('button',{class:'tab',on:{click:()=>{amt.value=n;upd()}}},N(n)))),quote,msg,go);
  const right=h('div',{},h('div',{class:'cd pad'},h('h3',{style:'margin-bottom:6px'},'Limits & Thresholds'),[['Minimum deposit',N(100)],['Maximum single deposit',N(500000)],['Bank transfer fee','None']].map(([a,b])=>h('div',{class:'rowk'},h('span',{class:'mut'},a),h('b',{},b)))),
    h('div',{class:'cd pad',style:'margin-top:16px'},h('h3',{style:'margin-bottom:8px'},'How bank transfer works'),h('ol',{class:'how'},['Enter the amount and continue.','Send exactly that amount to our account, using your reference.','Press “I have made the transfer” and upload your receipt.','We confirm it and your wallet is credited.'].map(t=>h('li',{},t)))));
  m.append(h('div',{class:'g21'},left,right));transferList(m);payList(m);
}
async function transferList(m){
  const r=await api('transfer/list');if(!r.ok||!r.rows.length)return;
  const c=h('div',{class:'cd pad ov',style:'margin-top:22px'},h('h3',{style:'margin:0 0 10px'},'Your bank transfers'));
  const t=h('table',{class:'tbl'},h('tr',{},['Date','Reference','Amount','Status',''].map(x=>h('th',{},x))));
  r.rows.forEach(p=>{const s=TSTAT[p.status]||[p.status,''];t.append(h('tr',{},h('td',{class:'mut'},fmt(p.at)),h('td',{class:'mono'},p.ref),h('td',{style:'font-weight:700'},N(p.status==='approved'&&p.credited?p.credited:p.amt)),h('td',{},h('span',{class:'badge '+s[1]},s[0])),h('td',{},['awaiting_transfer','awaiting_proof','rejected','proof_uploaded'].includes(p.status)?h('a',{class:'btn out sm',href:'#/transfer/'+p.ref},p.status==='proof_uploaded'?'View':'Continue'):'')))});
  c.append(t);m.append(c);
}
/* ===== bank transfer page: reference, bank details, receipt upload, live status ===== */
const TSTAT={awaiting_transfer:['Awaiting your transfer','y'],awaiting_proof:['Upload your receipt','y'],proof_uploaded:['Under review','y'],approved:['Credited',''],rejected:['Receipt rejected','r'],cancelled:['Cancelled','r']};
function copyBtn(txt,label){label=label||'Copy';const b=h('button',{class:'btn out sm',type:'button'},ic('copy',14),label);b.onclick=async()=>{try{await navigator.clipboard.writeText(txt);b.lastChild.textContent='Copied';setTimeout(()=>{b.lastChild.textContent=label},1600)}catch{toast('Could not copy. Please select it and copy by hand.')}};return b}
async function transferPage(m,ref){
  m.append(crumb(['Dashboard'],['Wallet','#/wallet'],['Deposit','#/deposit'],['Bank transfer']));
  const root=h('div');m.append(root);
  const stepOf=s=>({awaiting_transfer:1,awaiting_proof:2,rejected:2,proof_uploaded:3,approved:4}[s]||1);
  const draw=t=>{
    const cur=stepOf(t.status),steps=h('ol',{class:'tsteps','aria-label':'Progress'},['Transfer','Receipt','Review','Credited'].map((x,i)=>h('li',{class:i+1<cur||t.status==='approved'?'done':i+1===cur?'now':''},h('span',{},i+1<cur||t.status==='approved'?ic('check',13):String(i+1)),x)));
    const amount=h('div',{class:'cd pad amtcard'},h('small',{class:'mut'},'AMOUNT TO SEND'),h('div',{class:'amtbig'},N(t.amount)),
      h('div',{class:'refrow'},h('span',{class:'mut'},'Your reference'),h('code',{class:'mono'},t.ref),copyBtn(t.ref)),h('p',{class:'mut',style:'font-size:12.5px;margin-top:8px'},'Put this reference in the transfer description (narration) so we can find your payment quickly.'));
    const banks=h('div',{class:'bankgrid'},(t.banks||[]).map(b=>h('div',{class:'cd pad bankcard'},h('span',{class:'badge'},ic('bank',13),b.bank),h('small',{class:'mut',style:'display:block;margin-top:12px'},'Account number'),h('div',{class:'acctrow'},h('code',{class:'mono acctnum'},b.number),copyBtn(b.number)),h('small',{class:'mut',style:'display:block;margin-top:8px'},'Account name'),h('b',{},b.name))));
    const act=h('div',{class:'cd pad',style:'margin-top:16px'});
    const err=h('div',{class:'msg',role:'alert'});
    if(t.status==='awaiting_transfer'){
      const b=h('button',{class:'btn w'},ic('check',17),'I have made the transfer');b.onclick=async()=>{b.disabled=true;const x=await api('transfer/made',{ref});b.disabled=false;if(x.ok)draw(x.transfer);else err.textContent=x.msg};
      const c=h('button',{class:'btn out sm',style:'margin-top:12px'},'Cancel this order');c.onclick=async()=>{if(!confirm('Cancel this transfer order? If you already sent money, do not cancel.'))return;const x=await api('transfer/cancel',{ref});if(x.ok)location.hash='#/deposit';else err.textContent=x.msg};
      act.append(h('h3',{style:'margin-bottom:6px'},'Step 1: Send the money'),h('p',{class:'mut',style:'margin-bottom:14px'},'Send exactly ',h('b',{},N(t.amount)),' to one of the accounts above. Press the button only after you have sent it.'),b,err,c);
    }else if(t.status==='awaiting_proof'||t.status==='rejected'){
      const file=h('input',{type:'file',accept:'image/jpeg,image/png,image/webp,application/pdf',class:'hide'}),prev=h('div',{class:'prev'}),send=h('button',{class:'btn w',disabled:true},ic('arrow',17),'Send receipt');
      const zone=h('div',{class:'drop',tabindex:'0',role:'button','aria-label':'Choose receipt'},ic('receipt',30),h('b',{},'Drop your receipt here, or tap to choose'),h('span',{class:'mut'},'JPG, PNG, WebP or PDF, up to 2.5 MB'),prev);
      let chosen=null;const show=f=>{err.textContent='';if(!f)return;if(f.size>2.5*1024*1024){err.textContent='That file is larger than 2.5 MB. Please choose a smaller photo or PDF.';return}if(!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type)){err.textContent='Please choose a JPG, PNG, WebP or PDF file.';return}
        chosen=f;send.disabled=false;prev.replaceChildren(f.type.startsWith('image/')?h('img',{src:URL.createObjectURL(f),alt:'Receipt preview'}):h('span',{class:'badge'},ic('file',13),f.name))};
      zone.onclick=()=>file.click();zone.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();file.click()}};file.onchange=()=>show(file.files[0]);
      zone.ondragover=e=>{e.preventDefault();zone.classList.add('over')};zone.ondragleave=()=>zone.classList.remove('over');zone.ondrop=e=>{e.preventDefault();zone.classList.remove('over');show(e.dataTransfer.files[0])};
      send.onclick=()=>{if(!chosen)return;send.disabled=true;send.lastChild.textContent='Sending…';const rd=new FileReader();rd.onload=async()=>{const x=await api('transfer/proof',{ref,dataUrl:rd.result,name:chosen.name});if(x.ok)load();else{err.textContent=x.msg;send.disabled=false;send.lastChild.textContent='Send receipt'}};rd.onerror=()=>{err.textContent='Could not read that file.';send.disabled=false};rd.readAsDataURL(chosen)};
      const c=h('button',{class:'btn out sm',style:'margin-top:12px'},'Cancel this order');c.onclick=async()=>{if(!confirm('Cancel this transfer order? If you already sent money, do not cancel.'))return;const x=await api('transfer/cancel',{ref});if(x.ok)location.hash='#/deposit';else err.textContent=x.msg};
      act.append(t.status==='rejected'?h('div',{class:'rej'},h('b',{},'Why it was not accepted'),h('p',{},t.reason||'Please upload a clearer receipt.')):document.createComment(''),h('h3',{style:'margin-bottom:6px'},t.status==='rejected'?'Upload your receipt again':'Step 2: Upload your receipt'),h('p',{class:'mut',style:'margin-bottom:14px'},'A clear photo or PDF of the transfer receipt from your bank app.'),zone,file,send,err,c);
    }else if(t.status==='proof_uploaded'){
      act.append(h('div',{class:'wait'},h('span',{class:'pulse'}),h('div',{},h('b',{},'Receipt received'),h('p',{class:'mut'},(t.proofName||'Your receipt')+' is waiting for confirmation. This page updates by itself when we confirm it.'))));
    }else if(t.status==='approved'){
      act.append(h('div',{class:'okbox'},ic('check',26),h('div',{},h('b',{},N(t.credited||t.amount)+' has been added to your wallet.'),h('p',{class:'mut'},'Thank you. You can start using your balance now.'))),h('a',{class:'btn',style:'margin-top:14px',href:'#/wallet'},'Go to wallet'));
    }else act.append(h('p',{class:'mut'},'This transfer order was cancelled.'),h('a',{class:'btn',style:'margin-top:12px',href:'#/deposit'},'Start a new one'));
    const side=h('div',{},h('div',{class:'cd pad'},h('h3',{style:'margin-bottom:8px'},'How it works'),h('ol',{class:'how'},['Send the exact amount to one account.','Press “I have made the transfer”.','Upload a clear photo or PDF of your receipt.','We confirm it and credit your wallet.'].map(x=>h('li',{},x)))),
      h('div',{class:'cd pad',style:'margin-top:16px'},h('h3',{style:'margin-bottom:6px'},'Need help?'),h('p',{class:'mut',style:'margin-bottom:10px'},'Send your reference and receipt to support if you have a question.'),CF.whatsapp?h('a',{class:'btn out sm',href:'https://wa.me/'+String(CF.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent('Hello, my transfer reference is '+t.ref),target:'_blank',rel:'noopener'},'Chat on WhatsApp'):null));
    root.replaceChildren(h('div',{class:'trow'},h('div',{},h('h1',{style:'font-size:24px'},'Complete your payment'),h('p',{class:'mut'},'Reference ',h('b',{class:'mono'},t.ref))),h('div',{class:'sp'},h('span',{class:'badge '+(TSTAT[t.status]||['',''])[1]},(TSTAT[t.status]||[t.status])[0]))),steps,h('div',{class:'g21'},h('div',{},amount,banks,act),side));
  };
  let timer=null;
  async function load(){clearTimeout(timer);const r=await api('transfer/get',{ref});if(!document.body.contains(root))return;
    if(!r.ok){root.replaceChildren(emptyBox('receipt','Transfer not found',r.msg||''));return}
    draw(r.transfer);
    if(r.transfer.status==='approved'){const me=await api('me');if(me.ok)setBal(me.user.bal)}
    if(r.transfer.status==='proof_uploaded'||(r.transfer.status==='awaiting_proof'&&false))timer=setTimeout(load,15000)}
  load();
}
async function transactions(m){
  m.append(crumb(['Dashboard'],['Transactions']),titleRow('swap','Transactions'));const c=h('div',{class:'cd pad ov'});m.append(c);
  const r=await api('history');if(!r.rows||!r.rows.length)return c.append(emptyBox('swap','No activity yet','Fund your wallet and run a verification to get started.'));
  const t=h('table',{class:'tbl'},h('tr',{},['Service','Amount','Status','Date'].map(x=>h('th',{},x))));
  r.rows.forEach(x=>t.append(h('tr',{},h('td',{},x.svc),h('td',{style:'font-weight:700;color:'+(x.amt>0?'var(--ok)':x.amt<0?'var(--er)':'var(--mut)')},x.amt?(x.amt>0?'+':'-')+N(Math.abs(x.amt)):'—'),h('td',{},h('span',{class:'badge '+(/refund/.test(x.status)?'r':/credit|success/.test(x.status)?'':'y')},x.status)),h('td',{class:'mut'},fmt(x.at)))));
  c.append(t);
}
async function requests(m){
  m.append(crumb(['Dashboard'],['NIN Services','#/dashboard'],['My Requests']),titleRow('file','My Requests','IPE · Validation · Personalisation'));
  const c=h('div',{class:'cd pad ov'}),out=h('div',{class:'cd',style:'margin-top:20px'});out.classList.add('hide');m.append(c,out);
  const r=await api('reqs');if(!r.rows||!r.rows.length)return c.append(emptyBox('file','No requests yet','IPE clearance, NIN validation and personalisation requests appear here after you submit them.'));
  const t=h('table',{class:'tbl'},h('tr',{},['Service','Status','Date',''].map(x=>h('th',{},x))));
  r.rows.forEach(x=>{const st=h('span',{class:'badge '+(x.status==='completed'?'':x.status==='failed'?'r':'y')},x.status),b=h('button',{class:'btn out sm'},'Check status');
    b.onclick=async()=>{b.disabled=true;const y=await api('req/check',{id:x.id});b.disabled=false;if(y.bal!=null)setBal(y.bal);out.classList.remove('hide');out.replaceChildren(h('div',{class:'ch r'},x.label));
      if(!y.ok)out.append(h('div',{class:'cb'},y.msg));else if(y.status==='completed'){st.textContent='completed';st.className='badge';const b2=h('div');pageResult(b2,y,'result');out.append(b2)}else{if(y.status==='failed'){st.textContent='failed';st.className='badge r'}out.append(h('div',{class:'cb'},y.msg))}};
    t.append(h('tr',{},h('td',{},x.label),h('td',{},st),h('td',{class:'mut'},fmt(x.at)),h('td',{},b)))});
  c.append(t);
}
function profile(m){
  m.append(crumb(['Dashboard'],['Profile Settings']),titleRow('user','Profile Settings'));
  const name=h('input',{value:ME.name||'',autocomplete:'name'}),cur=h('input',{type:'password',autocomplete:'current-password',placeholder:'Only needed to change your password'}),pass=h('input',{type:'password',placeholder:'At least 8 characters',autocomplete:'new-password'}),msg=h('div',{class:'msg',role:'alert'}),b=h('button',{class:'btn'},'Save changes');
  b.onclick=async()=>{const x=await api('profile',{name:name.value,current:cur.value,pass:pass.value});msg.className='msg'+(x.ok?' good':'');msg.textContent=x.msg;if(x.ok){ME.name=name.value;cur.value='';pass.value=''}};
  m.append(h('div',{class:'cd pad',style:'max-width:520px'},h('label',{class:'lbl',style:'margin-top:0'},'Full name'),h('div',{class:'ig'},ic('user'),name),h('label',{class:'lbl'},'Email'),h('div',{class:'ig'},ic('mail'),h('input',{value:ME.email,readonly:''})),h('label',{class:'lbl'},'Current password'),h('div',{class:'ig'},ic('lock'),cur),h('label',{class:'lbl'},'New password'),h('div',{class:'ig'},ic('lock'),pass),msg,b));
}
/* ===== admin ===== */
async function aOverview(m){
  m.append(crumb(['Dashboard'],['Admin Overview']),titleRow('chart','Admin Overview','Admin'));
  const r=await api('admin/stats');if(!r.ok)return m.append(h('p',{},r.msg));
  const st=(l,v,s)=>h('div',{class:'cd stat'},h('small',{},l),h('b',{},v),s?h('span',{class:'mut',style:'font-size:12px'},s):null);
  m.append(h('div',{class:'sg'},st('REGISTERED USERS',r.users),st('WALLET BALANCES HELD',N(r.held),'All users'),st('TOTAL FUNDED',N(r.funded),'Bank transfer + Paystack'),st('CUSTOMER SPENDING',N(r.revenue),'Net of refunds'),st('PENDING REQUESTS',r.pending),st('PAID ACTIONS TODAY',r.today)));
  const warn=[];if(!r.bankReady&&!r.paystack)warn.push('No payment method is set up. Open Bank Transfers and add your bank details so customers can fund wallets.');if(r.transfersPending)warn.push(r.transfersPending+' bank transfer(s) are waiting for your approval. Open Bank Transfers.');if(r.missing)warn.push(r.missing+' services have no provider price yet. Open Set Prices.');
  if(r.payPending)warn.push(r.payPending+' payment(s) are waiting for Paystack confirmation. Open Payments and press Re-check.');
  if(r.payReview)warn.push(r.payReview+' payment(s) need review (amount did not match). Check Paystack and refund if needed.');
  if(r.reqReview)warn.push(r.reqReview+' agency request(s) need review: the provider accepted them but gave no request id. Open Agency Requests.');
  if(r.reqStuck)warn.push(r.reqStuck+' agency request(s) have been pending for over 3 days. Open Agency Requests.');
  if(r.ledger!==r.held)warn.push('Wallet records do not add up (records '+N(r.ledger)+' vs balances '+N(r.held)+'). Do not edit the database by hand; contact your developer.');
  if(warn.length)m.append(h('div',{class:'cd pad',style:'margin-bottom:20px'},h('b',{},'Needs attention'),h('ul',{class:'ck',style:'margin-top:8px'},warn.map(w=>h('li',{style:'color:var(--y)'},ic('shield',15),w)))));
  const pc=h('button',{class:'btn out'},ic('globe',16),'Check provider connection');
  pc.onclick=async()=>{pc.disabled=true;const x=await api('admin/provider-check');pc.disabled=false;
    if(!x.reachable)return modal('Provider connection',h('p',{style:'color:var(--er)'},'No reply from verifyplatform.'),h('p',{class:'mut',style:'margin-top:8px'},'Check VP_API_KEY in your .env file and your internet connection, then restart the server.'));
    modal('Provider connection',h('p',{style:'color:var(--ok)'},'verifyplatform replied.'),h('p',{class:'mut',style:'margin-top:8px'},'Status: '+(x.status||'-')+' · Code: '+(x.code||'-')+(x.message?' · '+x.message:'')),x.balance!=null?h('p',{style:'margin-top:8px'},'Provider wallet balance: ',h('b',{},N(x.balance))):h('p',{class:'mut',style:'margin-top:8px'},'Balance was not included in the reply. Check it in your verifyplatform dashboard.'))};
  m.append(h('div',{style:'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px'},h('a',{class:'btn',href:'#/a/prices'},ic('tag',16),'Set prices'),h('a',{class:'btn out',href:'#/a/payments'},'Payments'),h('a',{class:'btn out',href:'#/a/requests'},'Agency requests'),h('a',{class:'btn out',href:'#/a/users'},'Users'),pc));
  const c=h('div',{class:'cd pad ov'},h('h3',{style:'margin:0 0 10px'},'Recent admin activity & alerts'));
  if(!r.logs.length)c.append(h('p',{class:'mut'},'Nothing yet.'));else{const t=h('table',{class:'tbl'},h('tr',{},['When','Who','Action','Detail'].map(x=>h('th',{},x))));r.logs.forEach(l=>t.append(h('tr',{},h('td',{class:'mut'},fmt(l.at)),h('td',{},l.admin),h('td',{},h('span',{class:'badge y'},l.action)),h('td',{class:'mut'},l.detail))));c.append(t)}
  m.append(c);
}
async function aResults(m){
  m.append(crumb(['Dashboard'],['Saved Results']),titleRow('file','Saved Results','Admin'));
  m.append(h('p',{class:'mut',style:'margin:-8px 0 18px;max-width:780px'},'Every slip the provider returned is kept here for 30 days, even if the customer never saw it or the check was marked failed. Download it and send it to the customer. "needs review" means the provider replied with success but the app did not count it as one.'));
  const box=h('div',{class:'cd pad ov'});m.append(box);
  const load=async()=>{const r=await api('admin/results');box.replaceChildren();if(!r.ok)return box.append(h('p',{},r.msg));if(!r.rows.length)return box.append(h('p',{class:'mut'},'Nothing saved yet.'));
    const t=h('table',{class:'tbl'},h('tr',{},['When','Customer','Service','ID','Result','Slip',''].map(x=>h('th',{},x))));
    r.rows.forEach(x=>{const dl=h('button',{class:'btn sm',on:{click:async()=>{const d=await api('admin/result',{id:x.id});if(!d.ok)return toast(d.msg);
        const bin=atob(d.pdf),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const l=h('a',{href:URL.createObjectURL(new Blob([u],{type:'application/pdf'})),download:x.label.replace(/\W+/g,'_')+'_'+x.id+'.pdf'});l.click()}}},ic('down',14),'Download');
      const raw=h('button',{class:'btn out sm',on:{click:async()=>{const d=await api('admin/result',{id:x.id});if(!d.ok)return toast(d.msg);
        const tech=h('button',{class:'btn out sm',style:'margin-top:14px',on:{click:async()=>{try{await navigator.clipboard.writeText(d.raw);toast('Reply copied. Paste it to provider support.')}catch{toast('Could not copy.')}}}},'Copy reply for provider support');
        modal(x.label+' · '+x.email,resultCard({data:d.info||{},photo:d.photo,pdf:d.pdf},'slip'),tech)}}},'View');
      const del=h('button',{class:'btn out sm',on:{click:async()=>{if(!confirm('Delete this saved result?'))return;await api('admin/result/delete',{id:x.id});load()}}},'Delete');
      t.append(h('tr',{},h('td',{class:'mut'},fmt(x.at)),h('td',{},x.email),h('td',{},x.label),h('td',{class:'mut'},x.hint),h('td',{},h('span',{class:'badge '+(x.outcome==='success'||x.outcome==='completed'?'':'y')},x.outcome)),h('td',{},x.has_pdf?dl:h('span',{class:'mut'},'no PDF found')),h('td',{style:'white-space:nowrap'},raw,' ',del)))});
    box.append(t)};
  load();
}
function aPrices(m){
  m.append(crumb(['Dashboard'],['Admin'],['Set Prices']),titleRow('tag','Set Prices','Admin'));
  m.append(h('p',{class:'mut',style:'margin:-8px 0 18px;max-width:780px'},'Provider price is what the API charges you. Your admin account always pays this exact price, with no markup. Customer price is what other users pay. Switch a service off to hide it.'));
  const missing=Object.values(SV).filter(s=>!s.cost).length;
  const sync=h('button',{class:'btn out',on:{click:async()=>{sync.disabled=true;const x=await api('admin/sync-prices');sync.disabled=false;toast(x.msg);const r=await api('me');if(r.ok){CF=r;ME=r.user;buildPages(r.services);render()}}}},ic('swap',15),'Sync provider prices');
  m.append(h('div',{style:'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px'},sync,missing?h('span',{class:'badge r'},missing+' services have no provider price yet'):h('span',{class:'badge'},'All provider prices set')));
  const c=h('div',{class:'cd pad ov'}),t=h('table',{class:'tbl'},h('tr',{},['Service','Group','Provider price','Customer price','Margin','Active',''].map(x=>h('th',{},x))));
  Object.values(SV).forEach(s=>{const cost=h('input',{type:'number',min:0,value:s.cost||0,'aria-label':'Provider price'}),price=h('input',{type:'number',min:0,value:s.sell,'aria-label':'Customer price'}),mar=h('b',{}),act=h('button',{class:'sw'+(s.active?' on':''),'aria-label':'Active',on:{click:()=>{s.active=!s.active;act.classList.toggle('on',s.active)}}}),sv=h('button',{class:'btn out sm'},'Save');
    const calc=()=>{if(!(+cost.value)){mar.textContent='—';mar.style.color='var(--mut)';return}const d=(+price.value||0)-(+cost.value||0);mar.textContent=(d>=0?'':'-')+N(Math.abs(d));mar.style.color=d>=0?'var(--ok)':'var(--er)'};calc();cost.oninput=price.oninput=calc;
    sv.onclick=async()=>{const x=await api('admin/price',{key:s.key,price:price.value,cost:cost.value,active:s.active});if(x.ok){s.sell=+price.value;s.cost=+cost.value;s.price=s.cost>0?s.cost:s.sell;buildPages(Object.values(SV));toast(s.label+' saved')}else toast(x.msg)};
    t.append(h('tr',{},h('td',{style:'font-weight:600'},s.label),h('td',{class:'mut'},s.group),h('td',{},cost),h('td',{},price),h('td',{},mar),h('td',{},act),h('td',{},sv)))});
  c.append(t);m.append(c);
}
function aUsers(m){
  m.append(crumb(['Dashboard'],['Admin'],['Users']),titleRow('users','Users','Admin'));
  const s=h('input',{placeholder:'Search by name or email',autocomplete:'off'}),list=h('div',{class:'cd pad ov',style:'margin-top:20px'});
  const load=async()=>{const r=await api('admin/users',{q:s.value});list.replaceChildren();
    if(!r.rows||!r.rows.length){list.append(emptyBox('users','No users found','Try a different search.'));return}
    const t=h('table',{class:'tbl'},h('tr',{},['Name','Email','Balance','Status',''].map(x=>h('th',{},x))));
    r.rows.forEach(u=>{const self=u.email===ME.email;
      const st=h('button',{class:'btn out sm',disabled:self?'':null,on:{click:async()=>{const x=await api('admin/user/status',{id:u.id,active:!u.active});toast(x.msg);if(x.ok)load()}}},u.active?'Suspend':'Activate');
      const rs=h('button',{class:'btn out sm',on:{click:async()=>{if(!confirm('Set a temporary password for '+u.email+'?'))return;const x=await api('admin/user/reset',{id:u.id});if(x.ok)modal('Temporary password',h('p',{class:'mut'},'Share this with '+u.email+' privately. They can change it under Profile Settings.'),h('div',{class:'ig',style:'margin-top:12px'},ic('lock'),h('input',{readonly:'',value:x.temp})));else toast(x.msg)}}},'Reset password');
      t.append(h('tr',{},h('td',{},u.name||'—'),h('td',{},u.email),h('td',{style:'font-weight:700'},N(u.bal)),h('td',{},h('span',{class:'badge '+(u.active?'':'r')},u.active?'Active':'Suspended')),h('td',{style:'display:flex;gap:8px'},st,rs)))});
    list.append(t)};
  let tm;s.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(load,300)});
  m.append(h('div',{class:'ig',style:'max-width:420px'},ic('search',16),s),list);load();
}
function twofaCard(m){
  const c=h('div',{class:'cd pad',style:'max-width:620px;margin-top:20px'});m.append(c);
  const head=()=>[h('h3',{style:'margin:0 0 8px'},'Two-step login'),h('span',{class:'badge '+(CF.twofa?'':'y')},CF.twofa?'On':'Off')];
  const draw=()=>{
    const msg=h('div',{class:'msg',role:'alert'});
    if(CF.twofa){
      const pw=h('input',{type:'password',placeholder:'Your password',autocomplete:'current-password'}),cd=h('input',{placeholder:'6-digit code',inputmode:'numeric',maxlength:7,autocomplete:'off'}),b=h('button',{class:'btn out'},'Turn off');
      b.onclick=async()=>{const x=await api('2fa/disable',{pass:pw.value,code:cd.value});if(x.ok){CF.twofa=false;toast(x.msg);draw()}else msg.textContent=x.msg};
      c.replaceChildren(...head(),h('p',{class:'mut',style:'margin:12px 0'},'Signing in as admin needs your password and a 6-digit code from your authenticator app.'),h('div',{class:'ig'},ic('lock'),pw),h('div',{style:'height:10px'}),h('div',{class:'ig'},ic('shield'),cd),msg,b);return;
    }
    const b=h('button',{class:'btn'},'Set up two-step login');
    b.onclick=async()=>{const x=await api('2fa/setup');if(!x.ok){msg.textContent=x.msg;return}
      const cd=h('input',{placeholder:'6-digit code',inputmode:'numeric',maxlength:7,autocomplete:'off'}),m2=h('div',{class:'msg',role:'alert'}),go=h('button',{class:'btn'},'Turn on');
      go.onclick=async()=>{const y=await api('2fa/enable',{code:cd.value});if(y.ok){CF.twofa=true;toast(y.msg);draw()}else m2.textContent=y.msg};
      c.replaceChildren(...head(),h('ol',{class:'mut',style:'padding-left:18px;margin:12px 0'},['Install Google Authenticator, Microsoft Authenticator or Authy on your phone.','Add an account and choose "Enter a setup key" (or tap the link below on your phone).','Type this key (spaces do not matter), then enter the 6-digit code it shows.'].map(t=>h('li',{style:'margin:4px 0'},t))),
        h('div',{class:'ig'},ic('lock'),h('input',{readonly:'',value:x.secret.match(/.{1,4}/g).join(' ')}),h('button',{'aria-label':'Copy key',on:{click:()=>copyTxt(x.secret)}},ic('copy',16))),
        h('p',{class:'mut',style:'margin:10px 0'},'On your phone: ',h('a',{href:x.url,style:'color:var(--y)'},'open in authenticator app')),
        h('label',{class:'lbl'},'Code from the app'),h('div',{class:'ig'},ic('shield'),cd),m2,go)};
    c.replaceChildren(...head(),h('p',{class:'mut',style:'margin:12px 0'},'Adds a 6-digit code from your phone to the admin sign-in. Strongly recommended: it protects wallets and customer data even if your password leaks. Keep a safe note of your setup key in case you lose your phone.'),msg,b);
  };draw();
}
function aSettings(m){
  m.append(crumb(['Dashboard'],['Admin'],['Support Settings']),titleRow('gear','Support Settings','Admin'));
  const wa=h('input',{value:CF.whatsapp||'',placeholder:'2348012345678',inputmode:'numeric'}),msg=h('div',{class:'msg',role:'alert'}),b=h('button',{class:'btn'},'Save settings');
  b.onclick=async()=>{const x=await api('admin/settings',{whatsapp:wa.value});msg.className='msg'+(x.ok?' good':'');msg.textContent=x.msg;if(x.ok)CF.whatsapp=wa.value.replace(/\D/g,'')};
  const hook=location.origin+'/api/paystack/webhook';
  m.append(h('div',{class:'cd pad',style:'max-width:620px'},h('label',{class:'lbl',style:'margin-top:0'},'Support WhatsApp number (country code, no +)'),h('div',{class:'ig'},ic('wa'),wa),msg,b),
    h('div',{class:'cd pad',style:'max-width:620px;margin-top:20px'},h('h3',{style:'margin:0 0 8px'},'Paystack'),h('span',{class:'badge '+(CF.paystack?'':'r')},CF.paystack?'Key is set':'Key is not set'),
      h('p',{class:'mut',style:'margin:12px 0 8px'},'In your Paystack dashboard, set this as the webhook URL:'),h('div',{class:'ig'},ic('globe'),h('input',{readonly:'',value:hook}),h('button',{'aria-label':'Copy',on:{click:()=>copyTxt(hook)}},ic('copy',16)))));
  twofaCard(m);
}
async function aTransfers(m){
  m.append(crumb(['Dashboard'],['Admin'],['Bank Transfers']),titleRow('bank','Bank Transfers','Admin'));
  m.append(h('p',{class:'mut',style:'margin:-8px 0 16px;max-width:780px'},'Customers send money to your account and upload a receipt. Check your bank alert, then approve (the wallet is credited once) or reject with a reason.'));
  const set=h('div',{class:'cd pad',style:'margin-bottom:18px'}),list=h('div',{class:'cd pad ov'});m.append(set,list);
  let filter='review';
  async function drawSettings(){
    const r=await api('admin/bank');if(!r.ok)return;set.replaceChildren(h('h3',{style:'margin-bottom:4px'},'Where customers send money'),h('p',{class:'mut',style:'margin-bottom:14px;font-size:13px'},'These details are shown to customers on the transfer page. Fill at least one account.'));
    const rows=r.accounts.map((a,i)=>({bank:h('input',{placeholder:'Bank (e.g. OPay)',value:a.bank}),name:h('input',{placeholder:'Account name',value:a.name}),number:h('input',{placeholder:'Account number',value:a.number,inputmode:'numeric',maxlength:20})}));
    rows.forEach((x,i)=>set.append(h('div',{class:'bkrow'},h('b',{style:'min-width:70px'},'Account '+(i+1)),x.bank,x.name,x.number)));
    const msg=h('div',{class:'msg',role:'alert'}),sv=h('button',{class:'btn'},'Save bank details');sv.onclick=async()=>{sv.disabled=true;const x=await api('admin/bank/save',{accounts:rows.map(z=>({bank:z.bank.value,name:z.name.value,number:z.number.value}))});sv.disabled=false;msg.className='msg'+(x.ok?' good':'');msg.textContent=x.msg;if(x.ok){const me=await api('me');if(me.ok){CF=me}}};
    const ps=h('div',{class:'psrow'},h('div',{},h('b',{},'Paystack for customers: '),h('span',{class:'badge '+(r.paystackOn?'':'y')},r.paystackOn?'Available':'Temporarily unavailable'),h('p',{class:'mut',style:'font-size:12.5px;margin-top:4px'},r.paystackKey?'When off, customers who choose Paystack see “temporarily unavailable” and are pointed to bank transfer.':'Add PAYSTACK_SECRET to your .env file before you can turn Paystack on.')),
      h('button',{class:'btn out',disabled:!r.paystackKey&&!r.paystackOn,on:{click:async()=>{const x=await api('admin/paystack',{on:!r.paystackOn});toast(x.msg);if(x.ok){const me=await api('me');if(me.ok)CF=me;drawSettings()}}}},r.paystackOn?'Turn off':'Turn on'));
    set.append(msg,sv,h('hr',{class:'sep'}),ps);
  }
  const TAB=h('div',{class:'qa',style:'margin-bottom:14px'});
  async function drawList(){
    const r=await api('admin/transfers');list.replaceChildren();TAB.replaceChildren(...[['review','Needs action'],['all','All']].map(([k,l])=>h('button',{class:'tab'+(filter===k?' on':''),on:{click:()=>{filter=k;drawList()}}},l)));list.append(TAB);
    if(!r.rows)return list.append(h('p',{},r.msg||'Could not load.'));
    const rows=r.rows.filter(x=>filter==='all'||['proof_uploaded','awaiting_proof'].includes(x.status));
    if(!rows.length)return list.append(emptyBox('bank',filter==='all'?'No transfers yet':'Nothing waiting','New transfers appear here when customers upload receipts.'));
    const t=h('table',{class:'tbl'},h('tr',{},['Updated','Customer','Reference','Amount','Status','Receipt',''].map(x=>h('th',{},x))));
    rows.forEach(x=>{const s=TSTAT[x.status]||[x.status,''],open=['awaiting_transfer','awaiting_proof','proof_uploaded','rejected'].includes(x.status);
      const rc=x.has_proof?h('a',{href:'/api/admin/transfer/'+x.ref+'/receipt',target:'_blank',rel:'noopener',class:'btn out sm'},ic('receipt',14),'View'):h('span',{class:'mut'},'none');
      const ap=h('button',{class:'btn sm',on:{click:()=>approve(x)}},'Approve'),rj=h('button',{class:'btn out sm',on:{click:()=>reject(x)}},'Reject');
      t.append(h('tr',{},h('td',{class:'mut'},fmt(x.upd)),h('td',{},x.email||'-'),h('td',{class:'mono'},x.ref),h('td',{style:'font-weight:700'},N(x.status==='approved'&&x.credited?x.credited:x.amt)),h('td',{},h('span',{class:'badge '+s[1]},s[0]),x.dup?h('div',{style:'color:var(--er);font-size:11.5px;margin-top:4px'},'Same receipt as '+x.dup):null),h('td',{},rc),h('td',{style:'white-space:nowrap'},open?[ap,' ',x.status==='rejected'?null:rj]:null)))});
    list.append(t);
  }
  function approve(x){
    const amt=h('input',{type:'number',min:1,value:x.amt,inputmode:'numeric'}),err=h('div',{class:'msg',role:'alert'});let mm;
    const go=h('button',{class:'btn'},'Approve and credit wallet');
    const ask=()=>{const v=Number(amt.value);if(!Number.isInteger(v)||v<1){err.textContent='Enter the amount you received.';return}err.textContent='';
      const yes=h('button',{class:'btn'},'Yes, approve'),no=h('button',{class:'btn out'},'No, go back');
      const cm=h('div',{class:'modal',role:'alertdialog','aria-modal':'true','aria-label':'Confirm approval',style:'z-index:1200'},h('div',{class:'cd pad mbox'},h('h2',{style:'margin-bottom:10px'},'Are you sure?'),h('p',{style:'margin-bottom:6px'},'You are about to approve ',h('b',{},N(v)),' for ',h('b',{},x.email||'this customer'),' (',x.ref,').'),h('p',{class:'mut'},'This credits their wallet immediately and cannot be undone. Only continue if you have seen the money in your bank account.'),h('div',{style:'margin-top:18px;display:flex;gap:10px;flex-wrap:wrap'},yes,no)));
      document.body.append(cm);no.onclick=()=>cm.remove();yes.onclick=()=>{cm.remove();run()};no.focus()};
    go.onclick=ask;
    const run=async()=>{go.disabled=true;let y=await api('admin/transfer/approve',{ref:x.ref,amount:Number(amt.value)});
      if(!y.ok&&y.dup&&confirm(y.msg+'\n\nApprove anyway?'))y=await api('admin/transfer/approve',{ref:x.ref,amount:Number(amt.value),force:true});
      go.disabled=false;if(y.ok){mm.remove();toast(y.msg);drawList()}else err.textContent=y.msg};
    const img=x.has_proof&&/^image\//.test(x.proof_mime||'')?h('img',{src:'/api/admin/transfer/'+x.ref+'/receipt',alt:'Receipt',class:'rcpt'}):null;
    mm=modal('Approve '+x.ref,h('p',{class:'mut',style:'margin-bottom:12px'},(x.email||'Customer')+' asked to fund '+N(x.amt)+'. Check your bank alert first.'),img,h('label',{class:'lbl'},'Amount you actually received (₦)'),h('div',{class:'ig'},ic('wallet',17),amt),err,go);
  }
  function reject(x){
    const why=h('textarea',{rows:3,placeholder:'Tell the customer why (they will see this)',maxlength:300}),err=h('div',{class:'msg',role:'alert'});let mm;
    const go=h('button',{class:'btn'},'Reject receipt');go.onclick=async()=>{go.disabled=true;const y=await api('admin/transfer/reject',{ref:x.ref,reason:why.value});go.disabled=false;if(y.ok){mm.remove();toast(y.msg);drawList()}else err.textContent=y.msg};
    mm=modal('Reject '+x.ref,h('p',{class:'mut',style:'margin-bottom:12px'},'The customer can upload a new receipt.'),why,err,go);
  }
  drawSettings();drawList();
}
async function aPayments(m){
  m.append(crumb(['Dashboard'],['Admin'],['Payments']),titleRow('card','Payments','Admin'));
  const c=h('div',{class:'cd pad ov'}),re=h('button',{class:'btn'},ic('swap',15),'Re-check all waiting payments');
  re.onclick=async()=>{re.disabled=true;const x=await api('admin/pay/recheck',{});re.disabled=false;toast(x.msg);render()};
  m.append(h('p',{class:'mut',style:'margin:-8px 0 16px;max-width:760px'},'Every Paystack payment attempt. "Waiting" means Paystack has not confirmed it yet (the customer may have abandoned it). Confirmed payments are credited automatically.'),h('div',{style:'margin-bottom:16px'},re),c);
  const r=await api('admin/payments');if(!r.rows||!r.rows.length)return c.append(emptyBox('card','No payments yet','Payments appear here when customers fund their wallets.'));
  const t=h('table',{class:'tbl'},h('tr',{},['Date','Customer','Wallet credit','Customer paid','Status'].map(x=>h('th',{},x))));
  r.rows.forEach(p=>t.append(h('tr',{},h('td',{class:'mut'},fmt(p.at)),h('td',{},p.email||'-'),h('td',{style:'font-weight:700'},N(p.amt)),h('td',{},N(p.charged||p.amt)),h('td',{},h('span',{class:'badge '+(p.status==='paid'?'':p.status==='pending'?'y':'r')},p.status==='paid'?'credited':p.status==='pending'?'waiting':'needs review')))));
  c.append(t);
}
async function aRequests(m){
  m.append(crumb(['Dashboard'],['Admin'],['Agency Requests']),titleRow('file','Agency Requests','Admin'));
  const c=h('div',{class:'cd pad ov'});
  m.append(h('p',{class:'mut',style:'margin:-8px 0 16px;max-width:760px'},'IPE, validation and personalisation requests. If one is stuck or needs review, check it with the provider or refund the customer.'),c);
  const r=await api('admin/requests');if(!r.rows||!r.rows.length)return c.append(emptyBox('file','No requests yet','Agency requests from customers appear here.'));
  const t=h('table',{class:'tbl'},h('tr',{},['Date','Customer','Service','Fee','Status',''].map(x=>h('th',{},x))));
  r.rows.forEach(x=>{const st=h('span',{class:'badge '+(x.status==='completed'?'':x.status==='failed'?'r':'y')},x.status);
    const chk=h('button',{class:'btn out sm'},'Check'),rf=h('button',{class:'btn out sm'},'Refund customer');
    chk.onclick=async()=>{chk.disabled=true;const y=await api('admin/req/check',{id:x.id});chk.disabled=false;toast(y.status==='completed'?'Completed.':y.msg||'Checked.');if(y.status==='completed'||y.status==='failed')render()};
    rf.onclick=async()=>{if(!confirm('Refund '+N(x.price)+' to '+x.email+' and close this request?'))return;const y=await api('admin/req/refund',{id:x.id});toast(y.msg);if(y.ok)render()};
    const open=x.status==='pending'||x.status==='review';
    t.append(h('tr',{},h('td',{class:'mut'},fmt(x.at)),h('td',{},x.email||'-'),h('td',{},x.label),h('td',{},N(x.price)),h('td',{},st),h('td',{style:'display:flex;gap:8px'},open?[chk,rf]:'')))});
  c.append(t);
}

/* ===== boot ===== */
async function boot(){
  const r=await api('me');
  if(!r.ok){ME=null;return authView()}
  ME=r.user;CF=r;buildPages(r.services);shell();
  if(!location.hash)location.hash='#/dashboard';render();
  const ref=new URLSearchParams(location.search).get('paid');
  if(ref){history.replaceState(null,'','/'+location.hash);const x=await api('pay/verify',{ref});
    if(x.ok){setBal(x.bal);toast(x.status==='paid'?'Payment received. Your wallet has been credited.':x.status==='failed'?'That payment failed. You were not charged.':'Payment is still processing. Your wallet updates once it clears.')}}
}
boot();
