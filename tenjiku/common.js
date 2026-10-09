/**
 * 天竺 広東倶楽部 — 预约贯通フロア / 当日 / 日历 / 会计
 */
(function (global) {
  const STORE_ID = 'tenjiku-kanton';
  const STORE_NAME = '天竺 広東倶楽部';
  const PASS = 'tenjiku2026';
  const AUTH_KEY = STORE_ID + '_auth';
  const LANG_KEY = STORE_ID + '_lang';
  const KEY_TABLES = STORE_ID + '_tables';
  const KEY_BOOK = STORE_ID + '_bookings_v3';
  const KEY_SHIFT = STORE_ID + '_shift_v1';
  const VER_KEY = STORE_ID + '_data_ver';
  const DATA_VER = '5';
  const MAP = 'https://maps.app.goo.gl/UBGXEeJifYKAGybHA';
  const TAGS = ['宴会', '常連', '初来', '会社', '記念日', 'VIP', 'アレルギー'];
  const PAYS = ['現金', 'カード', '会社請求'];

  function tokyoYmd(offsetDays) {
    const d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const g = (t) => p.find((i) => i.type === t).value;
    return g('year') + '-' + g('month') + '-' + g('day');
  }

  function tokyoWeekday() {
    const w = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      weekday: 'short',
    }).format(new Date());
    return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[w] ?? 0;
  }

  function jpDate(ymd) {
    const [y, m, d] = String(ymd).split('-');
    return y + '年' + Number(m) + '月' + Number(d) + '日';
  }

  function mdDate(ymd) {
    const p = String(ymd || '').split('-');
    if (p.length < 3) return '';
    return Number(p[1]) + '月' + Number(p[2]) + '日';
  }

  function createdYmd(b) {
    const raw = b && b.createdAt ? String(b.createdAt) : '';
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    if (raw) {
      const dt = new Date(raw);
      if (!Number.isNaN(dt.getTime())) return tokyoYmdFromDate(dt);
    }
    return '';
  }

  function tokyoYmdFromDate(d) {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const g = (t) => p.find((i) => i.type === t).value;
    return g('year') + '-' + g('month') + '-' + g('day');
  }

  function createdLabel(b, lang) {
    const ymd = createdYmd(b);
    if (!ymd) return '';
    const md = lang === 'en'
      ? Number(ymd.slice(5, 7)) + '/' + Number(ymd.slice(8, 10))
      : mdDate(ymd);
    if (lang === 'en') return 'Logged ' + md;
    if (lang === 'zh') return '计入 ' + md;
    return '計上 ' + md;
  }

  function yen(n) {
    return '¥' + Number(n || 0).toLocaleString('ja-JP');
  }

  function uid() {
    return 'b' + Date.now() + Math.floor(Math.random() * 99);
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'ja';
  }
  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }
  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }
  function login(pwd) {
    if (String(pwd || '').trim() !== PASS) return false;
    sessionStorage.setItem(AUTH_KEY, '1');
    return true;
  }
  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }
  function requireAuth() {
    if (!isAuthed()) {
      location.replace('index.html');
      return false;
    }
    return true;
  }

  function defaultTables() {
    return [
      { id: 't1', name: '1', seats: 2 },
      { id: 't2', name: '2', seats: 2 },
      { id: 't3', name: '3', seats: 4 },
      { id: 't4', name: '4', seats: 4 },
      { id: 't5', name: '5', seats: 4 },
      { id: 't6', name: '6', seats: 6 },
      { id: 't7', name: '7', seats: 6 },
      { id: 't8', name: '8', seats: 8 },
    ];
  }

  function loadTables() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_TABLES) || 'null');
      if (Array.isArray(raw) && raw.length) {
        return raw.map((t) => ({ id: t.id, name: t.name, seats: t.seats }));
      }
    } catch (e) {}
    const seed = defaultTables();
    saveTables(seed);
    return seed;
  }
  function saveTables(list) {
    localStorage.setItem(KEY_TABLES, JSON.stringify(list));
  }

  const COURSES = ['点心コース', '宴会コース', '接待コース', '記念日コース', 'アラカルト'];

  function defaultShift() {
    return [
      { name: '李', role: '店長', hours: '17–24', days: [0, 1, 1, 0, 1, 1, 1] },
      { name: '佐藤', role: 'ホール', hours: '17–23', days: [1, 1, 1, 1, 0, 1, 1] },
      { name: '陳', role: 'ホール', hours: '17–24', days: [0, 1, 1, 1, 1, 1, 1] },
      { name: '王', role: 'キッチン', hours: '16–24', days: [1, 1, 1, 1, 1, 1, 0] },
    ];
  }
  function loadShift() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_SHIFT) || 'null');
      if (Array.isArray(raw) && raw.length) {
        return raw.map((s) => ({
          name: s.name,
          role: s.role,
          hours: s.hours || '17–24',
          days: Array.isArray(s.days) ? s.days : [0, 1, 1, 1, 1, 1, 1],
        }));
      }
    } catch (e) {}
    const seed = defaultShift();
    saveShift(seed);
    return seed;
  }
  function saveShift(list) {
    localStorage.setItem(KEY_SHIFT, JSON.stringify(list));
  }
  function todayStaff() {
    const wd = tokyoWeekday();
    return loadShift().filter((s) => s.days && s.days[wd]);
  }
  function tableById(id) {
    return loadTables().find((t) => t.id === id) || null;
  }
  function tableName(id) {
    const tb = tableById(id);
    return tb ? tb.name : String(id || '').replace(/^t/, '');
  }

  function seedBookings() {
    const today = tokyoYmd(0);
    const yest = tokyoYmd(-1);
    return [
      {
        id: 'b-today-1', date: today, start: '18:00', end: '20:00',
        people: 2, tableId: 't1', name: 'Chen', phone: '+81 90-1111-2222',
        course: '点心コース', amount: 12800, tags: ['常連'], allergy: '',
        note: '', status: 'seated', payMethod: '', createdAt: tokyoYmd(-18),
      },
      {
        id: 'b-today-2', date: today, start: '19:00', end: '21:30',
        people: 4, tableId: 't3', name: '田中', phone: '',
        course: '宴会コース', amount: 24600, tags: ['宴会', '記念日'], allergy: '',
        note: '誕生日ケーキ', status: 'seated', payMethod: '', createdAt: tokyoYmd(-40),
      },
      {
        id: 'b-today-3', date: today, start: '19:30', end: '21:00',
        people: 3, tableId: 't5', name: '山田商事', phone: '',
        course: '接待コース', amount: 19600, tags: ['会社'], allergy: 'えび',
        note: '', status: 'reserved', payMethod: '', createdAt: tokyoYmd(-12),
      },
      {
        id: 'b-yest-1', date: yest, start: '18:00', end: '20:00',
        people: 2, tableId: 't2', name: 'Imogen', phone: '+81 80-3333-4444',
        course: '点心コース', amount: 9800, tags: ['初来'], allergy: '',
        note: '', status: 'paid', payMethod: 'カード', createdAt: tokyoYmd(-22),
      },
      {
        id: 'b-yest-2', date: yest, start: '18:30', end: '21:00',
        people: 5, tableId: 't8', name: '京都観光団体', phone: '',
        course: '宴会コース', amount: 32800, tags: ['宴会'], allergy: '',
        note: '', status: 'paid', payMethod: '会社請求', createdAt: tokyoYmd(-9),
      },
      {
        id: 'b-yest-3', date: yest, start: '19:00', end: '21:00',
        people: 2, tableId: 't4', name: '佐藤', phone: '',
        course: '記念日コース', amount: 15800, tags: ['記念日'], allergy: '',
        note: '', status: 'paid', payMethod: '現金', createdAt: tokyoYmd(-31),
      },
      {
        id: 'b-ago-1', date: tokyoYmd(-3), start: '18:00', end: '20:30',
        people: 4, tableId: 't6', name: '林', phone: '',
        course: '宴会コース', amount: 28600, tags: ['宴会'], allergy: '',
        note: '', status: 'paid', payMethod: 'カード', createdAt: tokyoYmd(-28),
      },
      {
        id: 'b-ago-2', date: tokyoYmd(-5), start: '19:00', end: '21:00',
        people: 2, tableId: 't1', name: '高橋', phone: '',
        course: '点心コース', amount: 11200, tags: ['常連'], allergy: '',
        note: '', status: 'paid', payMethod: '現金', createdAt: tokyoYmd(-16),
      },
    ];
  }

  function loadBookings() {
    if (localStorage.getItem(VER_KEY) !== DATA_VER) {
      localStorage.setItem(VER_KEY, DATA_VER);
      const seed = seedBookings();
      saveBookings(seed);
      return seed;
    }
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_BOOK) || 'null');
      if (Array.isArray(raw)) return raw;
    } catch (e) {}
    const seed = seedBookings();
    saveBookings(seed);
    return seed;
  }
  function saveBookings(list) {
    localStorage.setItem(KEY_BOOK, JSON.stringify(list));
  }
  function upsertBooking(patch) {
    const list = loadBookings();
    const id = patch.id || uid();
    const i = list.findIndex((b) => b.id === id);
    const next = Object.assign(
      {
        id, date: tokyoYmd(0), start: '18:00', end: '20:00', people: 2,
        tableId: '', name: '', phone: '', course: '', amount: 0, tags: [],
        allergy: '', note: '', status: 'reserved', payMethod: '',
      },
      i >= 0 ? list[i] : {},
      patch,
      { id }
    );
    if (!next.createdAt) next.createdAt = tokyoYmd(0);
    if (i >= 0) list[i] = next;
    else list.push(next);
    saveBookings(list);
    return next;
  }
  function bookingsOn(ymd) {
    return loadBookings()
      .filter((b) => b.date === ymd && b.status !== 'cancelled')
      .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  }
  function liveOnTable(tableId, ymd) {
    ymd = ymd || tokyoYmd(0);
    const rows = bookingsOn(ymd).filter(
      (b) => b.tableId === tableId && (b.status === 'seated' || b.status === 'reserved')
    );
    return rows.find((b) => b.status === 'seated') || rows[0] || null;
  }
  function tableStatus(tableId, ymd) {
    const b = liveOnTable(tableId, ymd);
    if (!b) return 'free';
    return b.status === 'seated' ? 'busy' : 'reserved';
  }
  function kpiFromRows(rows) {
    const open = rows.filter((b) => b.status === 'seated' || b.status === 'paid');
    const turns = open.length;
    const people = open.reduce((s, b) => s + (Number(b.people) || 0), 0);
    const bookedPeople = rows.reduce((s, b) => s + (Number(b.people) || 0), 0);
    const sales = open.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const tables = loadTables().length;
    const turnover = tables ? Math.round((turns / tables) * 10) / 10 : 0;
    const avg = people ? Math.round(sales / people) : 0;
    return {
      parties: rows.length,
      turns,
      people,
      bookedPeople,
      sales,
      tables,
      turnover,
      avg,
    };
  }
  function dayKpi(ymd) {
    return kpiFromRows(bookingsOn(ymd || tokyoYmd(0)));
  }
  function monthKpi(ym) {
    ym = ym || String(tokyoYmd(0)).slice(0, 7);
    const rows = loadBookings().filter(
      (b) => String(b.date).slice(0, 7) === ym && b.status !== 'cancelled'
    );
    return kpiFromRows(rows);
  }
  function payBooking(id, payMethod) {
    return upsertBooking({ id, status: 'paid', payMethod: payMethod || '現金' });
  }
  function cancelBooking(id) {
    return upsertBooking({ id, status: 'cancelled' });
  }
  function walkIn(tableId, patch) {
    return upsertBooking(Object.assign({
      tableId,
      date: tokyoYmd(0),
      start: '18:00',
      end: '20:00',
      status: 'seated',
    }, patch || {}));
  }

  const TREND = {
    labels: ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'],
    parties: [28, 31, 36, 40, 38, 42],
    sales: [980000, 1100000, 1250000, 1400000, 1320000, 1480000],
  };

  function bindLangButtons() {
    const lang = getLang();
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === lang);
      b.addEventListener('click', () => {
        setLang(b.dataset.lang);
        location.reload();
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  global.Tenjiku = {
    STORE_ID,
    STORE_NAME,
    PASS,
    MAP,
    TAGS,
    PAYS,
    COURSES,
    TREND,
    tokyoYmd,
    tokyoWeekday,
    jpDate,
    mdDate,
    createdYmd,
    createdLabel,
    yen,
    uid,
    getLang,
    setLang,
    isAuthed,
    login,
    logout,
    requireAuth,
    loadTables,
    saveTables,
    loadShift,
    saveShift,
    todayStaff,
    tableById,
    tableName,
    loadBookings,
    saveBookings,
    upsertBooking,
    bookingsOn,
    liveOnTable,
    tableStatus,
    dayKpi,
    monthKpi,
    payBooking,
    cancelBooking,
    walkIn,
    bindLangButtons,
    escapeHtml,
  };
})(window);
