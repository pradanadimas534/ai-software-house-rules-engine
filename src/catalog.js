export const REQUIRED_SKILLS = ['software-house','planning','testing','code-review'];
export const SKILLS = [
 {id:'software-house',file:'software-house/SKILL.md',recommended:true},
 {id:'planning',file:'planning/SKILL.md',recommended:true},
 {id:'ui-ux',file:'ui-ux/SKILL.md'},
 {id:'frontend',file:'frontend/SKILL.md'},
 {id:'backend',file:'backend/SKILL.md'},
 {id:'database',file:'database/SKILL.md'},
 {id:'testing',file:'testing/SKILL.md',recommended:true},
 {id:'code-review',file:'code-review/SKILL.md',recommended:true},
 {id:'performance',file:'performance/SKILL.md'},
 {id:'documentation',file:'documentation/SKILL.md'}
];
export const ADAPTERS = { none:null, claude:{filename:'CLAUDE.md',template:'adapters/CLAUDE.md.tpl'}, gemini:{filename:'GEMINI.md',template:'adapters/GEMINI.md.tpl'} };
