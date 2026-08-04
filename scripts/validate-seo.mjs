import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='scripts')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else files.push(p)}}
walk(root);
const htmlFiles=files.filter(x=>x.endsWith('.html'));
const titles=new Map(),descs=new Map(),canonicals=new Map(),errors=[];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const get=(h,re)=>h.match(re)?.[1]?.trim();

for(const file of htmlFiles){
  const h=fs.readFileSync(file,'utf8');
  const rel=path.relative(root,file).replaceAll('\\','/');
  if(!/^<!doctype html>/i.test(h))errors.push(`${rel}: doctype absent`);
  if(!/<html lang="fr">/i.test(h))errors.push(`${rel}: langue absente`);
  for(const [name,re] of [['title',/<title>([^<]+)<\/title>/i],['description',/<meta name="description" content="([^"]+)"/i],['canonical',/<link rel="canonical" href="([^"]+)"/i]]){
    const value=get(h,re);if(!value)errors.push(`${rel}: ${name} absent`);else {const map=name==='title'?titles:name==='description'?descs:canonicals;if(map.has(value))errors.push(`${rel}: ${name} dupliqué avec ${map.get(value)}`);map.set(value,rel)}
  }
  const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
  const title=decode(get(h,/<title>([^<]+)<\/title>/i)||'');
  const desc=decode(get(h,/<meta name="description" content="([^"]+)"/i)||'');
  if(rel!=='index.html'&&(title.length<45||title.length>60))errors.push(`${rel}: titre ${title.length} caractères`);
  if(rel!=='index.html'&&(desc.length<140||desc.length>160))errors.push(`${rel}: description ${desc.length} caractères`);
  for(const tag of ['og:title','og:description','og:url','og:image'])if(!h.includes(`property="${tag}"`))errors.push(`${rel}: ${tag} absent`);
  for(const tag of ['twitter:title','twitter:description','twitter:image'])if(!h.includes(`name="${tag}"`))errors.push(`${rel}: ${tag} absent`);
  const ld=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if(!ld.length)errors.push(`${rel}: JSON-LD absent`);
  for(const block of ld){try{JSON.parse(block[1])}catch(e){errors.push(`${rel}: JSON-LD invalide ${e.message}`)}}
  if(/\batob\s*\(|base64|data:application\/(zip|octet-stream)|pako|decompress/i.test(h))errors.push(`${rel}: mécanisme interdit détecté`);
  if((h.match(/<h1\b/gi)||[]).length!==1)errors.push(`${rel}: nombre de H1 différent de 1`);
  for(const script of [...h.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/gi)])if(script[1].trim()){try{new Function(script[1])}catch(e){errors.push(`${rel}: JavaScript invalide ${e.message}`)}}
}

for(const f of files.filter(x=>x.endsWith('.json'))){try{JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){errors.push(`${path.relative(root,f)}: JSON invalide ${e.message}`)}}
for(const f of files.filter(x=>x.endsWith('.xml'))){const x=fs.readFileSync(f,'utf8');if(!/^<\?xml/.test(x)||!/<(urlset|sitemapindex)\b/.test(x))errors.push(`${path.relative(root,f)}: XML de sitemap invalide`) }
const report=JSON.parse(fs.readFileSync(path.join(root,'seo-report.json'),'utf8'));
const expectedTotalUrls=122;
if(report.totalUrls!==expectedTotalUrls)errors.push(`Total URL ${report.totalUrls}, attendu ${expectedTotalUrls}`);
if(report.minWords<800||report.maxWords>1500)errors.push(`Longueur visible hors plage: ${report.minWords}-${report.maxWords}`);
const sitemapLocs=files.filter(x=>/sitemap-.*\.xml$/.test(x)).flatMap(f=>[...fs.readFileSync(f,'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]));
if(new Set(sitemapLocs).size!==expectedTotalUrls)errors.push(`Sitemaps: ${new Set(sitemapLocs).size} URL uniques, attendu ${expectedTotalUrls}`);
for(const required of ['robots.txt','ads.txt','sitemap.xml','sitemap-guides.xml','sitemap-forex.xml','sitemap-actions.xml','sitemap-metaux.xml','sitemap-etf.xml','sitemap-indices.xml','manifest.webmanifest','icon.svg','sw.js'])if(!fs.existsSync(path.join(root,required)))errors.push(`${required} absent`);

const knownRoutes=new Set(htmlFiles.map(file=>{
  const rel=path.relative(root,file).replaceAll('\\','/');
  return rel==='index.html'?'/':`/${rel.replace(/\/index\.html$/,'')}`;
}));
const knownFiles=new Set(files.map(file=>`/${path.relative(root,file).replaceAll('\\','/')}`));
for(const file of htmlFiles){
  const h=fs.readFileSync(file,'utf8');
  const rel=path.relative(root,file).replaceAll('\\','/');
  for(const match of h.matchAll(/(?:href|src)=["']([^"'#?]+)["']/g)){
    const raw=match[1];
    if(!raw.startsWith('/')||raw.startsWith('//'))continue;
    const target=raw.replace(/\/$/,'')||'/';
    if(!knownRoutes.has(target)&&!knownFiles.has(target))errors.push(`${rel}: cible interne absente ${raw}`);
  }
}

const result={htmlFiles:htmlFiles.length,uniqueTitles:titles.size,uniqueDescriptions:descs.size,uniqueCanonicals:canonicals.size,sitemapUrls:new Set(sitemapLocs).size,minWords:report.minWords,maxWords:report.maxWords,errors};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
