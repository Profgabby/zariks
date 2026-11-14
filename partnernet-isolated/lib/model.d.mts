export type PartnerNetRecord=Record<string,string>;
export type PartnerNetState=Record<string,PartnerNetRecord[]>;
export declare const modules:Record<string,{title:string;fields:string[];required:string[]}>;
export declare function validateRecord(module:string,record:PartnerNetRecord):string[];
export declare function addRecord(state:PartnerNetState,module:string,record:PartnerNetRecord):{state:PartnerNetState;errors:string[]};
export declare function updateStatus(state:PartnerNetState,module:string,id:string,status:string):PartnerNetState;
export declare function summarize(state:PartnerNetState):{partners:number;hubs:number;orders:number;orderedBottles:number;inventoryBottles:number;qualityHolds:number};
export declare function csvExport(rows:PartnerNetRecord[],fields:string[]):string;
