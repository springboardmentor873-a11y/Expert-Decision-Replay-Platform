/**
 * End-to-end UI tests for the Expert Decision Replay Platform.
 *
 *   node tests/ui-e2e.mjs
 *
 * Requires Playwright on NODE_PATH, e.g.
 *   set NODE_PATH=C:\Users\hp\.agents\skills\playwright\node_modules
 *
 * Screenshots are written to tests/screenshots/.
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.TARGET_URL || 'http://127.0.0.1:5173';
const SHOTS = path.join(process.cwd(), 'tests', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const stamp = Date.now();
const EMP = `ui-emp${stamp}@example.com`;
const MGR = `ui-mgr${stamp}@example.com`;
const PW = 'Passw0rd!';
// Self-service signup cannot create privileged accounts, so the manager
// flow signs in with the operator-configured bootstrap manager instead.
const BOOTSTRAP_EMAIL = process.env.BOOTSTRAP_MANAGER_EMAIL || 'admin@example.com';
const BOOTSTRAP_PASSWORD = process.env.BOOTSTRAP_MANAGER_PASSWORD || 'Admin@12345';
// Unique per run so text assertions are not polluted by earlier runs.
const DECISION = `Adopt observability tooling ${stamp}`;
const COMMENT = `Kickoff scheduled for Monday (${stamp}).`;
const ALTERNATIVE = `Keep status-page only (${stamp})`;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

function section(t) {
  console.log(`\n=== ${t} ===`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

const apiFailures = [];
const unauthorized = [];
page.on('response', (r) => {
  const u = r.url();
  if (!u.includes('/api/')) return;
  if (r.status() === 401) unauthorized.push(u.replace(BASE, ''));
  if (r.status() >= 400) apiFailures.push(`${r.status()} ${u.replace(BASE, '')}`);
});

async function login(email, password = PW, expectSuccess = true) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  if (expectSuccess) {
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    } catch (err) {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
      throw new Error(`login as ${email} never reached /dashboard. Body: ${body}`);
    }
  } else {
    await page.waitForTimeout(1500);
  }
}

async function register(email, role) {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill(
    'input[placeholder="Enter your full name"]',
    role === 'manager' ? 'UI Manager' : 'UI Employee',
  );
  await page.fill('input[type="email"]', email);
  const pws = page.locator('input[type="password"]');
  await pws.nth(0).fill(PW);
  await pws.nth(1).fill(PW);
  await page.selectOption('select', role);
  await page.click('button.register-button');
  await page.waitForURL('**/login', { timeout: 15000 });
}

// Navigate and wait until the shell plus content have actually rendered.
async function go(target) {
  await page.goto(`${BASE}${target}`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('.app-sidebar, .topbar', { timeout: 20000 });
  } catch (e) {
    const text = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    throw new Error(`page at ${target} never rendered: ${text}`);
  }
  await page
    .waitForFunction(() => !document.querySelector('.loading-spinner'), {
      timeout: 20000,
    })
    .catch(() => {});
  await page.waitForTimeout(600);
}

const shot = (name) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

try {
  // --------------------------------------------------------------
  section('1. AUTH PAGES');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('login page renders', await page.locator('text=Welcome Back').first().isVisible());
  await shot('01-login');

  await register(EMP, 'employee');
  check('registration redirects to login', page.url().includes('/login'));
  await register(MGR, 'manager');
  check('manager registration redirects to login', page.url().includes('/login'));

  await login('wrong@example.com', PW, false);
  check('bad credentials rejected in UI',
    (await page.locator('text=/Invalid email or password/').count()) > 0);

  // Privileged roles cannot be self-assigned, so the manager flow below
  // signs in with the operator-configured bootstrap manager instead.
  await login(MGR, PW);
  await go('/dashboard');
  check('self-service manager signup did not grant manager access',
    (await page.locator('a[href="/teams"]').count()) === 0);
  check('self-service signup kept manager banner off',
    (await page.locator('text=Manager access').count()) === 0);
  await page.evaluate(() => localStorage.removeItem('user'));

  // --------------------------------------------------------------
  section('2. EMPLOYEE FLOW');
  await login(EMP);
  await go('/dashboard');
  check('employee lands on dashboard', page.url().includes('/dashboard'));
  check('employee sees own workspace banner',
    (await page.locator('text=Employee access').count()) > 0);
  check('employee sees New Decision entry',
    (await page.locator('text=New Decision').count()) > 0);
  check('employee does NOT see Teams nav',
    (await page.locator('a[href="/teams"]').count()) === 0);
  check('My Decisions nav points to /my-decisions',
    (await page.locator('a[href="/my-decisions"]').count()) > 0);
  check('employee nav labels approvals as My Requests',
    (await page.locator('a[href="/approvals"]').textContent())?.includes('My Requests'));
  await shot('02-employee-dashboard');

  await go('/approvals');
  check('employee can open own requests', page.url().includes('/approvals'));
  check('employee has no approve action',
    (await page.locator('button.approvals-approve-button').count()) === 0);
  check('employee has no reject action',
    (await page.locator('button.approvals-reject-button').count()) === 0);

  await go('/teams');
  check('employee blocked from /teams route', page.url().includes('/dashboard'));

  // create a decision
  await go('/decisions/new');
  const textInputs = page.locator('form input[type="text"]');
  await textInputs.first().fill(DECISION);
  const areas = page.locator('textarea');
  await areas.nth(0).fill('We have no visibility into production latency.');
  await areas.nth(1).fill(
    'Adopting a tracing platform improves MTTR and reduces escalations.',
  );
  const sel = page.locator('select');
  if (await sel.count()) await sel.first().selectOption({ index: 1 }).catch(() => {});
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/decisions\/\d+/, { timeout: 20000 });
  const decisionUrl = page.url();
  const decisionId = decisionUrl.match(/decisions\/(\d+)/)[1];
  check('decision created and detail page opened', !!decisionId, decisionUrl);
  await go(`/decisions/${decisionId}`);
  check('detail page shows new title',
    (await page.locator(`text=${DECISION}`).count()) > 0);
  await shot('03-decision-detail');

  // add an alternative
  const altInput = page.locator('input[placeholder="e.g. React"]');
  await altInput.fill(ALTERNATIVE);
  await page.locator('form button').filter({ hasText: 'Add Option' }).first().click();
  await page.waitForTimeout(2000);
  check('alternative appears after add',
    (await page.locator(`text=${ALTERNATIVE}`).count()) > 0);

  // add a comment (discussion tab is tab-gated on the detail page)
  await page.locator('.tab').filter({ hasText: 'Discussion' }).first().click();
  await page.waitForTimeout(800);
  const commentBox = page.locator('textarea[placeholder*="Share your thoughts"]');
  await commentBox.fill(COMMENT);
  await page.locator('.discussion-actions button[type="submit"]').first().click();
  await page.waitForTimeout(2000);
  check('comment appears after post',
    (await page.locator(`text=${COMMENT}`).count()) > 0);

  // upload a file (documents tab is tab-gated on the detail page)
  await page.locator('.tab').filter({ hasText: 'Documents' }).first().click();
  await page.waitForTimeout(800);
  const tmpFile = path.join(SHOTS, 'ui-upload.pdf');
  fs.writeFileSync(tmpFile, '%PDF-1.4\nui test upload\n');
  await page.locator('input#decision-file-input').setInputFiles(tmpFile);
  await page.locator('button.upload-main-btn').click();
  await page.waitForTimeout(3000);
  check('upload succeeded', (await page.locator('text=Upload successful').count()) > 0);
  check('uploaded document listed',
    (await page.locator('text=ui-upload.pdf').count()) > 0);
  await shot('04-after-interactions');

  // submit for approval
  page.once('dialog', (d) => d.accept());
  const submitApproval = page.locator('button')
    .filter({ hasText: /Submit for Approval/i }).first();
  if (await submitApproval.count()) {
    await submitApproval.click();
    await page.waitForTimeout(2000);
  }
  check('decision now Under Review',
    (await page.locator('text=Under Review').count()) > 0);

  await go('/discussions');
  check('employee sees own discussion',
    (await page.locator(`text=${COMMENT}`).count()) > 0);
  await shot('05-discussions');

  await go('/documents');
  check('documents module lists upload',
    (await page.locator('text=ui-upload.pdf').count()) > 0);
  await shot('06-documents');

  await go('/knowledge-graph');
  check('knowledge graph renders nodes',
    (await page.locator('.knowledge-graph-node-group').count()) > 0);
  await shot('07-knowledge-graph');

  await go('/analytics');
  check('analytics renders panels',
    (await page.locator('.analytics-panel, .analytics-card').count()) > 0);
  await shot('08-analytics');

  await go('/audit-logs');
  check('audit log page renders rows',
    (await page.locator('text=Decision created').count()) > 0);
  await shot('09-audit-logs');

  await go('/my-decisions');
  check('my decisions page lists decision',
    (await page.locator(`text=${DECISION}`).count()) > 0);

  // theme toggle
  await go('/dashboard');
  await page.locator('.theme-toggle').first().click();
  await page.waitForTimeout(500);
  check('theme toggle switches to dark',
    (await page.evaluate(() => document.body.dataset.theme)) === 'dark');
  await shot('10-dark-theme');
  await page.locator('.theme-toggle').first().click();
  await page.waitForTimeout(400);
  check('theme toggle switches back to light',
    (await page.evaluate(() => document.body.dataset.theme)) === 'light');

  // notification bell
  await page.locator('button[aria-label="Notifications"]').first().click();
  await page.waitForTimeout(1000);
  check('notification popover opens',
    (await page.locator('.notification-popover').count()) > 0);
  await shot('11-notifications');
  await page.keyboard.press('Escape');
  await page.locator('main, .dashboard-content').first().click({ position: { x: 5, y: 400 } })
    .catch(() => {});

  // --------------------------------------------------------------
  section('3. MANAGER FLOW');
  await page.evaluate(() => localStorage.removeItem('user'));
  await login(BOOTSTRAP_EMAIL, BOOTSTRAP_PASSWORD);
  await go('/dashboard');
  check('manager lands on dashboard', page.url().includes('/dashboard'));
  check('manager sees Manager access banner',
    (await page.locator('text=Manager access').count()) > 0);
  check('manager sees Approvals nav',
    (await page.locator('a[href="/approvals"]').count()) > 0);
  check('manager sees Teams nav',
    (await page.locator('a[href="/teams"]').count()) > 0);
  check('manager does NOT see New Decision',
    (await page.locator('a[href="/decisions/new"]').count()) === 0);
  await shot('12-manager-dashboard');

  await go('/approvals');
  check('approvals page shows pending request',
    (await page.locator(`text=${DECISION}`).count()) > 0);
  check('approval status tabs render',
    (await page.locator('.approvals-tab').count()) === 3);
  await shot('13-approvals');

  page.once('dialog', (d) => d.accept());
  await page.locator('button.approvals-approve-button').first().click();
  await page.waitForTimeout(3000);
  check('approval removed from pending list',
    (await page.locator(`text=${DECISION}`).count()) === 0);

  await   page.locator('.approvals-tab').filter({ hasText: 'Approved' }).click();
  await page.waitForTimeout(2200);
  check('manager approved tab shows approved request',
    (await page.locator(`text=${DECISION}`).count()) > 0);
  await shot('14-approvals-history');

  await go('/teams');
  check('teams page lists members', (await page.locator('.team-card').count()) > 0);
  await shot('15-teams');

  await go(`/decisions/${decisionId}`);
  check('manager can open employee decision',
    (await page.locator(`text=${DECISION}`).count()) > 0);
  check('manager sees Edit action',
    (await page.locator('button').filter({ hasText: /Edit/ }).count()) > 0);
  await shot('16-manager-decision');

  await go('/analytics');
  check('manager analytics is organization-scoped',
    (await page.locator('text=organization is managing').count()) > 0);

  await go('/discussions');
  check('manager sees all discussions',
    (await page.locator(`text=${COMMENT}`).count()) > 0);

  // Employee sees their approved request in their own history tab.
  section('3b. EMPLOYEE SEES APPROVAL OUTCOME');
  await page.evaluate(() => localStorage.removeItem('user'));
  await login(EMP);
  await go('/approvals');
  check('employee can open requests history',
    (await page.locator('.approvals-tab').count()) === 3);
  await page.locator('.approvals-tab').filter({ hasText: 'Approved' }).click();
  await page.waitForTimeout(2200);
  check('approved decision appears in employee history',
    (await page.locator(`text=${DECISION}`).count()) > 0);
  await shot('14b-employee-approved');
  await go(`/decisions/${decisionId}`);
  check('decision status is Approved',
    (await page.locator('text=Approved').count()) > 0);

  // --------------------------------------------------------------
  section('4. LOGOUT + DEEP LINK + MOBILE');
  await go('/dashboard');
  await page.locator('.sidebar-logout').first().click();
  await page.waitForTimeout(1000);
  check('logout returns to login', page.url().includes('/login'));
  check('logout clears session',
    (await page.evaluate(() => localStorage.getItem('user'))) === null);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  check('protected route redirects when signed out', page.url().includes('/login'));

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await mpage.screenshot({ path: path.join(SHOTS, '17-mobile-login.png'), fullPage: true });
  await mpage.fill('input[type="email"]', MGR);
  await mpage.fill('input[type="password"]', PW);
  await mpage.click('button[type="submit"]');
  await mpage.waitForURL('**/dashboard', { timeout: 15000 });
  await mpage.waitForTimeout(1200);
  await mpage.screenshot({ path: path.join(SHOTS, '18-mobile-dashboard.png'), fullPage: true });
  check('mobile dashboard renders', await mpage.locator('.dashboard-main').isVisible());
  await mobile.close();

  // --------------------------------------------------------------
  section('5. RUNTIME HEALTH');
  const realErrors = consoleErrors.filter(
    (e) => !/favicon|React DevTools|Failed to load resource/.test(e),
  );
  check('no uncaught console/page errors', realErrors.length === 0,
    JSON.stringify(realErrors.slice(0, 3)));
  const unexpectedApi = apiFailures.filter((f) => !/401|\/login|\/register/.test(f));
  check('no unexpected API errors during UI run', unexpectedApi.length === 0,
    JSON.stringify(unexpectedApi.slice(0, 5)));
  // /api/login returns 401 on purpose in the bad-credentials test above.
  const badAuth = [...new Set(unauthorized)].filter((u) => !u.endsWith('/login'));
  check('no unexpected 401 responses', badAuth.length === 0,
    JSON.stringify(badAuth.slice(0, 5)));
} catch (err) {
  fail++;
  failures.push(`FATAL: ${err.message}`);
  console.error('FATAL:', err.message);
}

console.log(`\n${'='.repeat(50)}`);
console.log(`PASSED: ${pass}    FAILED: ${fail}`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log('='.repeat(50));

await browser.close();
process.exit(fail ? 1 : 0);