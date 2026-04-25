import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_CATALOG = `
Lumen AI Product Catalog (sleek minimalist accessories powered by AI-inspired design):

EARRINGS
- Pantheon (€2,850) — Architectural sculpted earrings, 18k gold-plated sterling silver, 2.5cm x 1.2cm. Bridges classical form with modern minimalism.
- Halo (€1,950) — Soft circular hoops with a brushed satin finish. Lightweight, everyday wear.
- Oblique (€1,650) — Angular asymmetric studs, polished silver.
- Lintel (€2,250) — Rectangular bar drops, sharp geometry, gold finish.
- Meridian (€2,450) — Curved line earrings inspired by horizons.
- Apex (€1,550) — Pointed minimalist studs, entry-level price.
- Zenith (€1,850) — Mid-length drops, brushed gold.
- Prism (€2,050) — Faceted geometric earrings.
- Stellar (€2,150) — Star-inspired studs with subtle pavé.
- Aurora (€1,750) — Flowing organic curves.
- Nebula (€1,850) — Diffused gradient finish.
- Orbit (€2,350) — Concentric ring design.
- Lunar (€2,050) — Crescent silhouette.
- Astral (€1,650) — Tiny celestial studs.
- Cosmic (€1,950) — Deep-tone enamel detail.

BRACELETS
- Eclipse (€3,200) — Wide cuff, brushed gold, statement piece.
- Shadowline (€3,950) — Layered chain bracelet, premium.
- Vertex (€2,800) — Angular linked bracelet.
- Radiant (€3,650) — Polished bangle.
- Cosmos (€2,950) — Beaded chain.
- Galaxy (€3,450) — Heavy chain link.
- Solar (€3,150) — Warm gold tone bangle.
`;

const SYSTEM_PROMPT = `You are Lumi, the AI shopping assistant for Lumen AI.

YOUR PRIMARY JOBS:
1. Help users discover products and explain product details (material, dimensions, price, style, when to wear).
2. Answer general shopping questions warmly (shipping, returns, sizing, gifts).
3. When a user wants to compare prices on other websites, ALWAYS provide markdown links to:
   - Amazon search: https://www.amazon.com/s?k=PRODUCT+NAME
   - Google Shopping: https://www.google.com/search?tbm=shop&q=PRODUCT+NAME
   Example: "Compare on [Amazon](https://www.amazon.com/s?k=gold+hoop+earrings) or [Google Shopping](https://www.google.com/search?tbm=shop&q=gold+hoop+earrings)."
   Replace spaces in PRODUCT NAME with '+'. Always make the link clickable markdown.

STYLE:
- Concise: 2-4 sentences max unless listing products.
- Use markdown lists for multiple products.
- Always be honest — if a product isn't in our catalog below, say so and suggest the closest match.
- Never invent prices or specs not listed.

${PRODUCT_CATALOG}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
