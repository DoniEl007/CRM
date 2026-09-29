// Usage: node tools-check-icons.js screens/*.html  → lists data-lucide names that don't exist
const fs=require('fs');const lucide=require('./assets/lucide.min.js');
const names=new Set(Object.keys(lucide.icons));const toP=s=>s.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join('');
let bad=0;for(const f of process.argv.slice(2)){const t=fs.readFileSync(f,'utf8');for(const m of t.matchAll(/data-lucide="([^"]+)"|icon\('([^']+)'/g)){const n=m[1]||m[2];if(!names.has(toP(n))){console.log(f,n);bad++;}}}
console.log(bad?bad+' missing':'all icons ok');
