"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminGeckos, logInstagramPost, removeGecko, saveGecko, updateInstagramMediaId, uploadImages } from "../../lib/geckoData";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const EMPTY={individualId:"",species:"크레스티드 게코",morph:"",sex:"미구분",hatchDate:"",age:"",weight:"",price:"",status:"분양 가능",description:"",detail:"",tags:[],images:[],isVisible:true};
const money=v=>`${Number(v||0).toLocaleString("ko-KR")}원`;
const TARGETS=[
  {id:"site",title:"사이트에만 게시",desc:"게코리움 홈페이지 개체 목록에만 등록합니다.",icon:"⌂"},
  {id:"both",title:"사이트 + 인스타그램",desc:"홈페이지 등록 후 같은 사진과 내용으로 인스타에도 게시합니다.",icon:"✦"},
  {id:"instagram",title:"인스타그램에만 게시",desc:"사이트 개체 목록에는 등록하지 않고 인스타에만 게시합니다.",icon:"◎"},
];

function autoCaption(form){return ["🦎 GECKORIUM NEW GECKO","",form.individualId?`개체번호 : ${form.individualId}`:"",`${form.species} / ${form.morph}`,`성별 : ${form.sex}`,form.age?`나이 : ${form.age}`:"",form.weight?`무게 : ${form.weight}`:"",`분양가 : ${money(form.price)}`,`상태 : ${form.status}`,"",form.description,"","상세 문의는 DM 또는 프로필 링크로 부탁드립니다.","#게코리움 #GECKORIUM #게코 #크레스티드게코"].filter(Boolean).join("\n")}

export default function Admin(){
  const [ready,setReady]=useState(false),[loggedIn,setLoggedIn]=useState(!isSupabaseConfigured),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[loginError,setLoginError]=useState("");
  const [items,setItems]=useState([]),[form,setForm]=useState(EMPTY),[files,setFiles]=useState([]),[target,setTarget]=useState("site"),[caption,setCaption]=useState(""),[captionTouched,setCaptionTouched]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState(""),[messageType,setMessageType]=useState("ok");
  const previews=useMemo(()=>files.map(f=>URL.createObjectURL(f)),[files]);

  async function refresh(){setItems(await getAdminGeckos())}
  useEffect(()=>{(async()=>{if(isSupabaseConfigured){const {data}=await supabase.auth.getSession();setLoggedIn(Boolean(data.session))}setReady(true)})()},[]);
  useEffect(()=>{if(ready&&loggedIn) refresh()},[ready,loggedIn]);
  useEffect(()=>{if(target!=="site"&&!captionTouched)setCaption(autoCaption(form))},[form,target,captionTouched]);

  async function login(e){e.preventDefault();setLoginError("");const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setLoginError("이메일 또는 비밀번호를 확인해주세요.");return}setLoggedIn(true)}
  async function logout(){if(isSupabaseConfigured) await supabase.auth.signOut();setLoggedIn(false)}
  function reset(){setForm(EMPTY);setFiles([]);setTarget("site");setCaption("");setCaptionTouched(false);setMessage("")}
  function edit(item){setForm({...EMPTY,...item});setFiles([]);setTarget("site");setCaption("");setCaptionTouched(false);window.scrollTo({top:0,behavior:"smooth"})}
  function setTags(v){setForm({...form,tags:v.split(",").map(x=>x.trim()).filter(Boolean)})}

  async function publishInstagram(images,cap){
    if(!isSupabaseConfigured) throw new Error("인스타그램 자동 게시에는 Supabase 연결이 필요합니다.");
    const {data}=await supabase.auth.getSession(); const token=data.session?.access_token; if(!token) throw new Error("관리자 로그인이 필요합니다.");
    const res=await fetch("/api/instagram/publish",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({images,caption:cap})});
    const result=await res.json(); if(!res.ok) throw new Error(result.error||"Instagram 게시에 실패했습니다."); return result;
  }

  async function submit(e){
    e.preventDefault(); setMessage(""); setMessageType("ok");
    if(!form.morph.trim()){setMessageType("error");setMessage("모프 이름을 입력해주세요.");return}
    if(!files.length && !(form.images||[]).length){setMessageType("error");setMessage("사진을 최소 1장 선택해주세요.");return}
    if((target==="both"||target==="instagram")&&!isSupabaseConfigured){setMessageType("error");setMessage("인스타그램 게시를 사용하려면 Supabase를 먼저 연결해주세요.");return}
    let saved=null;
    try{
      setSaving(true);
      const uploaded=files.length?await uploadImages(files,target==="instagram"?"instagram":"site"):[];
      const allImages=[...(form.images||[]),...uploaded];
      const payload={...form,price:Number(form.price||0),images:allImages};
      let instagramResult=null;
      if(target==="site"||target==="both") saved=await saveGecko(payload);
      if(target==="both"||target==="instagram"){
        instagramResult=await publishInstagram(allImages,caption||autoCaption(form));
        try{
          await logInstagramPost({mediaId:instagramResult.id,caption:caption||autoCaption(form),images:allImages,target,relatedGeckoId:saved?.id});
          if(saved?.id) await updateInstagramMediaId(saved.id,instagramResult.id);
        }catch(logError){
          console.warn("Instagram 게시 기록 저장 실패",logError);
        }
      }
      const successMessage=target==="site"
        ? "사이트에 개체가 등록됐어요. 고객 페이지를 새로고침하면 바로 보입니다."
        : target==="both"
          ? "사이트 등록 + 인스타그램 게시가 모두 완료됐어요."
          : "인스타그램에만 게시됐어요. 사이트 개체 목록에는 추가되지 않았습니다.";
      reset();
      setMessageType("ok");
      setMessage(successMessage);
      await refresh();
    }catch(err){
      setMessageType("error");
      setMessage(saved&&target==="both"
        ? `사이트 등록은 완료됐지만 인스타그램 게시에 실패했습니다: ${err.message}`
        : `처리 중 오류: ${err.message}`);
      if(saved) await refresh();
    }finally{setSaving(false)}
  }

  async function remove(item){if(!confirm(`${item.morph} 개체를 삭제할까요?`))return;try{await removeGecko(item.id);await refresh()}catch(err){alert(err.message)}}

  if(!ready) return <main className="adminPage"><div className="adminLoading">게코리움 관리자 페이지 준비 중...</div></main>;
  if(!loggedIn) return <main className="loginPage"><form className="loginCard" onSubmit={login}><img src="/images/geckorium-logo.png" alt="게코리움"/><span>GECKORIUM ADMIN</span><h1>관리자 로그인</h1><p>등록·수정·인스타그램 게시 권한이 있는 관리자 계정으로 로그인하세요.</p><input type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} required/>{loginError?<div className="adminMessage error">{loginError}</div>:null}<button className="adminPrimary">로그인</button><a href="/">고객 사이트로 돌아가기</a></form></main>;

  return <main className="adminPage"><header className="adminHeader"><div className="adminBrand"><img src="/images/geckorium-logo.png" alt=""/><div><b>게코리움 관리자</b><small>GECKORIUM CONTENT MANAGER</small></div></div><div className="adminHeaderActions"><a href="/" target="_blank">고객 사이트 ↗</a>{isSupabaseConfigured?<button onClick={logout}>로그아웃</button>:null}</div></header>
    {!isSupabaseConfigured?<div className="demoBanner"><b>DEMO MODE</b> 지금은 이 브라우저에만 저장됩니다. 실제 고객 모두에게 보이게 하려면 README의 Supabase 설정을 완료해주세요.</div>:<div className="connectedBanner"><b>LIVE DATABASE CONNECTED</b> 관리자에서 사이트에 게시한 내용은 Supabase에 저장되어 모든 방문자에게 표시됩니다.</div>}
    <div className="adminLayout"><section className="editor"><div className="adminSectionHead"><div><span>NEW GECKO</span><h1>{form.id?"개체 수정":"새 콘텐츠 등록"}</h1><p>한 번 작성하고 사이트/인스타그램 게시 위치를 선택하세요.</p></div>{form.id?<button onClick={reset}>새 등록으로</button>:null}</div>
      <form className="adminForm" onSubmit={submit}>
        <div className="publishBlock full"><div className="fieldTitle">게시 위치 선택</div><p>아래 3가지 중 하나만 선택됩니다.</p><div className="targetGrid">{TARGETS.map(t=><label key={t.id} className={`targetCard ${target===t.id?"active":""}`}><input type="checkbox" checked={target===t.id} onChange={()=>setTarget(t.id)}/><span className="targetIcon">{t.icon}</span><span><b>{t.title}</b><small>{t.desc}</small></span></label>)}</div></div>
        <label className="full"><span>사진 (최대 10장)</span><div className="uploadZone"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,10))}/><b>사진 선택 또는 휴대폰에서 촬영</b><small>인스타 게시 호환을 위해 업로드 시 JPEG로 자동 변환합니다.</small></div><div className="previewRow">{(form.images||[]).map((u,i)=><img key={u+i} src={u} alt=""/>)}{previews.map((u,i)=><img key={u+i} src={u} alt=""/>)}</div></label>
        <label><span>개체번호</span><input value={form.individualId} onChange={e=>setForm({...form,individualId:e.target.value})} placeholder="예: CR-026"/></label>
        <label><span>종</span><select value={form.species} onChange={e=>setForm({...form,species:e.target.value})}><option>크레스티드 게코</option><option>레오파드 게코</option><option>가고일 게코</option><option>기타 게코</option></select></label>
        <label><span>모프</span><input value={form.morph} onChange={e=>setForm({...form,morph:e.target.value})} placeholder="예: 릴리화이트"/></label>
        <label><span>성별</span><select value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option>미구분</option><option>수컷</option><option>암컷</option></select></label>
        <label><span>해칭일</span><input type="date" value={form.hatchDate} onChange={e=>setForm({...form,hatchDate:e.target.value})}/></label>
        <label><span>나이</span><input value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="예: 8개월"/></label>
        <label><span>무게</span><input value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="예: 31g"/></label>
        <label><span>분양가</span><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="350000"/></label>
        <label className="full"><span>분양 상태</span><div className="statusButtons">{["분양 가능","예약중","분양완료"].map(s=><button type="button" key={s} className={form.status===s?"active":""} onClick={()=>setForm({...form,status:s})}>{s}</button>)}</div></label>
        <label className="full"><span>짧은 소개</span><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="카드와 상세페이지 상단에 보이는 소개"/></label>
        <label className="full"><span>상세 내용</span><textarea rows="7" value={form.detail} onChange={e=>setForm({...form,detail:e.target.value})} placeholder="먹이 반응, 성격, 컨디션, 특이사항 등 상세 내용을 자유롭게 작성하세요."/></label>
        <label className="full"><span>태그</span><input value={(form.tags||[]).join(", ")} onChange={e=>setTags(e.target.value)} placeholder="릴리화이트, 추천, 베이비"/></label>
        {(target==="site"||target==="both")?<label className="visibleCheck full"><input type="checkbox" checked={form.isVisible!==false} onChange={e=>setForm({...form,isVisible:e.target.checked})}/><span><b>사이트에 공개</b><small>체크를 끄면 DB에는 저장되지만 고객 페이지에서는 숨겨집니다.</small></span></label>:null}
        {target!=="site"?<label className="full instagramCaption"><span>인스타그램 캡션</span><textarea rows="12" value={caption} onChange={e=>{setCaption(e.target.value);setCaptionTouched(true)}}/><small>기본 캡션을 자동 생성했어요. 게시 전에 자유롭게 수정할 수 있습니다.</small></label>:null}
        {message?<div className={`adminMessage full ${messageType==="error"?"error":""}`}>{message}</div>:null}
        <div className="formActions full"><button type="button" className="adminSecondary" onClick={reset}>초기화</button><button className="adminPrimary" disabled={saving}>{saving?"처리 중...":target==="site"?"사이트에 게시":target==="both"?"사이트 + 인스타 게시":"인스타에만 게시"}</button></div>
      </form>
    </section>
    <aside className="adminAside"><div className="adminSectionHead"><div><span>SITE FEED</span><h2>등록 개체</h2></div><b className="countPill">{items.length}</b></div><div className="adminItems">{items.map(item=><article key={item.id}><img src={item.images?.[0]||"/images/sample-1.jpg"} alt=""/><div><small>{item.individualId||item.species}</small><b>{item.morph}</b><span>{money(item.price)} · {item.status}{item.isVisible===false?" · 숨김":""}</span></div><div className="itemActions"><button onClick={()=>edit(item)}>수정</button><button className="danger" onClick={()=>remove(item)}>삭제</button></div></article>)}</div></aside></div>
  </main>
}
