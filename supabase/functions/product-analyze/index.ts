import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch page HTML (best-effort)
    let pageText = "";
    let pageTitle = "";
    let ogImage = "";
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; LumenBot/1.0; +https://lumen.ai)",
          Accept: "text/html,*/*",
        },
        redirect: "follow",
      });
      const html = await r.text();
      pageTitle = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
      ogImage =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
        "";
      // strip tags, collapse whitespace, cap length
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
    } catch (e) {
      console.error("fetch page failed", e);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tool = {
      type: "function",
      function: {
        name: "product_analysis",
        description: "Structured product analysis with 3D shape hints",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Product name" },
            brand: { type: "string" },
            price: { type: "string" },
            category: { type: "string", description: "earring, bracelet, ring, necklace, watch, or other" },
            summary: { type: "string", description: "2-3 sentence overview" },
            materials: { type: "array", items: { type: "string" } },
            pros: { type: "array", items: { type: "string" } },
            cons: { type: "array", items: { type: "string" } },
            best_for: { type: "string" },
            shape: {
              type: "string",
              enum: ["ring", "hoop", "stud", "cuff", "chain", "pendant", "bar", "sphere", "box"],
              description: "Best 3D primitive for visualization",
            },
            color_hex: { type: "string", description: "Dominant color as #RRGGBB" },
            metallic: { type: "boolean" },
            roughness: { type: "number", description: "0 = mirror, 1 = matte" },
          },
          required: ["name", "category", "summary", "shape", "color_hex"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You analyze product pages from any e-commerce site (Amazon, Etsy, brand sites, etc.). From the URL and scraped text, extract structured product info and pick the best 3D primitive shape and a realistic dominant color hex for a visual mockup. Be honest if info is missing — infer reasonably but never fabricate prices.",
          },
          {
            role: "user",
            content: `Product URL: ${url}\nPage title: ${pageTitle}\n\nPage text (truncated):\n${pageText || "(could not fetch page)"}\n\nReturn structured analysis.`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "product_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let analysis: any = {};
    try {
      analysis = typeof args === "string" ? JSON.parse(args) : args;
    } catch {
      analysis = { error: "Could not parse analysis" };
    }

    // Generate a clean studio product render with AI
    let generatedImage = "";
    try {
      const prompt = `Photorealistic studio product photography of: ${analysis.name || pageTitle || "the product"}. ${
        analysis.summary || ""
      } Materials: ${(analysis.materials || []).join(", ")}. Centered on a clean off-white seamless background, soft three-point studio lighting, subtle contact shadow, sharp focus, high detail, ecommerce hero shot, no text, no watermark.`;

      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        generatedImage = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || "";
      } else {
        console.error("image gen failed", imgResp.status, await imgResp.text());
      }
    } catch (e) {
      console.error("image gen error", e);
    }

    return new Response(
      JSON.stringify({
        analysis,
        image: ogImage,
        generatedImage,
        sourceUrl: url,
        sourceTitle: pageTitle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("product-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
