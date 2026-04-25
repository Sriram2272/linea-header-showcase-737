import { useRef, useState } from "react";
import { Loader2, Sparkles, Upload, X, GitCompare, Trophy } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-compare`;

type SideAnalysis = {
  name?: string;
  category?: string;
  materials?: string[];
  style?: string;
  strengths?: string[];
  weaknesses?: string[];
};

type Comparison = {
  product_a?: SideAnalysis;
  product_b?: SideAnalysis;
  similarities?: string[];
  differences?: string[];
  verdict?: string;
  winner?: "A" | "B" | "tie";
  winner_reason?: string;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Slot = ({
  label,
  image,
  onPick,
  onClear,
}: {
  label: string;
  image: string;
  onPick: (f: File) => void;
  onClear: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative aspect-square border border-dashed border-border rounded-sm overflow-hidden bg-muted/10 group">
      {image ? (
        <>
          <img src={image} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 flex items-center justify-center hover:bg-background"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="absolute top-2 left-2 text-[10px] tracking-widest font-medium bg-foreground text-background px-2 py-1 rounded-sm">
            {label}
          </div>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs font-medium tracking-wide">Upload Product {label}</span>
          <span className="text-[10px] font-light">PNG, JPG up to 5MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const ImageCompare = () => {
  const [imgA, setImgA] = useState("");
  const [imgB, setImgB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  const pick = async (which: "A" | "B", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setError(null);
    const data = await fileToDataUrl(file);
    if (which === "A") setImgA(data);
    else setImgB(data);
  };

  const compare = async () => {
    if (!imgA || !imgB || loading) return;
    setLoading(true);
    setError(null);
    setComparison(null);
    try {
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageA: imgA, imageB: imgB }),
      });
      if (r.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (r.status === 402) throw new Error("AI credits exhausted.");
      if (!r.ok) throw new Error("Comparison failed.");
      const data = await r.json();
      setComparison(data.comparison || {});
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImgA("");
    setImgB("");
    setComparison(null);
    setError(null);
  };

  const Side = ({ data, label, image }: { data?: SideAnalysis; label: string; image: string }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img src={image} alt={label} className="h-14 w-14 object-cover rounded-sm border border-border" />
        <div>
          <p className="text-[10px] tracking-widest text-muted-foreground font-light">PRODUCT {label}</p>
          <h4 className="text-sm font-medium">{data?.name || `Product ${label}`}</h4>
          {data?.category && <p className="text-xs text-muted-foreground font-light capitalize">{data.category}</p>}
        </div>
      </div>
      {data?.materials && data.materials.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.materials.map((m, i) => (
            <span key={i} className="text-[10px] font-light px-2 py-0.5 border border-border rounded-full">{m}</span>
          ))}
        </div>
      )}
      {data?.strengths && data.strengths.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest font-medium uppercase mb-1 text-green-700">Strengths</p>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-xs font-light flex gap-1.5"><span className="text-green-700">+</span>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {data?.weaknesses && data.weaknesses.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest font-medium uppercase mb-1 text-red-700">Weaknesses</p>
          <ul className="space-y-1">
            {data.weaknesses.map((w, i) => (
              <li key={i} className="text-xs font-light flex gap-1.5"><span className="text-red-700">−</span>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-foreground/5 rounded-full text-xs font-light tracking-wide mb-3">
          <GitCompare className="h-3 w-3" /> IMAGE COMPARE
        </div>
        <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2">Compare Two Product Images</h2>
        <p className="text-sm text-muted-foreground font-light max-w-xl mx-auto">
          Upload two product photos and get an instant AI-powered side-by-side comparison.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto mb-6">
        <Slot label="A" image={imgA} onPick={(f) => pick("A", f)} onClear={() => setImgA("")} />
        <Slot label="B" image={imgB} onPick={(f) => pick("B", f)} onClear={() => setImgB("")} />
      </div>

      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={compare}
          disabled={!imgA || !imgB || loading}
          className="bg-foreground text-background px-6 py-3 text-sm font-medium tracking-wide rounded-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-2 min-w-[180px] justify-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Comparing…" : "Compare with AI"}
        </button>
        {(imgA || imgB || comparison) && !loading && (
          <button
            onClick={reset}
            className="px-6 py-3 text-sm font-light tracking-wide rounded-sm border border-border hover:bg-muted/30 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive text-center font-light mb-4">{error}</p>}

      {comparison && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 border border-border rounded-sm bg-muted/10">
            <Side data={comparison.product_a} label="A" image={imgA} />
            <Side data={comparison.product_b} label="B" image={imgB} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparison.similarities && comparison.similarities.length > 0 && (
              <div>
                <h3 className="text-xs tracking-widest font-medium uppercase mb-2">Similarities</h3>
                <ul className="space-y-1.5">
                  {comparison.similarities.map((s, i) => (
                    <li key={i} className="text-sm font-light text-foreground/80 flex gap-2">
                      <span className="text-muted-foreground">≈</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comparison.differences && comparison.differences.length > 0 && (
              <div>
                <h3 className="text-xs tracking-widest font-medium uppercase mb-2">Differences</h3>
                <ul className="space-y-1.5">
                  {comparison.differences.map((d, i) => (
                    <li key={i} className="text-sm font-light text-foreground/80 flex gap-2">
                      <span className="text-muted-foreground">≠</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {comparison.verdict && (
            <div className="border-l-2 border-foreground pl-4 py-2">
              <h3 className="text-xs tracking-widest font-medium uppercase mb-1 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5" />
                Verdict {comparison.winner && comparison.winner !== "tie" ? `— Winner: Product ${comparison.winner}` : "— It's a tie"}
              </h3>
              <p className="text-sm font-light text-foreground/80 mb-1">{comparison.verdict}</p>
              {comparison.winner_reason && (
                <p className="text-xs font-light text-muted-foreground italic">{comparison.winner_reason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCompare;
