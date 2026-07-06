// Connects the frontend to activity tracking API features.
const ACTIVITY_STORAGE_KEY = 'accountActivityRecords';
const COMPANY_STORAGE_KEY = 'userCompanies';
const LEGACY_HISTORY_VERSION = 1;

const DEMO_IPS = {
  'company-a': ['203.122.45.67', '203.122.45.68', '117.201.10.25', '203.122.45.69', '139.59.12.11'],
  'company-b': ['45.118.166.21', '103.87.142.18', '152.58.221.42', '49.36.88.104', '157.49.19.76'],
};

// Helps with normalize email.
const normalizeEmail = (email = '') => email.trim().toLowerCase();

// Helps with normalize company id.
const normalizeCompanyId = (companyId) => {
  if (companyId === 1 || companyId === '1') return 'company-a';
  if (companyId === 2 || companyId === '2') return 'company-b';
  return companyId || 'company-a';
};

// Reads records from storage.
const readRecords = () => {
  try {
    // Gets saved activity records.
    const records = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]');
    // Removes old demo records.
    const cleanedRecords = records.filter((record) => !record.demoActivityVersion);
    if (cleanedRecords.length !== records.length) {
      writeRecords(cleanedRecords);
    }
    return cleanedRecords;
  } catch {
    return [];
  }
};

const LEGACY_ACCOUNTS = [
  { email: 'aac@gmail.com', name: 'aac', fallbackCompanyId: 'company-a' },
  { email: 'ags@gmail.com', name: 'ags', fallbackCompanyId: 'company-a' },
  { email: 'aq@gmail.com', name: 'aq', fallbackCompanyId: 'company-a' },
  { email: 'aqqw@gmail.com', name: 'aqqw', fallbackCompanyId: 'company-a' },
  { email: 'ash@gmail.com', name: 'ash', fallbackCompanyId: 'company-b' },
  { email: 'azz@gmail.com', name: 'azz', fallbackCompanyId: 'company-b' },
  { email: 'dravidkumar180@gmail.com', name: 'dravidkumar180', fallbackCompanyId: 'company-b' },
  { email: 'dravidk180@gmaiI.com', name: 'dravidk180', fallbackCompanyId: 'company-b' },
];

const LEGACY_BROWSERS = [
  'Edge 149.0 / Win32',
  'Chrome 125.0 / Windows 11',
  'Firefox 126.0 / Windows 11',
  'Safari 17.5 / macOS 14',
];

// Writes records.
const writeRecords = (records) => {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(records));
};

// Gets stored company for email data.
const getStoredCompanyForEmail = (email) => {
  try {
    const userCompanies = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || '{}');
    return userCompanies[normalizeEmail(email)];
  } catch {
    return null;
  }
};

// Gets browser info data.
const getBrowserInfo = () => {
  // Handles server-side use.
  if (typeof navigator === 'undefined') return 'Unknown browser';

  // Reads browser details.
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || 'Unknown OS';

  // Browser match rules.
  const browserRules = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];

  // Finds current browser.
  const match = browserRules
    .map(([regex, name]) => {
      const found = userAgent.match(regex);
      return found ? `${name} ${found[1].split('.').slice(0, 2).join('.')}` : null;
    })
    .find(Boolean);

  return `${match || 'Browser'} / ${platform}`;
};

// Gets stable demo ip data.
const getStableDemoIp = (user) => {
  // Gets company IP list.
  const companyId = normalizeCompanyId(user?.companyId || user?.company_id);
  const companyIps = DEMO_IPS[companyId] || DEMO_IPS['company-a'];
  const email = normalizeEmail(user?.email);
  // Makes stable email hash.
  const hash = email.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return companyIps[hash % companyIps.length];
};

// Gets public ip data.
const fetchPublicIp = async (fallbackIp) => {
  // Uses fallback without fetch.
  if (typeof fetch === 'undefined') return fallbackIp;

  const controller = new AbortController();
  // Stops slow IP request.
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    // Gets public IP address.
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      cache: 'no-store',
    });
    const data = await response.json();
    return data?.ip || fallbackIp;
  } catch {
    // Uses fallback on error.
    return fallbackIp;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Adds or updates record.
const upsertRecord = (user, changes) => {
  // Stops without email.
  if (!user?.email) return null;

  // Reads existing records.
  const records = readRecords();
  const email = normalizeEmail(user.email);
  const companyId = normalizeCompanyId(user.companyId || user.company_id);
  // Finds existing record.
  const existingIndex = records.findIndex((record) => (
    normalizeEmail(record.email) === email && normalizeCompanyId(record.companyId) === companyId
  ));
  const existing = existingIndex >= 0 ? records[existingIndex] : {};
  // Builds updated record.
  const nextRecord = {
    id: existing.id || `${companyId}:${email}`,
    userId: user.id || existing.userId || email,
    name: user.name || existing.name || email.split('@')[0],
    email: user.email,
    companyId,
    companyName: companyId === 'company-b' ? 'Company B' : 'Company A',
    role: user.role || existing.role || 'user',
    source: 'account',
    browser: existing.browser || getBrowserInfo(),
    ipAddress: existing.ipAddress || getStableDemoIp(user),
    history: Array.isArray(existing.history) ? existing.history : [],
    ...existing,
    ...changes,
  };

  // Updates or adds record.
  if (existingIndex >= 0) {
    records[existingIndex] = nextRecord;
  } else {
    records.push(nextRecord);
  }

  writeRecords(records);
  return nextRecord;
};

// Adds history.
const appendHistory = (record, type, timestamp) => ({
  ...record,
  // Adds newest activity first.
  history: [
    {
      type,
      timestamp,
      browser: record.browser,
      ipAddress: record.ipAddress,
    },
    ...(record.history || []),
  ],
});

// Records signup activity.
export const recordSignupActivity = async (user) => {
  // Creates signup timestamp.
  const timestamp = new Date().toISOString();
  const browser = getBrowserInfo();
  const ipAddress = await fetchPublicIp(getStableDemoIp(user));
  // Saves signup details.
  const baseRecord = upsertRecord(user, {
    signupAt: timestamp,
    browser,
    ipAddress,
    status: 'Active',
  });

  // Stops if record failed.
  if (!baseRecord) return null;
  // Adds signup history.
  const nextRecord = appendHistory(baseRecord, 'signup', timestamp);
  upsertRecord(user, nextRecord);
  return nextRecord;
};

// Records login activity.
export const recordLoginActivity = async (user) => {
  // Creates login timestamp.
  const timestamp = new Date().toISOString();
  const browser = getBrowserInfo();
  const ipAddress = await fetchPublicIp(getStableDemoIp(user));
  // Saves login details.
  const baseRecord = upsertRecord(user, {
    lastLogin: timestamp,
    browser,
    ipAddress,
    status: 'Active',
  });

  // Stops if record failed.
  if (!baseRecord) return null;
  // Adds login history.
  const nextRecord = appendHistory(baseRecord, 'login', timestamp);
  upsertRecord(user, nextRecord);
  return nextRecord;
};

// Records logout activity.
export const recordLogoutActivity = (user) => {
  // Creates logout timestamp.
  const timestamp = new Date().toISOString();
  // Saves logout details.
  const baseRecord = upsertRecord(user, {
    lastLogout: timestamp,
    status: 'Inactive',
  });

  // Stops if record failed.
  if (!baseRecord) return null;
  // Adds logout history.
  const nextRecord = appendHistory(baseRecord, 'logout', timestamp);
  upsertRecord(user, nextRecord);
  return nextRecord;
};

// Gets activity records data.
export const getActivityRecords = () => readRecords();

// Prepares ensure legacy account history.
export const ensureLegacyAccountHistory = () => {
  // Gets current records.
  const records = readRecords();
  const now = new Date();

  // Adds history for old accounts.
  LEGACY_ACCOUNTS.forEach((account, accountIndex) => {
    const email = normalizeEmail(account.email);
    // Finds existing record.
    const existingRecord = records.find((record) => normalizeEmail(record.email) === email);
    // Gets account company.
    const companyId = normalizeCompanyId(
      existingRecord?.companyId
      || getStoredCompanyForEmail(account.email)
      || account.fallbackCompanyId
    );
    // Finds matching company record.
    const existingIndex = records.findIndex((record) => (
      normalizeEmail(record.email) === email && normalizeCompanyId(record.companyId) === companyId
    ));
    const existing = existingIndex >= 0 ? records[existingIndex] : existingRecord || {};
    const browser = existing.browser || LEGACY_BROWSERS[accountIndex % LEGACY_BROWSERS.length];
    const ipAddress = existing.ipAddress || getStableDemoIp({ ...account, companyId });
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    // Checks backfill already done.
    const alreadyBackfilled = history.some((item) => item.legacyHistoryVersion === LEGACY_HISTORY_VERSION);

    if (!alreadyBackfilled) {
      // Creates sample sessions.
      for (let sessionIndex = 0; sessionIndex < 3; sessionIndex += 1) {
        const loginAt = new Date(now);
        loginAt.setDate(now.getDate() - (accountIndex + 1) * 2 - sessionIndex);
        loginAt.setHours(9 + sessionIndex, 10 + accountIndex, 0, 0);

        const logoutAt = new Date(loginAt);
        logoutAt.setHours(loginAt.getHours() + 8, loginAt.getMinutes() + 20, 0, 0);

        history.push({
          type: 'login',
          timestamp: loginAt.toISOString(),
          browser,
          ipAddress,
          legacyHistoryVersion: LEGACY_HISTORY_VERSION,
        });
        history.push({
          type: 'logout',
          timestamp: logoutAt.toISOString(),
          browser,
          ipAddress,
          legacyHistoryVersion: LEGACY_HISTORY_VERSION,
        });
      }
    }

    // Sorts latest history first.
    const sortedHistory = history.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    // Gets latest login.
    const lastLogin = sortedHistory.find((item) => item.type === 'login')?.timestamp || existing.lastLogin;
    // Gets latest logout.
    const lastLogout = sortedHistory.find((item) => item.type === 'logout')?.timestamp || existing.lastLogout;
    // Builds legacy record.
    const nextRecord = {
      id: existing.id || `${companyId}:${email}`,
      userId: existing.userId || email,
      name: existing.name || account.name,
      email: existing.email || account.email,
      companyId,
      companyName: companyId === 'company-b' ? 'Company B' : 'Company A',
      role: existing.role || 'user',
      source: 'account',
      browser,
      ipAddress,
      lastLogin,
      lastLogout,
      status: existing.status || 'Inactive',
      history: sortedHistory,
    };

    // Updates existing record.
    if (existingIndex >= 0) {
      records[existingIndex] = nextRecord;
      return;
    }

    // Replaces old matching record.
    if (existingRecord) {
      const oldIndex = records.indexOf(existingRecord);
      records[oldIndex] = nextRecord;
      return;
    }

    // Adds new legacy record.
    records.push(nextRecord);
  });

  // Saves all records.
  writeRecords(records);
  return records;
};
