import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function setup(){
 const elements=new Map();
 const element=selector=>{
  if(!elements.has(selector))elements.set(selector,{value:'0.2',style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},toggleAttribute(){},addEventListener(){},textContent:'',disabled:true});
  return elements.get(selector);
 };
 const context=vm.createContext({clearTimeout:()=>{},setTimeout:fn=>fn(),URL,document:{querySelector:element,querySelectorAll:()=>[]},window:{setTimeout:fn=>fn()},fetch:()=>new Promise(()=>{})});
 vm.runInContext(readFileSync(new URL('../github-pages/app.js',import.meta.url),'utf8'),context);
 return {element,run:code=>vm.runInContext(code,context)};
}

test('public arrows select models in saved order and wrap in both directions',()=>{
 const ui=setup();ui.run(`renderModels([{id:'second-upload',name:'First display.glb',url:'/api/models/first',size:1},{id:'first-upload',name:'Second display.glb',url:'/api/models/second',size:1}])`);
 assert.equal(ui.element('#model-title').textContent,'First display');
 assert.equal(ui.element('#model-position').textContent,'1 / 2');
 ui.run('stepModel(1)');assert.equal(ui.element('#model-title').textContent,'Second display');assert.equal(ui.element('#model-position').textContent,'2 / 2');
 ui.run('stepModel(1)');assert.equal(ui.element('#model-title').textContent,'First display');
 ui.run('stepModel(-1)');assert.equal(ui.element('#model-title').textContent,'Second display');
 assert.equal(ui.element('#model-viewer').src,'https://vanta-model-atelier.dreadstache.chatgpt.site/api/models/second');
});
test('empty and single-model collections disable navigation safely',()=>{
 const ui=setup();ui.run('renderModels([]); stepModel(1)');assert.equal(ui.element('#models-next').disabled,true);assert.equal(ui.element('#model-title').textContent,'The collection is being prepared');
 ui.run(`renderModels([{id:'only',name:'Only.glb',url:'/only',size:1}]); stepModel(-1)`);assert.equal(ui.element('#models-prev').disabled,true);assert.equal(ui.element('#model-title').textContent,'Only');
});
