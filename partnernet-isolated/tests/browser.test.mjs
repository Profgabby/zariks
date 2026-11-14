import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = 3100;
const base = `http://127.0.0.1:${port}`;
const server = spawn("npm", ["run", "start"], { stdio: "pipe", env: { ...process.env, PORT: String(port) } });
let output = "";
server.stdout.on("data", data => { output += data.toString(); });
server.stderr.on("data", data => { output += data.toString(); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer() {
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error("Next.js server exited: " + output);
    try { const res = await fetch(base); if (res.ok) return; } catch {}
    await sleep(500);
  }
  throw new Error("Next.js server did not become ready: " + output);
}
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(base);
  await page.getByRole("heading", { name: "Executive Overview" }).waitFor();
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await page.getByRole("heading", { name: "New Orders record" }).waitFor();
  await page.getByLabel("customer", { exact: false }).fill("School A");
  await page.getByLabel("sku", { exact: false }).fill("ZRK-500");
  await page.getByLabel("quantity", { exact: false }).fill("25");
  await page.getByRole("button", { name: "Save local record" }).click();
  await page.getByText("School A").waitFor();
  await page.getByLabel("Status for ORD-0001").selectOption("Approved");
  assert.equal(await page.getByLabel("Status for ORD-0001").inputValue(), "Approved");
  await page.getByLabel("Search records").fill("no-such-customer");
  await page.getByText("No matching records.").waitFor();
  await page.getByLabel("Search records").fill("School A");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "zariks-orders.csv");
  await page.getByRole("button", { name: "Executive Overview" }).click();
  await page.getByText("Ordered bottles").waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await page.getByText("No matching records.").waitFor();
  assert.deepEqual(errors, [], "browser console page errors");
  console.log("PASS: browser navigation, order creation, status, search, CSV download, overview, non-persistence");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
