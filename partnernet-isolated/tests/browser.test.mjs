import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = 3100;
const base = `http://127.0.0.1:${port}`;
const server = spawn("npm", ["run", "start"], { stdio: "pipe", detached: true, env: { ...process.env, PORT: String(port) } });
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
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(base + "/site/index.html");
  await page.getByRole("heading", { name: "Welcome to ZARIKS" }).waitFor();
  const logo = page.locator(".brand img").first();
  assert.equal(await logo.evaluate(el => el.complete && el.naturalWidth > 0), true, "brand logo loaded");
  const campaign = page.locator(".hero img").first();
  assert.equal(await campaign.evaluate(el => el.complete && el.naturalWidth > 0), true, "campaign image loaded");
  await page.getByRole("link", { name: "About ZARIKS" }).first().click();
  await page.getByRole("heading", { name: "Rooted in nature. Built for people." }).first().waitFor();
  await page.goto(base + "/partners");
  await page.getByRole("heading", { name: "ZARIKS Partner Network" }).waitFor();
  for (const restricted of ["/operations", "/site/partnernet.html", "/staff", "/admin"]) {
    await page.goto(base + restricted);
    await page.getByRole("heading", { name: "Workspace access" }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/access", restricted + " must be denied");
  }
  assert.deepEqual(errors, [], "browser console page errors");
  console.log("PASS: public site, images, partner page and fail-closed protected routes");
} finally {
  await browser?.close();
  try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill("SIGTERM"); }
}
