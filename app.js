// ============================================================
// TOEIC Vocabulary Manager - app.js
// ============================================================

// ── Stop Words (common English words to filter out) ──────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','if','in','on','at','to','for','of','with','by',
  'from','up','about','into','through','during','before','after','above','below',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','shall','should','may','might','must','can','could','ought','need',
  'i','you','he','she','it','we','they','me','him','her','us','them','my','your',
  'his','its','our','their','this','that','these','those','what','which','who',
  'whom','how','when','where','why','all','each','every','both','few','more',
  'most','other','some','such','no','nor','not','only','same','so','than','too',
  'very','just','also','as','out','not','so','its','then','than','like','over',
  'after','here','there','now','new','old','one','two','three','s','t','re','ll',
  've','d','m','am','any','had','has','let','once','own','same','under','until',
  'again','further','while','own','between','into','through','during','them','he',
  'she','herself','himself','themselves','itself','yourself','yourselves','our',
  'ours','yours','whose','whom','whom','well','still','already','even','however',
  'although','because','since','though','unless','whether','either','neither',
  'having','used','using','use','make','made','making','take','taken','taking',
  'get','got','getting','go','went','going','come','came','coming','put','puts',
  'putting','know','knew','knowing','think','thought','thinking','see','saw',
  'seeing','want','wanted','wanting','look','looked','looking','give','gave',
  'find','found','finding','tell','told','telling','seem','seemed','ask','asked',
  'work','worked','working','feel','felt','feeling','try','tried','trying','call',
  'called','keep','kept','let','begin','began','show','showed','hear','heard',
  'play','run','ran','move','moved','live','lived','hold','held','say','says',
  'said','turn','turned','follow','followed','begin','began','need','needed',
  'much','many','more','most','few','less','least','long','good','great',
  'different','large','small','early','high','right','next','last','young',
  'important','public','private','real','best','free','number','way','right',
  'down','first','also','again','then','back','here','there','however','yet',
  'ever','never','always','often','sometimes','usually','really','very','quite',
  'rather','just','still','already','soon','now','today','yesterday','tomorrow',
  'mr','ms','mrs','dr','dear','sincerely','regards','thank','thanks','please',
  'note','re','cc','subject','date','from','sent',
]);

// ── Part-of-speech hints (lightweight) ───────────────────────
const POS_HINTS = {
  noun: ['tion','sion','ment','ness','ity','ty','ance','ence','er','or','ist','ism','ship','hood','age','ure','al'],
  verb: ['ify','ize','ise','ate','en','ing','ed'],
  adj: ['ful','less','ous','ious','eous','able','ible','ive','ive','al','ic','ical','ary','ory','ent','ant'],
  adv: ['ly'],
};

function guessPos(word) {
  const w = word.toLowerCase();
  if (POS_HINTS.adv.some(s => w.endsWith(s) && w.length > s.length + 2)) return 'adv';
  if (POS_HINTS.adj.some(s => w.endsWith(s) && w.length > s.length + 2)) return 'adj';
  if (POS_HINTS.verb.some(s => w.endsWith(s) && w.length > s.length + 2)) return 'verb';
  if (POS_HINTS.noun.some(s => w.endsWith(s) && w.length > s.length + 2)) return 'noun';
  return 'other';
}

// ── LocalStorage Keys ─────────────────────────────────────────
const LS_VOCAB = 'toiec_vocab_v2';
const LS_SESSION = 'toiec_session_v2';

// ── State ─────────────────────────────────────────────────────
let vocab = [];          // { id, word, meaning, pos, mastered, addedAt, example }
let session = {
  usedIds: [],           // IDs already shown in current random session
  round: 1,
};
let filteredVocab = [];  // for list tab
let currentEditId = null;
let currentTab = 'dashboard';

// ── Seed vocabulary from Castelli & Polito's texts ───────────
const SEED_VOCAB = [
  // === CASTELLI PASSAGE ===
  { word: 'quality', meaning: 'chất lượng', pos: 'noun', example: 'Our quality assurance team has revealed defects.' },
  { word: 'assurance', meaning: 'sự đảm bảo', pos: 'noun', example: 'quality assurance team.' },
  { word: 'reveal', meaning: 'tiết lộ, phát hiện', pos: 'verb', example: 'The team revealed the defect.' },
  { word: 'defect', meaning: 'khuyết điểm, lỗi sản phẩm', pos: 'noun', example: 'The product has a defect in the lid.' },
  { word: 'standard', meaning: 'tiêu chuẩn', pos: 'noun', example: 'high standards of product quality.' },
  { word: 'improper', meaning: 'không đúng, không hợp lệ', pos: 'adj', example: 'improper seal on the lid.' },
  { word: 'seal', meaning: 'nắp đậy, con dấu; bịt kín', pos: 'noun', example: 'an improper seal on the lid of the jar.' },
  { word: 'spoil', meaning: 'hư hỏng, ôi thiu', pos: 'verb', example: 'contents spoiling due to contact with air.' },
  { word: 'contents', meaning: 'nội dung, thành phần bên trong', pos: 'noun', example: 'The contents of the jar spoiled.' },
  { word: 'contact', meaning: 'tiếp xúc', pos: 'noun', example: 'due to contact with air.' },
  { word: 'warning', meaning: 'cảnh báo', pos: 'noun', example: 'We are currently warning customers.' },
  { word: 'replacement', meaning: 'sự thay thế', pos: 'noun', example: 'a product replacement voucher.' },
  { word: 'voucher', meaning: 'phiếu giảm giá, phiếu đổi hàng', pos: 'noun', example: 'Customers will receive a $12 voucher.' },
  { word: 'serial', meaning: 'số thứ tự', pos: 'adj', example: 'include the product\'s serial number.' },
  { word: 'refund', meaning: 'hoàn tiền', pos: 'noun', example: 'Please do not try to get a refund.' },
  { word: 'retailer', meaning: 'nhà bán lẻ', pos: 'noun', example: 'Do not get a refund at a retailer.' },
  { word: 'affected', meaning: 'bị ảnh hưởng', pos: 'adj', example: 'No other Castelli food products are affected.' },
  { word: 'encourage', meaning: 'khuyến khích', pos: 'verb', example: 'We encourage you to continue purchasing.' },
  { word: 'precautionary', meaning: 'đề phòng, phòng ngừa', pos: 'adj', example: 'I appreciate the precautionary step.' },
  { word: 'purchase', meaning: 'mua', pos: 'verb', example: 'I purchased two jars from a grocery store.' },
  { word: 'attached', meaning: 'đính kèm', pos: 'adj', example: 'I have attached the image file of both receipts.' },
  { word: 'receipt', meaning: 'biên lai, hóa đơn', pos: 'noun', example: 'I attached the image of both receipts.' },
  { word: 'committed', meaning: 'cam kết', pos: 'adj', example: 'We are committed to ensuring our customers.' },
  { word: 'rely', meaning: 'tin tưởng, dựa vào', pos: 'verb', example: 'customers can continue to rely on Castelli.' },
  { word: 'enclosed', meaning: 'đính kèm, bao gồm', pos: 'adj', example: 'Please find the vouchers enclosed.' },
  { word: 'additional', meaning: 'thêm, bổ sung', pos: 'adj', example: 'We would like to offer additional vouchers.' },
  { word: 'linguini', meaning: 'mì linguini (mì ý dẹt)', pos: 'noun', example: 'a new line of linguini and spaghetti pasta.' },
  { word: 'spaghetti', meaning: 'mì spaghetti', pos: 'noun', example: 'Classic Spaghetti Sauce.' },
  { word: 'pasta', meaning: 'mì ống (chung)', pos: 'noun', example: 'a new line of pasta called Pasta Prima.' },
  { word: 'delicious', meaning: 'ngon', pos: 'adj', example: 'We hope you turn to us for delicious Italian flavors.' },
  { word: 'flavor', meaning: 'hương vị', pos: 'noun', example: 'delicious Italian flavors.' },
  { word: 'specialist', meaning: 'chuyên gia', pos: 'noun', example: 'Customer Care Specialist.' },
  // === POLITO'S PIZZA PASSAGE ===
  { word: 'inspection', meaning: 'cuộc thanh tra, kiểm tra', pos: 'noun', example: 'Auburn City Restaurant Inspection.' },
  { word: 'comply', meaning: 'tuân thủ', pos: 'verb', example: 'Comply completely with safety requirements.' },
  { word: 'violation', meaning: 'vi phạm', pos: 'noun', example: 'no violations were found.' },
  { word: 'conform', meaning: 'phù hợp, tuân theo', pos: 'verb', example: 'Conform to most safety requirements.' },
  { word: 'minor', meaning: 'nhỏ, ít quan trọng', pos: 'adj', example: 'a few minor violations.' },
  { word: 'satisfy', meaning: 'thỏa mãn, đáp ứng', pos: 'verb', example: 'Not satisfy many safety requirements.' },
  { word: 'serious', meaning: 'nghiêm trọng', pos: 'adj', example: 'serious violations that could result in harm.' },
  { word: 'harm', meaning: 'gây hại', pos: 'noun', example: 'could result in harm or illness.' },
  { word: 'illness', meaning: 'bệnh tật', pos: 'noun', example: 'result in harm or illness for a customer.' },
  { word: 'fine', meaning: 'tiền phạt', pos: 'noun', example: 'Fines will be imposed for any C or D level violations.' },
  { word: 'impose', meaning: 'áp đặt, buộc phải', pos: 'verb', example: 'Fines will be imposed for violations.' },
  { word: 'personnel', meaning: 'nhân viên, nhân sự', pos: 'noun', example: 'Personnel regularly wash hands.' },
  { word: 'hygienic', meaning: 'vệ sinh, hợp vệ sinh', pos: 'adj', example: 'follow hygienic practices.' },
  { word: 'practice', meaning: 'thực hành; thói quen', pos: 'noun', example: 'follow hygienic practices.' },
  { word: 'refrigerate', meaning: 'làm lạnh, bảo quản lạnh', pos: 'verb', example: 'Raw meats are refrigerated at proper temperatures.' },
  { word: 'temperature', meaning: 'nhiệt độ', pos: 'noun', example: 'refrigerated at proper temperatures.' },
  { word: 'ingredient', meaning: 'nguyên liệu, thành phần', pos: 'noun', example: 'All ingredients are properly stored and labeled.' },
  { word: 'store', meaning: 'cất trữ; cửa hàng', pos: 'verb', example: 'properly stored and labeled.' },
  { word: 'labeled', meaning: 'được dán nhãn', pos: 'adj', example: 'All ingredients are properly stored and labeled.' },
  { word: 'utensil', meaning: 'dụng cụ bếp', pos: 'noun', example: 'Dishes and utensils are cleaned and sterilized.' },
  { word: 'sterilize', meaning: 'tiệt trùng, khử khuẩn', pos: 'verb', example: 'Dishes and utensils are cleaned and sterilized.' },
  { word: 'extinguisher', meaning: 'bình chữa cháy', pos: 'noun', example: 'Fire extinguishers are easily accessible.' },
  { word: 'accessible', meaning: 'có thể tiếp cận, dễ lấy', pos: 'adj', example: 'Fire extinguishers are easily accessible.' },
  { word: 'penalty', meaning: 'hình phạt', pos: 'noun', example: 'To avoid additional penalties.' },
  { word: 'address', meaning: 'giải quyết; địa chỉ', pos: 'verb', example: 'a few problems that we need to address.' },
  { word: 'indicate', meaning: 'chỉ ra, cho thấy', pos: 'verb', example: 'The results indicate that there are problems.' },
  { word: 'install', meaning: 'lắp đặt', pos: 'verb', example: 'fire exit signs need to be installed again.' },
  { word: 'storage', meaning: 'việc cất trữ', pos: 'noun', example: 'improper storage and labeling of food.' },
  { word: 'labeling', meaning: 'việc dán nhãn', pos: 'noun', example: 'improper storage and labeling of food.' },
  { word: 'container', meaning: 'hộp đựng, thùng chứa', pos: 'noun', example: 'All containers must be labeled with date and contents.' },
  { word: 'accidentally', meaning: 'vô tình, ngẫu nhiên', pos: 'adv', example: 'spoiled food could accidentally be served.' },
  { word: 'hygiene', meaning: 'vệ sinh', pos: 'noun', example: 'low grades for employee hygiene.' },
  { word: 'facility', meaning: 'cơ sở vật chất', pos: 'noun', example: 'cleanliness of our facilities.' },
  { word: 'uniform', meaning: 'đồng phục', pos: 'noun', example: 'All employees are required to wear their uniform.' },
  { word: 'hairnet', meaning: 'lưới trùm tóc', pos: 'noun', example: 'wear their uniform and hairnet at all times.' },
  { word: 'mop', meaning: 'lau nhà bằng cây lau', pos: 'verb', example: 'We need to mop floors more often.' },
  { word: 'regulation', meaning: 'quy định', pos: 'noun', example: 'ensure that we are not breaking any regulations.' },
  { word: 'checklist', meaning: 'danh sách kiểm tra', pos: 'noun', example: 'I will be posting a checklist.' },
  { word: 'prepare', meaning: 'chuẩn bị', pos: 'verb', example: 'necessary preparations to ensure we meet standards.' },
  { word: 'preparation', meaning: 'sự chuẩn bị', pos: 'noun', example: 'necessary preparations.' },
  { word: 'measure', meaning: 'biện pháp; đo lường', pos: 'noun', example: 'This measure will go into effect on January 29.' },
  { word: 'signature', meaning: 'chữ ký', pos: 'noun', example: 'Failure to fill out the checklist with signature.' },
  { word: 'failure', meaning: 'sự thất bại; việc không làm', pos: 'noun', example: 'Failure to fill out the checklist.' },
  { word: 'compliance', meaning: 'sự tuân thủ', pos: 'noun', example: 'monitor compliance with food industry regulations.' },
  { word: 'regulation', meaning: 'quy định', pos: 'noun', example: 'food industry regulations.' },
  { word: 'structural', meaning: 'thuộc về cấu trúc', pos: 'adj', example: 'inspect the structural safety of the building.' },
  { word: 'effectiveness', meaning: 'hiệu quả', pos: 'noun', example: 'evaluate the effectiveness of new policies.' },
  { word: 'appropriately', meaning: 'một cách thích hợp', pos: 'adv', example: 'containers of food were not marked appropriately.' },
  { word: 'infer', meaning: 'suy ra', pos: 'verb', example: 'What can we infer about K.P.?' },
  { word: 'loyal', meaning: 'trung thành', pos: 'adj', example: 'To keep customers loyal.' },
  { word: 'gain', meaning: 'đạt được, thu được', pos: 'verb', example: 'To gain new customers.' },
  { word: 'files', meaning: 'tệp tin, hồ sơ', pos: 'noun', example: '' },
  { word: 'technicians', meaning: 'kỹ thuật viên', pos: 'noun', example: '' },
];

// ── Init ──────────────────────────────────────────────────────
function initApp() {
  loadData();
  seedVocab(); // Luôn chạy để merge từ mới vào kho hiện có
  loadSession();
  renderAll();
  setupEventListeners();
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_VOCAB);
    vocab = raw ? JSON.parse(raw) : [];
  } catch { vocab = []; }
}

function saveData() {
  localStorage.setItem(LS_VOCAB, JSON.stringify(vocab));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (raw) session = JSON.parse(raw);
  } catch { resetSession(); }
}

function saveSession() {
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

function resetSession() {
  session = { usedIds: [], round: 1 };
  saveSession();
}

function seedVocab() {
  let added = false;
  SEED_VOCAB.forEach((item, i) => {
    const key = item.word.toLowerCase();
    const existingIdx = vocab.findIndex(v => v.word.toLowerCase() === key);
    
    if (existingIdx !== -1) {
      if (vocab[existingIdx].meaning === '(chưa dịch)' || vocab[existingIdx].meaning === '') {
        vocab[existingIdx].meaning = item.meaning;
        vocab[existingIdx].pos = item.pos;
        if (item.example) vocab[existingIdx].example = item.example;
        added = true;
      }
      return;
    }

    vocab.push({
      id: 'seed_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      word: item.word,
      meaning: item.meaning,
      pos: item.pos,
      mastered: false,
      addedAt: Date.now(),
      example: item.example || '',
    });
    added = true;
  });
  if (added) saveData();
}

// ── Tab Navigation ────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  document.querySelectorAll('[data-tab="' + tab + '"]').forEach(el => el.classList.add('active'));

  if (tab === 'dashboard') renderDashboard();
  if (tab === 'vocab') renderVocabList();
  if (tab === 'random') renderRandomStudy();
}

// ── Render Dashboard ──────────────────────────────────────────
function renderDashboard() {
  const total = vocab.length;
  const mastered = vocab.filter(v => v.mastered).length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const remaining = total - session.usedIds.length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-mastered').textContent = mastered;
  document.getElementById('stat-pct').textContent = pct + '%';
  document.getElementById('stat-remaining').textContent = Math.max(0, remaining);
  document.getElementById('stat-round').textContent = session.round;

  // Nav stats
  document.getElementById('nav-total').textContent = total;
  document.getElementById('nav-mastered').textContent = mastered;

  // Recent 20 words
  const recent = [...vocab].sort((a, b) => b.addedAt - a.addedAt).slice(0, 20);
  const grid = document.getElementById('recent-words-grid');
  grid.innerHTML = recent.map(v =>
    `<span class="recent-chip" onclick="speakWord('${escHtml(v.word)}')" title="${escHtml(v.meaning)}">${escHtml(v.word)}</span>`
  ).join('');
}

// ── Render Vocabulary List ────────────────────────────────────
function renderVocabList(filter = null) {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const posFilter = document.getElementById('pos-filter')?.value || 'all';
  const statusFilter = document.getElementById('status-filter')?.value || 'all';

  filteredVocab = vocab.filter(v => {
    const matchSearch = !search || v.word.toLowerCase().includes(search) || v.meaning.toLowerCase().includes(search);
    const matchPos = posFilter === 'all' || v.pos === posFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'mastered' ? v.mastered : !v.mastered);
    return matchSearch && matchPos && matchStatus;
  });

  // Sort: newest first
  filteredVocab.sort((a, b) => b.addedAt - a.addedAt);

  const tbody = document.getElementById('vocab-tbody');
  const empty = document.getElementById('vocab-empty');

  if (filteredVocab.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = filteredVocab.map((v, idx) => `
    <tr>
      <td data-label="Từ vựng">
        <div class="word-cell">${escHtml(v.word)}</div>
        <div class="word-phonetic" id="phon-${v.id}">—</div>
      </td>
      <td data-label="Nghĩa" class="meaning-cell">${escHtml(v.meaning)}</td>
      <td data-label="Loại từ"><span class="pos-badge pos-${v.pos}">${posLabel(v.pos)}</span></td>
      <td data-label="Ví dụ" class="meaning-cell" style="font-size:0.8rem;font-style:italic;">${escHtml(v.example || '—')}</td>
      <td data-label="Thuộc?">
        <button class="mastered-toggle ${v.mastered ? 'mastered' : ''}" onclick="toggleMastered('${v.id}')">
          ${v.mastered ? '✓ Thuộc' : 'Chưa thuộc'}
        </button>
      </td>
      <td data-label="Thao tác">
        <div class="table-actions">
          <button class="btn-icon speak" title="Phát âm" onclick="speakWord('${escHtml(v.word)}')">🔊</button>
        </div>
      </td>
    </tr>
  `).join('');

  document.getElementById('vocab-count').textContent = filteredVocab.length;
}

// ── Render Random Study ───────────────────────────────────────
function renderRandomStudy() {
  const available = vocab.filter(v => !session.usedIds.includes(v.id));
  const total = vocab.length;
  const used = session.usedIds.length;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  document.getElementById('random-progress-fill').style.width = pct + '%';
  document.getElementById('random-progress-label').textContent = `${used} / ${total} từ đã ôn`;
  document.getElementById('random-round-badge').textContent = `Vòng ${session.round}`;
  document.getElementById('session-complete').classList.remove('visible');
  document.getElementById('random-grid').style.display = '';

  // Check if session complete
  if (available.length === 0 && total > 0) {
    document.getElementById('session-complete').classList.add('visible');
    document.getElementById('random-grid').style.display = 'none';
    document.getElementById('random-progress-fill').style.width = '100%';
    document.getElementById('random-progress-label').textContent = `${total} / ${total} từ đã ôn (Hoàn thành!)`;
    return;
  }

  if (vocab.length === 0) {
    document.getElementById('random-grid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📚</div>
        <p>Chưa có từ vựng nào. Hãy dùng tab <strong>Trích xuất</strong> để thêm từ!</p>
      </div>`;
    return;
  }

  // Pick 50 from available
  const shuffled = shuffle([...available]);
  const batch = shuffled.slice(0, 50);

  // Add to used
  session.usedIds.push(...batch.map(v => v.id));
  saveSession();

  const grid = document.getElementById('random-grid');
  grid.innerHTML = batch.map(v => `
    <div class="flashcard" id="fc-${v.id}" onclick="flipCard('${v.id}')">
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <div class="card-word">${escHtml(v.word)}</div>
          <div class="card-pos"><span class="pos-badge pos-${v.pos}">${posLabel(v.pos)}</span></div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <button class="card-btn" onclick="speakWord('${escHtml(v.word)}')">🔊</button>
          </div>
          <div class="card-hint">👆 Nhấn để xem nghĩa</div>
        </div>
        <div class="flashcard-back">
          <div class="card-meaning">${escHtml(v.meaning)}</div>
          <div class="card-example">${escHtml(v.example || '')}</div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <button class="card-btn ${v.mastered ? 'mastered' : ''}" onclick="toggleMastered('${v.id}')">
              ${v.mastered ? '✓ Thuộc' : 'Đánh dấu thuộc'}
            </button>
            <button class="card-btn" onclick="speakWord('${escHtml(v.word)}')">🔊</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Update remaining count
  const newAvail = vocab.filter(v => !session.usedIds.includes(v.id)).length;
  document.getElementById('random-avail').textContent = newAvail;

  // Update progress
  const newUsed = session.usedIds.length;
  const newPct = total > 0 ? Math.round((newUsed / total) * 100) : 0;
  document.getElementById('random-progress-fill').style.width = newPct + '%';
  document.getElementById('random-progress-label').textContent = `${newUsed} / ${total} từ đã ôn`;
}

function flipCard(id) {
  document.getElementById('fc-' + id)?.classList.toggle('flipped');
}

function doNextRandom() {
  const available = vocab.filter(v => !session.usedIds.includes(v.id));
  if (available.length === 0) {
    renderRandomStudy();
    return;
  }
  renderRandomStudy();
}

function doResetSession() {
  resetSession();
  session.round++;
  saveSession();
  renderRandomStudy();
  showToast('Đã reset! Bắt đầu vòng mới 🎉', 'success');
}

function toggleMastered(id) {
  const v = vocab.find(x => x.id === id);
  if (!v) return;
  v.mastered = !v.mastered;
  saveData();
  const btn = document.querySelector(`button[onclick="toggleMastered('${id}')"]`);
  if (btn) {
    btn.classList.toggle('mastered');
    btn.textContent = v.mastered ? (btn.classList.contains('card-btn') ? '✓ Thuộc' : '✓ Thuộc') : (btn.classList.contains('card-btn') ? 'Đánh dấu thuộc' : 'Chưa thuộc');
  }
  renderDashboard();
  updateNavStats();
}

// ── Speech ────────────────────────────────────────────────────
function speakWord(word) {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = 'en-US';
  utt.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
}

// ── Export / Import ───────────────────────────────────────────
function exportData() {
  const data = JSON.stringify({ vocab, exportedAt: new Date().toISOString(), version: 2 }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `toeic_vocab_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất file JSON thành công! 💾', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.vocab)) throw new Error('Invalid format');
      const existing = new Set(vocab.map(v => v.word.toLowerCase()));
      let added = 0;
      data.vocab.forEach(v => {
        if (!existing.has(v.word.toLowerCase())) {
          vocab.push({ ...v, id: 'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2) });
          existing.add(v.word.toLowerCase());
          added++;
        }
      });
      saveData();
      renderAll();
      showToast(`Đã nhập ${added} từ mới từ file! 📥`, 'success');
    } catch {
      showToast('File không hợp lệ!', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Bạn có chắc muốn XÓA TOÀN BỘ từ vựng? Hành động này không thể hoàn tác!')) return;
  vocab = [];
  resetSession();
  saveData();
  renderAll();
  showToast('Đã xóa toàn bộ dữ liệu.', 'info');
}

// ── Helpers ───────────────────────────────────────────────────
function renderAll() {
  renderDashboard();
  renderVocabList();
  renderRandomStudy();
  updateNavStats();
}

function updateNavStats() {
  const total = vocab.length;
  const mastered = vocab.filter(v => v.mastered).length;
  document.getElementById('nav-total').textContent = total;
  document.getElementById('nav-mastered').textContent = mastered;
}

function posLabel(pos) {
  const map = { noun: 'Danh từ', verb: 'Động từ', adj: 'Tính từ', adv: 'Trạng từ', other: 'Khác' };
  return map[pos] || pos;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(40px)'; el.style.transition = 'all 0.3s ease'; setTimeout(() => el.remove(), 300); }, duration);
}

// ── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {
  // Nav tabs (desktop)
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Bottom nav (mobile)
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Random
  document.getElementById('btn-next-random')?.addEventListener('click', doNextRandom);
  document.getElementById('btn-reset-session')?.addEventListener('click', doResetSession);
  document.getElementById('btn-reset-session-2')?.addEventListener('click', doResetSession);
}

  // Keyboard
  document.addEventListener('keydown', (e) => {
    //
  });
}

// ── Start ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);
