import { useState, Suspense, lazy } from "react";
import { Loader2, Sparkles, Link2, ExternalLink } from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";

const Product3D = lazy(() => import("@/components/viewer/Product3D"));

type Analysis = {
  name?: string;
  brand?: string;
  price?: string;
  category?: string;
  summary?: string;
  materials?: string[];
  pros?: string[];
  cons?: string[];
  best_for?: string;
  shape?: string;
  color_hex?: string;
  metallic?: boolean;
  roughness?: number;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-analyze`;

const ProductViewer3D = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [image, setImage] = useState<string>("");

  const analyze = async () => {
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Please paste a full URL starting with http:// or https://");
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setImage("");
    try {
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ url: trimmed }),
      });
      if (r.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (r.status === 402) throw new Error("AI credits exhausted. Please contact support.");
      if (!r.ok) throw new Error("Analysis failed.");
      const data = await r.json();
      setAnalysis(data.analysis || {});
      setImage(data.image || "");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-foreground/5 rounded-full text-xs font-light tracking-wide mb-4">
            <Sparkles className="h-3 w-3" /> AI POWERED
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-3">3D Product Viewer</h1>
          <p className="text-muted-foreground font-light max-w-xl mx-auto">
            Paste any product link — Amazon, Etsy, brand sites — and get an instant AI analysis with an interactive 3D preview.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 border border-border rounded-sm px-4 py-3 focus-within:border-foreground transition-colors">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="https://www.amazon.com/dp/..."
                className="flex-1 bg-transparent text-sm font-light focus:outline-none"
                disabled={loading}
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || !url.trim()}
              className="bg-foreground text-background px-6 py-3 text-sm font-medium tracking-wide rounded-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
          {error && <p className="text-sm text-destructive mt-3 font-light">{error}</p>}
        </div>

        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            {/* 3D viewer */}
            <div className="aspect-square bg-muted/20 border border-border rounded-sm overflow-hidden relative">
              <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }>
                <Product3D
                  shape={analysis.shape}
                  color={analysis.color_hex}
                  metallic={analysis.metallic ?? true}
                  roughness={analysis.roughness ?? 0.25}
                />
              </Suspense>
              <div className="absolute bottom-3 left-3 text-[10px] tracking-widest font-light text-foreground/60 bg-background/80 px-2 py-1 rounded-sm">
                DRAG TO ROTATE • SCROLL TO ZOOM
              </div>
            </div>

            {/* Analysis */}
            <div className="space-y-6">
              <div>
                {analysis.brand && (
                  <p className="text-xs tracking-widest text-muted-foreground font-light uppercase mb-1">{analysis.brand}</p>
                )}
                <h2 className="text-2xl font-medium mb-1">{analysis.name || "Untitled product"}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-light">
                  {analysis.category && <span className="capitalize">{analysis.category}</span>}
                  {analysis.price && <span>• {analysis.price}</span>}
                </div>
              </div>

              {analysis.summary && (
                <p className="text-sm font-light leading-relaxed text-foreground/80">{analysis.summary}</p>
              )}

              {analysis.materials && analysis.materials.length > 0 && (
                <div>
                  <h3 className="text-xs tracking-widest font-medium uppercase mb-2">Materials</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.materials.map((m, i) => (
                      <span key={i} className="text-xs font-light px-3 py-1 border border-border rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {analysis.pros && analysis.pros.length > 0 && (
                  <div>
                    <h3 className="text-xs tracking-widest font-medium uppercase mb-2 text-green-700">Pros</h3>
                    <ul className="space-y-1.5">
                      {analysis.pros.map((p, i) => (
                        <li key={i} className="text-sm font-light text-foreground/80 flex gap-2">
                          <span className="text-green-700">+</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.cons && analysis.cons.length > 0 && (
                  <div>
                    <h3 className="text-xs tracking-widest font-medium uppercase mb-2 text-red-700">Cons</h3>
                    <ul className="space-y-1.5">
                      {analysis.cons.map((c, i) => (
                        <li key={i} className="text-sm font-light text-foreground/80 flex gap-2">
                          <span className="text-red-700">−</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {analysis.best_for && (
                <div className="border-l-2 border-foreground pl-4">
                  <h3 className="text-xs tracking-widest font-medium uppercase mb-1">Best for</h3>
                  <p className="text-sm font-light text-foreground/80">{analysis.best_for}</p>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium tracking-wide flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                >
                  View original <ExternalLink className="h-3 w-3" />
                </a>
                {image && (
                  <a href={image} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    <img src={image} alt="Original" className="h-10 w-10 object-cover rounded-sm border border-border" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {!analysis && !loading && (
          <div className="max-w-3xl mx-auto text-center text-xs text-muted-foreground font-light">
            <p className="mb-2">Try pasting a link from:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["amazon.com", "etsy.com", "tiffany.com", "cartier.com"].map((d) => (
                <span key={d} className="px-3 py-1 border border-border rounded-full">{d}</span>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductViewer3D;
