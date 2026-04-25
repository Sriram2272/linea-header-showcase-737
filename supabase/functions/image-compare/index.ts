import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageA, imageB } = await req.json();
    if (!imageA || !imageB) {
      return new Response(JSON.stringify({ error: "Both imageA and imageB are required (data URLs or http URLs)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tool = {
      type: "function",
      function: {
        name: "product_comparison",
        description: "Side-by-side comparison of two product images",
        parameters: {
          type: "object",
          properties: {
            product_a: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                materials: { type: "array", items: { type: "string" } },
                style: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
              },
              required: ["name", "strengths", "weaknesses"],
            },
            product_b: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                materials: { type: "array", items: { type: "string" } },
                style: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
              },
              required: ["name", "strengths", "weaknesses"],
            },
            similarities: { type: "array", items: { type: "string" } },
            differences: { type: "array", items: { type: "string" } },
            verdict: { type: "string", description: "2-3 sentence overall recommendation" },
            winner: { type: "string", enum: ["A", "B", "tie"] },
            winner_reason: { type: "string" },
          },
          required: ["product_a", "product_b", "similarities", "differences", "verdict", "winner", "winner_reason"],
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a product analyst. The user shows you two product images (A and B). Identify each, then compare them honestly across design, materials, style, quality cues, and use cases. Pick a winner only if one is clearly better, otherwise return 'tie'.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Image A:" },
              { type: "image_url", image_url: { url: imageA } },
              { type: "text", text: "Image B:" },
              { type: "image_url", image_url: { url: imageB } },
              { type: "text", text: "Compare these two products in detail and return structured analysis." },
            ],
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "product_comparison" } },
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
    let comparison: any = {};
    try {
      comparison = typeof args === "string" ? JSON.parse(args) : args;
    } catch {
      comparison = { error: "Could not parse comparison" };
    }

    return new Response(JSON.stringify({ comparison }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("image-compare error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
