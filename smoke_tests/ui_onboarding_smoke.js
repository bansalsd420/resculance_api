require('dotenv').config();
const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

const FRONTEND = process.env.FRONTEND_BASE || 'http://localhost:5173';
const hospitalUser = { id: 46, email: 'apex-admin@gmail.com', role: 'hospital_admin', organization_id: 15, first_name: 'apex-admin-new', last_name: 'admin' };

(async () => {
  const token = jwt.sign({ id: hospitalUser.id, role: hospitalUser.role, organizationId: hospitalUser.organization_id, firstName: hospitalUser.first_name, lastName: hospitalUser.last_name, email: hospitalUser.email }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', { expiresIn: '1h' });

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Set accessToken in localStorage before loading the app
  await page.goto(FRONTEND, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => { localStorage.setItem('accessToken', t); }, token);

  // Navigate to onboarding page
  const url = `${FRONTEND}/onboarding`;
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for ambulance table to appear
  await page.waitForSelector('table', { timeout: 10000 });

  // Extract rows from 'Your Hospital Ambulances' table and partner sections
  const result = await page.evaluate(() => {
    // Helper to find table by heading text
    function getTableRowsByHeading(headingText) {
      const headings = Array.from(document.querySelectorAll('h3, h2'));
      const heading = headings.find(h => (h.textContent || '').toLowerCase().includes(headingText.toLowerCase()));
      if (!heading) return [];
      // find next table element in DOM after heading
      let el = heading.nextElementSibling;
      while (el && el.tagName && el.tagName.toLowerCase() !== 'table') el = el.nextElementSibling;
      if (!el) return [];
      return Array.from(el.querySelectorAll('tbody tr')).map(r => {
        const cells = Array.from(r.querySelectorAll('td'));
        return cells.map(c => c.innerText.trim()).join(' | ');
      });
    }

    const yourHospitalRows = getTableRowsByHeading('Your Hospital Ambulances') || [];
    // partnered fleet groups: headings that contain '(Partner)'
    const partnerHeadings = Array.from(document.querySelectorAll('h3')).filter(h => (h.textContent||'').includes('(Partner)'));
    const partnerGroups = partnerHeadings.map(h => {
      const title = h.textContent.trim();
      let el = h.nextElementSibling;
      while (el && el.tagName && el.tagName.toLowerCase() !== 'table') el = el.nextElementSibling;
      if (!el) return { title, rows: [] };
      const rows = Array.from(el.querySelectorAll('tbody tr')).map(r => {
        const cells = Array.from(r.querySelectorAll('td'));
        return cells.map(c => c.innerText.trim()).join(' | ');
      });
      return { title, rows };
    });

    return { yourHospitalRows, partnerGroups };
  });

  console.log('Your Hospital rows count:', result.yourHospitalRows.length);
  result.partnerGroups.forEach(pg => console.log(`Partner group: ${pg.title}, rows: ${pg.rows.length}`));

  // Check for duplicates across yourHospitalRows and partnerGroups
  const hospitalSet = new Set(result.yourHospitalRows);
  const duplicates = [];
  for (const pg of result.partnerGroups) {
    for (const row of pg.rows) {
      if (hospitalSet.has(row)) duplicates.push({ group: pg.title, row });
    }
  }

  if (duplicates.length > 0) {
    console.error('Duplicates found between hospital and partner tables:', duplicates);
  } else {
    console.log('No duplicates found in UI rendering.');
  }

  await browser.close();
})();
