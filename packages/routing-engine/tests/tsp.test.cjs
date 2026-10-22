const assert=require('node:assert/strict');const {greedy,heldKarp,twoOpt,matrixOf}=require('../dist/tsp.js');
const points=[{id:'R',x:0,y:0},{id:'A',x:3,y:0},{id:'B',x:5,y:4},{id:'C',x:1,y:7},{id:'D',x:-3,y:2}];
const matrix=matrixOf(points);const optimum=heldKarp(matrix);
for(const a of [greedy(matrix),optimum,twoOpt(matrix)]){
 assert.equal(a.path.length,points.length+1);assert.equal(a.path[0],0);assert.equal(a.path.at(-1),0);
 assert.equal(new Set(a.path.slice(0,-1)).size,points.length);assert(a.cost+1e-8>=optimum.cost);
}
assert(twoOpt(matrix).cost<=greedy(matrix).cost+1e-8);
for(let n=2;n<=9;n++){const pts=Array.from({length:n},(_,i)=>({id:String(i),x:Math.cos(i*17)*25,y:Math.sin(i*11)*15}));const m=matrixOf(pts);const a=heldKarp(m),b=greedy(m),c=twoOpt(m,b);assert(a.cost<=b.cost+1e-7);assert(a.cost<=c.cost+1e-7);assert(c.cost<=b.cost+1e-7);}
assert.throws(()=>heldKarp(matrixOf(Array.from({length:14},(_,i)=>({id:String(i),x:i,y:i*i})))));
console.log('DAA routing tests passed: Greedy, Held–Karp, 2-opt and bounds.');
