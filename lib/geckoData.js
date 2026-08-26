import { isSupabaseConfigured, supabase } from "./supabase";

export const SAMPLE_GECKOS = [
  {
    id: "sample-1",
    species: "크레스티드 게코",
    morph: "릴리화이트",
    sex: "암컷",
    hatchDate: "2026-01-12",
    age: "8개월",
    price: 350000,
    status: "분양 가능",
    description: "밝은 크림톤이 매력적인 릴리화이트 개체입니다.",
    images: ["/images/gecko-1.jpg"],
    created_at: "2026-08-26T08:00:00.000Z",
  },
  {
    id: "sample-2",
    species: "레오파드 게코",
    morph: "하이옐로우",
    sex: "수컷",
    hatchDate: "2026-03-04",
    age: "5개월",
    price: 230000,
    status: "분양 가능",
    description: "선명한 옐로우 컬러와 안정적인 먹이 반응을 보이는 개체입니다.",
    images: ["/images/gecko-2.jpg"],
    created_at: "2026-08-25T08:00:00.000Z",
  },
  {
    id: "sample-3",
    species: "가고일 게코",
    morph: "레드 스트라이프",
    sex: "미구분",
    hatchDate: "2026-04-18",
    age: "4개월",
    price: 180000,
    status: "예약중",
    description: "등 라인의 레드 스트라이프가 또렷한 가고일 게코입니다.",
    images: ["/images/gecko-3.jpg"],
    created_at: "2026-08-24T08:00:00.000Z",
  },
  {
    id: "sample-4",
    species: "레오파드 게코",
    morph: "스노우",
    sex: "암컷",
    hatchDate: "2026-02-20",
    age: "6개월",
    price: 260000,
    status: "분양완료",
    description: "깨끗한 화이트 베이스가 예쁜 스노우 계열 개체입니다.",
    images: ["/images/gecko-4.jpg"],
    created_at: "2026-08-23T08:00:00.000Z",
  },
];

const DEMO_KEY = "geckoseom-demo-geckos-v1";

function normalize(row) {
  return {
    id: row.id,
    species: row.species || "",
    morph: row.morph || "",
    sex: row.sex || "미구분",
    hatchDate: row.hatch_date || row.hatchDate || "",
    age: row.age || "",
    price: Number(row.price || 0),
    status: row.status || "분양 가능",
    description: row.description || "",
    images: Array.isArray(row.images) ? row.images : [],
    created_at: row.created_at || new Date().toISOString(),
  };
}

function toDb(gecko) {
  return {
    id: gecko.id && !String(gecko.id).startsWith("sample-") ? gecko.id : undefined,
    species: gecko.species,
    morph: gecko.morph,
    sex: gecko.sex,
    hatch_date: gecko.hatchDate || null,
    age: gecko.age,
    price: Number(gecko.price || 0),
    status: gecko.status,
    description: gecko.description,
    images: gecko.images || [],
    updated_at: new Date().toISOString(),
  };
}

export async function getGeckos() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("geckos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(normalize);
  }

  if (typeof window === "undefined") return SAMPLE_GECKOS;

  const saved = window.localStorage.getItem(DEMO_KEY);
  if (!saved) {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(SAMPLE_GECKOS));
    return SAMPLE_GECKOS;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return SAMPLE_GECKOS;
  }
}

export async function saveGecko(gecko) {
  if (isSupabaseConfigured) {
    const payload = toDb(gecko);

    if (payload.id) {
      const { data, error } = await supabase
        .from("geckos")
        .update(payload)
        .eq("id", payload.id)
        .select()
        .single();

      if (error) throw error;
      return normalize(data);
    }

    delete payload.id;
    const { data, error } = await supabase
      .from("geckos")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return normalize(data);
  }

  const items = await getGeckos();
  const next = { ...gecko };

  if (!next.id || String(next.id).startsWith("sample-")) {
    next.id = crypto.randomUUID();
    next.created_at = new Date().toISOString();
  }

  const exists = items.some((item) => item.id === next.id);
  const updated = exists
    ? items.map((item) => (item.id === next.id ? next : item))
    : [next, ...items];

  window.localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
  return next;
}

export async function removeGecko(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("geckos").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const items = await getGeckos();
  const updated = items.filter((item) => item.id !== id);
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressForDemo(file) {
  const dataUrl = await readFileAsDataURL(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const max = 1400;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.78);
}

export async function uploadGeckoImages(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return [];

  if (!isSupabaseConfigured) {
    const results = [];
    for (const file of fileList) {
      results.push(await compressForDemo(file));
    }
    return results;
  }

  const urls = [];

  for (const file of fileList) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("geckos")
      .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("geckos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
