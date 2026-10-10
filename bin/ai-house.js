#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import readline from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { initialize, updateInstallation, uninstall, getPackageRoot, getStatus, doctor } from '../src/installer.js';
import { parseArgs } from '../src/utils.js';

const VERSION = '0.1.2';
const { positional, options } = parseArgs(process.argv.slice(2));
const command = positional[0] || 'help';
const projectRoot = path.resolve(typeof options.project === 'string' ? options.project : process.cwd());
let rl = readline.createInterface({ input, output });
const source = typeof options.source === 'string' ? options.source : process.env.AI_HOUSE_SOURCE;

function printHelp() {
 console.log(`\nAI Software House Rules Engine v${VERSION}\nUsage:\n  ai-house init [--skills id,id] [--adapter none|claude|gemini] [--source git-url]\n  ai-house skills\n  ai-house status\n  ai-house doctor\n  ai-house update [--source git-url-or-local-path] [--force]\n  ai-house uninstall [--force]\n\nOptions:\n  --project <path>  Target project directory\n  --skills <ids>    Select skills by comma-separated IDs\n  --adapter <id>    Adapter: none, claude, gemini\n  --source <source> Git URL or local rules repository\n  --force           Replace modified managed files on update/uninstall\n  --yes             Skip confirmation prompts\n`);
}
async function selectSkills() {
 const catalog = JSON.parse(await fs.readFile(path.join(getPackageRoot(), 'skills/catalog.json'), 'utf8'));
 if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
  console.log('\nAvailable skills (required workflow skills are always included):');
  catalog.forEach((s,i)=>console.log(' ' + String(i+1).padStart(2,' ') + '. ' + s.id.padEnd(16) + ' ' + s.description + (s.recommended?' [recommended]':'')));
  const answer=(await rl.question('\nEnter numbers or IDs separated by commas (Enter = recommended): ')).trim();
  if(!answer) return catalog.filter(s=>s.recommended).map(s=>s.id);
  return [...new Set(answer.split(',').map(v=>v.trim()).filter(Boolean).map(v=>{
   if(/^\d+$/.test(v)){const item=catalog[Number(v)-1];if(!item)throw new Error('Invalid skill number: '+v);return item.id;}
   if(!catalog.some(s=>s.id===v))throw new Error('Unknown skill ID: '+v);
   return v;
  }))];
 }
 rl.close();
 const selected = new Set(catalog.filter(s => s.recommended).map(s => s.id));
 let cursor = 0;
 const render = () => {
  output.write('\x1b[2J\x1b[H');
  output.write('Select skills to install\n');
  output.write('Use Up/Down arrows to move, Space to toggle, Enter to confirm, Ctrl+C to cancel.\n\n');
  catalog.forEach((skill, index) => {
   const pointer = index === cursor ? '>' : ' ';
   const checkbox = selected.has(skill.id) ? 'x' : ' ';
   const recommended = skill.recommended ? ' (recommended)' : '';
   output.write(pointer + ' [' + checkbox + '] ' + skill.id + recommended + '\n');
   output.write('    ' + skill.description + '\n');
  });
  output.write('\n');
 };
 return await new Promise((resolve, reject) => {
  const wasRaw = input.isRaw;
  const cleanup = () => {
   input.off('keypress', onKeypress);
   if (typeof input.setRawMode === 'function') input.setRawMode(Boolean(wasRaw));
   output.write('\x1b[?25h');
   input.pause();
   rl = readline.createInterface({ input, output });
  };
  const onKeypress = (str, key = {}) => {
   if (key.ctrl && key.name === 'c') {
    cleanup();
    reject(new Error('Skill selection cancelled.'));
    return;
   }
   if (key.name === 'up') cursor = (cursor - 1 + catalog.length) % catalog.length;
   else if (key.name === 'down') cursor = (cursor + 1) % catalog.length;
   else if (key.name === 'space' || str === ' ') {
    const id = catalog[cursor].id;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
   } else if (key.name === 'return' || key.name === 'enter') {
    cleanup();
    output.write('Selected skills: ' + ([...selected].join(', ') || '(none; required workflow skills will still be added)') + '\n');
    resolve([...selected]);
    return;
   }
   render();
  };
  try {
   emitKeypressEvents(input);
   input.setRawMode(true);
   input.resume();
   output.write('\x1b[?25l');
   input.on('keypress', onKeypress);
   render();
  } catch (error) {
   cleanup();
   reject(error);
  }
 });
}
async function selectAdapter() {
 const selected=String(options.adapter||'').trim().toLowerCase();
 if(selected){if(!['none','claude','gemini'].includes(selected))throw new Error(`Unknown adapter: ${selected}`);return selected;}
 const answer=(await rl.question('\nAdapter [none/claude/gemini] (default none): ')).trim().toLowerCase();
 return answer||'none';
}
try {
 if(command==='help'||command==='--help'||options.help) printHelp();
 else if(command==='version'||command==='--version') console.log(VERSION);
 else if(command==='skills') {
  const catalog=JSON.parse(await fs.readFile(path.join(getPackageRoot(),'skills/catalog.json'),'utf8'));
  catalog.forEach(s=>console.log(`${s.id.padEnd(16)} ${s.description}${s.recommended?' [core]':''}`));
 } else if(command==='init') {
  const skills=typeof options.skills==='string'?options.skills.split(',').map(s=>s.trim()).filter(Boolean):await selectSkills();
  const adapter=await selectAdapter();
  const result=await initialize({projectRoot,skills,adapter,source});
  console.log(`\nAI House initialized in ${projectRoot}\nSkills: ${result.skills.join(', ')}\nAdapter: ${result.adapter}\nSource: ${result.source||'(not configured)'}`);
 } else if(command==='status') console.log(JSON.stringify(await getStatus(projectRoot),null,2));
 else if(command==='doctor') {const result=await doctor(projectRoot);console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
 else if(command==='update') {const result=await updateInstallation({projectRoot,source,force:Boolean(options.force)});console.log(`Updated ${result.updated.length} managed files.${result.skipped.length?' Preserved modified files: '+result.skipped.join(', '):''}`);}
 else if(command==='uninstall') {
  if(!options.yes){const answer=(await rl.question(`Remove AI House managed files from ${projectRoot}? [y/N] `)).trim().toLowerCase();if(answer!=='y'&&answer!=='yes'){console.log('Cancelled.');}else{const result=await uninstall({projectRoot,force:Boolean(options.force)});console.log(`Removed: ${result.removed.length}; preserved: ${result.preserved.length}`);}}
  else {const result=await uninstall({projectRoot,force:Boolean(options.force)});console.log(`Removed: ${result.removed.length}; preserved: ${result.preserved.length}`);}
 } else {printHelp();process.exitCode=1;}
} catch(error) {console.error(`AI House error: ${error.message}`);process.exitCode=1;}
finally {rl.close();}
