const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('.site-nav');
const navLinks = document.querySelectorAll('.site-nav a');
const sectionLinks = Array.from(navLinks).filter((link) => link.getAttribute('href').startsWith('#'));
const homeLink = document.querySelector('.site-nav a[href="#home"]');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) =>
    link.addEventListener('click', () => {
      if (siteNav.classList.contains('is-open')) {
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    })
  );
}

if (homeLink) {
  homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    sectionLinks.forEach((link) => link.classList.remove('active'));
    homeLink.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const sections = document.querySelectorAll('section[id]');
if (sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id');
        const navLink = document.querySelector(`.site-nav a[href="#${id}"]`);
        if (!navLink) return;
        if (entry.isIntersecting) {
          sectionLinks.forEach((link) => link.classList.remove('active'));
          navLink.classList.add('active');
        }
      });
    },
    {
      rootMargin: '-40% 0px -50% 0px',
    }
  );
  sections.forEach((section) => observer.observe(section));
}

const currentPath = window.location.pathname;
navLinks.forEach((link) => {
  const route = link.dataset.route;
  if (route && currentPath.includes(route)) {
    link.classList.add('active');
  }
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tiltCardNodes = document.querySelectorAll('.tilt-card');

if (tiltCardNodes.length && !prefersReducedMotion) {
  tiltCardNodes.forEach((card) => registerTilt(card));
}

function registerTilt(card) {
  if (prefersReducedMotion || !card) return;
  card.addEventListener('mousemove', (event) => handleTilt(event, card));
  card.addEventListener('mouseleave', () => resetTilt(card));
}

function handleTilt(event, card) {
  const bounds = card.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const percentX = (event.clientX - centerX) / (bounds.width / 2);
  const percentY = (event.clientY - centerY) / (bounds.height / 2);
  const rotateX = Math.max(Math.min(-percentY * 6, 6), -6);
  const rotateY = Math.max(Math.min(percentX * 6, 6), -6);
  card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function resetTilt(card) {
  card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
}

const writeupApp = document.getElementById('writeups-app');
const writeupAside = document.getElementById('writeups-event-list');
const challengeForm = document.getElementById('challenge-form');
const challengeInput = document.getElementById('challenge-input');
const challengeStatus = document.getElementById('challenge-status');
const challengeOutput = document.getElementById('challenge-output');

if (writeupApp && writeupAside) {
  fetch('writeups/writeups.json')
    .then((res) => res.json())
    .then((data) => buildWriteups(data))
    .catch(() => {
      writeupApp.innerHTML = '<div class="writeups-empty"><p>Unable to load writeups right now.</p></div>';
    });
}


const challengeAnswers = [
  'inv1s1bl3{trace_the_signal}',
  'vai1f1oy3{genpr_gur_fvtany}',
];
const terminalScreen = document.getElementById('lab-terminal');
const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('terminal-input');
const clockTime = document.getElementById('clock-time');
const clockDate = document.getElementById('clock-date');
const clockButtons = document.querySelectorAll('#clock-modes button');
const clockWidget = document.getElementById('clock-widget');
const clockControlButtons = document.querySelectorAll('.clock-controls button');
let confettiLoaded = false;

const labFS = {
  notes:
    'Intercepted trace: python3 decode.py signal.enc -> signal.dec (base64). cat signal.dec | base64 -d -> flag. Submit inv1s1bl3{...}.',
  files: {
    'notes.txt':
      'Intercepted trace: python3 decode.py signal.enc -> signal.dec (base64). cat signal.dec | base64 -d -> flag. Submit inv1s1bl3{...}.',
    'decode.py': `#!/usr/bin/env python3\nfrom base64 import b64decode\nfrom pathlib import Path\n\nenc = Path('signal.enc').read_text().strip()\ndecoded = b64decode(enc).decode()\nPath('signal.dec').write_text(decoded)\nprint('[+] wrote signal.dec')\n`,
    'signal.enc': 'YVc1Mk1YTXhZbXd6ZTNSeVlXTmxYM1JvWlY5emFXZHVZV3g5',
  },
};

if (challengeForm && challengeInput && challengeStatus && challengeOutput) {
  challengeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    evaluateChallenge(challengeInput.value.trim());
  });
}

if (terminalForm && terminalScreen && terminalInput) {
  terminalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runLabCommand(terminalInput.value.trim());
    terminalInput.value = '';
  });
}

let clockZone = 'local';
if (clockTime && clockDate) {
  updateClock();
  setInterval(updateClock, 1000);
  if (clockButtons.length) {
    clockButtons.forEach((btn) =>
      btn.addEventListener('click', () => {
        clockZone = btn.dataset.zone || 'local';
        clockButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updateClock();
      })
    );
  }
  if (clockWidget && clockControlButtons.length) {
    clockControlButtons.forEach((btn) =>
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'min') {
          clockWidget.classList.add('minimized');
        } else if (action === 'max') {
          clockWidget.classList.remove('minimized');
        }
      })
    );
  }
}


function evaluateChallenge(input) {
  if (!challengeStatus || !challengeOutput || !challengeInput) return;
  if (!input) {
    updateChallengeUI('Send something down the wire.', 'error');
    return;
  }
  const normalized = input.toLowerCase();
  if (challengeAnswers.includes(normalized)) {
    updateChallengeUI('Access granted. Signal traced — welcome aboard! Keep shipping fearless.', 'success');
    challengeInput.disabled = true;
    launchCelebration();
  } else {
    updateChallengeUI('Nope. Re-run python3 decode.py + base64 decode and try again.', 'error');
  }
}

function updateChallengeUI(message, state) {
  if (!challengeStatus || !challengeOutput) return;
  const statusText = state === 'success' ? 'Status: signal locked.' : 'Status: still searching...';
  challengeStatus.textContent = statusText;
  challengeOutput.innerHTML = `<p>${message}</p>`;
  challengeOutput.classList.toggle('success', state === 'success');
  challengeOutput.classList.toggle('error', state === 'error');
}

function loadConfettiScript() {
  return new Promise((resolve, reject) => {
    if (window.confetti) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.body.appendChild(script);
  });
}

function launchCelebration() {
  loadConfettiScript()
    .then(() => {
      if (typeof confetti === 'function') {
        const duration = 3500;
        const end = Date.now() + duration;
        const defaults = { startVelocity: 35, spread: 80, ticks: 60, zIndex: 2000 };
        (function frame() {
          confetti(
            Object.assign({}, defaults, {
              particleCount: 40,
              origin: { x: 0.1, y: 1 },
              angle: 60,
              gravity: 0.65,
            })
          );
          confetti(
            Object.assign({}, defaults, {
              particleCount: 40,
              origin: { x: 0.9, y: 1 },
              angle: 120,
              gravity: 0.65,
            })
          );
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }
    })
    .catch(() => {});
}

function runLabCommand(rawCommand = '') {
  if (!terminalScreen) return;
  if (!rawCommand) return;
  const input = rawCommand.trim();
  printTerminalLine(`ctf@inv1s1bl3:~$ ${input}`);
  const pipeMatch = input.match(/^cat\s+(\S+)\s*\|\s*base64\s+-d$/i);
  if (pipeMatch) {
    handleCatBase64(pipeMatch[1]);
    return;
  }
  const [cmd, ...args] = input.split(' ');
  const lower = cmd.toLowerCase();
  switch (lower) {
    case 'help':
      printTerminalLine('Commands: help, ls, cat <file>, python3 decode.py signal.enc, cat signal.dec | base64 -d, version, python3, clear.');
      break;
    case 'ls':
      printTerminalLine(Object.keys(labFS.files).sort().join('  '));
      break;
    case 'cat':
      handleCatCommand(args.join(' '));
      break;
    case 'version':
      printTerminalLine('inv1s1bl3 shell v0.1 · Ubuntu 22.04 LTS (mock)');
      break;
    case 'python3':
      handlePythonCommand(args);
      break;
    case 'clear':
      terminalScreen.innerHTML = '';
      break;
    default:
      printTerminalLine(`Unknown command: ${cmd}. Type help.`);
      break;
  }
}

function handleCatCommand(fileName = '') {
  if (!fileName) {
    printTerminalLine('usage: cat <filename>');
    return;
  }
  if (labFS.files[fileName]) {
    printTerminalLine(labFS.files[fileName]);
  } else {
    printTerminalLine(`cat: can't open ${fileName}`);
  }
}

function handleCatBase64(fileName = '') {
  if (!fileName) {
    printTerminalLine('usage: cat <file> | base64 -d');
    return;
  }
  if (!labFS.files[fileName]) {
    printTerminalLine(`cat: can't open ${fileName}`);
    return;
  }
  try {
    const decoded = typeof atob === 'function' ? atob(labFS.files[fileName]) : Buffer.from(labFS.files[fileName], 'base64').toString('utf-8');
    printTerminalLine(decoded);
  } catch (err) {
    printTerminalLine('base64: decoding failed');
  }
}

function handlePythonCommand(args = []) {
  const joined = args.join(' ');
  if (!joined) {
    printTerminalLine('Python 3.11.2 (mock build) — type Ctrl+D to exit');
    return;
  }
  if (joined === 'decode.py signal.enc') {
    if (labFS.files['signal.dec']) {
      printTerminalLine('[+] signal.dec already exists');
      return;
    }
    printTerminalLine('from base64 import b64decode');
    printTerminalLine('from pathlib import Path');
    printTerminalLine("enc = Path('signal.enc').read_text().strip()");
    printTerminalLine('decoded = b64decode(enc).decode()');
    printTerminalLine("Path('signal.dec').write_text(decoded)");
    printTerminalLine('[+] wrote signal.dec');
    const decoded = typeof atob === 'function' ? atob(labFS.files['signal.enc']) : Buffer.from(labFS.files['signal.enc'], 'base64').toString('utf-8');
    labFS.files['signal.dec'] = decoded;
  } else {
    printTerminalLine(`python3: can't open file '${joined.split(' ')[0]}'`);
  }
}

function printTerminalLine(text) {
  if (!terminalScreen) return;
  const line = document.createElement('p');
  line.textContent = text;
  terminalScreen.appendChild(line);
  while (terminalScreen.children.length > 12) {
    terminalScreen.removeChild(terminalScreen.firstChild);
  }
  terminalScreen.scrollTop = terminalScreen.scrollHeight;
}

function updateClock() {
  if (!clockTime || !clockDate) return;
  const now = new Date();
  const zoneMap = {
    local: undefined,
    utc: 'UTC',
    ist: 'Asia/Kolkata',
  };
  const tz = zoneMap[clockZone] || undefined;
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz,
  };
  const dateOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: tz,
  };
  clockTime.textContent = now.toLocaleTimeString('en-GB', timeOptions);
  clockDate.textContent = `${now.toLocaleDateString('en-GB', dateOptions)} · ${clockZone.toUpperCase()}`;
}

function buildWriteups(data) {
  if (!data?.events?.length) return;
  const cache = new Map();
  const buttons = [];

  data.events.forEach((event, index) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'event-pill';
    const totalChallenges = event.categories.reduce((acc, category) => acc + category.challenges.length, 0);
    pill.innerHTML = `<span>${event.name}</span><strong>${totalChallenges} writeups</strong>`;
    pill.addEventListener('click', () => {
      buttons.forEach((btn) => btn.classList.remove('active'));
      pill.classList.add('active');
      renderEvent(event, cache);
    });
    writeupAside?.appendChild(pill);
    buttons.push(pill);
    if (index === 0) {
      pill.classList.add('active');
      renderEvent(event, cache);
    }
  });
}

function renderEvent(event, cache) {
  if (!writeupApp) return;
  writeupApp.innerHTML = '';
  event.categories.forEach((category) => {
    const block = document.createElement('section');
    block.className = 'category-block tilt-card';
    registerTilt(block);
    const heading = document.createElement('h3');
    heading.textContent = category.name;
    block.appendChild(heading);
    category.challenges.forEach((challenge) => {
      block.appendChild(createChallengeCard(challenge, cache, event));
    });
    writeupApp.appendChild(block);
  });
}

function createChallengeCard(challenge, cache, eventMeta) {
  const card = document.createElement('article');
  card.className = 'challenge-card';
  const meta = document.createElement('div');
  meta.className = 'challenge-meta';
  const title = document.createElement('h4');
  title.textContent = challenge.title;
  meta.appendChild(title);
  const actions = document.createElement('div');
  actions.className = 'challenge-actions';
  const viewBtn = document.createElement('button');
  viewBtn.type = 'button';
  viewBtn.textContent = 'Open writeup';
  viewBtn.addEventListener('click', () => openWriteupModal(challenge, eventMeta, cache, card));
  actions.appendChild(viewBtn);
  meta.appendChild(actions);
  card.appendChild(meta);
  return card;
}

const writeupModal = document.getElementById('writeup-modal');
const modalBody = document.getElementById('writeup-modal-body');
const modalTitle = document.getElementById('writeup-modal-title');
const modalEvent = document.getElementById('writeup-modal-event');
const modalRaw = document.getElementById('writeup-modal-raw');
const modalCloseEls = document.querySelectorAll('[data-close-modal]');

modalCloseEls.forEach((el) =>
  el.addEventListener('click', () => {
    closeWriteupModal();
  })
);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeWriteupModal();
  }
});

function openWriteupModal(challenge, eventMeta, cache, card) {
  if (!writeupModal || !modalBody || !modalTitle || !modalEvent || !modalRaw) return;
  card?.classList.add('loading');
  modalTitle.textContent = challenge.title;
  modalEvent.textContent = eventMeta?.name || 'Writeup';
  modalRaw.href = challenge.rawUrl;
  modalBody.innerHTML = '<p>Loading writeup...</p>';
  writeupModal.classList.add('is-visible');
  document.body.classList.add('modal-open');
  const cached = cache.get(challenge.rawUrl);
  if (cached) {
    modalBody.innerHTML = cached;
    rewriteAssetPaths(modalBody, challenge.assetBase || eventMeta?.rawBase);
    card?.classList.remove('loading');
    return;
  }
  fetch(challenge.rawUrl)
    .then((res) => res.text())
    .then((markdown) => {
      if (typeof marked !== 'undefined') {
        const html = marked.parse(markdown);
        cache.set(challenge.rawUrl, html);
        modalBody.innerHTML = html;
        rewriteAssetPaths(modalBody, challenge.assetBase || eventMeta?.rawBase);
      } else {
        modalBody.textContent = markdown;
      }
    })
    .catch(() => {
      modalBody.innerHTML = '<p>Unable to load writeup.</p>';
    })
    .finally(() => {
      card?.classList.remove('loading');
    });
}

function closeWriteupModal() {
  if (!writeupModal) return;
  writeupModal.classList.remove('is-visible');
  document.body.classList.remove('modal-open');
}

function rewriteAssetPaths(container, assetBase) {
  if (!container || !assetBase) return;
  const normalizedBase = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
  container.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('http') || src.startsWith('data:')) return;
    try {
      const resolved = new URL(src, normalizedBase);
      img.src = resolved.href;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '12px';
      img.style.margin = '1rem 0';
    } catch (err) {
      const fallback = src.replace(/^\.\/*/, '').replace(/ /g, '%20');
      img.src = normalizedBase + fallback;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '12px';
      img.style.margin = '1rem 0';
    }
  });
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'COPY';
    btn.addEventListener('click', () => {
      const code = pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'COPIED!';
        setTimeout(() => (btn.textContent = 'COPY'), 1500);
      });
    });
    pre.appendChild(btn);
  });
}
