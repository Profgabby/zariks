export const modules = {
partners:{title:"Partners",fields:["name","type","state","contact"],required:["name","type"]},
hubs:{title:"Production Hubs",fields:["name","state","lga","dailyCapacity"],required:["name","state"]},
products:{title:"Products",fields:["name","sku","format","unitPrice"],required:["name","sku"]},
production:{title:"Production",fields:["hub","sku","plannedBottles","productionDate"],required:["hub","sku","plannedBottles"]},
inventory:{title:"Inventory",fields:["hub","sku","quantity","batch"],required:["hub","sku","quantity"]},
orders:{title:"Orders",fields:["customer","sku","quantity","status"],required:["customer","sku","quantity"]},
quality:{title:"Quality",fields:["batch","check","result","reviewer"],required:["batch","check","result"]},
deliveries:{title:"Deliveries",fields:["order","destination","driver","status"],required:["order","destination"]},
finance:{title:"Finance",fields:["reference","category","amount","status"],required:["reference","category","amount"]},
settings:{title:"Settings",fields:["key","value"],required:["key"]}
};
export function validateRecord(module,record){const schema=modules[module];if(!schema)throw Error("Unknown module");const errors=[];for(const f of schema.required)if(String(record[f]??"").trim()==="")errors.push(f+" is required");for(const f of ["dailyCapacity","unitPrice","plannedBottles","quantity","amount"])if(record[f]!==undefined&&String(record[f]).trim()!==""){const n=Number(record[f]);if(!Number.isFinite(n)||n<0)errors.push(f+" must be nonnegative");}if(["orders","production"].includes(module)&&Number(record.quantity??record.plannedBottles)<=0)errors.push("Quantity must be greater than zero");return errors;}
export function addRecord(state,module,record){const errors=validateRecord(module,record);if(errors.length)return {state,errors};const existing=state[module]??[];const id=module.toUpperCase().slice(0,3)+"-"+String(existing.length+1).padStart(4,"0");return {state:{...state,[module]:[...existing,{...record,id,createdAt:new Date().toISOString()}]},errors:[]};}
export function updateStatus(state,module,id,status){if(!["orders","deliveries","finance","production","quality"].includes(module))throw Error("Status updates not allowed");return {...state,[module]:(state[module]??[]).map(x=>x.id===id?{...x,status}:x)};}
export function summarize(state){return {partners:(state.partners??[]).length,hubs:(state.hubs??[]).length,orders:(state.orders??[]).length,orderedBottles:(state.orders??[]).reduce((n,x)=>n+Number(x.quantity||0),0),inventoryBottles:(state.inventory??[]).reduce((n,x)=>n+Number(x.quantity||0),0),qualityHolds:(state.quality??[]).filter(x=>x.result==="Hold").length};}
export function csvExport(rows,fields){const q=x=>'"'+String(x??"").replaceAll('"','""')+'"';return [fields.map(q).join(","),...rows.map(r=>fields.map(f=>q(r[f])).join(",")].join("\r\n");}
