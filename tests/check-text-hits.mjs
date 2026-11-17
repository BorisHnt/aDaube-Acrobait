import assert from 'node:assert/strict';
import {buildTextHitIndex,pickTextHit} from '../text-hit-index.js';

const samples=[
  {text:'First',x:10,y:12,w:110,h:18},
  {text:'Second',x:20,y:18,w:40,h:10},
  {text:'Third',x:220,y:76,w:45,h:16},
  {text:'Crosses row',x:15,y:30,w:20,h:9},
  {text:'invalid',x:NaN,y:5,w:10,h:10}
];
const index=buildTextHitIndex(samples);
assert.equal(pickTextHit(index,0,0),null,'Empty space must not be selectable');
assert.equal(pickTextHit(index,25,20)?.text,'Second','Smallest overlapping text span is most specific');
assert.equal(pickTextHit(index,18,34)?.text,'Crosses row','Text spans crossing bins remain selectable');
assert.equal(pickTextHit(index,233,82)?.text,'Third');
assert.equal(pickTextHit(index,233,82,0)?.text,'Third');
assert.equal(pickTextHit(index,NaN,82),null,'Invalid coordinates must be ignored');
assert.equal(pickTextHit(buildTextHitIndex([]),25,25),null,'Empty PDF page must not crash');
const many=Array.from({length:20000},(_,i)=>({text:String(i),x:(i%100)*22,y:Math.floor(i/100)*16,w:20,h:13}));
const large=buildTextHitIndex(many);
assert.equal(pickTextHit(large,8,8)?.text,'0');
assert.equal(pickTextHit(large,8,500*1.0)?.text,String(3100),'Large PDFs must remain indexed correctly');
console.log('PDF text hit index tests OK: overlap, sparse pages and 20k spans.');
