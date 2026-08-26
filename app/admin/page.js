"use client";

import { useEffect, useMemo, useState } from "react";
import { getGeckos, removeGecko, saveGecko, uploadGeckoImages } from "../../lib/geckoData";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const EMPTY = {
  species: "크레스티드 게코",
  morph: "",
  sex: "미구분",
  hatchDate: "",
  age: "",
  price: "",
  status: "분양 가능",
  description: "",
  images: [],
};

function money(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!isSupabaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [instagram, setInstagram] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    setItems(await getGeckos());
  }

  useEffect(() => {
    async function init() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        setLoggedIn(Boolean(data.session));
      }
      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (ready && loggedIn) refresh();
  }, [ready, loggedIn]);

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  async function login(e) {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError("로그인 정보를 확인해주세요.");
      return;
    }
    setLoggedIn(true);
  }

  async function logout() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setLoggedIn(false);
  }

  function edit(item) {
    setForm({ ...EMPTY, ...item });
    setFiles([]);
    setInstagram(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setForm(EMPTY);
    setFiles([]);
    setInstagram(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.morph.trim()) {
      setMessage("모프 이름을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const uploaded = files.length ? await uploadGeckoImages(files) : [];
      const next = {
        ...form,
        price: Number(form.price || 0),
        images: [...(form.images || []), ...uploaded],
      };

      const saved = await saveGecko(next);

      if (instagram) {
        const publicImages = saved.images.filter((url) => /^https?:\/\//.test(url));
        if (!publicImages.length) {
          setMessage("개체는 등록됐어요. 인스타 자동 게시는 Supabase에 공개 이미지가 올라간 뒤 사용할 수 있어요.");
        } else {
          const caption = [
            "🦎 NEW GECKO",
            "",
            `${saved.species} / ${saved.morph}`,
            `성별 : ${saved.sex}`,
            saved.age ? `나이 : ${saved.age}` : "",
            `분양가 : ${money(saved.price)}`,
            `상태 : ${saved.status}`,
            "",
            "문의는 DM 또는 프로필 링크",
          ].filter(Boolean).join("\n");

          const response = await fetch("/api/instagram/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: publicImages, caption }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Instagram publish failed");
          setMessage("사이트 등록과 인스타 게시가 완료됐어요.");
        }
      } else {
        setMessage("개체가 사이트에 등록됐어요.");
      }

      reset();
      await refresh();
    } catch (error) {
      setMessage(`저장 중 오류: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!confirm(`${item.morph} 개체를 삭제할까요?`)) return;
    await removeGecko(item.id);
    await refresh();
  }

  if (!ready) return <main className="adminShell"><div className="adminLoading">관리자 페이지 준비 중...</div></main>;

  if (!loggedIn) {
    return (
      <main className="loginPage">
        <form className="loginCard" onSubmit={login}>
          <div className="adminLogo">🏝️</div>
          <span>GECKO ISLAND ADMIN</span>
          <h1>관리자 로그인</h1>
          <p>Supabase Auth에 등록한 관리자 이메일로 로그인하세요.</p>
          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {loginError ? <div className="adminMessage error">{loginError}</div> : null}
          <button className="adminPrimary">로그인</button>
          <a href="/">고객용 사이트로 돌아가기</a>
        </form>
      </main>
    );
  }

  return (
    <main className="adminShell">
      <header className="adminHeader">
        <div><span>🏝️</span><div><b>게코섬 관리자</b><small>{isSupabaseConfigured ? "SUPABASE CONNECTED" : "DEMO MODE · 이 브라우저에만 저장"}</small></div></div>
        <div className="adminHeaderActions">
          <a href="/" target="_blank">사이트 보기 ↗</a>
          {isSupabaseConfigured ? <button onClick={logout}>로그아웃</button> : null}
        </div>
      </header>

      {!isSupabaseConfigured ? (
        <div className="demoNotice">현재 데모 모드입니다. 등록/수정은 이 브라우저에만 저장됩니다. Supabase 환경변수를 연결하면 모든 방문자가 같은 개체 목록을 보게 됩니다.</div>
      ) : null}

      <div className="adminGrid">
        <section className="editorCard">
          <div className="adminSectionHead">
            <div><span>GECKO EDITOR</span><h1>{form.id ? "개체 수정" : "새 개체 등록"}</h1></div>
            {form.id ? <button onClick={reset}>새 등록으로 전환</button> : null}
          </div>

          <form onSubmit={submit} className="geckoForm">
            <label className="full">
              <span>사진</span>
              <div className="uploadZone">
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))} />
                <b>사진 선택하기</b>
                <small>최대 10장 · 휴대폰에서 바로 촬영/선택 가능</small>
              </div>
              <div className="previewRow">
                {(form.images || []).map((url, index) => <img key={url + index} src={url} alt="" />)}
                {previewUrls.map((url, index) => <img key={url} src={url} alt={`새 이미지 ${index + 1}`} />)}
              </div>
            </label>

            <label><span>종</span><select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}><option>크레스티드 게코</option><option>레오파드 게코</option><option>가고일 게코</option><option>기타 게코</option></select></label>
            <label><span>모프</span><input value={form.morph} onChange={(e) => setForm({ ...form, morph: e.target.value })} placeholder="예: 릴리화이트" /></label>
            <label><span>성별</span><select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}><option>미구분</option><option>수컷</option><option>암컷</option></select></label>
            <label><span>나이 표시</span><input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="예: 8개월" /></label>
            <label><span>해칭일</span><input type="date" value={form.hatchDate} onChange={(e) => setForm({ ...form, hatchDate: e.target.value })} /></label>
            <label><span>분양가</span><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="350000" /></label>
            <label className="full"><span>상태</span><div className="statusChooser">{["분양 가능","예약중","분양완료"].map((s) => <button type="button" className={form.status === s ? "active" : ""} key={s} onClick={() => setForm({ ...form, status: s })}>{s}</button>)}</div></label>
            <label className="full"><span>설명</span><textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="성격, 먹이 반응, 특징 등을 입력하세요." /></label>

            <label className="instagramCheck full">
              <input type="checkbox" checked={instagram} onChange={(e) => setInstagram(e.target.checked)} />
              <span><b>인스타그램에도 같이 게시</b><small>Meta API 환경변수가 연결되어 있을 때 자동 게시됩니다.</small></span>
            </label>

            {message ? <div className="adminMessage full">{message}</div> : null}

            <div className="formActions full">
              <button type="button" className="adminSecondary" onClick={reset}>초기화</button>
              <button className="adminPrimary" disabled={saving}>{saving ? "등록 중..." : form.id ? "수정 저장" : instagram ? "사이트 + 인스타 등록" : "사이트에 등록"}</button>
            </div>
          </form>
        </section>

        <aside className="adminList">
          <div className="adminSectionHead"><div><span>FEED</span><h2>등록 개체</h2></div><b>{items.length}</b></div>

          <div className="adminItems">
            {items.map((item) => (
              <article key={item.id}>
                <img src={item.images?.[0] || "/images/gecko-1.jpg"} alt="" />
                <div><small>{item.species}</small><b>{item.morph}</b><span>{money(item.price)} · {item.status}</span></div>
                <div className="itemActions"><button onClick={() => edit(item)}>수정</button><button className="danger" onClick={() => remove(item)}>삭제</button></div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
