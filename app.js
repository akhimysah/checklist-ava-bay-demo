/* =====================================================================
   AVA Bay — Suivi quotidien (démo)
   Journée : présence du personnel, propreté des espaces, mise en place,
   bilan / priorités. Base clientes : fiches du jour, parcours, messages.
   Compte rendu : généré à partir de ces éléments (écran + e-mail serveur).
   ===================================================================== */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=()=>Math.random().toString(36).slice(2,9);
function todayISO(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
function fmtDate(d){if(!d)return '';const [y,m,j]=d.split('-');return `${j}/${m}/${y}`}
function longDate(d){const x=new Date(d+'T12:00:00');const s=x.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});return s[0].toUpperCase()+s.slice(1)}
const hhmm=t=>t?String(t).replace(':','h'):'';
const num=v=>v===''||v===undefined||v===null||isNaN(+v)?null:+v;
const fmt=v=>v===null||v===undefined?'—':v.toLocaleString('fr-FR',{maximumFractionDigits:2});
/* préfixe de stockage local : distinct de l'application publique (même navigateur possible) */
const LS='ava3-';

/* ---------- icônes ---------- */
const I={
  jour:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  fiches:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  base:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  cr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  spaces:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l6-6M14 4l6 6"/><path d="M9 15l-4 4a2.1 2.1 0 0 0 3 3l4-4"/><path d="M12 6l6 6-5 5-6-6z"/><path d="M19 2l1.5 1.5M21 6l1 1M17 3l.5-1"/></svg>',
  client:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2 .6 2.7.5a2.3 2.3 0 0 0 1.5-1.1 1.9 1.9 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/></svg>',
  dir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5M9 11h.01M15 11h.01M9 14h.01M15 14h.01"/></svg>',
  bea:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-2 3-6 5-6 10a6 6 0 0 0 12 0c0-5-4-7-6-10z"/><path d="M12 21v-4"/></svg>',
  cui:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16M5 11a7 7 0 0 1 14 0"/><path d="M3 15h18M12 4v1"/></svg>',
  ani:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  ent:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M14 3l4 4-9 9H5v-4z"/></svg>',
};
const VIEWS=[['jour','Journée',I.jour],['fiches','Clientes du jour',I.fiches],['base','Base clientes',I.base],['wa','WhatsApp',I.wa],['cr','Compte rendu',I.cr]];

/* ---------- checklist du jour ---------- */
const CHECK_ITEMS={};CHECKS.forEach(g=>g.items.forEach(([id,label])=>{CHECK_ITEMS[id]={id,label,group:g}}));
const CS={ok:'Prêt',fix:'À corriger',na:'Non concerné','':'À vérifier'};
const PS={ok:'Présent',late:'Retard',abs:'Absent',np:'Non prévu','':'À renseigner'};

/* ---------- état ---------- */
let day=todayISO();
let state=blank();
let team={rows:TEAM_DEFAULT.map((r,i)=>({id:'t'+i,sec:r[0],prenom:r[1],nom:r[2],fonction:r[3]}))},clients={rows:[]};
let view='jour';
let open=new Set(),detail=new Set(),editMember=null,clientQ='';
let db=null,dbUnsub=null,teamUnsub=null,clientsUnsub=null;
let dirty=false,dirtyTeam=false,dirtyClients=false,writeTimer=null,writing=Promise.resolve(),lastEditAt=0;
let photos={};try{photos=JSON.parse(localStorage.getItem(LS+'photos')||'{}')}catch(e){}
/* WhatsApp marketing : campagnes, réglages des rappels, journal des envois (document partagé, comme la base clientes) */
let mk=null,dirtyMk=false,mkUnsub=null,mkOpen=null;
const MAX_PHOTOS=4;

function blank(){return {regs:{staff:[],client:[]},checks:{items:{}},bilan:{note:''}}}
function norm(o){const b=blank();o=o||{};return {regs:{staff:o.regs?.staff||[],client:o.regs?.client||[]},checks:{items:o.checks?.items||{}},bilan:Object.assign(b.bilan,o.bilan||{})}}
const PARTS=['staff','checks','client','bilan'];
function partGet(k){if(k==='checks')return state.checks;if(k==='bilan')return state.bilan;return {rows:state.regs[k]||[]}}
function partSet(k,d){d=d||{};if(k==='checks')state.checks={items:d.items||{}};else if(k==='bilan')state.bilan=Object.assign(blank().bilan,d);else state.regs[k]=d.rows||[]}
let lastWritten={};
const lsKey=d=>LS+'jour:'+d;
function checkOf(id){const it=state.checks.items;return it[id]||(it[id]={})}

/* ---------- persistance ---------- */
function loadLocal(d){try{const j=localStorage.getItem(lsKey(d));return j?norm(JSON.parse(j)):null}catch(e){return null}}
function saveLocal(){try{localStorage.setItem(lsKey(day),JSON.stringify(state));localStorage.setItem(LS+'team',JSON.stringify(team));localStorage.setItem(LS+'clients',JSON.stringify(clients));if(mk)localStorage.setItem(LS+'marketing',JSON.stringify(mk))}catch(e){}}
function setSync(cls,txt){const el=$('#sync');el.className='sync '+cls;el.innerHTML='<span>'+txt+'</span>'}
function schedule(){lastEditAt=Date.now();setSync('saving','Enregistrement…');clearTimeout(writeTimer);writeTimer=setTimeout(flush,700)}
function persist(){saveLocal();if(!db)return;dirty=true;schedule()}
function persistTeam(){saveLocal();if(!db)return;dirtyTeam=true;schedule()}
function persistClients(){saveLocal();if(!db)return;dirtyClients=true;schedule()}
function persistMk(){saveLocal();if(!db)return;dirtyMk=true;schedule()}

/* ---------- résumé du jour (compte rendu) ----------
   Lu par le serveur (rapport.php) pour les e-mails de 11h et 20h, et affiché dans l'onglet Compte rendu. */
let lastResume='',forceResume=false;
function buildResume(){
  const st=staffStats();
  const staff={total:st.total,ok:st.ok,late:st.late,abs:st.abs,np:st.np,rows:team.rows.filter(m=>fullName(m)).map(m=>{const r=staffRow(m)||{};const q=pStatus(r);return {nom:fullName(m),serv:[m.fonction,m.sec].filter(Boolean).join(' · '),st:q,label:PS[q],arr:q==='ok'||q==='late'?(r.arr||''):'',obs:r.obs||''}})};
  const cs=checkStats();
  const checks={n:cs.n,ready:cs.ok,fix:cs.fix,na:cs.na,todo:cs.n-cs.done,groups:CHECKS.map(g=>({id:g.id,title:g.title,items:g.items.map(([id,label])=>{const c=state.checks.items[id]||{};return {id,label,s:c.s||'',status:CS[c.s||''],note:c.note||'',r:c.r||'',h:c.h||'',photos:(c.photos||[]).length}})}))};
  const fr=(state.regs.client||[]).slice().sort((a,b)=>(a.h||'').localeCompare(b.h||''));
  const RT={comp:'Compliment',recl:'Réclamation',dem:'Demande particulière',inc:'Incident',avis:'Avis en ligne'};
  const clientes={n:fr.length,sent:fr.filter(f=>f.sentAt).length,depense:fr.reduce((a,f)=>a+(num(f.montant)||0),0),
    rows:fr.map(f=>{const v=VENUES.find(v=>v[0]===f.venue);return {nom:ficheName(f),bracelet:f.bracelet||'',h:f.h||'',dep:f.dep||'',venue:v?v[1]:'',steps:ficheSteps(f).slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(x=>({time:x.time||'',act:x.act,ok:!!x.ok,note:x.note||''})),montant:num(f.montant),statut:ficheStatus(f)[1],sentAt:f.sentAt||'',type:RT[f.type]||'',motif:f.motif||'',rep:f.rep||'',traite:f.st==='done'}}),
    retours:fr.filter(f=>f.type).map(f=>({nom:ficheName(f),bracelet:f.bracelet||'',type:RT[f.type]||f.type,motif:f.motif||'',rep:f.rep||'',traite:f.st==='done'}))};
  const messages=fr.filter(f=>f.sentAt).map(f=>({nom:ficheName(f),tel:waPretty(f.tel)||f.tel||'',canal:'WhatsApp',sentAt:f.sentAt,body:waMessage(f)}));
  const bilan={note:state.bilan.note||''};
  const mlog=(mk?mk.log:[]).filter(l=>!l.skipped&&(l.t||'').slice(0,10)===day);
  const marketing={sent:mlog.length,rows:mlog.slice().reverse().map(l=>({nom:l.nom||'',kind:MK_KIND[l.kind]||l.kind||'',camp:l.camp||'',t:l.t||''}))};
  return {date:day,staff,checks,clientes,messages,marketing,bilan,text:reportText({staff,checks,clientes,messages,marketing,bilan})};
}
/* version texte du compte rendu (copie / partage) : sans emoji, l'essentiel d'abord, le reste regroupé */
function reportText(R){
  const S=R.staff,C=R.checks;const by=st=>S.rows.filter(r=>r.st===st);const poste=r=>r.serv?r.serv.split(' · ')[0]:'';
  const who=r=>r.nom+(poste(r)?' ('+poste(r)+')':'');const names=a=>a.map(r=>r.nom).join(', ');
  const T=(t,sub)=>{L.push(t.toUpperCase()+(sub?' — '+sub:''))};const i1='  ',i2='      ';
  const L=['AVA BAY — COMPTE RENDU DU JOUR',longDate(day),''];
  T('Personnel',`${S.ok+S.late} présent${S.ok+S.late>1?'s':''} sur ${S.total}`);
  by('late').forEach(r=>L.push(`${i1}Retard : ${who(r)}${r.arr?' · '+hhmm(r.arr):''}${r.obs?' · '+r.obs:''}`));
  by('abs').forEach(r=>L.push(`${i1}Absent : ${who(r)}${r.obs?' · '+r.obs:''}`));
  if(by('ok').length)L.push(`${i1}Présents : ${names(by('ok'))}`);
  if(by('np').length)L.push(`${i1}Non prévus : ${names(by('np'))}`);
  if(by('').length)L.push(`${i1}Non renseignés : ${names(by(''))}`);
  if(!S.rows.length)L.push(i1+'Liste du personnel à renseigner.');
  const items=C.groups.flatMap(g=>g.items);const of=st=>items.filter(i=>(i.s||'')===st);
  L.push('');T('Contrôle des espaces',`${C.ready}/${C.n-C.na} prêts${C.fix?` · ${C.fix} à corriger`:''}`);
  of('fix').forEach(i=>L.push(`${i1}À corriger : ${i.label}${i.note?' — '+i.note:''}${i.r?' → '+i.r:''}${i.h?' ('+hhmm(i.h)+')':''}${i.photos?` · ${i.photos} photo${i.photos>1?'s':''}`:''}`));
  if(of('').length)L.push(`${i1}À vérifier : ${of('').map(i=>i.label).join(', ')}`);
  if(of('na').length)L.push(`${i1}Non concernés : ${of('na').map(i=>i.label).join(', ')}`);
  if(of('ok').length)L.push(of('ok').length===items.length?i1+'Tout est prêt.':`${i1}Prêts : ${of('ok').map(i=>i.label).join(', ')}`);
  const cl=R.clientes;
  L.push('');T('Clientes',`${cl.n} fiche${cl.n>1?'s':''}${cl.sent?` · ${cl.sent} programme${cl.sent>1?'s':''} envoyé${cl.sent>1?'s':''}`:''}${cl.depense?` · ${fmt(cl.depense)} DH`:''}`);
  if(!cl.rows.length)L.push(i1+'Aucune cliente renseignée.');
  cl.rows.forEach((c,k)=>{if(k)L.push('');L.push(`${i1}${c.bracelet?'N° '+c.bracelet+' · ':''}${c.nom}${c.h?' · arrivée '+hhmm(c.h):''}${c.dep?' · départ '+hhmm(c.dep):''}${c.venue?' · '+c.venue.toLowerCase():''}`);
    if(c.steps.length)L.push(`${i2}${c.steps.map(s=>`${s.time?hhmm(s.time)+' ':''}${s.act}${s.ok?' (confirmé)':''}`).join(' → ')}`);
    if(c.sentAt)L.push(`${i2}Programme envoyé sur WhatsApp à ${hhmm(c.sentAt)}`);
    if(c.type)L.push(`${i2}${c.type}${c.motif?' : '+c.motif:''}${c.rep?' — réponse : '+c.rep:''} · ${c.traite?'traité':'à traiter'}`)});
  const mkR=R.marketing;if(mkR&&mkR.rows.length){L.push('');T('WhatsApp marketing',`${mkR.sent} message${mkR.sent>1?'s':''} envoyé${mkR.sent>1?'s':''}`);mkR.rows.forEach(m=>L.push(`${i1}${hhmm(m.t.slice(11,16))} ${m.nom} · ${m.kind}${m.camp?' « '+m.camp+' »':''}`))}
  L.push('');T('Bilan / priorités de demain');L.push(i1+(R.bilan.note||'Non renseigné.').replace(/\n/g,'\n'+i1));
  return L.join('\n');
}
function flush(){
  if(!db)return;const jobs=[];const stamp=o=>{o.updatedAt=new Date().toISOString();return o};
  if(dirty||dirtyTeam||dirtyClients||dirtyMk||forceResume){forceResume=false;try{const r=buildResume();const j=JSON.stringify(r);if(j!==lastResume){lastResume=j;jobs.push(()=>db.doc('jours/jour-'+r.date+'/parts/resume').set(stamp(JSON.parse(j))))}}catch(e){console.warn('resume',e)}}
  if(dirty){dirty=false;const d=day;for(const k of PARTS){const j=JSON.stringify(partGet(k));if(lastWritten[k]===j)continue;lastWritten[k]=j;const body=stamp(JSON.parse(j));body.date=d;body.part=k;jobs.push(()=>db.doc('jours/jour-'+d+'/parts/'+k).set(body))}}
  if(dirtyTeam){dirtyTeam=false;jobs.push(()=>db.doc('equipe/liste').set(stamp(JSON.parse(JSON.stringify(team)))))}
  if(dirtyClients){dirtyClients=false;jobs.push(()=>db.doc('clients/liste').set(stamp(JSON.parse(JSON.stringify(clients)))))}
  if(dirtyMk){dirtyMk=false;jobs.push(()=>db.doc('marketing/campagnes').set(stamp(clone(mk))))}
  if(!jobs.length)return;
  writing=writing.then(()=>Promise.all(jobs.map(j=>j()))).then(()=>{if(!dirty&&!dirtyTeam&&!dirtyClients&&!dirtyMk)setSync('on','Synchronisé')}).catch(e=>{console.warn(e);setSync('','Hors ligne (local)')});
}
function hasData(st){return Object.keys(st.checks.items).length||st.regs.staff.length||st.regs.client.length||!!st.bilan.note}
function subscribeDay(){
  if(dbUnsub){dbUnsub();dbUnsub=null}if(!db)return;
  const d=day;lastWritten={};let first=true;
  dbUnsub=db.collection('jours/jour-'+d+'/parts').onSnapshot(qs=>{
    if(d!==day)return;
    let changed=false;
    for(const doc of qs.docs){if(doc.metadata.hasPendingWrites)continue;const k=doc.id;if(!PARTS.includes(k))continue;const data=clone(doc.data());delete data.date;delete data.part;delete data.updatedAt;const j=JSON.stringify(data);if(j===lastWritten[k])continue;partSet(k,data);lastWritten[k]=JSON.stringify(partGet(k));changed=true}
    if(first){first=false;if(qs.empty&&hasData(state)){dirty=true;flush()}}
    if(changed){saveLocal();render()}
    if(changed||lastResume===''){forceResume=true;clearTimeout(writeTimer);writeTimer=setTimeout(flush,1500)}
    setSync('on','Synchronisé');syncBanner(true);
  },e=>{console.warn(e);setSync('','Hors ligne (local)')});
}
function subDoc(path,get,set,unsubRef){
  return db.doc(path).onSnapshot(snap=>{if(snap.metadata.hasPendingWrites)return;
    if(snap.exists){const rows=clone(snap.data().rows||[]);if(JSON.stringify(rows)!==JSON.stringify(get().rows)){set({rows});saveLocal();render()}}else if(get().rows.length){unsubRef();flush()}},e=>console.warn(e));
}
function subscribeGlobals(){
  if(!db)return;
  teamUnsub=teamUnsub||subDoc('equipe/liste',()=>team,v=>team=v,()=>dirtyTeam=true);
  clientsUnsub=clientsUnsub||subDoc('clients/liste',()=>clients,v=>clients=v,()=>dirtyClients=true);
  mkUnsub=mkUnsub||db.doc('marketing/campagnes').onSnapshot(snap=>{if(snap.metadata.hasPendingWrites)return;
    if(snap.exists){const d=clone(snap.data());delete d.updatedAt;const n=normMk(d);if(JSON.stringify(n)!==JSON.stringify(mk)){mk=n;saveLocal();render()}}else if(mk.campaigns.length||mk.log.length){dirtyMk=true;flush()}},e=>console.warn(e));
}
function switchDay(d){flush();day=d;$('#date').value=d;state=loadLocal(d)||blank();detail=new Set();fiche=null;render();subscribeDay()}

/* ---------- calculs ---------- */
function checkStats(gid){let ok=0,fix=0,na=0,n=0;CHECKS.forEach(g=>{if(gid&&g.id!==gid)return;g.items.forEach(([id])=>{n++;const s=state.checks.items[id]?.s;if(s==='ok')ok++;else if(s==='fix')fix++;else if(s==='na')na++})});return {n,ok,fix,na,done:ok+fix+na}}
const fullName=m=>[m.prenom,m.nom].filter(Boolean).join(' ');
function staffRow(m){const n=fullName(m);return state.regs.staff.find(r=>r.mid===m.id)||state.regs.staff.find(r=>!r.mid&&r.nom===n)||null}
function pStatus(r){if(!r)return '';if(r.np)return 'np';if(r.present===false)return 'abs';if(r.retard)return 'late';if(r.present)return 'ok';return ''}
function staffStats(){const t={total:0,ok:0,late:0,abs:0,np:0,todo:0};team.rows.forEach(m=>{if(!fullName(m))return;t.total++;const q=pStatus(staffRow(m));if(q)t[q]++;else t.todo++});return t}

/* ---------- rendu ---------- */
function go(v){view=v;clientOpen=null;fiche=null;if(v!=='wa')mkOpen=null;render();window.scrollTo({top:0,behavior:'instant'})}
function render(){
  $('#date').value=day;
  $('#teamlist').innerHTML=[...new Set(team.rows.map(fullName).filter(Boolean))].map(n=>`<option value="${esc(n)}">`).join('');
  $('#seclist').innerHTML=[...new Set(team.rows.map(m=>m.sec).filter(Boolean))].map(n=>`<option value="${esc(n)}">`).join('');
  $('#clientlist').innerHTML=clients.rows.map(c=>c.nom).filter(Boolean).map(n=>`<option value="${esc(n)}">`).join('');
  const cs=checkStats(),ss=staffStats(),nf=state.regs.client.length;
  const mkp=mkPending();const counts={jour:cs.fix?`${cs.fix} à corriger`:`${cs.ok}/${cs.n-cs.na}`,fiches:nf||'',base:clients.rows.length||'',wa:mkp||'',cr:''};
  const tabs=`<div class="subtabs main" role="tablist">${VIEWS.map(([k,l])=>`<button role="tab" data-view="${k}" aria-selected="${view===k}">${l}${counts[k]!==''?`<span class="n num">${counts[k]}</span>`:''}${k==='jour'&&(cs.fix||ss.abs)?'<span class="dot"></span>':''}</button>`).join('')}</div>`;
  const body=view==='jour'?renderJour():view==='fiches'?renderFiches():view==='base'?renderClients():view==='wa'?renderWA():renderCR();
  $('#view').innerHTML=tabs+body;
  renderBnav(mkp);
}

/* ---------- JOURNÉE ---------- */
function renderJour(){
  const d=new Date(day+'T12:00:00');const isToday=day===todayISO();
  const wd=d.toLocaleDateString('fr-FR',{weekday:'long'}),mo=d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  const cs=checkStats(),ss=staffStats();const total=cs.n-cs.na;const nf=state.regs.client.length,sent=state.regs.client.filter(f=>f.sentAt).length;
  const hero=`<div class="hero"><div class="day num">${d.getDate()}</div><div class="dmeta"><span class="wk">${mo}</span><h2>${wd[0].toUpperCase()+wd.slice(1)}</h2><p>${isToday?'Présences et contrôle des espaces : tout se coche au fur et à mesure, le compte rendu se construit tout seul.':'Journée passée ou à venir — état de ce qui a été renseigné à cette date.'}</p></div></div>
    <div class="stats"><div class="stat ${cs.fix?'fix':cs.ok===total&&total?'ok':''}"><b class="num">${cs.ok}/${total}</b><span>Points prêts</span></div><div class="stat ${cs.fix?'fix':''}"><b class="num">${cs.fix}</b><span>À corriger</span></div><div class="stat ${ss.abs?'urg':''}"><b class="num">${ss.ok+ss.late}/${ss.total}</b><span>Présents</span></div><div class="stat"><b class="num">${nf}</b><span>Cliente${nf>1?'s':''}${sent?' · '+sent+' envoi'+(sent>1?'s':''):''}</span></div></div>`;
  /* présences */
  const secs=[...new Set(team.rows.map(m=>m.sec||'Autre'))];
  const staffRows=secs.map(sec=>{const ms=team.rows.filter(m=>(m.sec||'Autre')===sec);return `<div class="tsec-in"><h4 class="tsub">${esc(sec)} <span class="n">${ms.length}</span></h4>${ms.map(staffItem).join('')}</div>`}).join('');
  const sz={n:ss.total,done:ss.total-ss.todo,ok:ss.ok,fix:ss.late,urg:ss.abs};
  const staffZone=zoneHtml('staff','Présence du personnel','Équipe',sz,staffRows+`<div class="item" style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill" data-addmember>+ Ajouter du personnel</button>${ss.todo?`<button class="pill ok" data-allpresent>Tous présents (${ss.todo} restant${ss.todo>1?'s':''})</button>`:''}</div>`,!open.has('staff'),'',`<button class="allok addp" data-addmember>+ Ajouter du personnel</button>`);
  /* propreté / mise en place */
  const zones=(()=>{const z=checkStats();const rows=CHECKS.map(g=>{const gz=checkStats(g.id);return `<div class="tsec-in"><h4 class="tsub">${esc(g.title)} <span class="n">${gz.done}/${gz.n}</span></h4>${g.items.map(([id])=>checkItem(CHECK_ITEMS[id])).join('')}</div>`}).join('');return zoneHtml('spaces','Contrôle des espaces','Espaces',{n:z.n,done:z.done,ok:z.ok,fix:z.fix,urg:0},rows,!open.has('spaces'),z.done<z.n?'data-allok="all"':'')})();
  const bilan=`<div class="card bilan"><div class="ch"><h3>Bilan / priorités du lendemain</h3><span class="chip ${state.bilan.note?'ok':''}">${state.bilan.note?'✓ renseigné':'à renseigner'}</span></div><textarea data-note placeholder="Une difficulté, une décision, une priorité pour demain…">${esc(state.bilan.note||'')}</textarea><p class="note" style="margin:0">Repris tel quel dans le compte rendu du jour.</p></div>`;
  const gocr=`<div class="gocr"><p><b>Compte rendu de la journée</b><br>Personnel, contrôle des espaces, parcours clientes, messages envoyés et bilan.</p><button class="addbtn" data-view="cr">Générer le compte rendu</button></div>`;
  return `${hero}<div class="sec-title"><h3>Préparer la journée</h3><span>${cs.done}/${cs.n} points vérifiés · ${ss.total-ss.todo}/${ss.total} présences renseignées</span></div><div class="jour-grid">${staffZone}${zones}${bilan}${gocr}</div>`;
}
function zoneHtml(key,title,tag,z,rows,closed,allokAttr,extra=''){
  const n=z.n||1;
  return `<section class="zone ${closed?'closed':''}" data-zkey="${key}"><header data-fold="${key}"><span class="tag">${tag}</span><h3>${esc(title)}</h3>
    <span class="zn num ${z.done===z.n?'done':''} ${z.fix||z.urg?'warn':''}">${z.done===z.n&&z.n?'✓ ':''}${z.done}/${z.n}</span>${allokAttr?`<button class="allok" ${allokAttr}>Tout prêt</button>`:''}${extra}
    <button class="fold" aria-label="Déplier"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5l4 4 4-4"/></svg></button>
    <span class="strip"><i class="ok" style="width:${z.ok/n*100}%"></i><i class="fix" style="width:${z.fix/n*100}%"></i><i class="urg" style="width:${(z.urg||0)/n*100}%"></i></span></header>
    <div class="items">${rows}</div></section>`;
}
function staffItem(m){
  const r=staffRow(m)||{};const st=pStatus(r);const n=fullName(m)||'Sans nom';const dk='staff:'+m.id;
  if(editMember===m.id)return `<div class="item" data-mid="${m.id}"><div class="edit"><input data-m="prenom" value="${esc(m.prenom)}" placeholder="Prénom"><input data-m="nom" value="${esc(m.nom)}" placeholder="Nom"><input data-m="fonction" value="${esc(m.fonction)}" placeholder="Poste"><input data-m="sec" list="seclist" value="${esc(m.sec||'')}" placeholder="Secteur"></div><div class="ebtns"><button class="pill urg" data-delmember="${m.id}">Retirer</button><button class="pill solid" data-editdone>OK</button></div></div>`;
  const meta=[];if(r.arr&&(st==='ok'||st==='late'))meta.push(`<span>⏱ ${esc(hhmm(r.arr))}</span>`);if(r.obs)meta.push(`<span class="obs">${esc(r.obs)}</span>`);
  const cls=st==='ok'?'ok':st==='late'?'fix':st==='abs'?'urg':st==='np'?'na':'none';
  return `<div class="item s-${cls}" data-mid="${m.id}">
    <div class="txt">${esc(n)}<span class="fn">${esc(m.fonction||'Poste à préciser')}</span>${meta.length?`<div class="meta">${meta.join('')}</div>`:''}</div>
    <div class="seg" role="group"><button class="ok" data-p="ok" aria-pressed="${st==='ok'}">Présent</button><button class="fix" data-p="late" aria-pressed="${st==='late'}">Retard</button><button class="urg" data-p="abs" aria-pressed="${st==='abs'}">Absent</button><button class="na" data-p="np" aria-pressed="${st==='np'}">Non prévu</button></div>
    <button class="detail ${detail.has(dk)?'on':''} ${r.arr||r.obs?'has':''}" data-toggle="${dk}" aria-label="Détails"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M11.5 2.5l2 2L6 12H4v-2z"/><path d="M3 14h10"/></svg></button>
    ${detail.has(dk)?`<div class="more"><label>Arrivée<input type="time" data-pf="arr" value="${esc(r.arr||'')}"></label><label class="full">Observation<input type="text" data-pf="obs" value="${esc(r.obs||'')}" placeholder="Retard justifié, remplacement, remarque…"></label><label class="row2"><button class="pill" data-editmember="${m.id}">Modifier la fiche (nom, poste)</button></label></div>`:''}</div>`;
}
function checkItem(it){
  const c=state.checks.items[it.id]||{};const dk='chk:'+it.id;const s=c.s||'';
  const meta=[];if(c.h)meta.push(`<span>⏱ ${esc(hhmm(c.h))}</span>`);if(c.r)meta.push(`<span>→ ${esc(c.r)}</span>`);if(c.note)meta.push(`<span class="obs">${esc(c.note)}</span>`);(c.photos||[]).forEach(p=>meta.push(photoThumb(p,'mthumb')));
  const ph=c.photos||[];const photosHtml=`<label class="full">Photos <span style="font-weight:400;text-transform:none;letter-spacing:0">(${ph.length}/${MAX_PHOTOS})</span><div class="photos">${ph.map((p,i)=>`<span class="pth">${photoThumb(p,'')}<button type="button" class="x" data-prm="${it.id}:${i}" aria-label="Retirer la photo">×</button></span>`).join('')}${ph.length<MAX_PHOTOS?`<span class="pbtn"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 5h2.5l1-2h5l1 2H14v8H2z"/><circle cx="8" cy="9" r="2.5"/></svg><span>${ph.length?'Ajouter une photo':'Prendre / choisir des photos'}</span><input type="file" accept="image/*" capture="environment" multiple data-photo="${it.id}"></span>`:''}</div></label>`;
  return `<div class="item s-${s||'none'}" data-cid="${it.id}">
    <div class="txt">${esc(it.label)}${meta.length?`<div class="meta">${meta.join('')}</div>`:''}</div>
    <div class="seg" role="group"><button class="ok" data-s="ok" aria-pressed="${s==='ok'}">Prêt</button><button class="fix" data-s="fix" aria-pressed="${s==='fix'}">À corriger</button><button class="na" data-s="na" aria-pressed="${s==='na'}">Non concerné</button></div>
    <button class="detail ${detail.has(dk)?'on':''} ${c.note||c.r||ph.length?'has':''}" data-toggle="${dk}" aria-label="Détails"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M11.5 2.5l2 2L6 12H4v-2z"/><path d="M3 14h10"/></svg></button>
    ${detail.has(dk)?`<div class="more"><label>Heure<input type="time" data-f="h" value="${esc(c.h||'')}"></label><label>Responsable<input type="text" data-f="r" list="teamlist" value="${esc(c.r||'')}" placeholder="Qui s'en occupe"></label><label class="full">À régler<textarea data-f="note" placeholder="Précisez ce qu'il faut régler">${esc(c.note||'')}</textarea></label>${photosHtml}</div>`:''}</div>`;
}
function setCheck(id,s){const c=checkOf(id);if(c.s===s)delete c.s;else{c.s=s;if(s==='fix'&&!c.h)c.h=new Date().toTimeString().slice(0,5)}if(c.s==='fix')detail.add('chk:'+id);if(!Object.keys(c).length)delete state.checks.items[id];persist();render()}
function setPointage(m,p){const n=fullName(m);if(!n)return;let r=staffRow(m);if(!r){r={id:uid(),mid:m.id,nom:n,serv:[m.fonction,m.sec].filter(Boolean).join(' · ')};state.regs.staff.push(r)}
  const cur=pStatus(r);delete r.np;if(cur===p){delete r.present;delete r.retard;delete r.arr}else if(p==='ok'){r.present=true;r.retard=false;if(!r.arr)r.arr=new Date().toTimeString().slice(0,5)}else if(p==='late'){r.present=true;r.retard=true;if(!r.arr)r.arr=new Date().toTimeString().slice(0,5);detail.add('staff:'+m.id)}else if(p==='abs'){r.present=false;r.retard=false;delete r.arr;detail.add('staff:'+m.id)}else{r.np=true;delete r.present;delete r.retard;delete r.arr}
  persist();render()}

/* ---------- photos (stockées sur l'appareil, 4 par point au maximum) ---------- */
function photoSrc(p){return p&&p.local?photos[p.local]||null:null}
function photoThumb(p,cls){const src=photoSrc(p);if(!src)return `<span class="pinfo">photo sur un autre appareil</span>`;return `<img class="${cls}" src="${src}" alt="Photo" data-lb="1">`}
function shrink(file,max=1200,q=.78){return new Promise((res,rej)=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{const r=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/jpeg',q)};img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'))};img.src=u})}
async function addPhotos(id,files){const c=checkOf(id);c.photos=c.photos||[];const room=MAX_PHOTOS-c.photos.length;
  for(const file of [...files].slice(0,Math.max(0,room))){let blob;try{blob=await shrink(file)}catch(e){blob=file}
    const dataUrl=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(blob)});
    const key=day+':'+id+':'+uid();photos[key]=dataUrl;
    try{localStorage.setItem(LS+'photos',JSON.stringify(photos))}catch(e){delete photos[key];setSync('','Mémoire photos pleine');break}
    c.photos.push({local:key})}
  if(!c.s)c.s='fix';persist();render()}
function removePhoto(id,i){const c=checkOf(id);const p=(c.photos||[])[i];if(!p)return;c.photos.splice(i,1);if(!c.photos.length)delete c.photos;if(p.local){delete photos[p.local];try{localStorage.setItem(LS+'photos',JSON.stringify(photos))}catch(e){}}persist();render()}

/* ---------- COMPTE RENDU ---------- */
function renderCR(){
  const R=buildResume();const S=R.staff,C=R.checks,cl=R.clientes;
  const row=(cls,icon,title,sub,chip,extra='')=>`<div class="crrow ${cls}"><span class="cric">${icon}</span><div class="crmain"><b>${esc(title)}</b>${sub?`<span class="sub">${sub}</span>`:''}</div>${chip}${extra}</div>`;
  const list=(lbl,arr)=>arr.length?`<p class="crlist"><b>${lbl} · ${arr.length}</b>${arr.map(esc).join(', ')}</p>`:'';
  const head=(icon,title,chip)=>`<div class="ch crhead"><span class="ic">${icon}</span><h3>${title}</h3>${chip}</div>`;
  const by=st=>S.rows.filter(r=>r.st===st);const poste=r=>r.serv?r.serv.split(' · ')[0]:'';
  const staff=(S.rows.length?'':'<div class="empty">Liste du personnel à renseigner.</div>')
    +by('late').map(r=>row('fix',I.clock,r.nom,esc(poste(r)),`<span class="chip fix">Retard${r.arr?' · '+esc(hhmm(r.arr)):''}</span>`,r.obs?`<div class="crextra">${esc(r.obs)}</div>`:'')).join('')
    +by('abs').map(r=>row('urg',I.x,r.nom,esc(poste(r)),`<span class="chip urg">Absent</span>`,r.obs?`<div class="crextra">${esc(r.obs)}</div>`:'')).join('')
    +list('Présents',by('ok').map(r=>r.nom+(r.arr?' ('+hhmm(r.arr)+')':'')))+list('Non prévus',by('np').map(r=>r.nom))+list('Non renseignés',by('').map(r=>r.nom));
  const items=C.groups.flatMap(g=>g.items);const of=st=>items.filter(i=>(i.s||'')===st);
  const spaces=of('fix').map(i=>row('fix',I.warn,i.label,[i.note,i.r?'→ '+i.r:'',i.h?hhmm(i.h):''].filter(Boolean).map(esc).join(' · '),`<span class="chip fix">À corriger</span>`,i.photos?`<div class="crextra photos">${(state.checks.items[i.id]?.photos||[]).map(p=>photoThumb(p,'mthumb')).join('')}</div>`:'')).join('')
    +list('À vérifier',of('').map(i=>i.label))+list('Non concernés',of('na').map(i=>i.label))
    +(items.length&&of('ok').length===items.length?`<div class="verdict ok">Tout est prêt.</div>`:list('Prêts',of('ok').map(i=>i.label)));
  const clientes=cl.rows.length?cl.rows.map(c=>{const bad=/Réclamation|Incident/.test(c.type);
    return row(c.type?(bad?'urg':'ok'):'',I.client,(c.bracelet?'N° '+c.bracelet+' · ':'')+c.nom,[c.h?'arrivée '+hhmm(c.h):'',c.dep?'départ '+hhmm(c.dep):'',c.venue?c.venue.toLowerCase():'',c.montant!==null?fmt(c.montant)+' DH':''].filter(Boolean).map(esc).join(' · '),
      c.sentAt?`<span class="chip ok">${I.wa} ${esc(hhmm(c.sentAt))}</span>`:`<span class="chip">${esc(c.statut)}</span>`,
      (c.steps.length?`<div class="crextra">${c.steps.map(s=>esc((s.time?hhmm(s.time)+' ':'')+s.act)+(s.ok?' <i class="okm">'+I.check+'</i>':'')).join('<span class="arr">→</span>')}</div>`:'')
      +(c.type?`<div class="crextra ${bad?'bad':'good'}"><b>${esc(c.type)}</b>${c.motif?' : '+esc(c.motif):''}${c.rep?' — réponse : '+esc(c.rep):''} · ${c.traite?'traité':'à traiter'}</div>`:''))}).join(''):'<div class="empty">Aucune cliente renseignée aujourd\'hui.</div>';
  const chip=(n,cls='')=>`<span class="chip ${cls}">${n}</span>`;
  return `<div class="card"><div class="ch"><h3>Compte rendu — ${longDate(day)}</h3><button class="pill" data-copy>Copier le texte</button>${navigator.share?'<button class="pill" data-share>Partager</button>':''}</div>
    <p class="note" style="margin:-6px 0 0">Généré à partir des saisies du jour. Sur le serveur AVA Bay, la même synthèse part par e-mail à 11h et 20h.</p>
    <div class="kpis"><div class="kpi ${S.abs?'urg':S.late?'fix':'ok'}"><b class="num">${S.ok+S.late}/${S.total}</b><span>Présents</span><small>${S.late} retard${S.late>1?'s':''} · ${S.abs} absent${S.abs>1?'s':''}</small></div><div class="kpi ${C.fix?'fix':'ok'}"><b class="num">${C.ready}/${C.n-C.na}</b><span>Espaces prêts</span><small>${C.fix} à corriger · ${C.todo} à vérifier</small></div><div class="kpi pole"><b class="num">${cl.n}</b><span>Clientes</span><small>${cl.sent} programme${cl.sent>1?'s':''} envoyé${cl.sent>1?'s':''}</small></div><div class="kpi ${cl.retours.some(r=>/Réclamation|Incident/.test(r.type))?'urg':''}"><b class="num">${cl.retours.length}</b><span>Retours</span><small>${cl.depense?fmt(cl.depense)+' DH de dépense':'—'}</small></div></div></div>
    <div class="card">${head(I.users,'Personnel',chip(`${S.ok+S.late} présent${S.ok+S.late>1?'s':''} sur ${S.total}`,S.abs?'urg':S.late?'fix':'ok'))}<div class="crsec">${staff}</div></div>
    <div class="card">${head(I.spaces,'Contrôle des espaces',chip(`${C.ready}/${C.n-C.na} prêts`,C.fix?'fix':'ok'))}<div class="crsec">${spaces}</div></div>
    <div class="card">${head(I.client,'Clientes',chip(`${cl.n} fiche${cl.n>1?'s':''}${cl.sent?' · '+cl.sent+' envoi'+(cl.sent>1?'s':''):''}`,'pole'))}<div class="crsec">${clientes}</div></div>
    ${R.marketing.rows.length?`<div class="card">${head(I.wa,'WhatsApp marketing',chip(`${R.marketing.sent} message${R.marketing.sent>1?'s':''}`,'ok'))}<div class="crsec">${R.marketing.rows.map(m=>row('ok',I.wa,m.nom,esc(m.kind+(m.camp?' « '+m.camp+' »':'')),`<span class="chip ok">${esc(hhmm(m.t.slice(11,16)))}</span>`)).join('')}</div></div>`:''}
    <div class="card">${head(I.note,'Bilan / priorités de demain',chip(R.bilan.note?'renseigné':'à renseigner',R.bilan.note?'ok':''))}<p style="margin:0;white-space:pre-wrap">${esc(R.bilan.note)||'<span class="note">Non renseigné — à compléter dans l\'onglet Journée.</span>'}</p></div>
    <div class="card"><div class="ch"><h3>Version texte</h3><span class="note">à coller dans WhatsApp ou un e-mail</span></div><pre class="crtext" id="crtext">${esc(R.text)}</pre></div>`;
}

/* ---------- fiche cliente & parcours (inchangé) ---------- */
const ZONES=[
  {id:'z1',name:'Détente & piscine',color:'#0B7285',soft:'#D7EEF2',icon:I.ent,acts:['Piscine & Bain de soleil','Espace détente']},
  {id:'z2',name:'Beauté & bien-être',color:'#B5607A',soft:'#F5DEE5',icon:I.bea,acts:['Hammam','Massage','Soin du visage','Coiffure','Manucure','Pédicure']},
  {id:'z3',name:'Restauration',color:'#C8742E',soft:'#F8E3CF',icon:I.cui,acts:['Petit-déjeuner','Déjeuner','Goûter','Boisson']},
  {id:'z4',name:'Coworking & temps pour soi',color:'#3E2B22',soft:'#E9DCD2',icon:I.dir,acts:['Coworking','Rendez-vous professionnel','Moment calme / lecture / prière']},
  {id:'z5',name:'AVA Land & activités',color:'#E0B04A',soft:'#F8EDCF',icon:I.ani,acts:['Baby Club','AVA Land','Événement','Holiday Camp']},
];
const VENUES=[['seule','Seule'],['amie','Avec une amie'],['enfants','Avec ses enfants'],['famille','En famille']];
const VENUE_TXT={seule:'seule',amie:'une amie',enfants:'vos enfants',famille:'votre famille'};
let fiche=null,ficheStep=1,ficheIntern=false,pickQ='',ficheQ='';
function pickResults(){const q=pickQ.trim().toLowerCase();if(!q)return `<p class="note" style="margin:0">${clients.rows.length} clientes dans la base — tape quelques lettres ou chiffres pour la retrouver et pré-remplir sa fiche.</p>`;const qd=q.replace(/\D/g,'').replace(/^0+/,'');const res=clients.rows.filter(c=>[c.nom,c.email,c.social,c.snap,c.code].join(' ').toLowerCase().includes(q)||(qd.length>=3&&(c.tel||'').replace(/\D/g,'').includes(qd))).slice(0,8);return res.length?res.map(c=>`<button class="pkc" data-pick="${c.id}"><b>${esc(c.nom||'Sans nom')}</b><span>${esc([c.code,c.tel?waPretty(c.tel)||c.tel:'',c.social,c.segment&&c.segment!=='Prospect'?c.segment:''].filter(Boolean).join(' · '))}</span>${c.vip?'<span class="chip fix">VIP</span>':''}</button>`).join(''):'<p class="note" style="margin:0">Aucune cliente trouvée — remplis la fiche ci-dessous, elle sera ajoutée à la base.</p>'}
/* anniversaire : saisie libre au clavier, jj/mm ou jj/mm/aaaa */
function bdayShow(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');return m?m[3]+'/'+m[2]+'/'+m[1]:(v||'')}
function bdayMask(v){const d=v.replace(/\D/g,'').slice(0,8);return d.length>4?d.slice(0,2)+'/'+d.slice(2,4)+'/'+d.slice(4):d.length>2?d.slice(0,2)+'/'+d.slice(2):d}
function bdayStore(v){const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);return m?m[3]+'-'+m[2]+'-'+m[1]:v}
const fichesToday=()=>state.regs.client;
function ficheSteps(f){return f.steps||(f.steps=[])}
function ficheName(f){return [f.prenom,f.nom].filter(Boolean).join(' ')||f.nomComplet||'Cliente'}
function ficheStatus(f){if(f.sentAt)return ['sent','Envoyé sur WhatsApp'];const st=ficheSteps(f);if(f.saved&&st.length&&st.every(x=>x.time&&x.ok))return ['ready','Parcours confirmé'];if(st.length)return ['prep','En préparation'];return ['new','Nouvelle']}
function waMessage(f){const st=ficheSteps(f).filter(x=>x.time).sort((a,b)=>a.time.localeCompare(b.time));
  return `Bonjour ${f.prenom||''} ✨\n\nBienvenue chez AVA BAY.\n\nVoici le programme que nous avons préparé ensemble pour votre journée :\n\n${st.map(x=>`🕐 ${x.time.replace(':','h')} — ${x.act}${x.note?' · '+x.note:''}`).join('\n')}\n\n${f.venue&&f.venue!=='seule'?`Vous êtes accompagnée de : ${VENUE_TXT[f.venue]}.\n\n`:''}Notre équipe reste à votre disposition tout au long de votre parcours.\n\nNous vous souhaitons une merveilleuse journée de détente chez AVA BAY ✨`}
function waNumber(tel){let d=(tel||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.startsWith('2120'))d='212'+d.slice(4);if(d.startsWith('0'))d='212'+d.slice(1);if(d.length===9&&/^[5-7]/.test(d))d='212'+d;return d}
function waPretty(tel){const d=waNumber(tel);if(!d)return '';if(d.startsWith('212')&&d.length===12)return '+212 '+d.slice(3,4)+' '+d.slice(4,6)+' '+d.slice(6,8)+' '+d.slice(8,10)+' '+d.slice(10,12);return '+'+d}
function waLink(f){return `https://wa.me/${waNumber(f.tel)}?text=${encodeURIComponent(waMessage(f))}`}
function upsertClient(f){const name=ficheName(f);if(!name||name==='Cliente')return;const key=(f.tel||'').replace(/\D/g,'');let c=(f.clientId&&clients.rows.find(x=>x.id===f.clientId))||clients.rows.find(x=>(key&&(x.tel||'').replace(/\D/g,'')===key)||(x.nom||'').trim().toLowerCase()===name.toLowerCase());
  if(!c){c={id:uid(),nom:name,tel:f.tel||'',email:f.email||'',pref:'',notes:'',vip:false};clients.rows.unshift(c)}else{if(f.tel&&!c.tel)c.tel=f.tel;if(f.email&&!c.email)c.email=f.email;if(!c.nom)c.nom=name}
  if(f.social)c.social=f.social;if(f.bday)c.bday=f.bday;
  const acts=ficheSteps(f).slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(x=>(x.time?x.time.replace(':','h')+' ':'')+x.act);
  c.visits=(c.visits||[]).filter(v=>v.fid!==f.id);c.visits.push({fid:f.id,date:day,acts,montant:f.montant||'',type:f.type||'',motif:f.motif||'',venue:f.venue||'',bracelet:f.bracelet||''});
  c.visits.sort((a,b)=>b.date.localeCompare(a.date));persistClients()}
function ficheCards(){
  const all=fichesToday();const q=ficheQ.trim().toLowerCase();const qd=q.replace(/\D/g,'').replace(/^0+/,'');
  const rows=!q?all:all.filter(f=>{const b=String(f.bracelet||'').trim().toLowerCase();return (b&&(b===q||b.replace(/^0+/,'')===q.replace(/^0+/,'')||b.includes(q)))||ficheName(f).toLowerCase().includes(q)||(qd.length>=3&&(f.tel||'').replace(/\D/g,'').includes(qd))});
  if(q){const ex=x=>String(x.bracelet||'').trim().toLowerCase().replace(/^0+/,'')===q.replace(/^0+/,'');rows.sort((a,b)=>ex(b)-ex(a)||(b.h||'').localeCompare(a.h||''))}else rows.sort((a,b)=>(b.h||'').localeCompare(a.h||''));
  const card=f=>{const [sc,sl]=ficheStatus(f);const st=ficheSteps(f).filter(x=>x.time).sort((a,b)=>a.time.localeCompare(b.time));
    const num=waNumber(f.tel);
    return `<div class="fc ${sc}" data-openfiche="${f.id}" role="button" tabindex="0"><div class="fh"><span class="av">${esc(((f.prenom||f.nomComplet||'?')[0]+((f.nom||'')[0]||'')).toUpperCase())}</span><div><div class="nm">${f.bracelet?`<span class="brn">N° ${esc(f.bracelet)}</span> `:''}${esc(ficheName(f))}</div><div class="sub">${f.h?'Arrivée '+esc(f.h):''}${f.venue?' · '+VENUES.find(v=>v[0]===f.venue)[1].toLowerCase():''}${f.tel?' · '+esc(waPretty(f.tel)||f.tel):''}</div></div><span class="chip ${sc==='sent'?'ok':sc==='ready'?'pole':sc==='prep'?'fix':''}">${sl}</span></div>
      ${st.length?`<div class="steps">${st.map(x=>`<span class="stp"><b>${esc(x.time.replace(':','h'))}</b> ${esc(x.act)}</span>`).join('')}</div>`:'<div class="sub">Aucun parcours encore construit</div>'}
      ${f.type?`<div class="sub">Retour : ${CTYPE[f.type]?.[0]||''}${f.motif?' — '+esc(f.motif):''}</div>`:''}
      ${num.length>=11?`<div class="contact"><a class="pill" href="tel:+${num}" data-stop>📞 Appeler</a><a class="pill" href="https://wa.me/${num}" target="_blank" rel="noopener" data-stop>💬 WhatsApp</a></div>`:''}</div>`};
  return rows.length?rows.map(card).join(''):`<div class="empty">${q?'Aucune cliente trouvée pour « '+esc(ficheQ)+' ».':"Aucune cliente enregistrée aujourd'hui."}</div>`;
}
function renderFiches(){
  const rows=fichesToday();
  if(fiche){const f=rows.find(r=>r.id===fiche);if(f)return renderFicheBuilder(f);fiche=null}
  const sent=rows.filter(f=>f.sentAt).length;
  return `<div class="card"><div class="ch"><h3>Fiches clientes du jour</h3><span class="note">${rows.length} cliente${rows.length>1?'s':''}${sent?` · ${sent} programme${sent>1?'s':''} envoyé${sent>1?'s':''}`:''}</span><button class="addbtn" data-newfiche>+ Nouvelle cliente</button></div>
    <p class="note" style="margin:-6px 0 0">À remplir sur la tablette dès l'arrivée de la cliente : on construit son parcours ensemble, la réception organise les horaires, puis le programme lui est envoyé sur WhatsApp.</p>
    <input type="search" id="ficheQ" class="fq" placeholder="Retrouver une cliente : n° de bracelet, nom ou téléphone…" value="${esc(ficheQ)}" autocomplete="off">
    <div class="fcs" id="fcs">${ficheCards()}</div></div>`;
}
function renderFicheBuilder(f){
  const steps=ficheSteps(f);const [sc,sl]=ficheStatus(f);
  const stepper=`<div class="stepper">${[[1,'Informations'],[2,'Envies'],[3,'Organisation']].map(([n,l])=>`<button data-fstep="${n}" aria-selected="${ficheStep===n}" class="${ficheStep>n?'done':''}"><span class="k">${ficheStep>n?'✓':n}</span>${l}</button>`).join('')}</div>`;
  const head=`<div class="card fbh"><div class="ch"><button class="pill" data-closefiche>‹ Toutes les fiches</button><h3 style="flex:1">${f.bracelet?`<span class="brn">N° ${esc(f.bracelet)}</span> `:''}${esc(ficheName(f))}</h3><span class="chip ${sc==='sent'?'ok':sc==='ready'?'pole':sc==='prep'?'fix':''}">${sl}</span><span class="note">Arrivée ${esc(f.h||'—')}</span></div>${stepper}</div>`;
  let body='';
  if(ficheStep===1){
    const linked=f.clientId&&clients.rows.find(c=>c.id===f.clientId);
    body=`<div class="card pick"><div class="ch"><h3>Cliente déjà connue ?</h3>${linked?`<span class="chip ok">✓ ${esc(linked.nom)}${linked.code?' · '+esc(linked.code):''}</span><button class="pill" data-unlink>Changer</button>`:''}</div>
      ${linked?'':`<input type="search" id="pickQ" placeholder="Rechercher dans la base : nom, téléphone, @instagram, code AVA…" value="${esc(pickQ)}" autocomplete="off"><div class="picks" id="picks">${pickResults()}</div>`}</div>
      <div class="card"><h3>Informations de la cliente</h3><div class="fields">
      <label class="s brc">N° de bracelet<input data-fk="bracelet" value="${esc(f.bracelet||'')}" placeholder="ex. 127" inputmode="numeric" autocomplete="off"></label>
      <label class="m">Prénom<input data-fk="prenom" value="${esc(f.prenom||'')}" autocomplete="off"></label>
      <label class="m">Nom<input data-fk="nom" value="${esc(f.nom||'')}" autocomplete="off"></label>
      <label class="m">Téléphone (WhatsApp)<input type="tel" data-fk="tel" value="${esc(f.tel||'')}" placeholder="+212 6…" inputmode="tel"></label>
      <label class="m">E-mail<input type="email" data-fk="email" value="${esc(f.email||'')}"></label>
      <label class="h">Instagram ou TikTok <span style="font-weight:400;text-transform:none;letter-spacing:0">(facultatif)</span><input data-fk="social" value="${esc(f.social||'')}" placeholder="@…"></label>
      <label class="s">Heure d'arrivée<input type="time" data-fk="h" value="${esc(f.h||'')}"></label>
      <label class="m">Date d'anniversaire<input type="text" data-fk="bday" value="${esc(bdayShow(f.bday))}" placeholder="jj/mm ou jj/mm/aaaa" inputmode="numeric" maxlength="10" autocomplete="off"></label>
      <label class="wide">Elle est venue<div class="multi">${VENUES.map(([v,l])=>`<button type="button" data-venue="${v}" aria-pressed="${f.venue===v}">${l}</button>`).join('')}</div></label></div>
      <div class="fnav"><span></span><button class="addbtn" data-fstep="2">Préparer sa journée →</button></div></div>`;
  }else if(ficheStep===2){
    const sel=new Set(steps.map(x=>x.act));
    body=`<div class="card welcome"><h3 class="big">Préparons ensemble votre journée chez AVA BAY</h3><p>Sélectionnez vos envies, nous organisons votre parcours.</p></div>
      <div class="zones">${ZONES.map((z,i)=>`<div class="zc" style="--pole:${z.color};--pole-soft:${z.soft}"><div class="zh"><span class="ic">${z.icon}</span><div><div class="zn">Zone ${i+1}</div><h3>${z.name}</h3></div></div><div class="multi">${z.acts.map(a=>`<button type="button" data-act="${esc(a)}" data-zone="${z.id}" aria-pressed="${sel.has(a)}">${esc(a)}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="fnav"><button class="pill" data-fstep="1">‹ Informations</button><span class="note">${steps.length} envie${steps.length>1?'s':''} sélectionnée${steps.length>1?'s':''}</span><button class="addbtn" data-fstep="3">Continuer mon parcours →</button></div>`;
  }else{
    const ordered=steps.slice().sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
    const allOk=steps.length&&steps.every(x=>x.time&&x.ok);
    const num=waNumber(f.tel);const canSend=allOk&&num.length>=11;
    body=`<div class="card"><div class="ch"><h3>Organisation par la réception</h3><span class="note">Vérifier les disponibilités, fixer l'ordre et les horaires, confirmer chaque étape.</span></div>
      <div class="plist">${steps.length?ordered.map((x,i)=>{const z=ZONES.find(z=>z.id===x.zone);return `<div class="pstep ${x.ok?'ok':''} ${x.dispo==='no'?'no':''}" data-sid="${x.id}" style="--pole:${z?z.color:'var(--accent)'}">
          <span class="n">${i+1}</span><input type="time" data-sk="time" value="${esc(x.time||'')}" aria-label="Heure">
          <div class="what"><div class="an">${esc(x.act)}</div><div class="z">${z?esc(z.name):''}</div></div>
          <input type="text" class="cm" data-sk="note" value="${esc(x.note||'')}" placeholder="Commentaire (cabine, praticienne, table, remarque…)">
          <label class="cf"><input type="checkbox" data-sk="ok" ${x.ok?'checked':''}>Confirmée</label>
          <button class="rm" data-rmstep="${x.id}" aria-label="Retirer">×</button></div>`}).join(''):'<div class="empty">Aucune étape — retourne à « Envies » pour en sélectionner.</div>'}</div>
      <div class="addstep"><select id="addAct"><option value="">+ Ajouter une prestation…</option>${ZONES.map(z=>`<optgroup label="${esc(z.name)}">${z.acts.map(a=>`<option value="${z.id}|${esc(a)}">${esc(a)}</option>`).join('')}</optgroup>`).join('')}</select></div></div>
      <div class="card preview"><div class="ch"><h3>Aperçu du programme</h3><span class="chip ${canSend?'ok':'fix'}">${allOk?(canSend?'Prêt à envoyer':'Numéro WhatsApp manquant ou incomplet'):'Horaires et confirmations incomplets'}</span></div><pre>${esc(waMessage(f))}</pre>
      <div class="fields"><label class="h">Numéro WhatsApp de la cliente<input type="tel" data-fk="tel" value="${esc(f.tel||'')}" placeholder="06 55 05 64 05 ou +212 6…" inputmode="tel"></label><label class="h">Contacter la cliente<div class="contact">${num.length>=11?`<a class="pill" href="tel:+${num}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z"/></svg>Appeler ${esc(waPretty(f.tel))}</a><a class="pill" href="https://wa.me/${num}" target="_blank" rel="noopener">💬 Ouvrir WhatsApp</a>`:'<span class="calc" style="color:var(--urg)">numéro invalide</span>'}</div></label></div>
      <div class="fnav"><button class="pill" data-fstep="2">‹ Envies</button><span></span><button class="pill" data-savefiche>Enregistrer le parcours</button><a class="addbtn wa ${canSend?'':'dim'}" href="${canSend?waLink(f):'#'}" ${canSend?'target="_blank" rel="noopener"':''} data-sendwa="${canSend?'1':'0'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2 .6 2.7.5a2.3 2.3 0 0 0 1.5-1.1 1.9 1.9 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/></svg>Envoyer le programme${num.length>=11?` · ${esc(waPretty(f.tel))}`:''}</a></div><div class="note" id="waHint" ${canSend?'hidden':''}>${allOk?'Renseigne un numéro WhatsApp valide pour envoyer le programme.':'Pour envoyer le programme : fixe une heure et coche « Confirmée » sur chaque étape.'}</div>
      ${f.sentAt?`<div class="verdict ok">✓ Programme envoyé à ${esc(f.sentAt)} au ${esc(f.tel||'')}</div>`:''}</div>
      <div class="card"><button class="ch" data-intern style="width:100%;text-align:left"><h3>Suivi interne (équipe)</h3><span class="note">${ficheIntern?'masquer':'départ, dépense, retour cliente'}</span></button>
      ${ficheIntern?`<div class="fields"><label class="s">Départ<input type="time" data-fk="dep" value="${esc(f.dep||'')}"></label><label class="s">Dépense (DH)<input type="number" inputmode="decimal" data-fk="montant" value="${esc(f.montant||'')}"></label>
        <label class="m">Retour<select data-fk="type">${[['','Aucun retour'],['comp','Compliment'],['recl','Réclamation'],['dem','Demande particulière'],['inc','Incident'],['avis','Avis en ligne']].map(o=>`<option value="${o[0]}" ${o[0]===(f.type||'')?'selected':''}>${o[1]}</option>`).join('')}</select></label>
        <label class="m">Statut<select data-fk="st">${[['open','À traiter'],['done','Traité']].map(o=>`<option value="${o[0]}" ${o[0]===(f.st||'open')?'selected':''}>${o[1]}</option>`).join('')}</select></label>
        <label class="wide">Détail du retour<input data-fk="motif" value="${esc(f.motif||'')}"></label><label class="wide">Réponse apportée<input data-fk="rep" value="${esc(f.rep||'')}"></label><label class="h">Geste commercial<input data-fk="geste" value="${esc(f.geste||'')}" placeholder="Offert, remise, invitation…"></label><label class="h">Suivi par<input data-fk="resp" list="teamlist" value="${esc(f.resp||'')}"></label>
        <div class="wide confirm"><button class="danger" data-delfiche="${f.id}">Supprimer cette fiche</button></div></div>`:''}</div>`;
  }
  return head+body;
}

/* ---------- base clientes (inchangé) ---------- */
const CTYPE={recl:['Réclamation','fix'],comp:['Compliment','ok'],dem:['Demande',''],inc:['Incident','urg'],avis:['Avis en ligne','fix']};
function clientHistory(name){if(!name)return [];const n=name.trim().toLowerCase();const out=[];const pre=LS+'jour:';try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k.startsWith(pre))continue;const st=JSON.parse(localStorage.getItem(k));(st.regs?.client||[]).forEach(r=>{const rn=([r.prenom,r.nom].filter(Boolean).join(' ')||r.nomComplet||r.nom||'').trim().toLowerCase();if(rn===n)out.push({date:k.slice(pre.length),type:r.type,motif:r.motif,presta:(r.steps&&r.steps.length?r.steps.slice().sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(x=>(x.time?x.time.replace(':','h')+' ':'')+x.act):r.presta)||[],montant:r.montant})})}}catch(e){}return out.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)}
let clientOpen=null,clientFilter='all';
function clientVisits(c){const local=clientHistory(c.nom).map(x=>({fid:null,date:x.date,acts:x.presta,montant:x.montant,type:x.type,motif:x.motif}));const all=[...(c.visits||[])];for(const l of local){if(!all.some(v=>v.date===l.date))all.push(l)}return all.sort((a,b)=>b.date.localeCompare(a.date))}
function renderClients(){
  const q=clientQ.toLowerCase();const today=todayISO();const month=today.slice(0,7);
  let rows=clients.rows.filter(c=>!q||[c.nom,c.tel,c.email,c.social,c.snap,c.tiktok,c.fb,c.code,c.segment,c.loc,c.pref,c.notes].join(' ').toLowerCase().includes(q));
  const withV=rows.map(c=>({c,v:clientVisits(c)}));
  const filtered=withV.filter(({c,v})=>clientFilter==='all'||(clientFilter==='vip'?c.vip:clientFilter==='month'?v.some(x=>x.date.startsWith(month)):clientFilter==='notel'?!waNumber(c.tel):clientFilter==='verify'?c.verify:clientFilter==='influ'?/influ|créatrice/i.test(c.segment||''):clientFilter==='recl'?v.some(x=>x.type==='recl'||x.type==='inc'||x.type==='avis'):true))
    .sort((a,b)=>(b.c.vip?1:0)-(a.c.vip?1:0)||((b.v[0]?.date||'')).localeCompare(a.v[0]?.date||'')||(a.c.nom||'').localeCompare(b.c.nom||''));
  const k={verify:clients.rows.filter(c=>c.verify).length,influ:clients.rows.filter(c=>/influ|créatrice/i.test(c.segment||'')).length,all:clients.rows.length,vip:clients.rows.filter(c=>c.vip).length,month:withV.filter(x=>x.v.some(v=>v.date.startsWith(month))).length,recl:withV.filter(x=>x.v.some(v=>v.type==='recl'||v.type==='inc'||v.type==='avis')).length,notel:clients.rows.filter(c=>!waNumber(c.tel)).length};
  const row=({c,v})=>{const num=waNumber(c.tel);const opn=clientOpen===c.id;const spend=v.reduce((a,x)=>a+(+x.montant||0),0);const last=v[0];const ini=((c.nom||'?').trim()[0]||'?').toUpperCase();
    return `<div class="cl ${c.vip?'vip':''} ${opn?'open':''}" data-cid="${c.id}">
      <div class="cs" data-opencl="${c.id}"><span class="av">${esc(ini)}</span>
        <div class="who"><div class="nm">${esc(c.nom||'Sans nom')}${c.vip?' <span class="chip fix">VIP</span>':''}${c.segment&&c.segment!=='Prospect'?` <span class="chip pole">${esc(c.segment)}</span>`:''}${c.verify?' <span class="chip urg">à vérifier</span>':''}</div><div class="sub">${c.code?esc(c.code)+' · ':''}${c.tel?esc(waPretty(c.tel)||c.tel):'<span style="color:var(--urg)">sans téléphone</span>'}${c.social?' · '+esc(c.social):''}${c.loc?' · '+esc(c.loc):''}</div></div>
        <div class="st"><b class="num">${v.length}</b><span>visite${v.length>1?'s':''}</span></div>
        <div class="st"><b class="num">${last?fmtDate(last.date).slice(0,5):'—'}</b><span>dernière</span></div>
        <div class="st"><b class="num">${spend?spend.toLocaleString('fr-FR'):'—'}</b><span>DH</span></div>
        <div class="contact">${num?`<a class="pill" href="tel:+${num}" data-stop>📞</a><a class="pill" href="https://wa.me/${num}" target="_blank" rel="noopener" data-stop>💬</a>`:''}</div></div>
      ${opn?`<div class="ce"><div class="fields">
        <label class="m">Nom complet<input data-c="nom" value="${esc(c.nom||'')}"></label><label class="m">Téléphone<input type="tel" data-c="tel" value="${esc(c.tel||'')}" inputmode="tel"></label><label class="m">E-mail<input type="email" data-c="email" value="${esc(c.email||'')}"></label>
        <label class="m">Instagram<input data-c="social" value="${esc(c.social||'')}" placeholder="@…"></label><label class="m">Snapchat<input data-c="snap" value="${esc(c.snap||'')}"></label><label class="m">TikTok<input data-c="tiktok" value="${esc(c.tiktok||'')}"></label><label class="m">Facebook<input data-c="fb" value="${esc(c.fb||'')}"></label>
        <label class="m">Profil<input data-c="segment" list="seglist" value="${esc(c.segment||'')}" placeholder="Prospect, Influenceuse…"></label><label class="m">Localisation<input data-c="loc" list="loclist" value="${esc(c.loc||'')}" placeholder="Locale, Expatriée…"></label><label class="chk"><input type="checkbox" data-c="verify" ${c.verify?'checked':''}>À vérifier</label><label class="chk"><input type="checkbox" data-c="nowa" ${c.nowa?'checked':''}>Pas de WhatsApp marketing</label><label class="s">Anniversaire<input type="text" data-c="bday" value="${esc(bdayShow(c.bday))}" placeholder="jj/mm ou jj/mm/aaaa" inputmode="numeric" maxlength="10" autocomplete="off"></label><label class="chk"><input type="checkbox" data-c="vip" ${c.vip?'checked':''}>VIP / habituée</label>
        <label class="wide">Préférences, allergies, habitudes<input data-c="pref" value="${esc(c.pref||'')}" placeholder="Soin préféré, table habituelle, allergie…"></label><label class="wide">Notes<textarea data-c="notes" placeholder="Remarques, enfants, ce qu'elle aime…">${esc(c.notes||'')}</textarea></label></div>
        <div class="hist2">${v.length?`<h4>Historique des visites</h4>${v.map(x=>`<div class="hv"><b>${fmtDate(x.date)}</b><span>${x.acts&&x.acts.length?esc(x.acts.join(' · ')):'visite'}</span>${x.montant?`<span class="num">${esc(x.montant)} DH</span>`:''}${x.type?`<span class="chip ${CTYPE[x.type]?.[1]||''}">${CTYPE[x.type]?.[0]||''}${x.motif?' — '+esc(String(x.motif).slice(0,50)):''}</span>`:''}</div>`).join('')}`:'<p class="note" style="margin:0">Aucune visite enregistrée.</p>'}</div>
        <div class="confirm"><button class="pill" data-newfrom="${c.id}">+ Fiche du jour pour cette cliente</button><span style="flex:1"></span><button class="danger" data-delclient="${c.id}">Supprimer la cliente</button><button data-closecl>Fermer</button></div></div>`:''}</div>`};
  const dl=`<datalist id="seglist">${['Prospect','Cliente','Influenceuse','Créatrice de contenu','Maquilleuse','Partenaire'].map(x=>`<option value="${x}">`).join('')}</datalist><datalist id="loclist">${['Locale','Expatriée','Mi-expatriée','France','Touriste'].map(x=>`<option value="${x}">`).join('')}</datalist>`;
  return dl+`<div class="card" id="cdir"><div class="ch"><h3>Base clientes</h3><span class="note">${clients.rows.length} fiche${clients.rows.length>1?'s':''}</span><input type="search" id="clientQ" placeholder="Nom, téléphone, @…" value="${esc(clientQ)}" style="border-radius:999px"><button class="addbtn" data-addclient>+ Nouvelle cliente</button></div>
    <div class="kpis">${[['all','Toutes','pole'],['vip','VIP',''],['influ','Influenceuses','pole'],['month','Venues ce mois','ok'],['recl','Avec réclamation','urg'],['verify','À vérifier','fix']].map(([v,l,cl])=>`<button class="kpi ${cl}" data-cf="${v}" aria-pressed="${clientFilter===v}"><b class="num">${k[v]}</b><span>${l}</span></button>`).join('')}</div>
    <p class="note" style="margin:-4px 0 0">Touche une cliente pour modifier sa fiche, voir ses visites, l'appeler ou lui créer sa fiche du jour. Les clientes des fiches du jour sont ajoutées automatiquement.</p>
    <div class="cls">${filtered.length?filtered.map(row).join(''):`<div class="empty">${q?'Aucune cliente ne correspond.':'Aucune cliente dans cette vue.'}</div>`}</div></div>`;
}


/* ---------- WHATSAPP MARKETING ----------
   Campagnes (offre, événement, nouveauté…) envoyées cliente par cliente depuis le WhatsApp de la tablette,
   rappels automatiques (anniversaire, merci après la visite, relance) et notifications quand il est l'heure d'envoyer. */
const MK_DEF={campaigns:[],auto:{bday:true,thanks:true,back:true,sched:true,backDays:30,hour:'10:00'},log:[]};
function normMk(o){o=o||{};return {campaigns:Array.isArray(o.campaigns)?o.campaigns:[],auto:Object.assign(clone(MK_DEF.auto),o.auto||{}),log:Array.isArray(o.log)?o.log:[]}}
mk=normMk(null);
const MK_AUD=[['all','Toutes les clientes'],['vip','VIP'],['influ','Influenceuses'],['month','Venues ce mois'],['new','Une seule visite'],['back','Pas revenues'],['bday','Anniversaire ce mois']];
const MK_KIND={bday:'Anniversaire',thanks:'Merci pour la visite',back:'Relance',camp:'Campagne'};
const nowLocal=()=>todayISO()+'T'+new Date().toTimeString().slice(0,5);
function dateShift(d,n){const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
function bdayMD(v){v=String(v||'').trim();let m=/^\d{4}-(\d{2})-(\d{2})/.exec(v);if(m)return m[1]+'-'+m[2];m=/^(\d{2})\/(\d{2})/.exec(v);if(m)return m[2]+'-'+m[1];return ''}
const firstName=c=>((c.nom||'').trim().split(/\s+/)[0]||'');
function mkText(msg,c){return String(msg||'').replace(/\{prenom\}/gi,firstName(c)||'Madame').replace(/\{nom\}/gi,(c.nom||'').trim()||'Madame')}
function mkReach(){return clients.rows.filter(c=>!c.nowa&&waNumber(c.tel).length>=11)}
function mkAudience(aud){const today=todayISO(),month=today.slice(0,7),lim=dateShift(today,-(mk.auto.backDays||30));
  return mkReach().filter(c=>{if(!aud||aud==='all')return true;const v=clientVisits(c);const last=v[0]?.date||'';
    if(aud==='vip')return !!c.vip;if(aud==='influ')return /influ|créatrice/i.test(c.segment||'');if(aud==='month')return v.some(x=>x.date.startsWith(month));
    if(aud==='new')return v.length===1;if(aud==='back')return !!last&&last<lim;if(aud==='bday')return bdayMD(c.bday).slice(0,2)===month.slice(5,7);return true})}
function mkTpl(id){return WA_TEMPLATES.find(t=>t.id===id)||WA_TEMPLATES[0]}
function mkLink(c,msg){return `https://wa.me/${waNumber(c.tel)}?text=${encodeURIComponent(mkText(msg,c))}`}
function mkLog(e){mk.log.unshift(Object.assign({t:nowLocal()},e));if(mk.log.length>2000)mk.log.length=2000;forceResume=true;persistMk()}
function mkStatus(c){const aud=mkAudience(c.aud);const sent=aud.filter(x=>c.sent?.[x.id]).length,skip=aud.filter(x=>c.skip?.[x.id]).length;const now=nowLocal();
  let st;if(aud.length&&sent+skip>=aud.length)st='done';else if(c.when&&c.when>now)st='sched';else if(sent)st='live';else if(c.when)st='due';else st='draft';
  return {st,label:{draft:'Brouillon',sched:'Programmée',due:'À envoyer',live:'En cours',done:'Terminée'}[st],aud,sent,skip,n:aud.length}}
const mkChip=st=>st==='done'?'ok':st==='due'||st==='live'?'fix':st==='sched'?'pole':'';
function mkReminders(){const today=todayISO(),y=dateShift(today,-1),lim=dateShift(today,-(mk.auto.backDays||30));const out=[];const has=k=>mk.log.some(l=>l.key===k);
  for(const c of mkReach()){const v=clientVisits(c);const last=v[0]?.date||'';
    if(mk.auto.bday&&bdayMD(c.bday)===today.slice(5)){const key=today+':bday:'+c.id;out.push({key,kind:'bday',c,done:has(key)})}
    if(mk.auto.thanks&&v.some(x=>x.date===y)){const key=today+':thanks:'+c.id;out.push({key,kind:'thanks',c,done:has(key)})}
    if(mk.auto.back&&last&&last<lim&&!mk.log.some(l=>l.kind==='back'&&l.cid===c.id&&(l.t||'').slice(0,10)>lim)){const key=today+':back:'+c.id;out.push({key,kind:'back',c,done:false})}}
  return out}
function mkDue(){return mk.campaigns.filter(c=>{const s=mkStatus(c).st;return s==='due'||s==='live'})}
function mkPending(){if(!mk)return 0;return mkReminders().filter(r=>!r.done).length+mkDue().length}
/* notifications : bandeau dans l'application + notification du navigateur quand elle est autorisée */
function notifPerm(){return 'Notification' in window?Notification.permission:'unsupported'}
function toast(title,body){document.querySelectorAll('.toast').forEach(t=>t.remove());const d=document.createElement('div');d.className='toast';d.setAttribute('role','status');d.innerHTML=`<span class="ic">${I.wa}</span><div><b>${esc(title)}</b><span>${esc(body)}</span></div>`;d.onclick=()=>{d.remove();go('wa')};document.body.appendChild(d);setTimeout(()=>d.remove(),8000)}
function notify(title,body,tag){toast(title,body);if(notifPerm()!=='granted')return;try{const n=new Notification(title,{body,tag,icon:$('.brand .mark img')?.src||undefined});n.onclick=()=>{window.focus();go('wa');n.close()}}catch(e){}}
function mkTick(){if(!mk)return;const today=todayISO(),now=nowLocal();let changed=false;
  if(mk.auto.sched)for(const c of mk.campaigns){if(c.when&&!c.notified&&c.when<=now&&mkStatus(c).st!=='done'){c.notified=true;changed=true;const s=mkStatus(c);notify('Campagne WhatsApp à envoyer',`« ${c.name||'Sans titre'} » — ${s.n} cliente${s.n>1?'s':''}`,'camp-'+c.id)}}
  if(changed)persistMk();
  if(now.slice(11)>=(mk.auto.hour||'10:00')){let last='';try{last=localStorage.getItem(LS+'mk-notified')||''}catch(e){}
    if(last!==today){try{localStorage.setItem(LS+'mk-notified',today)}catch(e){}const R=mkReminders().filter(r=>!r.done);
      if(R.length){const by={};R.forEach(r=>by[r.kind]=(by[r.kind]||0)+1);notify('Rappels WhatsApp du jour',Object.entries(by).map(([k,n])=>`${n} ${MK_KIND[k].toLowerCase()}`).join(' · '),'mk-daily');changed=true}}}
  if(changed&&!document.activeElement?.matches?.('input,textarea'))render()}
function rcpRow(c,msg,o){const ini=((c.nom||'?').trim()[0]||'?').toUpperCase();const st=o.state||'';
  return `<div class="rcp ${st}"><span class="av">${esc(ini)}</span><div><div class="nm">${esc(c.nom||'Sans nom')}${o.kind?`<span class="chip ${o.kind==='bday'?'fix':o.kind==='back'?'':'ok'}">${MK_KIND[o.kind]}</span>`:''}${c.vip?'<span class="chip fix">VIP</span>':''}</div><div class="sub">${esc(waPretty(c.tel)||c.tel)}</div></div>
    <div class="act">${st==='sent'?`<span class="chip ok">${I.check} Envoyé${o.at?' '+esc(hhmm(o.at)):''}</span>`:st==='skip'?`<span class="chip">Ignoré</span>`:`<a class="pill wa" href="${mkLink(c,msg)}" target="_blank" rel="noopener" ${o.send}>${I.wa} Envoyer</a><button class="pill" ${o.skip}>Ignorer</button>`}</div>
    ${st?'':`<div class="prev">${esc(mkText(msg,c))}</div>`}</div>`}
function renderWA(){
  if(mkOpen){const c=mk.campaigns.find(x=>x.id===mkOpen);if(c)return renderCampaign(c);mkOpen=null}
  const today=todayISO(),month=today.slice(0,7);const reach=mkReach();const R=mkReminders();const pend=R.filter(r=>!r.done);const doneToday=R.filter(r=>r.done).length;
  const sentToday=mk.log.filter(l=>!l.skipped&&(l.t||'').slice(0,10)===today).length,sentMonth=mk.log.filter(l=>!l.skipped&&(l.t||'').slice(0,7)===month).length;
  const perm=notifPerm();
  const permHtml=perm==='granted'?`<div class="perm ok">${I.check}<p><b>Notifications activées</b> sur cet appareil : tu es prévenue quand une campagne programmée ou les rappels du jour sont à envoyer.</p></div>`
    :perm==='denied'?`<div class="perm bad">${I.warn}<p><b>Notifications bloquées</b> par le navigateur. Autorise-les dans les réglages du site pour être prévenue ; les rappels restent visibles ici.</p></div>`
    :perm==='unsupported'?`<div class="perm">${I.warn}<p>Ce navigateur n'affiche pas de notifications. Les rappels restent visibles dans cet onglet et dans la pastille du menu.</p></div>`
    :`<div class="perm">${I.wa}<p><b>Être prévenue</b> quand une campagne programmée ou les rappels du jour sont à envoyer (notification sur cet appareil).</p><button class="addbtn" data-notif>Activer les notifications</button></div>`;
  const tog=(k,title,sub,extra='')=>`<label class="tog"><input type="checkbox" data-auto="${k}" ${mk.auto[k]?'checked':''}><span class="tt">${title}<small>${sub}</small></span>${extra}</label>`;
  const autoCard=`<div class="card mkauto"><div class="ch"><h3>Rappels automatiques et notifications</h3><span class="note">rappels du jour à <input type="time" data-auto="hour" value="${esc(mk.auto.hour||'10:00')}" style="padding:4px 8px;font-weight:600"></span></div>${permHtml}
    <div class="togs">${tog('bday','Anniversaire','le jour J, message d\'anniversaire')}${tog('thanks','Merci pour la visite','le lendemain d\'une visite')}${tog('back','Relance','cliente pas revenue depuis',`<span class="note"><input type="number" min="7" max="365" data-auto="backDays" value="${esc(mk.auto.backDays||30)}"> j</span>`)}${tog('sched','Campagnes programmées','notification à la date et l\'heure choisies')}</div></div>`;
  const rem=pend.length?pend.map(r=>rcpRow(r.c,mkTpl(r.kind).msg,{kind:r.kind,send:`data-rmsend="${r.key}"`,skip:`data-rmskip="${r.key}"`})).join(''):`<div class="empty">Aucun rappel à envoyer aujourd'hui.</div>`;
  const remCard=`<div class="card"><div class="ch"><h3>Rappels du jour</h3><span class="chip ${pend.length?'fix':'ok'}">${pend.length?pend.length+' à envoyer':'à jour'}</span>${doneToday?`<span class="note">${doneToday} traité${doneToday>1?'s':''}</span>`:''}</div><p class="note" style="margin:-6px 0 0">Calculés depuis la base clientes : anniversaires du jour, visites d'hier, clientes pas revenues. « Envoyer » ouvre WhatsApp avec le message prêt ; il ne reste qu'à appuyer sur envoyer.</p><div class="rcps">${rem}</div></div>`;
  const camps=mk.campaigns.slice().sort((a,b)=>(b.created||'').localeCompare(a.created||''));
  const campHtml=camps.length?camps.map(c=>{const s=mkStatus(c);const audL=(MK_AUD.find(a=>a[0]===c.aud)||MK_AUD[0])[1];
    return `<button class="camp ${s.st}" data-mkopen="${c.id}"><div><div class="nm">${esc(c.name||'Sans titre')}</div><div class="sub">${esc(audL)} · ${s.n} cliente${s.n>1?'s':''}${c.when?' · '+esc(fmtDate(c.when.slice(0,10))+' à '+hhmm(c.when.slice(11,16))):''}</div></div><span class="chip ${mkChip(s.st)}">${s.label}${s.n?` · ${s.sent}/${s.n}`:''}</span><span class="prog"><i style="width:${s.n?(s.sent/s.n*100):0}%"></i></span></button>`}).join(''):`<div class="empty">Aucune campagne pour l'instant. Crée la première : offre, événement, nouveauté…</div>`;
  const campCard=`<div class="card"><div class="ch"><h3>Campagnes</h3><span class="note">${camps.length} campagne${camps.length>1?'s':''}</span><button class="addbtn" data-mknew>+ Nouvelle campagne</button></div><div class="camps">${campHtml}</div></div>`;
  return `<div class="card"><div class="ch"><h3>WhatsApp marketing</h3><span class="chip wa">${I.wa} ${reach.length} cliente${reach.length>1?'s':''} joignable${reach.length>1?'s':''}</span></div>
    <p class="note" style="margin:-6px 0 0">Offres, événements, anniversaires, relances : les messages partent du WhatsApp de la tablette, personnalisés pour chaque cliente. Les clientes sans numéro ou qui ne veulent pas de messages (case « Pas de WhatsApp marketing » dans la base) ne sont jamais incluses.</p>
    <div class="kpis"><div class="kpi ok"><b class="num">${reach.length}</b><span>Joignables</span><small>sur ${clients.rows.length} cliente${clients.rows.length>1?'s':''}</small></div><div class="kpi ${pend.length?'fix':''}"><b class="num">${pend.length}</b><span>Rappels</span><small>à envoyer aujourd'hui</small></div><div class="kpi pole"><b class="num">${sentToday}</b><span>Envoyés</span><small>aujourd'hui</small></div><div class="kpi"><b class="num">${sentMonth}</b><span>Ce mois</span><small>messages marketing</small></div></div></div>
    ${remCard}${campCard}${autoCard}`;
}
function renderCampaign(c){const s=mkStatus(c);const sample=s.aud[0]||{nom:'Prénom Nom'};
  const head=`<div class="card fbh"><div class="ch"><button class="pill" data-mkclose>‹ Toutes les campagnes</button><h3 style="flex:1">${esc(c.name||'Nouvelle campagne')}</h3><span class="chip ${mkChip(s.st)}">${s.label}</span></div></div>`;
  const form=`<div class="card"><h3>Message</h3><div class="fields">
    <label class="h">Nom de la campagne<input data-mk="name" value="${esc(c.name||'')}" placeholder="ex. Offre hammam de novembre" autocomplete="off"></label>
    <label class="h">Modèle<select data-mktpl>${WA_TEMPLATES.map(t=>`<option value="${t.id}" ${t.id===c.tpl?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>
    <label class="wide mkmsg">Texte envoyé<textarea data-mk="msg">${esc(c.msg||'')}</textarea><span class="vars">Personnalisation : <code>{prenom}</code> <code>{nom}</code> · remplace les crochets [ ] par ton contenu</span></label></div>
    <div><h4 class="tsub" style="margin-bottom:6px">Aperçu pour ${esc(sample.nom)}</h4><pre class="preview-wa" id="mkPreview">${esc(mkText(c.msg,sample))}</pre></div></div>`;
  const auds=`<div class="card"><div class="ch"><h3>Destinataires</h3><span class="chip wa">${I.wa} ${s.n} cliente${s.n>1?'s':''}</span></div><div class="auds">${MK_AUD.map(([k,l])=>`<button data-mkaud="${k}" aria-pressed="${(c.aud||'all')===k}">${esc(k==='back'?l+' depuis '+(mk.auto.backDays||30)+' j':l)}<span class="n">${mkAudience(k).length}</span></button>`).join('')}</div>
    <div class="fields"><label class="m">Programmer le<input type="date" data-mk="whenD" value="${esc((c.when||'').slice(0,10))}"></label><label class="s">à<input type="time" data-mk="whenT" value="${esc((c.when||'').slice(11,16))}"></label><span class="note" style="align-self:end;grid-column:span 7">${c.when?'Une notification te préviendra à ce moment-là ; l\'envoi se fait ensuite depuis cette page.':'Sans date : la campagne est à envoyer dès maintenant.'}</span></div></div>`;
  const rows=s.aud.map(x=>rcpRow(x,c.msg,{send:`data-mksend="${c.id}:${x.id}"`,skip:`data-mkskip="${c.id}:${x.id}"`,state:c.sent?.[x.id]?'sent':c.skip?.[x.id]?'skip':'',at:(c.sent?.[x.id]||'').slice(11,16)})).join('');
  const list=`<div class="card"><div class="ch"><h3>Envoi</h3><span class="note">${s.sent}/${s.n} envoyé${s.sent>1?'s':''}${s.skip?' · '+s.skip+' ignoré'+(s.skip>1?'s':''):''}</span><button class="pill" data-mkcopy>Copier le message</button></div>
    <p class="note" style="margin:-6px 0 0">Chaque « Envoyer » ouvre WhatsApp avec le message personnalisé pour la cliente : il n'y a plus qu'à appuyer sur envoyer, puis revenir ici pour la suivante.</p>
    <div class="rcps">${rows||'<div class="empty">Aucune cliente joignable dans cette sélection.</div>'}</div>
    <div class="confirm" style="justify-content:flex-end"><button class="danger" data-mkdel="${c.id}">Supprimer la campagne</button></div></div>`;
  return head+form+auds+list}

/* ---------- événements (délégués) ---------- */
const V=$('#view');
V.addEventListener('click',e=>{
  const t=e.target;const b=t.closest('button');
  const nv=t.closest('[data-view]');if(nv){go(nv.dataset.view);return}
  if(t.closest('[data-stop]'))return;
  const lb=t.closest('img[data-lb]');if(lb){const d=document.createElement('div');d.className='lb';d.innerHTML=`<img src="${lb.getAttribute('src')}" alt="">`;d.onclick=()=>d.remove();document.body.appendChild(d);return}
  const oc=t.closest('[data-opencl]');if(oc&&!b){clientOpen=clientOpen===oc.dataset.opencl?null:oc.dataset.opencl;render();return}
  const of=t.closest('[data-openfiche]');if(of&&!b){fiche=of.dataset.openfiche;const f=fichesToday().find(r=>r.id===fiche);ficheStep=f.sentAt||ficheSteps(f).length?3:1;ficheIntern=false;render();return}
  if(!b){const h=t.closest('header[data-fold]');if(h&&!t.closest('button')){const k=h.dataset.fold;open.has(k)?open.delete(k):open.add(k);render()}return}
  const D=b.dataset;
  // journée
  if(b.classList.contains('fold')){const k=b.closest('header[data-fold]').dataset.fold;open.has(k)?open.delete(k):open.add(k);render();return}
  if(D.s){setCheck(b.closest('.item').dataset.cid,D.s);return}
  if(D.p){const m=team.rows.find(x=>x.id===b.closest('.item').dataset.mid);setPointage(m,D.p);return}
  if(D.toggle){detail.has(D.toggle)?detail.delete(D.toggle):detail.add(D.toggle);render();return}
  if(D.prm){const [id,i]=D.prm.split(':');removePhoto(id,+i);return}
  if(D.allok){CHECKS.filter(g=>D.allok==='all'||g.id===D.allok).forEach(g=>g.items.forEach(([id])=>{const c=checkOf(id);if(!c.s)c.s='ok'}));persist();render();return}
  if(D.allpresent!==undefined){team.rows.forEach(m=>{const n=fullName(m);if(!n||pStatus(staffRow(m)))return;state.regs.staff.push({id:uid(),mid:m.id,nom:n,serv:[m.fonction,m.sec].filter(Boolean).join(' · '),present:true,retard:false,arr:new Date().toTimeString().slice(0,5)})});persist();render();return}
  if(D.editmember){editMember=D.editmember;render();return}
  if(D.editdone!==undefined){editMember=null;render();return}
  if(D.delmember){team.rows=team.rows.filter(x=>x.id!==D.delmember);editMember=null;persistTeam();render();return}
  if(D.addmember!==undefined){const m={id:uid(),sec:'Autre',prenom:'',nom:'',fonction:''};team.rows.push(m);editMember=m.id;open.add('staff');persistTeam();render();const i=V.querySelector(`[data-mid="${m.id}"] input`);if(i){i.focus();i.closest('.item').scrollIntoView({block:'center',behavior:'smooth'})}return}
  // compte rendu
  if(D.copy!==undefined){const txt=$('#crtext')?.textContent||'';navigator.clipboard?.writeText(txt).then(()=>{b.textContent='✓ Copié';setTimeout(()=>b.textContent='Copier le texte',1800)}).catch(()=>{const r=document.createRange();r.selectNodeContents($('#crtext'));const s=getSelection();s.removeAllRanges();s.addRange(r)});return}
  if(D.share!==undefined){const txt=$('#crtext')?.textContent||'';navigator.share({title:'AVA Bay — compte rendu',text:txt}).catch(()=>{});return}
  // fiches clientes
  if(D.newfiche!==undefined){pickQ='';const f={id:uid(),h:new Date().toTimeString().slice(0,5),steps:[],st:'open'};state.regs.client.push(f);fiche=f.id;ficheStep=1;persist();render();const i=V.querySelector('input[data-fk=prenom]');i&&i.focus();return}
  if(D.openfiche){fiche=D.openfiche;const f=fichesToday().find(r=>r.id===fiche);ficheStep=f.sentAt||ficheSteps(f).length?3:1;ficheIntern=false;render();return}
  if(D.closefiche!==undefined){fiche=null;render();return}
  if(D.fstep){const f=fichesToday().find(r=>r.id===fiche);if(+D.fstep===3&&f&&!ficheSteps(f).length){const n=b.closest('.fnav').querySelector('.note');if(n){n.textContent='Sélectionne au moins une envie ci-dessus';n.style.color='var(--urg)'}return}ficheStep=+D.fstep;render();window.scrollTo({top:0});return}
  if(D.pick){const f=fichesToday().find(r=>r.id===fiche);const c=clients.rows.find(x=>x.id===D.pick);const parts=(c.nom||'').trim().split(' ');Object.assign(f,{clientId:c.id,prenom:parts[0]||'',nom:parts.slice(1).join(' '),tel:c.tel||f.tel||'',email:c.email||'',social:c.social||'',bday:c.bday||''});f.nomComplet=ficheName(f);pickQ='';persist();render();return}
  if(D.unlink!==undefined){const f=fichesToday().find(r=>r.id===fiche);delete f.clientId;persist();render();return}
  if(D.venue){const f=fichesToday().find(r=>r.id===fiche);f.venue=f.venue===D.venue?'':D.venue;persist();render();return}
  if(D.act){const f=fichesToday().find(r=>r.id===fiche);const st=ficheSteps(f);const i=st.findIndex(x=>x.act===D.act);if(i>=0)st.splice(i,1);else st.push({id:uid(),zone:D.zone,act:D.act,time:'',dispo:'',ok:false});f.presta=st.map(x=>x.act);persist();render();return}
  if(D.rmstep){const f=fichesToday().find(r=>r.id===fiche);f.steps=ficheSteps(f).filter(x=>x.id!==D.rmstep);f.presta=f.steps.map(x=>x.act);persist();render();return}
  if(D.savefiche!==undefined){const f=fichesToday().find(r=>r.id===fiche);f.saved=true;upsertClient(f);persist();render();return}
  if(D.intern!==undefined){ficheIntern=!ficheIntern;render();return}
  if(D.delfiche){if(!b.classList.contains('confirm')){b.classList.add('confirm');b.textContent='Confirmer la suppression';setTimeout(()=>{b.classList.remove('confirm');b.textContent='Supprimer cette fiche'},3000);return}state.regs.client=state.regs.client.filter(r=>r.id!==D.delfiche);fiche=null;persist();render();return}
  // whatsapp marketing
  if(D.notif!==undefined){if(!('Notification' in window))return;Notification.requestPermission().then(p=>{render();if(p==='granted')notify('Notifications activées','Tu seras prévenue ici pour les campagnes programmées et les rappels du jour.','mk-on')});return}
  if(D.mknew!==undefined){const t0=WA_TEMPLATES[0];const c={id:uid(),name:'',tpl:t0.id,msg:t0.msg,aud:'all',when:'',sent:{},skip:{},created:nowLocal()};mk.campaigns.push(c);mkOpen=c.id;persistMk();render();window.scrollTo({top:0});const i=V.querySelector('input[data-mk=name]');i&&i.focus();return}
  if(D.mkopen){mkOpen=D.mkopen;render();window.scrollTo({top:0});return}
  if(D.mkclose!==undefined){mkOpen=null;render();return}
  if(D.mkaud){const c=mk.campaigns.find(x=>x.id===mkOpen);if(c){c.aud=D.mkaud;persistMk();render()}return}
  if(D.mkskip){const [cid,id]=D.mkskip.split(':');const c=mk.campaigns.find(x=>x.id===cid);const cl=clients.rows.find(x=>x.id===id);if(c&&cl){(c.skip=c.skip||{})[id]=nowLocal();mkLog({key:'camp:'+cid+':'+id,kind:'camp',camp:c.name,cid:id,nom:cl.nom,skipped:true});render()}return}
  if(D.rmskip){const [,kind,id]=D.rmskip.split(':');const cl=clients.rows.find(x=>x.id===id);mkLog({key:D.rmskip,kind,cid:id,nom:cl?.nom||'',skipped:true});render();return}
  if(D.mkcopy!==undefined){const c=mk.campaigns.find(x=>x.id===mkOpen);navigator.clipboard?.writeText(c?.msg||'').then(()=>{b.textContent='✓ Copié';setTimeout(()=>b.textContent='Copier le message',1800)}).catch(()=>{});return}
  if(D.mkdel){if(!b.classList.contains('confirm')){b.classList.add('confirm');b.textContent='Confirmer la suppression';setTimeout(()=>{b.classList.remove('confirm');b.textContent='Supprimer la campagne'},3000);return}mk.campaigns=mk.campaigns.filter(x=>x.id!==D.mkdel);mkOpen=null;persistMk();render();return}
  // clientes
  if(D.addclient!==undefined){const c={id:uid(),nom:'',tel:'',email:'',pref:'',notes:'',vip:false,visits:[]};clients.rows.unshift(c);clientOpen=c.id;clientFilter='all';clientQ='';persistClients();render();const f=V.querySelector('.ce input');f&&f.focus();return}
  if(D.cf){clientFilter=D.cf;render();return}
  if(D.closecl!==undefined){clientOpen=null;render();return}
  if(D.newfrom){const c=clients.rows.find(x=>x.id===D.newfrom);const parts=(c.nom||'').trim().split(' ');const f={id:uid(),h:new Date().toTimeString().slice(0,5),steps:[],st:'open',prenom:parts[0]||'',nom:parts.slice(1).join(' '),tel:c.tel||'',email:c.email||'',social:c.social||'',bday:c.bday||''};f.nomComplet=ficheName(f);state.regs.client.push(f);persist();view='fiches';fiche=f.id;ficheStep=2;render();window.scrollTo({top:0});return}
  if(D.delclient){if(!b.classList.contains('confirm')){b.classList.add('confirm');b.textContent='Confirmer la suppression';setTimeout(()=>{b.classList.remove('confirm');b.textContent='Supprimer la cliente'},3000);return}clients.rows=clients.rows.filter(c=>c.id!==D.delclient);clientOpen=null;persistClients();render();return}
});
V.addEventListener('click',e=>{const wa=e.target.closest('a[data-sendwa]');if(wa){if(wa.dataset.sendwa!=='1'){e.preventDefault();const h=$('#waHint');if(h){h.hidden=false;h.style.color='var(--urg)';h.style.fontWeight='600'}return}const f=fichesToday().find(r=>r.id===fiche);wa.setAttribute('href',waLink(f));f.saved=true;f.sentAt=new Date().toTimeString().slice(0,5);upsertClient(f);persist();setTimeout(render,300)}});
V.addEventListener('click',e=>{const a=e.target.closest('a[data-mksend],a[data-rmsend]');if(!a)return;
  if(a.dataset.mksend){const [cid,id]=a.dataset.mksend.split(':');const c=mk.campaigns.find(x=>x.id===cid);const cl=clients.rows.find(x=>x.id===id);if(!c||!cl)return;(c.sent=c.sent||{})[id]=nowLocal();mkLog({key:'camp:'+cid+':'+id,kind:'camp',camp:c.name,cid:id,nom:cl.nom})}
  else{const [,kind,id]=a.dataset.rmsend.split(':');const cl=clients.rows.find(x=>x.id===id);mkLog({key:a.dataset.rmsend,kind,cid:id,nom:cl?.nom||''})}
  setTimeout(render,400)});
V.addEventListener('input',e=>{
  const t=e.target;const D=t.dataset;
  if((D.fk==='bday'||D.c==='bday')&&!/^delete/.test(e.inputType||'')){const m=bdayMask(t.value);if(m!==t.value)t.value=m}
  if(t.id==='clientQ'){clientQ=t.value;rerenderKeepFocus();return}
  if(t.id==='ficheQ'){ficheQ=t.value;const el=$('#fcs');if(el)el.innerHTML=ficheCards();return}
  if(t.id==='pickQ'){pickQ=t.value;const el=$('#picks');if(el)el.innerHTML=pickResults();return}
  // journée
  if(D.note!==undefined){state.bilan.note=t.value;persist();return}
  if(D.f){const id=t.closest('.item').dataset.cid;const c=checkOf(id);if(t.value)c[D.f]=t.value;else delete c[D.f];if(D.f==='note'&&t.value&&!c.s)c.s='fix';persist();return}
  if(D.pf){const mid=t.closest('.item').dataset.mid;const m=team.rows.find(x=>x.id===mid);let r=staffRow(m);if(!r){const n=fullName(m);if(!n)return;r={id:uid(),mid:m.id,nom:n,serv:[m.fonction,m.sec].filter(Boolean).join(' · ')};state.regs.staff.push(r)}if(t.value)r[D.pf]=t.value;else delete r[D.pf];persist();return}
  if(D.m){const mid=t.closest('.item').dataset.mid;const m=team.rows.find(x=>x.id===mid);const old=fullName(m);m[D.m]=t.value;const r=state.regs.staff.find(x=>x.mid===mid)||state.regs.staff.find(x=>!x.mid&&x.nom===old);if(r&&(D.m==='prenom'||D.m==='nom'))r.nom=fullName(m);persistTeam();if(r)persist();return}
  // whatsapp marketing
  if(D.mk){const c=mk.campaigns.find(x=>x.id===mkOpen);if(!c)return;if(D.mk==='whenD'||D.mk==='whenT'){const d=D.mk==='whenD'?t.value:(c.when||'').slice(0,10);const h=D.mk==='whenT'?t.value:((c.when||'').slice(11,16)||'10:00');c.when=d?d+'T'+(h||'10:00'):'';c.notified=false}else c[D.mk]=t.value;persistMk();if(D.mk==='msg'){const p=$('#mkPreview');if(p){const sm=mkStatus(c).aud[0]||{nom:'Prénom Nom'};p.textContent=mkText(c.msg,sm)}}return}
  if(D.auto){if(t.type==='checkbox')mk.auto[D.auto]=t.checked;else if(D.auto==='backDays')mk.auto.backDays=Math.min(365,Math.max(1,+t.value||30));else mk.auto[D.auto]=t.value;persistMk();return}
  // fiches / clientes
  if(D.fk){const f=fichesToday().find(r=>r.id===fiche);if(!f)return;f[D.fk]=D.fk==='bday'?bdayStore(t.value):t.value;if(D.fk==='prenom'||D.fk==='nom')f.nomComplet=ficheName(f);persist();if(['montant','type','motif','dep'].includes(D.fk)&&f.saved)upsertClient(f);return}
  if(D.sk){const f=fichesToday().find(r=>r.id===fiche);const x=ficheSteps(f).find(x=>x.id===t.closest('.pstep').dataset.sid);if(!x)return;x[D.sk]=t.type==='checkbox'?t.checked:t.value;persist();return}
  if(D.c){const c=clients.rows.find(r=>r.id===t.closest('.cl').dataset.cid);if(!c)return;c[D.c]=t.type==='checkbox'?t.checked:D.c==='bday'?bdayStore(t.value):t.value;persistClients();if(D.c==='vip')t.closest('.cl').classList.toggle('vip',c.vip);return}
});
V.addEventListener('change',e=>{
  const t=e.target;const D=t.dataset;
  if(t.id==='addAct'&&t.value){const f=fichesToday().find(r=>r.id===fiche);const [z,a]=t.value.split('|');ficheSteps(f).push({id:uid(),zone:z,act:a,time:'',dispo:'',ok:false});f.presta=f.steps.map(x=>x.act);persist();render();return}
  if(D.sk||D.fk){if(t.type==='checkbox'||D.sk==='time'||D.fk==='type'||D.fk==='st'||(D.fk==='tel'&&ficheStep===3))render();return}
  if(D.photo!==undefined){const fs=t.files;if(!fs||!fs.length)return;const btn=t.closest('.pbtn');btn.classList.add('busy');btn.querySelector('span').textContent='Envoi…';addPhotos(D.photo,fs);return}
  if(D.f||D.pf){render();return}
  if(D.mktpl!==undefined){const c=mk.campaigns.find(x=>x.id===mkOpen);if(c){c.tpl=t.value;c.msg=mkTpl(t.value).msg;persistMk();render()}return}
  if(D.mk||(D.auto&&D.auto!=='hour')){render();return}
  if(D.m==='sec'){render();return}
  if(D.c&&(D.c==='nom'||D.c==='tel'||D.c==='vip')){render();return}
});
function rerenderKeepFocus(){const id=document.activeElement?.id;const pos=document.activeElement?.selectionStart;render();const el=id&&document.getElementById(id);if(el){el.focus();try{el.setSelectionRange(pos,pos)}catch(x){}}}

/* ---------- en-tête, navigation basse ---------- */
$('#brandBtn').onclick=()=>go('jour');
$('#date').addEventListener('change',e=>{if(e.target.value)switchDay(e.target.value)});
function shiftDay(n){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);switchDay(d.toISOString().slice(0,10))}
$('#prevDay').onclick=()=>shiftDay(-1);$('#nextDay').onclick=()=>shiftDay(1);
function renderBnav(mkp){
  const cs=checkStats();if(mkp===undefined)mkp=mkPending();
  $('#bnav').innerHTML=VIEWS.map(([id,l,ic])=>`<button data-nav="${id}" aria-selected="${view===id}" style="--pc:var(--accent);--pcs:var(--accent-soft)"><span class="ic">${ic}</span>${l}${id==='jour'&&cs.fix?`<span class="b">${cs.fix}</span>`:''}${id==='wa'&&mkp?`<span class="b">${mkp}</span>`:''}</button>`).join('');
}
$('#bnav').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;go(b.dataset.nav)});

/* ---------- apparence ---------- */
const FONTS=[['ava','Cormorant + Jost (AVA Bay)','"Cormorant Garamond",Georgia,serif','"Jost",system-ui,sans-serif'],['brico','Bricolage + Karla','"Bricolage Grotesque",system-ui,sans-serif','"Karla",system-ui,sans-serif'],['dm','DM Serif + DM Sans','"DM Serif Display",Georgia,serif','"DM Sans",system-ui,sans-serif'],['manrope','Manrope','"Manrope",system-ui,sans-serif','"Manrope",system-ui,sans-serif'],['nunito','Nunito (rond)','"Nunito",system-ui,sans-serif','"Nunito",system-ui,sans-serif'],['inter','Inter','"Inter",system-ui,sans-serif','"Inter",system-ui,sans-serif'],['system','Police du système','system-ui,-apple-system,sans-serif','system-ui,-apple-system,sans-serif']];
let appear={theme:'light',font:'ava',size:'15px'};
try{const j=localStorage.getItem(LS+'appear');if(j)appear=Object.assign(appear,JSON.parse(j))}catch(e){}
function applyAppear(){const r=document.documentElement;if(appear.theme==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',appear.theme);
  const f=FONTS.find(x=>x[0]===appear.font)||FONTS[0];r.style.setProperty('--fd',f[2]);r.style.setProperty('--fb',f[3]);r.style.setProperty('--fs',appear.size||'15px');
  $('#fontSeg').innerHTML=FONTS.map(x=>`<button data-font="${x[0]}" aria-pressed="${x[0]===f[0]}" style="font-family:${x[3]}"><span style="font-family:${x[2]};font-weight:600">${x[1]}</span><small>Aa 123</small></button>`).join('');
  for(const b of document.querySelectorAll('#sizeSeg button'))b.setAttribute('aria-pressed',b.dataset.size===(appear.size||'15px'));
  for(const b of document.querySelectorAll('#themeSeg button'))b.setAttribute('aria-pressed',b.dataset.theme===appear.theme);
  try{localStorage.setItem(LS+'appear',JSON.stringify(appear))}catch(e){}}
$('#appearBtn').onclick=()=>{const p=$('#pop');p.hidden=!p.hidden;$('#appearBtn').setAttribute('aria-expanded',!p.hidden)};
document.addEventListener('click',e=>{if(e.target.isConnected&&!e.target.closest('.appear')){$('#pop').hidden=true;$('#appearBtn').setAttribute('aria-expanded','false')}});
$('#themeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;appear.theme=b.dataset.theme;applyAppear()});
$('#fontSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;appear.font=b.dataset.font;applyAppear()});
$('#sizeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;appear.size=b.dataset.size;applyAppear()});
$('#appearReset').onclick=()=>{appear={theme:'light',font:'ava',size:'15px'};applyAppear()};
applyAppear();

/* ---------- stockage serveur (hébergement AVA Bay, dossier séparé de la version publique) ---------- */
const SERVER_MODE=/avabay-marrakech\.com$/.test(location.hostname);
function accessCode(){try{return localStorage.getItem(LS+'code')||''}catch(e){return ''}}
function serverDB(){
  const call=async(q,opt={})=>{const r=await fetch('api.php?'+q,Object.assign({cache:'no-store',headers:{'X-Ava-Code':accessCode(),'Content-Type':'application/json'}},opt));
    if(r.status===401){showGate('Le code d\'accès n\'est plus valide.');throw {code:'not_granted'}}if(!r.ok)throw {code:'unavailable'};return r.json()};
  const snap=(d,id)=>({id,exists:!!d.exists,data:()=>d.exists?clone(d.data):undefined,metadata:{hasPendingWrites:false,fromCache:false}});
  const poll=(fetcher,cb,err)=>{let last=null,stop=false;const tick=async()=>{if(stop)return;if(Date.now()-lastEditAt>4000){try{const res=await fetcher();const j=JSON.stringify(res);if(j!==last){last=j;cb(res)}}catch(e){err&&err(e)}}if(!stop)setTimeout(tick,document.hidden?30000:8000)};tick();return()=>{stop=true}};
  return {
    doc(path){const q='path='+encodeURIComponent(path);return {
      get:async()=>snap(await call('action=get&'+q),path.split('/').pop()),
      set:async body=>{await call('action=set&'+q,{method:'POST',body:JSON.stringify(body)})},
      onSnapshot:(cb,err)=>poll(()=>call('action=get&'+q),d=>cb(snap(d,path.split('/').pop())),err)}},
    collection(path){return {onSnapshot:(cb,err)=>poll(()=>call('action=list&prefix='+encodeURIComponent(path+'/')),res=>{const docs=res.docs.map(x=>({id:x.id,exists:true,data:()=>clone(x.data),metadata:{hasPendingWrites:false}}));cb({docs,empty:!docs.length,size:docs.length})},err)}}
  };
}
function showGate(msg,setup){
  let g=$('#gate');if(!g){g=document.createElement('div');g.id='gate';document.body.appendChild(g)}
  g.innerHTML=`<div class="gin"><img src="${$('.brand .mark img')?.src||''}" alt=""><h2>${setup?'Créer le code d\'accès':'Code d\'accès'}</h2>
    <p>${setup?'Première connexion : choisis le code que toute l\'équipe utilisera (8 caractères minimum). Il protège la base clientes et les données de la journée.':'Saisis le code d\'accès de l\'équipe AVA Bay pour ouvrir les données partagées.'}</p>
    ${msg?`<p class="gerr">${esc(msg)}</p>`:''}
    <input type="password" id="gcode" placeholder="Code d'accès" autocomplete="current-password">${setup?'<input type="password" id="gcode2" placeholder="Confirmer le code" autocomplete="new-password">':''}
    <button class="addbtn" id="gok">${setup?'Créer le code':'Ouvrir'}</button><button class="gskip" id="gskip">Continuer sans synchronisation</button></div>`;
  g.hidden=false;$('#gcode').focus();
  $('#gskip').onclick=()=>{g.hidden=true;syncBanner(false)};
  $('#gok').onclick=async()=>{const c=$('#gcode').value.trim();
    if(setup){if(c.length<8)return showGate('Le code doit faire au moins 8 caractères.',true);if(c!==$('#gcode2').value.trim())return showGate('Les deux codes ne correspondent pas.',true);
      const r=await fetch('api.php?action=setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:c})});if(!r.ok)return showGate('Création impossible ('+r.status+').',true)}
    try{localStorage.setItem(LS+'code',c)}catch(e){}
    const t=await fetch('api.php?action=get&path=clients%2Fliste',{headers:{'X-Ava-Code':c},cache:'no-store'});
    if(t.status===401)return showGate('Code incorrect.');if(!t.ok)return showGate('Serveur injoignable.');
    g.hidden=true;connectServer()};
  $('#gcode').onkeydown=e=>{if(e.key==='Enter')$('#gok').click()};
}
function syncBanner(ok){let b=document.getElementById('nosync');
  if(ok){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.id='nosync';document.body.insertBefore(b,document.body.firstChild)}
  b.className=SERVER_MODE?'':'demo';
  b.innerHTML=SERVER_MODE?'⚠ <b>Non synchronisé</b> — ces saisies restent sur cet appareil et ne seront pas dans le compte rendu de 11h / 20h. <button type="button" id="nsgo">Saisir le code d\'accès</button>'
    :'<b>Démo</b> — version d\'essai de la nouvelle checklist. Les saisies restent sur cet appareil ; l\'application de l\'équipe n\'est pas modifiée.';
  const g=document.getElementById('nsgo');if(g)g.onclick=()=>showGate('')}
async function connectServer(){db=serverDB();setSync('on','Synchronisé');subscribeDay();subscribeGlobals()}
async function initServer(){
  if(location.protocol!=='https:'){location.replace('https://'+location.host+location.pathname);return}
  try{const st=await (await fetch('api.php?action=status',{cache:'no-store'})).json();
    if(st.setup)return showGate('',true);
    if(!accessCode())return showGate('');
    const t=await fetch('api.php?action=get&path=clients%2Fliste',{headers:{'X-Ava-Code':accessCode()},cache:'no-store'});
    if(t.status===401)return showGate('');
    connectServer();
  }catch(e){setSync('','Hors ligne (local)');syncBanner(false)}
}

/* ---------- démarrage ---------- */
function start(){
  state=loadLocal(day)||blank();
  const ld=k=>{try{const j=localStorage.getItem(k);return j?JSON.parse(j):null}catch(e){return null}};
  /* première ouverture sur cet appareil : on reprend l'équipe et la base clientes de l'application actuelle si elles existent (même navigateur) */
  const t=ld(LS+'team')||ld('ava-team');if(t&&t.rows)team=t;
  const c=ld(LS+'clients')||ld('ava-clients');if(c&&c.rows)clients=c;
  const m=ld(LS+'marketing');if(m)mk=normMk(m);
  render();
  /* rappels et campagnes programmées : vérification à l'ouverture puis chaque minute */
  setTimeout(mkTick,1500);setInterval(mkTick,60000);
  if(SERVER_MODE)initServer();else syncBanner(false);
}
start();
window.addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
