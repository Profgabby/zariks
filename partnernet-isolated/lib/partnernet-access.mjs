/**
 * Pure, fail-closed authorization rules. No client-provided role may be trusted.
 * Input must originate from a server-validated identity and authoritative
 * organization membership lookup.
 */
export function authorizePartnerNet({identity,membership,action,organizationId}={}){
  if(!identity?.id || identity.verified!==true) return {allowed:false,reason:"unauthenticated"};
  if(!membership || membership.userId!==identity.id || membership.active!==true) return {allowed:false,reason:"no-active-membership"};
  if(!membership.organizationId || !organizationId || membership.organizationId!==organizationId) return {allowed:false,reason:"organization-scope"};
  const grants=Array.isArray(membership.permissions)?membership.permissions:[];
  if(typeof action!=="string" || !grants.includes(action)) return {allowed:false,reason:"permission-denied"};
  return {allowed:true,reason:"authorized"};
}
