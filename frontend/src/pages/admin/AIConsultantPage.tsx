import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIConsultantPage() {
  // ✅ Carrega do localStorage diretamente na inicialização
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("ai_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Salva histórico sempre que as mensagens mudarem
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // 🔹 Scroll automático para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    const newMessage: Message = { role: "user", content: question };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`${baseUrl}/ai/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: updatedMessages,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "Sem resposta." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Erro ao obter resposta. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Enviar com Enter (e Shift+Enter para quebrar linha)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 🔹 Botão para limpar conversa
  function handleClearChat() {
    localStorage.removeItem("ai_chat_history");
    setMessages([]);
  }

  return (
    <div className="space-y-6">
      <Card
        title="Consultor IA"
        description="Converse com o assistente inteligente da pousada."
        headerAction={
          <div className="flex items-center gap-3">
            <StatusBadge label="Modelo: GPT-Hospitality-Pro" status="info" />
            <button
              onClick={handleClearChat}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Limpar conversa
            </button>
          </div>
        }
      >
        <div className="h-[70vh] flex flex-col">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-950/5 dark:bg-slate-900/40 rounded-xl">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-muted">Gerando resposta...</p>}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="mt-4 flex items-center gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              className="flex-1 surface-input resize-none h-14"
            />
            <button
              type="submit"
              className="btn-primary h-14 px-5 flex items-center justify-center"
              disabled={loading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
