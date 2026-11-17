import * as pdfjs from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
import {t, translateInterface, setLanguage, onLanguageChange} from './i18n.js';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const $ = (id) => document.getElementById(id);
const standard = {
  'PDF standard': ['Helvetica','Times New Roman','Courier New'],
  'Microsoft / Windows': ['Aptos','Aptos Display','Arial','Arial Narrow','Arial Black','Bahnschrift','Calibri','Cambria','Candara','Cascadia Code','Century Gothic','Comic Sans MS','Consolas','Constantia','Corbel','Ebrima','Franklin Gothic Medium','Gabriola','Gadugi','Georgia','Impact','Lucida Console','Malgun Gothic','Microsoft Sans Serif','Microsoft YaHei','Palatino Linotype','Segoe Print','Segoe Script','Segoe UI','Segoe UI Emoji','Tahoma','Trebuchet MS','Verdana','Yu Gothic'],
  'Apple / macOS': ['American Typewriter','Andale Mono','Apple Chancery','Avenir','Avenir Next','Baskerville','Big Caslon','Chalkboard','Cochin','Copperplate','Didot','Futura','Geneva','Helvetica Neue','Hiragino Sans','Hoefler Text','Marker Felt','Menlo','Monaco','New York','Noteworthy','Optima','Palatino','San Francisco','SF Pro Text','Skia','Snell Roundhand'],
  'Libre / Linux': ['Arimo','Atkinson Hyperlegible','Bitter','Carlito','DejaVu Sans','DejaVu Sans Mono','DejaVu Serif','Droid Sans','Fira Code','Fira Sans','IBM Plex Mono','IBM Plex Sans','IBM Plex Serif','Inconsolata','Inter','JetBrains Mono','Lato','Liberation Mono','Liberation Sans','Liberation Serif','Linux Libertine','Merriweather','Montserrat','Noto Sans','Noto Sans Arabic','Noto Sans CJK JP','Noto Sans CJK KR','Noto Sans CJK SC','Noto Sans Devanagari','Noto Sans Thai','Noto Sans Vietnamese','Noto Serif','Open Sans','Oswald','Poppins','Roboto','Roboto Condensed','Roboto Mono','Source Code Pro','Source Sans 3','Source Serif 4','Ubuntu','Ubuntu Mono','Work Sans']
};
const state = {
  pages:[], source:null, reader:null, selected:null, active:0, tool:'select', zoom:1,
  history:[], future:[], fonts:new Map(), urls:[], generation:0, rasterVersion:0, zoomMode:'custom',
  defaults:{family:'Helvetica',size:16,color:'#202124',bold:false,italic:false,underline:false,align:'left'}
};
let seed=0, notifyTimer=0, drag=null;
// Large PDFs are only rasterized and text-indexed when their pages enter the viewport.
let pageObserver=null, thumbObserver=null, pageRenderQueue=[], concurrentPageRenders=0;
const visiblePageIndices=new Set(), activePdfTasks=new Map(), enqueuedPages=new Set(), renderingPages=new Set();
const pendingTextPages=new Map();
const MAX_PDF_RENDERERS=2, MAX_CANVAS_PIXELS=9000000;
const uid=()=> 'item-'+(++seed)+'-'+Date.now().toString(36);
const clone=(v)=>JSON.parse(JSON.stringify(v));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const focusInForm=()=>{const a=document.activeElement;return a && (a.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(a.tagName));};
const PDF=()=>window.PDFLib;
function toast(message,duration=4500){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>$('toast').hidden=true,duration);}
function status(message){$('status').textContent=message;}
function current(){if(!state.selected)return null;const page=state.pages[state.selected.page];const item=page?.items.find(x=>x.id===state.selected.id);return item?{page,item,index:state.selected.page}:null;}
function snapshot(){
  // PDF.js may extract thousands of glyphs per page; do not clone text hit arrays.
  return {pages:state.pages.map(({w,h,original,items})=>({
    w,h,original,hits:null,items:clone(items)
  })),selected:clone(state.selected),active:state.active};
}
function record(){state.history.push(snapshot());if(state.history.length>70)state.history.shift();state.future=[];syncUndo();}
function restore(v){
  const hits=new Map(state.pages.filter(p=>p.original!==null&&p.hits).map(p=>[p.original,p.hits]));
  state.pages=clone(v.pages);
  for(const page of state.pages)if(page.original!==null)page.hits=hits.get(page.original)||null;
  state.selected=v.selected;state.active=v.active;renderAll();
}
function undo(){if(!state.history.length)return;state.future.push(snapshot());restore(state.history.pop());syncUndo();}
function redo(){if(!state.future.length)return;state.history.push(snapshot());restore(state.future.pop());syncUndo();}
function syncUndo(){$('undo').disabled=!state.history.length;$('redo').disabled=!state.future.length;}
function select(index,id){state.selected=id?{page:index,id}:null;state.active=index;syncSelection();}
function setTool(tool){state.tool=tool;['select','text','rect','highlight'].forEach(t=>$('tool-'+t).classList.toggle('active',t===tool));document.querySelectorAll('.paper').forEach(p=>p.classList.toggle('text-mode',tool!=='select'));status(tool==='select'?t('Mode sélection'):t('Outil {tool} : cliquez sur la page',{tool:t(({text:'Zone de texte',rect:'Rectangle',highlight:'Surligneur'})[tool])}));}
function fontList(){
  const select=$('font-family');select.replaceChildren();
  for(const [group,names] of Object.entries(standard)){
    const opt=document.createElement('optgroup');opt.dataset.translationKey=group;opt.label=t(group);
    for(const name of [...new Set(names)])opt.append(new Option(name,name));
    select.append(opt);
  }
  const imported=document.createElement('optgroup');imported.dataset.translationKey='Importées — incorporables';imported.label=t('Importées — incorporables');imported.id='imported-fonts';select.append(imported);
  select.value=state.defaults.family;
}
function add(pageIndex,kind,x=60,y=65,options={}){
  const page=state.pages[pageIndex];if(!page)return;
  record();
  const spec=clone(state.defaults);
  const item={id:uid(),kind,x:clamp(x,0,page.w-8),y:clamp(y,0,page.h-8),w:kind==='text'?260:145,h:kind==='text'?46:50,
    content:kind==='text'?t('Votre texte'):'',family:spec.family,size:spec.size,color:spec.color,bold:spec.bold,italic:spec.italic,underline:spec.underline,align:spec.align,replace:false,...options};
  item.w=clamp(item.w,8,page.w-item.x);item.h=clamp(item.h,8,page.h-item.y);
  page.items.push(item);select(pageIndex,item.id);renderItems(pageIndex);renderThumbs();
  if(kind==='text'){const el=document.querySelector('[data-item-id="'+item.id+'"] .editable-text');el?.focus();if(el){document.getSelection()?.selectAllChildren(el);}}
  return item;
}
function removeSelected(){const sel=current();if(!sel)return;record();sel.page.items=sel.page.items.filter(x=>x.id!==sel.item.id);select(sel.index,null);renderItems(sel.index);renderThumbs();}
function duplicate(){const sel=current();if(!sel)return;record();const i=clone(sel.item);i.id=uid();i.x=clamp(i.x+14,0,sel.page.w-i.w);i.y=clamp(i.y+14,0,sel.page.h-i.h);sel.page.items.push(i);select(sel.index,i.id);renderItems(sel.index);renderThumbs();}
function syncSelection(){
  document.querySelectorAll('.item').forEach(el=>el.classList.toggle('selected',el.dataset.itemId===state.selected?.id));
  document.querySelectorAll('.thumb').forEach(el=>el.classList.toggle('active',Number(el.dataset.index)===state.active));
  $('page-status').textContent=state.pages.length?t('Page {n} / {count}',{n:state.active+1,count:state.pages.length}):t('Aucun document');
  const s=current();$('no-selection').hidden=!!s;$('selection-properties').hidden=!s;
  if(!s)return;
  const o=s.item;
  $('object-content').parentElement.hidden=o.kind!=='text';
  $('object-content').value=o.content||'';
  for(const [field,prop] of [['object-x','x'],['object-y','y'],['object-width','w'],['object-height','h']])$(field).value=Math.round(o[prop]);
  $('font-family').value=o.family;
  if(!$('font-family').value)$('font-family').value='Helvetica';
  $('font-size').value=o.size;
  $('font-color').value=o.color;
  ['bold','italic','underline'].forEach(k=>$(k).classList.toggle('active',!!o[k]));
  ['left','center','right'].forEach(k=>$('align-'+k).classList.toggle('active',o.align===k));
  $('font-warning').textContent=t(state.fonts.has(o.family)?'Police importée : sera incorporée à l’export.':'Police non importée : l’export PDF utilisera une famille standard proche. Importez le TTF/OTF pour un rendu fidèle.');
}
function changeStyle(key,value){
  const s=current();if(s){record();s.item[key]=value;renderItems(s.index);syncSelection();renderThumbs();}
  else{state.defaults[key]=value;}
  if(key==='family' && !state.fonts.has(value) && !['Helvetica','Times New Roman','Courier New'].includes(value))toast(t('Police système : à importer en TTF/OTF pour l’incorporer au PDF.'));
}
function applyGeometry(){
  const s=current();if(!s)return;record();
  const o=s.item;
  o.x=clamp(Number($('object-x').value)||0,0,s.page.w-8);
  o.y=clamp(Number($('object-y').value)||0,0,s.page.h-8);
  o.w=clamp(Number($('object-width').value)||8,8,s.page.w-o.x);
  o.h=clamp(Number($('object-height').value)||8,8,s.page.h-o.y);
  renderItems(s.index);syncSelection();renderThumbs();
}
function element(tag,classes){const el=document.createElement(tag);if(classes)el.className=classes;return el;}
function renderItems(index,skipSelectionSync=false){
  const page=state.pages[index];const host=document.querySelector('.page-card[data-index="'+index+'"] .item-layer');if(!host)return;
  host.replaceChildren();
  const scale=state.zoom;
  for(const o of page.items){
    const box=element('div','item '+(o.kind==='text'?'text-item':'shape-item')+(o.replace?' replace':''));
    box.dataset.itemId=o.id;
    box.style.left=(o.x*scale)+'px';box.style.top=(o.y*scale)+'px';box.style.width=(o.w*scale)+'px';box.style.height=(o.h*scale)+'px';
    if(o.kind==='text'){
      const edit=element('div','editable-text');
      edit.contentEditable='true';edit.spellcheck=true;edit.setAttribute('role','textbox');edit.setAttribute('aria-label',t('Texte éditable'));
      edit.textContent=o.content;
      edit.style.fontFamily='"'+o.family.replace(/"/g,'')+'", Arial, sans-serif';
      edit.style.fontSize=(o.size*scale)+'px';edit.style.color=o.color;
      edit.style.fontWeight=o.bold?'bold':'normal';edit.style.fontStyle=o.italic?'italic':'normal';
      edit.style.textDecoration=o.underline?'underline':'none';edit.style.textAlign=o.align;
      edit.addEventListener('focus',()=>{select(index,o.id);record();});
      edit.addEventListener('input',()=>{o.content=edit.innerText.replace(/\r/g,'');$('object-content').value=o.content;});
      edit.addEventListener('blur',()=>renderThumbs());
      box.append(edit);
    }else{
      box.style.backgroundColor=o.color;
      box.style.opacity=o.kind==='highlight'?'0.35':'0.75';
      if(o.kind==='highlight')box.style.mixBlendMode='multiply';
    }
    box.addEventListener('pointerdown',(ev)=>{if(ev.target.closest('.drag-handle'))return;select(index,o.id);ev.stopPropagation();});
    const handle=element('button','drag-handle');handle.type='button';handle.innerHTML='<span class="mi">drag_indicator</span> '+t('Déplacer');
    handle.addEventListener('pointerdown',(ev)=>{ev.preventDefault();ev.stopPropagation();select(index,o.id);record();drag={id:o.id,page:index,clientX:ev.clientX,clientY:ev.clientY,x:o.x,y:o.y};});
    box.prepend(handle);host.append(box);
  }
  if(!skipSelectionSync)syncSelection();
}
function fillTextHits(index,layer){
  const page=state.pages[index];layer.replaceChildren();
  if(!page.hits)return;
  const scale=state.zoom;
  for(const hit of page.hits){
    if(!hit.text.trim())continue;
    const h=element('button','pdf-text-hit');h.type='button';
    h.style.left=(hit.x*scale)+'px';h.style.top=(hit.y*scale)+'px';
    h.style.width=(hit.w*scale)+'px';h.style.height=(hit.h*scale)+'px';
    h.title=t('Remplacer visuellement : {text}',{text:hit.text.slice(0,85)});
    h.setAttribute('aria-label',t('Remplacer {text}',{text:hit.text.slice(0,65)}));
    h.addEventListener('click',(ev)=>{
      ev.preventDefault();ev.stopPropagation();
      if(state.tool!=='select')return;
      const obj=add(index,'text',hit.x,hit.y,{w:Math.max(30,hit.w+12),h:Math.max(20,hit.h*1.45),content:hit.text,size:Math.max(8,hit.h*.9),replace:true});
      if(obj)toast(t('Correction visuelle : le texte d’origine demeure dans le PDF et reste extractible.'));
    });
    layer.append(h);
  }
}
function stopRasterJobs() {
  for(const task of activePdfTasks.values()){
    try{task.cancel();}catch{ /* task may be finished */ }
  }
  activePdfTasks.clear();
  pageRenderQueue=[];
  enqueuedPages.clear();
}
function cancelPageRendering() {
  pageObserver?.disconnect();pageObserver=null;
  thumbObserver?.disconnect();thumbObserver=null;
  stopRasterJobs();
  visiblePageIndices.clear();
  pendingTextPages.clear();
}
const rasterKey=(pageIndex,version)=>version+':'+pageIndex;
function queuePageRender(index,version=state.rasterVersion) {
  if(!state.reader||!state.pages[index]||state.pages[index].original===null||!visiblePageIndices.has(index))return;
  const card=document.querySelector('.page-card[data-index="'+index+'"]');
  if(!card||card.dataset.rendered===String(version)||enqueuedPages.has(index))return;
  if(renderingPages.has(rasterKey(index,version))){card.dataset.retry='1';return;}
  enqueuedPages.add(index);
  pageRenderQueue.push({index,version});
  processPageRenderQueue();
}
function processPageRenderQueue() {
  while(concurrentPageRenders<MAX_PDF_RENDERERS && pageRenderQueue.length){
    const job=pageRenderQueue.shift();
    enqueuedPages.delete(job.index);
    if(job.version!==state.rasterVersion||!visiblePageIndices.has(job.index))continue;
    const canvas=document.querySelector('.page-card[data-index="'+job.index+'"] canvas.pdf-background');
    if(!canvas)continue;
    const key=rasterKey(job.index,job.version);
    if(renderingPages.has(key))continue;
    renderingPages.add(key);
    concurrentPageRenders++;
    drawBase(job.index,canvas,job.version).finally(()=>{
      renderingPages.delete(key);
      concurrentPageRenders--;
      processPageRenderQueue();
      if(job.version===state.rasterVersion&&visiblePageIndices.has(job.index)){
        const card=document.querySelector('.page-card[data-index="'+job.index+'"]');
        if(card?.dataset.retry==='1'){
          card.dataset.retry='';
          if(card.dataset.rendered!==String(job.version))queuePageRender(job.index,job.version);
        }
      }
    });
  }
}
async function drawBase(index,canvas,version) {
  const spec=state.pages[index], reader=state.reader;
  if(!spec||spec.original===null||!reader)return;
  let task;
  try {
    const pdfpage=await reader.getPage(spec.original+1);
    if(version!==state.rasterVersion||!canvas.isConnected||!visiblePageIndices.has(index))return;
    const logicalWidth=spec.w*state.zoom,logicalHeight=spec.h*state.zoom;
    const pixelRatio=Math.max(.1,Math.min(window.devicePixelRatio||1,3,Math.sqrt(MAX_CANVAS_PIXELS/(logicalWidth*logicalHeight))));
    const viewport=pdfpage.getViewport({scale:state.zoom*pixelRatio});
    // Render off-screen then atomically swap, avoiding blurry intermediate frames.
    const ready=document.createElement('canvas');
    ready.className='pdf-background';
    ready.width=Math.max(1,Math.ceil(viewport.width));
    ready.height=Math.max(1,Math.ceil(viewport.height));
    ready.style.width=logicalWidth+'px';
    ready.style.height=logicalHeight+'px';
    const ctx=ready.getContext('2d',{alpha:false});
    task=pdfpage.render({canvasContext:ctx,viewport,canvas:ready});
    activePdfTasks.set(index,task);
    await task.promise;
    if(version!==state.rasterVersion||!canvas.isConnected||!visiblePageIndices.has(index))return;
    canvas.replaceWith(ready);
    ready.parentElement?.classList.remove('loading');
    const card=document.querySelector('.page-card[data-index="'+index+'"]');
    if(card)card.dataset.rendered=String(version);
    // Prioritise readable raster pages. Build text hit targets only afterwards.
    setTimeout(()=>{
      if(version===state.rasterVersion&&visiblePageIndices.has(index))ensurePageText(index);
    },0);
  }catch(error){
    if(error?.name!=='RenderingCancelledException'){
      console.error(error);
      status(t('Une page du PDF n’a pas pu être affichée.'));
    }
  }finally{
    if(activePdfTasks.get(index)===task)activePdfTasks.delete(index);
  }
}
async function ensurePageText(index,generation=state.generation) {
  const spec=state.pages[index],reader=state.reader;
  if(!spec||spec.original===null||spec.hits!==null||!reader)return;
  if(pendingTextPages.has(index))return pendingTextPages.get(index);
  const promise=(async()=>{
    try{
      const pdfpage=await reader.getPage(spec.original+1);
      const viewport=pdfpage.getViewport({scale:1});
      const text=await pdfpage.getTextContent();
      if(generation!==state.generation || state.pages[index]!==spec)return;
      const hits=[];
      for(const item of text.items){
        if(!item.str||!item.transform)continue;
        const matrix=pdfjs.Util.transform(viewport.transform,item.transform);
        const height=Math.max(7,Math.hypot(matrix[2],matrix[3])||item.height||12);
        const x=matrix[4],y=matrix[5]-height;
        const width=Math.max(8,item.width||item.str.length*height*.45);
        if(x+width>0&&y+height>0&&x<viewport.width&&y<viewport.height){
          hits.push({text:item.str,x:Math.max(0,x),y:Math.max(0,y),
            w:Math.max(1,Math.min(width,viewport.width-Math.max(0,x))),h:height});
        }
      }
      spec.hits=hits;
      if(visiblePageIndices.has(index)){
        const layer=document.querySelector('.page-card[data-index="'+index+'"] .hit-layer');
        if(layer)fillTextHits(index,layer);
      }
    }catch(error){console.warn('PDF text indexing failed',error);spec.hits=[];}
    finally{if(pendingTextPages.get(index)===promise)pendingTextPages.delete(index);}
  })();
  pendingTextPages.set(index,promise);
  return promise;
}
function loadVisiblePage(index) {
  const card=document.querySelector('.page-card[data-index="'+index+'"]');
  if(!card)return;
  const layer=card.querySelector('.hit-layer');
  if(state.pages[index]?.hits)fillTextHits(index,layer);
  // Extract text after rasterization to avoid competing with PDF decoding.
  queuePageRender(index);
}
function unloadPage(index){
  const card=document.querySelector('.page-card[data-index="'+index+'"]');
  card?.querySelector('.hit-layer')?.replaceChildren();
  const task=activePdfTasks.get(index);
  if(task){try{task.cancel();}catch{}activePdfTasks.delete(index);}
  if(card){
    card.dataset.rendered='';
    card.querySelector('.paper')?.classList.add('loading');
    // Release large bitmap buffers as pages move far out of view.
    const canvas=card.querySelector('canvas.pdf-background');
    if(canvas){canvas.width=1;canvas.height=1;}
  }
}
function renderAll(){
  cancelPageRendering();
  const counter=++state.generation;
  ++state.rasterVersion;
  const visible=state.pages.length>0;
  $('empty-state').hidden=visible;$('pages').hidden=!visible;
  $('pages').replaceChildren();
  for(let index=0;index<state.pages.length;index++){
    const p=state.pages[index];
    const card=element('div','page-card');card.dataset.index=index;
    const number=element('span','page-number');number.textContent=String(index+1);
    const paper=element('div','paper');paper.style.width=(p.w*state.zoom)+'px';paper.style.height=(p.h*state.zoom)+'px';
    paper.classList.toggle('text-mode',state.tool!=='select');
    paper.classList.toggle('loading',p.original!==null);
    const canvas=element('canvas','pdf-background');
    canvas.width=1;canvas.height=1;
    canvas.style.width=(p.w*state.zoom)+'px';canvas.style.height=(p.h*state.zoom)+'px';
    const hitlayer=element('div','hit-layer'),layer=element('div','item-layer');
    paper.append(canvas,hitlayer,layer);
    paper.addEventListener('click',(ev)=>{
      if(ev.target!==paper&&ev.target!==canvas)return;
      state.active=index;
      if(state.tool==='select'){select(index,null);return;}
      const rect=paper.getBoundingClientRect();
      add(index,state.tool,(ev.clientX-rect.left)/state.zoom,(ev.clientY-rect.top)/state.zoom);
      setTool('select');
    });
    card.append(number,paper);$('pages').append(card);
    renderItems(index,true);
  }
  if(visible&&window.IntersectionObserver){
    pageObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const index=Number(entry.target.dataset.index);
        if(entry.isIntersecting){
          visiblePageIndices.add(index);
          loadVisiblePage(index);
        }else if(visiblePageIndices.has(index)){
          visiblePageIndices.delete(index);
          unloadPage(index);
        }
      }
    },{root:$('scroll-area'),rootMargin:'480px 350px',threshold:0});
    document.querySelectorAll('.page-card').forEach(card=>pageObserver.observe(card));
  }else if(visible){
    for(let i=0;i<state.pages.length;i++){visiblePageIndices.add(i);loadVisiblePage(i);}
  }
  syncSelection();renderThumbs(true,counter);
}
async function drawThumb(index,button,generation){
  const spec=state.pages[index],canvas=button.querySelector('canvas');
  if(!spec||!canvas||button.dataset.working==='1'){
    if(button)button.dataset.dirty='1';
    return;
  }
  button.dataset.working='1';button.dataset.dirty='0';
  const scale=Math.min(91/spec.w,118/spec.h);
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const factor=scale*ratio;
  const w=Math.max(1,Math.floor(spec.w*factor)),h=Math.max(1,Math.floor(spec.h*factor));
  try{
    const backing=document.createElement('canvas');backing.width=w;backing.height=h;
    const ctx=backing.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    if(spec.original!==null&&state.reader){
      const pdfpage=await state.reader.getPage(spec.original+1);
      if(generation!==state.generation||!button.isConnected||button.dataset.visible!=='1')return;
      await pdfpage.render({canvasContext:ctx,viewport:pdfpage.getViewport({scale:factor}),canvas:backing}).promise;
    }
    if(generation!==state.generation||!button.isConnected||button.dataset.visible!=='1')return;
    for(const o of spec.items){
      ctx.save();
      ctx.globalAlpha=o.kind==='highlight'?.3:1;
      if(o.replace){ctx.fillStyle='#fff';ctx.fillRect(o.x*factor,o.y*factor,o.w*factor,o.h*factor);}
      if(o.kind==='text'){
        ctx.fillStyle=o.color;ctx.font=(o.bold?'bold ':'')+Math.max(2,o.size*factor)+'px Arial';
        ctx.fillText((o.content||'').split('\n')[0].slice(0,65),o.x*factor,o.y*factor+o.size*factor);
      }else{ctx.fillStyle=o.color;ctx.fillRect(o.x*factor,o.y*factor,o.w*factor,o.h*factor);}
      ctx.restore();
    }
    canvas.width=w;canvas.height=h;
    canvas.style.width=spec.w*scale+'px';canvas.style.height=spec.h*scale+'px';
    canvas.getContext('2d').drawImage(backing,0,0);
    button.dataset.rendered='1';
  }catch(error){
    if(error?.name!=='RenderingCancelledException')console.warn('PDF thumbnail failed',error);
  }finally{
    button.dataset.working='0';
    if(button.dataset.dirty==='1'&&button.dataset.visible==='1'&&generation===state.generation)drawThumb(index,button,generation);
  }
}
function renderThumbs(force=false,generation=state.generation){
  const host=$('thumbnails');
  if(!force&&host.children.length===state.pages.length){
    for(const button of host.children){
      if(button.dataset.visible==='1')drawThumb(Number(button.dataset.index),button,generation);
    }
    return;
  }
  thumbObserver?.disconnect();
  host.replaceChildren();
  for(let index=0;index<state.pages.length;index++){
    const button=element('button','thumb');
    button.dataset.index=index;button.dataset.visible='0';
    button.title=t('Aller à la page {n}',{n:index+1});
    const paper=element('div','thumb-paper'),preview=element('canvas');
    preview.width=1;preview.height=1;
    const label=element('span');label.textContent=t('Page {n}',{n:index+1});
    paper.append(preview);button.append(paper,label);
    button.addEventListener('click',()=>{
      select(index,null);
      document.querySelector('.page-card[data-index="'+index+'"]')?.scrollIntoView({block:'center'});
      $('sidebar').classList.remove('mobile-open');
    });
    host.append(button);
  }
  if(window.IntersectionObserver){
    thumbObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const button=entry.target,index=Number(button.dataset.index);
        button.dataset.visible=entry.isIntersecting?'1':'0';
        if(entry.isIntersecting)drawThumb(index,button,generation);
        else{button.dataset.rendered='0';const preview=button.querySelector('canvas');if(preview){preview.width=1;preview.height=1;}}
      }
    },{root:host,rootMargin:'200px 0px',threshold:0});
    [...host.children].forEach(button=>thumbObserver.observe(button));
  }else{
    [...host.children].forEach(button=>{button.dataset.visible='1';drawThumb(Number(button.dataset.index),button,generation);});
  }
  syncSelection();
}
async function openPDF(file){
  if(!file)return;
  if(!/\.pdf$/i.test(file.name) && file.type!=='application/pdf'){toast(t('Choisissez un fichier PDF.'));return;}
  status(t('Ouverture du PDF...'));
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    const doc=await pdfjs.getDocument({data:bytes.slice()}).promise;
    const pages=[];
    for(let i=0;i<doc.numPages;i++){
      if(i%20===0)status(t('Ouverture du PDF...')+' '+(i+1)+' / '+doc.numPages);
      const page=await doc.getPage(i+1),vp=page.getViewport({scale:1});
      pages.push({w:vp.width,h:vp.height,original:i,hits:null,items:[]});
      // Give the browser room to respond to user interactions on large documents.
      if(i%12===11)await new Promise(resolve=>setTimeout(resolve,0));
    }
    state.reader=doc;state.source=bytes;state.pages=pages;state.active=0;state.selected=null;
    state.history=[];state.future=[];syncUndo();
    $('filename').value=file.name.replace(/\.pdf$/i,'');
    $('scroll-area').scrollTo({left:0,top:0,behavior:'instant'});
    renderAll();if(window.innerWidth<800)fitWidth();
    $('scroll-area').scrollTo({left:0,top:0,behavior:'instant'});
    status(t('PDF chargé : {n} page(s).',{n:pages.length}));
    toast(t('PDF ouvert. Cliquez sur un texte pour créer une correction visuelle.'));
  }catch(error){console.error(error);status(t('Ouverture impossible : {error}',{error:error.message}));toast(t('Impossible de lire ce PDF : {error}',{error:error.message}),6000);}
}
function newDocument(){
  state.reader=null;state.source=null;state.pages=[{w:595.28,h:841.89,original:null,hits:[],items:[]}];
  state.active=0;state.selected=null;state.history=[];state.future=[];syncUndo();
  $('filename').value=t('Sans titre');
  $('scroll-area').scrollTo({left:0,top:0,behavior:'instant'});
  renderAll();if(window.innerWidth<800)fitWidth();
  $('scroll-area').scrollTo({left:0,top:0,behavior:'instant'});
  status(t('Nouveau document A4.'));
}
function appendPage(){
  if(!state.pages.length)return newDocument();
  record();const current=state.pages[state.active];
  state.pages.push({w:current?.w||595.28,h:current?.h||841.89,original:null,hits:[],items:[]});
  state.active=state.pages.length-1;state.selected=null;renderAll();document.querySelector('.page-card:last-child')?.scrollIntoView({block:'center'});
}
function removePage(){
  if(!state.pages.length)return;
  record();state.pages.splice(state.active,1);
  state.active=clamp(state.active,0,Math.max(0,state.pages.length-1));state.selected=null;renderAll();
}
function measureZoomAnchor(position) {
  const area=$('scroll-area'),rect=area.getBoundingClientRect();
  const x=position?.clientX??(rect.left+rect.width/2);
  const y=position?.clientY??(rect.top+Math.min(rect.height/2,360));
  let best=null,distance=Infinity;
  for(const card of $('pages').querySelectorAll('.page-card')){
    const r=card.querySelector('.paper')?.getBoundingClientRect();
    if(!r)continue;
    const gap=y<r.top?r.top-y:y>r.bottom?y-r.bottom:0;
    if(gap<distance){distance=gap;best={index:Number(card.dataset.index),rect:r};}
    if(gap===0)break;
  }
  if(!best)return null;
  return {index:best.index,clientX:x,clientY:y,
    x:(x-best.rect.left)/state.zoom,y:(y-best.rect.top)/state.zoom};
}
function restoreZoomAnchor(anchor) {
  if(!anchor)return;
  const rect=$('pages').querySelector('.page-card[data-index="'+anchor.index+'"] .paper')?.getBoundingClientRect();
  if(!rect)return;
  const area=$('scroll-area');
  // Temporarily bypass smooth scrolling to keep the zoom's focal point stable.
  const oldBehavior=area.style.scrollBehavior;
  area.style.scrollBehavior='auto';
  area.scrollLeft+=rect.left+anchor.x*state.zoom-anchor.clientX;
  area.scrollTop+=rect.top+anchor.y*state.zoom-anchor.clientY;
  requestAnimationFrame(()=>{area.style.scrollBehavior=oldBehavior;});
}
function refreshZoomLayout(){
  // Keep the document DOM and existing page bitmaps instead of recreating every page.
  ++state.rasterVersion;
  stopRasterJobs();
  for(const card of $('pages').querySelectorAll('.page-card')){
    const index=Number(card.dataset.index),spec=state.pages[index],paper=card.querySelector('.paper');
    if(!spec||!paper)continue;
    const w=spec.w*state.zoom,h=spec.h*state.zoom;
    paper.style.width=w+'px';paper.style.height=h+'px';
    const canvas=paper.querySelector('canvas.pdf-background');
    if(canvas){canvas.style.width=w+'px';canvas.style.height=h+'px';}
    card.dataset.rendered='';
    card.dataset.retry='';
    paper.classList.toggle('loading',spec.original!==null);
    if(spec.items.length)renderItems(index,true);
    if(visiblePageIndices.has(index)){
      const layer=card.querySelector('.hit-layer');
      if(layer&&spec.hits)fillTextHits(index,layer);
      queuePageRender(index);
    }
  }
  syncSelection();
}
function setZoom(value,position){
  const p=state.pages[state.active]||state.pages[0];
  let zoom=value,mode='custom';
  if(p&&value==='fit-width'){
    zoom=($('scroll-area').clientWidth-(window.innerWidth<800?24:76))/p.w;
    mode='fit-width';
  }else if(p&&value==='fit-page'){
    zoom=Math.min(
      ($('scroll-area').clientWidth-(window.innerWidth<800?24:76))/p.w,
      ($('scroll-area').clientHeight-(window.innerWidth<800?95:70))/p.h
    );
    mode='fit-page';
  }
  const next=clamp(Number(zoom)||1,.3,4);
  const anchor=measureZoomAnchor(position);
  const changed=Math.abs(state.zoom-next)>.001;
  state.zoom=next;state.zoomMode=mode;
  const select=$('zoom');
  const existing=select.querySelector('[data-custom]');
  existing?.remove();
  if(mode==='custom'){
    const option=[...select.options].find(o=>o.value===String(next));
    if(!option){const custom=new Option(Math.round(next*100)+' %',String(next));custom.dataset.custom='yes';select.append(custom);}
    select.value=String(next);
  }else select.value=mode;
  $('zoom-status').textContent=Math.round(next*100)+' %';
  $('mobile-zoom-actual').textContent=Math.round(next*100)+' %';
  if(!changed)return;
  refreshZoomLayout();
  restoreZoomAnchor(anchor);
}
function fitWidth(){setZoom('fit-width');}
function fitPage(){setZoom('fit-page');}
function hexRgb(str){const h=(str||'#202124').replace('#','');return PDF().rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255);}
function normalizedName(name){return String(name||'document').trim().replace(/[\\/:*?"<>|]/g,'-').slice(0,100)||'document';}
function baseFont(o){
  const f=PDF().StandardFonts;
  if(/^(Times New Roman|Palatino|Georgia|Baskerville)$/i.test(o.family)){
    return o.bold?(o.italic?f.TimesRomanBoldItalic:f.TimesRomanBold):(o.italic?f.TimesRomanItalic:f.TimesRoman);
  }
  if(/(Courier|Mono|Consolas|Menlo)/i.test(o.family)){
    return o.bold?(o.italic?f.CourierBoldOblique:f.CourierBold):(o.italic?f.CourierOblique:f.Courier);
  }
  return o.bold?(o.italic?f.HelveticaBoldOblique:f.HelveticaBold):(o.italic?f.HelveticaOblique:f.Helvetica);
}
function wrappedLines(content,font,size,maxWidth){
  const rows=[];
  for(const raw of String(content||'').split('\n')){
    if(!raw){rows.push('');continue;}
    let line='';
    for(const word of raw.split(/\s+/)){
      const attempt=line?line+' '+word:word;
      if(font.widthOfTextAtSize(attempt,size)<=maxWidth || !line){line=attempt;}
      else{rows.push(line);line=word;}
    }
    rows.push(line);
  }
  return rows;
}
async function exportPDF(){
  if(!state.pages.length){toast(t('Aucun document à exporter.'));return;}
  if(!PDF()){toast(t('Bibliothèque d’export indisponible. Vérifiez la connexion.'));return;}
  $('export-top').disabled=true;status(t('Préparation de l’export...'));
  try{
    const output=await PDF().PDFDocument.create(),cache=new Map();
    if(window.fontkit)output.registerFontkit(window.fontkit);
    let sourceDoc=null;
    if(state.source)sourceDoc=await PDF().PDFDocument.load(state.source,{ignoreEncryption:true});
    const selected=document.activeElement?.isContentEditable; if(selected)document.activeElement.blur();
    for(const spec of state.pages){
      let page;
      if(spec.original!==null && sourceDoc){const copied=await output.copyPages(sourceDoc,[spec.original]);page=copied[0];output.addPage(page);}
      else page=output.addPage([spec.w,spec.h]);
      const height=page.getHeight();
      for(const o of spec.items){
        const color=hexRgb(o.color),pdfY=height-o.y-o.h;
        if(o.replace)page.drawRectangle({x:o.x,y:pdfY,width:o.w,height:o.h,color:PDF().rgb(1,1,1)});
        if(o.kind!=='text'){page.drawRectangle({x:o.x,y:pdfY,width:o.w,height:o.h,color,opacity:o.kind==='highlight'?.3:.75});continue;}
        let font;
        if(cache.has(o.family+'|'+o.bold+'|'+o.italic))font=cache.get(o.family+'|'+o.bold+'|'+o.italic);
        else{
          if(state.fonts.has(o.family)){
            if(!window.fontkit)throw new Error(t('fontkit indisponible : impossible d’incorporer {font}',{font:o.family}));
            font=await output.embedFont(state.fonts.get(o.family),{subset:true});
          }else font=await output.embedFont(baseFont(o));
          cache.set(o.family+'|'+o.bold+'|'+o.italic,font);
        }
        let lines;
        try{lines=wrappedLines(o.content,font,o.size,Math.max(8,o.w));}
        catch(error){throw new Error(t('Police non compatible avec certains caractères du bloc « {text} ». Importez un TTF/OTF Unicode.',{text:(o.content||'').slice(0,25)}));}
        let baseline=height-o.y-o.size*.96;
        const minimum=height-o.y-o.h;
        for(const line of lines){
          if(baseline<minimum)break;
          if(line){
            const measured=font.widthOfTextAtSize(line,o.size);
            const x=o.x+(o.align==='center'?(o.w-measured)/2:o.align==='right'?o.w-measured:0);
            page.drawText(line,{x,y:baseline,size:o.size,font,color,maxWidth:Math.max(o.w,measured)});
            if(o.underline)page.drawLine({start:{x,y:baseline-2},end:{x:x+measured,y:baseline-2},thickness:Math.max(.5,o.size/18),color});
          }
          baseline-=o.size*1.23;
        }
      }
    }
    const data=await output.save();
    const blob=new Blob([data],{type:'application/pdf'}),url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download=normalizedName($('filename').value)+'.pdf';
    document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    status(t('PDF exporté : {name}',{name:anchor.download}));toast(t('PDF exporté. Les corrections sont visuelles et ne caviardent pas le contenu sous-jacent.'));
  }catch(error){console.error(error);status(t('Erreur d’export : {error}',{error:error.message}));toast(t('Export impossible : {error}',{error:error.message}),8000);}
  finally{$('export-top').disabled=false;}
}
async function importFonts(files){
  for(const file of files){
    if(!/\.(ttf|otf)$/i.test(file.name)){toast(t('Seuls les fichiers TTF/OTF sont pris en charge.'));continue;}
    try{
      const bytes=new Uint8Array(await file.arrayBuffer());
      const name=file.name.replace(/\.(ttf|otf)$/i,'').replace(/[_-]+/g,' ');
      const url=URL.createObjectURL(new Blob([bytes]));state.urls.push(url);
      const face=new FontFace(name,'url("'+url+'")');await face.load();document.fonts.add(face);
      state.fonts.set(name,bytes);
      if(![...$('font-family').options].some(x=>x.value===name))$('imported-fonts').append(new Option(name,name));
      $('font-family').value=name;changeStyle('family',name);
      toast(t('Police « {name} » importée : sera incorporée à l’export.',{name}));
    }catch(error){console.error(error);toast(t('Impossible de charger la police : {name}',{name:file.name}));}
  }
}
function perform(action){
  document.querySelectorAll('.menu[open]').forEach(menu=>menu.removeAttribute('open'));
  switch(action){
    case 'new':newDocument();break;
    case 'open':$('pdf-picker').click();break;
    case 'export':exportPDF();break;
    case 'font-import':$('font-picker').click();break;
    case 'undo':undo();break;case 'redo':redo();break;
    case 'duplicate':duplicate();break;case 'delete':removeSelected();break;
    case 'zoom-in':setZoom(state.zoom+.25);break;
    case 'zoom-out':setZoom(state.zoom-.25);break;
    case 'fit':fitWidth();break;
    case 'fit-page':fitPage();break;
    case 'toggle-sidebar':
      if(window.innerWidth<800){$('sidebar').style.display='';$('sidebar').classList.toggle('mobile-open');}
      else $('sidebar').style.display=$('sidebar').style.display==='none'?'':'none';
      break;
    case 'insert-text':if(!state.pages.length)newDocument();add(state.active,'text');break;
    case 'insert-rect':if(!state.pages.length)newDocument();add(state.active,'rect');break;
    case 'insert-highlight':if(!state.pages.length)newDocument();add(state.active,'highlight',60,65,{color:'#fff176',h:24,w:180});break;
    case 'add-page':appendPage();break;
    case 'bold':changeStyle('bold',!((current()?.item||state.defaults).bold));break;
    case 'italic':changeStyle('italic',!((current()?.item||state.defaults).italic));break;
    case 'underline':changeStyle('underline',!((current()?.item||state.defaults).underline));break;
    case 'align-left':case 'align-center':case 'align-right':changeStyle('align',action.slice(6));break;
    case 'help':$('help-dialog').showModal();break;
  }
}
function wire(){
  fontList();syncUndo();syncSelection();
  // All translations are UI-only. Existing PDF annotations and their text remain untouched.
  $('language').addEventListener('change',event=>setLanguage(event.target.value));
  onLanguageChange(()=>{
    for(const group of document.querySelectorAll('#font-family optgroup')) {
      group.label=t(group.dataset.translationKey||group.label);
    }
    // Only rename the untouched default filename, never a PDF's real filename.
    if(!state.source && ['Sans titre','Untitled','Chưa đặt tên'].includes($('filename').value))$('filename').value=t('Sans titre');
    renderAll();
    $('mobile-zoom-actual').textContent=Math.round(state.zoom*100)+' %';
    status(t('Langue de l’interface mise à jour.'));
    $('toast').hidden=true;
  });
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>perform(el.dataset.action)));
  for(const [id,action] of Object.entries({
    'open-top':'open','open-empty':'open','export-top':'export','new-empty':'new','undo':'undo','redo':'redo','add-page':'add-page','remove-page':'delete-page','zoom-in':'zoom-in','zoom-out':'zoom-out','duplicate-object':'duplicate','delete-object':'delete','bold':'bold','italic':'italic','underline':'underline','align-left':'align-left','align-center':'align-center','align-right':'align-right'
  }))$(id)?.addEventListener('click',()=>action==='delete-page'?removePage():perform(action));
  ['select','text','rect','highlight'].forEach(name=>$('tool-'+name).addEventListener('click',()=>setTool(name)));
  $('zoom').addEventListener('change',e=>setZoom(e.target.value));
  $('mobile-zoom-in').addEventListener('click',()=>setZoom(state.zoom+.25));
  $('mobile-zoom-out').addEventListener('click',()=>setZoom(state.zoom-.25));
  $('mobile-zoom-fit').addEventListener('click',fitWidth);
  $('mobile-zoom-actual').addEventListener('click',()=>setZoom(1));
  $('mobile-pages').addEventListener('click',()=>{
    $('inspector').classList.remove('mobile-open');
    $('sidebar').classList.toggle('mobile-open');
  });
  $('mobile-properties').addEventListener('click',()=>{
    $('sidebar').classList.remove('mobile-open');
    $('inspector').style.display='';
    $('inspector').classList.toggle('mobile-open');
  });
  const zoomArea=$('scroll-area');
  // Keep the current-page indicator in sync with the page actually being read.
  let scrollFrame=0;
  zoomArea.addEventListener('scroll',()=>{
    if(scrollFrame||!state.pages.length)return;
    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      const viewport=zoomArea.getBoundingClientRect();
      const center=viewport.top+Math.min(viewport.height*.43,340);
      let nearest=state.active,gap=Infinity;
      for(const index of visiblePageIndices){
        const card=$('pages').querySelector('.page-card[data-index="'+index+'"]');
        const rect=card?.getBoundingClientRect();
        if(!rect)continue;
        const distance=center<rect.top?rect.top-center:center>rect.bottom?center-rect.bottom:0;
        if(distance<gap){gap=distance;nearest=index;}
      }
      if(state.active!==nearest){state.active=nearest;syncSelection();}
    });
  },{passive:true});
  let pendingWheelZoom=null,wheelTimer=null,wheelPoint=null;
  zoomArea.addEventListener('wheel',event=>{
    if(!(event.ctrlKey||event.metaKey)||!state.pages.length)return;
    event.preventDefault();
    pendingWheelZoom=clamp((pendingWheelZoom??state.zoom)*(event.deltaY<0?1.12:.89),.3,4);
    wheelPoint={clientX:event.clientX,clientY:event.clientY};
    clearTimeout(wheelTimer);
    wheelTimer=setTimeout(()=>{setZoom(pendingWheelZoom,wheelPoint);pendingWheelZoom=null;},75);
  },{passive:false});
  zoomArea.addEventListener('dblclick',event=>{
    if(!state.pages.length||event.target.closest('.item,.pdf-text-hit,button,input,textarea'))return;
    if(state.zoom<1.45)setZoom(1.8,{clientX:event.clientX,clientY:event.clientY});
    else fitWidth();
  });
  const touchDistance=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  let pinch=null,lastTap=null;
  zoomArea.addEventListener('touchstart',event=>{
    if(event.touches.length===2&&state.pages.length){
      const one=event.touches[0],two=event.touches[1];
      const centerX=(one.clientX+two.clientX)/2,centerY=(one.clientY+two.clientY)/2;
      const bounds=$('pages').getBoundingClientRect();
      pinch={initial:state.zoom,distance:touchDistance(one,two),factor:1,clientX:centerX,clientY:centerY};
      $('pages').style.transformOrigin=(centerX-bounds.left)+'px '+(centerY-bounds.top)+'px';
      lastTap=null;
    }
  },{passive:true});
  zoomArea.addEventListener('touchmove',event=>{
    if(!pinch||event.touches.length!==2)return;
    event.preventDefault();
    const one=event.touches[0],two=event.touches[1];
    pinch.factor=clamp(touchDistance(one,two)/Math.max(1,pinch.distance),.25,6);
    pinch.clientX=(one.clientX+two.clientX)/2;
    pinch.clientY=(one.clientY+two.clientY)/2;
    $('pages').style.transform='scale('+pinch.factor+')';
  },{passive:false});
  zoomArea.addEventListener('touchend',event=>{
    if(pinch&&event.touches.length<2){
      const next=clamp(pinch.initial*pinch.factor,.3,4);
      $('pages').style.transform='';
      $('pages').style.transformOrigin='';
      setZoom(next,{clientX:pinch.clientX,clientY:pinch.clientY});
      pinch=null;lastTap=null;
      return;
    }
    if(event.changedTouches.length!==1||!state.pages.length)return;
    if(event.target.closest('.item,.pdf-text-hit,button,input,textarea'))return;
    const tap=event.changedTouches[0],now=Date.now();
    if(lastTap&&now-lastTap.at<320&&Math.hypot(tap.clientX-lastTap.x,tap.clientY-lastTap.y)<28){
      event.preventDefault();
      if(state.zoom<1.45)setZoom(1.8,{clientX:tap.clientX,clientY:tap.clientY});
      else fitWidth();
      lastTap=null;
    }else lastTap={at:now,x:tap.clientX,y:tap.clientY};
  },{passive:false});
  let resizeTimer;
  window.addEventListener('resize',()=>{
    if(state.zoomMode!=='fit-width'&&state.zoomMode!=='fit-page')return;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>setZoom(state.zoomMode),140);
  });
  $('font-family').addEventListener('change',e=>changeStyle('family',e.target.value));
  $('font-size').addEventListener('change',e=>changeStyle('size',clamp(Number(e.target.value)||16,6,144)));
  $('font-color').addEventListener('change',e=>changeStyle('color',e.target.value));
  $('pdf-picker').addEventListener('change',async e=>{await openPDF(e.target.files[0]);e.target.value='';});
  $('font-picker').addEventListener('change',async e=>{await importFonts(e.target.files);e.target.value='';});
  $('object-content').addEventListener('focus',()=>{if(current())record();});
  $('object-content').addEventListener('input',e=>{const s=current();if(!s)return;s.item.content=e.target.value;const node=document.querySelector('[data-item-id="'+s.item.id+'"] .editable-text');if(node)node.textContent=e.target.value;});
  $('object-content').addEventListener('blur',()=>renderThumbs());
  for(const id of ['object-x','object-y','object-width','object-height'])$(id).addEventListener('change',applyGeometry);
  $('help-close').addEventListener('click',()=>$('help-dialog').close());
  $('help-ok').addEventListener('click',()=>$('help-dialog').close());
  $('hide-inspector').addEventListener('click',()=>{
    $('inspector').classList.remove('mobile-open');
    $('inspector').style.display=window.innerWidth<800?'':'none';
  });
  document.addEventListener('pointermove',ev=>{
    if(!drag)return;const s=current();if(!s||s.item.id!==drag.id)return;
    s.item.x=clamp(drag.x+(ev.clientX-drag.clientX)/state.zoom,0,s.page.w-s.item.w);
    s.item.y=clamp(drag.y+(ev.clientY-drag.clientY)/state.zoom,0,s.page.h-s.item.h);
    const node=document.querySelector('[data-item-id="'+s.item.id+'"]');if(node){node.style.left=s.item.x*state.zoom+'px';node.style.top=s.item.y*state.zoom+'px';}
    $('object-x').value=Math.round(s.item.x);$('object-y').value=Math.round(s.item.y);
  });
  document.addEventListener('pointerup',()=>{if(drag){drag=null;renderThumbs();}});
  document.addEventListener('keydown',event=>{
    const mod=event.ctrlKey||event.metaKey;
    if(mod && event.key.toLowerCase()==='o'){event.preventDefault();perform('open');}
    else if(mod&&event.key.toLowerCase()==='s'){event.preventDefault();perform('export');}
    else if(mod&&event.key.toLowerCase()==='n'){event.preventDefault();perform('new');}
    else if(mod&&event.key.toLowerCase()==='z'&&!focusInForm()){event.preventDefault();perform(event.shiftKey?'redo':'undo');}
    else if(mod&&event.key.toLowerCase()==='y'&&!focusInForm()){event.preventDefault();redo();}
    else if(mod&&['b','i','u'].includes(event.key.toLowerCase())&&!focusInForm()){event.preventDefault();perform({b:'bold',i:'italic',u:'underline'}[event.key.toLowerCase()]);}
    else if(!focusInForm()&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();removeSelected();}
    else if(event.key==='Escape'){select(state.active,null);setTool('select');}
    else if(!focusInForm()&&current()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();record();const s=current(),step=event.shiftKey?10:1;
      if(event.key==='ArrowLeft')s.item.x=clamp(s.item.x-step,0,s.page.w-s.item.w);
      if(event.key==='ArrowRight')s.item.x=clamp(s.item.x+step,0,s.page.w-s.item.w);
      if(event.key==='ArrowUp')s.item.y=clamp(s.item.y-step,0,s.page.h-s.item.h);
      if(event.key==='ArrowDown')s.item.y=clamp(s.item.y+step,0,s.page.h-s.item.h);
      renderItems(s.index);renderThumbs();
    }
  });
  const area=$('scroll-area');
  for(const eventName of ['dragenter','dragover'])area.addEventListener(eventName,event=>{event.preventDefault();area.classList.add('drag-over');});
  for(const eventName of ['dragleave','drop'])area.addEventListener(eventName,event=>{event.preventDefault();area.classList.remove('drag-over');});
  area.addEventListener('drop',e=>{const file=[...e.dataTransfer.files].find(f=>/\.pdf$/i.test(f.name)||f.type==='application/pdf');if(file)openPDF(file);});
  document.addEventListener('click',e=>{if(!e.target.closest('.menu'))document.querySelectorAll('.menu[open]').forEach(x=>x.removeAttribute('open'));});
}
wire();
translateInterface();
if($('filename').value==='Sans titre')$('filename').value=t('Sans titre');
status(t('Prêt — ouvrez un PDF ou créez une page blanche.'));
