export const runtime = "nodejs";

function formBody(values) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.set(key, String(value));
  });
  return body;
}

async function postForm(url, values) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody(values),
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data?.error?.message || `Meta API error (${response.status})`);
  }
  return data;
}

export async function POST(request) {
  try {
    const { images = [], caption = "" } = await request.json();

    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;
    const base = (process.env.INSTAGRAM_GRAPH_BASE_URL || "https://graph.facebook.com").replace(/\/$/, "");
    const version = process.env.INSTAGRAM_API_VERSION || "v23.0";

    if (!token || !userId) {
      return Response.json(
        { error: "Instagram 환경변수(INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID)가 설정되지 않았습니다." },
        { status: 501 }
      );
    }

    const publicImages = images.filter((url) => /^https?:\/\//.test(url)).slice(0, 10);
    if (!publicImages.length) {
      return Response.json({ error: "공개 URL 형태의 이미지가 필요합니다." }, { status: 400 });
    }

    const mediaUrl = `${base}/${version}/${userId}/media`;
    const publishUrl = `${base}/${version}/${userId}/media_publish`;

    let creationId;

    if (publicImages.length === 1) {
      const container = await postForm(mediaUrl, {
        image_url: publicImages[0],
        caption,
        access_token: token,
      });
      creationId = container.id;
    } else {
      const children = [];
      for (const imageUrl of publicImages) {
        const child = await postForm(mediaUrl, {
          image_url: imageUrl,
          is_carousel_item: "true",
          access_token: token,
        });
        children.push(child.id);
      }

      const carousel = await postForm(mediaUrl, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
        access_token: token,
      });
      creationId = carousel.id;
    }

    const published = await postForm(publishUrl, {
      creation_id: creationId,
      access_token: token,
    });

    return Response.json({ ok: true, id: published.id });
  } catch (error) {
    return Response.json({ error: error.message || "Instagram publish error" }, { status: 500 });
  }
}
