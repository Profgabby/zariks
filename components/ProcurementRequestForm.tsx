"use client";

import { useMemo, useState } from "react";
import { createProcurementRequest } from "@/app/actions/procurement";

type Line = { id: number; item: string; description: string; quantity: number; unit: string; unitCost: number };
const blank = (id: number): Line => ({ id, item: "", description: "", quantity: 1, unit: "", unitCost: 0 });
const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });

export default function ProcurementRequestForm() {
  const [lines, setLines] = useState<Line[]>([blank(1)]);
  const total = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0), [lines]);
  const update = (id: number, patch: Partial<Line>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));

  return (
    <form action={createProcurementRequest} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Request Type"><select name="request_type" className="input" defaultValue="procurement"><option value="procurement">Procurement Request</option><option value="money_request">Money Request</option><option value="reimbursement">Reimbursement</option><option value="petty_cash">Petty Cash</option></select></Field>
        <Field label="Date"><input name="request_date" type="date" className="input" defaultValue={new Date().toISOString().slice(0,10)} required /></Field>
        <Field label="From Whom"><input name="from_whom" className="input" placeholder="Person, department or organization" /></Field>
        <Field label="To Whom"><input name="to_whom" className="input" placeholder="Supplier, payee or recipient" /></Field>
        <Field label="Department"><input name="department" className="input" placeholder="e.g. Production, Packaging, Administration" /></Field>
        <Field label="Required By"><input name="required_by" type="date" className="input" /></Field>
      </section>

      <section>
        <Field label="For What? / Purpose"><input name="purpose" className="input" placeholder="State exactly what the money or procurement is for" required /></Field>
        <div className="mt-5"><Field label="Justification / Notes"><textarea name="justification" className="input min-h-28" placeholder="Explain why this request is required" /></Field></div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Items</h2><p className="text-sm text-gray-500">All values are in Nigerian Naira (₦).</p></div><button type="button" onClick={() => setLines((v) => [...v, blank(Date.now())])} className="rounded-lg border border-[#006b3c] px-4 py-2 text-sm font-bold text-[#006b3c]">+ Add Item</button></div>
        <div className="space-y-4">
          {lines.map((line, index) => <div key={line.id} className="rounded-xl border bg-[#fbfcfa] p-4">
            <div className="mb-3 flex justify-between"><strong>Item {index + 1}</strong>{lines.length > 1 && <button type="button" className="text-sm font-semibold text-red-700" onClick={() => setLines((v) => v.filter((x) => x.id !== line.id))}>Remove</button>}</div>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="md:col-span-2"><Field label="Item"><input name="item_name" value={line.item} onChange={(e) => update(line.id,{item:e.target.value})} className="input" required /></Field></div>
              <div className="md:col-span-2"><Field label="Description"><input name="item_description" value={line.description} onChange={(e) => update(line.id,{description:e.target.value})} className="input" /></Field></div>
              <Field label="Qty"><input name="quantity" type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => update(line.id,{quantity:Number(e.target.value)})} className="input" required /></Field>
              <Field label="Unit"><input name="unit" value={line.unit} onChange={(e) => update(line.id,{unit:e.target.value})} className="input" placeholder="pcs, kg..." /></Field>
              <div className="md:col-span-2"><Field label="Unit Cost (₦)"><input name="unit_cost" type="number" min="0" step="0.01" value={line.unitCost} onChange={(e) => update(line.id,{unitCost:Number(e.target.value)})} className="input" required /></Field></div>
              <div className="md:col-span-2"><p className="text-sm font-semibold text-gray-600">Line Total</p><p className="mt-2 text-lg font-bold">{ngn.format(line.quantity * line.unitCost)}</p></div>
            </div>
          </div>)}
        </div>
      </section>

      <section className="rounded-xl bg-[#063d28] p-6 text-white"><div className="flex items-end justify-between"><div><p className="text-sm text-green-100">TOTAL REQUESTED</p><p className="text-xs text-green-100">Currency: NGN</p></div><p className="text-3xl font-bold text-[#FDB515]">{ngn.format(total)}</p></div></section>

      <section className="grid gap-4 rounded-xl border p-5 md:grid-cols-3"><Approval label="REQUESTED BY" value="Current signed-in user" /><Approval label="VERIFIED BY" value="Pending verification" /><Approval label="APPROVED BY" value="Pending approval" /></section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="submit" className="rounded-lg bg-[#FDB515] px-7 py-3 font-bold text-[#172016] shadow-sm">Submit Request</button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>{children}</label>; }
function Approval({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold tracking-wider text-[#006b3c]">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>; }
