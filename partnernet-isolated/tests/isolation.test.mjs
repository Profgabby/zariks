import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
assert.ok(page.includes("No live database"));
assert.ok(page.includes("Executive Overview"));
assert.ok(!/createClient\(|supabase\.from\(|fetch\(|axios\./.test(page));
assert.ok(existsSync(new URL("../app/layout.tsx",import.meta.url)));
console.log("PASS: isolated page, standalone layout, no network calls");
