"use client";

import { useEffect, useMemo, useState } from "react";
import { getGeckos } from "../lib/geckoData";

const categories = ["전체", "크레스티드", "레오파드", "가고일", "기타"];

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function GeckoCard({ gecko, onOpen }) {
  const image = gecko.images?.[0] || "/images/gecko-1.jpg";

  return (
    <button className="geckoCard" onClick={() => onOpen(gecko)}>
      <div className="geckoPhoto">
        <img src={image} alt={`${gecko.species} ${gecko.morph}`} />
        <span className={`statusBadge ${gecko.status === "예약중" ? "reserved" : ""} ${gecko.status === "분양완료" ? "sold" : ""}`}>
          {gecko.status}
        </span>
      </div>
      <div className="geckoBody">
        <p>{gecko.species}</p>
        <h3>{gecko.morph}</h3>
        <div className="miniTags">
          <span>{gecko.sex}</span>
          {gecko.age ? <span>{gecko.age}</span> : null}
        </div>
        <div className="priceLine">
          <strong>{formatPrice(gecko.price)}</strong>
          <i>→</i>
        </div>
      </div>
    </button>
  );
}

function DetailModal({ gecko, onClose }) {
  const [active, setActive] = useState(0);
  const images = gecko?.images?.length ? gecko.images : ["/images/gecko-1.jpg"];

  if (!gecko) return null;

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <section className="detailModal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>×</button>

        <div className="detailGallery">
          <img className="detailMainImage" src={images[active] || images[0]} alt={gecko.morph} />
          {images.length > 1 ? (
            <div className="thumbRow">
              {images.map((src, index) => (
                <button key={src + index} className={active === index ? "activeThumb" : ""} onClick={() => setActive(index)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detailInfo">
          <span className="detailSpecies">{gecko.species}</span>
          <h2>{gecko.morph}</h2>
          <strong className="detailPrice">{formatPrice(gecko.price)}</strong>

          <dl>
            <div><dt>성별</dt><dd>{gecko.sex}</dd></div>
            <div><dt>나이</dt><dd>{gecko.age || "-"}</dd></div>
            <div><dt>해칭일</dt><dd>{gecko.hatchDate || "-"}</dd></div>
            <div><dt>상태</dt><dd>{gecko.status}</dd></div>
          </dl>

          <p className="detailDescription">{gecko.description || "추가 설명이 준비 중입니다."}</p>

          <div className="detailActions">
            <a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"} target="_blank" rel="noreferrer" className="primaryButton">
              인스타 문의
            </a>
            <button className="outlineButton" onClick={onClose}>계속 둘러보기</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [geckos, setGeckos] = useState([]);
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setLoading(true);
      setGeckos(await getGeckos());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return geckos.filter((gecko) => {
      const categoryMatch =
        category === "전체" ||
        (category === "기타" &&
          !["크레스티드", "레오파드", "가고일"].some((name) => gecko.species.includes(name))) ||
        gecko.species.includes(category);

      const queryMatch =
        !q ||
        `${gecko.species} ${gecko.morph} ${gecko.sex} ${gecko.status}`
          .toLowerCase()
          .includes(q);

      return categoryMatch && queryMatch;
    });
  }, [geckos, category, query]);

  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#top">
          <span className="brandIcon">🏝️</span>
          <span>
            <b>게코섬</b>
            <small>GECKO ISLAND</small>
          </span>
        </a>

        <nav className="desktopNav">
          <a href="#geckos">개체 보기</a>
          <a href="#guide">입양 안내</a>
          <a href="#visit">매장 안내</a>
        </nav>

        <a className="headerContact" href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"} target="_blank" rel="noreferrer">
          문의하기
        </a>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <span className="eyebrow">SEOUL · GECKO SPECIALTY SHOP</span>
          <h1>게코를 만나는<br /><em>작은 섬</em></h1>
          <p>사진은 크게, 정보는 간단하게.<br />마음에 드는 친구를 편하게 만나보세요.</p>
          <div className="heroActions">
            <a className="primaryButton" href="#geckos">개체 둘러보기</a>
            <a className="softButton" href="#visit">매장 안내</a>
          </div>
          <div className="heroTrust">
            <span>✓ 모바일 최적화</span>
            <span>✓ 쉬운 개체 정보</span>
            <span>✓ 빠른 문의</span>
          </div>
        </div>

        <div className="heroVisual">
          <img src="/images/geckoseom-sign.jpg" alt="게코섬 매장 간판 디자인" />
          <div className="heroFloat">
            <span>NEW ISLANDER</span>
            <b>새로 온 친구</b>
            <small>최근 등록 개체를 바로 확인하세요</small>
          </div>
        </div>
      </section>

      <section className="discover" id="geckos">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow green">GECKO FEED</span>
            <h2>게코섬 친구들</h2>
            <p>피드처럼 편하게 내려보며 마음에 드는 개체를 찾아보세요.</p>
          </div>
          <div className="searchBox">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="모프나 종 검색" />
          </div>
        </div>

        <div className="filterRow">
          {categories.map((item) => (
            <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="emptyState">개체 정보를 불러오는 중...</div>
        ) : filtered.length ? (
          <div className="geckoGrid">
            {filtered.map((gecko) => (
              <GeckoCard key={gecko.id} gecko={gecko} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <div className="emptyState">조건에 맞는 개체가 아직 없어요.</div>
        )}
      </section>

      <section className="promise">
        <div className="promiseHeader">
          <span className="eyebrow lime">GECKO ISLAND</span>
          <h2>보기 편한 게코샵</h2>
        </div>

        <div className="promiseGrid">
          <article><span>01</span><h3>사진 중심</h3><p>개체의 매력이 잘 보이도록 사진을 크게 보여줘요.</p></article>
          <article><span>02</span><h3>정보는 한눈에</h3><p>종, 모프, 성별, 나이, 가격, 현재 상태를 간단하게 정리해요.</p></article>
          <article><span>03</span><h3>상태도 바로</h3><p>분양 가능, 예약중, 분양완료 여부를 카드에서 바로 확인해요.</p></article>
        </div>
      </section>

      <section className="guide" id="guide">
        <div className="guideText">
          <span className="eyebrow green">FIRST GECKO?</span>
          <h2>처음 키워도<br />어렵지 않게</h2>
          <p>사육장, 온도, 먹이와 관리법까지 입양 전 꼭 알아야 할 내용만 쉽게 정리할 예정이에요.</p>
          <span className="comingSoon">게코 가이드 준비중 →</span>
        </div>
        <div className="guideIcons"><span>🌿</span><span>🦎</span><span>☀️</span></div>
      </section>

      <section className="visit" id="visit">
        <div className="visitImage"><img src="/images/storefront.jpg" alt="게코섬 매장" /></div>
        <div className="visitText">
          <span className="eyebrow green">VISIT GECKO ISLAND</span>
          <h2>온라인에서 보고,<br />매장에서 만나세요.</h2>
          <p>네이버 지도와 인스타그램 소개글에 링크 하나만 걸어두면 누구나 로그인 없이 바로 개체를 확인할 수 있게 만들어요.</p>
          <div className="visitButtons">
            <a className="primaryButton" href={process.env.NEXT_PUBLIC_NAVER_MAP_URL || "#"} target="_blank" rel="noreferrer">네이버 지도</a>
            <a className="outlineButton" href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"} target="_blank" rel="noreferrer">인스타그램</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="footerBrand"><span>🏝️</span><div><b>게코섬</b><small>GECKO ISLAND</small></div></div>
        <p>건강한 게코, 좋은 인연을 만나는 작은 섬.</p>
        <div className="footerLinks"><a href="#geckos">개체 보기</a><a href="#guide">입양 안내</a><a href="#visit">매장 안내</a></div>
      </footer>

      <nav className="mobileNav">
        <a href="#top"><span>⌂</span>홈</a>
        <a href="#geckos"><span>◉</span>개체</a>
        <a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#"}><span>♡</span>문의</a>
        <a href="#visit"><span>⌖</span>매장</a>
      </nav>

      {selected ? <DetailModal gecko={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
