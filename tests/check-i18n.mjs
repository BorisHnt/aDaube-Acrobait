// Zero-dependency consistency checks for the browser translations.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const i18n=readFileSync(new URL('../i18n.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');

const found=i18n.match(/const rows = (\[[\s\S]*?\]);\nconst dictionaries/);
assert.ok(found,'i18n.js must declare a translation dictionary');
const rows=Function('"use strict"; return '+found[1])();
const translated=new Map();
for(const row of rows){
  assert.equal(row.length,3,'French / English / Vietnamese required');
  const [fr,en,vi]=row;
  assert.ok(fr && en && vi,'Non-empty translations required');
  assert.ok(!translated.has(fr),'Duplicate translation: '+fr);
  translated.set(fr,row);
  const tokens=s=>[...s.matchAll(/\{([a-z]+)\}/g)].map(x=>x[1]).sort().join(',');
  assert.equal(tokens(en),tokens(fr),'English interpolation mismatch: '+fr);
  assert.equal(tokens(vi),tokens(fr),'Vietnamese interpolation mismatch: '+fr);
}
// These UI strings intentionally stay identical in all locales.
const intentionallyUntranslated=new Set([
  'Français','English','Tiếng Việt',
  'Ctrl N','Ctrl O','Ctrl S','Ctrl Z','Ctrl Maj Z','Ctrl B','Ctrl I','Ctrl U',
  'X','Y','B','I','U','aDaube','Acrobait'
]);
for(const match of html.matchAll(/>([^<>]+)</g)){
  const raw=match[1].trim();
  if(!/[A-Za-zÀ-ÿ]/.test(raw) || intentionallyUntranslated.has(raw) || /^[a-z_]+$/.test(raw))continue;
  if(/^\d+ ?%$/.test(raw))continue;
  assert.ok(translated.has(raw),'Untranslated static label: '+raw);
}
for(const match of html.matchAll(/\b(?:title|aria-label|placeholder)="([^"]+)"/g)){
  assert.ok(translated.has(match[1]),'Untranslated accessibility label: '+match[1]);
}
for(const match of app.matchAll(/\bt\('([^']+)'/g)){
  assert.ok(translated.has(match[1]),'Untranslated application message: '+match[1]);
}
assert.ok(html.includes('id="language"'),'Missing language selection');
assert.ok(app.includes("from './i18n.js'"),'Missing i18n import');
console.log('i18n consistency OK: '+rows.length+' strings, FR/EN/VI, full interface coverage.');