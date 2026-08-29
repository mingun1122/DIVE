import { isSupabaseConfigured, supabase } from "./supabase";

export const SAMPLE_GECKOS = [
  {id:"sample-1",individualId:"G-001",species:"크레스티드 게코",morph:"릴리화이트",sex:"암컷",hatchDate:"2026-01-12",age:"8개월",weight:"31g",price:350000,status:"분양 가능",description:"밝은 크림톤과 깨끗한 패턴이 매력적인 릴리화이트 개체입니다.",detail:"먹이 반응이 안정적이고 핸들링도 비교적 차분한 편입니다. 실제 개체 상태와 컨디션은 문의 시 최신 사진으로 안내드립니다.",tags:["릴리화이트","추천"],images:["/images/sample-1.jpg"],isVisible:true,created_at:"2026-08-28T10:00:00Z"},
  {id:"sample-2",individualId:"G-002",species:"레오파드 게코",morph:"하이옐로우",sex:"수컷",hatchDate:"2026-03-04",age:"5개월",weight:"25g",price:230000,status:"분양 가능",description:"선명한 옐로우 컬러가 돋보이는 건강한 개체입니다.",detail:"먹이 반응이 좋고 활발한 성격입니다.",tags:["하이옐로우"],images:["/images/sample-2.jpg"],isVisible:true,created_at:"2026-08-27T10:00:00Z"},
  {id:"sample-3",individualId:"G-003",species:"가고일 게코",morph:"레드 스트라이프",sex:"미구분",hatchDate:"2026-04-18",age:"4개월",weight:"18g",price:180000,status:"예약중",description:"등 라인의 레드 스트라이프가 또렷한 개체입니다.",detail:"현재 예약 진행 중인 개체입니다.",tags:["레드","스트라이프"],images:["/images/sample-3.jpg"],isVisible:true,created_at:"2026-08-26T10:00:00Z"},
  {id:"sample-4",individualId:"G-004",species:"크레스티드 게코",morph:"할리퀸",sex:"암컷",hatchDate:"2026-02-20",age:"6개월",weight:"28g",price:260000,status:"분양완료",description:"사이드 패턴이 풍성한 할리퀸 계열 개체입니다.",detail:"분양이 완료된 개체입니다.",tags:["할리퀸"],images:["/images/sample-4.jpg"],isVisible:true,created_at:"2026-08-25T10:00:00Z"}
];

const DEMO_KEY = "geckorium-demo-geckos-v2";
const normalize = (row) => ({
  id: row.id,
  individualId: row.individual_id ?? row.individualId ?? "",
  species: row.species ?? "",
  morph: row.morph ?? "",
  sex: row.sex ?? "미구분",
  hatchDate: row.hatch_date ?? row.hatchDate ?? "",
  age: row.age ?? "",
  weight: row.weight ?? "",
  price: Number(row.price ?? 0),
  status: row.status ?? "분양 가능",
  description: row.description ?? "",
  detail: row.detail ?? "",
  tags: Array.isArray(row.tags) ? row.tags : [],
  images: Array.isArray(row.images) ? row.images : [],
  isVisible: row.is_visible ?? row.isVisible ?? true,
  instagramMediaId: row.instagram_media_id ?? row.instagramMediaId ?? null,
  created_at: row.created_at ?? new Date().toISOString(),
  updated_at: row.updated_at ?? null,
});

const toDb = (g) => ({
  individual_id: g.individualId || null,
  species: g.species,
  morph: g.morph,
  sex: g.sex,
  hatch_date: g.hatchDate || null,
  age: g.age || null,
  weight: g.weight || null,
  price: Number(g.price || 0),
  status: g.status,
  description: g.description || null,
  detail: g.detail || null,
  tags: g.tags || [],
  images: g.images || [],
  is_visible: g.isVisible !== false,
  instagram_media_id: g.instagramMediaId || null,
  updated_at: new Date().toISOString(),
});

function demoLoad(){
  if(typeof window === "undefined") return SAMPLE_GECKOS;
  const saved=window.localStorage.getItem(DEMO_KEY);
  if(!saved){window.localStorage.setItem(DEMO_KEY,JSON.stringify(SAMPLE_GECKOS)); return SAMPLE_GECKOS;}
  try{return JSON.parse(saved);}catch{return SAMPLE_GECKOS;}
}

export async function getPublicGeckos(){
  if(!isSupabaseConfigured) return demoLoad().filter(x=>x.isVisible!==false);
  const {data,error}=await supabase.from("geckos").select("*").eq("is_visible",true).order("created_at",{ascending:false});
  if(error) throw error;
  return (data||[]).map(normalize);
}

export async function getAdminGeckos(){
  if(!isSupabaseConfigured) return demoLoad();
  const {data,error}=await supabase.from("geckos").select("*").order("created_at",{ascending:false});
  if(error) throw error;
  return (data||[]).map(normalize);
}

export async function saveGecko(gecko){
  if(!isSupabaseConfigured){
    const items=demoLoad();
    const next={...gecko};
    if(!next.id || String(next.id).startsWith("sample-")){next.id=crypto.randomUUID();next.created_at=new Date().toISOString();}
    const exists=items.some(x=>x.id===next.id);
    const updated=exists?items.map(x=>x.id===next.id?next:x):[next,...items];
    localStorage.setItem(DEMO_KEY,JSON.stringify(updated));
    return next;
  }
  const payload=toDb(gecko);
  if(gecko.id && !String(gecko.id).startsWith("sample-")){
    const {data,error}=await supabase.from("geckos").update(payload).eq("id",gecko.id).select().single();
    if(error) throw error; return normalize(data);
  }
  const {data,error}=await supabase.from("geckos").insert(payload).select().single();
  if(error) throw error; return normalize(data);
}

export async function removeGecko(id){
  if(!isSupabaseConfigured){localStorage.setItem(DEMO_KEY,JSON.stringify(demoLoad().filter(x=>x.id!==id)));return;}
  const {error}=await supabase.from("geckos").delete().eq("id",id); if(error) throw error;
}

export async function updateInstagramMediaId(id,mediaId){
  if(!isSupabaseConfigured || !id || String(id).startsWith("sample-")) return;
  const {error}=await supabase.from("geckos").update({instagram_media_id:mediaId,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) throw error;
}

function readAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}

async function toJpegFile(file){
  const dataUrl=await readAsDataURL(file);
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("이 이미지 형식은 브라우저에서 읽을 수 없습니다. JPG/PNG 사진을 사용해주세요."));img.src=dataUrl;});
  const max=2160, scale=Math.min(1,max/Math.max(image.width,image.height));
  const canvas=document.createElement("canvas"); canvas.width=Math.round(image.width*scale); canvas.height=Math.round(image.height*scale);
  const ctx=canvas.getContext("2d"); ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.9));
  if(!blob) throw new Error("이미지 변환에 실패했습니다.");
  return new File([blob],`${Date.now()}-${crypto.randomUUID()}.jpg`,{type:"image/jpeg"});
}

export async function uploadImages(files,folder="site"){
  const list=Array.from(files||[]).slice(0,10); if(!list.length) return [];
  const jpegFiles=[]; for(const f of list) jpegFiles.push(await toJpegFile(f));
  if(!isSupabaseConfigured){
    const out=[]; for(const f of jpegFiles) out.push(await readAsDataURL(f)); return out;
  }
  const urls=[];
  for(const file of jpegFiles){
    const path=`${folder}/${new Date().toISOString().slice(0,10)}/${file.name}`;
    const {error}=await supabase.storage.from("geckos").upload(path,file,{contentType:"image/jpeg",cacheControl:"3600",upsert:false});
    if(error) throw error;
    const {data}=supabase.storage.from("geckos").getPublicUrl(path); urls.push(data.publicUrl);
  }
  return urls;
}

export async function logInstagramPost({mediaId,caption,images,target,relatedGeckoId}){
  if(!isSupabaseConfigured) return;
  const {error}=await supabase.from("instagram_posts").insert({media_id:mediaId,caption,images,target,related_gecko_id:relatedGeckoId||null,status:"published"});
  if(error) throw error;
}
