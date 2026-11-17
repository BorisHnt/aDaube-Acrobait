// Static guards for the PDF viewer. These do not replace real mobile-browser tests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const js=read('app.js'),html=read('index.html'),css=read('styles.css');
function has(source,regex,message){assert.match(source,regex,message);}
has(js,/pageObserver=new IntersectionObserver/,'PDF pages must be drawn only near viewport');
has(js,/thumbObserver=new IntersectionObserver/,'Thumbnails must be drawn lazily');
has(js,/MAX_CANVAS_PIXELS=12000000/,'PDF canvas must have a memory budget');
has(js,/Math\.min\(window\.devicePixelRatio\|\|1,3/,'Sharp display scale must respect device pixel ratio');
has(js,/async function ensurePageText/,'Text hit regions must be loaded lazily');
const opener=js.slice(js.indexOf('async function openPDF(file)'),js.indexOf('function newDocument()'));
assert.ok(!opener.includes('getTextContent()'),'Opening a PDF must not index all page text before first paint');
has(js,/function restoreZoomAnchor/,'Zoom should preserve reading position');
has(js,/function fitPage/,'Fit-page preset must remain available');
has(js,/touchstart/,'Pinch zoom must have a touchstart handler');
has(js,/touchmove/,'Pinch zoom must have a touchmove handler');
has(js,/touchend/,'Pinch zoom must have a touchend handler');
has(js,/zoomArea\.addEventListener\('wheel'/,'Ctrl + mouse wheel zoom handler missing');
has(css,/\.pages\{width:max-content;min-width:100%/,'Large pages must remain horizontally scrollable');
has(css,/\.mobile-zoom-bar\{position:absolute/,'Mobile zoom controls must remain visible');
for(const id of ['zoom','mobile-pages','mobile-properties','mobile-zoom-in','mobile-zoom-out','mobile-zoom-fit','mobile-zoom-actual']){
  assert.ok(html.includes('id="'+id+'"'),'Missing zoom control '+id);
}
has(html,/value="fit-width"/,'Fit width preset missing');
has(html,/value="fit-page"/,'Fit page preset missing');
console.log('Viewer guard checks OK: lazy rendering, hi-DPI, zoom anchor, touch, controls.');
