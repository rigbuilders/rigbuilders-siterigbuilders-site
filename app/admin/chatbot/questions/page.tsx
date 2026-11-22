"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { FaArrowLeft, FaArrowUp, FaArrowDown, FaTrash, FaPlus, FaSave } from "react-icons/fa";
import type { AnswerType, BuildQuestion, QuestionOption } from "@/lib/chatbot/build-questions";

/**
 * Editor for the pre-quote questionnaire.
 *
 * Exists so budget bands, use cases and preferences can be changed as the
 * market moves without a deploy — these are the questions most likely to go
 * stale, and hardcoding them meant a code change every time prices shifted.
 */

async function authedFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const ANSWER_TYPES: { value: AnswerType; label: string; help: string }[] = [
  { value: "choice", label: "Buttons only", help: "Customer picks one option" },
  { value: "text", label: "Free text only", help: "Customer types an answer" },
  { value: "choice_text", label: "Buttons + free text", help: "Options, plus room to type something exact" },
];

export default function BuildQuestionsPage() {
  const [questions, setQuestions] = useState<BuildQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authedFetch("/api/admin/chatbot/questions");
      setQuestions(data.questions ?? []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patchLocal(id: string, patch: Partial<BuildQuestion>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  async function save(question: BuildQuestion) {
    setSavingId(question.id);
    try {
      await authedFetch(`/api/admin/chatbot/questions/${question.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          label: question.label,
          hint: question.hint,
          answerType: question.answerType,
          options: question.options,
          placeholder: question.placeholder,
          isActive: question.isActive,
        }),
      });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
    try {
      await authedFetch("/api/admin/chatbot/questions", {
        method: "POST",
        body: JSON.stringify({ order: next.map((q) => q.id) }),
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addQuestion() {
    const briefKey = window.prompt(
      "Short key for this question (lowercase, no spaces — e.g. storage_size).\n\nThis is permanent: answers are filed under it, so it can't be changed later."
    );
    if (!briefKey) return;
    try {
      await authedFetch("/api/admin/chatbot/questions", {
        method: "POST",
        body: JSON.stringify({
          briefKey: briefKey.trim().toLowerCase(),
          label: "New question",
          answerType: "choice",
          options: [],
          sortOrder: (questions.length + 1) * 10,
        }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this question permanently? Retiring it instead keeps old answers readable.")) return;
    try {
      await authedFetch(`/api/admin/chatbot/questions/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function updateOption(question: BuildQuestion, index: number, patch: Partial<QuestionOption>) {
    const options = question.options.map((o, i) => (i === index ? { ...o, ...patch } : o));
    patchLocal(question.id, { options });
  }

  function addOption(question: BuildQuestion) {
    patchLocal(question.id, { options: [...question.options, { id: "", label: "" }] });
  }

  function removeOption(question: BuildQuestion, index: number) {
    patchLocal(question.id, { options: question.options.filter((_, i) => i !== index) });
  }

  return (
    <div className="min-h-screen bg-brand-black text-brand-text p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/chatbot"
          className="flex items-center gap-2 text-xs uppercase font-bold text-white/70 hover:text-white mb-4"
        >
          <FaArrowLeft /> Back to chatbot
        </Link>

        <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
          <h1 className="font-orbitron text-2xl uppercase text-white">Build questionnaire</h1>
          <button
            onClick={addQuestion}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold"
          >
            <FaPlus /> Add question
          </button>
        </div>
        <p className="text-sm text-brand-silver mb-8">
          Asked before quoting a custom build, in this order. Anything a customer has already told us is skipped
          automatically.
        </p>

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 text-red-300 rounded px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {loading && <p className="text-brand-silver text-sm">Loading…</p>}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`border rounded-xl p-4 ${
                question.isActive ? "border-white/10 bg-[#1A1A1A]" : "border-white/5 bg-[#141414] opacity-60"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="text-brand-silver hover:text-white disabled:opacity-20"
                  >
                    <FaArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    aria-label="Move down"
                    className="text-brand-silver hover:text-white disabled:opacity-20"
                  >
                    <FaArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    value={question.label}
                    onChange={(e) => patchLocal(question.id, { label: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm mb-2"
                    placeholder="Question shown to the customer"
                  />
                  <input
                    value={question.hint ?? ""}
                    onChange={(e) => patchLocal(question.id, { hint: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded px-3 py-2 text-xs text-brand-silver"
                    placeholder="Optional hint shown underneath"
                  />
                  <p className="text-[10px] text-brand-silver/60 mt-1.5 font-mono">
                    key: {question.briefKey} — permanent, answers are stored under it
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs text-brand-silver shrink-0 pt-2">
                  <input
                    type="checkbox"
                    checked={question.isActive}
                    onChange={(e) => patchLocal(question.id, { isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {ANSWER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => patchLocal(question.id, { answerType: type.value })}
                    title={type.help}
                    className={`text-[11px] px-3 py-1.5 rounded border ${
                      question.answerType === type.value
                        ? "border-brand-purple bg-brand-purple/20 text-white"
                        : "border-white/10 text-brand-silver hover:text-white"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {question.answerType !== "text" && (
                <div className="space-y-2 mb-3">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex gap-2">
                      <input
                        value={option.id}
                        onChange={(e) => updateOption(question, optionIndex, { id: e.target.value })}
                        placeholder="id"
                        className="w-32 bg-[#121212] border border-white/10 rounded px-2 py-1.5 text-xs font-mono"
                      />
                      <input
                        value={option.label}
                        onChange={(e) => updateOption(question, optionIndex, { label: e.target.value })}
                        placeholder="Label shown to the customer"
                        className="flex-1 bg-[#121212] border border-white/10 rounded px-2 py-1.5 text-xs"
                      />
                      <button
                        onClick={() => removeOption(question, optionIndex)}
                        aria-label="Remove option"
                        className="text-brand-silver hover:text-red-400 px-2"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(question)}
                    className="text-[11px] text-brand-silver hover:text-white underline"
                  >
                    + Add option
                  </button>
                </div>
              )}

              {question.answerType !== "choice" && (
                <input
                  value={question.placeholder ?? ""}
                  onChange={(e) => patchLocal(question.id, { placeholder: e.target.value })}
                  placeholder="Placeholder for the text box — show real examples"
                  className="w-full bg-[#121212] border border-white/10 rounded px-3 py-2 text-xs mb-3"
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => save(question)}
                  disabled={savingId === question.id}
                  className="bg-brand-purple disabled:opacity-40 px-4 py-2 rounded text-xs uppercase font-bold flex items-center gap-2"
                >
                  <FaSave /> {savingId === question.id ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => remove(question.id)}
                  className="text-xs text-brand-silver hover:text-red-400 px-3"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
