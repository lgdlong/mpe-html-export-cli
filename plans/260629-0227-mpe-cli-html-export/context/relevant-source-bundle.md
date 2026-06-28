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
- Only files matching these patterns are included: package.json, README.md, LICENSE.md, build.js, src/extension-common.ts, src/preview-provider.ts, src/config.ts, src/utils.ts, docs/html.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Line numbers have been added to the beginning of each line

# Directory Structure
```
build.js
LICENSE.md
package.json
README.md
src/config.ts
src/extension-common.ts
src/preview-provider.ts
src/utils.ts
```

# Files

## File: build.js
````javascript
  1: const { execSync } = require('child_process');
  2: const { cpSync, existsSync, mkdirSync, readdirSync } = require('fs');
  3: const { join } = require('path');
  4: const { context, build } = require('esbuild');
  5: const { polyfillNode } = require('esbuild-plugin-polyfill-node');
  6: 
  7: /**
  8:  * @type {import('esbuild').Plugin}
  9:  */
 10: const esbuildProblemMatcherPlugin = {
 11:   name: 'esbuild-problem-matcher',
 12: 
 13:   setup(build) {
 14:     build.onStart(() => {
 15:       console.log('[watch] build started');
 16: 
 17:       // Run `gulp copy:files` before build
 18:       execSync('gulp copy-files');
 19:       console.log('[watch] gulp copy-files');
 20:     });
 21:     build.onEnd((result) => {
 22:       if (result.errors.length) {
 23:         result.errors.forEach((error) =>
 24:           console.error(
 25:             `> ${error.location?.file}:${error.location?.line}:${error.location?.column}: error: ${error.text}`,
 26:           ),
 27:         );
 28:       } else {
 29:         copyTikzjaxTexFiles();
 30:         copyXhrSyncWorker();
 31:         copyMarkdownYoWasm();
 32:         console.log('[watch] build finished');
 33:       }
 34:     });
 35:   },
 36: };
 37: 
 38: /**
 39:  * esbuild plugin to mark jsdom's xhr-sync-worker.js as external.
 40:  * jsdom uses require.resolve('./xhr-sync-worker.js') to locate the sync XHR
 41:  * worker. We copy the file to out/native/ so it resolves correctly at runtime
 42:  * via __dirname. Without this plugin, esbuild warns about the require.resolve
 43:  * call and may inline the wrong absolute path from node_modules.
 44:  */
 45: const xhrSyncWorkerExternalPlugin = {
 46:   name: 'xhr-sync-worker-external',
 47:   /** @param {import('esbuild').PluginBuild} build */
 48:   setup(build) {
 49:     build.onResolve({ filter: /xhr-sync-worker/ }, (args) => ({
 50:       path: args.path,
 51:       external: true,
 52:     }));
 53:   },
 54: };
 55: 
 56: /**
 57:  * @type {import('esbuild').BuildOptions}
 58:  */
 59: const nativeConfig = {
 60:   entryPoints: ['./src/extension.ts'],
 61:   bundle: true,
 62:   minify: true,
 63:   platform: 'node', // For CJS
 64:   outfile: './out/native/extension.js',
 65:   target: 'node16',
 66:   format: 'cjs',
 67:   external: ['vscode'],
 68:   plugins: [xhrSyncWorkerExternalPlugin],
 69: };
 70: 
 71: // FIX:
 72: const defaultDocument = {
 73:   readyState: 'ready',
 74: };
 75: const defaultWindow = {
 76:   document: {
 77:     currentScript: {
 78:       dataset: {},
 79:     },
 80:   },
 81:   location: {
 82:     protocol: 'https:',
 83:   },
 84:   less: {
 85:     onReady: false,
 86:     async: false,
 87:   },
 88: };
 89: 
 90: /**
 91:  * @type {import('esbuild').BuildOptions}
 92:  */
 93: const webConfig = {
 94:   entryPoints: ['./src/extension-web.ts'],
 95:   bundle: true,
 96:   minify: true,
 97:   platform: 'browser', // For ESM
 98:   outfile: './out/web/extension.js',
 99:   target: 'es2020',
100:   format: 'cjs',
101:   // node-tikzjax and Node.js built-ins used in server-side code paths are not
102:   // available/needed in the web extension build.
103:   external: ['vscode', 'node-tikzjax', 'stream/promises', 'stream'],
104:   plugins: [
105:     polyfillNode({
106:       polyfills: {
107:         fs: true,
108:       },
109:       globals: {
110:         // global: true,
111:       },
112:     }),
113:   ],
114:   define: {
115:     // eslint-disable-next-line @typescript-eslint/naming-convention
116:     // window: 'globalThis',
117:     // global: 'globalThis',
118:     // window: "globalThis",
119:     'window': JSON.stringify(defaultWindow),
120:     // document: JSON.stringify(defaultDocument),
121:     'process.env.IS_VSCODE_WEB_EXTENSION': '"true"',
122:   },
123: };
124: 
125: /**
126:  * Copy node-tikzjax WASM/tex data files to out/tex/ so the bundled native
127:  * extension (at out/native/extension.js) can find them via
128:  * path.join(__dirname, '../tex') at runtime.
129:  */
130: function copyTikzjaxTexFiles() {
131:   // node-tikzjax may be hoisted to the top-level node_modules (e.g. when
132:   // crossnote is installed from npm) or nested under crossnote's own
133:   // node_modules (e.g. when installed via `yarn add ../crossnote`).
134:   const candidates = [
135:     join(__dirname, 'node_modules', 'node-tikzjax', 'tex'),
136:     join(
137:       __dirname,
138:       'node_modules',
139:       'crossnote',
140:       'node_modules',
141:       'node-tikzjax',
142:       'tex',
143:     ),
144:   ];
145:   const tikzjaxTexDir = candidates.find(existsSync);
146:   if (!tikzjaxTexDir) {
147:     throw new Error(
148:       `node-tikzjax tex directory not found. Tried:\n${candidates.join('\n')}`,
149:     );
150:   }
151:   const outTexDir = join(__dirname, 'out', 'tex');
152:   mkdirSync(outTexDir, { recursive: true });
153:   cpSync(tikzjaxTexDir, outTexDir, { recursive: true });
154:   console.log('Copied node-tikzjax tex files to out/tex/');
155: }
156: 
157: /**
158:  * Copy jsdom's xhr-sync-worker.js to out/native/ so that the bundled
159:  * extension's require.resolve('./xhr-sync-worker.js') call succeeds.
160:  *
161:  * jsdom resolves this path at module load time to set up sync XHR support.
162:  * node-tikzjax only uses jsdom for DOM manipulation and never triggers sync
163:  * XHR, so the worker is never actually spawned — we just need the file to
164:  * exist at the resolved path.
165:  */
166: function copyXhrSyncWorker() {
167:   // jsdom may be hoisted to the top-level node_modules (npm/yarn install) or
168:   // nested under crossnote's pnpm store (local path install via yarn add ../crossnote).
169:   const candidates = [
170:     join(
171:       __dirname,
172:       'node_modules',
173:       'jsdom',
174:       'lib',
175:       'jsdom',
176:       'living',
177:       'xhr',
178:       'xhr-sync-worker.js',
179:     ),
180:   ];
181: 
182:   // Also search the pnpm store nested under crossnote if present.
183:   const crossnotePnpmDir = join(
184:     __dirname,
185:     'node_modules',
186:     'crossnote',
187:     'node_modules',
188:     '.pnpm',
189:   );
190:   if (existsSync(crossnotePnpmDir)) {
191:     const jsdomDirs = readdirSync(crossnotePnpmDir).filter((d) =>
192:       d.startsWith('jsdom@'),
193:     );
194:     for (const d of jsdomDirs) {
195:       candidates.push(
196:         join(
197:           crossnotePnpmDir,
198:           d,
199:           'node_modules',
200:           'jsdom',
201:           'lib',
202:           'jsdom',
203:           'living',
204:           'xhr',
205:           'xhr-sync-worker.js',
206:         ),
207:       );
208:     }
209:   }
210: 
211:   const workerSrc = candidates.find(existsSync);
212:   if (!workerSrc) {
213:     console.warn('Could not find jsdom xhr-sync-worker.js, skipping copy');
214:     return;
215:   }
216:   const outNativeDir = join(__dirname, 'out', 'native');
217:   mkdirSync(outNativeDir, { recursive: true });
218:   cpSync(workerSrc, join(outNativeDir, 'xhr-sync-worker.js'));
219:   console.log('Copied jsdom xhr-sync-worker.js to out/native/');
220: }
221: 
222: function copyMarkdownYoWasm() {
223:   // markdown_yo may be hoisted to the top-level node_modules (npm/yarn install)
224:   // or nested under crossnote's pnpm store (local path install).
225:   const candidates = [
226:     join(__dirname, 'node_modules', 'markdown_yo', 'markdown_yo_wasm_api.wasm'),
227:   ];
228: 
229:   const crossnotePnpmDir = join(
230:     __dirname,
231:     'node_modules',
232:     'crossnote',
233:     'node_modules',
234:     '.pnpm',
235:   );
236:   if (existsSync(crossnotePnpmDir)) {
237:     const markdownYoDirs = readdirSync(crossnotePnpmDir).filter((d) =>
238:       d.startsWith('markdown_yo@'),
239:     );
240:     for (const d of markdownYoDirs) {
241:       candidates.push(
242:         join(
243:           crossnotePnpmDir,
244:           d,
245:           'node_modules',
246:           'markdown_yo',
247:           'markdown_yo_wasm_api.wasm',
248:         ),
249:       );
250:     }
251:   }
252: 
253:   const wasmSrc = candidates.find(existsSync);
254:   if (!wasmSrc) {
255:     console.warn('Could not find markdown_yo WASM, skipping copy');
256:     return;
257:   }
258:   const outNativeDir = join(__dirname, 'out', 'native');
259:   mkdirSync(outNativeDir, { recursive: true });
260:   cpSync(wasmSrc, join(outNativeDir, 'markdown_yo_wasm_api.wasm'));
261:   console.log('Copied markdown_yo WASM to out/native/');
262: }
263: 
264: async function main() {
265:   try {
266:     // Watch mode
267:     if (process.argv.includes('--watch')) {
268:       // Native
269:       const nativeContext = await context({
270:         ...nativeConfig,
271:         sourcemap: true,
272:         minify: false,
273:         plugins: [esbuildProblemMatcherPlugin, ...(nativeConfig.plugins ?? [])],
274:       });
275: 
276:       // Web
277:       const webContext = await context({
278:         ...webConfig,
279:         sourcemap: true,
280:         minify: false,
281:         define: {
282:           ...(webConfig.define ?? {}),
283:           ...{
284:             'process.env.IS_VSCODE_WEB_EXTENSION_DEV_MODE': '"true"',
285:           },
286:         },
287:         plugins: [esbuildProblemMatcherPlugin, ...(webConfig.plugins ?? [])],
288:       });
289: 
290:       await Promise.all([nativeContext.watch(), webContext.watch()]);
291:     } else if (process.argv.includes('--web-dev')) {
292:       // Single web-only dev build (IS_VSCODE_WEB_EXTENSION_DEV_MODE=true, no watch)
293:       await build({
294:         ...webConfig,
295:         sourcemap: true,
296:         minify: false,
297:         define: {
298:           ...(webConfig.define ?? {}),
299:           'process.env.IS_VSCODE_WEB_EXTENSION_DEV_MODE': '"true"',
300:         },
301:       });
302:       console.log('[web-dev] Web extension built in dev mode');
303:     } else {
304:       // Build mode
305:       await Promise.all([build(nativeConfig), build(webConfig)]);
306:       copyTikzjaxTexFiles();
307:       copyXhrSyncWorker();
308:       copyMarkdownYoWasm();
309:     }
310:   } catch (error) {
311:     console.error(error);
312:   }
313: }
314: 
315: main();
````

## File: LICENSE.md
````markdown
 1: University of Illinois/NCSA  
 2: Open Source License
 3: 
 4: ```
 5: Copyright (c) 2017  Yiyi Wang
 6: All rights reserved.
 7: 
 8: Developed by:     Yiyi Wang and many other contributors
 9:                   https://github.com/shd101wyy/markdown-preview-enhanced
10: ```
11: 
12: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal with the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
13: 
14: Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimers.
15: Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
16: Neither the names of Yiyi Wang, nor the names of its contributors may be used to endorse or promote products derived from this Software without specific prior written permission.
17: THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH THE SOFTWARE.
````

## File: package.json
````json
  1: {
  2:   "name": "markdown-preview-enhanced",
  3:   "displayName": "%displayName%",
  4:   "version": "0.8.30",
  5:   "description": "%description%",
  6:   "categories": [
  7:     "Other"
  8:   ],
  9:   "keywords": [
 10:     "markdown"
 11:   ],
 12:   "bugs": {
 13:     "url": "https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues"
 14:   },
 15:   "repository": "https://github.com/shd101wyy/vscode-markdown-preview-enhanced",
 16:   "license": "NCSA",
 17:   "contributors": [
 18:     "shd101wyy",
 19:     "kachkaev",
 20:     "gabyx",
 21:     "mavaddat"
 22:   ],
 23:   "publisher": "shd101wyy",
 24:   "main": "./out/native/extension.js",
 25:   "browser": "./out/web/extension.js",
 26:   "scripts": {
 27:     "build": "gulp copy-files && gulp clean-out && node build.js",
 28:     "check:all": "yarn check:eslint && yarn check:prettier",
 29:     "check:eslint": "eslint \"**/*\"",
 30:     "check:prettier": "prettier --check \"**/*.*\"",
 31:     "fix:all": "yarn fix:eslint && yarn fix:eslint && yarn fix:prettier",
 32:     "fix:eslint": "eslint --fix \"**/*\"",
 33:     "fix:prettier": "prettier --write \"**/*.*\"",
 34:     "prepare": "husky",
 35:     "run-in-browser": "node build.js --web-dev && concurrently \"vscode-test-web --browser none --extensionDevelopmentPath=. ${SERVE_DIR:-.}\" \"npx http-server ./crossnote -p 6789 --cors\"",
 36:     "run-in-browser:watch": "node build.js --web-dev && concurrently \"vscode-test-web --browser none --extensionDevelopmentPath=. ${SERVE_DIR:-.}\" \"npx http-server ./crossnote -p 6789 --cors\" \"node build.js --watch\"",
 37:     "run-in-vscode-dev": "npx serve --cors -l 5000 --ssl-cert $HOME/certs/localhost.pem --ssl-key $HOME/certs/localhost-key.pem",
 38:     "test": "yarn build && node ./node_modules/vscode/bin/test",
 39:     "test:unit": "mocha --ui tdd --reporter spec test/find-fragment-target-line.test.js test/block-id-helpers.test.js test/rank-by-closeness.test.js",
 40:     "vscode:prepublish": "yarn install && yarn build",
 41:     "watch": "gulp copy-files && gulp clean-out && node build.js --watch"
 42:   },
 43:   "contributes": {
 44:     "commands": [
 45:       {
 46:         "command": "markdown-preview-enhanced.openGraphView",
 47:         "title": "%markdown-preview-enhanced.openGraphView.title%",
 48:         "icon": "$(type-hierarchy)"
 49:       },
 50:       {
 51:         "command": "markdown-preview-enhanced.openPreviewToTheSide",
 52:         "title": "%markdown-preview-enhanced.openPreviewToTheSide.title%",
 53:         "category": "Markdown",
 54:         "icon": {
 55:           "light": "./media/preview-right-light.svg",
 56:           "dark": "./media/preview-right-dark.svg"
 57:         }
 58:       },
 59:       {
 60:         "command": "markdown-preview-enhanced.openPreview",
 61:         "title": "%markdown-preview-enhanced.openPreview.title%",
 62:         "category": "Markdown",
 63:         "icon": {
 64:           "light": "./media/preview-right-light.svg",
 65:           "dark": "./media/preview-right-dark.svg"
 66:         }
 67:       },
 68:       {
 69:         "command": "markdown-preview-enhanced.openLockedPreviewToTheSide",
 70:         "title": "%markdown-preview-enhanced.openLockedPreviewToTheSide.title%",
 71:         "category": "Markdown"
 72:       },
 73:       {
 74:         "command": "markdown-preview-enhanced.togglePreviewLock",
 75:         "title": "%markdown-preview-enhanced.togglePreviewLock.title%",
 76:         "category": "Markdown"
 77:       },
 78:       {
 79:         "command": "markdown-preview-enhanced.copyBlockReference",
 80:         "title": "%markdown-preview-enhanced.copyBlockReference.title%",
 81:         "category": "Markdown"
 82:       },
 83:       {
 84:         "command": "markdown-preview-enhanced.toggleScrollSync",
 85:         "title": "%markdown-preview-enhanced.toggleScrollSync.title%"
 86:       },
 87:       {
 88:         "command": "markdown-preview-enhanced.toggleLiveUpdate",
 89:         "title": "%markdown-preview-enhanced.toggleLiveUpdate.title%"
 90:       },
 91:       {
 92:         "command": "markdown-preview-enhanced.toggleBreakOnSingleNewLine",
 93:         "title": "%markdown-preview-enhanced.toggleBreakOnSingleNewLine.title%"
 94:       },
 95:       {
 96:         "command": "markdown-preview-enhanced.openImageHelper",
 97:         "title": "%markdown-preview-enhanced.openImageHelper.title%"
 98:       },
 99:       {
100:         "command": "markdown-preview-enhanced.runAllCodeChunks",
101:         "title": "%markdown-preview-enhanced.runAllCodeChunks.title%"
102:       },
103:       {
104:         "command": "markdown-preview-enhanced.runCodeChunk",
105:         "title": "%markdown-preview-enhanced.runCodeChunk.title%"
106:       },
107:       {
108:         "command": "markdown-preview-enhanced.syncPreview",
109:         "title": "%markdown-preview-enhanced.syncPreview.title%"
110:       },
111:       {
112:         "command": "markdown-preview-enhanced.customizeCss",
113:         "title": "%markdown-preview-enhanced.customizeCss.title%",
114:         "enablement": "!isWeb"
115:       },
116:       {
117:         "command": "markdown-preview-enhanced.customizeCssInWorkspace",
118:         "title": "%markdown-preview-enhanced.customizeCssInWorkspace.title%"
119:       },
120:       {
121:         "command": "markdown-preview-enhanced.insertNewSlide",
122:         "title": "%markdown-preview-enhanced.insertNewSlide.title%"
123:       },
124:       {
125:         "command": "markdown-preview-enhanced.insertTable",
126:         "title": "%markdown-preview-enhanced.insertTable.title%"
127:       },
128:       {
129:         "command": "markdown-preview-enhanced.insertPagebreak",
130:         "title": "%markdown-preview-enhanced.insertPagebreak.title%"
131:       },
132:       {
133:         "command": "markdown-preview-enhanced.createTOC",
134:         "title": "%markdown-preview-enhanced.createTOC.title%",
135:         "enablement": "!isWeb"
136:       },
137:       {
138:         "command": "markdown-preview-enhanced.openConfigScript",
139:         "title": "%markdown-preview-enhanced.openConfigScript.title%",
140:         "enablement": "!isWeb"
141:       },
142:       {
143:         "command": "markdown-preview-enhanced.extendParser",
144:         "title": "%markdown-preview-enhanced.extendParser.title%",
145:         "enablement": "!isWeb"
146:       },
147:       {
148:         "command": "markdown-preview-enhanced.customizePreviewHtmlHead",
149:         "title": "%markdown-preview-enhanced.customizePreviewHtmlHead.title%",
150:         "enablement": "!isWeb"
151:       },
152:       {
153:         "command": "markdown-preview-enhanced.openConfigScriptInWorkspace",
154:         "title": "%markdown-preview-enhanced.openConfigScriptInWorkspace.title%"
155:       },
156:       {
157:         "command": "markdown-preview-enhanced.extendParserInWorkspace",
158:         "title": "%markdown-preview-enhanced.extendParserInWorkspace.title%"
159:       },
160:       {
161:         "command": "markdown-preview-enhanced.customizePreviewHtmlHeadInWorkspace",
162:         "title": "%markdown-preview-enhanced.customizePreviewHtmlHeadInWorkspace.title%"
163:       },
164:       {
165:         "command": "markdown-preview-enhanced.showUploadedImages",
166:         "title": "%markdown-preview-enhanced.showUploadedImages.title%",
167:         "enablement": "!isWeb"
168:       }
169:     ],
170:     "configuration": {
171:       "type": "object",
172:       "title": "Markdown Preview Enhanced",
173:       "properties": {
174:         "markdown-preview-enhanced.configPath": {
175:           "markdownDescription": "%markdown-preview-enhanced.configPath.markdownDescription%",
176:           "default": "",
177:           "type": "string"
178:         },
179:         "markdown-preview-enhanced.markdownParser": {
180:           "description": "%markdown-preview-enhanced.markdownParser.description%",
181:           "default": "markdown-it",
182:           "type": "string",
183:           "enum": [
184:             "markdown-it",
185:             "pandoc",
186:             "markdown_yo"
187:           ],
188:           "enumDescriptions": [
189:             "%markdown-preview-enhanced.markdownParser.enumDescriptions.0%",
190:             "%markdown-preview-enhanced.markdownParser.enumDescriptions.1%",
191:             "%markdown-preview-enhanced.markdownParser.enumDescriptions.2%"
192:           ]
193:         },
194:         "markdown-preview-enhanced.breakOnSingleNewLine": {
195:           "description": "%markdown-preview-enhanced.breakOnSingleNewLine.description%",
196:           "default": true,
197:           "type": "boolean"
198:         },
199:         "markdown-preview-enhanced.scrollSync": {
200:           "description": "%markdown-preview-enhanced.scrollSync.description%",
201:           "default": true,
202:           "type": "boolean"
203:         },
204:         "markdown-preview-enhanced.liveUpdate": {
205:           "description": "%markdown-preview-enhanced.liveUpdate.description%",
206:           "default": true,
207:           "type": "boolean"
208:         },
209:         "markdown-preview-enhanced.liveUpdateDebounceMs": {
210:           "description": "%markdown-preview-enhanced.liveUpdateDebounceMs.description%",
211:           "default": 300,
212:           "type": "number",
213:           "minimum": 0,
214:           "maximum": 5000
215:         },
216:         "markdown-preview-enhanced.previewMode": {
217:           "markdownDescription": "%markdown-preview-enhanced.previewMode.markdownDescription%",
218:           "type": "string",
219:           "enum": [
220:             "Single Preview",
221:             "Multiple Previews",
222:             "Previews Only"
223:           ],
224:           "default": "Single Preview"
225:         },
226:         "markdown-preview-enhanced.automaticallyShowPreviewOfMarkdownBeingEdited": {
227:           "description": "%markdown-preview-enhanced.automaticallyShowPreviewOfMarkdownBeingEdited.description%",
228:           "default": false,
229:           "type": "boolean"
230:         },
231:         "markdown-preview-enhanced.disableAutoPreviewForUriSchemes": {
232:           "markdownDescription": "%markdown-preview-enhanced.disableAutoPreviewForUriSchemes.markdownDescription%",
233:           "default": [
234:             "vscode-notebook-cell"
235:           ],
236:           "type": "array",
237:           "items": {
238:             "type": "string"
239:           }
240:         },
241:         "markdown-preview-enhanced.disableAutoPreviewForFilePatterns": {
242:           "markdownDescription": "%markdown-preview-enhanced.disableAutoPreviewForFilePatterns.markdownDescription%",
243:           "default": [],
244:           "type": "array",
245:           "items": {
246:             "type": "string"
247:           }
248:         },
249:         "markdown-preview-enhanced.previewColorScheme": {
250:           "type": "string",
251:           "enum": [
252:             "selectedPreviewTheme",
253:             "systemColorScheme",
254:             "editorColorScheme"
255:           ],
256:           "default": "selectedPreviewTheme",
257:           "markdownEnumDescriptions": [
258:             "%markdown-preview-enhanced.previewColorScheme.markdownEnumDescriptions.0%",
259:             "%markdown-preview-enhanced.previewColorScheme.markdownEnumDescriptions.1%",
260:             "%markdown-preview-enhanced.previewColorScheme.markdownEnumDescriptions.2%"
261:           ]
262:         },
263:         "markdown-preview-enhanced.enableTypographer": {
264:           "description": "%markdown-preview-enhanced.enableTypographer.description%",
265:           "default": false,
266:           "type": "boolean"
267:         },
268:         "markdown-preview-enhanced.mathRenderingOption": {
269:           "description": "%markdown-preview-enhanced.mathRenderingOption.description%",
270:           "default": "KaTeX",
271:           "type": "string",
272:           "enum": [
273:             "KaTeX",
274:             "MathJax",
275:             "None"
276:           ]
277:         },
278:         "markdown-preview-enhanced.mathInlineDelimiters": {
279:           "description": "%markdown-preview-enhanced.mathInlineDelimiters.description%",
280:           "default": [
281:             [
282:               "$",
283:               "$"
284:             ],
285:             [
286:               "\\(",
287:               "\\)"
288:             ]
289:           ],
290:           "type": "array"
291:         },
292:         "markdown-preview-enhanced.mathBlockDelimiters": {
293:           "description": "%markdown-preview-enhanced.mathBlockDelimiters.description%",
294:           "default": [
295:             [
296:               "$$",
297:               "$$"
298:             ],
299:             [
300:               "\\[",
301:               "\\]"
302:             ]
303:           ],
304:           "type": "array"
305:         },
306:         "markdown-preview-enhanced.mathRenderingOnlineService": {
307:           "description": "%markdown-preview-enhanced.mathRenderingOnlineService.description%",
308:           "default": "https://latex.codecogs.com/gif.latex",
309:           "type": "string",
310:           "enum": [
311:             "https://latex.codecogs.com/gif.latex",
312:             "https://latex.codecogs.com/svg.latex",
313:             "https://latex.codecogs.com/png.latex"
314:           ]
315:         },
316:         "markdown-preview-enhanced.mathjaxScriptSrc": {
317:           "description": "%markdown-preview-enhanced.mathjaxScriptSrc.description%",
318:           "default": "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js",
319:           "type": "string"
320:         },
321:         "markdown-preview-enhanced.mathjaxV3ScriptSrc": {
322:           "markdownDeprecationMessage": "This setting has been renamed to `#markdown-preview-enhanced.mathjaxScriptSrc#` and the default now loads MathJax v4. Please move your value to the new setting.",
323:           "deprecationMessage": "This setting has been renamed to markdown-preview-enhanced.mathjaxScriptSrc and the default now loads MathJax v4. Please move your value to the new setting.",
324:           "type": "string"
325:         },
326:         "markdown-preview-enhanced.enableWikiLinkSyntax": {
327:           "description": "%markdown-preview-enhanced.enableWikiLinkSyntax.description%",
328:           "default": true,
329:           "type": "boolean"
330:         },
331:         "markdown-preview-enhanced.enableLinkify": {
332:           "description": "%markdown-preview-enhanced.enableLinkify.description%",
333:           "default": true,
334:           "type": "boolean"
335:         },
336:         "markdown-preview-enhanced.useGitHubStylePipedLink": {
337:           "description": "%markdown-preview-enhanced.useGitHubStylePipedLink.description%",
338:           "default": false,
339:           "type": "boolean"
340:         },
341:         "markdown-preview-enhanced.enableEmojiSyntax": {
342:           "description": "%markdown-preview-enhanced.enableEmojiSyntax.description%",
343:           "default": true,
344:           "type": "boolean"
345:         },
346:         "markdown-preview-enhanced.enableExtendedTableSyntax": {
347:           "description": "%markdown-preview-enhanced.enableExtendedTableSyntax.description%",
348:           "default": false,
349:           "type": "boolean"
350:         },
351:         "markdown-preview-enhanced.enableCriticMarkupSyntax": {
352:           "description": "%markdown-preview-enhanced.enableCriticMarkupSyntax.description%",
353:           "default": false,
354:           "type": "boolean"
355:         },
356:         "markdown-preview-enhanced.enableTagSyntax": {
357:           "description": "%markdown-preview-enhanced.enableTagSyntax.description%",
358:           "default": true,
359:           "type": "boolean"
360:         },
361:         "markdown-preview-enhanced.maxNoteFileSize": {
362:           "markdownDescription": "%markdown-preview-enhanced.maxNoteFileSize.markdownDescription%",
363:           "default": 5242880,
364:           "type": "number",
365:           "minimum": 0
366:         },
367:         "markdown-preview-enhanced.wikiLinkTargetFileExtension": {
368:           "markdownDescription": "%markdown-preview-enhanced.wikiLinkTargetFileExtension.markdownDescription%",
369:           "default": ".md",
370:           "type": "string"
371:         },
372:         "markdown-preview-enhanced.wikiLinkResolution": {
373:           "markdownDescription": "%markdown-preview-enhanced.wikiLinkResolution.markdownDescription%",
374:           "default": "relative",
375:           "type": "string",
376:           "enum": [
377:             "relative",
378:             "shortest",
379:             "absolute"
380:           ],
381:           "enumDescriptions": [
382:             "%markdown-preview-enhanced.wikiLinkResolution.enumDescriptions.0%",
383:             "%markdown-preview-enhanced.wikiLinkResolution.enumDescriptions.1%",
384:             "%markdown-preview-enhanced.wikiLinkResolution.enumDescriptions.2%"
385:           ]
386:         },
387:         "markdown-preview-enhanced.wikiLinkTargetFileNameChangeCase": {
388:           "markdownDescription": "%markdown-preview-enhanced.wikiLinkTargetFileNameChangeCase.markdownDescription%",
389:           "default": "none",
390:           "type": "string",
391:           "enum": [
392:             "none",
393:             "camelCase",
394:             "pascalCase",
395:             "kebabCase",
396:             "snakeCase",
397:             "constantCase",
398:             "trainCase",
399:             "adaCase",
400:             "cobolCase",
401:             "dotNotation",
402:             "pathCase",
403:             "spaceCase",
404:             "capitalCase",
405:             "lowerCase",
406:             "upperCase"
407:           ]
408:         },
409:         "markdown-preview-enhanced.frontMatterRenderingOption": {
410:           "description": "%markdown-preview-enhanced.frontMatterRenderingOption.description%",
411:           "type": "string",
412:           "enum": [
413:             "none",
414:             "table",
415:             "code block"
416:           ],
417:           "default": "none"
418:         },
419:         "markdown-preview-enhanced.mermaidTheme": {
420:           "description": "%markdown-preview-enhanced.mermaidTheme.description%",
421:           "default": "default",
422:           "type": "string",
423:           "enum": [
424:             "default",
425:             "dark",
426:             "forest"
427:           ]
428:         },
429:         "markdown-preview-enhanced.codeBlockTheme": {
430:           "description": "%markdown-preview-enhanced.codeBlockTheme.description%",
431:           "default": "auto.css",
432:           "type": "string",
433:           "enum": [
434:             "auto.css",
435:             "default.css",
436:             "atom-dark.css",
437:             "atom-light.css",
438:             "atom-material.css",
439:             "coy.css",
440:             "darcula.css",
441:             "dark.css",
442:             "funky.css",
443:             "github.css",
444:             "github-dark.css",
445:             "hopscotch.css",
446:             "monokai.css",
447:             "okaidia.css",
448:             "one-dark.css",
449:             "one-light.css",
450:             "pen-paper-coffee.css",
451:             "pojoaque.css",
452:             "solarized-dark.css",
453:             "solarized-light.css",
454:             "twilight.css",
455:             "vscode.css",
456:             "vs.css",
457:             "vue.css",
458:             "xonokai.css"
459:           ]
460:         },
461:         "markdown-preview-enhanced.previewTheme": {
462:           "description": "%markdown-preview-enhanced.previewTheme.description%",
463:           "default": "github-light.css",
464:           "type": "string",
465:           "enum": [
466:             "atom-dark.css",
467:             "atom-light.css",
468:             "atom-material.css",
469:             "github-dark.css",
470:             "github-light.css",
471:             "gothic.css",
472:             "medium.css",
473:             "monokai.css",
474:             "newsprint.css",
475:             "night.css",
476:             "none.css",
477:             "one-dark.css",
478:             "one-light.css",
479:             "solarized-dark.css",
480:             "solarized-light.css",
481:             "vscode.css",
482:             "vue.css"
483:           ],
484:           "markdownEnumDescriptions": [
485:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.0%",
486:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.1%",
487:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.2%",
488:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.3%",
489:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.4%",
490:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.5%",
491:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.6%",
492:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.7%",
493:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.8%",
494:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.9%",
495:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.10%",
496:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.11%",
497:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.12%",
498:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.13%",
499:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.14%",
500:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.15%",
501:             "%markdown-preview-enhanced.previewTheme.markdownEnumDescriptions.16%"
502:           ]
503:         },
504:         "markdown-preview-enhanced.revealjsTheme": {
505:           "description": "%markdown-preview-enhanced.revealjsTheme.description%",
506:           "default": "white.css",
507:           "type": "string",
508:           "enum": [
509:             "beige.css",
510:             "black.css",
511:             "blood.css",
512:             "league.css",
513:             "moon.css",
514:             "night.css",
515:             "serif.css",
516:             "simple.css",
517:             "sky.css",
518:             "solarized.css",
519:             "vscode.css",
520:             "white.css",
521:             "none.css"
522:           ]
523:         },
524:         "markdown-preview-enhanced.protocolsWhiteList": {
525:           "description": "%markdown-preview-enhanced.protocolsWhiteList.description%",
526:           "default": "http://, https://, atom://, file://, mailto:, tel:",
527:           "type": "string"
528:         },
529:         "markdown-preview-enhanced.imageFolderPath": {
530:           "description": "%markdown-preview-enhanced.imageFolderPath.description%",
531:           "default": "/assets",
532:           "type": "string"
533:         },
534:         "markdown-preview-enhanced.imageUploader": {
535:           "description": "%markdown-preview-enhanced.imageUploader.description%",
536:           "default": "imgur",
537:           "type": "string",
538:           "enum": [
539:             "imgur",
540:             "sm.ms",
541:             "qiniu"
542:           ]
543:         },
544:         "markdown-preview-enhanced.qiniuAccessKey": {
545:           "type": "string",
546:           "default": "",
547:           "description": "%markdown-preview-enhanced.qiniuAccessKey.description%"
548:         },
549:         "markdown-preview-enhanced.qiniuSecretKey": {
550:           "type": "string",
551:           "default": "",
552:           "description": "%markdown-preview-enhanced.qiniuSecretKey.description%"
553:         },
554:         "markdown-preview-enhanced.qiniuBucket": {
555:           "type": "string",
556:           "default": "",
557:           "description": "%markdown-preview-enhanced.qiniuBucket.description%"
558:         },
559:         "markdown-preview-enhanced.qiniuDomain": {
560:           "type": "string",
561:           "default": "http://",
562:           "description": "%markdown-preview-enhanced.qiniuDomain.description%"
563:         },
564:         "markdown-preview-enhanced.printBackground": {
565:           "description": "%markdown-preview-enhanced.printBackground.description%",
566:           "default": false,
567:           "type": "boolean"
568:         },
569:         "markdown-preview-enhanced.chromePath": {
570:           "description": "%markdown-preview-enhanced.chromePath.description%",
571:           "default": "",
572:           "type": "string",
573:           "scope": "machine"
574:         },
575:         "markdown-preview-enhanced.imageMagickPath": {
576:           "description": "%markdown-preview-enhanced.imageMagickPath.description%",
577:           "default": "",
578:           "type": "string",
579:           "scope": "machine"
580:         },
581:         "markdown-preview-enhanced.pandocPath": {
582:           "description": "%markdown-preview-enhanced.pandocPath.description%",
583:           "default": "pandoc",
584:           "type": "string",
585:           "scope": "machine"
586:         },
587:         "markdown-preview-enhanced.markdownYoBinaryPath": {
588:           "description": "%markdown-preview-enhanced.markdownYoBinaryPath.description%",
589:           "default": "",
590:           "type": "string",
591:           "scope": "machine"
592:         },
593:         "markdown-preview-enhanced.pandocMarkdownFlavor": {
594:           "description": "%markdown-preview-enhanced.pandocMarkdownFlavor.description%",
595:           "default": "markdown-raw_tex+tex_math_single_backslash",
596:           "type": "string"
597:         },
598:         "markdown-preview-enhanced.pandocArguments": {
599:           "description": "%markdown-preview-enhanced.pandocArguments.description%",
600:           "default": [],
601:           "type": "array"
602:         },
603:         "markdown-preview-enhanced.latexEngine": {
604:           "description": "%markdown-preview-enhanced.latexEngine.description%",
605:           "default": "pdflatex",
606:           "type": "string"
607:         },
608:         "markdown-preview-enhanced.enableScriptExecution": {
609:           "description": "%markdown-preview-enhanced.enableScriptExecution.description%",
610:           "default": false,
611:           "type": "boolean"
612:         },
613:         "markdown-preview-enhanced.enableHTML5Embed": {
614:           "description": "%markdown-preview-enhanced.enableHTML5Embed.description%",
615:           "default": false,
616:           "type": "boolean"
617:         },
618:         "markdown-preview-enhanced.HTML5EmbedUseImageSyntax": {
619:           "description": "%markdown-preview-enhanced.HTML5EmbedUseImageSyntax.description%",
620:           "default": true,
621:           "type": "boolean"
622:         },
623:         "markdown-preview-enhanced.HTML5EmbedUseLinkSyntax": {
624:           "description": "%markdown-preview-enhanced.HTML5EmbedUseLinkSyntax.description%",
625:           "default": false,
626:           "type": "boolean"
627:         },
628:         "markdown-preview-enhanced.HTML5EmbedIsAllowedHttp": {
629:           "description": "%markdown-preview-enhanced.HTML5EmbedIsAllowedHttp.description%",
630:           "default": false,
631:           "type": "boolean"
632:         },
633:         "markdown-preview-enhanced.HTML5EmbedAudioAttributes": {
634:           "description": "%markdown-preview-enhanced.HTML5EmbedAudioAttributes.description%",
635:           "default": "controls preload=\"metadata\" width=\"320\"",
636:           "type": "string"
637:         },
638:         "markdown-preview-enhanced.HTML5EmbedVideoAttributes": {
639:           "description": "%markdown-preview-enhanced.HTML5EmbedVideoAttributes.description%",
640:           "default": "controls preload=\"metadata\" width=\"320\" height=\"240\"",
641:           "type": "string"
642:         },
643:         "markdown-preview-enhanced.puppeteerWaitForTimeout": {
644:           "description": "%markdown-preview-enhanced.puppeteerWaitForTimeout.description%",
645:           "default": 0,
646:           "type": "number"
647:         },
648:         "markdown-preview-enhanced.puppeteerArgs": {
649:           "description": "%markdown-preview-enhanced.puppeteerArgs.description%",
650:           "default": [],
651:           "type": "array"
652:         },
653:         "markdown-preview-enhanced.plantumlServer": {
654:           "description": "%markdown-preview-enhanced.plantumlServer.description%",
655:           "default": "",
656:           "type": "string"
657:         },
658:         "markdown-preview-enhanced.hideDefaultVSCodeMarkdownPreviewButtons": {
659:           "description": "%markdown-preview-enhanced.hideDefaultVSCodeMarkdownPreviewButtons.description%",
660:           "default": true,
661:           "type": "boolean"
662:         },
663:         "markdown-preview-enhanced.jsdelivrCdnHost": {
664:           "markdownDescription": "%markdown-preview-enhanced.jsdelivrCdnHost.markdownDescription%",
665:           "default": "cdn.jsdelivr.net",
666:           "type": "string"
667:         },
668:         "markdown-preview-enhanced.plantumlJarPath": {
669:           "description": "%markdown-preview-enhanced.plantumlJarPath.description%",
670:           "default": "",
671:           "type": "string"
672:         },
673:         "markdown-preview-enhanced.krokiServer": {
674:           "description": "%markdown-preview-enhanced.krokiServer.description%",
675:           "default": "https://kroki.io",
676:           "type": "string"
677:         },
678:         "markdown-preview-enhanced.webSequenceDiagramsServer": {
679:           "description": "%markdown-preview-enhanced.webSequenceDiagramsServer.description%",
680:           "default": "https://www.websequencediagrams.com",
681:           "type": "string"
682:         },
683:         "markdown-preview-enhanced.webSequenceDiagramsApiKey": {
684:           "description": "%markdown-preview-enhanced.webSequenceDiagramsApiKey.description%",
685:           "default": "",
686:           "type": "string"
687:         },
688:         "markdown-preview-enhanced.d2Path": {
689:           "description": "%markdown-preview-enhanced.d2Path.description%",
690:           "default": "d2",
691:           "type": "string",
692:           "scope": "machine"
693:         },
694:         "markdown-preview-enhanced.d2Layout": {
695:           "description": "%markdown-preview-enhanced.d2Layout.description%",
696:           "default": "dagre",
697:           "type": "string",
698:           "enum": [
699:             "dagre",
700:             "elk",
701:             "tala"
702:           ]
703:         },
704:         "markdown-preview-enhanced.d2Theme": {
705:           "description": "%markdown-preview-enhanced.d2Theme.description%",
706:           "default": 0,
707:           "type": "number",
708:           "enum": [
709:             0,
710:             1,
711:             3,
712:             4,
713:             5,
714:             6,
715:             7,
716:             8,
717:             100,
718:             101,
719:             102,
720:             103,
721:             104,
722:             105,
723:             200,
724:             201,
725:             300,
726:             301,
727:             302,
728:             303
729:           ],
730:           "enumItemLabels": [
731:             "Neutral Default",
732:             "Neutral Grey",
733:             "Flagship Terrastruct",
734:             "Cool Classics",
735:             "Mixed Berry Blue",
736:             "Grape Soda",
737:             "Aubergine",
738:             "Colorblind Clear",
739:             "Vanilla Nitro Cola",
740:             "Orange Creamsicle",
741:             "Shirley Temple",
742:             "Earth Tones",
743:             "Everglade Green",
744:             "Buttered Toast",
745:             "Dark Mauve",
746:             "Dark Flagship Terrastruct",
747:             "Terminal",
748:             "Terminal Grayscale",
749:             "Origami",
750:             "C4"
751:           ]
752:         },
753:         "markdown-preview-enhanced.d2Sketch": {
754:           "description": "%markdown-preview-enhanced.d2Sketch.description%",
755:           "default": false,
756:           "type": "boolean"
757:         },
758:         "markdown-preview-enhanced.markdownFileExtensions": {
759:           "description": "%markdown-preview-enhanced.markdownFileExtensions.description%",
760:           "default": [
761:             ".md",
762:             ".markdown",
763:             ".mdown",
764:             ".mkdn",
765:             ".mkd",
766:             ".rmd",
767:             ".qmd",
768:             ".mdx"
769:           ],
770:           "type": "array"
771:         },
772:         "markdown-preview-enhanced.alwaysShowBacklinksInPreview": {
773:           "description": "%markdown-preview-enhanced.alwaysShowBacklinksInPreview.description%",
774:           "default": false,
775:           "type": "boolean"
776:         },
777:         "markdown-preview-enhanced.enablePreviewZenMode": {
778:           "description": "%markdown-preview-enhanced.enablePreviewZenMode.description%",
779:           "default": true,
780:           "type": "boolean"
781:         },
782:         "markdown-preview-enhanced.useVSCodeThemeForContextMenu": {
783:           "description": "%markdown-preview-enhanced.useVSCodeThemeForContextMenu.description%",
784:           "default": false,
785:           "type": "boolean"
786:         },
787:         "markdown-preview-enhanced.enableImageLightbox": {
788:           "description": "%markdown-preview-enhanced.enableImageLightbox.description%",
789:           "default": true,
790:           "type": "boolean"
791:         }
792:       }
793:     },
794:     "customEditors": [
795:       {
796:         "viewType": "markdown-preview-enhanced",
797:         "displayName": "%customEditorPreviewDisplayName%",
798:         "selector": [
799:           {
800:             "filenamePattern": "*.{md,markdown,mdown,mkdn,mkd,rmd,qmd}"
801:           }
802:         ],
803:         "priority": "option"
804:       }
805:     ],
806:     "keybindings": [
807:       {
808:         "command": "markdown-preview-enhanced.openPreviewToTheSide",
809:         "key": "ctrl+k v",
810:         "mac": "cmd+k v",
811:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
812:       },
813:       {
814:         "command": "markdown-preview-enhanced.openPreview",
815:         "key": "ctrl+shift+v",
816:         "mac": "cmd+shift+v",
817:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
818:       },
819:       {
820:         "command": "markdown-preview-enhanced.openLockedPreviewToTheSide",
821:         "key": "ctrl+k shift+l",
822:         "mac": "cmd+k shift+l",
823:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
824:       },
825:       {
826:         "command": "markdown-preview-enhanced.togglePreviewLock",
827:         "key": "ctrl+k ctrl+shift+l",
828:         "mac": "cmd+k cmd+shift+l",
829:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
830:       },
831:       {
832:         "command": "markdown-preview-enhanced.runAllCodeChunks",
833:         "key": "ctrl+shift+enter",
834:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
835:       },
836:       {
837:         "command": "markdown-preview-enhanced.runCodeChunk",
838:         "key": "shift+enter",
839:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
840:       },
841:       {
842:         "command": "markdown-preview-enhanced.syncPreview",
843:         "key": "ctrl+shift+s",
844:         "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/"
845:       }
846:     ],
847:     "menus": {
848:       "editor/context": [
849:         {
850:           "command": "markdown-preview-enhanced.openPreviewToTheSide",
851:           "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/",
852:           "group": "markdown-preview-enhanced"
853:         },
854:         {
855:           "command": "markdown-preview-enhanced.openGraphView",
856:           "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/",
857:           "group": "markdown-preview-enhanced"
858:         }
859:       ],
860:       "editor/title": [
861:         {
862:           "command": "markdown-preview-enhanced.openPreviewToTheSide",
863:           "when": "editorLangId =~ /^(markdown|quarto|prompt|instructions|chatagent|skill)$/",
864:           "group": "navigation"
865:         }
866:       ]
867:     }
868:   },
869:   "activationEvents": [
870:     "onStartupFinished",
871:     "onLanguage:markdown",
872:     "onLanguage:quarto",
873:     "onLanguage:prompt",
874:     "onLanguage:instructions",
875:     "onLanguage:chatagent",
876:     "onLanguage:skill"
877:   ],
878:   "husky": {
879:     "hooks": {
880:       "pre-commit": "lint-staged"
881:     }
882:   },
883:   "lint-staged": {
884:     "**/*.*": [
885:       "eslint",
886:       "prettier --write"
887:     ]
888:   },
889:   "dependencies": {
890:     "@types/crypto-js": "^4.1.2",
891:     "@types/vfile": "^3.0.2",
892:     "async-mutex": "^0.4.0",
893:     "crossnote": "0.9.31",
894:     "crypto-js": "^4.2.0"
895:   },
896:   "devDependencies": {
897:     "@eslint/js": "^10",
898:     "@types/mocha": "^5.2.5",
899:     "@types/node": "^25.6.0",
900:     "@types/vscode": "1.70.0",
901:     "@typescript-eslint/eslint-plugin": "^8",
902:     "@typescript-eslint/parser": "^8",
903:     "@vscode/test-web": "^0.0.80",
904:     "concurrently": "^8.2.1",
905:     "esbuild": "^0.25.0",
906:     "esbuild-plugin-polyfill-node": "^0.3.0",
907:     "eslint": "^10",
908:     "gulp": "^4.0.2",
909:     "http-server": "^14.1.1",
910:     "husky": "^9.1.7",
911:     "lint-staged": "^16.4.0",
912:     "mocha": "^6.1.4",
913:     "prettier": "^3",
914:     "prettier-plugin-packagejson": "^3.0.2",
915:     "ts-loader": "^9.4.4",
916:     "typescript": "^5.2.2",
917:     "typescript-eslint": "^8",
918:     "webpack": "^5.104.1",
919:     "webpack-cli": "^5.1.4"
920:   },
921:   "engines": {
922:     "vscode": "^1.70.0"
923:   },
924:   "icon": "media/mpe.png"
925: }
````

## File: README.md
````markdown
 1: <h1 align="center"> Markdown Preview Enhanced </h1>
 2: 
 3: ![intro](https://user-images.githubusercontent.com/1908863/28495106-30b3b15e-6f09-11e7-8eb6-ca4ca001ab15.png)
 4: 
 5: <div align="center">
 6: 
 7: [English](https://shd101wyy.github.io/markdown-preview-enhanced/#/) · [简体中文](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-cn/) · [繁體中文](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-tw/) · [日本語](https://shd101wyy.github.io/markdown-preview-enhanced/#/ja-jp/) · [한국어](https://shd101wyy.github.io/markdown-preview-enhanced/#/ko-kr/) · [Français](https://shd101wyy.github.io/markdown-preview-enhanced/#/fr-fr/) · [Español](https://shd101wyy.github.io/markdown-preview-enhanced/#/es-es/) · [Português](https://shd101wyy.github.io/markdown-preview-enhanced/#/pt-br/) · [Nederlands](https://shd101wyy.github.io/markdown-preview-enhanced/#/nl-nl/) · [Türkçe](https://shd101wyy.github.io/markdown-preview-enhanced/#/tr-tr/)
 8: 
 9: </div>
10: 
11: <div align="center">
12: 
13: [VS Code](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) · [VS Code for the Web](https://vscode.dev)
14: 
15: </div>
16: 
17: ## Supporting this project
18: 
19: Markdown Preview Enhanced is an open source project released under the [University of Illinois/NCSA Open Source License](LICENSE.md). Its ongoing development is made possible thanks to the support by these awesome [backers](https://shd101wyy.github.io/markdown-preview-enhanced/#/backers). You can help make this project better by [supporting us on GitHub Sponsors](https://github.com/sponsors/shd101wyy), [PayPal](https://shd101wyy.github.io/markdown-preview-enhanced/#/paypal), or [微信支付 Wechat Pay](https://shd101wyy.github.io/markdown-preview-enhanced/#/wechat). Thank you!
20: 
21: ## Sponsors
22: 
23: <a href="https://github.com/sponsors/shd101wyy">
24:   <img src="https://github.blog/wp-content/uploads/2019/05/mona-heart-featured.png?" width="200"></a><br>
25: 
26: These [GitHub Sponsors](https://github.com/sponsors/shd101wyy#sponsors) and [Backers](https://shd101wyy.github.io/markdown-preview-enhanced/#/backers) help push this project forward 🎉.
27: 
28: ## Introduction
29: 
30: Markdown Preview Enhanced is an extension that provides you with many useful functionalities such as automatic scroll sync, [math typesetting](https://shd101wyy.github.io/markdown-preview-enhanced/#/math), [mermaid](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=mermaid), [PlantUML](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=plantuml), [WebSequenceDiagrams](https://www.websequencediagrams.com), [pandoc](https://shd101wyy.github.io/markdown-preview-enhanced/#/pandoc), PDF export, [code chunk](https://shd101wyy.github.io/markdown-preview-enhanced/#/code-chunk), [presentation writer](https://rawgit.com/shd101wyy/markdown-preview-enhanced/master/docs/presentation-intro.html), etc. A lot of its ideas are inspired by [Markdown Preview Plus](https://github.com/atom-community/markdown-preview-plus) and [RStudio Markdown](http://rmarkdown.rstudio.com/).
31: 
32: Feel free to ask questions, post issues, submit pull request, and request new features.
33: 
34: For more information about this project and how to use this extension, please check out our documentation ⬇︎
35: 
36: ## Privacy
37: 
38: **This extension does not collect, transmit, or share your data with any external service.** The core preview, scroll sync, math typesetting, diagram rendering, and all editor features run entirely on your local machine. No telemetry, no tracking, no phone-home.
39: 
40: - **Markdown content** — rendered locally; never leaves your machine.
41: - **Math (KaTeX/MathJax)** — typeset locally or via a CDN JavaScript library you configure (default: jsdelivr).
42: - **Diagrams (Mermaid, Graphviz, Vega, WaveDrom, D2, TikZ)** — rendered locally using bundled or system-installed tools.
43: - **PlantUML** — rendered via your own PlantUML server (`plantumlServer` config) or a local `.jar` file. Unless explicitly configured to use `kroki.io`, no diagram data is sent to any remote service.
44: - **Image upload (imgur, sm.ms, qiniu)** — opt-in only. Requires you to manually trigger the upload and configure API credentials.
45: - **Pandoc / ebook / PDF export** — uses locally installed tools; no data is uploaded.
46: 
47: If you have any questions about data handling, please [open an issue](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues).
48: 
49: ## Documentation
50: 
51: To check out the documentation, visit
52: 
53: - [English](https://shd101wyy.github.io/markdown-preview-enhanced/#/)
54: - [简体中文](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-cn/)
55: - [繁體中文](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-tw/)
56: - [日本語](https://shd101wyy.github.io/markdown-preview-enhanced/#/ja-jp/)
57: - [한국어](https://shd101wyy.github.io/markdown-preview-enhanced/#/ko-kr/)
58: - [Français](https://shd101wyy.github.io/markdown-preview-enhanced/#/fr-fr/)
59: - [Español](https://shd101wyy.github.io/markdown-preview-enhanced/#/es-es/)
60: - [Português](https://shd101wyy.github.io/markdown-preview-enhanced/#/pt-br/)
61: - [Nederlands](https://shd101wyy.github.io/markdown-preview-enhanced/#/nl-nl/)
62: - [Türkçe](https://shd101wyy.github.io/markdown-preview-enhanced/#/tr-tr/)
63: 
64: Contact me if you are willing to help translate the documentation :)
65: 
66: ## Keybindings
67: 
68: > The <kbd>cmd</kbd> key for _Windows_ is <kbd>ctrl</kbd>.
69: 
70: | Shortcuts                                                      | Functionality                   |
71: | -------------------------------------------------------------- | ------------------------------- |
72: | <kbd>cmd-k v</kbd> or <kbd>ctrl-k v</kbd>                      | Open preview to the Side        |
73: | <kbd>cmd-shift-v</kbd> or <kbd>ctrl-shift-v</kbd>              | Open preview                    |
74: | <kbd>cmd-k shift-l</kbd> or <kbd>ctrl-k shift-l</kbd>          | Open locked preview to the Side |
75: | <kbd>cmd-k cmd-shift-l</kbd> or <kbd>ctrl-k ctrl-shift-l</kbd> | Toggle preview lock             |
76: | <kbd>ctrl-shift-s</kbd>                                        | Sync preview / Sync source      |
77: | <kbd>shift-enter</kbd>                                         | Run Code Chunk                  |
78: | <kbd>ctrl-shift-enter</kbd>                                    | Run all Code Chunks             |
79: | <kbd>cmd-=</kbd> or <kbd>cmd-shift-=</kbd>                     | Preview zoom in                 |
80: | <kbd>cmd--</kbd> or <kbd>cmd-shift-\_</kbd>                    | Preview zoom out                |
81: | <kbd>cmd-0</kbd>                                               | Preview reset zoom              |
82: | <kbd>esc</kbd>                                                 | Toggle sidebar TOC              |
83: 
84: ## Changelog
85: 
86: Please check the [Releases](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/releases) page of this project.
87: 
88: ## License
89: 
90: [University of Illinois/NCSA Open Source License](LICENSE.md)
````

## File: src/config.ts
````typescript
  1: import {
  2:   CodeBlockTheme,
  3:   FrontMatterRenderingOption,
  4:   ImageUploader,
  5:   KatexOptions,
  6:   MarkdownParser,
  7:   MathRenderingOption,
  8:   MermaidConfig,
  9:   MermaidTheme,
 10:   NotebookConfig,
 11:   ParserConfig,
 12:   PreviewMode,
 13:   PreviewTheme,
 14:   RevealJsTheme,
 15:   WikiLinkResolution,
 16:   WikiLinkTargetFileNameChangeCase,
 17:   getDefaultNotebookConfig,
 18: } from 'crossnote';
 19: import * as vscode from 'vscode';
 20: import { isVSCodeWebExtension } from './utils';
 21: 
 22: export enum PreviewColorScheme {
 23:   selectedPreviewTheme = 'selectedPreviewTheme',
 24:   systemColorScheme = 'systemColorScheme',
 25:   editorColorScheme = 'editorColorScheme',
 26: }
 27: 
 28: type VSCodeMPEConfigKey =
 29:   | 'automaticallyShowPreviewOfMarkdownBeingEdited'
 30:   | 'configPath'
 31:   | 'enableImageLightbox'
 32:   | 'imageUploader'
 33:   | 'hideDefaultVSCodeMarkdownPreviewButtons'
 34:   | 'liveUpdate'
 35:   | 'liveUpdateDebounceMs'
 36:   | 'previewColorScheme'
 37:   | 'previewMode'
 38:   | 'qiniuAccessKey'
 39:   | 'qiniuBucket'
 40:   | 'qiniuDomain'
 41:   | 'qiniuSecretKey'
 42:   | 'scrollSync'
 43:   | 'disableAutoPreviewForUriSchemes'
 44:   | 'disableAutoPreviewForFilePatterns'
 45:   | 'd2Path'
 46:   | 'd2Layout'
 47:   | 'd2Theme'
 48:   | 'd2Sketch';
 49: 
 50: type ConfigKey = keyof NotebookConfig | VSCodeMPEConfigKey;
 51: 
 52: export class MarkdownPreviewEnhancedConfig implements NotebookConfig {
 53:   public static getCurrentConfig() {
 54:     return new MarkdownPreviewEnhancedConfig();
 55:   }
 56: 
 57:   public readonly markdownFileExtensions: string[];
 58:   public readonly configPath: string;
 59:   public readonly markdownParser: MarkdownParser;
 60:   public readonly breakOnSingleNewLine: boolean;
 61:   public readonly enableTypographer: boolean;
 62:   public readonly enableWikiLinkSyntax: boolean;
 63:   public readonly enableLinkify: boolean;
 64:   public readonly useGitHubStylePipedLink: boolean;
 65:   public readonly enableEmojiSyntax: boolean;
 66:   public readonly enableExtendedTableSyntax: boolean;
 67:   public readonly enableCriticMarkupSyntax: boolean;
 68:   public readonly enableTagSyntax: boolean;
 69:   public readonly maxNoteFileSize: number;
 70:   public readonly frontMatterRenderingOption: FrontMatterRenderingOption;
 71:   public readonly mathRenderingOption: MathRenderingOption;
 72:   public readonly mathInlineDelimiters: string[][];
 73:   public readonly mathBlockDelimiters: string[][];
 74:   public readonly mathRenderingOnlineService: string;
 75:   public readonly mathjaxScriptSrc: string;
 76:   public readonly codeBlockTheme: CodeBlockTheme;
 77:   public readonly mermaidTheme: MermaidTheme;
 78:   public readonly previewTheme: PreviewTheme;
 79:   public readonly revealjsTheme: RevealJsTheme;
 80:   public readonly protocolsWhiteList: string;
 81:   public readonly imageFolderPath: string;
 82:   public readonly printBackground: boolean;
 83:   public readonly chromePath: string;
 84:   public readonly imageMagickPath: string;
 85:   public readonly pandocPath: string;
 86:   public readonly markdownYoBinaryPath: string;
 87:   public readonly pandocMarkdownFlavor: string;
 88:   public readonly pandocArguments: string[];
 89:   public readonly latexEngine: string;
 90:   public readonly enableScriptExecution: boolean;
 91:   public readonly enableHTML5Embed: boolean;
 92:   // eslint-disable-next-line @typescript-eslint/naming-convention
 93:   public readonly HTML5EmbedUseImageSyntax: boolean;
 94:   // eslint-disable-next-line @typescript-eslint/naming-convention
 95:   public readonly HTML5EmbedUseLinkSyntax: boolean;
 96:   // eslint-disable-next-line @typescript-eslint/naming-convention
 97:   public readonly HTML5EmbedIsAllowedHttp: boolean;
 98:   // eslint-disable-next-line @typescript-eslint/naming-convention
 99:   public readonly HTML5EmbedAudioAttributes: string;
100:   // eslint-disable-next-line @typescript-eslint/naming-convention
101:   public readonly HTML5EmbedVideoAttributes: string;
102:   public readonly puppeteerWaitForTimeout: number;
103:   public readonly puppeteerArgs: string[];
104:   public readonly plantumlServer: string;
105:   public readonly plantumlJarPath: string;
106:   public readonly jsdelivrCdnHost: string;
107:   public readonly krokiServer: string;
108:   public readonly webSequenceDiagramsServer: string;
109:   public readonly webSequenceDiagramsApiKey: string;
110:   public readonly alwaysShowBacklinksInPreview: boolean;
111:   public readonly enablePreviewZenMode: boolean;
112:   public readonly useVSCodeThemeForContextMenu: boolean;
113:   public readonly wikiLinkTargetFileExtension: string;
114:   public readonly wikiLinkTargetFileNameChangeCase: WikiLinkTargetFileNameChangeCase;
115:   public readonly wikiLinkResolution: WikiLinkResolution;
116:   // D2 diagram settings
117:   public readonly d2Path: string;
118:   public readonly d2Layout: string;
119:   public readonly d2Theme: number;
120:   public readonly d2Sketch: boolean;
121:   // Don't set values for these properties in constructor:
122:   public readonly includeInHeader!: string;
123:   public readonly globalCss!: string;
124:   public readonly mermaidConfig!: MermaidConfig;
125:   public readonly mathjaxConfig: any;
126:   public readonly katexConfig!: KatexOptions;
127:   public readonly parserConfig!: ParserConfig;
128:   public readonly isVSCode: boolean = true;
129: 
130:   // preview config
131:   public readonly automaticallyShowPreviewOfMarkdownBeingEdited: boolean;
132:   public readonly hideDefaultVSCodeMarkdownPreviewButtons: boolean;
133:   public readonly imageUploader: ImageUploader;
134:   public readonly liveUpdate: boolean;
135:   public readonly liveUpdateDebounceMs: number;
136:   public readonly previewColorScheme: PreviewColorScheme;
137:   public readonly previewMode: PreviewMode;
138:   public readonly scrollSync: boolean;
139: 
140:   private constructor() {
141:     const defaultConfig = getDefaultNotebookConfig();
142: 
143:     this.markdownFileExtensions =
144:       getMPEConfig<string[]>('markdownFileExtensions') ??
145:       defaultConfig.markdownFileExtensions;
146:     this.configPath = getMPEConfig<string>('configPath') ?? '';
147:     this.markdownParser = isVSCodeWebExtension()
148:       ? 'markdown-it' // pandoc is not supported in web extension
149:       : (getMPEConfig<MarkdownParser>('markdownParser') ??
150:         defaultConfig.markdownParser);
151:     this.breakOnSingleNewLine =
152:       getMPEConfig<boolean>('breakOnSingleNewLine') ??
153:       defaultConfig.breakOnSingleNewLine;
154:     this.enableTypographer =
155:       getMPEConfig<boolean>('enableTypographer') ??
156:       defaultConfig.enableTypographer;
157:     this.enableWikiLinkSyntax =
158:       getMPEConfig<boolean>('enableWikiLinkSyntax') ??
159:       defaultConfig.enableWikiLinkSyntax;
160:     this.enableLinkify =
161:       getMPEConfig<boolean>('enableLinkify') ?? defaultConfig.enableLinkify;
162:     this.useGitHubStylePipedLink =
163:       getMPEConfig<boolean>('useGitHubStylePipedLink') ??
164:       defaultConfig.useGitHubStylePipedLink;
165:     this.enableEmojiSyntax =
166:       getMPEConfig<boolean>('enableEmojiSyntax') ??
167:       defaultConfig.enableEmojiSyntax;
168:     this.enableExtendedTableSyntax =
169:       getMPEConfig<boolean>('enableExtendedTableSyntax') ??
170:       defaultConfig.enableExtendedTableSyntax;
171:     this.enableCriticMarkupSyntax =
172:       getMPEConfig<boolean>('enableCriticMarkupSyntax') ??
173:       defaultConfig.enableCriticMarkupSyntax;
174:     this.enableTagSyntax =
175:       getMPEConfig<boolean>('enableTagSyntax') ?? defaultConfig.enableTagSyntax;
176:     this.maxNoteFileSize =
177:       getMPEConfig<number>('maxNoteFileSize') ?? defaultConfig.maxNoteFileSize;
178:     this.frontMatterRenderingOption =
179:       getMPEConfig<FrontMatterRenderingOption>('frontMatterRenderingOption') ??
180:       defaultConfig.frontMatterRenderingOption;
181:     this.mermaidTheme =
182:       getMPEConfig<MermaidTheme>('mermaidTheme') ?? defaultConfig.mermaidTheme;
183:     this.mathRenderingOption =
184:       (getMPEConfig<string>('mathRenderingOption') as MathRenderingOption) ??
185:       defaultConfig.mathRenderingOption;
186:     this.mathInlineDelimiters =
187:       getMPEConfig<string[][]>('mathInlineDelimiters') ??
188:       defaultConfig.mathInlineDelimiters;
189:     this.mathBlockDelimiters =
190:       getMPEConfig<string[][]>('mathBlockDelimiters') ??
191:       defaultConfig.mathBlockDelimiters;
192:     this.mathRenderingOnlineService =
193:       getMPEConfig<string>('mathRenderingOnlineService') ??
194:       defaultConfig.mathRenderingOnlineService;
195:     this.mathjaxScriptSrc =
196:       getMPEConfig<string>('mathjaxScriptSrc') ??
197:       defaultConfig.mathjaxScriptSrc;
198:     this.codeBlockTheme =
199:       getMPEConfig<CodeBlockTheme>('codeBlockTheme') ??
200:       defaultConfig.codeBlockTheme;
201:     this.previewTheme =
202:       getMPEConfig<PreviewTheme>('previewTheme') ?? defaultConfig.previewTheme;
203:     this.revealjsTheme =
204:       getMPEConfig<RevealJsTheme>('revealjsTheme') ??
205:       defaultConfig.revealjsTheme;
206:     this.protocolsWhiteList =
207:       getMPEConfig<string>('protocolsWhiteList') ??
208:       defaultConfig.protocolsWhiteList;
209:     this.imageFolderPath =
210:       getMPEConfig<string>('imageFolderPath') ?? defaultConfig.imageFolderPath;
211:     this.imageUploader =
212:       getMPEConfig<ImageUploader>('imageUploader') ?? 'imgur';
213:     this.printBackground =
214:       getMPEConfig<boolean>('printBackground') ?? defaultConfig.printBackground;
215:     this.chromePath =
216:       getMPEConfig<string>('chromePath') ?? defaultConfig.chromePath;
217:     this.imageMagickPath =
218:       getMPEConfig<string>('imageMagickPath') ?? defaultConfig.imageMagickPath;
219:     this.pandocPath =
220:       getMPEConfig<string>('pandocPath') ?? defaultConfig.pandocPath;
221:     this.markdownYoBinaryPath =
222:       getMPEConfig<string>('markdownYoBinaryPath') ??
223:       defaultConfig.markdownYoBinaryPath;
224:     this.pandocMarkdownFlavor =
225:       getMPEConfig<string>('pandocMarkdownFlavor') ??
226:       defaultConfig.pandocMarkdownFlavor;
227:     this.pandocArguments =
228:       getMPEConfig<string[]>('pandocArguments') ??
229:       defaultConfig.pandocArguments;
230:     this.latexEngine =
231:       getMPEConfig<string>('latexEngine') ?? defaultConfig.latexEngine;
232:     this.enableScriptExecution =
233:       getMPEConfig<boolean>('enableScriptExecution') ??
234:       defaultConfig.enableScriptExecution;
235: 
236:     this.scrollSync = getMPEConfig<boolean>('scrollSync') ?? true;
237:     this.liveUpdate = getMPEConfig<boolean>('liveUpdate') ?? true;
238:     this.liveUpdateDebounceMs =
239:       getMPEConfig<number>('liveUpdateDebounceMs') ?? 300;
240:     this.previewMode =
241:       getMPEConfig<PreviewMode>('previewMode') ?? PreviewMode.SinglePreview;
242:     this.automaticallyShowPreviewOfMarkdownBeingEdited =
243:       getMPEConfig<boolean>('automaticallyShowPreviewOfMarkdownBeingEdited') ??
244:       false;
245:     this.previewColorScheme =
246:       getMPEConfig<PreviewColorScheme>('previewColorScheme') ??
247:       PreviewColorScheme.selectedPreviewTheme;
248:     this.enableHTML5Embed =
249:       getMPEConfig<boolean>('enableHTML5Embed') ??
250:       defaultConfig.enableHTML5Embed;
251:     this.HTML5EmbedUseImageSyntax =
252:       getMPEConfig<boolean>('HTML5EmbedUseImageSyntax') ??
253:       defaultConfig.HTML5EmbedUseImageSyntax;
254:     this.HTML5EmbedUseLinkSyntax =
255:       getMPEConfig<boolean>('HTML5EmbedUseLinkSyntax') ??
256:       defaultConfig.HTML5EmbedUseLinkSyntax;
257:     this.HTML5EmbedIsAllowedHttp =
258:       getMPEConfig<boolean>('HTML5EmbedIsAllowedHttp') ??
259:       defaultConfig.HTML5EmbedIsAllowedHttp;
260:     this.HTML5EmbedAudioAttributes =
261:       getMPEConfig<string>('HTML5EmbedAudioAttributes') ??
262:       defaultConfig.HTML5EmbedAudioAttributes;
263:     this.HTML5EmbedVideoAttributes =
264:       getMPEConfig<string>('HTML5EmbedVideoAttributes') ??
265:       defaultConfig.HTML5EmbedVideoAttributes;
266:     this.puppeteerWaitForTimeout =
267:       getMPEConfig<number>('puppeteerWaitForTimeout') ??
268:       defaultConfig.puppeteerWaitForTimeout;
269:     this.puppeteerArgs =
270:       getMPEConfig<string[]>('puppeteerArgs') ?? defaultConfig.puppeteerArgs;
271:     this.plantumlJarPath =
272:       getMPEConfig<string>('plantumlJarPath') ?? defaultConfig.plantumlJarPath;
273:     this.plantumlServer =
274:       getMPEConfig<string>('plantumlServer') ?? defaultConfig.plantumlServer;
275:     if (!this.plantumlServer && isVSCodeWebExtension()) {
276:       this.plantumlServer = 'https://kroki.io/plantuml/svg/';
277:     }
278:     this.hideDefaultVSCodeMarkdownPreviewButtons =
279:       getMPEConfig<boolean>('hideDefaultVSCodeMarkdownPreviewButtons') ?? true;
280:     this.jsdelivrCdnHost =
281:       getMPEConfig<string>('jsdelivrCdnHost') ?? defaultConfig.jsdelivrCdnHost;
282:     this.krokiServer =
283:       getMPEConfig<string>('krokiServer') ?? defaultConfig.krokiServer;
284:     this.webSequenceDiagramsServer =
285:       getMPEConfig<string>('webSequenceDiagramsServer') ||
286:       'https://www.websequencediagrams.com';
287:     this.webSequenceDiagramsApiKey =
288:       getMPEConfig<string>('webSequenceDiagramsApiKey') || '';
289:     this.alwaysShowBacklinksInPreview =
290:       getMPEConfig<boolean>('alwaysShowBacklinksInPreview') ??
291:       defaultConfig.alwaysShowBacklinksInPreview;
292:     this.enablePreviewZenMode =
293:       getMPEConfig<boolean>('enablePreviewZenMode') ??
294:       defaultConfig.enablePreviewZenMode;
295:     this.useVSCodeThemeForContextMenu =
296:       getMPEConfig<boolean>('useVSCodeThemeForContextMenu') ??
297:       defaultConfig.useVSCodeThemeForContextMenu;
298:     this.wikiLinkTargetFileExtension =
299:       getMPEConfig<string>('wikiLinkTargetFileExtension') ??
300:       defaultConfig.wikiLinkTargetFileExtension;
301:     this.wikiLinkTargetFileNameChangeCase =
302:       getMPEConfig<WikiLinkTargetFileNameChangeCase>(
303:         'wikiLinkTargetFileNameChangeCase',
304:       ) ?? defaultConfig.wikiLinkTargetFileNameChangeCase;
305:     this.wikiLinkResolution =
306:       getMPEConfig<WikiLinkResolution>('wikiLinkResolution') ??
307:       defaultConfig.wikiLinkResolution;
308:     this.d2Path = getMPEConfig<string>('d2Path') ?? 'd2';
309:     this.d2Layout = getMPEConfig<string>('d2Layout') ?? 'dagre';
310:     this.d2Theme = getMPEConfig<number>('d2Theme') ?? 0;
311:     this.d2Sketch = getMPEConfig<boolean>('d2Sketch') ?? false;
312:   }
313: 
314:   public isEqualTo(otherConfig: MarkdownPreviewEnhancedConfig) {
315:     const json1 = JSON.stringify(this);
316:     const json2 = JSON.stringify(otherConfig);
317:     return json1 === json2;
318:   }
319: 
320:   [key: string]: any;
321: }
322: 
323: export function getMPEConfig<T>(section: ConfigKey) {
324:   const config = vscode.workspace.getConfiguration('markdown-preview-enhanced');
325:   return config.get<T>(section);
326: }
327: 
328: export function updateMPEConfig<T>(
329:   section: ConfigKey,
330:   value: T,
331:   configurationTarget?: boolean | vscode.ConfigurationTarget | null | undefined,
332:   overrideInLanguage?: boolean | undefined,
333: ) {
334:   const config = vscode.workspace.getConfiguration('markdown-preview-enhanced');
335:   return config.update(section, value, configurationTarget, overrideInLanguage);
336: }
````

## File: src/extension-common.ts
````typescript
   1: // For both node.js and browser environments
   2: import { PreviewMode, utility } from 'crossnote';
   3: import { SHA256 } from 'crypto-js';
   4: import * as vscode from 'vscode';
   5: import { WikilinkCompletionProvider } from './block-id-completion-provider';
   6: import { WikilinkHoverProvider } from './wikilink-hover-provider';
   7: import {
   8:   WikilinkDocumentLinkProvider,
   9:   openWikilinkTarget,
  10: } from './wikilink-document-link-provider';
  11: import { PreviewColorScheme, getMPEConfig, updateMPEConfig } from './config';
  12: import { findFragmentTargetLine } from './find-fragment-target-line';
  13: import { pasteImageFile, uploadImageFile } from './image-helper';
  14: import NotebooksManager from './notebooks-manager';
  15: import { PreviewCustomEditorProvider } from './preview-custom-editor-provider';
  16: import { PreviewProvider, getPreviewUri } from './preview-provider';
  17: import { GraphViewProvider } from './graph-view-provider';
  18: import {
  19:   createMissingMarkdownNote,
  20:   getBottomVisibleLine,
  21:   getEditorActiveCursorLine,
  22:   getPreviewMode,
  23:   getTopVisibleLine,
  24:   getWorkspaceFolderUri,
  25:   isMarkdownFile,
  26: } from './utils';
  27: import * as path from 'path';
  28: 
  29: let editorScrollDelay = Date.now();
  30: 
  31: // hide default vscode markdown preview buttons if necessary
  32: const hideDefaultVSCodeMarkdownPreviewButtons = vscode.workspace
  33:   .getConfiguration('markdown-preview-enhanced')
  34:   .get<boolean>('hideDefaultVSCodeMarkdownPreviewButtons');
  35: if (hideDefaultVSCodeMarkdownPreviewButtons) {
  36:   vscode.commands.executeCommand(
  37:     'setContext',
  38:     'hasCustomMarkdownPreview',
  39:     true,
  40:   );
  41: }
  42: 
  43: export async function initExtensionCommon(context: vscode.ExtensionContext) {
  44:   const notebooksManager = new NotebooksManager(context);
  45:   try {
  46:     await notebooksManager.updateWorkbenchEditorAssociationsBasedOnPreviewMode();
  47:   } catch (error) {
  48:     console.warn(
  49:       '[Markdown Preview Enhanced] Could not update editor associations (may be expected in web context):',
  50:       error,
  51:     );
  52:   }
  53:   PreviewProvider.notebooksManager = notebooksManager;
  54: 
  55:   function getCurrentWorkingDirectory() {
  56:     const activeEditor = vscode.window.activeTextEditor;
  57:     if (activeEditor) {
  58:       return getWorkspaceFolderUri(activeEditor.document.uri);
  59:     } else {
  60:       const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  61:       const workspaceFolderUri = workspaceFolders[0]?.uri;
  62:       return workspaceFolderUri;
  63:     }
  64:   }
  65: 
  66:   async function getPreviewContentProvider(uri: vscode.Uri) {
  67:     return await PreviewProvider.getPreviewContentProvider(uri, context);
  68:   }
  69: 
  70:   async function openPreviewToTheSide(uri?: vscode.Uri) {
  71:     const editor = vscode.window.activeTextEditor;
  72:     if (!editor) {
  73:       return;
  74:     }
  75:     if (!uri) {
  76:       uri = editor.document.uri;
  77:     }
  78: 
  79:     try {
  80:       const previewProvider = await getPreviewContentProvider(uri);
  81:       await previewProvider.initPreview({
  82:         sourceUri: uri,
  83:         document: editor.document,
  84:         cursorLine: getEditorActiveCursorLine(editor),
  85:         viewOptions: {
  86:           viewColumn: vscode.ViewColumn.Beside,
  87:           preserveFocus: true,
  88:         },
  89:       });
  90:     } catch (error) {
  91:       console.error('[MPE] openPreviewToTheSide failed:', error);
  92:       vscode.window.showErrorMessage(
  93:         `MPE Preview failed: ${error instanceof Error ? error.message : String(error)}`,
  94:       );
  95:     }
  96:   }
  97: 
  98:   async function openPreview(uri?: vscode.Uri) {
  99:     const editor = vscode.window.activeTextEditor;
 100:     if (!editor) {
 101:       return;
 102:     }
 103:     if (!uri) {
 104:       uri = editor.document.uri;
 105:     }
 106: 
 107:     const previewProvider = await getPreviewContentProvider(uri);
 108:     previewProvider.initPreview({
 109:       sourceUri: uri,
 110:       document: editor.document,
 111:       cursorLine: getEditorActiveCursorLine(editor),
 112:       viewOptions: {
 113:         viewColumn: vscode.ViewColumn.One,
 114:         preserveFocus: false,
 115:       },
 116:     });
 117:   }
 118: 
 119:   async function openLockedPreviewToTheSide(uri?: vscode.Uri) {
 120:     const editor = vscode.window.activeTextEditor;
 121:     if (!editor) {
 122:       return;
 123:     }
 124:     if (!uri) {
 125:       uri = editor.document.uri;
 126:     }
 127: 
 128:     try {
 129:       const previewProvider = await getPreviewContentProvider(uri);
 130:       await previewProvider.initPreview({
 131:         sourceUri: uri,
 132:         document: editor.document,
 133:         cursorLine: getEditorActiveCursorLine(editor),
 134:         viewOptions: {
 135:           viewColumn: vscode.ViewColumn.Beside,
 136:           preserveFocus: true,
 137:         },
 138:       });
 139:       previewProvider.lockSinglePreview();
 140:     } catch (error) {
 141:       console.error('[MPE] openLockedPreviewToTheSide failed:', error);
 142:       vscode.window.showErrorMessage(
 143:         `MPE Preview failed: ${error instanceof Error ? error.message : String(error)}`,
 144:       );
 145:     }
 146:   }
 147: 
 148:   async function togglePreviewLock(uri?: vscode.Uri) {
 149:     const editor = vscode.window.activeTextEditor;
 150:     if (!editor) {
 151:       return;
 152:     }
 153:     const previewProvider = await getPreviewContentProvider(
 154:       uri ?? editor.document.uri,
 155:     );
 156:     const locked = previewProvider.toggleSinglePreviewLock();
 157:     vscode.window.showInformationMessage(
 158:       locked
 159:         ? 'Preview is locked to the current file.'
 160:         : 'Preview is unlocked and will follow the active editor.',
 161:     );
 162:   }
 163: 
 164:   /**
 165:    * Append a unique `^id` block-id marker to the line under the cursor (if
 166:    * one isn't already there) and copy `[[note#^id]]` to the clipboard.
 167:    * Mirrors Obsidian's "Copy block link" command — pair with crossnote's
 168:    * already-shipped `^id` rendering and `[[note^id]]` resolution.
 169:    */
 170:   async function copyBlockReference() {
 171:     const editor = vscode.window.activeTextEditor;
 172:     if (!editor) {
 173:       vscode.window.showWarningMessage('No active editor.');
 174:       return;
 175:     }
 176:     if (!isMarkdownFile(editor.document)) {
 177:       vscode.window.showWarningMessage(
 178:         'Block references only work in Markdown files.',
 179:       );
 180:       return;
 181:     }
 182:     const doc = editor.document;
 183:     const cursorLineNo = editor.selection.active.line;
 184:     const lineText = doc.lineAt(cursorLineNo).text;
 185:     if (!lineText.trim()) {
 186:       vscode.window.showWarningMessage(
 187:         'Place the cursor on the paragraph or list item you want to reference.',
 188:       );
 189:       return;
 190:     }
 191:     if (/^\s*#{1,6}\s/.test(lineText)) {
 192:       vscode.window.showWarningMessage(
 193:         'Headings already have anchor IDs. Use [[note#Heading]] to link to a heading.',
 194:       );
 195:       return;
 196:     }
 197:     if (isInFencedBlock(doc, cursorLineNo)) {
 198:       vscode.window.showWarningMessage(
 199:         'Cannot place a block ID inside a code fence.',
 200:       );
 201:       return;
 202:     }
 203: 
 204:     // Reuse existing trailing ^id if present, otherwise generate one that
 205:     // doesn't collide with any ^id elsewhere in the document.
 206:     const trailingMatch = lineText.match(/\s+\^([a-zA-Z0-9_-]+)\s*$/);
 207:     let blockId: string;
 208:     if (trailingMatch) {
 209:       blockId = trailingMatch[1];
 210:     } else {
 211:       blockId = generateUniqueBlockId(doc.getText());
 212:       const ok = await editor.edit((edit) => {
 213:         edit.insert(doc.lineAt(cursorLineNo).range.end, ` ^${blockId}`);
 214:       });
 215:       if (!ok) {
 216:         vscode.window.showErrorMessage('Failed to insert block ID.');
 217:         return;
 218:       }
 219:     }
 220: 
 221:     const noteName = path.basename(
 222:       doc.fileName,
 223:       path.extname(doc.fileName) || '.md',
 224:     );
 225:     const ref = `[[${noteName}#^${blockId}]]`;
 226:     await vscode.env.clipboard.writeText(ref);
 227:     vscode.window.showInformationMessage(`Copied block reference: ${ref}`);
 228:   }
 229: 
 230:   function generateUniqueBlockId(text: string): string {
 231:     const existing = new Set<string>();
 232:     const re = /\s\^([a-zA-Z0-9_-]+)/g;
 233:     let m: RegExpExecArray | null;
 234:     while ((m = re.exec(text)) !== null) {
 235:       existing.add(m[1]);
 236:     }
 237:     // 6-char base36 — ~2.2B keyspace, comfortable for any document size.
 238:     // Loop in case of collision; in practice we exit on the first try.
 239:     for (let attempt = 0; attempt < 100; attempt++) {
 240:       const id = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
 241:       if (!existing.has(id)) {
 242:         return id;
 243:       }
 244:     }
 245:     // Pathological fallback: timestamped id.
 246:     return `b${Date.now().toString(36)}`;
 247:   }
 248: 
 249:   function isInFencedBlock(doc: vscode.TextDocument, lineNo: number): boolean {
 250:     let inBacktickFence = false;
 251:     let inColonFence = false;
 252:     for (let i = 0; i <= lineNo; i++) {
 253:       const line = doc.lineAt(i).text;
 254:       const backtickMatch = /^\s*(`{3,}|~{3,})/.exec(line);
 255:       const colonMatch = /^\s*(:{3,})/.exec(line);
 256:       if (backtickMatch && !inColonFence) {
 257:         inBacktickFence = !inBacktickFence;
 258:       } else if (colonMatch && !inBacktickFence) {
 259:         // A bare ::: closes; ::: with info after opens.  We don't try to
 260:         // tell apart code-language fences from div fences here — either
 261:         // way a block ID inside a colon fence is a usage error.
 262:         const rest = line.slice(colonMatch.index + colonMatch[1].length).trim();
 263:         if (rest.length > 0) {
 264:           inColonFence = true;
 265:         } else if (inColonFence) {
 266:           inColonFence = false;
 267:         }
 268:       }
 269:     }
 270:     return inBacktickFence || inColonFence;
 271:   }
 272: 
 273:   async function toggleScrollSync() {
 274:     const scrollSync = !getMPEConfig<boolean>('scrollSync');
 275:     await updateMPEConfig('scrollSync', scrollSync, true);
 276:     if (scrollSync) {
 277:       vscode.window.showInformationMessage('Scroll Sync is enabled');
 278:     } else {
 279:       vscode.window.showInformationMessage('Scroll Sync is disabled');
 280:     }
 281:   }
 282: 
 283:   async function toggleLiveUpdate() {
 284:     const liveUpdate = !getMPEConfig<boolean>('liveUpdate');
 285:     await updateMPEConfig('liveUpdate', liveUpdate, true);
 286:     if (liveUpdate) {
 287:       vscode.window.showInformationMessage('Live Update is enabled');
 288:     } else {
 289:       vscode.window.showInformationMessage('Live Update is disabled');
 290:     }
 291:   }
 292: 
 293:   async function toggleBreakOnSingleNewLine() {
 294:     const breakOnSingleNewLine = !getMPEConfig<boolean>('breakOnSingleNewLine');
 295:     updateMPEConfig('breakOnSingleNewLine', breakOnSingleNewLine, true);
 296:     if (breakOnSingleNewLine) {
 297:       vscode.window.showInformationMessage(
 298:         'Break On Single New Line is enabled',
 299:       );
 300:     } else {
 301:       vscode.window.showInformationMessage(
 302:         'Break On Single New Line is disabled',
 303:       );
 304:     }
 305:   }
 306: 
 307:   function insertNewSlide() {
 308:     const editor = vscode.window.activeTextEditor;
 309:     if (editor && editor.document && editor.edit) {
 310:       editor.edit((textEdit) => {
 311:         textEdit.insert(editor.selection.active, '<!-- slide -->\n\n');
 312:       });
 313:     }
 314:   }
 315: 
 316:   function insertPagebreak() {
 317:     const editor = vscode.window.activeTextEditor;
 318:     if (editor && editor.document && editor.edit) {
 319:       editor.edit((textEdit) => {
 320:         textEdit.insert(editor.selection.active, '<!-- pagebreak -->\n\n');
 321:       });
 322:     }
 323:   }
 324: 
 325:   function createTOC() {
 326:     const editor = vscode.window.activeTextEditor;
 327:     if (editor && editor.document && editor.edit) {
 328:       editor.edit((textEdit) => {
 329:         textEdit.insert(
 330:           editor.selection.active,
 331:           '\n<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->\n',
 332:         );
 333:       });
 334:     }
 335:   }
 336: 
 337:   function insertTable() {
 338:     const editor = vscode.window.activeTextEditor;
 339:     if (editor && editor.document && editor.edit) {
 340:       editor.edit((textEdit) => {
 341:         textEdit.insert(
 342:           editor.selection.active,
 343:           `|   |   |
 344: |---|---|
 345: |   |   |
 346: `,
 347:         );
 348:       });
 349:     }
 350:   }
 351: 
 352:   async function openImageHelper() {
 353:     const editor = vscode.window.activeTextEditor;
 354:     if (!editor) {
 355:       return;
 356:     }
 357:     const uri = editor.document.uri;
 358:     const previewProvider = await getPreviewContentProvider(uri);
 359:     previewProvider.openImageHelper(uri);
 360:   }
 361: 
 362:   async function webviewFinishLoading({
 363:     uri,
 364:     systemColorScheme,
 365:   }: {
 366:     uri: string;
 367:     systemColorScheme: 'light' | 'dark';
 368:   }) {
 369:     const sourceUri = vscode.Uri.parse(uri);
 370:     const previewProvider = await getPreviewContentProvider(sourceUri);
 371:     notebooksManager.setSystemColorScheme(systemColorScheme);
 372:     // Guard against stale webviewFinishLoading callbacks from a previous file
 373:     // (can happen when the user switches files before the webview finishes loading)
 374:     if (!previewProvider.shouldUpdateMarkdown(sourceUri)) {
 375:       return;
 376:     }
 377:     previewProvider.updateMarkdown(sourceUri);
 378:   }
 379: 
 380:   /**
 381:    * Insert imageUrl to markdown file
 382:    * @param uri: markdown source uri
 383:    * @param imageUrl: url of image to be inserted
 384:    */
 385:   function insertImageUrl(uri: string, imageUrl: string) {
 386:     const sourceUri = vscode.Uri.parse(uri);
 387:     vscode.window.visibleTextEditors
 388:       .filter(
 389:         (editor) =>
 390:           isMarkdownFile(editor.document) &&
 391:           editor.document.uri.fsPath === sourceUri.fsPath,
 392:       )
 393:       .forEach((editor) => {
 394:         // const line = editor.selection.active.line
 395:         editor.edit((textEditorEdit) => {
 396:           textEditorEdit.insert(
 397:             editor.selection.active,
 398:             `![enter image description here](${imageUrl})`,
 399:           );
 400:         });
 401:       });
 402:   }
 403: 
 404:   async function refreshPreview(uri: string) {
 405:     const sourceUri = vscode.Uri.parse(uri);
 406:     const previewProvider = await getPreviewContentProvider(sourceUri);
 407:     previewProvider.refreshPreview(sourceUri);
 408:   }
 409: 
 410:   async function openInBrowser(uri: string) {
 411:     const sourceUri = vscode.Uri.parse(uri);
 412:     const previewProvider = await getPreviewContentProvider(sourceUri);
 413:     previewProvider.openInBrowser(sourceUri);
 414:   }
 415: 
 416:   async function htmlExport(uri: string, offline: boolean) {
 417:     const sourceUri = vscode.Uri.parse(uri);
 418:     const previewProvider = await getPreviewContentProvider(sourceUri);
 419:     previewProvider.htmlExport(sourceUri, offline);
 420:   }
 421: 
 422:   async function chromeExport(uri: string, type: string) {
 423:     const sourceUri = vscode.Uri.parse(uri);
 424:     const previewProvider = await getPreviewContentProvider(sourceUri);
 425:     previewProvider.chromeExport(sourceUri, type);
 426:   }
 427: 
 428:   async function princeExport(uri: string) {
 429:     const sourceUri = vscode.Uri.parse(uri);
 430:     const previewProvider = await getPreviewContentProvider(sourceUri);
 431:     previewProvider.princeExport(sourceUri);
 432:   }
 433: 
 434:   async function eBookExport(uri: string, fileType: string) {
 435:     const sourceUri = vscode.Uri.parse(uri);
 436:     const previewProvider = await getPreviewContentProvider(sourceUri);
 437:     previewProvider.eBookExport(sourceUri, fileType);
 438:   }
 439: 
 440:   async function pandocExport(uri: string) {
 441:     const sourceUri = vscode.Uri.parse(uri);
 442:     const previewProvider = await getPreviewContentProvider(sourceUri);
 443:     previewProvider.pandocExport(sourceUri);
 444:   }
 445: 
 446:   async function markdownExport(uri: string) {
 447:     const sourceUri = vscode.Uri.parse(uri);
 448:     const previewProvider = await getPreviewContentProvider(sourceUri);
 449:     previewProvider.markdownExport(sourceUri);
 450:   }
 451: 
 452:   /*
 453:   function cacheSVG(uri, code, svg) {
 454:     const sourceUri = vscode.Uri.parse(uri);
 455:     contentProvider.cacheSVG(sourceUri, code, svg)
 456:   }
 457:   */
 458: 
 459:   async function cacheCodeChunkResult(uri: string, id: string, result: string) {
 460:     const sourceUri = vscode.Uri.parse(uri);
 461:     const previewProvider = await getPreviewContentProvider(sourceUri);
 462:     previewProvider.cacheCodeChunkResult(sourceUri, id, result);
 463:   }
 464: 
 465:   async function runCodeChunk(uri: string, codeChunkId: string) {
 466:     const sourceUri = vscode.Uri.parse(uri);
 467:     const previewProvider = await getPreviewContentProvider(sourceUri);
 468:     previewProvider.runCodeChunk(sourceUri, codeChunkId);
 469:   }
 470: 
 471:   async function runAllCodeChunks(uri: string) {
 472:     const sourceUri = vscode.Uri.parse(uri);
 473:     const previewProvider = await getPreviewContentProvider(sourceUri);
 474:     previewProvider.runAllCodeChunks(sourceUri);
 475:   }
 476: 
 477:   async function runAllCodeChunksCommand() {
 478:     const textEditor = vscode.window.activeTextEditor;
 479:     if (!textEditor?.document) {
 480:       return;
 481:     }
 482:     if (!isMarkdownFile(textEditor.document)) {
 483:       return;
 484:     }
 485: 
 486:     const sourceUri = textEditor.document.uri;
 487:     const previewUri = getPreviewUri(sourceUri);
 488:     if (!previewUri) {
 489:       return;
 490:     }
 491: 
 492:     const previewProvider = await getPreviewContentProvider(sourceUri);
 493:     previewProvider.postMessageToPreview(sourceUri, {
 494:       command: 'runAllCodeChunks',
 495:     });
 496:   }
 497: 
 498:   async function runCodeChunkCommand() {
 499:     const textEditor = vscode.window.activeTextEditor;
 500:     if (!textEditor?.document) {
 501:       return;
 502:     }
 503:     if (!isMarkdownFile(textEditor.document)) {
 504:       return;
 505:     }
 506: 
 507:     const sourceUri = textEditor.document.uri;
 508:     const previewUri = getPreviewUri(sourceUri);
 509:     if (!previewUri) {
 510:       return;
 511:     }
 512:     const previewProvider = await getPreviewContentProvider(sourceUri);
 513:     previewProvider.postMessageToPreview(sourceUri, {
 514:       command: 'runCodeChunk',
 515:     });
 516:   }
 517: 
 518:   async function syncPreview() {
 519:     const textEditor = vscode.window.activeTextEditor;
 520:     if (!textEditor?.document) {
 521:       return;
 522:     }
 523:     if (!isMarkdownFile(textEditor.document)) {
 524:       return;
 525:     }
 526: 
 527:     const sourceUri = textEditor.document.uri;
 528:     const previewProvider = await getPreviewContentProvider(sourceUri);
 529:     previewProvider.postMessageToPreview(sourceUri, {
 530:       command: 'changeTextEditorSelection',
 531:       line: textEditor.selections[0].active.line,
 532:       forced: true,
 533:     });
 534:   }
 535: 
 536:   function clickTaskListCheckbox(uri: string, dataLine: number) {
 537:     const sourceUri = vscode.Uri.parse(uri);
 538:     const visibleTextEditors = vscode.window.visibleTextEditors;
 539:     for (let i = 0; i < visibleTextEditors.length; i++) {
 540:       const editor = visibleTextEditors[i];
 541:       if (editor.document.uri.fsPath === sourceUri.fsPath) {
 542:         editor.edit((edit) => {
 543:           let line = editor.document.lineAt(dataLine).text;
 544:           if (line.match(/\[ \]/)) {
 545:             line = line.replace('[ ]', '[x]');
 546:           } else {
 547:             line = line.replace(/\[[xX]\]/, '[ ]');
 548:           }
 549:           edit.replace(
 550:             new vscode.Range(
 551:               new vscode.Position(dataLine, 0),
 552:               new vscode.Position(dataLine, line.length),
 553:             ),
 554:             line,
 555:           );
 556:         });
 557:         break;
 558:       }
 559:     }
 560:   }
 561: 
 562:   function setPreviewTheme(_uri: string, theme: string) {
 563:     updateMPEConfig('previewTheme', theme, true);
 564:   }
 565: 
 566:   function togglePreviewZenMode(_uri: string) {
 567:     updateMPEConfig(
 568:       'enablePreviewZenMode',
 569:       !getMPEConfig<boolean>('enablePreviewZenMode'),
 570:       true,
 571:     );
 572:   }
 573: 
 574:   function setCodeBlockTheme(_uri: string, theme: string) {
 575:     updateMPEConfig('codeBlockTheme', theme, true);
 576:   }
 577: 
 578:   function setRevealjsTheme(_uri: string, theme: string) {
 579:     updateMPEConfig('revealjsTheme', theme, true);
 580:   }
 581: 
 582:   function setImageUploader(imageUploader: string) {
 583:     updateMPEConfig('imageUploader', imageUploader, true);
 584:   }
 585: 
 586:   function openConfigFileInWorkspace(
 587:     workspaceUri: vscode.Uri,
 588:     filePath: vscode.Uri,
 589:   ) {
 590:     vscode.workspace.fs.stat(filePath).then(
 591:       () => {
 592:         vscode.commands.executeCommand('vscode.open', filePath);
 593:       },
 594:       async () => {
 595:         await notebooksManager.updateNotebookConfig(workspaceUri, true);
 596:         vscode.commands.executeCommand('vscode.open', filePath);
 597:       },
 598:     );
 599:   }
 600: 
 601:   function customizeCSSInWorkspace() {
 602:     const currentWorkingDirectory = getCurrentWorkingDirectory();
 603:     if (!currentWorkingDirectory) {
 604:       return vscode.window.showErrorMessage(
 605:         'Please open a folder before customizing CSS',
 606:       );
 607:     }
 608:     const styleLessFile = vscode.Uri.joinPath(
 609:       currentWorkingDirectory,
 610:       './.crossnote/style.less',
 611:     );
 612: 
 613:     openConfigFileInWorkspace(currentWorkingDirectory, styleLessFile);
 614:   }
 615: 
 616:   function openConfigScriptInWorkspace() {
 617:     const currentWorkingDirectory = getCurrentWorkingDirectory();
 618:     if (!currentWorkingDirectory) {
 619:       return vscode.window.showErrorMessage(
 620:         'Please open a folder before customizing config script',
 621:       );
 622:     }
 623: 
 624:     const configScriptPath = vscode.Uri.joinPath(
 625:       currentWorkingDirectory,
 626:       './.crossnote/config.js',
 627:     );
 628: 
 629:     openConfigFileInWorkspace(currentWorkingDirectory, configScriptPath);
 630:   }
 631: 
 632:   function extendParserInWorkspace() {
 633:     const currentWorkingDirectory = getCurrentWorkingDirectory();
 634:     if (!currentWorkingDirectory) {
 635:       return vscode.window.showErrorMessage(
 636:         'Please open a folder before extending parser',
 637:       );
 638:     }
 639: 
 640:     const parserConfigPath = vscode.Uri.joinPath(
 641:       currentWorkingDirectory,
 642:       './.crossnote/parser.js',
 643:     );
 644: 
 645:     openConfigFileInWorkspace(currentWorkingDirectory, parserConfigPath);
 646:   }
 647: 
 648:   function customizePreviewHtmlHeadInWorkspace() {
 649:     const currentWorkingDirectory = getCurrentWorkingDirectory();
 650:     if (!currentWorkingDirectory) {
 651:       return vscode.window.showErrorMessage(
 652:         'Please open a folder before customizing preview html head',
 653:       );
 654:     }
 655: 
 656:     const headHtmlPath = vscode.Uri.joinPath(
 657:       currentWorkingDirectory,
 658:       './.crossnote/head.html',
 659:     );
 660: 
 661:     openConfigFileInWorkspace(currentWorkingDirectory, headHtmlPath);
 662:   }
 663: 
 664:   async function clickTagA({
 665:     uri: _uri,
 666:     href,
 667:     scheme,
 668:   }: {
 669:     uri: string;
 670:     href: string;
 671:     scheme: string;
 672:   }) {
 673:     href = decodeURIComponent(href);
 674:     href = href
 675:       .replace(/^vscode-resource:\/\//, '')
 676:       .replace(/^vscode-webview-resource:\/\/(.+?)\//, '')
 677:       .replace(/^file\/\/\//, '${scheme}:///')
 678:       // VSCode's webview resource URLs encode the source URI's authority
 679:       // into the host as `file+<encoded-authority>.vscode-resource.vscode-cdn.net`.
 680:       // Non-[a-z0-9-] chars in the authority are encoded as `-XXXX` (4-digit
 681:       // hex char code; e.g. `.` -> `-002e`). Decode it back so that
 682:       // workspaces on a remote host (WSL via \\wsl.localhost\, SSH-Remote)
 683:       // keep their authority when handed to `vscode.Uri.parse`. The
 684:       // catch-all replacement below strips the entire host, yielding a
 685:       // broken `file:///Ubuntu/...` URI whose fsPath has no UNC prefix and
 686:       // resolves to nothing on the local Windows filesystem.
 687:       .replace(
 688:         /^https:\/\/file\+([^./]*)\.vscode-resource\.vscode-cdn\.net\//,
 689:         (_match, encodedAuthority: string) => {
 690:           const authority = encodedAuthority.replace(
 691:             /-([0-9a-f]{4})/gi,
 692:             (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)),
 693:           );
 694:           return `${scheme}://${authority}/`;
 695:         },
 696:       )
 697:       .replace(/^https:\/\/.+\.vscode-cdn.net\//, `${scheme}:///`)
 698:       .replace(
 699:         /^https?:\/\/(.+?)\.vscode-webview-test.com\/vscode-resource\/file\/+/,
 700:         `${scheme}:///`,
 701:       )
 702:       .replace(
 703:         /^https?:\/\/file(.+?)\.vscode-webview\.net\/+/,
 704:         `${scheme}:///`,
 705:       );
 706:     if (
 707:       ['.pdf', '.xls', '.xlsx', '.doc', '.ppt', '.docx', '.pptx'].indexOf(
 708:         path.extname(href),
 709:       ) >= 0
 710:     ) {
 711:       try {
 712:         utility.openFile(href);
 713:       } catch (error) {
 714:         vscode.window.showErrorMessage(String(error));
 715:       }
 716:     } else if (href.startsWith(`${scheme}://`)) {
 717:       // openFilePath = href.slice(8) # remove protocol
 718:       const openFilePath = decodeURI(href);
 719:       const fileUri = vscode.Uri.parse(openFilePath);
 720: 
 721:       // determine from link fragment to which line to jump
 722:       let line = -1;
 723:       const found = fileUri.fragment.match(/^L(\d+)/);
 724:       if (found) {
 725:         line = parseInt(found[1], 10);
 726:         if (line > 0) {
 727:           line = line - 1;
 728:         }
 729:       }
 730: 
 731:       // find if there is already opened such file
 732:       // and remember in which view column it is
 733:       let col = vscode.ViewColumn.One;
 734:       tgrLoop: for (const tabGroup of vscode.window.tabGroups.all) {
 735:         for (const tab of tabGroup.tabs) {
 736:           if (tab.input instanceof vscode.TabInputText) {
 737:             if (tab.input.uri.path === fileUri.path) {
 738:               col = tabGroup.viewColumn;
 739:               break tgrLoop;
 740:             }
 741:           }
 742:         }
 743:       }
 744: 
 745:       //  open file if needed, if not we will use already opened editor
 746:       // (by specifying view column in which it is already shown)
 747:       let fileExists: boolean;
 748:       try {
 749:         fileExists = !!(await vscode.workspace.fs.stat(fileUri));
 750:       } catch {
 751:         fileExists = false;
 752:       }
 753: 
 754:       // Obsidian-style click-to-create: if the wikilink target is a
 755:       // markdown file (per `markdownFileExtensions`) that doesn't
 756:       // exist yet, write an empty stub so the editor below opens a
 757:       // real file instead of falling through to `vscode.open` and
 758:       // showing a "File not found" prompt.  No-op for other URI
 759:       // types (URLs, attachments, missing-but-non-markdown).
 760:       if (!fileExists && (await createMissingMarkdownNote(fileUri))) {
 761:         fileExists = true;
 762:       }
 763: 
 764:       if (fileExists) {
 765:         const previewMode = getPreviewMode();
 766:         const document = await vscode.workspace.openTextDocument(
 767:           vscode.Uri.parse(
 768:             openFilePath.split('#').slice(0, -1).join('#') || openFilePath,
 769:           ),
 770:         );
 771:         // Open custom editor
 772:         if (
 773:           previewMode === PreviewMode.PreviewsOnly &&
 774:           isMarkdownFile(document)
 775:         ) {
 776:           /*
 777:           // NOTE: This doesn't work for the `line`
 778:           // so we use the `initPreview` instead.
 779:           const options: vscode.TextDocumentShowOptions = {
 780:             selection: new vscode.Selection(line, 0, line, 0),
 781:             viewColumn: vscode.ViewColumn.Active,
 782:           };
 783:           vscode.commands.executeCommand(
 784:             'vscode.openWith',
 785:             fileUri,
 786:             'markdown-preview-enhanced',
 787:             options,
 788:           );
 789:           */
 790:           const previewProvider = await getPreviewContentProvider(fileUri);
 791:           previewProvider.initPreview({
 792:             sourceUri: fileUri,
 793:             document,
 794:             cursorLine: line,
 795:             viewOptions: {
 796:               viewColumn: vscode.ViewColumn.Active,
 797:               preserveFocus: true,
 798:             },
 799:           });
 800:         } else {
 801:           // Open fileUri
 802:           const editor = await vscode.window.showTextDocument(document, {
 803:             viewColumn: col,
 804:           });
 805:           // if there was line fragment, jump to line
 806:           if (line >= 0) {
 807:             let viewPos = vscode.TextEditorRevealType.InCenter;
 808:             if (editor.selection.active.line === line) {
 809:               viewPos = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
 810:             }
 811:             const sel = new vscode.Selection(line, 0, line, 0);
 812:             editor.selection = sel;
 813:             editor.revealRange(sel, viewPos);
 814:           } else if (fileUri.fragment) {
 815:             // Normal fragment.  Try, in order:
 816:             //   1. Block-id reference (^abc) — match the LAST `^id` in
 817:             //      the fragment so combined `Heading^abc` works too.
 818:             //   2. Heading-id reference — match by HeadingIdGenerator.
 819:             const targetLine = findFragmentTargetLine(
 820:               editor.document.getText(),
 821:               fileUri.fragment,
 822:             );
 823:             if (targetLine >= 0) {
 824:               let viewPos = vscode.TextEditorRevealType.InCenter;
 825:               if (editor.selection.active.line === targetLine) {
 826:                 viewPos = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
 827:               }
 828:               const sel = new vscode.Selection(targetLine, 0, targetLine, 0);
 829:               editor.selection = sel;
 830:               editor.revealRange(sel, viewPos);
 831:             }
 832:           }
 833:         }
 834:       } else {
 835:         vscode.commands.executeCommand(
 836:           'vscode.open',
 837:           fileUri,
 838:           vscode.ViewColumn.One,
 839:         );
 840:       }
 841:     } else if (href.match(/^https?:\/\//)) {
 842:       vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(href));
 843:     } else {
 844:       utility.openFile(href);
 845:     }
 846:   }
 847: 
 848:   async function clickTag({
 849:     uri,
 850:     tag,
 851:     scheme,
 852:   }: {
 853:     uri: string;
 854:     tag: string;
 855:     scheme: string;
 856:   }) {
 857:     if (!tag) {
 858:       return;
 859:     }
 860:     // Use crossnote's global tag index (TagReferenceMap) to find every
 861:     // note that mentions `#tag`.  This is exactly the data the
 862:     // Obsidian "Tags" pane works off — backlinks for files, separate
 863:     // tag index for tags.
 864:     const contextUri = uri ? vscode.Uri.parse(uri) : undefined;
 865:     if (!contextUri) {
 866:       return;
 867:     }
 868:     let notes: import('crossnote').Notes;
 869:     try {
 870:       notes = await notebooksManager.getNotesReferringToTag(contextUri, tag);
 871:     } catch (error) {
 872:       console.error('[MPE] clickTag lookup failed:', error);
 873:       vscode.window.showErrorMessage(
 874:         `MPE: failed to look up tag #${tag}: ${error instanceof Error ? error.message : String(error)}`,
 875:       );
 876:       return;
 877:     }
 878: 
 879:     const filePaths = Object.keys(notes);
 880:     if (filePaths.length === 0) {
 881:       vscode.window.showInformationMessage(`No notes mention #${tag}.`);
 882:       return;
 883:     }
 884: 
 885:     type Item = vscode.QuickPickItem & { fsPath: string };
 886:     const items: Item[] = filePaths.sort().map((relPath) => {
 887:       const note = notes[relPath];
 888:       const fsPath = vscode.Uri.joinPath(
 889:         note.notebookPath,
 890:         note.filePath,
 891:       ).fsPath;
 892:       return {
 893:         label: note.title || relPath,
 894:         description: relPath,
 895:         fsPath,
 896:       };
 897:     });
 898: 
 899:     const picked = await vscode.window.showQuickPick(items, {
 900:       placeHolder: `Notes mentioning #${tag} (${items.length})`,
 901:       matchOnDescription: true,
 902:     });
 903:     if (!picked) {
 904:       return;
 905:     }
 906:     // Open the picked note via the existing clickTagA pipeline so the
 907:     // file gets revealed in the right column and the previewMode is
 908:     // honoured (custom preview editor vs text editor).  Build the URI
 909:     // via `vscode.Uri.file(...)` so backslashes in `picked.fsPath` on
 910:     // Windows get converted to a proper `file:///C:/...` form;
 911:     // template-string concat (`${scheme}://${picked.fsPath}`) would
 912:     // produce a malformed `file://C:\foo\bar`.
 913:     const pickedUri = vscode.Uri.file(picked.fsPath);
 914:     await clickTagA({
 915:       uri,
 916:       href: encodeURIComponent(pickedUri.toString()),
 917:       scheme,
 918:     });
 919:   }
 920: 
 921:   async function openChangelog() {
 922:     const url =
 923:       'https://github.com/shd101wyy/vscode-markdown-preview-enhanced/releases';
 924:     return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
 925:   }
 926: 
 927:   async function openDocumentation() {
 928:     const url = 'https://shd101wyy.github.io/markdown-preview-enhanced/';
 929:     return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
 930:   }
 931: 
 932:   async function openIssues() {
 933:     const url =
 934:       'https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues';
 935:     vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
 936:   }
 937: 
 938:   async function openSponsors() {
 939:     const url = 'https://github.com/sponsors/shd101wyy/';
 940:     vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
 941:   }
 942: 
 943:   async function openExternalEditor(uri: string) {
 944:     const sourceUri = vscode.Uri.parse(uri);
 945:     const document = await vscode.workspace.openTextDocument(sourceUri);
 946:     await vscode.window.showTextDocument(document, {
 947:       preview: false,
 948:       viewColumn: vscode.ViewColumn.Active,
 949:     });
 950:   }
 951: 
 952:   async function showBacklinks({
 953:     uri,
 954:     forceRefreshingNotes,
 955:     backlinksSha,
 956:   }: {
 957:     uri: string;
 958:     forceRefreshingNotes: boolean;
 959:     backlinksSha: string;
 960:   }) {
 961:     const sourceUri = vscode.Uri.parse(uri);
 962:     const backlinks = await notebooksManager.getNoteBacklinks(
 963:       sourceUri,
 964:       forceRefreshingNotes,
 965:     );
 966:     const sha = SHA256(JSON.stringify(backlinks)).toString();
 967:     const previewProvider = await getPreviewContentProvider(sourceUri);
 968:     previewProvider.postMessageToPreview(sourceUri, {
 969:       command: 'backlinks',
 970:       sourceUri: sourceUri.toString(),
 971:       backlinks: sha !== backlinksSha ? backlinks : null,
 972:       hasUpdate: sha !== backlinksSha,
 973:     });
 974:   }
 975: 
 976:   async function updateMarkdown(uri: string, markdown: string) {
 977:     try {
 978:       const sourceUri = vscode.Uri.parse(uri);
 979: 
 980:       const allowedExts =
 981:         getMPEConfig<string[]>('markdownFileExtensions') ?? [];
 982:       const ext = path.extname(sourceUri.path).toLowerCase();
 983:       if (!ext || !allowedExts.includes(ext)) {
 984:         return;
 985:       }
 986: 
 987:       // Write markdown to file
 988:       await vscode.workspace.fs.writeFile(sourceUri, Buffer.from(markdown));
 989:       // Update preview
 990:       const previewProvider = await getPreviewContentProvider(sourceUri);
 991:       previewProvider.updateMarkdown(sourceUri);
 992:     } catch (error) {
 993:       vscode.window.showErrorMessage(String(error));
 994:       console.error(error);
 995:     }
 996:   }
 997: 
 998:   async function toggleAlwaysShowBacklinksInPreview(
 999:     _uri: string,
1000:     flag: boolean,
1001:   ) {
1002:     updateMPEConfig('alwaysShowBacklinksInPreview', flag, true);
1003:   }
1004: 
1005:   context.subscriptions.push(
1006:     vscode.workspace.onDidSaveTextDocument(async (document) => {
1007:       if (isMarkdownFile(document)) {
1008:         const previewProvider = await getPreviewContentProvider(document.uri);
1009:         previewProvider.updateMarkdown(document.uri, true);
1010:       } else {
1011:         // Check if there is change under `${workspaceDir}/.crossnote` directory
1012:         // and the filename is in one of below
1013:         // - style.less
1014:         // - config.js
1015:         // - parser.js
1016:         // - head.html
1017:         // If so, refresh the preview of the workspace.
1018:         const workspaceUri = getWorkspaceFolderUri(document.uri);
1019:         const workspaceDir = workspaceUri.fsPath;
1020:         const relativePath = path.relative(workspaceDir, document.uri.fsPath);
1021:         if (
1022:           relativePath.startsWith('.crossnote') &&
1023:           ['style.less', 'config.js', 'parser.js', 'head.html'].includes(
1024:             path.basename(relativePath),
1025:           )
1026:         ) {
1027:           const provider = await getPreviewContentProvider(document.uri);
1028:           await notebooksManager.updateNotebookConfig(workspaceUri);
1029:           provider.refreshAllPreviews();
1030:         }
1031:       }
1032:     }),
1033:   );
1034: 
1035:   context.subscriptions.push(
1036:     vscode.workspace.onDidDeleteFiles(async ({ files }) => {
1037:       for (const file of files) {
1038:         // Check if there is change under `${workspaceDir}/.crossnote` directory
1039:         // and filename is in one of below
1040:         // - style.less
1041:         // - config.js
1042:         // - parser.js
1043:         // - head.html
1044:         // If so, refresh the preview of the workspace.
1045:         const workspaceUri = getWorkspaceFolderUri(file);
1046:         const workspaceDir = workspaceUri.fsPath;
1047:         const relativePath = path.relative(workspaceDir, file.fsPath);
1048:         if (
1049:           relativePath.startsWith('.crossnote') &&
1050:           ['style.less', 'config.js', 'parser.js', 'head.html'].includes(
1051:             path.basename(relativePath),
1052:           )
1053:         ) {
1054:           const provider = await getPreviewContentProvider(file);
1055:           await notebooksManager.updateNotebookConfig(workspaceUri);
1056:           provider.refreshAllPreviews();
1057:         }
1058:       }
1059:     }),
1060:   );
1061: 
1062:   context.subscriptions.push(
1063:     vscode.workspace.onDidChangeTextDocument(async (event) => {
1064:       if (isMarkdownFile(event.document)) {
1065:         const previewProvider = await getPreviewContentProvider(
1066:           event.document.uri,
1067:         );
1068:         previewProvider.update(event.document.uri);
1069:       }
1070:     }),
1071:   );
1072: 
1073:   context.subscriptions.push(
1074:     vscode.workspace.onDidChangeConfiguration((event) => {
1075:       // console.log(
1076:       //   'onDidChangeConfiguration: ',
1077:       //   event.affectsConfiguration('markdown-preview-enhanced'),
1078:       // );
1079:       if (event.affectsConfiguration('markdown-preview-enhanced')) {
1080:         notebooksManager.updateAllNotebooksConfig();
1081:       }
1082:     }),
1083:   );
1084: 
1085:   context.subscriptions.push(
1086:     vscode.window.onDidChangeTextEditorSelection(async (event) => {
1087:       if (isMarkdownFile(event.textEditor.document)) {
1088:         const previewMode = getPreviewMode();
1089:         if (previewMode === PreviewMode.PreviewsOnly) {
1090:           return;
1091:         }
1092: 
1093:         const firstVisibleScreenRow = getTopVisibleLine(event.textEditor);
1094:         const lastVisibleScreenRow = getBottomVisibleLine(event.textEditor);
1095: 
1096:         if (
1097:           typeof firstVisibleScreenRow === 'undefined' ||
1098:           typeof lastVisibleScreenRow === 'undefined'
1099:         ) {
1100:           return;
1101:         }
1102: 
1103:         const topRatio =
1104:           (event.selections[0].active.line - firstVisibleScreenRow) /
1105:           (lastVisibleScreenRow - firstVisibleScreenRow);
1106: 
1107:         const previewProvider = await getPreviewContentProvider(
1108:           event.textEditor.document.uri,
1109:         );
1110:         previewProvider.postMessageToPreview(event.textEditor.document.uri, {
1111:           command: 'changeTextEditorSelection',
1112:           line: event.selections[0].active.line,
1113:           topRatio,
1114:         });
1115:       }
1116:     }),
1117:   );
1118: 
1119:   context.subscriptions.push(
1120:     vscode.window.onDidChangeTextEditorVisibleRanges(async (event) => {
1121:       const textEditor = event.textEditor as vscode.TextEditor;
1122:       if (Date.now() < editorScrollDelay) {
1123:         return;
1124:       }
1125:       if (isMarkdownFile(textEditor.document)) {
1126:         const sourceUri = textEditor.document.uri;
1127:         if (!event.textEditor.visibleRanges.length) {
1128:           return undefined;
1129:         } else {
1130:           const topLine = getTopVisibleLine(textEditor);
1131:           const bottomLine = getBottomVisibleLine(textEditor);
1132: 
1133:           if (
1134:             typeof topLine === 'undefined' ||
1135:             typeof bottomLine === 'undefined'
1136:           ) {
1137:             return;
1138:           }
1139: 
1140:           let midLine;
1141:           if (topLine === 0) {
1142:             midLine = 0;
1143:           } else if (
1144:             Math.floor(bottomLine) ===
1145:             textEditor.document.lineCount - 1
1146:           ) {
1147:             midLine = bottomLine;
1148:           } else {
1149:             midLine = Math.floor((topLine + bottomLine) / 2);
1150:           }
1151:           const previewProvider = await getPreviewContentProvider(sourceUri);
1152:           previewProvider.postMessageToPreview(sourceUri, {
1153:             command: 'changeTextEditorSelection',
1154:             line: midLine,
1155:           });
1156:         }
1157:       }
1158:     }),
1159:   );
1160: 
1161:   /**
1162:    * Open preview automatically if the `automaticallyShowPreviewOfMarkdownBeingEdited` is on.
1163:    */
1164:   context.subscriptions.push(
1165:     vscode.window.onDidChangeActiveTextEditor(async (editor) => {
1166:       // Check if editor and document exist
1167:       if (editor && editor.document && editor.document.uri) {
1168:         // Get the list of schemes to exclude from the configuration
1169:         const exclusionSchemes =
1170:           getMPEConfig<string[]>('disableAutoPreviewForUriSchemes') ?? [];
1171: 
1172:         // Check if the current document's scheme should be excluded
1173:         for (const scheme of exclusionSchemes) {
1174:           if (editor.document.uri.scheme.startsWith(scheme)) {
1175:             return; // Don't trigger preview if scheme matches exclusion list
1176:           }
1177:         }
1178: 
1179:         // Original check: Proceed only if it's considered a Markdown file
1180:         if (isMarkdownFile(editor.document)) {
1181:           // Check if the file matches any exclusion pattern
1182:           const exclusionPatterns = (
1183:             getMPEConfig<string[]>('disableAutoPreviewForFilePatterns') ?? []
1184:           ).filter((p): p is string => typeof p === 'string');
1185:           const fileName = path.basename(editor.document.fileName);
1186:           const excluded = exclusionPatterns.some((pattern) => {
1187:             // Simple wildcard matching: convert "*.note.md" to a regex
1188:             const escaped = pattern
1189:               .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
1190:               .replace(/\*/g, '.*');
1191:             return new RegExp(`^${escaped}$`, 'i').test(fileName);
1192:           });
1193: 
1194:           const sourceUri = editor.document.uri;
1195:           const automaticallyShowPreviewOfMarkdownBeingEdited =
1196:             getMPEConfig<boolean>(
1197:               'automaticallyShowPreviewOfMarkdownBeingEdited',
1198:             );
1199:           const previewMode = getPreviewMode();
1200:           /**
1201:            * Is using single preview and the preview is on.
1202:            * When we switched text ed()tor, update preview to that text editor.
1203:            */
1204:           const previewProvider = await getPreviewContentProvider(sourceUri);
1205:           if (previewProvider.isPreviewOn(sourceUri)) {
1206:             if (
1207:               previewMode === PreviewMode.SinglePreview &&
1208:               !previewProvider.previewHasTheSameSingleSourceUri(sourceUri)
1209:             ) {
1210:               // Don't switch a locked preview to a different file
1211:               if (previewProvider.isSinglePreviewLocked()) {
1212:                 return;
1213:               }
1214:               // Skip auto-switching single preview to an excluded file
1215:               if (!excluded) {
1216:                 await previewProvider.initPreview({
1217:                   sourceUri,
1218:                   document: editor.document,
1219:                   cursorLine: getEditorActiveCursorLine(editor),
1220:                   viewOptions: {
1221:                     viewColumn:
1222:                       previewProvider.getPreviews(sourceUri)?.[0]?.viewColumn ??
1223:                       vscode.ViewColumn.One,
1224:                     preserveFocus: true,
1225:                   },
1226:                 });
1227:               }
1228:             } else if (
1229:               previewMode === PreviewMode.MultiplePreviews &&
1230:               automaticallyShowPreviewOfMarkdownBeingEdited
1231:             ) {
1232:               // Only surface an already-open preview when the user has opted
1233:               // into auto-showing previews. Otherwise switching between
1234:               // markdown files force-reveals the matching preview tab to the
1235:               // front of its group on every switch, disrupting the editor
1236:               // layout (the preview is revealed with `preserveFocus`, so the
1237:               // cursor stays put, but the tab still jumps). Fixes #2286.
1238:               const previews = previewProvider.getPreviews(sourceUri);
1239:               if (previews && previews.length > 0) {
1240:                 previews[0].reveal(/*vscode.ViewColumn.Two*/ undefined, true);
1241:               }
1242:             }
1243:             // NOTE: For PreviewMode.PreviewsOnly, we don't need to do anything.
1244:           } else if (automaticallyShowPreviewOfMarkdownBeingEdited) {
1245:             // Skip auto-opening preview for an excluded file
1246:             if (!excluded) {
1247:               openPreviewToTheSide(sourceUri);
1248:             }
1249:           }
1250:         }
1251:       }
1252:     }),
1253:   );
1254: 
1255:   // Changed editor color theme
1256:   context.subscriptions.push(
1257:     vscode.window.onDidChangeActiveColorTheme((_theme) => {
1258:       if (
1259:         getMPEConfig<PreviewColorScheme>('previewColorScheme') ===
1260:         PreviewColorScheme.editorColorScheme
1261:       ) {
1262:         notebooksManager.updateAllNotebooksConfig();
1263:       }
1264:     }),
1265:   );
1266: 
1267:   /*
1268:   context.subscriptions.push(
1269:     vscode.workspace.onDidOpenTextDocument((document) => {
1270:       // console.log('onDidOpenTextDocument: ', document.uri.fsPath);
1271:     }),
1272:   );
1273:   */
1274: 
1275:   /*
1276:   context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(textEditors=> {
1277:     // console.log('onDidChangeonDidChangeVisibleTextEditors ', textEditors)
1278:   }))
1279:   */
1280: 
1281:   context.subscriptions.push(
1282:     vscode.commands.registerCommand(
1283:       'markdown-preview-enhanced.openPreviewToTheSide',
1284:       openPreviewToTheSide,
1285:     ),
1286:   );
1287: 
1288:   context.subscriptions.push(
1289:     vscode.commands.registerCommand(
1290:       'markdown-preview-enhanced.openPreview',
1291:       openPreview,
1292:     ),
1293:   );
1294: 
1295:   context.subscriptions.push(
1296:     vscode.commands.registerCommand(
1297:       'markdown-preview-enhanced.openLockedPreviewToTheSide',
1298:       openLockedPreviewToTheSide,
1299:     ),
1300:   );
1301: 
1302:   context.subscriptions.push(
1303:     vscode.commands.registerCommand(
1304:       'markdown-preview-enhanced.togglePreviewLock',
1305:       togglePreviewLock,
1306:     ),
1307:   );
1308: 
1309:   if (getMPEConfig<boolean>('enableWikiLinkSyntax')) {
1310:     context.subscriptions.push(
1311:       vscode.commands.registerCommand(
1312:         'markdown-preview-enhanced.copyBlockReference',
1313:         copyBlockReference,
1314:       ),
1315:     );
1316:   }
1317: 
1318:   // Wikilink autocomplete:
1319:   // ...
1320:   if (getMPEConfig<boolean>('enableWikiLinkSyntax')) {
1321:     const wikilinkCompletionProvider = new WikilinkCompletionProvider(
1322:       notebooksManager,
1323:     );
1324:     context.subscriptions.push(
1325:       vscode.languages.registerCompletionItemProvider(
1326:         [
1327:           { language: 'markdown', scheme: 'file' },
1328:           { language: 'markdown', scheme: 'untitled' },
1329:           { language: 'quarto', scheme: 'file' },
1330:           { language: 'quarto', scheme: 'untitled' },
1331:           { language: 'prompt', scheme: 'file' },
1332:           { language: 'prompt', scheme: 'untitled' },
1333:           { language: 'instructions', scheme: 'file' },
1334:           { language: 'instructions', scheme: 'untitled' },
1335:           { language: 'chatagent', scheme: 'file' },
1336:           { language: 'chatagent', scheme: 'untitled' },
1337:           { language: 'skill', scheme: 'file' },
1338:           { language: 'skill', scheme: 'untitled' },
1339:         ],
1340:         wikilinkCompletionProvider,
1341:         '[',
1342:         '#',
1343:         '^',
1344:       ),
1345:       wikilinkCompletionProvider,
1346:     );
1347:   }
1348: 
1349:   // Hover preview for `[[Note]]`, `[[Note#Heading]]`, `[[Note^block]]`,
1350:   // and the `![[…]]` embed forms.  The provider reads the target
1351:   // file and returns a MarkdownString with the relevant fragment
1352:   // (full file head, heading section, or block content).
1353:   if (getMPEConfig<boolean>('enableWikiLinkSyntax')) {
1354:     context.subscriptions.push(
1355:       vscode.languages.registerHoverProvider(
1356:         [
1357:           { language: 'markdown', scheme: 'file' },
1358:           { language: 'markdown', scheme: 'untitled' },
1359:           { language: 'quarto', scheme: 'file' },
1360:           { language: 'quarto', scheme: 'untitled' },
1361:           { language: 'prompt', scheme: 'file' },
1362:           { language: 'prompt', scheme: 'untitled' },
1363:           { language: 'instructions', scheme: 'file' },
1364:           { language: 'instructions', scheme: 'untitled' },
1365:           { language: 'chatagent', scheme: 'file' },
1366:           { language: 'chatagent', scheme: 'untitled' },
1367:           { language: 'skill', scheme: 'file' },
1368:           { language: 'skill', scheme: 'untitled' },
1369:         ],
1370:         new WikilinkHoverProvider(notebooksManager),
1371:       ),
1372:     );
1373:   }
1374: 
1375:   // Editor-side `Follow link` (alt+click / Ctrl+click) for
1376:   // `[[Note]]` / `![[Note]]` wikilinks.  Standard
1377:   // `[text](./Note.md)` links are already handled by VSCode's
1378:   // built-in markdown link provider; we only emit links for the
1379:   // wikilink shapes.  Click invokes `_crossnote.openWikilinkTarget`
1380:   // which auto-creates missing markdown notes (Obsidian-style)
1381:   // and jumps to fragment lines for `[[Note#Heading]]` /
1382:   // `[[Note^block]]`.
1383:   if (getMPEConfig<boolean>('enableWikiLinkSyntax')) {
1384:     context.subscriptions.push(
1385:       vscode.languages.registerDocumentLinkProvider(
1386:         [
1387:           { language: 'markdown', scheme: 'file' },
1388:           { language: 'markdown', scheme: 'untitled' },
1389:           { language: 'quarto', scheme: 'file' },
1390:           { language: 'quarto', scheme: 'untitled' },
1391:           { language: 'prompt', scheme: 'file' },
1392:           { language: 'prompt', scheme: 'untitled' },
1393:           { language: 'instructions', scheme: 'file' },
1394:           { language: 'instructions', scheme: 'untitled' },
1395:           { language: 'chatagent', scheme: 'file' },
1396:           { language: 'chatagent', scheme: 'untitled' },
1397:           { language: 'skill', scheme: 'file' },
1398:           { language: 'skill', scheme: 'untitled' },
1399:         ],
1400:         new WikilinkDocumentLinkProvider(notebooksManager),
1401:       ),
1402:       vscode.commands.registerCommand(
1403:         '_crossnote.openWikilinkTarget',
1404:         (sourceUriString: string, wikilinkBody: string) =>
1405:           openWikilinkTarget(sourceUriString, wikilinkBody, notebooksManager),
1406:       ),
1407:     );
1408:   }
1409: 
1410:   context.subscriptions.push(
1411:     vscode.commands.registerCommand(
1412:       'markdown-preview-enhanced.toggleScrollSync',
1413:       toggleScrollSync,
1414:     ),
1415:   );
1416: 
1417:   context.subscriptions.push(
1418:     vscode.commands.registerCommand(
1419:       'markdown-preview-enhanced.toggleLiveUpdate',
1420:       toggleLiveUpdate,
1421:     ),
1422:   );
1423: 
1424:   context.subscriptions.push(
1425:     vscode.commands.registerCommand(
1426:       'markdown-preview-enhanced.toggleBreakOnSingleNewLine',
1427:       toggleBreakOnSingleNewLine,
1428:     ),
1429:   );
1430: 
1431:   context.subscriptions.push(
1432:     vscode.commands.registerCommand(
1433:       'markdown-preview-enhanced.openImageHelper',
1434:       openImageHelper,
1435:     ),
1436:   );
1437: 
1438:   context.subscriptions.push(
1439:     vscode.commands.registerCommand(
1440:       'markdown-preview-enhanced.runAllCodeChunks',
1441:       runAllCodeChunksCommand,
1442:     ),
1443:   );
1444: 
1445:   context.subscriptions.push(
1446:     vscode.commands.registerCommand(
1447:       'markdown-preview-enhanced.runCodeChunk',
1448:       runCodeChunkCommand,
1449:     ),
1450:   );
1451: 
1452:   context.subscriptions.push(
1453:     vscode.commands.registerCommand(
1454:       'markdown-preview-enhanced.syncPreview',
1455:       syncPreview,
1456:     ),
1457:   );
1458: 
1459:   context.subscriptions.push(
1460:     vscode.commands.registerCommand(
1461:       'markdown-preview-enhanced.insertNewSlide',
1462:       insertNewSlide,
1463:     ),
1464:   );
1465: 
1466:   context.subscriptions.push(
1467:     vscode.commands.registerCommand(
1468:       'markdown-preview-enhanced.insertTable',
1469:       insertTable,
1470:     ),
1471:   );
1472: 
1473:   context.subscriptions.push(
1474:     vscode.commands.registerCommand(
1475:       'markdown-preview-enhanced.insertPagebreak',
1476:       insertPagebreak,
1477:     ),
1478:   );
1479: 
1480:   context.subscriptions.push(
1481:     vscode.commands.registerCommand(
1482:       'markdown-preview-enhanced.createTOC',
1483:       createTOC,
1484:     ),
1485:   );
1486: 
1487:   context.subscriptions.push(
1488:     vscode.commands.registerCommand('_crossnote.revealLine', revealLine),
1489:   );
1490: 
1491:   context.subscriptions.push(
1492:     vscode.commands.registerCommand(
1493:       '_crossnote.insertImageUrl',
1494:       insertImageUrl,
1495:     ),
1496:   );
1497: 
1498:   context.subscriptions.push(
1499:     vscode.commands.registerCommand(
1500:       '_crossnote.pasteImageFile',
1501:       pasteImageFile,
1502:     ),
1503:   );
1504: 
1505:   context.subscriptions.push(
1506:     vscode.commands.registerCommand(
1507:       '_crossnote.uploadImageFile',
1508:       uploadImageFile,
1509:     ),
1510:   );
1511: 
1512:   context.subscriptions.push(
1513:     vscode.commands.registerCommand(
1514:       '_crossnote.refreshPreview',
1515:       refreshPreview,
1516:     ),
1517:   );
1518: 
1519:   context.subscriptions.push(
1520:     vscode.commands.registerCommand('_crossnote.openInBrowser', openInBrowser),
1521:   );
1522: 
1523:   context.subscriptions.push(
1524:     vscode.commands.registerCommand('_crossnote.htmlExport', htmlExport),
1525:   );
1526: 
1527:   context.subscriptions.push(
1528:     vscode.commands.registerCommand('_crossnote.chromeExport', chromeExport),
1529:   );
1530: 
1531:   context.subscriptions.push(
1532:     vscode.commands.registerCommand('_crossnote.princeExport', princeExport),
1533:   );
1534: 
1535:   context.subscriptions.push(
1536:     vscode.commands.registerCommand('_crossnote.eBookExport', eBookExport),
1537:   );
1538: 
1539:   context.subscriptions.push(
1540:     vscode.commands.registerCommand('_crossnote.pandocExport', pandocExport),
1541:   );
1542: 
1543:   context.subscriptions.push(
1544:     vscode.commands.registerCommand(
1545:       '_crossnote.markdownExport',
1546:       markdownExport,
1547:     ),
1548:   );
1549: 
1550:   context.subscriptions.push(
1551:     vscode.commands.registerCommand(
1552:       '_crossnote.webviewFinishLoading',
1553:       webviewFinishLoading,
1554:     ),
1555:   );
1556: 
1557:   context.subscriptions.push(
1558:     vscode.commands.registerCommand(
1559:       '_crossnote.cacheCodeChunkResult',
1560:       cacheCodeChunkResult,
1561:     ),
1562:   );
1563: 
1564:   context.subscriptions.push(
1565:     vscode.commands.registerCommand('_crossnote.runCodeChunk', runCodeChunk),
1566:   );
1567: 
1568:   context.subscriptions.push(
1569:     vscode.commands.registerCommand(
1570:       '_crossnote.runAllCodeChunks',
1571:       runAllCodeChunks,
1572:     ),
1573:   );
1574: 
1575:   context.subscriptions.push(
1576:     vscode.commands.registerCommand(
1577:       '_crossnote.clickTaskListCheckbox',
1578:       clickTaskListCheckbox,
1579:     ),
1580:   );
1581: 
1582:   context.subscriptions.push(
1583:     vscode.commands.registerCommand(
1584:       '_crossnote.setPreviewTheme',
1585:       setPreviewTheme,
1586:     ),
1587:   );
1588: 
1589:   context.subscriptions.push(
1590:     vscode.commands.registerCommand(
1591:       '_crossnote.togglePreviewZenMode',
1592:       togglePreviewZenMode,
1593:     ),
1594:   );
1595: 
1596:   context.subscriptions.push(
1597:     vscode.commands.registerCommand(
1598:       '_crossnote.setCodeBlockTheme',
1599:       setCodeBlockTheme,
1600:     ),
1601:   );
1602: 
1603:   context.subscriptions.push(
1604:     vscode.commands.registerCommand(
1605:       '_crossnote.setRevealjsTheme',
1606:       setRevealjsTheme,
1607:     ),
1608:   );
1609: 
1610:   context.subscriptions.push(
1611:     vscode.commands.registerCommand(
1612:       '_crossnote.setImageUploader',
1613:       setImageUploader,
1614:     ),
1615:   );
1616: 
1617:   context.subscriptions.push(
1618:     vscode.commands.registerCommand('_crossnote.openChangelog', openChangelog),
1619:   );
1620: 
1621:   context.subscriptions.push(
1622:     vscode.commands.registerCommand(
1623:       '_crossnote.openDocumentation',
1624:       openDocumentation,
1625:     ),
1626:   );
1627: 
1628:   context.subscriptions.push(
1629:     vscode.commands.registerCommand('_crossnote.openIssues', openIssues),
1630:   );
1631: 
1632:   context.subscriptions.push(
1633:     vscode.commands.registerCommand('_crossnote.openSponsors', openSponsors),
1634:   );
1635: 
1636:   context.subscriptions.push(
1637:     vscode.commands.registerCommand(
1638:       '_crossnote.openExternalEditor',
1639:       openExternalEditor,
1640:     ),
1641:   );
1642: 
1643:   context.subscriptions.push(
1644:     vscode.commands.registerCommand(
1645:       'markdown-preview-enhanced.customizeCssInWorkspace',
1646:       customizeCSSInWorkspace,
1647:     ),
1648:   );
1649: 
1650:   context.subscriptions.push(
1651:     vscode.commands.registerCommand(
1652:       'markdown-preview-enhanced.openConfigScriptInWorkspace',
1653:       openConfigScriptInWorkspace,
1654:     ),
1655:   );
1656: 
1657:   context.subscriptions.push(
1658:     vscode.commands.registerCommand(
1659:       'markdown-preview-enhanced.extendParserInWorkspace',
1660:       extendParserInWorkspace,
1661:     ),
1662:   );
1663: 
1664:   context.subscriptions.push(
1665:     vscode.commands.registerCommand(
1666:       'markdown-preview-enhanced.customizePreviewHtmlHeadInWorkspace',
1667:       customizePreviewHtmlHeadInWorkspace,
1668:     ),
1669:   );
1670: 
1671:   context.subscriptions.push(
1672:     vscode.commands.registerCommand('_crossnote.clickTagA', clickTagA),
1673:   );
1674: 
1675:   context.subscriptions.push(
1676:     vscode.commands.registerCommand('_crossnote.clickTag', clickTag),
1677:   );
1678: 
1679:   context.subscriptions.push(
1680:     vscode.commands.registerCommand('_crossnote.showBacklinks', showBacklinks),
1681:   );
1682: 
1683:   context.subscriptions.push(
1684:     vscode.commands.registerCommand(
1685:       '_crossnote.updateMarkdown',
1686:       updateMarkdown,
1687:     ),
1688:   );
1689: 
1690:   context.subscriptions.push(
1691:     vscode.commands.registerCommand(
1692:       '_crossnote.toggleAlwaysShowBacklinksInPreview',
1693:       toggleAlwaysShowBacklinksInPreview,
1694:     ),
1695:   );
1696: 
1697:   context.subscriptions.push(
1698:     vscode.window.registerCustomEditorProvider(
1699:       'markdown-preview-enhanced',
1700:       new PreviewCustomEditorProvider(context),
1701:     ),
1702:   );
1703: 
1704:   // Graph view
1705:   GraphViewProvider.notebooksManager = notebooksManager;
1706:   GraphViewProvider.init(context);
1707: 
1708:   context.subscriptions.push(
1709:     vscode.commands.registerCommand(
1710:       'markdown-preview-enhanced.openGraphView',
1711:       async () => {
1712:         const activeUri = vscode.window.activeTextEditor?.document.uri;
1713:         await GraphViewProvider.openGraphView(context, activeUri);
1714:       },
1715:     ),
1716:   );
1717: 
1718:   context.subscriptions.push(
1719:     vscode.commands.registerCommand(
1720:       '_crossnote.openGraphView',
1721:       async (sourceUri: string) => {
1722:         const uri = vscode.Uri.parse(sourceUri);
1723:         await GraphViewProvider.openGraphView(context, uri);
1724:       },
1725:     ),
1726:   );
1727: 
1728:   // Refresh graph view when any markdown document is saved (force-rebuild relations)
1729:   context.subscriptions.push(
1730:     vscode.workspace.onDidSaveTextDocument(async (doc) => {
1731:       if (isMarkdownFile(doc)) {
1732:         await GraphViewProvider.refreshGraphData(doc.uri, true);
1733:       }
1734:     }),
1735:   );
1736: 
1737:   // Update active file highlight in graph view when editor changes
1738:   context.subscriptions.push(
1739:     vscode.window.onDidChangeActiveTextEditor(async (editor) => {
1740:       if (editor && isMarkdownFile(editor.document)) {
1741:         await GraphViewProvider.sendActiveFile(editor.document.uri);
1742:       }
1743:     }),
1744:   );
1745: }
1746: 
1747: function revealLine(uri: string, line: number) {
1748:   const sourceUri = vscode.Uri.parse(uri);
1749: 
1750:   vscode.window.visibleTextEditors
1751:     .filter(
1752:       (editor) =>
1753:         isMarkdownFile(editor.document) &&
1754:         editor.document.uri.fsPath === sourceUri.fsPath,
1755:     )
1756:     .forEach((editor) => {
1757:       const sourceLine = Math.min(
1758:         Math.floor(line),
1759:         editor.document.lineCount - 1,
1760:       );
1761:       const fraction = line - sourceLine;
1762:       const text = editor.document.lineAt(sourceLine).text;
1763:       const start = Math.floor(fraction * text.length);
1764:       editorScrollDelay = Date.now() + 500;
1765:       editor.revealRange(
1766:         new vscode.Range(sourceLine, start, sourceLine + 1, 0),
1767:         vscode.TextEditorRevealType.InCenter,
1768:       );
1769:       editorScrollDelay = Date.now() + 500;
1770:     });
1771: }
````

## File: src/preview-provider.ts
````typescript
   1: import { Mutex } from 'async-mutex';
   2: import { ImageUploader, Notebook, PreviewMode, utility } from 'crossnote';
   3: import { tmpdir } from 'os';
   4: import * as path from 'path';
   5: import * as vscode from 'vscode';
   6: import { Uri } from 'vscode';
   7: import { getMPEConfig } from './config';
   8: import NotebooksManager from './notebooks-manager';
   9: import {
  10:   getCrossnoteVersion,
  11:   getPreviewMode,
  12:   getWorkspaceFolderUri,
  13:   globalConfigPath,
  14:   isMarkdownFile,
  15:   isVSCodeWebExtension,
  16:   isVSCodewebExtensionDevMode,
  17: } from './utils';
  18: 
  19: if (isVSCodeWebExtension()) {
  20:   console.debug('* Using crossnote version: ', getCrossnoteVersion());
  21:   if (isVSCodewebExtensionDevMode()) {
  22:     console.debug('* Now under the dev mode');
  23:     console.debug('* Loading /crossnote directory at http://localhost:6789/');
  24:     utility.setCrossnoteBuildDirectory('http://localhost:6789/');
  25:   } else {
  26:     const jsdelivrCdnHost =
  27:       getMPEConfig<string>('jsdelivrCdnHost') ?? 'cdn.jsdelivr.net';
  28:     utility.setCrossnoteBuildDirectory(
  29:       `https://${jsdelivrCdnHost}/npm/crossnote@${getCrossnoteVersion()}/out/`,
  30:     );
  31:   }
  32: } else {
  33:   // NOTE: The __dirname is actually the out/native folder
  34:   utility.setCrossnoteBuildDirectory(
  35:     path.resolve(__dirname, '../../crossnote/'),
  36:   );
  37: }
  38: 
  39: utility.useExternalAddFileProtocolFunction((filePath, preview) => {
  40:   if (preview) {
  41:     // path.join('https://host/', './rel') → 'https:/host/rel' (single slash)
  42:     // path.resolve('https://host/', './rel') → '/cwd/https:/host/rel' (abs path with embedded URL)
  43:     // Both are detected by finding 'http(s):/' followed by a non-slash character anywhere in the path.
  44:     const urlMatch = filePath.match(/(https?):\/([^/].*)/);
  45:     if (urlMatch) {
  46:       return `${urlMatch[1]}://${urlMatch[2]}`;
  47:     }
  48:     return preview.webview
  49:       .asWebviewUri(vscode.Uri.file(filePath))
  50:       .toString(true)
  51:       .replace(/%3F/gi, '?')
  52:       .replace(/%23/g, '#');
  53:   } else {
  54:     if (!filePath.startsWith('file://')) {
  55:       filePath = 'file:///' + filePath;
  56:     }
  57:     filePath = filePath.replace(/^file:\/+/, 'file:///');
  58:     return filePath;
  59:   }
  60: });
  61: 
  62: /**
  63:  * key is workspaceUri.toString()
  64:  * value is the `PreviewProvider`
  65:  */
  66: const WORKSPACE_PREVIEW_PROVIDER_MAP: Map<string, PreviewProvider> = new Map();
  67: 
  68: /**
  69:  * Commands the webview is allowed to dispatch to the extension host.
  70:  * Any command received from the webview that is not in this set is
  71:  * silently dropped.  This prevents a compromised webview from invoking
  72:  * arbitrary `_crossnote.*` commands with attacker-controlled arguments
  73:  * (blind command dispatch, GHSA-83c6-hcjv-pvmg).
  74:  */
  75: const WEBVIEW_MESSAGE_COMMANDS: Set<string> = new Set([
  76:   'cacheCodeChunkResult',
  77:   'chromeExport',
  78:   'clickTag',
  79:   'clickTagA',
  80:   'clickTaskListCheckbox',
  81:   'eBookExport',
  82:   'graphViewReady',
  83:   'htmlExport',
  84:   'insertImageUrl',
  85:   'markdownExport',
  86:   'openChangelog',
  87:   'openDocumentation',
  88:   'openExternalEditor',
  89:   'openFile',
  90:   'openGraphView',
  91:   'openInBrowser',
  92:   'openIssues',
  93:   'openSponsors',
  94:   'pandocExport',
  95:   'pasteImageFile',
  96:   'princeExport',
  97:   'refreshPreview',
  98:   'revealLine',
  99:   'runAllCodeChunks',
 100:   'runCodeChunk',
 101:   'saveSetting',
 102:   'setCodeBlockTheme',
 103:   'setImageUploader',
 104:   'setPreviewTheme',
 105:   'setRevealjsTheme',
 106:   'setZoomLevel',
 107:   'showBacklinks',
 108:   'toggleAlwaysShowBacklinksInPreview',
 109:   'togglePreviewZenMode',
 110:   'updateMarkdown',
 111:   'uploadImageFile',
 112:   'webviewFinishLoading',
 113: ]);
 114: 
 115: /**
 116:  * key is workspaceUri.toString()
 117:  * value is the `Mutex`
 118:  */
 119: const WORKSPACE_MUTEX_MAP: Map<string, Mutex> = new Map();
 120: 
 121: export function getAllPreviewProviders(): PreviewProvider[] {
 122:   return Array.from(WORKSPACE_PREVIEW_PROVIDER_MAP.values());
 123: }
 124: 
 125: // http://www.typescriptlang.org/play/
 126: // https://github.com/Microsoft/vscode/blob/master/extensions/markdown/media/main.js
 127: // https://github.com/Microsoft/vscode/tree/master/extensions/markdown/src
 128: // https://github.com/tomoki1207/gfm-preview/blob/master/src/gfmProvider.ts
 129: // https://github.com/cbreeden/vscode-markdownit
 130: /**
 131:  * One workspace folder has one PreviewProvider
 132:  */
 133: export class PreviewProvider {
 134:   private updateTimeouts: Map<string, NodeJS.Timeout> = new Map();
 135: 
 136:   /**
 137:    * Sequence counter for initPreview requests.
 138:    * Each call to initPreview increments this and tags the panel with the latest ID.
 139:    * When the HTML generation finishes, we discard the result if a newer request has
 140:    * already taken over (e.g. user switched files before rendering completed).
 141:    */
 142:   private initRequestSeq = 0;
 143:   private latestInitRequestByPreview: WeakMap<vscode.WebviewPanel, number> =
 144:     new WeakMap();
 145: 
 146:   /**
 147:    * Sequence counter for updateMarkdown render requests (per sourceUri).
 148:    * Prevents a slow parseMD from overwriting content that a newer request
 149:    * already pushed to the webview.
 150:    */
 151:   private renderRequestSeq = 0;
 152:   private latestRenderRequestBySourceUri: Map<string, number> = new Map();
 153: 
 154:   /**
 155:    * Each PreviewProvider has a one notebook.
 156:    */
 157:   private notebook!: Notebook;
 158: 
 159:   /**
 160:    * VSCode extension context
 161:    */
 162:   private context!: vscode.ExtensionContext;
 163: 
 164:   /**
 165:    * The key is sourceUri.toString()
 166:    * value is Preview (vscode.Webview) object
 167:    */
 168:   private previewMaps: Map<string, Set<vscode.WebviewPanel>> = new Map();
 169:   private previewToDocumentMap: Map<vscode.WebviewPanel, vscode.TextDocument> =
 170:     new Map();
 171:   private initializedPreviews: Set<vscode.WebviewPanel> = new Set();
 172: 
 173:   private static singlePreviewPanel: vscode.WebviewPanel | null;
 174:   private static singlePreviewPanelSourceUriTarget: Uri | null;
 175:   public static notebooksManager: NotebooksManager | null = null;
 176: 
 177:   /**
 178:    * When true, the single preview does not follow the active text editor.
 179:    */
 180:   private static singlePreviewLocked = false;
 181: 
 182:   /**
 183:    * The key is markdown file fsPath
 184:    * value is JSAndCssFiles
 185:    */
 186:   private jsAndCssFilesMaps: { [key: string]: string[] } = {};
 187: 
 188:   public constructor() {
 189:     // Please use `init` method to initialize this class.
 190:   }
 191: 
 192:   /**
 193:    * Returns true if sourceUri is the current target for the single preview panel,
 194:    * or if we are NOT in single-preview mode (multiple-previews always allowed).
 195:    */
 196:   private isSinglePreviewTarget(sourceUri: Uri): boolean {
 197:     if (getPreviewMode() !== PreviewMode.SinglePreview) {
 198:       return true;
 199:     }
 200:     const target = PreviewProvider.singlePreviewPanelSourceUriTarget;
 201:     return !!target && target.fsPath === sourceUri.fsPath;
 202:   }
 203: 
 204:   /**
 205:    * Check whether updateMarkdown should proceed for the given sourceUri.
 206:    * Returns false when in single-preview mode and sourceUri is no longer the target.
 207:    */
 208:   public shouldUpdateMarkdown(sourceUri: Uri): boolean {
 209:     if (!this.isSinglePreviewTarget(sourceUri)) {
 210:       return false;
 211:     }
 212:     const previews = this.getPreviews(sourceUri);
 213:     return !!(previews && previews.length > 0);
 214:   }
 215: 
 216:   private normalizeResourceList(resources: string[] | undefined): string[] {
 217:     if (!resources?.length) {
 218:       return [];
 219:     }
 220:     return Array.from(new Set(resources)).sort();
 221:   }
 222: 
 223:   private async init(
 224:     context: vscode.ExtensionContext,
 225:     workspaceFolderUri: vscode.Uri,
 226:   ) {
 227:     this.context = context;
 228:     this.notebook =
 229:       await this.getNotebooksManager().getNotebook(workspaceFolderUri);
 230:     return this;
 231:   }
 232: 
 233:   private getNotebooksManager() {
 234:     if (!PreviewProvider.notebooksManager) {
 235:       PreviewProvider.notebooksManager = new NotebooksManager(this.context);
 236:     }
 237:     return PreviewProvider.notebooksManager;
 238:   }
 239: 
 240:   public static async getPreviewContentProvider(
 241:     uri: vscode.Uri,
 242:     context: vscode.ExtensionContext,
 243:   ) {
 244:     const workspaceUri = getWorkspaceFolderUri(uri);
 245: 
 246:     // Acquire mutex
 247:     let mutex: Mutex;
 248:     const mutexKey = workspaceUri.toString();
 249:     if (WORKSPACE_MUTEX_MAP.has(mutexKey)) {
 250:       const mutex_ = WORKSPACE_MUTEX_MAP.get(mutexKey);
 251:       if (!mutex_) {
 252:         throw new Error('Cannot find mutex');
 253:       }
 254:       mutex = mutex_;
 255:     } else {
 256:       mutex = new Mutex();
 257:       WORKSPACE_MUTEX_MAP.set(mutexKey, mutex);
 258:     }
 259: 
 260:     const release = await mutex.acquire();
 261:     try {
 262:       if (WORKSPACE_PREVIEW_PROVIDER_MAP.has(mutexKey)) {
 263:         const provider = WORKSPACE_PREVIEW_PROVIDER_MAP.get(mutexKey);
 264:         if (!provider) {
 265:           throw new Error('Cannot find preview provider');
 266:         }
 267:         release();
 268:         return provider;
 269:       } else {
 270:         const provider = new PreviewProvider();
 271:         await provider.init(context, workspaceUri);
 272:         WORKSPACE_PREVIEW_PROVIDER_MAP.set(mutexKey, provider);
 273:         release();
 274:         return provider;
 275:       }
 276:     } catch (error) {
 277:       release();
 278:       throw error;
 279:     }
 280:   }
 281: 
 282:   public refreshAllPreviews() {
 283:     // clear caches
 284:     this.notebook.clearAllNoteMarkdownEngineCaches();
 285: 
 286:     // refresh iframes
 287:     if (getPreviewMode() === PreviewMode.SinglePreview) {
 288:       this.refreshPreviewPanel(
 289:         PreviewProvider.singlePreviewPanelSourceUriTarget,
 290:       );
 291:     } else {
 292:       for (const [sourceUriString] of this.previewMaps) {
 293:         this.refreshPreviewPanel(vscode.Uri.parse(sourceUriString));
 294:       }
 295:     }
 296:   }
 297: 
 298:   private addPreviewToMap(sourceUri: Uri, previewPanel: vscode.WebviewPanel) {
 299:     let previews = this.previewMaps.get(sourceUri.toString());
 300:     if (!previews) {
 301:       previews = new Set();
 302:       this.previewMaps.set(sourceUri.toString(), previews);
 303:     }
 304:     previews.add(previewPanel);
 305:   }
 306: 
 307:   private deletePreviewFromMap(
 308:     sourceUri: Uri,
 309:     previewPanel: vscode.WebviewPanel,
 310:   ) {
 311:     this.previewMaps.get(sourceUri.toString())?.delete(previewPanel);
 312:   }
 313: 
 314:   /**
 315:    * return markdown previews of sourceUri
 316:    * @param sourceUri
 317:    */
 318:   public getPreviews(sourceUri: Uri): vscode.WebviewPanel[] | null | undefined {
 319:     if (
 320:       getPreviewMode() === PreviewMode.SinglePreview &&
 321:       PreviewProvider.singlePreviewPanel
 322:     ) {
 323:       return [PreviewProvider.singlePreviewPanel];
 324:     } else {
 325:       const previews = this.previewMaps.get(sourceUri.toString());
 326:       if (previews) {
 327:         return Array.from(previews);
 328:       } else {
 329:         return null;
 330:       }
 331:     }
 332:   }
 333: 
 334:   /**
 335:    * check if the markdown preview is on for the textEditor
 336:    * @param textEditor
 337:    */
 338:   public isPreviewOn(sourceUri: Uri) {
 339:     if (getPreviewMode() === PreviewMode.SinglePreview) {
 340:       return !!PreviewProvider.singlePreviewPanel;
 341:     } else {
 342:       const previews = this.getPreviews(sourceUri);
 343:       return previews && previews.length > 0;
 344:     }
 345:   }
 346: 
 347:   public destroyPreview(sourceUri: Uri) {
 348:     const previewMode = getPreviewMode();
 349:     if (previewMode === PreviewMode.SinglePreview) {
 350:       PreviewProvider.singlePreviewPanel = null;
 351:       PreviewProvider.singlePreviewPanelSourceUriTarget = null;
 352:       this.previewToDocumentMap = new Map();
 353:       this.previewMaps = new Map();
 354:       this.latestRenderRequestBySourceUri.clear();
 355:     } else {
 356:       const previews = this.getPreviews(sourceUri);
 357:       if (previews) {
 358:         previews.forEach((preview) => {
 359:           this.previewToDocumentMap.delete(preview);
 360:           this.deletePreviewFromMap(sourceUri, preview);
 361:         });
 362:       }
 363:       this.latestRenderRequestBySourceUri.delete(sourceUri.toString());
 364:     }
 365:   }
 366: 
 367:   /**
 368:    * TODO: Free memory
 369:    */
 370:   public destroyEngine(_sourceUri: vscode.Uri) {}
 371: 
 372:   private getEngine(sourceUri: Uri) {
 373:     return this.notebook.getNoteMarkdownEngine(sourceUri.fsPath);
 374:   }
 375: 
 376:   public async initPreview({
 377:     sourceUri,
 378:     document,
 379:     webviewPanel,
 380:     cursorLine,
 381:     viewOptions,
 382:     inputStringOverride,
 383:   }: {
 384:     sourceUri: vscode.Uri;
 385:     document: vscode.TextDocument;
 386:     webviewPanel?: vscode.WebviewPanel;
 387:     cursorLine?: number;
 388:     viewOptions: { viewColumn: vscode.ViewColumn; preserveFocus?: boolean };
 389:     inputStringOverride?: string;
 390:   }): Promise<void> {
 391:     const previewMode = getPreviewMode();
 392:     let previewPanel: vscode.WebviewPanel;
 393:     const previews = this.getPreviews(sourceUri);
 394:     if (
 395:       previewMode === PreviewMode.SinglePreview &&
 396:       PreviewProvider.singlePreviewPanel
 397:     ) {
 398:       const oldResourceRoot = PreviewProvider.singlePreviewPanelSourceUriTarget
 399:         ? getWorkspaceFolderUri(
 400:             PreviewProvider.singlePreviewPanelSourceUriTarget,
 401:           )
 402:         : undefined;
 403:       const newResourceRoot = getWorkspaceFolderUri(sourceUri);
 404:       if (oldResourceRoot?.fsPath !== newResourceRoot.fsPath) {
 405:         const singlePreview = PreviewProvider.singlePreviewPanel;
 406:         PreviewProvider.singlePreviewPanel = null;
 407:         PreviewProvider.singlePreviewPanelSourceUriTarget = null;
 408:         singlePreview.dispose();
 409:         return await this.initPreview({
 410:           sourceUri,
 411:           document,
 412:           viewOptions,
 413:           cursorLine,
 414:           inputStringOverride,
 415:         });
 416:       } else {
 417:         previewPanel = PreviewProvider.singlePreviewPanel;
 418:         PreviewProvider.singlePreviewPanelSourceUriTarget = sourceUri;
 419:       }
 420:     } else if (previews && previews.length > 0 && !webviewPanel) {
 421:       await Promise.all(
 422:         previews.map((preview) =>
 423:           this.initPreview({
 424:             sourceUri,
 425:             document,
 426:             webviewPanel: preview,
 427:             viewOptions,
 428:             cursorLine,
 429:             inputStringOverride,
 430:           }),
 431:         ),
 432:       );
 433:       return;
 434:     } else {
 435:       const buildDir = utility.getCrossnoteBuildDirectory();
 436:       const localResourceRoots = [
 437:         vscode.Uri.file(this.context.extensionPath),
 438:         // Skip CDN/HTTP URLs — only add file-system paths to localResourceRoots
 439:         ...(buildDir.startsWith('http') ? [] : [vscode.Uri.file(buildDir)]),
 440:         vscode.Uri.file(globalConfigPath),
 441:         vscode.Uri.file(tmpdir()),
 442:       ];
 443:       const workspaceUri = getWorkspaceFolderUri(sourceUri);
 444:       if (workspaceUri) {
 445:         localResourceRoots.push(workspaceUri);
 446:       }
 447: 
 448:       if (webviewPanel) {
 449:         previewPanel = webviewPanel;
 450:         previewPanel.webview.options = {
 451:           enableScripts: true,
 452:           localResourceRoots,
 453:         };
 454:         // @ts-expect-error retainContextWhenHidden is not in type definitions
 455:         previewPanel.options.retainContextWhenHidden = true;
 456:       } else {
 457:         previewPanel = vscode.window.createWebviewPanel(
 458:           'markdown-preview-enhanced',
 459:           `Preview ${path.basename(sourceUri.fsPath)}`,
 460:           viewOptions,
 461:           {
 462:             enableFindWidget: true,
 463:             localResourceRoots,
 464:             enableScripts: true, // TODO: This might be set by enableScriptExecution config. But for now we just enable it.
 465:             retainContextWhenHidden: true,
 466:           },
 467:         );
 468:       }
 469: 
 470:       // set icon
 471:       // NOTE: This doesn't work for custom editor.
 472:       previewPanel.iconPath = vscode.Uri.joinPath(
 473:         this.context.extensionUri,
 474:         'media',
 475:         'preview.svg',
 476:       );
 477: 
 478:       // NOTE: We only register for the webview event listeners once.
 479:       if (!this.initializedPreviews.has(previewPanel)) {
 480:         this.initializedPreviews.add(previewPanel);
 481: 
 482:         // register previewPanel message events.
 483:         previewPanel.webview.onDidReceiveMessage(
 484:           (message) => {
 485:             const command = message?.command;
 486:             const args = message?.args;
 487:             if (
 488:               typeof command !== 'string' ||
 489:               !WEBVIEW_MESSAGE_COMMANDS.has(command)
 490:             ) {
 491:               return;
 492:             }
 493:             if (!Array.isArray(args)) {
 494:               return;
 495:             }
 496:             // The handler is registered once per webview panel.  In single
 497:             // preview mode the panel is reused across files, so the closure's
 498:             // `sourceUri` goes stale after a switch — compare against the
 499:             // panel's current target instead so legitimate `updateMarkdown`
 500:             // edits are not dropped (and an attacker still can only write to
 501:             // the file the preview currently represents).
 502:             const expectedSourceUri =
 503:               getPreviewMode() === PreviewMode.SinglePreview
 504:                 ? PreviewProvider.singlePreviewPanelSourceUriTarget
 505:                 : sourceUri;
 506:             if (
 507:               command === 'updateMarkdown' &&
 508:               (typeof args[0] !== 'string' ||
 509:                 !expectedSourceUri ||
 510:                 Uri.parse(args[0]).toString() !== expectedSourceUri.toString())
 511:             ) {
 512:               return;
 513:             }
 514:             vscode.commands.executeCommand(`_crossnote.${command}`, ...args);
 515:           },
 516:           null,
 517:           this.context.subscriptions,
 518:         );
 519: 
 520:         // unregister previewPanel.
 521:         previewPanel.onDidDispose(
 522:           () => {
 523:             PreviewProvider.singlePreviewLocked = false;
 524:             this.destroyPreview(sourceUri);
 525:             this.destroyEngine(sourceUri);
 526:             this.initializedPreviews.delete(previewPanel);
 527:           },
 528:           null,
 529:           this.context.subscriptions,
 530:         );
 531:       }
 532: 
 533:       if (previewMode === PreviewMode.SinglePreview) {
 534:         PreviewProvider.singlePreviewPanel = previewPanel;
 535:         PreviewProvider.singlePreviewPanelSourceUriTarget = sourceUri;
 536:       }
 537:     }
 538: 
 539:     // register previewPanel
 540:     this.addPreviewToMap(sourceUri, previewPanel);
 541:     this.previewToDocumentMap.set(previewPanel, document);
 542: 
 543:     // set title
 544:     previewPanel.title = `Preview ${path.basename(sourceUri.fsPath)}`;
 545: 
 546:     // init markdown engine.
 547:     let initialLine: number | undefined;
 548:     if (document.uri.fsPath === sourceUri.fsPath) {
 549:       initialLine = cursorLine;
 550:     }
 551: 
 552:     const inputString = inputStringOverride ?? document.getText() ?? '';
 553:     const engine = this.getEngine(sourceUri);
 554:     try {
 555:       // Tag this request so we can detect if a newer initPreview overtook us
 556:       // before the (potentially slow) HTML generation finishes.
 557:       const initRequestId = ++this.initRequestSeq;
 558:       this.latestInitRequestByPreview.set(previewPanel, initRequestId);
 559: 
 560:       // Build lightbox head injection when enabled
 561:       let head = '';
 562:       if (getMPEConfig<boolean>('enableImageLightbox') ?? true) {
 563:         const lightboxCssUri = previewPanel.webview.asWebviewUri(
 564:           vscode.Uri.joinPath(
 565:             this.context.extensionUri,
 566:             'media',
 567:             'lightbox.css',
 568:           ),
 569:         );
 570:         const lightboxJsUri = previewPanel.webview.asWebviewUri(
 571:           vscode.Uri.joinPath(
 572:             this.context.extensionUri,
 573:             'media',
 574:             'lightbox.js',
 575:           ),
 576:         );
 577:         head = `<link rel="stylesheet" href="${lightboxCssUri}"><script defer src="${lightboxJsUri}"></script>`;
 578:       }
 579: 
 580:       const html = await engine.generateHTMLTemplateForPreview({
 581:         inputString,
 582:         config: {
 583:           sourceUri: sourceUri.toString(),
 584:           cursorLine: initialLine,
 585:           isVSCode: true,
 586:           scrollSync: getMPEConfig<boolean>('scrollSync'),
 587:           imageUploader: getMPEConfig<ImageUploader>('imageUploader'),
 588:         },
 589:         contentSecurityPolicy: '',
 590:         vscodePreviewPanel: previewPanel,
 591:         isVSCodeWebExtension: isVSCodeWebExtension(),
 592:         // In the web extension, this.filePath is just the path component of a
 593:         // virtual URI (e.g. '/LICENSE.md'), so the default <base> tag would be
 594:         // malformed. The React webview already appends the correct <base> tag at
 595:         // runtime using the full sourceUri, so we can safely omit it here.
 596:         // For the native extension the default base tag is harmless, but we keep
 597:         // consistent behaviour and let React own it in both cases.
 598:         head,
 599:       });
 600: 
 601:       // If a newer initPreview call has taken over this panel, or the panel was
 602:       // disposed, or (in single-preview mode) this URI is no longer the target,
 603:       // discard this stale result.
 604:       if (
 605:         this.latestInitRequestByPreview.get(previewPanel) !== initRequestId ||
 606:         !this.initializedPreviews.has(previewPanel) ||
 607:         !this.isSinglePreviewTarget(sourceUri)
 608:       ) {
 609:         return;
 610:       }
 611: 
 612:       previewPanel.webview.html = html;
 613:     } catch (error) {
 614:       vscode.window.showErrorMessage(String(error));
 615:       console.error(error);
 616:     }
 617:   }
 618: 
 619:   /**
 620:    * Close all previews.
 621:    */
 622:   public closeAllPreviews(previewMode: PreviewMode) {
 623:     if (previewMode === PreviewMode.SinglePreview) {
 624:       if (PreviewProvider.singlePreviewPanel) {
 625:         PreviewProvider.singlePreviewPanel.dispose();
 626:       }
 627:     } else {
 628:       for (const [sourceUriString] of this.previewMaps) {
 629:         const previews = this.previewMaps.get(sourceUriString);
 630:         if (previews) {
 631:           previews.forEach((preview) => preview.dispose());
 632:         }
 633:       }
 634:     }
 635: 
 636:     this.previewMaps = new Map();
 637:     this.previewToDocumentMap = new Map();
 638:     // Clear all pending update timeouts
 639:     this.updateTimeouts.forEach((timeout) => clearTimeout(timeout));
 640:     this.updateTimeouts.clear();
 641:     this.latestRenderRequestBySourceUri.clear();
 642:     // this.engineMaps = {};
 643:     PreviewProvider.singlePreviewPanel = null;
 644:     PreviewProvider.singlePreviewPanelSourceUriTarget = null;
 645:   }
 646: 
 647:   public async postMessageToPreview(
 648:     sourceUri: Uri,
 649:     message: { command: string; [key: string]: any }, // TODO: Define a type for message.
 650:   ) {
 651:     const previews = this.getPreviews(sourceUri);
 652:     if (previews) {
 653:       for (let i = 0; i < previews.length; i++) {
 654:         const preview = previews[i];
 655:         try {
 656:           const result = await preview.webview.postMessage(message);
 657:           if (!result) {
 658:             console.error(
 659:               `Failed to send message "${message.command}" to preview panel for ${sourceUri.fsPath}`,
 660:             );
 661:           }
 662:         } catch (error) {
 663:           console.error(error);
 664:         }
 665:       }
 666:     }
 667:   }
 668: 
 669:   public previewHasTheSameSingleSourceUri(sourceUri: Uri) {
 670:     if (!PreviewProvider.singlePreviewPanelSourceUriTarget) {
 671:       return false;
 672:     } else {
 673:       return (
 674:         PreviewProvider.singlePreviewPanelSourceUriTarget.fsPath ===
 675:         sourceUri.fsPath
 676:       );
 677:     }
 678:   }
 679: 
 680:   /**
 681:    * Returns true if the single preview is currently locked.
 682:    */
 683:   public isSinglePreviewLocked(): boolean {
 684:     return PreviewProvider.singlePreviewLocked;
 685:   }
 686: 
 687:   /**
 688:    * Lock the single preview to its current file and update its title.
 689:    */
 690:   public lockSinglePreview() {
 691:     PreviewProvider.singlePreviewLocked = true;
 692:     this.updateSinglePreviewTitle();
 693:   }
 694: 
 695:   /**
 696:    * Toggle lock on the single preview and update its title.
 697:    * Returns the new lock state.
 698:    */
 699:   public toggleSinglePreviewLock(): boolean {
 700:     PreviewProvider.singlePreviewLocked = !PreviewProvider.singlePreviewLocked;
 701:     this.updateSinglePreviewTitle();
 702:     return PreviewProvider.singlePreviewLocked;
 703:   }
 704: 
 705:   private updateSinglePreviewTitle() {
 706:     const panel = PreviewProvider.singlePreviewPanel;
 707:     const sourceUri = PreviewProvider.singlePreviewPanelSourceUriTarget;
 708:     if (panel && sourceUri) {
 709:       const baseName = path.basename(sourceUri.fsPath);
 710:       panel.title = PreviewProvider.singlePreviewLocked
 711:         ? `Preview [Locked] ${baseName}`
 712:         : `Preview ${baseName}`;
 713:     }
 714:   }
 715: 
 716:   public updateMarkdown(sourceUri: Uri, triggeredBySave?: boolean) {
 717:     // Don't update if single-preview is pointing at a different file
 718:     if (!this.isSinglePreviewTarget(sourceUri)) {
 719:       return;
 720:     }
 721: 
 722:     const engine = this.getEngine(sourceUri);
 723:     const previews = this.getPreviews(sourceUri);
 724:     // console.log('updateMarkdown: ', previews?.length);
 725:     if (!previews || !previews.length) {
 726:       return;
 727:     }
 728: 
 729:     // presentation mode
 730:     if (engine.isPreviewInPresentationMode) {
 731:       return this.refreshPreview(sourceUri);
 732:     }
 733: 
 734:     // not presentation mode — run async but guard against stale renders
 735:     (async () => {
 736:       let document: vscode.TextDocument;
 737:       try {
 738:         document = await vscode.workspace.openTextDocument(sourceUri);
 739:       } catch (error) {
 740:         console.error(error);
 741:         return;
 742:       }
 743: 
 744:       // Check again after the await in case the user switched files
 745:       if (!this.isSinglePreviewTarget(sourceUri)) {
 746:         return;
 747:       }
 748: 
 749:       // Stamp this render so we can discard overtaken results
 750:       const renderRequestId = ++this.renderRequestSeq;
 751:       this.latestRenderRequestBySourceUri.set(
 752:         sourceUri.toString(),
 753:         renderRequestId,
 754:       );
 755: 
 756:       // Prefer disk content when the buffer has no unsaved edits, so that
 757:       // external file modifications (e.g. across the WSL boundary or by
 758:       // notepad.exe) propagate to the preview even when VSCode did not
 759:       // refresh its cached TextDocument. Reads happen after the stamp so the
 760:       // existing stale-render guard below still discards us if a newer
 761:       // updateMarkdown overtakes during the disk read.
 762:       let text = document.getText();
 763:       if (!document.isDirty) {
 764:         try {
 765:           const data = await vscode.workspace.fs.readFile(sourceUri);
 766:           text = Buffer.from(data).toString('utf-8');
 767:         } catch {
 768:           // Fall back to the cached document content on read failure.
 769:         }
 770:       }
 771:       await this.postMessageToPreview(sourceUri, {
 772:         command: 'startParsingMarkdown',
 773:       });
 774: 
 775:       const currentPreviews = this.getPreviews(sourceUri);
 776:       if (!currentPreviews || !currentPreviews.length) {
 777:         return;
 778:       }
 779: 
 780:       let lastError: unknown = undefined;
 781:       for (let i = 0; i < currentPreviews.length; i++) {
 782:         try {
 783:           const preview = currentPreviews[i];
 784:           const {
 785:             html,
 786:             tocHTML,
 787:             JSAndCssFiles: jsAndCssFiles,
 788:             yamlConfig,
 789:           } = await engine.parseMD(text, {
 790:             isForPreview: true,
 791:             useRelativeFilePath: false,
 792:             hideFrontMatter: false,
 793:             triggeredBySave,
 794:             vscodePreviewPanel: preview,
 795:           });
 796: 
 797:           // Discard if a newer render has taken over for this sourceUri or the
 798:           // single-preview target changed while parseMD was running
 799:           if (!this.isSinglePreviewTarget(sourceUri)) {
 800:             return;
 801:           }
 802:           if (
 803:             this.latestRenderRequestBySourceUri.get(sourceUri.toString()) !==
 804:             renderRequestId
 805:           ) {
 806:             return;
 807:           }
 808: 
 809:           // check jsAndCssFiles
 810:           const normalizedResources = this.normalizeResourceList(jsAndCssFiles);
 811:           const previousResources = this.normalizeResourceList(
 812:             this.jsAndCssFilesMaps[sourceUri.fsPath],
 813:           );
 814:           if (
 815:             JSON.stringify(normalizedResources) !==
 816:               JSON.stringify(previousResources) ||
 817:             yamlConfig['isPresentationMode']
 818:           ) {
 819:             this.jsAndCssFilesMaps[sourceUri.fsPath] = normalizedResources;
 820:             // restart iframe
 821:             this.refreshPreview(sourceUri);
 822:           } else {
 823:             await this.postMessageToPreview(sourceUri, {
 824:               command: 'updateHtml',
 825:               markdown: text,
 826:               html,
 827:               tocHTML,
 828:               totalLineCount: document.lineCount,
 829:               sourceUri: sourceUri.toString(),
 830:               sourceScheme: sourceUri.scheme,
 831:               id: yamlConfig.id || '',
 832:               class:
 833:                 (yamlConfig.class || '') +
 834:                 ` ${
 835:                   this.getNotebooksManager().systemColorScheme === 'dark'
 836:                     ? 'system-dark'
 837:                     : 'system-ligtht'
 838:                 } ${
 839:                   this.getNotebooksManager().getEditorColorScheme() === 'dark'
 840:                     ? 'editor-dark'
 841:                     : 'editor-light'
 842:                 } ${isVSCodeWebExtension() ? 'vscode-web-extension' : ''}`,
 843:             });
 844:           }
 845:           return;
 846:         } catch (error) {
 847:           lastError = error;
 848:           continue;
 849:         }
 850:       }
 851: 
 852:       if (lastError) {
 853:         vscode.window.showErrorMessage(String(lastError));
 854:         console.error(lastError);
 855:       }
 856:     })();
 857:   }
 858: 
 859:   private async refreshPreviewPanel(sourceUri: Uri | null) {
 860:     if (!sourceUri) {
 861:       return;
 862:     }
 863: 
 864:     for (const [previewPanel, document] of this.previewToDocumentMap) {
 865:       if (
 866:         !previewPanel ||
 867:         !isMarkdownFile(document) ||
 868:         !document.uri ||
 869:         document.uri.fsPath !== sourceUri.fsPath
 870:       ) {
 871:         continue;
 872:       }
 873: 
 874:       // Force re-reading from disk so manual refresh works even when the file
 875:       // was modified by an external editor (e.g. across the WSL boundary, or
 876:       // by notepad.exe) and VSCode did not pick up the change. Skip when the
 877:       // buffer has unsaved edits — those would otherwise be overwritten by
 878:       // the older on-disk content.
 879:       let inputStringOverride: string | undefined;
 880:       if (!document.isDirty) {
 881:         try {
 882:           const data = await vscode.workspace.fs.readFile(sourceUri);
 883:           inputStringOverride = Buffer.from(data).toString('utf-8');
 884:         } catch {
 885:           // Fall back to the cached document content on read failure.
 886:         }
 887:       }
 888: 
 889:       await this.initPreview({
 890:         sourceUri,
 891:         document,
 892:         inputStringOverride,
 893:         viewOptions: {
 894:           viewColumn: previewPanel.viewColumn ?? vscode.ViewColumn.One,
 895:           preserveFocus: true,
 896:         },
 897:       });
 898:     }
 899:   }
 900: 
 901:   public refreshPreview(sourceUri: Uri) {
 902:     const engine = this.getEngine(sourceUri);
 903:     if (engine) {
 904:       engine.clearCaches();
 905:       // restart iframe
 906:       this.refreshPreviewPanel(sourceUri);
 907:     }
 908:   }
 909: 
 910:   public openInBrowser(sourceUri: Uri) {
 911:     const engine = this.getEngine(sourceUri);
 912:     if (engine) {
 913:       if (isVSCodeWebExtension()) {
 914:         vscode.window.showErrorMessage(`Not supported in MPE web extension.`);
 915:       } else {
 916:         engine.openInBrowser({}).catch((error) => {
 917:           vscode.window.showErrorMessage(String(error));
 918:         });
 919:       }
 920:     }
 921:   }
 922: 
 923:   public htmlExport(sourceUri: Uri, offline: boolean) {
 924:     const engine = this.getEngine(sourceUri);
 925:     if (engine) {
 926:       engine
 927:         .htmlExport({ offline })
 928:         .then((dest) => {
 929:           vscode.window.showInformationMessage(
 930:             `File ${path.basename(dest)} was created at path: ${dest}`,
 931:           );
 932:         })
 933:         .catch((error) => {
 934:           vscode.window.showErrorMessage(String(error));
 935:         });
 936:     }
 937:   }
 938: 
 939:   public chromeExport(sourceUri: Uri, type: string) {
 940:     const engine = this.getEngine(sourceUri);
 941:     if (engine) {
 942:       if (isVSCodeWebExtension()) {
 943:         vscode.window.showErrorMessage(`Not supported in MPE web extension.`);
 944:       } else {
 945:         engine
 946:           .chromeExport({ fileType: type, openFileAfterGeneration: true })
 947:           .then((dest) => {
 948:             vscode.window.showInformationMessage(
 949:               `File ${path.basename(dest)} was created at path: ${dest}`,
 950:             );
 951:           })
 952:           .catch((error) => {
 953:             vscode.window.showErrorMessage(String(error));
 954:           });
 955:       }
 956:     }
 957:   }
 958: 
 959:   public princeExport(sourceUri: Uri) {
 960:     const engine = this.getEngine(sourceUri);
 961:     if (engine) {
 962:       if (isVSCodeWebExtension()) {
 963:         vscode.window.showErrorMessage(`Not supported in MPE web extension.`);
 964:       } else {
 965:         engine
 966:           .princeExport({ openFileAfterGeneration: true })
 967:           .then((dest) => {
 968:             if (dest.endsWith('?print-pdf')) {
 969:               // presentation pdf
 970:               vscode.window.showInformationMessage(
 971:                 `Please copy and open the link: { ${dest.replace(
 972:                   /_/g,
 973:                   '\\_',
 974:                 )} } in Chrome then Print as Pdf.`,
 975:               );
 976:             } else {
 977:               vscode.window.showInformationMessage(
 978:                 `File ${path.basename(dest)} was created at path: ${dest}`,
 979:               );
 980:             }
 981:           })
 982:           .catch((error) => {
 983:             vscode.window.showErrorMessage(String(error));
 984:           });
 985:       }
 986:     }
 987:   }
 988: 
 989:   public eBookExport(sourceUri: Uri, fileType: string) {
 990:     const engine = this.getEngine(sourceUri);
 991:     if (engine) {
 992:       if (isVSCodeWebExtension()) {
 993:         vscode.window.showErrorMessage(`Not supported in MPE web extension.`);
 994:       } else {
 995:         engine
 996:           .eBookExport({ fileType, runAllCodeChunks: false })
 997:           .then((dest) => {
 998:             vscode.window.showInformationMessage(
 999:               `eBook ${path.basename(dest)} was created as path: ${dest}`,
1000:             );
1001:           })
1002:           .catch((error) => {
1003:             vscode.window.showErrorMessage(String(error));
1004:           });
1005:       }
1006:     }
1007:   }
1008: 
1009:   public pandocExport(sourceUri: Uri) {
1010:     const engine = this.getEngine(sourceUri);
1011:     if (engine) {
1012:       if (isVSCodeWebExtension()) {
1013:         vscode.window.showErrorMessage(`Not supported in MPE web extension.`);
1014:       } else {
1015:         engine
1016:           .pandocExport({ openFileAfterGeneration: true })
1017:           .then((dest) => {
1018:             vscode.window.showInformationMessage(
1019:               `Document ${path.basename(dest)} was created as path: ${dest}`,
1020:             );
1021:           })
1022:           .catch((error) => {
1023:             vscode.window.showErrorMessage(String(error));
1024:           });
1025:       }
1026:     }
1027:   }
1028: 
1029:   public markdownExport(sourceUri: Uri) {
1030:     const engine = this.getEngine(sourceUri);
1031:     if (engine) {
1032:       engine
1033:         .markdownExport({})
1034:         .then((dest) => {
1035:           vscode.window.showInformationMessage(
1036:             `Document ${path.basename(dest)} was created as path: ${dest}`,
1037:           );
1038:         })
1039:         .catch((error) => {
1040:           vscode.window.showErrorMessage(String(error));
1041:         });
1042:     }
1043:   }
1044: 
1045:   /*
1046:   public cacheSVG(sourceUri: Uri, code:string, svg:string) {
1047:     const engine = this.getEngine(sourceUri)
1048:     if (engine) {
1049:       engine.cacheSVG(code, svg)
1050:     }
1051:   }
1052:   */
1053: 
1054:   public cacheCodeChunkResult(sourceUri: Uri, id: string, result: string) {
1055:     const engine = this.getEngine(sourceUri);
1056:     if (engine) {
1057:       engine.cacheCodeChunkResult(id, result);
1058:     }
1059:   }
1060: 
1061:   public runCodeChunk(sourceUri: Uri, codeChunkId: string) {
1062:     const engine = this.getEngine(sourceUri);
1063:     if (engine) {
1064:       engine.runCodeChunk(codeChunkId).then(() => {
1065:         this.updateMarkdown(sourceUri);
1066:       });
1067:     }
1068:   }
1069: 
1070:   public runAllCodeChunks(sourceUri: Uri) {
1071:     const engine = this.getEngine(sourceUri);
1072:     if (engine) {
1073:       engine.runCodeChunks().then(() => {
1074:         this.updateMarkdown(sourceUri);
1075:       });
1076:     }
1077:   }
1078: 
1079:   public update(sourceUri: Uri) {
1080:     const previews = this.getPreviews(sourceUri);
1081:     if (!getMPEConfig<boolean>('liveUpdate') || !previews || !previews.length) {
1082:       return;
1083:     }
1084: 
1085:     const sourceUriString = sourceUri.toString();
1086:     const debounceMs = getMPEConfig<number>('liveUpdateDebounceMs') ?? 300;
1087: 
1088:     // Clear existing timeout for this sourceUri (proper debounce behavior)
1089:     const existingTimeout = this.updateTimeouts.get(sourceUriString);
1090:     if (existingTimeout) {
1091:       clearTimeout(existingTimeout);
1092:       this.updateTimeouts.delete(sourceUriString);
1093:     }
1094: 
1095:     // If debounce is 0, update immediately without timeout
1096:     if (debounceMs === 0) {
1097:       this.updateMarkdown(sourceUri);
1098:       return;
1099:     }
1100: 
1101:     // Set new timeout
1102:     const timeout = setTimeout(() => {
1103:       this.updateTimeouts.delete(sourceUriString);
1104:       this.updateMarkdown(sourceUri);
1105:     }, debounceMs);
1106: 
1107:     this.updateTimeouts.set(sourceUriString, timeout);
1108:   }
1109: 
1110:   public async openImageHelper(sourceUri: Uri) {
1111:     if (sourceUri.scheme === 'markdown-preview-enhanced') {
1112:       return vscode.window.showWarningMessage('Please focus a markdown file.');
1113:     } else if (!this.isPreviewOn(sourceUri)) {
1114:       return vscode.window.showWarningMessage('Please open preview first.');
1115:     } else {
1116:       return await this.postMessageToPreview(sourceUri, {
1117:         command: 'openImageHelper',
1118:       });
1119:     }
1120:   }
1121: }
1122: 
1123: export function getPreviewUri(uri: vscode.Uri) {
1124:   if (uri.scheme === 'markdown-preview-enhanced') {
1125:     return uri;
1126:   }
1127: 
1128:   let previewUri: Uri;
1129:   if (getPreviewMode() === PreviewMode.SinglePreview) {
1130:     previewUri = uri.with({
1131:       scheme: 'markdown-preview-enhanced',
1132:       path: 'single-preview.rendered',
1133:     });
1134:   } else {
1135:     previewUri = uri.with({
1136:       scheme: 'markdown-preview-enhanced',
1137:       path: uri.path + '.rendered',
1138:       query: uri.toString(),
1139:     });
1140:   }
1141:   return previewUri;
1142: }
````

## File: src/utils.ts
````typescript
  1: import * as path from 'path';
  2: import { PreviewMode } from 'crossnote';
  3: import * as os from 'os';
  4: import * as vscode from 'vscode';
  5: import * as packageJSON from '../package.json';
  6: import { getMPEConfig } from './config';
  7: 
  8: /**
  9:  * Format pathString if it is on Windows. Convert `c:\` like string to `C:\`
 10:  * @param pathString
 11:  */
 12: /*
 13: function formatPathIfNecessary(pathString: string) {
 14:   if (process.platform === 'win32') {
 15:     pathString = pathString.replace(
 16:       /^([a-zA-Z])\:\\/,
 17:       (_, $1) => `${$1.toUpperCase()}:\\`,
 18:     );
 19:   }
 20:   return pathString;
 21: }
 22: */
 23: 
 24: /**
 25:  * Get the workspace folder uri of the given uri
 26:  * @param uri
 27:  */
 28: export function getWorkspaceFolderUri(uri: vscode.Uri) {
 29:   const workspace = vscode.workspace.getWorkspaceFolder(uri);
 30:   if (workspace) {
 31:     return workspace.uri;
 32:   }
 33: 
 34:   const workspaces = vscode.workspace.workspaceFolders;
 35:   if (workspaces) {
 36:     for (let i = 0; i < workspaces.length; i++) {
 37:       const workspace = workspaces[i];
 38:       if (uri.fsPath.startsWith(workspace.uri.fsPath)) {
 39:         return workspace.uri;
 40:       }
 41:     }
 42:   }
 43: 
 44:   // Detect cross-platform URI mismatch (e.g., Windows-style URI on a Linux
 45:   // remote connected via Remote SSH). The fsPath will contain a Windows drive
 46:   // letter that is not a valid local path, so fall back to the first workspace
 47:   // folder instead of producing an invalid URI.
 48:   if (process.platform !== 'win32' && /^[a-zA-Z]:/.test(uri.fsPath)) {
 49:     if (workspaces && workspaces.length > 0) {
 50:       return workspaces[0].uri;
 51:     }
 52:   }
 53: 
 54:   // Return the folder of uri
 55:   return vscode.Uri.file(path.dirname(uri.fsPath));
 56: }
 57: 
 58: function getGlobalConfigPath(): string {
 59:   const configPath = getMPEConfig<string>('configPath');
 60:   if (typeof configPath === 'string' && configPath && configPath !== '') {
 61:     return configPath.replace(/^~/, os.homedir());
 62:   }
 63: 
 64:   if (process.platform === 'win32') {
 65:     return path.join(os.homedir(), './.crossnote');
 66:   } else {
 67:     if (
 68:       typeof process.env.XDG_CONFIG_HOME === 'string' &&
 69:       process.env.XDG_CONFIG_HOME !== ''
 70:     ) {
 71:       return path.resolve(process.env.XDG_CONFIG_HOME, './crossnote');
 72:     } else {
 73:       return path.resolve(os.homedir(), './.local/state/crossnote');
 74:     }
 75:   }
 76: }
 77: export const globalConfigPath = getGlobalConfigPath();
 78: 
 79: /**
 80:  * Obsidian-style "follow link to a missing note": if `fileUri`
 81:  * points at a non-existent file whose extension matches the
 82:  * configured `markdownFileExtensions`, create an empty stub there
 83:  * with a sensible initial title.  Returns true if it created the
 84:  * file, false if the file already existed or wasn't a markdown
 85:  * extension we should auto-create.
 86:  *
 87:  * Used by the graph-view "click an orphan node" path and the
 88:  * preview "click [[NewNote]] wikilink" path — both used to fall
 89:  * through to a `Could not open file: …` error when the target
 90:  * didn't exist.  Now they create the note and let the caller open
 91:  * it.  The file watcher picks up the create and refreshes the
 92:  * notebook indices on its own, so the new node shows up as a real
 93:  * (non-orphan) node on the next graph render.
 94:  */
 95: export async function createMissingMarkdownNote(
 96:   fileUri: vscode.Uri,
 97: ): Promise<boolean> {
 98:   // Bail out if it already exists.
 99:   try {
100:     await vscode.workspace.fs.stat(fileUri);
101:     return false;
102:   } catch {
103:     // ENOENT — fall through to create.
104:   }
105: 
106:   const markdownFileExtensions =
107:     getMPEConfig<string[]>('markdownFileExtensions') ?? [];
108:   const ext = path.extname(fileUri.path).toLowerCase();
109:   if (!markdownFileExtensions.includes(ext)) {
110:     return false;
111:   }
112: 
113:   // Stub content: a single H1 with the bare basename, matching what
114:   // Obsidian does on click-to-create.  Cheap to delete if the user
115:   // doesn't want it.
116:   const title = path.basename(fileUri.path, ext);
117:   const initialContent = `# ${title}\n\n`;
118:   try {
119:     await vscode.workspace.fs.writeFile(
120:       fileUri,
121:       new TextEncoder().encode(initialContent),
122:     );
123:     return true;
124:   } catch (error) {
125:     console.error('createMissingMarkdownNote: write failed', error);
126:     return false;
127:   }
128: }
129: 
130: export function isMarkdownFile(document: vscode.TextDocument) {
131:   let flag =
132:     (document.languageId === 'markdown' ||
133:       document.languageId === 'quarto' ||
134:       document.languageId === 'prompt' ||
135:       document.languageId === 'instructions' ||
136:       document.languageId === 'chatagent' ||
137:       document.languageId === 'skill') &&
138:     document.uri.scheme !== 'markdown-preview-enhanced'; // prevent processing of own documents
139: 
140:   if (!flag) {
141:     // Check file extension
142:     const markdownFileExtensions =
143:       getMPEConfig<string[]>('markdownFileExtensions') ?? [];
144:     const fileName = document.fileName;
145:     const ext = path.extname(fileName).toLowerCase();
146:     flag = markdownFileExtensions.includes(ext);
147:   }
148: 
149:   return flag;
150: }
151: 
152: /**
153:  * Get the top-most visible range of `editor`.
154:  *
155:  * Returns a fractional line number based the visible character within the line.
156:  * Floor to get real line number
157:  */
158: export function getTopVisibleLine(
159:   editor: vscode.TextEditor,
160: ): number | undefined {
161:   if (!editor['visibleRanges'].length) {
162:     return undefined;
163:   }
164: 
165:   const firstVisiblePosition = editor['visibleRanges'][0].start;
166:   const lineNumber = firstVisiblePosition.line;
167:   const line = editor.document.lineAt(lineNumber);
168:   const progress = firstVisiblePosition.character / (line.text.length + 2);
169:   return lineNumber + progress;
170: }
171: 
172: /**
173:  * Get the bottom-most visible range of `editor`.
174:  *
175:  * Returns a fractional line number based the visible character within the line.
176:  * Floor to get real line number
177:  */
178: export function getBottomVisibleLine(
179:   editor: vscode.TextEditor,
180: ): number | undefined {
181:   if (!editor['visibleRanges'].length) {
182:     return undefined;
183:   }
184: 
185:   const firstVisiblePosition = editor['visibleRanges'][0].end;
186:   const lineNumber = firstVisiblePosition.line;
187:   let text = '';
188:   if (lineNumber < editor.document.lineCount) {
189:     text = editor.document.lineAt(lineNumber).text;
190:   }
191:   const progress = firstVisiblePosition.character / (text.length + 2);
192:   return lineNumber + progress;
193: }
194: 
195: export function isVSCodeWebExtension() {
196:   return process.env.IS_VSCODE_WEB_EXTENSION === 'true';
197: }
198: 
199: export function isVSCodewebExtensionDevMode() {
200:   return process.env.IS_VSCODE_WEB_EXTENSION_DEV_MODE === 'true';
201: }
202: 
203: export function getCrossnoteVersion() {
204:   return packageJSON.dependencies['crossnote'];
205: }
206: 
207: export function getPreviewMode() {
208:   return getMPEConfig<PreviewMode>('previewMode');
209: }
210: 
211: export function getEditorActiveCursorLine(editor: vscode.TextEditor) {
212:   return editor.selections[0].active.line ?? 0;
213: }
````
