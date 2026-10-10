import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
export async function hashFile(file) { return sha256(await fs.readFile(file)); }
export async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
export async function readJson(file, fallback=null) { try { return JSON.parse(await fs.readFile(file,'utf8')); } catch { return fallback; } }
export async function writeJson(file, value) { await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file,JSON.stringify(value,null,2)+'\n','utf8'); }
export async function copyFileEnsuringParent(source,destination) { await fs.mkdir(path.dirname(destination),{recursive:true}); await fs.copyFile(source,destination); }
export function parseArgs(argv) { const positional=[],options={}; for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--')){positional.push(arg);continue;}const [key,inline]=arg.slice(2).split('=',2);if(inline!==undefined)options[key]=inline;else if(argv[i+1]&&!argv[i+1].startsWith('--'))options[key]=argv[++i];else options[key]=true;}return{positional,options}; }
