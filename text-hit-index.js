// Small dependency-free spatial index for text spans extracted from PDF.js.
// Interactive selection uses one delegated event handler, not thousands of DOM buttons.
export function buildTextHitIndex(hits,cellSize=32){
  const rows=new Map();
  for(const hit of hits||[]){
    if(![hit.x,hit.y,hit.w,hit.h].every(Number.isFinite)||hit.w<=0||hit.h<=0)continue;
    const first=Math.floor(hit.y/cellSize),last=Math.floor((hit.y+hit.h)/cellSize);
    for(let row=first;row<=Math.min(last,first+500);row++){
      const list=rows.get(row)||[];
      list.push(hit);
      rows.set(row,list);
    }
  }
  return {rows,cellSize};
}
export function pickTextHit(index,x,y,tolerance=1.5){
  if(!index||!Number.isFinite(x)||!Number.isFinite(y))return null;
  const low=Math.floor((y-tolerance)/index.cellSize), high=Math.floor((y+tolerance)/index.cellSize);
  let best=null,score=Infinity;
  const checked=new Set();
  for(let row=low;row<=high;row++){
    for(const hit of index.rows.get(row)||[]){
      if(checked.has(hit))continue;
      checked.add(hit);
      if(x<hit.x-tolerance||x>hit.x+hit.w+tolerance||
         y<hit.y-tolerance||y>hit.y+hit.h+tolerance)continue;
      const area=hit.w*hit.h;
      if(area<score){best=hit;score=area;}
    }
  }
  return best;
}
