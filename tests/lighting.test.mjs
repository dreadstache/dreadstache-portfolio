import test from 'node:test';
import assert from 'node:assert/strict';
import { createLightingEnvironment } from '../app/lighting.ts';
async function pixels(x,y,color) {
 const bytes=new Uint8Array(await createLightingEnvironment(x,y,color).arrayBuffer());
 const header=new TextEncoder().encode('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 64 +X 128\n');
 assert.deepEqual(bytes.slice(0,header.length),header);
 assert.equal(bytes.length,header.length+128*64*4);
 const result=[];
 for(let i=header.length;i<bytes.length;i+=4){const factor=2**(bytes[i+3]-128)/256;result.push([bytes[i]*factor,bytes[i+1]*factor,bytes[i+2]*factor]);}
 return result;
}
test('HDR softbox direction and tint change actual light energy while preserving neutral fill',async()=>{
 const white=await pixels(20,22,'#ffffff'), moved=await pixels(80,22,'#ffffff'), red=await pixels(20,22,'#ff0000');
 assert.notDeepEqual(white,moved);
 assert.ok(white.every(([r,g,b])=>r===g&&g===b&&r>0));
 assert.ok(red.some(([r,g])=>r>g*3));
 assert.ok(red.every(([,g,b])=>g===b&&g>0));
});
