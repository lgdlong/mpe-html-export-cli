This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.
The content has been processed where line numbers have been added.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: test/block-id-helpers.test.js, test/find-fragment-target-line.test.js, test/markdown/README.md, test/markdown/basics.md, test/markdown/code-chunks.md, test/markdown/diagrams.md, test/markdown/file-imports.md, test/markdown/interactive-diagrams.md, test/markdown/math.md, test/markdown/remote-ssh.md, test/markdown/test.md, test/markdown/test-lightbox.md, test/markdown/data/sp500.csv
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Line numbers have been added to the beginning of each line

# Directory Structure
```
test/block-id-helpers.test.js
test/find-fragment-target-line.test.js
test/markdown/basics.md
test/markdown/code-chunks.md
test/markdown/data/sp500.csv
test/markdown/diagrams.md
test/markdown/file-imports.md
test/markdown/interactive-diagrams.md
test/markdown/math.md
test/markdown/README.md
test/markdown/remote-ssh.md
test/markdown/test-lightbox.md
test/markdown/test.md
```

# Files

## File: test/block-id-helpers.test.js
````javascript
  1: /* global suite, test, suiteSetup, suiteTeardown */
  2: 
  3: /**
  4:  * Unit tests for the pure helpers in src/block-id-helpers.ts.  The
  5:  * provider class itself imports `vscode` (only resolvable at extension
  6:  * host runtime), so the helpers live in their own file specifically to
  7:  * make this kind of standalone testing possible.
  8:  */
  9: 
 10: const assert = require('assert');
 11: const path = require('path');
 12: const fs = require('fs');
 13: const esbuild = require('esbuild');
 14: 
 15: let parseBlockIdTriggerContext;
 16: let extractBlockIds;
 17: let parseHeadingTriggerContext;
 18: let extractHeadings;
 19: let parseNoteTriggerContext;
 20: let parseTagTriggerContext;
 21: let tmpFile;
 22: 
 23: suite('block-id-helpers', function () {
 24:   this.timeout(15000);
 25: 
 26:   suiteSetup(async function () {
 27:     const result = await esbuild.build({
 28:       entryPoints: [path.join(__dirname, '..', 'src', 'block-id-helpers.ts')],
 29:       bundle: true,
 30:       platform: 'node',
 31:       format: 'cjs',
 32:       target: 'node18',
 33:       write: false,
 34:       logLevel: 'silent',
 35:     });
 36:     tmpFile = path.join(__dirname, '.block-id-helpers.bundle.cjs');
 37:     fs.writeFileSync(tmpFile, result.outputFiles[0].text);
 38:     const mod = require(tmpFile);
 39:     parseBlockIdTriggerContext = mod.parseBlockIdTriggerContext;
 40:     extractBlockIds = mod.extractBlockIds;
 41:     parseHeadingTriggerContext = mod.parseHeadingTriggerContext;
 42:     extractHeadings = mod.extractHeadings;
 43:     parseNoteTriggerContext = mod.parseNoteTriggerContext;
 44:     parseTagTriggerContext = mod.parseTagTriggerContext;
 45:   });
 46: 
 47:   suiteTeardown(function () {
 48:     if (tmpFile && fs.existsSync(tmpFile)) {
 49:       fs.unlinkSync(tmpFile);
 50:     }
 51:   });
 52: 
 53:   suite('parseBlockIdTriggerContext', function () {
 54:     test('returns null when the cursor is not in a wikilink', function () {
 55:       assert.strictEqual(parseBlockIdTriggerContext('plain text ^abc'), null);
 56:       assert.strictEqual(parseBlockIdTriggerContext(''), null);
 57:       assert.strictEqual(parseBlockIdTriggerContext('No brackets here'), null);
 58:     });
 59: 
 60:     test('returns null when the wikilink has no caret', function () {
 61:       assert.strictEqual(parseBlockIdTriggerContext('[[README'), null);
 62:       assert.strictEqual(parseBlockIdTriggerContext('[[README#Heading'), null);
 63:     });
 64: 
 65:     test('captures note name + empty partial right after [[Note^', function () {
 66:       assert.deepStrictEqual(parseBlockIdTriggerContext('[[README^'), {
 67:         noteName: 'README',
 68:         partial: '',
 69:       });
 70:     });
 71: 
 72:     test('captures partial id while the user is typing', function () {
 73:       assert.deepStrictEqual(parseBlockIdTriggerContext('[[README^ab'), {
 74:         noteName: 'README',
 75:         partial: 'ab',
 76:       });
 77:     });
 78: 
 79:     test('handles a heading prefix [[Note#Heading^...', function () {
 80:       assert.deepStrictEqual(
 81:         parseBlockIdTriggerContext('See [[README#Setup^abc'),
 82:         { noteName: 'README', partial: 'abc' },
 83:       );
 84:     });
 85: 
 86:     test('trims whitespace around the note name', function () {
 87:       assert.deepStrictEqual(parseBlockIdTriggerContext('[[ Notes/Daily ^'), {
 88:         noteName: 'Notes/Daily',
 89:         partial: '',
 90:       });
 91:     });
 92: 
 93:     test('only looks at the cursor position (ignores text after)', function () {
 94:       // The provider always passes textBeforeCursor.  Make sure a closing
 95:       // ]] later in the line doesn't break detection.
 96:       assert.deepStrictEqual(
 97:         parseBlockIdTriggerContext('Already closed [[Other]] now [[README^'),
 98:         { noteName: 'README', partial: '' },
 99:       );
100:     });
101:   });
102: 
103:   suite('extractBlockIds', function () {
104:     test('returns [] for content with no block ids', function () {
105:       assert.deepStrictEqual(extractBlockIds('Just some prose.\nNothing.'), []);
106:     });
107: 
108:     test('finds a block id at end of paragraph', function () {
109:       const text = '# H\n\nFirst paragraph. ^abc\n\nNext.';
110:       assert.deepStrictEqual(extractBlockIds(text), [
111:         { id: 'abc', body: 'First paragraph.' },
112:       ]);
113:     });
114: 
115:     test('preserves source order', function () {
116:       const text = [
117:         'Line one. ^one',
118:         'Middle.',
119:         'Line two. ^two',
120:         'Line three. ^three',
121:       ].join('\n');
122:       const out = extractBlockIds(text);
123:       assert.deepStrictEqual(
124:         out.map((b) => b.id),
125:         ['one', 'two', 'three'],
126:       );
127:     });
128: 
129:     test('dedupes ids that appear more than once', function () {
130:       const text = 'First. ^abc\nSecond.\nThird. ^abc';
131:       const out = extractBlockIds(text);
132:       assert.strictEqual(out.length, 1);
133:       assert.strictEqual(out[0].id, 'abc');
134:       assert.strictEqual(out[0].body, 'First.');
135:     });
136: 
137:     test('does not match an inline ^id with non-whitespace before/after', function () {
138:       // ^id must be preceded by whitespace AND end the line — otherwise
139:       // it might be a normal use of the caret in math, an emoji, etc.
140:       const text = 'Mention of ^abc in middle.\nReal block. ^abc';
141:       const out = extractBlockIds(text);
142:       assert.strictEqual(out.length, 1);
143:       assert.strictEqual(out[0].body, 'Real block.');
144:     });
145: 
146:     test('handles ids with hyphens, underscores and digits', function () {
147:       const text = 'Block. ^my-block_123';
148:       const out = extractBlockIds(text);
149:       assert.deepStrictEqual(out, [{ id: 'my-block_123', body: 'Block.' }]);
150:     });
151:   });
152: 
153:   suite('parseHeadingTriggerContext', function () {
154:     test('returns null when not in a wikilink', function () {
155:       assert.strictEqual(parseHeadingTriggerContext('# Heading'), null);
156:       assert.strictEqual(parseHeadingTriggerContext(''), null);
157:     });
158: 
159:     test('returns null when there is no #', function () {
160:       assert.strictEqual(parseHeadingTriggerContext('[[README'), null);
161:       assert.strictEqual(parseHeadingTriggerContext('[[README^abc'), null);
162:     });
163: 
164:     test('captures empty partial right after [[Note#', function () {
165:       assert.deepStrictEqual(parseHeadingTriggerContext('[[README#'), {
166:         noteName: 'README',
167:         partial: '',
168:       });
169:     });
170: 
171:     test('captures partial heading slug while typing', function () {
172:       assert.deepStrictEqual(parseHeadingTriggerContext('[[README#se'), {
173:         noteName: 'README',
174:         partial: 'se',
175:       });
176:     });
177: 
178:     test('does NOT match when the fragment already contains ^ (block context wins)', function () {
179:       // [[Note#Heading^abc] should be handled by parseBlockIdTriggerContext,
180:       // not parseHeadingTriggerContext.
181:       assert.strictEqual(
182:         parseHeadingTriggerContext('[[README#Setup^abc'),
183:         null,
184:       );
185:     });
186: 
187:     test('only looks at the cursor position', function () {
188:       assert.deepStrictEqual(
189:         parseHeadingTriggerContext('Already [[Other#X]] then [[README#'),
190:         { noteName: 'README', partial: '' },
191:       );
192:     });
193:   });
194: 
195:   suite('extractHeadings', function () {
196:     test('returns [] when there are no headings', function () {
197:       assert.deepStrictEqual(extractHeadings('Just prose, no #.'), []);
198:     });
199: 
200:     test('extracts ATX headings with text + slug', function () {
201:       const text = ['# Setup Guide', '', 'Body.', '', '## Configuration'].join(
202:         '\n',
203:       );
204:       const out = extractHeadings(text);
205:       assert.deepStrictEqual(out, [
206:         { level: 1, text: 'Setup Guide', slug: 'setup-guide' },
207:         { level: 2, text: 'Configuration', slug: 'configuration' },
208:       ]);
209:     });
210: 
211:     test('strips trailing {#id} attribute spans before slugifying', function () {
212:       const text = '# Custom ID heading {#my-id}';
213:       const out = extractHeadings(text);
214:       assert.strictEqual(out.length, 1);
215:       assert.strictEqual(out[0].text, 'Custom ID heading');
216:     });
217: 
218:     test('disambiguates duplicate headings the same way crossnote does', function () {
219:       // HeadingIdGenerator suffixes duplicates with -1, -2, …
220:       const text = '# Setup\n\n# Setup\n\n# Setup';
221:       const slugs = extractHeadings(text).map((h) => h.slug);
222:       assert.deepStrictEqual(slugs, ['setup', 'setup-1', 'setup-2']);
223:     });
224: 
225:     test('skips lines inside fenced code blocks', function () {
226:       const text = [
227:         '# Real heading',
228:         '',
229:         '```js',
230:         '# not a heading',
231:         '## also not',
232:         '```',
233:         '',
234:         '## Another real heading',
235:       ].join('\n');
236:       const out = extractHeadings(text);
237:       assert.deepStrictEqual(
238:         out.map((h) => h.text),
239:         ['Real heading', 'Another real heading'],
240:       );
241:     });
242: 
243:     test('handles all 6 heading levels', function () {
244:       const text = '# h1\n## h2\n### h3\n#### h4\n##### h5\n###### h6';
245:       const out = extractHeadings(text);
246:       assert.deepStrictEqual(
247:         out.map((h) => h.level),
248:         [1, 2, 3, 4, 5, 6],
249:       );
250:     });
251: 
252:     test('does not treat 7+ leading hashes as a heading', function () {
253:       const out = extractHeadings('####### too many');
254:       assert.deepStrictEqual(out, []);
255:     });
256:   });
257: 
258:   suite('parseNoteTriggerContext', function () {
259:     test('returns null for plain text and empty input', function () {
260:       assert.strictEqual(parseNoteTriggerContext(''), null);
261:       assert.strictEqual(parseNoteTriggerContext('No brackets'), null);
262:       assert.strictEqual(parseNoteTriggerContext('Just one ['), null);
263:     });
264: 
265:     test('matches `[[` with empty partial', function () {
266:       assert.deepStrictEqual(parseNoteTriggerContext('See [['), {
267:         partial: '',
268:         isEmbed: false,
269:       });
270:     });
271: 
272:     test('matches `![[` and flags as embed', function () {
273:       assert.deepStrictEqual(parseNoteTriggerContext('Look at ![['), {
274:         partial: '',
275:         isEmbed: true,
276:       });
277:     });
278: 
279:     test('captures partial note name', function () {
280:       assert.deepStrictEqual(parseNoteTriggerContext('[[Read'), {
281:         partial: 'Read',
282:         isEmbed: false,
283:       });
284:       assert.deepStrictEqual(parseNoteTriggerContext('![[image'), {
285:         partial: 'image',
286:         isEmbed: true,
287:       });
288:     });
289: 
290:     test('does NOT match once # is typed (heading context takes over)', function () {
291:       assert.strictEqual(parseNoteTriggerContext('[[Note#Setup'), null);
292:     });
293: 
294:     test('does NOT match once ^ is typed (block context takes over)', function () {
295:       assert.strictEqual(parseNoteTriggerContext('[[Note^abc'), null);
296:     });
297: 
298:     test('does NOT match once | is typed (alias context — out of scope)', function () {
299:       assert.strictEqual(parseNoteTriggerContext('[[Note|al'), null);
300:     });
301: 
302:     test('does NOT match a single bracket', function () {
303:       assert.strictEqual(parseNoteTriggerContext('Plain [link'), null);
304:     });
305: 
306:     test('only looks at the cursor position (closed wikilinks earlier on the line)', function () {
307:       assert.deepStrictEqual(
308:         parseNoteTriggerContext('Already [[A]] but now [['),
309:         { partial: '', isEmbed: false },
310:       );
311:     });
312:   });
313: 
314:   suite('parseTagTriggerContext', function () {
315:     test('returns null for empty input', function () {
316:       assert.strictEqual(parseTagTriggerContext(''), null);
317:     });
318: 
319:     test('matches a # in mid-line body text', function () {
320:       assert.deepStrictEqual(parseTagTriggerContext('Hello #'), {
321:         partial: '',
322:       });
323:       assert.deepStrictEqual(parseTagTriggerContext('Hello #wo'), {
324:         partial: 'wo',
325:       });
326:     });
327: 
328:     test('captures nested tag partials', function () {
329:       assert.deepStrictEqual(parseTagTriggerContext('See #parent/'), {
330:         partial: 'parent/',
331:       });
332:       assert.deepStrictEqual(parseTagTriggerContext('See #parent/ch'), {
333:         partial: 'parent/ch',
334:       });
335:     });
336: 
337:     test('SUPPRESSES at start of line for ATX heading markers', function () {
338:       assert.strictEqual(parseTagTriggerContext('#'), null);
339:       assert.strictEqual(parseTagTriggerContext('##'), null);
340:       assert.strictEqual(parseTagTriggerContext('###'), null);
341:       assert.strictEqual(parseTagTriggerContext('# '), null);
342:       assert.strictEqual(parseTagTriggerContext('## '), null);
343:     });
344: 
345:     test('MATCHES #tag at line start once non-hash characters follow', function () {
346:       // The heading-marker suppression only fires for "all hashes (and
347:       // an optional space) so far".  As soon as a non-hash character
348:       // arrives (the user is clearly typing a tag, not a heading),
349:       // completion should fire.  Obsidian-style `#my-tag` lines at
350:       // file start (e.g. tag-only lines) need this.
351:       assert.deepStrictEqual(parseTagTriggerContext('#m'), { partial: 'm' });
352:       assert.deepStrictEqual(parseTagTriggerContext('#my'), { partial: 'my' });
353:       assert.deepStrictEqual(parseTagTriggerContext('#my-tag'), {
354:         partial: 'my-tag',
355:       });
356:       assert.deepStrictEqual(parseTagTriggerContext('#parent/child'), {
357:         partial: 'parent/child',
358:       });
359:     });
360: 
361:     test('does NOT match inside an unclosed [[…]] (handled by heading/block ctx)', function () {
362:       assert.strictEqual(parseTagTriggerContext('See [[Note#'), null);
363:       assert.strictEqual(parseTagTriggerContext('See [[Note#se'), null);
364:     });
365: 
366:     test('matches AFTER a closed [[…]] earlier on the line', function () {
367:       assert.deepStrictEqual(parseTagTriggerContext('See [[Other]] now #'), {
368:         partial: '',
369:       });
370:     });
371: 
372:     test('matches `#` after various punctuation delimiters', function () {
373:       assert.deepStrictEqual(parseTagTriggerContext('(#'), { partial: '' });
374:       assert.deepStrictEqual(parseTagTriggerContext('foo,#'), { partial: '' });
375:       assert.deepStrictEqual(parseTagTriggerContext('end. #'), { partial: '' });
376:     });
377: 
378:     test('does NOT match when preceded by a word character (URL fragment-ish)', function () {
379:       assert.strictEqual(parseTagTriggerContext('http://x.com#'), null);
380:       assert.strictEqual(parseTagTriggerContext('foo#'), null);
381:     });
382:   });
383: });
````

## File: test/find-fragment-target-line.test.js
````javascript
  1: /* global suite, test, suiteSetup, suiteTeardown */
  2: 
  3: /**
  4:  * Unit tests for src/find-fragment-target-line.ts.
  5:  *
  6:  * Pure helper, no vscode runtime needed — runs under plain mocha.  We
  7:  * use esbuild (already a dev dep) to compile the TS source on the fly
  8:  * so we don't have to add ts-node or maintain a separate tsconfig just
  9:  * for tests.
 10:  */
 11: 
 12: const assert = require('assert');
 13: const path = require('path');
 14: const fs = require('fs');
 15: const esbuild = require('esbuild');
 16: 
 17: let findFragmentTargetLine;
 18: let tmpFile;
 19: 
 20: suite('findFragmentTargetLine', function () {
 21:   this.timeout(15000);
 22: 
 23:   suiteSetup(async function () {
 24:     const result = await esbuild.build({
 25:       entryPoints: [
 26:         path.join(__dirname, '..', 'src', 'find-fragment-target-line.ts'),
 27:       ],
 28:       bundle: true,
 29:       platform: 'node',
 30:       format: 'cjs',
 31:       target: 'node18',
 32:       write: false,
 33:       logLevel: 'silent',
 34:     });
 35:     tmpFile = path.join(__dirname, '.find-fragment-target-line.bundle.cjs');
 36:     fs.writeFileSync(tmpFile, result.outputFiles[0].text);
 37:     findFragmentTargetLine = require(tmpFile).findFragmentTargetLine;
 38:   });
 39: 
 40:   suiteTeardown(function () {
 41:     if (tmpFile && fs.existsSync(tmpFile)) {
 42:       fs.unlinkSync(tmpFile);
 43:     }
 44:   });
 45: 
 46:   test('returns -1 for an empty fragment', function () {
 47:     assert.strictEqual(
 48:       findFragmentTargetLine('hello\nworld', ''),
 49:       -1,
 50:       'empty fragment should match nothing',
 51:     );
 52:   });
 53: 
 54:   test('finds a paragraph by ^block-id', function () {
 55:     const text = ['# Heading', '', 'First paragraph. ^abc', '', 'Second.'].join(
 56:       '\n',
 57:     );
 58:     assert.strictEqual(findFragmentTargetLine(text, '^abc'), 2);
 59:   });
 60: 
 61:   test('finds the line for a combined Heading^block fragment via the block', function () {
 62:     // The resolver only matches the LAST `^id` in the fragment, which is
 63:     // the right behavior — block IDs are unique per file, so we ignore
 64:     // the heading prefix and jump straight to the block.
 65:     const text = [
 66:       '# Setup',
 67:       'A line.',
 68:       'Pinned line. ^my-block',
 69:       '# Other',
 70:     ].join('\n');
 71:     assert.strictEqual(findFragmentTargetLine(text, 'Setup^my-block'), 2);
 72:   });
 73: 
 74:   test('returns -1 when ^block-id is not present', function () {
 75:     const text = '# Heading\n\nNo block here.';
 76:     assert.strictEqual(findFragmentTargetLine(text, '^missing'), -1);
 77:   });
 78: 
 79:   test('falls through to heading-slug match when fragment has no caret', function () {
 80:     const text = '# Setup\n\nBody.\n\n## Configuration\n\nMore.';
 81:     // HeadingIdGenerator slug for "Setup" is "setup"
 82:     assert.strictEqual(findFragmentTargetLine(text, 'setup'), 0);
 83:     // For "Configuration" → "configuration"
 84:     assert.strictEqual(findFragmentTargetLine(text, 'configuration'), 4);
 85:   });
 86: 
 87:   test('does not falsely match a block-id substring inside a paragraph', function () {
 88:     // The trailing-^id matcher requires whitespace before and end-of-line
 89:     // after, so an inline mention does not count as the block target.
 90:     const text = ['Some prose mentioning ^abc inline.', 'Another. ^abc'].join(
 91:       '\n',
 92:     );
 93:     // The second line ends with " ^abc" — that's the block, line 1
 94:     assert.strictEqual(findFragmentTargetLine(text, '^abc'), 1);
 95:   });
 96: 
 97:   test('handles ^block-id with hyphens and underscores', function () {
 98:     const text = 'Para. ^my-block_123';
 99:     assert.strictEqual(findFragmentTargetLine(text, '^my-block_123'), 0);
100:   });
101: 
102:   test('returns -1 when the fragment matches neither a block nor a heading', function () {
103:     const text = '# Setup\n\nBody.';
104:     assert.strictEqual(findFragmentTargetLine(text, 'NoSuchAnchor'), -1);
105:   });
106: });
````

## File: test/markdown/basics.md
````markdown
 1: Here is some `inline` code!
 2: 
 3: ---
 4: 
 5: spaced code block
 6: 
 7:     var greeting = 'Hello world!';
 8:     console.log(greeting);
 9: 
10: ---
11: 
12: fenced code block
13: 
14: ```
15: var greeting = 'Hello world!';
16: console.log(greeting);
17: ```
18: 
19: ---
20: 
21: fenced plus language `js`
22: 
23: ```js
24: var greeting = 'Hello world!';
25: console.log(greeting);
26: ```
27: 
28: ---
29: 
30: `js .line-numbers`
31: 
32: ```js .line-numbers
33: var greeting = 'Hello world!';
34: console.log(greeting);
35: 
36: var greeting2 = 'Hello world2!';
37: console.log(greeting2);
38: 
39: var greeting3 = 'Hello world3!';
40: console.log(greeting3);
41: 
42: var greeting4 = 'Hello world4!';
43: console.log(greeting4);
44: ```
45: 
46: ---
47: 
48: `js {hide=true}`
49: 
50: ```js {hide=true}
51: this should not be seen
52: ```
53: 
54: ---
55: 
56: `js {cmd=false}`
57: 
58: ```js {cmd=false}
59: var greeting = 'Hello world!';
60: console.log(greeting);
61: ```
62: 
63: ---
64: 
65: `js {literate=false}`
66: 
67: ```js {literate=false}
68: var greeting = 'Hello world!';
69: console.log(greeting);
70: ```
````

## File: test/markdown/code-chunks.md
````markdown
  1: ## Table of contents with TOC {ignore=true}
  2: 
  3: The above header should not appear in TOC
  4: 
  5: [TOC]
  6: 
  7: ## Table of contents with code chunk {ignore=true}
  8: 
  9: The above header should not appear in TOC
 10: 
 11: <!-- @import "[TOC]" {depthFrom:1, depthTo:6, orderedList:true} -->
 12: 
 13: <!-- code_chunk_output -->
 14: 
 15: <!-- /code_chunk_output -->
 16: 
 17: ## Bash
 18: 
 19: `bash {cmd=true}`
 20: 
 21: ```bash {cmd=true}
 22: ls .
 23: ```
 24: 
 25: ---
 26: 
 27: ## JavaScript
 28: 
 29: `js {cmd=node output=html}`
 30: 
 31: ```js {cmd=node output=html}
 32: const date = Date.now();
 33: console.log(date.toString());
 34: ```
 35: 
 36: ---
 37: 
 38: `js {cmd=node output=markdown}`
 39: 
 40: ```js {cmd=node output=markdown}
 41: var greeting = 'Hello _world_';
 42: console.log(greeting);
 43: ```
 44: 
 45: ---
 46: 
 47: `js {cmd=node output=markdown output_first}`
 48: 
 49: ```js {cmd=node output=markdown output_first}
 50: var greeting = 'Hello _world_';
 51: console.log(greeting);
 52: ```
 53: 
 54: ---
 55: 
 56: `js {cmd=node output=none}`
 57: 
 58: ```js {cmd=node output=none}
 59: var greeting = 'Hello world!';
 60: console.log(greeting);
 61: ```
 62: 
 63: ---
 64: 
 65: `js {cmd=node output=txt modify_source}`
 66: 
 67: ```js {cmd=node output=txt modify_source}
 68: var greeting = 'Hello world!';
 69: console.log(greeting);
 70: ```
 71: 
 72: ---
 73: 
 74: `js {cmd=node output=txt modify_source run_on_save}`
 75: 
 76: ```js {cmd=node output=txt modify_source run_on_save}
 77: var greeting = 'Hello world!!!';
 78: console.log(greeting);
 79: ```
 80: 
 81: ---
 82: 
 83: ## Python
 84: 
 85: `gnuplot {cmd=true output="html"}`
 86: 
 87: ```gnuplot {cmd=true output="html"}
 88: set terminal svg
 89: set title "Simple Plots" font ",20"
 90: set key left box
 91: set samples 50
 92: set style data points
 93: 
 94: plot [-10:10] sin(x),atan(x),cos(atan(x))
 95: ```
 96: 
 97: ---
 98: 
 99: `python {cmd=true args=["-v"]}`
100: 
101: ```python {cmd=true args=["-v"]}
102: print("Verbose will be printed first")
103: ```
104: 
105: ---
106: 
107: `python {hide=true}`
108: 
109: ```python {hide=true}
110: print('you can see this output message, but not this code')
111: ```
112: 
113: ---
114: 
115: `python {cmd=true id="izdlk700"}`
116: 
117: ```python {cmd=true id="izdlk700"}
118: x = 1
119: ```
120: 
121: `python {cmd=true id="izdlkdim"}`
122: 
123: ```python {cmd=true id="izdlkdim"}
124: x = 2
125: ```
126: 
127: `python {cmd=true continue="izdlk700" id="izdlkhso"}`
128: 
129: ```python {cmd=true continue="izdlk700" id="izdlkhso"}
130: print(x) # will print 1
131: ```
132: 
133: ---
134: 
135: `js {cmd=node output=text .line-numbers}`
136: 
137: ```js {cmd=node output=text .line-numbers}
138: const date = Date.now();
139: console.log(date.toString());
140: ```
141: 
142: ---
143: 
144: ## LaTeX
145: 
146: `latex {cmd=true}`
147: 
148: ```latex {cmd=true}
149: \documentclass{standalone}
150: \begin{document}
151:    Hello world!
152: \end{document}
153: ```
154: 
155: ---
156: 
157: `latex {cmd latex_zoom=2}`
158: 
159: ```latex {cmd latex_zoom=2}
160: \documentclass{standalone}
161: \begin{document}
162:    Hello world!
163: \end{document}
164: ```
165: 
166: ---
167: 
168: `erd {cmd=true output="html" args=["-i", "$input_file" "-f", "svg"]}`
169: 
170: ```erd {cmd=true output="html" args=["-i", "$input_file" "-f", "svg"]}
171: [Person]
172: *name
173: height
174: weight
175: +birth_location_id
176: 
177: [Location]
178: *id
179: city
180: state
181: country
182: 
183: Person *--1 Location
184: ```
````

## File: test/markdown/data/sp500.csv
````
  1: date,price
  2: Jan 1 2000,1394.46
  3: Feb 1 2000,1366.42
  4: Mar 1 2000,1498.58
  5: Apr 1 2000,1452.43
  6: May 1 2000,1420.6
  7: Jun 1 2000,1454.6
  8: Jul 1 2000,1430.83
  9: Aug 1 2000,1517.68
 10: Sep 1 2000,1436.51
 11: Oct 1 2000,1429.4
 12: Nov 1 2000,1314.95
 13: Dec 1 2000,1320.28
 14: Jan 1 2001,1366.01
 15: Feb 1 2001,1239.94
 16: Mar 1 2001,1160.33
 17: Apr 1 2001,1249.46
 18: May 1 2001,1255.82
 19: Jun 1 2001,1224.38
 20: Jul 1 2001,1211.23
 21: Aug 1 2001,1133.58
 22: Sep 1 2001,1040.94
 23: Oct 1 2001,1059.78
 24: Nov 1 2001,1139.45
 25: Dec 1 2001,1148.08
 26: Jan 1 2002,1130.2
 27: Feb 1 2002,1106.73
 28: Mar 1 2002,1147.39
 29: Apr 1 2002,1076.92
 30: May 1 2002,1067.14
 31: Jun 1 2002,989.82
 32: Jul 1 2002,911.62
 33: Aug 1 2002,916.07
 34: Sep 1 2002,815.28
 35: Oct 1 2002,885.76
 36: Nov 1 2002,936.31
 37: Dec 1 2002,879.82
 38: Jan 1 2003,855.7
 39: Feb 1 2003,841.15
 40: Mar 1 2003,848.18
 41: Apr 1 2003,916.92
 42: May 1 2003,963.59
 43: Jun 1 2003,974.5
 44: Jul 1 2003,990.31
 45: Aug 1 2003,1008.01
 46: Sep 1 2003,995.97
 47: Oct 1 2003,1050.71
 48: Nov 1 2003,1058.2
 49: Dec 1 2003,1111.92
 50: Jan 1 2004,1131.13
 51: Feb 1 2004,1144.94
 52: Mar 1 2004,1126.21
 53: Apr 1 2004,1107.3
 54: May 1 2004,1120.68
 55: Jun 1 2004,1140.84
 56: Jul 1 2004,1101.72
 57: Aug 1 2004,1104.24
 58: Sep 1 2004,1114.58
 59: Oct 1 2004,1130.2
 60: Nov 1 2004,1173.82
 61: Dec 1 2004,1211.92
 62: Jan 1 2005,1181.27
 63: Feb 1 2005,1203.6
 64: Mar 1 2005,1180.59
 65: Apr 1 2005,1156.85
 66: May 1 2005,1191.5
 67: Jun 1 2005,1191.33
 68: Jul 1 2005,1234.18
 69: Aug 1 2005,1220.33
 70: Sep 1 2005,1228.81
 71: Oct 1 2005,1207.01
 72: Nov 1 2005,1249.48
 73: Dec 1 2005,1248.29
 74: Jan 1 2006,1280.08
 75: Feb 1 2006,1280.66
 76: Mar 1 2006,1294.87
 77: Apr 1 2006,1310.61
 78: May 1 2006,1270.09
 79: Jun 1 2006,1270.2
 80: Jul 1 2006,1276.66
 81: Aug 1 2006,1303.82
 82: Sep 1 2006,1335.85
 83: Oct 1 2006,1377.94
 84: Nov 1 2006,1400.63
 85: Dec 1 2006,1418.3
 86: Jan 1 2007,1438.24
 87: Feb 1 2007,1406.82
 88: Mar 1 2007,1420.86
 89: Apr 1 2007,1482.37
 90: May 1 2007,1530.62
 91: Jun 1 2007,1503.35
 92: Jul 1 2007,1455.27
 93: Aug 1 2007,1473.99
 94: Sep 1 2007,1526.75
 95: Oct 1 2007,1549.38
 96: Nov 1 2007,1481.14
 97: Dec 1 2007,1468.36
 98: Jan 1 2008,1378.55
 99: Feb 1 2008,1330.63
100: Mar 1 2008,1322.7
101: Apr 1 2008,1385.59
102: May 1 2008,1400.38
103: Jun 1 2008,1280
104: Jul 1 2008,1267.38
105: Aug 1 2008,1282.83
106: Sep 1 2008,1166.36
107: Oct 1 2008,968.75
108: Nov 1 2008,896.24
109: Dec 1 2008,903.25
110: Jan 1 2009,825.88
111: Feb 1 2009,735.09
112: Mar 1 2009,797.87
113: Apr 1 2009,872.81
114: May 1 2009,919.14
115: Jun 1 2009,919.32
116: Jul 1 2009,987.48
117: Aug 1 2009,1020.62
118: Sep 1 2009,1057.08
119: Oct 1 2009,1036.19
120: Nov 1 2009,1095.63
121: Dec 1 2009,1115.1
122: Jan 1 2010,1073.87
123: Feb 1 2010,1104.49
124: Mar 1 2010,1140.45
````

## File: test/markdown/diagrams.md
````markdown
  1: # Diagrams
  2: 
  3: ## [Mermaid](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=mermaid)
  4: 
  5: `mermaid`
  6: 
  7: ```mermaid
  8: graph TD;
  9:     A-->B;
 10:     A-->C;
 11:     B-->D;
 12:     C-->D;
 13: ```
 14: 
 15: ---
 16: 
 17: `mermaid {code_block=true}`
 18: 
 19: ```mermaid {code_block=true}
 20: graph TD;
 21:     A-->B;
 22:     A-->C;
 23:     B-->D;
 24:     C-->D;
 25: ```
 26: 
 27: ## [PlantUML](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=plantuml)
 28: 
 29: `puml`
 30: 
 31: ```puml
 32: @startuml
 33: Alice -> Bob: Authentication Request
 34: Bob --> Alice: Authentication Response
 35: 
 36: Alice -> Bob: Another authentication Request
 37: Alice <-- Bob: another authentication Response
 38: @enduml
 39: ```
 40: 
 41: ---
 42: 
 43: `puml {align="center"}`
 44: 
 45: ```puml {align="center"}
 46: a->b
 47: ```
 48: 
 49: ---
 50: 
 51: `plantuml`
 52: 
 53: ```plantuml
 54: @startuml
 55: Alice -> Bob: Authentication Request
 56: Bob --> Alice: Authentication Response
 57: 
 58: Alice -> Bob: Another authentication Request
 59: Alice <-- Bob: another authentication Response
 60: @enduml
 61: ```
 62: 
 63: ## [WaveDrom](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=sequence-diagrams)
 64: 
 65: `wavedrom`
 66: 
 67: ```wavedrom
 68: { signal : [
 69:   { name: "clk",  wave: "p......" },
 70:   { name: "bus",  wave: "x.34.5x",   data: "head body tail" },
 71:   { name: "wire", wave: "0.1..0." },
 72: ]}
 73: ```
 74: 
 75: ## [GraphViz](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=graphviz)
 76: 
 77: `viz`
 78: 
 79: ```viz
 80: digraph G {
 81:   A -> B
 82:   B -> C
 83:   B -> D
 84: }
 85: ```
 86: 
 87: ---
 88: 
 89: `dot {engine=circo}`
 90: 
 91: ```dot {engine=circo}
 92: digraph G {
 93:   A -> B
 94:   B -> C
 95:   B -> D
 96: }
 97: ```
 98: 
 99: ## Vega
100: 
101: `vega` + json
102: 
103: ```vega
104: {
105:   "$schema": "https://vega.github.io/schema/vega/v5.json",
106:   "width": 400,
107:   "height": 200,
108:   "padding": 5,
109: 
110:   "data": [
111:     {
112:       "name": "table",
113:       "values": [
114:         {"category": "A", "amount": 28},
115:         {"category": "B", "amount": 55},
116:         {"category": "C", "amount": 43},
117:         {"category": "D", "amount": 91},
118:         {"category": "E", "amount": 81},
119:         {"category": "F", "amount": 53},
120:         {"category": "G", "amount": 19},
121:         {"category": "H", "amount": 87}
122:       ]
123:     }
124:   ],
125: 
126:   "signals": [
127:     {
128:       "name": "tooltip",
129:       "value": {},
130:       "on": [
131:         {"events": "rect:mouseover", "update": "datum"},
132:         {"events": "rect:mouseout",  "update": "{}"}
133:       ]
134:     }
135:   ],
136: 
137:   "scales": [
138:     {
139:       "name": "xscale",
140:       "type": "band",
141:       "domain": {"data": "table", "field": "category"},
142:       "range": "width",
143:       "padding": 0.05,
144:       "round": true
145:     },
146:     {
147:       "name": "yscale",
148:       "domain": {"data": "table", "field": "amount"},
149:       "nice": true,
150:       "range": "height"
151:     }
152:   ],
153: 
154:   "axes": [
155:     { "orient": "bottom", "scale": "xscale" },
156:     { "orient": "left", "scale": "yscale" }
157:   ],
158: 
159:   "marks": [
160:     {
161:       "type": "rect",
162:       "from": {"data":"table"},
163:       "encode": {
164:         "enter": {
165:           "x": {"scale": "xscale", "field": "category"},
166:           "width": {"scale": "xscale", "band": 1},
167:           "y": {"scale": "yscale", "field": "amount"},
168:           "y2": {"scale": "yscale", "value": 0}
169:         },
170:         "update": {
171:           "fill": {"value": "steelblue"}
172:         },
173:         "hover": {
174:           "fill": {"value": "red"}
175:         }
176:       }
177:     },
178:     {
179:       "type": "text",
180:       "encode": {
181:         "enter": {
182:           "align": {"value": "center"},
183:           "baseline": {"value": "bottom"},
184:           "fill": {"value": "#333"}
185:         },
186:         "update": {
187:           "x": {"scale": "xscale", "signal": "tooltip.category", "band": 0.5},
188:           "y": {"scale": "yscale", "signal": "tooltip.amount", "offset": -2},
189:           "text": {"signal": "tooltip.amount"},
190:           "fillOpacity": [
191:             {"test": "datum === tooltip", "value": 0},
192:             {"value": 1}
193:           ]
194:         }
195:       }
196:     }
197:   ]
198: }
199: ```
200: 
201: ## Vega lite
202: 
203: `vega-lite` + json
204: 
205: ```vega-lite
206: {
207:   "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
208:   "description": "A simple bar chart with embedded data.",
209:   "data": {
210:     "values": [
211:       {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
212:       {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
213:       {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
214:     ]
215:   },
216:   "mark": "bar",
217:   "encoding": {
218:     "x": {"field": "a", "type": "ordinal"},
219:     "y": {"field": "b", "type": "quantitative"}
220:   }
221: }
222: ```
223: 
224: ---
225: 
226: `vega-lite` + yaml
227: 
228: ```vega-lite
229: "$schema": https://vega.github.io/schema/vega-lite/v3.json
230: description: A simple bar chart with embedded data.
231: data:
232:   values: [
233:     {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
234:     {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
235:     {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
236:   ]
237: mark: bar
238: encoding:
239:   x:
240:     field: a
241:     type: ordinal
242:   y:
243:     field: b
244:     type: quantitative
245: ```
246: 
247: ---
248: 
249: `vega-lite {hide=false}` + json
250: 
251: ```vega-lite {hide=false}
252: "$schema": https://vega.github.io/schema/vega-lite/v3.json
253: description: A simple bar chart with embedded data.
254: data:
255:   values: [
256:     {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
257:     {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
258:     {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
259:   ]
260: mark: bar
261: encoding:
262:   x:
263:     field: a
264:     type: ordinal
265:   y:
266:     field: b
267:     type: quantitative
268: ```
269: 
270: ---
271: 
272: `vega-lite {cmd=false}`
273: 
274: ```vega-lite {cmd=false}
275: "$schema": https://vega.github.io/schema/vega-lite/v3.json
276: description: A simple bar chart with embedded data.
277: data:
278:   values: [
279:     {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
280:     {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
281:     {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
282:   ]
283: mark: bar
284: encoding:
285:   x:
286:     field: a
287:     type: ordinal
288:   y:
289:     field: b
290:     type: quantitative
291: ```
292: 
293: ---
294: 
295: `vega-lite` + json (geo)
296: 
297: ```vega-lite
298: {
299:   "$schema": "https://vega.github.io/schema/vega-lite/v2.1.json",
300:   "width": 500,
301:   "height": 300,
302:   "data": {
303:     "url": "data/us-10m.json",
304:     "format": {
305:       "type": "topojson",
306:       "feature": "counties"
307:     }
308:   },
309:   "transform": [{
310:     "lookup": "id",
311:     "from": {
312:       "data": {
313:         "url": "data/unemployment.tsv"
314:       },
315:       "key": "id",
316:       "fields": ["rate"]
317:     }
318:   }],
319:   "projection": {
320:     "type": "albersUsa"
321:   },
322:   "mark": "geoshape",
323:   "encoding": {
324:     "color": {
325:       "field": "rate",
326:       "type": "quantitative"
327:     }
328:   }
329: }
330: ```
331: 
332: ---
333: 
334: `vega-embed`
335: 
336: ```vega-lite
337: {
338:   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
339:   "description": "A simple bar chart with embedded data.",
340:   "width": 360,
341:   "data": {
342:     "values": [
343:       {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
344:       {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
345:       {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
346:     ]
347:   },
348:   "mark": "bar",
349:   "encoding": {
350:     "x": {"field": "a", "type": "ordinal"},
351:     "y": {"field": "b", "type": "quantitative"},
352:     "tooltip": {"field": "b", "type": "quantitative"}
353:   }
354: }
355: ```
356: 
357: ## Kroki
358: 
359: `ditaa {kroki=true}`
360: 
361: ```ditaa {kroki=true}
362: +--------+   +-------+    +-------+
363: |        | --+ ditaa +--> |       |
364: |  Text  |   +-------+    |diagram|
365: |Document|   |!magic!|    |       |
366: |     {d}|   |       |    |       |
367: +---+----+   +-------+    +-------+
368:     :                         ^
369:     |       Lots of work      |
370:     +-------------------------+
371: ```
````

## File: test/markdown/file-imports.md
````markdown
 1: # [File imports](https://shd101wyy.github.io/markdown-preview-enhanced/#/file-imports)
 2: 
 3: `@import "file-imports/markdown-logo.jpg"`
 4: @import "file-imports/markdown-logo.jpg"
 5: 
 6: ---
 7: 
 8: `@import "file-imports/markdown-logo.png"`
 9: @import "file-imports/markdown-logo.png"
10: 
11: ---
12: 
13: `@import "file-imports/markdown-logo.png" {width="100px" height="62px" title="my title" alt="my alt"}`
14: @import "file-imports/markdown-logo.png" {width="100px" height="62px" title="my title" alt="my alt"}
15: 
16: ---
17: 
18: `@import "file-imports/diagram.mermaid"`
19: @import "file-imports/diagram.mermaid"
20: 
21: ---
22: 
23: `@import "file-imports/diagram.mermaid" {hide=false}`
24: @import "file-imports/diagram.mermaid" {hide=false}
````

## File: test/markdown/interactive-diagrams.md
````markdown
  1: ## Interactive Vega
  2: 
  3: ---
  4: 
  5: `vega-lite {interactive}` simple
  6: 
  7: ```vega-lite {interactive}
  8: {
  9:   "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
 10:   "description": "A simple bar chart with embedded data.",
 11:   "data": {
 12:     "values": [
 13:       {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
 14:       {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
 15:       {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
 16:     ]
 17:   },
 18:   "selection": {
 19:     "bars": {"type": "single"}
 20:   },
 21:   "mark": "bar",
 22:   "encoding": {
 23:     "x": {"field": "a", "type": "ordinal"},
 24:     "y": {"field": "b", "type": "quantitative"},
 25:     "color": {
 26:       "condition": {
 27:         "selection": "bars",
 28:         "value": "rgb(76, 120, 168)"
 29:       },
 30:       "value": "black"
 31:     }
 32:   }
 33: }
 34: ```
 35: 
 36: `vega-lite {interactive}` yaml
 37: 
 38: ```vega-lite {interactive}
 39: $schema: https://vega.github.io/schema/vega-lite/v3.json
 40: description: A simple bar chart with embedded data.
 41: data:
 42:   values: [
 43:     {"a": "A","b": 28}, {"a": "B","b": 55}, {"a": "C","b": 43},
 44:     {"a": "D","b": 91}, {"a": "E","b": 81}, {"a": "F","b": 53},
 45:     {"a": "G","b": 19}, {"a": "H","b": 87}, {"a": "I","b": 52}
 46:   ]
 47: selection:
 48:   bars:
 49:     type: single
 50: mark: bar
 51: encoding:
 52:   x:
 53:     field: a
 54:     type: ordinal
 55:   y:
 56:     field: b
 57:     type: quantitative
 58:   color:
 59:     condition:
 60:       selection: bars
 61:       value: rgb(76, 120, 168)
 62:     value: black
 63: ```
 64: 
 65: `vega-lite {interactive}` with local data file (`data/sp500.csv`)
 66: 
 67: ```vega-lite {interactive}
 68: {
 69:   "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
 70:   "data": {"url": "data/sp500.csv"},
 71:   "vconcat": [{
 72:     "width": 480,
 73:     "mark": "area",
 74:     "encoding": {
 75:       "x": {
 76:         "field": "date",
 77:         "type": "temporal",
 78:         "scale": {"domain": {"selection": "brush"}},
 79:         "axis": {"title": ""}
 80:       },
 81:       "y": {"field": "price","type": "quantitative"}
 82:     }
 83:   }, {
 84:     "width": 480,
 85:     "height": 60,
 86:     "mark": "area",
 87:     "selection": {
 88:       "brush": {"type": "interval", "encodings": ["x"]}
 89:     },
 90:     "encoding": {
 91:       "x": {
 92:         "field": "date",
 93:         "type": "temporal",
 94:         "axis": {"format": "%Y"}
 95:       },
 96:       "y": {
 97:         "field": "price",
 98:         "type": "quantitative",
 99:         "axis": {"tickCount": 3, "grid": false}
100:       }
101:     }
102:   }]
103: }
104: ```
105: 
106: ---
107: 
108: `vega-lite {interactive hide=false}` with remote data file (`https://vega.github.io/vega-lite/data/sp500.csv`) + don't hide source
109: 
110: ```vega-lite {interactive hide=false}
111: {
112:   "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
113:   "data": {"url": "https://vega.github.io/vega-lite/data/sp500.csv"},
114:   "vconcat": [{
115:     "width": 480,
116:     "mark": "area",
117:     "encoding": {
118:       "x": {
119:         "field": "date",
120:         "type": "temporal",
121:         "scale": {"domain": {"selection": "brush"}},
122:         "axis": {"title": ""}
123:       },
124:       "y": {"field": "price","type": "quantitative"}
125:     }
126:   }, {
127:     "width": 480,
128:     "height": 60,
129:     "mark": "area",
130:     "selection": {
131:       "brush": {"type": "interval", "encodings": ["x"]}
132:     },
133:     "encoding": {
134:       "x": {
135:         "field": "date",
136:         "type": "temporal",
137:         "axis": {"format": "%Y"}
138:       },
139:       "y": {
140:         "field": "price",
141:         "type": "quantitative",
142:         "axis": {"tickCount": 3, "grid": false}
143:       }
144:     }
145:   }]
146: }
147: ```
148: 
149: ---
150: 
151: `vega {interactive}` with remote data file
152: 
153: ```vega {interactive}
154: {
155:   "$schema": "https://vega.github.io/schema/vega/v5.json",
156:   "width": 720,
157:   "height": 480,
158:   "padding": 5,
159: 
160:   "data": [
161:     {
162:       "name": "sp500",
163:       "url": "https://vega.github.io/vega-lite/data/sp500.csv",
164:       "format": {"type": "csv", "parse": {"price": "number", "date": "date"}}
165:     }
166:   ],
167: 
168:   "signals": [
169:     {
170:       "name": "detailDomain"
171:     }
172:   ],
173: 
174:   "marks": [
175:     {
176:       "type": "group",
177:       "name": "detail",
178:       "encode": {
179:         "enter": {
180:           "height": {"value": 390},
181:           "width": {"value": 720}
182:         }
183:       },
184:       "scales": [
185:         {
186:           "name": "xDetail",
187:           "type": "time",
188:           "range": "width",
189:           "domain": {"data": "sp500", "field": "date"},
190:           "domainRaw": {"signal": "detailDomain"}
191:         },
192:         {
193:           "name": "yDetail",
194:           "type": "linear",
195:           "range": [390, 0],
196:           "domain": {"data": "sp500", "field": "price"},
197:           "nice": true, "zero": true
198:         }
199:       ],
200:       "axes": [
201:         {"orient": "bottom", "scale": "xDetail"},
202:         {"orient": "left", "scale": "yDetail"}
203:       ],
204:       "marks": [
205:         {
206:           "type": "group",
207:           "encode": {
208:             "enter": {
209:               "height": {"field": {"group": "height"}},
210:               "width": {"field": {"group": "width"}},
211:               "clip": {"value": true}
212:             }
213:           },
214:           "marks": [
215:             {
216:               "type": "area",
217:               "from": {"data": "sp500"},
218:               "encode": {
219:                 "update": {
220:                   "x": {"scale": "xDetail", "field": "date"},
221:                   "y": {"scale": "yDetail", "field": "price"},
222:                   "y2": {"scale": "yDetail", "value": 0},
223:                   "fill": {"value": "steelblue"}
224:                 }
225:               }
226:             }
227:           ]
228:         }
229:       ]
230:     },
231: 
232:     {
233:       "type": "group",
234:       "name": "overview",
235:       "encode": {
236:         "enter": {
237:           "x": {"value": 0},
238:           "y": {"value": 430},
239:           "height": {"value": 70},
240:           "width": {"value": 720},
241:           "fill": {"value": "transparent"}
242:         }
243:       },
244:       "signals": [
245:         {
246:           "name": "brush", "value": 0,
247:           "on": [
248:             {
249:               "events": "@overview:mousedown",
250:               "update": "[x(), x()]"
251:             },
252:             {
253:               "events": "[@overview:mousedown, window:mouseup] > window:mousemove!",
254:               "update": "[brush[0], clamp(x(), 0, width)]"
255:             },
256:             {
257:               "events": {"signal": "delta"},
258:               "update": "clampRange([anchor[0] + delta, anchor[1] + delta], 0, width)"
259:             }
260:           ]
261:         },
262:         {
263:           "name": "anchor", "value": null,
264:           "on": [{"events": "@brush:mousedown", "update": "slice(brush)"}]
265:         },
266:         {
267:           "name": "xdown", "value": 0,
268:           "on": [{"events": "@brush:mousedown", "update": "x()"}]
269:         },
270:         {
271:           "name": "delta", "value": 0,
272:           "on": [
273:             {
274:               "events": "[@brush:mousedown, window:mouseup] > window:mousemove!",
275:               "update": "x() - xdown"
276:             }
277:           ]
278:         },
279:         {
280:           "name": "detailDomain",
281:           "push": "outer",
282:           "on": [
283:             {
284:               "events": {"signal": "brush"},
285:               "update": "span(brush) ? invert('xOverview', brush) : null"
286:             }
287:           ]
288:         }
289:       ],
290:       "scales": [
291:         {
292:           "name": "xOverview",
293:           "type": "time",
294:           "range": "width",
295:           "domain": {"data": "sp500", "field": "date"}
296:         },
297:         {
298:           "name": "yOverview",
299:           "type": "linear",
300:           "range": [70, 0],
301:           "domain": {"data": "sp500", "field": "price"},
302:           "nice": true, "zero": true
303:         }
304:       ],
305:       "axes": [
306:         {"orient": "bottom", "scale": "xOverview"}
307:       ],
308:       "marks": [
309:         {
310:           "type": "area",
311:           "interactive": false,
312:           "from": {"data": "sp500"},
313:           "encode": {
314:             "update": {
315:               "x": {"scale": "xOverview", "field": "date"},
316:               "y": {"scale": "yOverview", "field": "price"},
317:               "y2": {"scale": "yOverview", "value": 0},
318:               "fill": {"value": "steelblue"}
319:             }
320:           }
321:         },
322:         {
323:           "type": "rect",
324:           "name": "brush",
325:           "encode": {
326:             "enter": {
327:               "y": {"value": 0},
328:               "height": {"value": 70},
329:               "fill": {"value": "#333"},
330:               "fillOpacity": {"value": 0.2}
331:             },
332:             "update": {
333:               "x": {"signal": "brush[0]"},
334:               "x2": {"signal": "brush[1]"}
335:             }
336:           }
337:         },
338:         {
339:           "type": "rect",
340:           "interactive": false,
341:           "encode": {
342:             "enter": {
343:               "y": {"value": 0},
344:               "height": {"value": 70},
345:               "width": {"value": 1},
346:               "fill": {"value": "firebrick"}
347:             },
348:             "update": {
349:               "x": {"signal": "brush[0]"}
350:             }
351:           }
352:         },
353:         {
354:           "type": "rect",
355:           "interactive": false,
356:           "encode": {
357:             "enter": {
358:               "y": {"value": 0},
359:               "height": {"value": 70},
360:               "width": {"value": 1},
361:               "fill": {"value": "firebrick"}
362:             },
363:             "update": {
364:               "x": {"signal": "brush[1]"}
365:             }
366:           }
367:         }
368:       ]
369:     }
370:   ]
371: }
372: ```
````

## File: test/markdown/math.md
````markdown
 1: ## [Math](https://shd101wyy.github.io/markdown-preview-enhanced/#/math)
 2: 
 3: `hello $inline$ math`
 4: hello $inline$ math
 5: 
 6: ---
 7: 
 8: `$$ E = mc^22 $$`
 9: $$ E = mc^22 $$
10: 
11: ---
12: 
13: `math`
14: 
15: ```math
16: E = mc^2
17: ```
18: 
19: ---
20: 
21: `math hide=false`
22: 
23: ```math hide=false
24: E = mc^2
25: ```
26: 
27: ---
28: 
29: `math hide=false output_first`
30: 
31: ```math hide=false output_first
32: E = mc^2
33: ```
34: 
35: ---
36: 
37: `math literate=false`
38: 
39: ```math literate=false
40: E = mc^2
41: ```
````

## File: test/markdown/README.md
````markdown
 1: # Test Markdown
 2: 
 3: - [basics](/test/markdown/basics.md)
 4: - [[code-chunks]]
 5: - [[diagrams]]
 6: - [[file-imports]]
 7: - [[interactive-diagrams]]
 8: - [math](./math.md)
 9: - [[remote-ssh]]
10: - [google](https://google.com)
````

## File: test/markdown/remote-ssh.md
````markdown
 1: # Remote SSH Preview Test
 2: 
 3: This file tests that the markdown preview works correctly when connected
 4: via **Remote SSH** from a Windows client to a Linux host ([#2224](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2224)).
 5: 
 6: ## Steps to reproduce
 7: 
 8: 1. Open this workspace on a **Linux remote** via VS Code Remote SSH from a **Windows** client
 9: 2. Open this file and trigger **Markdown Preview Enhanced: Open Preview to the Side**
10: 3. Verify the preview renders without errors
11: 
12: ## Expected behavior
13: 
14: - The preview renders normally below
15: - No `"notebookPath is not valid"` errors appear in the Extension Host log
16:   (open via **Developer: Show Logs...** → **Extension Host**)
17: 
18: ## What was broken
19: 
20: When VS Code runs on a Windows client connected to a Linux remote, some
21: internal URIs use Windows-style paths (`file:///c%3A/Users/...`). The
22: `vscode-uri` library's `fsPath` strips the leading `/` for drive letters,
23: producing `c:/Users/...` — which `path.isAbsolute()` on Linux returns
24: `false` for. This caused `crossnote`'s `Notebook.init` to reject the
25: path, spamming errors continuously.
26: 
27: ## Basic rendering check
28: 
29: The preview should render the following content correctly:
30: 
31: ### Cross-file links (exercises path resolution)
32: 
33: These links trigger `getWorkspaceFolderUri` to resolve the notebook path.
34: **Test these on a Linux remote via Remote SSH from a Windows client.**
35: 
36: - Relative link: [basics](./basics.md)
37: - Relative link to subfolder: [CSV data](./data/sp500.csv)
38: - Parent-relative link: [README](../markdown/README.md)
39: - Wiki-link: [[basics]]
40: - Wiki-link with heading: [[test#overview]]
41: 
42: ### File import (exercises notebook path + file system)
43: 
44: @import "./basics.md" {line_begin=0, line_end=5}
45: 
46: ### Inline formatting
47: 
48: **Bold**, _italic_, ~~strikethrough~~, `inline code`
49: 
50: ### List
51: 
52: - Item 1
53: - Item 2
54:   - Nested item
55: 
56: ### Code block
57: 
58: ```js
59: function hello() {
60:   console.log('Preview is working!');
61: }
62: ```
63: 
64: ### Math
65: 
66: $E = mc^2$
67: 
68: ### Table
69: 
70: | Feature    | Status     |
71: | ---------- | ---------- |
72: | Preview    | ✅ Working |
73: | Remote SSH | ✅ Fixed   |
74: 
75: ### Image (placeholder)
76: 
77: > If this renders as a blockquote, the preview is working.
78: 
79: ---
80: 
81: _If you can see this rendered preview without errors in the Extension Host log, issue #2224 is fixed._
````

## File: test/markdown/test-lightbox.md
````markdown
 1: # Lightbox Test
 2: 
 3: Click any image to enlarge. Press **Escape** or click the backdrop to close.
 4: 
 5: ## Screenshot (1920×1080)
 6: 
 7: <img src="https://picsum.photos/seed/screenshot/1920/1080" alt="High-res screenshot" width="300">
 8: 
 9: ## Diagram (2400×800)
10: 
11: <img src="https://picsum.photos/seed/diagram/2400/800" alt="Architecture diagram" width="350">
12: 
13: ## UI Mockup (1440×900)
14: 
15: <img src="https://picsum.photos/seed/mockup/1440/900" alt="UI mockup" width="250">
16: 
17: ## Multiple inline images
18: 
19: <img src="https://picsum.photos/seed/partA/800/600" alt="Part A" width="150"> <img src="https://picsum.photos/seed/partB/800/600" alt="Part B" width="150"> <img src="https://picsum.photos/seed/partC/800/600" alt="Part C" width="150">
20: 
21: ## Small image (64×64)
22: 
23: ![Icon](https://picsum.photos/seed/icon/64/64)
24: 
25: Setting: `enableImageLightbox` (default `true`).
````

## File: test/markdown/test.md
````markdown
  1: # Markdown: Syntax
  2: 
  3: - [Overview](#overview)
  4:   - [Philosophy](#philosophy)
  5:   - [Inline HTML](#html)
  6:   - [Automatic Escaping for Special Characters](#autoescape)
  7: - [Block Elements](#block)
  8:   - [Paragraphs and Line Breaks](#p)
  9:   - [Headers](#header)
 10:   - [Blockquotes](#blockquote)
 11:   - [Lists](#list)
 12:   - [Code Blocks](#precode)
 13:   - [Horizontal Rules](#hr)
 14: - [Span Elements](#span)
 15:   - [Links](#link)
 16:   - [Emphasis](#em)
 17:   - [Code](#code)
 18:   - [Images](#img)
 19: - [Miscellaneous](#misc)
 20:   - [Backslash Escapes](#backslash)
 21:   - [Automatic Links](#autolink)
 22: 
 23: **Note:** This document is itself written using Markdown; you
 24: can [see the source for it by adding '.text' to the URL](/projects/markdown/syntax.text).
 25: 
 26: ---
 27: 
 28: ## Overview
 29: 
 30: ### Philosophy
 31: 
 32: Markdown is intended to be as easy-to-read and easy-to-write as is feasible.
 33: 
 34: Readability, however, is emphasized above all else. A Markdown-formatted
 35: document should be publishable as-is, as plain text, without looking
 36: like it's been marked up with tags or formatting instructions. While
 37: Markdown's syntax has been influenced by several existing text-to-HTML
 38: filters -- including [Setext](http://docutils.sourceforge.net/mirror/setext.html), [atx](http://www.aaronsw.com/2002/atx/), [Textile](http://textism.com/tools/textile/), [reStructuredText](http://docutils.sourceforge.net/rst.html),
 39: [Grutatext](http://www.triptico.com/software/grutatxt.html), and [EtText](http://ettext.taint.org/doc/) -- the single biggest source of
 40: inspiration for Markdown's syntax is the format of plain text email.
 41: 
 42: ## Block Elements
 43: 
 44: ### Paragraphs and Line Breaks
 45: 
 46: A paragraph is simply one or more consecutive lines of text, separated
 47: by one or more blank lines. (A blank line is any line that looks like a
 48: blank line -- a line containing nothing but spaces or tabs is considered
 49: blank.) Normal paragraphs should not be indented with spaces or tabs.
 50: 
 51: The implication of the "one or more consecutive lines of text" rule is
 52: that Markdown supports "hard-wrapped" text paragraphs. This differs
 53: significantly from most other text-to-HTML formatters (including Movable
 54: Type's "Convert Line Breaks" option) which translate every line break
 55: character in a paragraph into a `<br />` tag.
 56: 
 57: When you _do_ want to insert a `<br />` break tag using Markdown, you
 58: end a line with two or more spaces, then type return.
 59: 
 60: ### Headers
 61: 
 62: Markdown supports two styles of headers, [Setext][1] and [atx][2].
 63: 
 64: Optionally, you may "close" atx-style headers. This is purely
 65: cosmetic -- you can use this if you think it looks better. The
 66: closing hashes don't even need to match the number of hashes
 67: used to open the header. (The number of opening hashes
 68: determines the header level.)
 69: 
 70: ### Blockquotes
 71: 
 72: Markdown uses email-style `>` characters for blockquoting. If you're
 73: familiar with quoting passages of text in an email message, then you
 74: know how to create a blockquote in Markdown. It looks best if you hard
 75: wrap the text and put a `>` before every line:
 76: 
 77: > This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
 78: > consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
 79: > Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
 80: >
 81: > Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
 82: > id sem consectetuer libero luctus adipiscing.
 83: 
 84: Markdown allows you to be lazy and only put the `>` before the first
 85: line of a hard-wrapped paragraph:
 86: 
 87: > This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
 88: > consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
 89: > Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
 90: 
 91: > Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
 92: > id sem consectetuer libero luctus adipiscing.
 93: 
 94: Blockquotes can be nested (i.e. a blockquote-in-a-blockquote) by
 95: adding additional levels of `>`:
 96: 
 97: > This is the first level of quoting.
 98: >
 99: > > This is nested blockquote.
100: >
101: > Back to the first level.
102: 
103: Blockquotes can contain other Markdown elements, including headers, lists,
104: and code blocks:
105: 
106: > ## This is a header.
107: >
108: > 1.  This is the first list item.
109: > 2.  This is the second list item.
110: >
111: > Here's some example code:
112: >
113: >     return shell_exec("echo $input | $markdown_script");
114: 
115: Any decent text editor should make email-style quoting easy. For
116: example, with BBEdit, you can make a selection and choose Increase
117: Quote Level from the Text menu.
118: 
119: ### Lists
120: 
121: Markdown supports ordered (numbered) and unordered (bulleted) lists.
122: 
123: Unordered lists use asterisks, pluses, and hyphens -- interchangably
124: -- as list markers:
125: 
126: - Red
127: - Green
128: - Blue
129: 
130: is equivalent to:
131: 
132: - Red
133: - Green
134: - Blue
135: 
136: and:
137: 
138: - Red
139: - Green
140: - Blue
141: 
142: Ordered lists use numbers followed by periods:
143: 
144: 1.  Bird
145: 2.  McHale
146: 3.  Parish
147: 
148: It's important to note that the actual numbers you use to mark the
149: list have no effect on the HTML output Markdown produces. The HTML
150: Markdown produces from the above list is:
151: 
152: If you instead wrote the list in Markdown like this:
153: 
154: 1.  Bird
155: 1.  McHale
156: 1.  Parish
157: 
158: or even:
159: 
160: 3. Bird
161: 1. McHale
162: 1. Parish
163: 
164: you'd get the exact same HTML output. The point is, if you want to,
165: you can use ordinal numbers in your ordered Markdown lists, so that
166: the numbers in your source match the numbers in your published HTML.
167: But if you want to be lazy, you don't have to.
168: 
169: To make lists look nice, you can wrap items with hanging indents:
170: 
171: - Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
172:   Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi,
173:   viverra nec, fringilla in, laoreet vitae, risus.
174: - Donec sit amet nisl. Aliquam semper ipsum sit amet velit.
175:   Suspendisse id sem consectetuer libero luctus adipiscing.
176: 
177: But if you want to be lazy, you don't have to:
178: 
179: - Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
180:   Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi,
181:   viverra nec, fringilla in, laoreet vitae, risus.
182: - Donec sit amet nisl. Aliquam semper ipsum sit amet velit.
183:   Suspendisse id sem consectetuer libero luctus adipiscing.
184: 
185: List items may consist of multiple paragraphs. Each subsequent
186: paragraph in a list item must be indented by either 4 spaces
187: or one tab:
188: 
189: 1.  This is a list item with two paragraphs. Lorem ipsum dolor
190:     sit amet, consectetuer adipiscing elit. Aliquam hendrerit
191:     mi posuere lectus.
192: 
193:     Vestibulum enim wisi, viverra nec, fringilla in, laoreet
194:     vitae, risus. Donec sit amet nisl. Aliquam semper ipsum
195:     sit amet velit.
196: 
197: 2.  Suspendisse id sem consectetuer libero luctus adipiscing.
198: 
199: It looks nice if you indent every line of the subsequent
200: paragraphs, but here again, Markdown will allow you to be
201: lazy:
202: 
203: - This is a list item with two paragraphs.
204: 
205:       This is the second paragraph in the list item. You're
206: 
207:   only required to indent the first line. Lorem ipsum dolor
208:   sit amet, consectetuer adipiscing elit.
209: 
210: - Another item in the same list.
211: 
212: To put a blockquote within a list item, the blockquote's `>`
213: delimiters need to be indented:
214: 
215: - A list item with a blockquote:
216: 
217:   > This is a blockquote
218:   > inside a list item.
219: 
220: To put a code block within a list item, the code block needs
221: to be indented _twice_ -- 8 spaces or two tabs:
222: 
223: - A list item with a code block:
224: 
225:       <code goes here>
226: 
227: ### Code Blocks
228: 
229: Pre-formatted code blocks are used for writing about programming or
230: markup source code. Rather than forming normal paragraphs, the lines
231: of a code block are interpreted literally. Markdown wraps a code block
232: in both `<pre>` and `<code>` tags.
233: 
234: To produce a code block in Markdown, simply indent every line of the
235: block by at least 4 spaces or 1 tab.
236: 
237: This is a normal paragraph:
238: 
239:     This is a code block.
240: 
241: Here is an example of AppleScript:
242: 
243:     tell application "Foo"
244:         beep
245:     end tell
246: 
247: A code block continues until it reaches a line that is not indented
248: (or the end of the article).
249: 
250: Within a code block, ampersands (`&`) and angle brackets (`<` and `>`)
251: are automatically converted into HTML entities. This makes it very
252: easy to include example HTML source code using Markdown -- just paste
253: it and indent it, and Markdown will handle the hassle of encoding the
254: ampersands and angle brackets. For example, this:
255: 
256:     <div class="footer">
257:         &copy; 2004 Foo Corporation
258:     </div>
259: 
260: Regular Markdown syntax is not processed within code blocks. E.g.,
261: asterisks are just literal asterisks within a code block. This means
262: it's also easy to use Markdown to write about Markdown's own syntax.
263: 
264: ```
265: tell application "Foo"
266:     beep
267: end tell
268: ```
269: 
270: ## Span Elements
271: 
272: ### Links
273: 
274: Markdown supports two style of links: _inline_ and _reference_.
275: 
276: In both styles, the link text is delimited by [square brackets].
277: 
278: To create an inline link, use a set of regular parentheses immediately
279: after the link text's closing square bracket. Inside the parentheses,
280: put the URL where you want the link to point, along with an _optional_
281: title for the link, surrounded in quotes. For example:
282: 
283: This is [an example](http://example.com/) inline link.
284: 
285: [This link](http://example.net/) has no title attribute.
286: 
287: ### Emphasis
288: 
289: Markdown treats asterisks (`*`) and underscores (`_`) as indicators of
290: emphasis. Text wrapped with one `*` or `_` will be wrapped with an
291: HTML `<em>` tag; double `*`'s or `_`'s will be wrapped with an HTML
292: `<strong>` tag. E.g., this input:
293: 
294: _single asterisks_
295: 
296: _single underscores_
297: 
298: **double asterisks**
299: 
300: **double underscores**
301: 
302: ### Code
303: 
304: To indicate a span of code, wrap it with backtick quotes (`` ` ``).
305: Unlike a pre-formatted code block, a code span indicates code within a
306: normal paragraph. For example:
307: 
308: Use the `printf()` function.
````
