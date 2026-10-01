import test from 'node:test';
import assert from 'node:assert/strict';
import { moveToTarget, validateUpload, uploadSequentially } from '../app/studio-interactions.ts';
test('dragging moves forward and backward without losing or mutating collection entries',()=>{
 const models=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
 assert.deepEqual(moveToTarget(models,'a','d').map(m=>m.id),['b','c','d','a']);
 assert.deepEqual(moveToTarget(models,'d','b').map(m=>m.id),['a','d','b','c']);
 assert.deepEqual(models.map(m=>m.id),['a','b','c','d']);
 assert.equal(moveToTarget(models,'missing','b'),models);
 assert.equal(moveToTarget(models,'a','a'),models);
});
test('upload validation enforces file types, nonempty data and per-file size limit',()=>{
 assert.equal(validateUpload({name:'Texture.GLB',size:100*1024*1024}),null);
 assert.match(validateUpload({name:'Texture.glb',size:100*1024*1024+1}),/100 MB/);
 assert.match(validateUpload({name:'photo.png',size:10}),/GLB/);
 assert.match(validateUpload({name:'empty.glb',size:0}),/empty/);
});
test('batch uploads remain sequential and continue after a failed file',async()=>{
 let active=0,peak=0; const attempted=[];
 const result=await uploadSequentially(['one','bad','three'],async(name,index)=>{
  active++; peak=Math.max(peak,active); attempted.push([name,index]);
  await Promise.resolve(); active--; if(name==='bad')throw Error('network');
 });
 assert.equal(peak,1); assert.deepEqual(attempted,[['one',0],['bad',1],['three',2]]);
 assert.deepEqual(result,{succeeded:2,failed:1});
});
