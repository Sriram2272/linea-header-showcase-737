import { X, GitCompare } from "lucide-react";
import { useCompare } from "./CompareContext";

const CompareBar = () => {
  const { items, remove, clear, triggerCompare } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-background border border-border shadow-2xl rounded-sm px-4 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center gap-3">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className="relative">
              <img src={p.image} alt={p.name} className="h-12 w-12 object-cover bg-muted/10" />
              <button
                onClick={() => remove(p.id)}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background flex items-center justify-center"
                aria-label="Remove"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium leading-tight">{p.name}</p>
              <p className="text-xs text-muted-foreground font-light">{p.price}</p>
            </div>
          </div>
        ))}
        {items.length === 1 && (
          <div className="h-12 w-12 border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground font-light">
            +1
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-l border-border pl-3">
        <button
          onClick={triggerCompare}
          disabled={items.length < 2}
          className="bg-foreground text-background text-xs font-medium tracking-wide px-4 py-2 rounded-sm flex items-center gap-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Compare with AI
        </button>
        <button
          onClick={clear}
          className="text-xs font-light text-muted-foreground hover:text-foreground"
          aria-label="Clear"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default CompareBar;
