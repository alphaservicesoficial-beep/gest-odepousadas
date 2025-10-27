import { Bot, Send } from "lucide-react";
import { useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

function AIConsultantPage() {
  const [question, setQuestion] = useState("");

  return (
    <div className="space-y-6">
      <Card
        title="Consultor IA"
        description="Faça perguntas sobre dados operacionais ou peça recomendações ao consultor inteligente."
        headerAction={
          <StatusBadge label="Modelo: gpt-hospitality-pro" status="info" />
        }
      >
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="surface-section h-full flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-emphasis">
                  Assistente da hospedagem
                </p>
                <p className="text-xs text-muted">
                  Pronto para responder com dados em tempo real.
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto p-5 text-sm text-muted-strong">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-xs uppercase text-muted-soft">Sugestão</p>
                  <p className="mt-1">
                    Pergunte:{" "}
                    <span className="text-emphasis">
                      "Quantas reservas confirmadas temos para esta semana?"
                    </span>
                  </p>
                </div>
              </div>

              <form
                className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/80"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQuestion("");
                }}
              >
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Digite sua pergunta..."
                    className="max-h-32 flex-1 resize-none border-none bg-transparent text-sm text-emphasis outline-none placeholder:text-muted"
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="btn btn-sm bg-primary text-white hover:bg-primary/90 shadow-sm"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Web Vision
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> Expandir contexto financeiro
                  </label>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <Card title="Consultas rápidas" className="surface-section">
              <ul className="space-y-2 text-sm text-muted-strong">
                <li className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                  Como está a ocupação na próxima semana?
                </li>
                <li className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                  Qual o total previsto em contas a receber para outubro?
                </li>
                <li className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                  Quais quartos precisam de manutenção urgente?
                </li>
              </ul>
            </Card>

            <Card
              title="Fontes de dados conectadas"
              className="surface-section"
            >
              <ul className="text-sm text-muted-strong">
                <li>Reservas (tempo real)</li>
                <li>Financeiro (última atualização: 12/10/2025 22:00)</li>
                <li>Manutenção (integração beta)</li>
              </ul>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AIConsultantPage;
