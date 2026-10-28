// RadarTec feed: protótipo de coleta direta do PNCP.
// Consulta inicial limitada a modalidades e páginas selecionadas. Não é espelho completo do PNCP.
// Implantar somente em um projeto Supabase separado do BoraTec.
const ALLOWED_ORIGIN="*";
const headers={"content-type":"application/json; charset=utf-8","access-control-allow-origin":ALLOWED_ORIGIN,"access-control-allow-methods":"GET, OPTIONS","cache-control":"public, max-age=300"};
const categories=[
 ["PMOC",/\bpmoc\b|plano de manuten[cç][aã]o.{0,60}(opera[cç][aã]o|controle)/i],
 ["Engenharia",/engenharia mec[aâ]nica|respons[aá]vel t[eé]cnic[oa]|\bart\b.{0,35}(climatiza|refrigera)|projeto.{0,50}(climatiza|ar.condicionado)/i],
 ["Manutenção",/manuten[cç][aã]o.{0,130}(ar.condicionado|climatiza|refrigera|chiller|split|\bvrf\b)|(?:ar.condicionado|climatiza|refrigera|chiller|split|\bvrf\b).{0,130}manuten[cç][aã]o/i],
 ["Instalação",/instala[cç][aã]o.{0,130}(ar.condicionado|climatiza|refrigera|chiller|split|\bvrf\b)|(?:ar.condicionado|climatiza|refrigera|chiller|split|\bvrf\b).{0,130}instala[cç][aã]o/i],
 ["Equipamentos",/(aquisi[cç][aã]o|fornecimento|compra).{0,150}(ar.condicionado|refrigera|climatiza|compressores|chiller)|(?:ar.condicionado|refrigera|climatiza|compressores|chiller).{0,150}(aquisi[cç][aã]o|fornecimento|compra)/i]
] as const;
function category(text:string){for(const [name,rule] of categories)if(rule.test(text))return name;return null}
function ymd(date:Date){return [date.getUTCFullYear(),String(date.getUTCMonth()+1).padStart(2,"0"),String(date.getUTCDate()).padStart(2,"0")].join("")}
async function getPage(modality:number,page:number,deadline:string){
 const url=new URL("https://pncp.gov.br/api/consulta/v1/contratacoes/proposta");
 url.searchParams.set("dataFinal",deadline);url.searchParams.set("codigoModalidadeContratacao",String(modality));url.searchParams.set("pagina",String(page));url.searchParams.set("tamanhoPagina","100");
 const c=new AbortController();const timeout=setTimeout(()=>c.abort(),10000);
 try {const r=await fetch(url,{headers:{"accept":"application/json"},signal:c.signal});if(!r.ok)throw Error("PNCP HTTP "+r.status);const obj=await r.json();return Array.isArray(obj?.data)?obj.data:[]}
 finally{clearTimeout(timeout)}
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="GET")return new Response(JSON.stringify({error:"Método inválido"}),{status:405,headers});
 const future=new Date(Date.now()+45*86400000);
 const jobs=[6,8,4].map(mod=>getPage(mod,1,ymd(future)));
 const outcomes=await Promise.allSettled(jobs);
 const successful=outcomes.filter(r=>r.status==="fulfilled");
 if(!successful.length)return new Response(JSON.stringify({error:"Fonte PNCP indisponível",items:[],updated_at:new Date().toISOString()}),{status:503,headers});
 const seen=new Set<string>(),items:Record<string,unknown>[]=[];
 for(const result of outcomes){if(result.status!=="fulfilled")continue;for(const r of result.value){
  const title=String(r.objetoCompra||"").slice(0,600);const kind=category(title);if(!kind)continue;
  const end=String(r.dataEncerramentoProposta||"");if(end && Date.parse(end)<Date.now())continue;
  const id=String(r.numeroControlePNCP||"");if(!id||seen.has(id))continue;seen.add(id);
  const uf=String(r.unidadeOrgao?.ufSigla||"");
  const cnpj=String(r.orgaoEntidade?.cnpj||"").replace(/\D/g,"");
  const ano=Number(r.anoCompra),seq=Number(r.sequencialCompra);
  const url=cnpj.length===14&&Number.isInteger(ano)&&Number.isInteger(seq)&&seq>0?
   `https://pncp.gov.br/app/editais/${cnpj}/${ano}/${seq}`:null;
  items.push({id,title,category:kind,uf,city:String(r.unidadeOrgao?.municipioNome||""),agency:String(r.orgaoEntidade?.razaoSocial||""),value:r.valorTotalEstimado??null,deadline:end,published_at:r.dataPublicacaoPncp||"",url});
 }}
 items.sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)));
 return new Response(JSON.stringify({updated_at:new Date().toISOString(),items,partial:true,scanned_modalities:[6,8,4],scanned_pages_per_modality:1,source:"PNCP"}),{headers});
});