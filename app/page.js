"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicGeckos } from "../lib/geckoData";

const categories=["전체","크레스티드","레오파드","가고일","기타"];
const money=v=>`${Number(v||0).toLocaleString("ko-KR")}원`;

function Status({value}){return <span className={`status ${value==="예약중"?"reserved":""} ${value==="분양완료"?"sold":""}`}>{value}</span>}

function Card({gecko,onOpen}){
  return <button className="geckoCard" onClick={()=>onOpen(gecko)}>
    <div className="cardPhoto"><img src={gecko.images?.[0]||"/images/sample-1.jpg"} alt={`${gecko.species} ${gecko.morph}`}/><Status value={gecko.status}/>{gecko.individualId?<span className="idBadge">{gecko.individualId}</span>:null}</div>
    <div className="cardBody"><p>{gecko.species}</p><h3>{gecko.morph}</h3><div className="cardMeta"><span>{gecko.sex}</span>{gecko.age?<span>{gecko.age}</span>:null}{gecko.weight?<span>{gecko.weight}</span>:null}</div><div className="cardPrice"><strong>{money(gecko.price)}</strong><i>→</i></div></div>
  </button>
}

function Detail({gecko,onClose}){
  const [active,setActive]=useState(0); if(!gecko) return null; const images=gecko.images?.length?gecko.images:["/images/sample-1.jpg"];
  return <div className="modalBackdrop" onMouseDown={onClose}><section className="detailModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={onClose}>×</button>
    <div className="detailGallery"><img className="detailMain" src={images[active]||images[0]} alt={gecko.morph}/>{images.length>1?<div className="thumbs">{images.map((src,i)=><button key={src+i} className={active===i?"active":""} onClick={()=>setActive(i)}><img src={src} alt=""/></button>)}</div>:null}</div>
    <div className="detailCopy"><span className="detailEyebrow">{gecko.individualId||"GECKORIUM"} · {gecko.species}</span><h2>{gecko.morph}</h2><strong className="detailPrice">{money(gecko.price)}</strong><div className="detailTags">{(gecko.tags||[]).map(t=><span key={t}>#{t}</span>)}</div>
      <dl><div><dt>성별</dt><dd>{gecko.sex}</dd></div><div><dt>나이</dt><dd>{gecko.age||"-"}</dd></div><div><dt>무게</dt><dd>{gecko.weight||"-"}</dd></div><div><dt>해칭일</dt><dd>{gecko.hatchDate||"-"}</dd></div><div><dt>상태</dt><dd>{gecko.status}</dd></div></dl>
      <p className="detailLead">{gecko.description||"개체 설명이 준비 중입니다."}</p>{gecko.detail?<p className="detailText">{gecko.detail}</p>:null}
      <div className="detailActions"><a className="goldButton" href={process.env.NEXT_PUBLIC_INSTAGRAM_URL||"#"} target="_blank" rel="noreferrer">인스타그램 문의</a><button className="lineButton" onClick={onClose}>계속 둘러보기</button></div>
    </div>
  </section></div>
}

export default function Home(){
  const [items,setItems]=useState([]),[category,setCategory]=useState("전체"),[query,setQuery]=useState(""),[selected,setSelected]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{setItems(await getPublicGeckos())}finally{setLoading(false)}})()},[]);
  const filtered=useMemo(()=>items.filter(g=>{const cat=category==="전체"||g.species.includes(category)||(category==="기타"&&!["크레스티드","레오파드","가고일"].some(x=>g.species.includes(x)));const q=query.trim().toLowerCase();const search=!q||`${g.individualId} ${g.species} ${g.morph} ${(g.tags||[]).join(" ")}`.toLowerCase().includes(q);return cat&&search;}),[items,category,query]);
  return <main>
    <header className="siteHeader"><a className="brand" href="#top"><img src="/images/geckorium-logo.png" alt="게코리움 로고"/><span><b>게코리움</b><small>GECKORIUM</small></span></a><nav className="desktopNav"><a href="#geckos">개체 보기</a><a href="#guide">사육 가이드</a><a href="#about">게코리움</a><a href="#visit">매장 안내</a></nav><a className="headerCta" href={process.env.NEXT_PUBLIC_INSTAGRAM_URL||"#"} target="_blank" rel="noreferrer">분양 문의</a></header>

    <section className="hero" id="top"><div className="heroCopy"><span className="eyebrow">GECKORIUM · GECKO SPECIALTY SHOP</span><h1>작은 생명이<br/><em>태어나는 곳</em></h1><p>귀여움만 보여드리지 않아요.<br/>개체 정보와 사육 안내까지 한눈에 확인하세요.</p><div className="heroActions"><a className="goldButton" href="#geckos">개체 둘러보기</a><a className="lineButton" href="#guide">사육 가이드</a></div><div className="heroPoints"><span>✓ 개체별 상세정보</span><span>✓ 모바일 최적화</span><span>✓ 빠른 문의</span></div></div><div className="heroLogo"><div className="castleGlow"></div><img src="/images/geckorium-logo.png" alt="게코리움"/><span className="heroSeal">GECKO · EGG · CASTLE</span></div></section>

    <section className="ticker"><span>GECKORIUM</span><i>✦</i><span>HEALTHY GECKOS</span><i>✦</i><span>CAREFUL MATCHING</span><i>✦</i><span>BEGINNER FRIENDLY</span></section>

    <section className="discover" id="geckos"><div className="sectionHead"><div><span className="eyebrow green">AVAILABLE GECKOS</span><h2>게코리움 친구들</h2><p>사진을 누르면 개체별 상세정보를 확인할 수 있어요.</p></div><label className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="모프, 종, 개체번호 검색"/></label></div><div className="filters">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>{loading?<div className="empty">개체 정보를 불러오는 중...</div>:filtered.length?<div className="geckoGrid">{filtered.map(g=><Card key={g.id} gecko={g} onOpen={setSelected}/>)}</div>:<div className="empty">현재 조건에 맞는 개체가 없어요.</div>}</section>

    <section className="brandStory" id="about"><div className="storyLogo"><img src="/images/geckorium-logo.png" alt="게코리움 로고"/></div><div className="storyCopy"><span className="eyebrow gold">WELCOME TO GECKORIUM</span><h2>게코와 사람이<br/>좋은 인연을 만나는 공간</h2><p>게코리움은 개체의 매력뿐 아니라 건강 상태, 기본 사육 정보, 분양 후 관리까지 쉽게 확인할 수 있는 게코 전문샵을 지향합니다.</p><div className="storyStats"><div><b>01</b><span>사진 중심 개체 정보</span></div><div><b>02</b><span>명확한 분양 상태</span></div><div><b>03</b><span>초보자 사육 가이드</span></div></div></div></section>

    <section className="guide" id="guide"><div className="guideCopy"><span className="eyebrow gold">GECKORIUM CARE GUIDE</span><h2>처음 키워도<br/>덜 어렵게</h2><p>온도, 습도, 먹이, 핸들링과 청소까지 꼭 필요한 사육 정보를 게코리움 기준으로 정리합니다.</p><a className="darkButton" href="/images/crested-guide.jpg" target="_blank">크레스티드 게코 가이드 보기 →</a></div><div className="guidePreview"><img src="/images/crested-guide.jpg" alt="게코리움 크레스티드 게코 사육 가이드"/></div></section>

    <section className="visit" id="visit"><div className="visitPhoto"><img src="/images/storefront.jpg" alt="게코리움 매장 간판"/></div><div className="visitCopy"><span className="eyebrow green">VISIT GECKORIUM</span><h2>온라인에서 보고,<br/>매장에서 만나세요.</h2><p>네이버 지도와 인스타그램 프로필에서 바로 들어와 현재 개체를 확인할 수 있도록 운영합니다.</p><div className="heroActions"><a className="goldButton" href={process.env.NEXT_PUBLIC_NAVER_MAP_URL||"#"} target="_blank" rel="noreferrer">네이버 지도</a><a className="lineButton" href={process.env.NEXT_PUBLIC_INSTAGRAM_URL||"#"} target="_blank" rel="noreferrer">인스타그램</a></div></div></section>

    <footer><div className="footerBrand"><img src="/images/geckorium-logo.png" alt=""/><div><b>게코리움</b><small>GECKORIUM</small></div></div><p>작은 생명이 태어나고 좋은 인연이 시작되는 곳.</p><div className="footerLinks"><a href="#geckos">개체 보기</a><a href="#guide">사육 가이드</a><a href="#visit">매장 안내</a></div></footer>
    <nav className="mobileNav"><a href="#top"><span>⌂</span>홈</a><a href="#geckos"><span>◉</span>개체</a><a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL||"#"}><span>♡</span>문의</a><a href="#visit"><span>⌖</span>매장</a></nav>
    {selected?<Detail gecko={selected} onClose={()=>setSelected(null)}/>:null}
  </main>
}
