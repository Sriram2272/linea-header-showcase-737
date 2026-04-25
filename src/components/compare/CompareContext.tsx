import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type CompareProduct = {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
};

type CompareContextType = {
  items: CompareProduct[];
  toggle: (p: CompareProduct) => void;
  remove: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
  compareRequest: { items: CompareProduct[]; nonce: number } | null;
  triggerCompare: () => void;
  consumeCompareRequest: () => void;
};

const CompareContext = createContext<CompareContextType | null>(null);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CompareProduct[]>([]);
  const [compareRequest, setCompareRequest] = useState<CompareContextType["compareRequest"]>(null);

  const toggle = useCallback((p: CompareProduct) => {
    setItems((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 2) return [prev[1], p]; // keep last 2
      return [...prev, p];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isSelected = useCallback((id: number) => items.some((x) => x.id === id), [items]);

  const triggerCompare = useCallback(() => {
    if (items.length === 2) {
      setCompareRequest({ items: [...items], nonce: Date.now() });
    }
  }, [items]);

  const consumeCompareRequest = useCallback(() => setCompareRequest(null), []);

  return (
    <CompareContext.Provider
      value={{ items, toggle, remove, clear, isSelected, compareRequest, triggerCompare, consumeCompareRequest }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
