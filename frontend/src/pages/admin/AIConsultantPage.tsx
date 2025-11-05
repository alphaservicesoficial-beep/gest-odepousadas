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
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Carregar histórico do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem("ai_chat_history");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // 🔹 Salvar histórico sempre que atualizar
  useEffect(() => {
    localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    // Scroll automático para o final
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    const newMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);

    try {
      const res = await fetch(`${baseUrl}/ai/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "Sem resposta." },
      ]);
      setQuestion(""); // 🔹 limpa o input após envio
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Erro ao obter resposta. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Enviar com Enter e Shift+Enter para nova linha
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Consultor IA"
        description="Converse com o assistente inteligente da pousada."
        headerAction={<StatusBadge label="Modelo: GPT-Hospitality-Pro" status="info" />}
      >
        <div className="h-[70vh] flex flex-col">
          {/* Área de mensagens */}
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

          {/* Área de input */}
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
