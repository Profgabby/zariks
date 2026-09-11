"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const str=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const num=(f:FormData,k:string)=>Number(f.get(k)??0);

export async function createEmployee(formData:FormData){
 const s=await createServerSupabaseClient();
 const {data,error}=await s.rpc("fn_create_employee",{p_full_name:str(formData,"full_name"),p_work_email:str(formData,"work_email"),p_department:str(formData,"department"),p_job_title:str(formData,"job_title"),p_employment_type:str(formData,"employment_type")||"employee",p_hire_date:str(formData,"hire_date")||null,p_pay_frequency:str(formData,"pay_frequency")||"monthly",p_base_salary:num(formData,"base_salary")});
 if(error) throw new Error(error.message); revalidatePath("/payroll/employees"); redirect(`/payroll/employees/${data}`);
}

export async function addCompensationComponent(formData:FormData){
 const s=await createServerSupabaseClient(); const employeeId=str(formData,"employee_id");
 const {error}=await s.rpc("fn_add_employee_component",{p_employee_id:employeeId,p_component_name:str(formData,"component_name"),p_category:str(formData,"component_category"),p_type:str(formData,"component_type"),p_calculation_type:str(formData,"calculation_type"),p_value:num(formData,"value"),p_recurring:formData.get("recurring")!==null});
 if(error) throw new Error(error.message); revalidatePath(`/payroll/employees/${employeeId}`); revalidatePath("/payroll/employees");
}

export async function createPayrollRun(formData:FormData){
 const s=await createServerSupabaseClient();
 const {data,error}=await s.rpc("fn_create_payroll_run",{p_period_start:str(formData,"period_start"),p_period_end:str(formData,"period_end"),p_pay_date:str(formData,"pay_date"),p_pay_frequency:str(formData,"pay_frequency")||"monthly"});
 if(error) throw new Error(error.message); revalidatePath("/payroll/runs"); redirect(`/payroll/runs/${data}`);
}

export async function addPayrollAdjustment(formData:FormData){
 const s=await createServerSupabaseClient(); const runId=str(formData,"run_id");
 const {error}=await s.rpc("fn_add_payroll_adjustment",{p_run_item_id:str(formData,"run_item_id"),p_name:str(formData,"adjustment_name"),p_category:str(formData,"adjustment_category"),p_type:str(formData,"adjustment_type"),p_amount:num(formData,"amount"),p_note:str(formData,"note")});
 if(error) throw new Error(error.message); revalidatePath(`/payroll/runs/${runId}`);
}

export async function submitPayrollForApproval(formData:FormData){const s=await createServerSupabaseClient();const id=str(formData,"run_id");const {error}=await s.rpc("fn_submit_payroll_for_approval",{p_run_id:id});if(error)throw new Error(error.message);revalidatePath(`/payroll/runs/${id}`);revalidatePath("/payroll/runs");}
export async function approvePayrollRun(formData:FormData){const s=await createServerSupabaseClient();const id=str(formData,"run_id");const {error}=await s.rpc("fn_approve_payroll_run",{p_run_id:id});if(error)throw new Error(error.message);revalidatePath(`/payroll/runs/${id}`);revalidatePath("/payroll/runs");}
export async function generatePayrollPayments(formData:FormData){const s=await createServerSupabaseClient();const id=str(formData,"run_id");const {error}=await s.rpc("fn_generate_payroll_payments",{p_run_id:id});if(error)throw new Error(error.message);revalidatePath(`/payroll/runs/${id}`);revalidatePath("/payroll/runs");revalidatePath("/transfers");}
