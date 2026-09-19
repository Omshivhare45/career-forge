const fs = require('fs');
const path = require('path');

const ROOT = path.join('src', 'features', 'dsa');
const LINE = "import React from 'react';";

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.jsx?$/.test(entry.name)) {
      let src = fs.readFileSync(full, 'utf8');
      if (src.split('\n')[0] === LINE) {
        src = src.split('\n').slice(1).join('\n');
        fs.writeFileSync(full, src);
        console.log('stripped', full);
      }
    }
  }
}

walk(ROOT);

// Also handle the page file that imports React (only used for the legacy
// JSX transform, which this project's Vite config does not use).
const page = path.join('src', 'pages', 'TopicDetail.jsx');
let psrc = fs.readFileSync(page, 'utf8');
if (psrc.split('\n')[0] === LINE) {
  psrc = psrc.split('\n').slice(1).join('\n');
  fs.writeFileSync(page, psrc);
  console.log('stripped', page);
}
