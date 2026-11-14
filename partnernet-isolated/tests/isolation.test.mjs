import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
assert.ok(page.includes("Local sample data"));
assert.ok(page.includes("No live connection"));
assert.ok(!/createClient\(|supabase\.from\(|fetch\(|axios\./.test(page),"Local page must not call APIs");
assert.ok(existsSync(new URL("../app/layout.tsx",import.meta.url)));
console.log("Isolation checks passed: no API calls, sample labels, standalone layout.");
