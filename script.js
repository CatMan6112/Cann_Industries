const fileList = [
    "cann_industries.txt",
    "Emmisary.txt",
    "Sol.txt",
    "axiom_corporation.txt",
    "sol_defense_corps.txt",
    "CSISS.txt",
    "UN_Convo.txt",
];
const fileFolder = 'texts';

const imageList = [
  "freebird-album.png",
  "lore.png",
];
const imageFolder = 'images';

const primaryMessage =
  "Initializing...\n" +
  "> BBS Access Requested . . . \n" +
  "> PROVIDE AUTHENTICATION: \n" + 
  "> d2Ugd2VyZSBicm9uIHRvIGluaGVyaXQgdGhlIHN0YXJz\n" +
  "> Authenticated. Proceeding. . .\n" +
  "\n" +
  "\n" +
  "Welcome to the Cann Industries Log System, or CILS." +
  "\n" +
  "Type in a query, and let CILS do the rest.";
const secondaryMessage =
  "Initializing. . . \n" +
  "> Authenticated. \n" +
  "\n" +
  "\n" +
  "Welcome to the Cann Industries Log System, or CILS.";

const typingSpeed = 50;
const fastTypingSpeed = 10;
let results = [], selectedIndex = 0, baseHtml = '';
const terminal = document.getElementById('terminal');

function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days*24*60*60*1000);
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie = name + "=" + (value||"") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  return document.cookie.split(';').reduce((acc, c) => {
    c = c.trim();
    return c.startsWith(nameEQ) ? c.substring(nameEQ.length) : acc;
  }, null);
}

function typeSequence(msg, onComplete, skipable = false) {
  let idx = 0;
  let skip = false;
  let skipListener;

  if (skipable) {
    skipListener = (e) => {
      if (e.key === 'Enter') {
        skip = true;
        window.removeEventListener('keydown', skipListener);
      }
    };
    window.addEventListener('keydown', skipListener);
  }

  function typer() {
    if (skip) {
      const rest = msg.slice(idx).split('\n').map((l,i,arr) =>
        i < arr.length - 1 ? l + '<br>' : l
      ).join('');
      terminal.innerHTML += rest;
      onComplete();
      return;
    }

    if (idx < msg.length) {
      const c = msg[idx++];
      terminal.innerHTML += (c === '\n' ? '<br>' : c);
      setTimeout(typer, typingSpeed);
    } else {
      if (skipable) window.removeEventListener('keydown', skipListener);
      onComplete();
    }
  }

  typer();
}

function init() {
  terminal.innerHTML = '';
  if (getCookie('Authenticated') === 'true') {
    typeSequence(secondaryMessage, startQuery, true);
  } else {
    typeSequence(primaryMessage, () => {
      setCookie('Authenticated','true', 365);
      startQuery();
    }, false);
  }
}
window.addEventListener('load', init);

function startQuery() {
  terminal.innerHTML += '<br><br>Query: ';
  captureQuery();
}

function captureQuery() {
  let query = '';
  function onKey(e) {
    e.preventDefault();
    if (e.key === 'Backspace') {
      if (query) {
        query = query.slice(0, -1);
        terminal.innerHTML = terminal.innerHTML.slice(0, -1);
      }
    } else if (e.key === 'Enter') {
      window.removeEventListener('keydown', onKey);
      terminal.innerHTML += '<br>';
      processQuery(query);
    } else if (e.key.length === 1) {
      query += e.key;
      terminal.innerHTML += e.key;
    }
  }
  window.addEventListener('keydown', onKey);
}

async function processQuery(query) {
  baseHtml = terminal.innerHTML;
  results = [];

  for (const name of fileList) {
    try {
      const res = await fetch(`${fileFolder}/${name}`);
      const txt = await res.text();
      if (txt.toLowerCase().includes(query.toLowerCase())) {
        results.push({ name, type: 'text', content: txt });
      }
    } catch (err) {
      console.warn(`Failed to load ${name}:`, err);
    }
  }

  for (const name of imageList) {
    if (name.toLowerCase().includes(query.toLowerCase())) {
      results.push({ name, type: 'image' });
    }
  }

  if (!results.length) {
    terminal.innerHTML += 'No matching files found.';
    terminal.innerHTML += '<br><br>Query: ';
    captureQuery();
    return;
  }

  selectedIndex = 0;
  renderFileList();
  window.addEventListener('keydown', onSelect);
}

function renderFileList() {
  terminal.innerHTML = baseHtml + '<br>';
  results.forEach((r, i) => {
    if (i === selectedIndex) {
      terminal.innerHTML += `<span class="selected">${r.name}</span><br>`;
    } else {
      terminal.innerHTML += `${r.name}<br>`;
    }
  });
}

function onSelect(e) {
  if (e.key === 'ArrowDown') {
    selectedIndex = (selectedIndex + 1) % results.length;
    renderFileList();
  } else if (e.key === 'ArrowUp') {
    selectedIndex = (selectedIndex - 1 + results.length) % results.length;
    renderFileList();
  } else if (e.key === 'Enter') {
    window.removeEventListener('keydown', onSelect);
    terminal.innerHTML = '';
    const selected = results[selectedIndex];
    if (selected.type === 'text') {
      typeFileContent(selected.content);
    } else {
      typeImageContent(selected.name);
    }
  }
}

function onReturnToMenu(e) {
  if (e.key.toLowerCase() === 'm') {
    window.removeEventListener('keydown', onReturnToMenu);
    terminal.innerHTML = '';
    typeSequence(secondaryMessage, startQuery, true);
  }
}

function typeFileContent(text) {
  let i = 0;
  let currentDelay = typingSpeed;
  let aborted = false;
  let timeoutId = null;

  const speedUp = (e) => {
    if (e.key === 'ArrowRight') currentDelay = fastTypingSpeed;
  };
  const slowDown = (e) => {
    if (e.key === 'ArrowRight') currentDelay = typingSpeed;
  };

  if (ctrlCHandler) window.removeEventListener('keydown', ctrlCHandler);
  ctrlCHandler = (e) => {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      aborted = true;
      clearTimeout(timeoutId);
      window.removeEventListener('keydown', speedUp);
      window.removeEventListener('keyup', slowDown);
      doBlinkThenReturn();
    }
  };
  window.addEventListener('keydown', ctrlCHandler);

  window.addEventListener('keydown', speedUp);
  window.addEventListener('keyup', slowDown);

  function typer() {
    if (aborted) return;
    if (i < text.length) {
      if (text[i] === '[') {
        const linkMatch = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [fullMatch, label, fileName] = linkMatch;
          terminal.innerHTML +=
            `<a href="#" class="terminal-link" data-file="${fileName}">${label}</a>`;
          i += fullMatch.length;
          timeoutId = setTimeout(typer, currentDelay);
          return;
        }
      }
      const c = text[i++];
      terminal.innerHTML += (c === '\n' ? '<br>' : c);
      timeoutId = setTimeout(typer, currentDelay);
    } else {
      window.removeEventListener('keydown', speedUp);
      window.removeEventListener('keyup', slowDown);
      window.removeEventListener('keydown', ctrlCHandler);
      terminal.innerHTML += '<br><br>Press [M] to return.';
      window.addEventListener('keydown', onReturnToMenu);
    }
  }

  terminal.addEventListener('click', function handleLinkClick(e) {
    if (e.target.classList.contains('terminal-link')) {
      e.preventDefault();
      const targetFile = e.target.getAttribute('data-file');
      fetch(`${fileFolder}/${targetFile}`)
        .then(res => res.text())
        .then(newText => {
          terminal.innerHTML = '';
          typeFileContent(newText);
        })
        .catch(err => console.warn(`Failed to load ${targetFile}:`, err));
      terminal.removeEventListener('click', handleLinkClick);
    }
  });

  typer();
}

async function typeImageContent(fileName) {
  const img = new Image();
  img.src = `${imageFolder}/${fileName}`;

  img.onload = async () => {
    const w = img.width, h = img.height;
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    canvas.style.display        = 'block';
    canvas.style.margin         = '4px auto';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.maxWidth       = '100%';
    canvas.style.maxHeight      = '80vh';
    terminal.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const off = document.createElement('canvas');
    off.width  = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0);

    if (ctrlCHandler) window.removeEventListener('keydown', ctrlCHandler);
    ctrlCHandler = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        window.removeEventListener('keydown', onReturnToMenu);
        doBlinkThenReturn();
      }
    };
    window.addEventListener('keydown', ctrlCHandler);

    const baseSpeed = 5;
    const glitchProb = 0.02;

    for (let y = 0; y < h; y++) {
      const row = octx.getImageData(0, y, w, 1);
      const d   = row.data;
      for (let i = 0; i < d.length; i += 4) {
        const avg = 0.21*d[i] + 0.72*d[i+1] + 0.07*d[i+2];
        d[i] = d[i+1] = d[i+2] = avg;
      }
      ctx.putImageData(row, 0, y);
      const delay = baseSpeed + Math.random() * baseSpeed;
      if (Math.random() < glitchProb) {
        await new Promise(r => setTimeout(r, delay * 20));
      }
      await new Promise(r => setTimeout(r, delay));
    }

    await new Promise(r => setTimeout(r, baseSpeed * 100));

    for (let y = 0; y < h; y++) {
      const colorRow = octx.getImageData(0, y, w, 1);
      ctx.putImageData(colorRow, 0, y);
      const delay = baseSpeed + Math.random() * baseSpeed;
      if (Math.random() < glitchProb) {
        await new Promise(r => setTimeout(r, delay * 20));
      }
      await new Promise(r => setTimeout(r, delay));
    }

    const promptDiv = document.createElement('div');
    promptDiv.innerHTML = '<br><br>Press [M] to return.';
    terminal.appendChild(promptDiv);
    window.addEventListener('keydown', onReturnToMenu);
  };

  img.onerror = (err) => {
    console.warn(`Failed to load image ${fileName}:`, err);
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'Error loading image.';
    terminal.appendChild(errorDiv);
    window.addEventListener('keydown', onReturnToMenu);
  };
}

let ctrlCHandler = null;

function doBlinkThenReturn() {
  if (ctrlCHandler) {
    window.removeEventListener('keydown', ctrlCHandler);
    ctrlCHandler = null;
  }
  window.removeEventListener('keydown', onReturnToMenu);

  const term = terminal;
  const blinkCount = 4;
  let count = 0;
  const interval = setInterval(() => {
    term.style.color = term.style.color === 'red' ? '' : 'red';
    count++;
    if (count >= blinkCount) {
      clearInterval(interval);
      term.style.color = '';
      term.innerHTML = '';
      typeSequence(secondaryMessage, startQuery, true);
    }
  }, 250);
}
