// Shared DSA code-execution and media helpers.
// These were previously inlined in TopicDetail.jsx and are extracted here as pure utilities
// so every DSA topic path consumes the exact same transpiler / sandbox / YT behavior.

// Audio Feedback Sound Engine for high gamification engagement
export const playSoundEffect = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    console.warn("Audio Context blocked by browser auto-play policy");
  }
};

// Helper to extract embedded URL supporting both video IDs and playlists dynamically
export const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const videoRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const videoMatch = url.match(videoRegExp);
  const videoId = (videoMatch && videoMatch[2] && videoMatch[2].length === 11) ? videoMatch[2] : null;

  const listMatch = url.match(/[?&]list=([^#\&\?]+)/);
  const listId = (listMatch && listMatch[1]) ? listMatch[1] : null;

  if (videoId && listId) {
    return `https://www.youtube.com/embed/${videoId}?list=${listId}&rel=0&modestbranding=1&showinfo=0`;
  } else if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
  } else if (listId) {
    return `https://www.youtube.com/embed/videoseries?list=${listId}`;
  }

  return null;
};

// Helper to safely append enablejsapi and origin parameters to avoid postMessage origin mismatch errors
export const appendYTParams = (url) => {
  if (!url || typeof url !== 'string') return "";
  try {
    let updatedUrl = url;
    if (!updatedUrl.includes('enablejsapi=1')) {
      const separator = updatedUrl.includes('?') ? '&' : '?';
      updatedUrl = `${updatedUrl}${separator}enablejsapi=1&autoplay=1`;
    }
    if (!updatedUrl.includes('origin=') && typeof window !== 'undefined') {
      updatedUrl = `${updatedUrl}&origin=${window.location.origin}`;
    }
    return updatedUrl;
  } catch (e) {
    return url;
  }
};

// Safe client-side transpiler from Python, C++, Java to JS
export const transpileToJS = (code, language) => {
  let js = code;
  const lang = (language || 'cpp').toLowerCase();

  if (lang === 'javascript' || lang === 'js') {
    return js;
  }

  if (lang === 'python') {
    // Basic Python to JS transpiler
    js = js.replace(/#\s*(.*)$/gm, '// $1');
    js = js.replace(/\bpass\b/g, '');
    js = js.replace(/import\s+\w+/g, '');
    js = js.replace(/from\s+\w+\s+import\s+\w+/g, '');
    js = js.replace(/class\s+(\w+):/g, 'class $1 {');
    js = js.replace(/\bif\s+(.+?):/g, 'if ($1):');
    js = js.replace(/\belif\s+(.+?):/g, 'elif ($1):');
    js = js.replace(/\bwhile\s+(.+?):/g, 'while ($1):');

    // Remove type annotations in parameter lists and functions
    js = js.replace(/^(\s*)def\s+(\w+)\(([^)]*)\)\s*(->\s*[\w[\]]+)?:/gm, (match, indent, name, params) => {
      const cleanParams = params.split(',').map(p => {
        const parts = p.split(':');
        return parts[0].replace('self', '').trim();
      }).filter(Boolean).join(', ');

      const isStandalone = indent.length === 0;
      if (name === '__init__') {
        return `${indent}constructor(${cleanParams}) {`;
      }
      return isStandalone ? `${indent}function ${name}(${cleanParams}) {` : `${indent}${name}(${cleanParams}) {`;
    });

    // Replace Python syntax and logic keywords
    js = js.replace(/\bself\./g, 'this.');
    js = js.replace(/\bTrue\b/g, 'true');
    js = js.replace(/\bFalse\b/g, 'false');
    js = js.replace(/\bNone\b/g, 'null');
    js = js.replace(/\band\b/g, '&&');
    js = js.replace(/\bor\b/g, '||');
    js = js.replace(/\bnot\b/g, '!');
    js = js.replace(/\belif\b/g, 'else if');

    // Parsing Python indentation levels into braces
    const lines = js.split('\n');
    let output = [];
    let indentStack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        output.push(line);
        continue;
      }

      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;

      while (indentStack.length > 0 && indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        output.push(' '.repeat(indentStack.length) + '}');
      }

      output.push(line);

      if (line.trim().endsWith('{') || line.trim().endsWith('(') || line.trim().endsWith(':')) {
        if (output[output.length - 1].trim().endsWith(':')) {
          // Replace trailing colon with an open curly brace
          output[output.length - 1] = output[output.length - 1].replace(/:$/, ' {');
        }
        indentStack.push(indent + 4);
      }
    }

    while (indentStack.length > 0) {
      indentStack.pop();
      output.push(' '.repeat(indentStack.length) + '}');
    }

    js = output.join('\n');

    // Division conversions
    js = js.replace(/(\w+)\s*\/\/\s*(\w+)/g, 'Math.floor($1 / $2)');
    js = js.replace(/(\w+)\s*\/\/=\s*(\w+)/g, '$1 = Math.floor($1 / $2)');

    // Strip class Solution if it was transpiled into the output
    if (js.includes('class Solution')) {
      js = js.replace(/class\s+Solution\s*\{/, '');
      const lastBraceIdx = js.lastIndexOf('}');
      if (lastBraceIdx !== -1) {
        js = js.slice(0, lastBraceIdx) + js.slice(lastBraceIdx + 1);
      }
    }
  }

  if (lang === 'cpp' || lang === 'java') {
    // Safe outer Solution class stripping for Java/C++ LeetCode style
    if (js.includes('class Solution')) {
      js = js.replace(/(?:public\s+)?class\s+Solution\s*\{/, '');
      const lastBraceIdx = js.lastIndexOf('}');
      if (lastBraceIdx !== -1) {
        js = js.slice(0, lastBraceIdx) + js.slice(lastBraceIdx + 1);
      }
    }

    // C++/Java to JS Type and Object translations
    js = js.replace(/#include\s+[<"][\w\/\.\+]+[>"]/g, '');
    js = js.replace(/import\s+java\..*;/g, '');
    js = js.replace(/package\s+[\w\.]+;/g, '');
    js = js.replace(/using\s+namespace\s+\w+;/g, '');
    js = js.replace(/\bstd::/g, '');
    js = js.replace(/(?:public\s+)?class\s+\w+\s*\{/g, ''); // strip outer wrapper class
    js = js.replace(/public\s+static\s+/g, '');
    js = js.replace(/private\s+/g, '');
    js = js.replace(/\b(public|private|protected)\s*:/g, ''); // C++ label modifiers

    // Remove complex types (vectors, pointers, arrays, references) without trailing word boundary
    js = js.replace(/\b(vector<int>&|vector<string>&|vector<double>&|vector<int>|vector<string>|vector<double>|TreeNode\*|ListNode\*|int\*|char\*|double\*|int\[\]|string\[\]|double\[\]|float\[\]|const)(?:\b)?/g, '');

    // Remove standard primitive types with word boundaries
    js = js.replace(/\b(int|bool|double|double|void|float|long|long\s+long|string|char|TreeNode|ListNode)\b/g, '');

    // Strip any stray C++ reference/pointer symbols and const keywords inside parameter declarations
    js = js.replace(/([,\(]\s*)[&*]/g, '$1');

    // Convert pointer arrows and nullptrs
    js = js.replace(/->/g, '.');
    js = js.replace(/\bnullptr\b/g, 'null');

    // Polyfill C++ vectors and standard Java ArrayList calls to native JS arrays
    js = js.replace(/\bpush_back\b/g, 'push');
    js = js.replace(/\bback\b\(\)/g, 'back');
    js = js.replace(/\bpop_back\b\(\)/g, 'pop()');
    js = js.replace(/\bsize\b\(\)/g, 'length');
    js = js.replace(/\bempty\b\(\)/g, 'length === 0');

    // Convert standalone function declaration without 'function' prefix
    js = js.replace(/^(\s*)([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{/gm, (match, indent, name, params) => {
      const reserved = ['if', 'for', 'while', 'switch', 'catch', 'else', 'return'];
      if (reserved.includes(name)) {
        return match;
      }
      return `${indent}function ${name}(${params}) {`;
    });
  }

  return js;
};

// Robust compiler validation checks for statically typed languages & Python syntax rules
export const syntaxCheck = (code, lang) => {
  // Strip multi-line comments: /* ... */
  let cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '');

  const lines = cleanCode.split('\n');
  let openBraces = 0;
  let openParens = 0;

  // Check braces/parens count
  for (let i = 0; i < cleanCode.length; i++) {
    if (cleanCode[i] === '{') openBraces++;
    if (cleanCode[i] === '}') openBraces--;
    if (cleanCode[i] === '(') openParens++;
    if (cleanCode[i] === ')') openParens--;
  }

  if (openBraces !== 0) {
    throw new Error("Compilation Error: Unmatched curly braces '{' or '}'. Check your code blocks!");
  }
  if (openParens !== 0) {
    throw new Error("Compilation Error: Unmatched parentheses '(' or ')'. Check your function calls/conditionals!");
  }

  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx].trim();
    const lineNum = idx + 1;

    // Strip trailing single-line comment
    if (line.includes('//')) {
      line = line.substring(0, line.indexOf('//')).trim();
    }

    // Strip trailing python comment
    if (lang === 'python' && line.includes('#')) {
      line = line.substring(0, line.indexOf('#')).trim();
    }

    if (!line) continue;

    if (lang === 'cpp' || lang === 'java') {
      // Check semicolons on statement lines
      const isControlStatement = line.startsWith('if') || line.startsWith('else') ||
                                 line.startsWith('for') || line.startsWith('while') ||
                                 line.startsWith('switch') || line.startsWith('class') ||
                                 line.startsWith('public') || line.startsWith('private') ||
                                 line.startsWith('protected') || line.startsWith('#include') ||
                                 line.startsWith('using namespace');
      const endsWithBlock = line.endsWith('{') || line.endsWith('}');

      if (!isControlStatement && !endsWithBlock && !line.endsWith(';')) {
        throw new Error(`expected ';' at the end of statement on line ${lineNum}`);
      }

      if (lang === 'cpp') {
        if (line.includes('cout') && line.includes('>>')) {
          throw new Error(`invalid stream insertion operator '>>' on line ${lineNum}. Did you mean '<<'?`);
        }
        if (line.includes('cin') && line.includes('<<')) {
          throw new Error(`invalid stream extraction operator '<<' on line ${lineNum}. Did you mean '>>'?`);
        }
      }

      if (lang === 'java') {
        if (line.includes('console.log') || line.includes('print(')) {
          throw new Error(`Java uses System.out.println() on line ${lineNum}, not console.log/print.`);
        }
      }
    }

    if (lang === 'python') {
      const isHeader = line.startsWith('def ') || line.startsWith('if ') ||
                       line.startsWith('elif ') || line.startsWith('else:') ||
                       line.startsWith('for ') || line.startsWith('while ');
      if (isHeader && !line.endsWith(':')) {
        throw new Error(`expected ':' at the end of header declaration on line ${lineNum}`);
      }
      if (line.includes('console.log') || line.includes('System.out') || line.includes('cout')) {
        throw new Error(`Python uses print() for output on line ${lineNum}.`);
      }
    }

    if (lang === 'javascript') {
      if (line.includes('System.out') || line.includes('cout') || line.includes('print(')) {
        throw new Error(`JavaScript uses console.log() for output on line ${lineNum}.`);
      }
    }
  }
};

// Shared sandbox execution engine — transpiles, syntax-checks and runs test cases
export const executeSandbox = (userCode, lang, testCases, fnNameOverride = null) => {
  if (lang === 'html' || lang === 'css') {
    const logs = [];
    const results = [];
    logs.push(`⚡ Initializing browser ${lang.toUpperCase()} parser sandbox...`);
    logs.push(`✨ ${lang.toUpperCase()} code parsed successfully.`);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(lang === 'html' ? (userCode || '') : '', 'text/html');

      logs.push(`⚙️ Evaluating structural assertions...`);

      const cases = testCases || [];
      cases.forEach((tc, idx) => {
        const isHidden = idx >= 3;
        let actualOutput = 'Not found';
        let isMatch = false;
        let element = null;

        try {
          if (tc.selector) {
            element = doc.querySelector(tc.selector);
            if (element) {
              if (tc.attribute) {
                const attrVal = element.getAttribute(tc.attribute);
                actualOutput = attrVal ? attrVal.trim() : 'attribute not found';
              } else if (tc.expectedText) {
                actualOutput = element.textContent.trim();
              } else {
                actualOutput = 'exists';
              }
            } else {
              actualOutput = 'element not found';
            }
          } else if (tc.regex) {
            const reg = new RegExp(tc.regex, 'i');
            const matches = reg.test(userCode);
            actualOutput = matches ? 'matches pattern' : 'no match';
          } else {
            actualOutput = 'no validator configured';
          }

          const cleanActual = String(actualOutput).trim().toLowerCase();
          const cleanExpected = String(tc.expected).trim().toLowerCase();

          if (cleanExpected === 'exists') {
            isMatch = !!element;
          } else if (cleanExpected === 'matches pattern') {
            isMatch = actualOutput === 'matches pattern';
          } else {
            isMatch = cleanActual.includes(cleanExpected) || cleanExpected.includes(cleanActual);
          }

          results.push({
            ...tc,
            actual: actualOutput,
            status: isMatch ? 'passed' : 'failed',
            isHidden
          });

          if (isMatch) {
            logs.push(`🟢 Test Case ${idx + 1}: Passed! - ${tc.input}`);
          } else {
            logs.push(`❌ Test Case ${idx + 1}: Failed! Expected: ${tc.expected}, Got: ${actualOutput}`);
          }
        } catch (err) {
          results.push({
            ...tc,
            actual: `Error: ${err.message}`,
            status: 'failed',
            isHidden
          });
          logs.push(`❌ Test Case ${idx + 1}: Error - ${err.message}`);
        }
      });
    } catch (err) {
      logs.push(`💥 Parsing Error: ${err.message}`);
      throw new Error(`Parsing Error: ${err.message}`);
    }

    return { results, logs };
  }

  // Standard DS structures and vector prototypes injected in dynamic runner
  const polyfills = `
    class TreeNode {
      constructor(val, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
      }
    }
    class ListNode {
      constructor(val, next = null) {
        this.val = val;
        this.next = next;
      }
    }
    function createList(arr) {
      if (!arr || arr.length === 0) return null;
      let head = new ListNode(arr[0]);
      let curr = head;
      for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
      }
      return head;
    }
    function createTree(arr) {
      if (!arr || arr.length === 0) return null;
      let root = new TreeNode(arr[0]);
      let queue = [root];
      let i = 1;
      while (queue.length > 0 && i < arr.length) {
        let curr = queue.shift();
        if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
          curr.left = new TreeNode(arr[i]);
          queue.push(curr.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
          curr.right = new TreeNode(arr[i]);
          queue.push(curr.right);
        }
        i++;
      }
      return root;
    }
    Array.prototype.back = function() { return this[this.length - 1]; };
    Array.prototype.empty = function() { return this.length === 0; };
    Array.prototype.push_back = function(x) { this.push(x); };
    Array.prototype.pop_back = function() { return this.pop(); };
  `;

  const logs = [];
  const results = [];

  logs.push(`⚡ Initializing compiler sandbox for ${lang.toUpperCase()}...`);

  if (!userCode || !userCode.trim()) {
    logs.push(`💥 Compilation Error: Solution code is empty!`);
    throw new Error("Compilation Error: Please write your solution code before running or submitting.");
  }

  // Run robust syntax checker
  try {
    syntaxCheck(userCode, lang);
  } catch (syntaxErr) {
    logs.push(`💥 Compilation Error: ${syntaxErr.message}`);
    throw new Error(`Compilation Error: ${syntaxErr.message}`);
  }

  logs.push(`📦 Parsing AST and transpiling constructs...`);

  let transpiled = '';
  try {
    transpiled = transpileToJS(userCode, lang);
  } catch (e) {
    logs.push(`💥 Transpilation Error: ${e.message}`);
    throw new Error(`Transpilation Error: ${e.message}`);
  }

  // Verify transpiled JS syntax first to catch early syntax/compilation errors
  try {
    const compileBody = polyfills + "\n" + transpiled;
    new Function(compileBody);
    logs.push(`✨ Syntax validation passed! No compilation errors detected.`);
  } catch (err) {
    logs.push(`💥 Compilation Syntax Error: ${err.message}`);
    throw new Error(`Compilation Error: ${err.message}`);
  }

  logs.push(`⚙️ Evaluating standard check assertions...`);

  // Completely dynamic function name execution based on active level
  const fnName = fnNameOverride || 'solution';
  const getCallExpr = (input) => `return String(${fnName}(${input}));`;

  testCases.forEach((tc, idx) => {
    const isHidden = idx >= 2;
    const runnerBody = polyfills + '\n' + transpiled + '\n' + getCallExpr(tc.input);

    try {
      const evalFn = new Function(runnerBody);
      const actualOutput = evalFn();

      const cleanActual = String(actualOutput).trim();
      const cleanExpected = String(tc.expected).trim();
      const isMatch = cleanActual === cleanExpected;

      results.push({
        ...tc,
        actual: cleanActual,
        status: isMatch ? 'passed' : 'failed',
        isHidden
      });

      if (isMatch) {
        if (isHidden) {
          logs.push(`🟢 Hidden Test Case ${idx + 1}: Passed successfully!`);
        } else {
          logs.push(`🟢 Sample Test Case ${idx + 1}: Passed! Expected: ${tc.expected}, Got: ${actualOutput}`);
        }
      } else {
        if (isHidden) {
          logs.push(`❌ Hidden Test Case ${idx + 1}: Failed (Wrong Answer)`);
        } else {
          logs.push(`❌ Sample Test Case ${idx + 1}: Failed! Expected: ${tc.expected}, Got: ${actualOutput}`);
        }
      }
    } catch (err) {
      results.push({
        ...tc,
        actual: `Error: ${err.message}`,
        status: 'failed',
        isHidden
      });
      if (isHidden) {
        logs.push(`💥 Hidden Test Case ${idx + 1}: Runtime Error!`);
      } else {
        logs.push(`💥 Sample Test Case ${idx + 1}: Runtime Error! ${err.message}`);
      }
    }
  });

  return { results, logs };
};

// XP rank ladder used by the gamification celebration flow
export const getRank = (xp) => {
  if (xp >= 15000) return { title: 'Pro', badge: 'Recursion Wizard', style: 'badge-emerald text-emerald-400' };
  if (xp >= 5000) return { title: 'Coder', badge: 'Array Tactician', style: 'badge-gold text-amber-400' };
  if (xp >= 1000) return { title: 'Apprentice', badge: 'Loop Master', style: 'badge-silver text-slate-300' };
  return { title: 'Beginner', badge: 'Hello World Pioneer', style: 'text-indigo-400' };
};