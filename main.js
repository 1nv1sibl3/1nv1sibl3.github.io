const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('.site-nav');
const navLinks = document.querySelectorAll('.site-nav a');
const sectionLinks = Array.from(navLinks).filter((link) => link.getAttribute('href').startsWith('#'));

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
  const rotateX = Math.max(Math.min(-percentY * 10, 10), -10);
  const rotateY = Math.max(Math.min(percentX * 10, 10), -10);
  card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function resetTilt(card) {
  card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
}

const writeupApp = document.getElementById('writeups-app');
const writeupAside = document.getElementById('writeups-event-list');
const consoleScreen = document.getElementById('console-screen');
const consoleForm = document.getElementById('console-form');
const consoleInput = document.getElementById('console-input');
const consoleButtons = document.querySelectorAll('.command-hints button');

if (writeupApp && writeupAside) {
  fetch('writeups/writeups.json')
    .then((res) => res.json())
    .then((data) => buildWriteups(data))
    .catch(() => {
      writeupApp.innerHTML = '<div class="writeups-empty"><p>Unable to load writeups right now.</p></div>';
    });
}

if (consoleScreen && consoleForm && consoleInput) {
  consoleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runConsoleCommand(consoleInput.value.trim());
    consoleInput.value = '';
  });

  consoleButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      runConsoleCommand(btn.dataset.command);
    })
  );

  setTimeout(() => runConsoleCommand('scan'), 800);
}

const consoleResponses = {
  scan:
    'Enumerating signal... BlitzHack online, OSCTF // BlitzCTF infra stable, TourneyPlus build passing checks, PluginPilot automation deployed to prod.',
  creds:
    'Bsides Mumbai #1, InCTFj #9, VishwaCTF top 7, 07CTF/BDSec/Pragyan silver streak, Google Skills 100+ quests. Team BlitzHack locked in.',
  ops: 'Ops board: OSCTF weight 23.20, BlitzCTF future weight 30.64. Sponsors: AlteredSecurity x2, OffSec, OtterSec, RedTeamGarage, GiveMyCertificate.',
  stacks:
    'Stacks online: Python / Java / C / JS, Linux, networking, reverse engineering, binary exploitation, Discord + Minecraft ecosystems.',
  ping: () => `ping blitzhack.xyz ... ${Math.floor(Math.random() * 40) + 30}ms :: tunnel alive.`,
};

let consoleLock = false;

function runConsoleCommand(command = '') {
  if (!consoleScreen) return;
  const normalized = command.toLowerCase();
  const response = consoleResponses[normalized] || 'unknown command. try: scan, creds, ops, stacks, ping';
  const computed = typeof response === 'function' ? response() : response;
  appendConsoleLine(`> ${command || 'help'}`);
  typeConsoleText(computed);
}

function appendConsoleLine(text) {
  if (!consoleScreen) return;
  const line = document.createElement('p');
  line.textContent = text;
  consoleScreen.appendChild(line);
  consoleScreen.scrollTop = consoleScreen.scrollHeight;
}

function typeConsoleText(text) {
  if (!consoleScreen) return;
  if (consoleLock) {
    appendConsoleLine(text);
    return;
  }
  consoleLock = true;
  const line = document.createElement('p');
  consoleScreen.appendChild(line);
  let idx = 0;
  const timer = setInterval(() => {
    line.textContent = text.slice(0, idx);
    idx += 2;
    consoleScreen.scrollTop = consoleScreen.scrollHeight;
    if (idx > text.length) {
      clearInterval(timer);
      consoleLock = false;
    }
  }, 20);
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
      block.appendChild(createChallengeCard(challenge, cache, event.name));
    });
    writeupApp.appendChild(block);
  });
}

function createChallengeCard(challenge, cache, eventName) {
  const card = document.createElement('article');
  card.className = 'challenge-card tilt-card';
  registerTilt(card);
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
  viewBtn.addEventListener('click', () => openWriteupModal(challenge, eventName, cache, card));
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

function openWriteupModal(challenge, eventName, cache, card) {
  if (!writeupModal || !modalBody || !modalTitle || !modalEvent || !modalRaw) return;
  card?.classList.add('loading');
  modalTitle.textContent = challenge.title;
  modalEvent.textContent = eventName;
  modalRaw.href = challenge.rawUrl;
  modalBody.innerHTML = '<p>Loading writeup...</p>';
  writeupModal.classList.add('is-visible');
  document.body.classList.add('modal-open');
  const cached = cache.get(challenge.rawUrl);
  if (cached) {
    modalBody.innerHTML = cached;
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
