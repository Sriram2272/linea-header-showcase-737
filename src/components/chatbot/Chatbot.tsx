import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi, I'm **Lumi** ✨ — your Lumen AI assistant. Ask me anything about our products!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) {
        setMessages((p) => [...p, { role: "assistant", content: "I'm getting a lot of requests right now — try again in a moment." }]);
        return;
      }
      if (resp.status === 402) {
        setMessages((p) => [...p, { role: "assistant", content: "AI credits are out. Please contact support." }]);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let done = false;
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: assistantText } : m));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[32rem] bg-background border border-border shadow-2xl flex flex-col rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium tracking-wide">LUMI</p>
              <p className="text-xs text-muted-foreground font-light">AI shopping assistant</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm font-light rounded-sm ${
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="prose prose-sm max-w-none [&>*]:my-0 [&_p]:my-0 [&_strong]:font-medium">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask me anything…"
              className="flex-1 bg-transparent border border-border px-3 py-2 text-sm font-light focus:outline-none focus:border-foreground rounded-sm"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 bg-foreground text-background disabled:opacity-40 rounded-sm"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
