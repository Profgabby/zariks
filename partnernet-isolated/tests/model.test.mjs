import assert from "node:assert/strict";import {modules,validateRecord,addRecord,updateStatus,summarize,csvExport} from "../lib/model.mjs";
assert.equal(Object.keys(modules).length,10);
assert.ok(validateRecord("orders",{customer:"",sku:"Z",quantity:0}).length>=2);
assert.ok(validateRecord("inventory",{hub:"Kano",sku:"Z",quantity:-1}).length>0);
let state={};
const cases={partners:{name:"Producer A",type:"Contract"},hubs:{name:"Kano",state:"Kano"},products:{name:"Zobo",sku:"Z-1"},production:{hub:"Kano",sku:"Z-1",plannedBottles:100},inventory:{hub:"Kano",sku:"Z-1",quantity:90},orders:{customer:"School",sku:"Z-1",quantity:20},quality:{batch:"B-1",check:"Seal",result:"Hold"},deliveries:{order:"ORD-0001",destination:"Kano"},finance:{reference:"INV-1",category:"Sales",amount:100},settings:{key:"currency",value:"NGN"}};
for(const [name,fields] of Object.entries(cases)){const result=addRecord(state,name,fields);assert.deepEqual(result.errors,[],name);state=result.state;}
assert.equal(summarize(state).orderedBottles,20);assert.equal(summarize(state).inventoryBottles,90);assert.equal(summarize(state).qualityHolds,1);
state=updateStatus(state,"orders","ORD-0001","Approved");assert.equal(state.orders[0].status,"Approved");
assert.match(csvExport([{name:'A,"B"'}],["name"]),/"A,""B"""/);
assert.equal(addRecord(state,"orders",{customer:"",sku:"",quantity:-1}).state,state);
console.log("PASS: 10 modules, validation, creation, totals, status, CSV escaping, invalid write rejection");
