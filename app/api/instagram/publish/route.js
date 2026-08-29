import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function endpoint(base,version,path){return `${String(base).replace(/\/$/,"")}/${version}/${path.replace(/^\//,"")}`}
function body(values){const b=new URLSearchParams();Object.entries(values).forEach(([k,v])=>{if(v!==undefined&&v!==null)b.set(k,String(v))});return b}

async function verifyAdmin(request){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  const auth=request.headers.get("authorization")||""; const token=auth.replace(/^Bearer\s+/i,""); if(!token) throw new Error("관리자 인증 토큰이 없습니다.");
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.getUser(token); if(error||!data.user) throw new Error("관리자 인증에 실패했습니다.");
  const allow=(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(allow.length && !allow.includes(String(data.user.email||"").toLowerCase())) throw new Error("Instagram 게시 권한이 없는 관리자입니다.");
  return data.user;
}

async function postForm(url,values){
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body(values),cache:"no-store"});
  const data=await res.json(); if(!res.ok||data.error) throw new Error(data?.error?.message||`Meta API 오류 (${res.status})`); return data;
}

async function getJson(url){const res=await fetch(url,{cache:"no-store"});const data=await res.json();if(!res.ok||data.error)throw new Error(data?.error?.message||`Meta API 오류 (${res.status})`);return data}

async function waitReady(base,version,id,token){
  for(let i=0;i<12;i++){
    const url=endpoint(base,version,`${id}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    const data=await getJson(url); const status=data.status_code;
    if(status==="FINISHED"||status==="PUBLISHED") return;
    if(status==="ERROR"||status==="EXPIRED") throw new Error(`Instagram 미디어 처리 실패: ${status}`);
    await sleep(1200);
  }
  throw new Error("Instagram 미디어 처리 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.");
}

export async function POST(request){
  try{
    await verifyAdmin(request);
    const {images=[],caption=""}=await request.json();
    const token=process.env.INSTAGRAM_ACCESS_TOKEN,userId=process.env.INSTAGRAM_USER_ID,base=process.env.INSTAGRAM_GRAPH_BASE_URL||"https://graph.instagram.com",version=process.env.INSTAGRAM_API_VERSION||"v26.0";
    if(!token||!userId) return Response.json({error:"Instagram 환경변수(INSTAGRAM_USER_ID / INSTAGRAM_ACCESS_TOKEN)가 설정되지 않았습니다."},{status:501});
    const urls=images.filter(u=>/^https:\/\//i.test(u)).slice(0,10); if(!urls.length) return Response.json({error:"Instagram 게시에는 공개 HTTPS 이미지 URL이 필요합니다."},{status:400});
    const mediaUrl=endpoint(base,version,`${userId}/media`), publishUrl=endpoint(base,version,`${userId}/media_publish`);
    let creationId;
    if(urls.length===1){
      const c=await postForm(mediaUrl,{image_url:urls[0],caption,access_token:token}); creationId=c.id; await waitReady(base,version,creationId,token);
    }else{
      const children=[];
      for(const u of urls){const child=await postForm(mediaUrl,{image_url:u,is_carousel_item:"true",access_token:token});children.push(child.id);await waitReady(base,version,child.id,token)}
      const carousel=await postForm(mediaUrl,{media_type:"CAROUSEL",children:children.join(","),caption,access_token:token});creationId=carousel.id;await waitReady(base,version,creationId,token);
    }
    const pub=await postForm(publishUrl,{creation_id:creationId,access_token:token}); return Response.json({ok:true,id:pub.id});
  }catch(error){return Response.json({error:error.message||"Instagram 게시 오류"},{status:500})}
}
