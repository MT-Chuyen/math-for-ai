import { useEffect, useState } from "react";
import { lessons, lessonsIn, type LessonMeta, type Part } from "./curriculum";
import { labs } from "./lessons";

function readDone(id: string): boolean {
  try {
    return localStorage.getItem(`aimath:${id}`) === "1";
  } catch {
    return false;
  }
}

export function App() {
  const [id, setId] = useState(() => window.location.hash.replace("#", "") || "map");
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const lesson of lessons) initial[lesson.id] = readDone(lesson.id);
    return initial;
  });

  useEffect(() => {
    const onHash = () => setId(window.location.hash.replace("#", "") || "map");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(next: string) {
    window.location.hash = next === "map" ? "" : next;
    setId(next);
    window.scrollTo(0, 0);
  }

  function toggle(lessonId: string) {
    setDone((current) => {
      const next = !current[lessonId];
      try {
        localStorage.setItem(`aimath:${lessonId}`, next ? "1" : "0");
      } catch {
        /* storage can be blocked; the mark still updates on the page */
      }
      return { ...current, [lessonId]: next };
    });
  }

  const lesson = lessons.find((item) => item.id === id) ?? null;
  const accent = lesson?.part === "calculus" ? "#b45309" : "#1d4ed8";

  return (
    <div className="min-h-screen" style={{ ["--accent" as string]: accent }}>
      <header className="bg-[#172554] px-5 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">From a definition to a training step</p>
            <h1 className="text-xl font-semibold">Math for AI</h1>
          </div>
          {lesson ? (
            <button type="button" className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20" onClick={() => go("map")}>
              All fields
            </button>
          ) : null}
        </div>
      </header>
      {lesson ? <LessonScreen lesson={lesson} done={!!done[lesson.id]} onToggle={() => toggle(lesson.id)} onGo={go} /> : <Map done={done} onOpen={go} />}
    </div>
  );
}

function Map({ done, onOpen }: { done: Record<string, boolean>; onOpen: (id: string) => void }) {
  const algebraDone = lessonsIn("algebra").filter((lesson) => done[lesson.id]).length;
  const calculusDone = lessonsIn("calculus").filter((lesson) => done[lesson.id]).length;
  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-slate-700">
        <p>
          A formula in a paper is a small program. Each symbol is a number or a list of numbers, and the formula says how those numbers combine. This lab keeps one set of numbers on the page, plugs them into the general formula, and then uses those same numbers inside a model.
        </p>
        <p>
          A machine-learning PhD interview does not quiz group theory. The word algebra here means the algebra of vectors and matrices. The calculus is the calculus of several variables, asked through a loss. The whiteboard is usually: multiply these and keep the shape, say what an eigenvalue is doing, differentiate by hand with the chain rule, and take one gradient step. Probability — expectation, Bayes, variance — is the other pillar, and it is not in this lab.
        </p>
        <p>
          Mark a field once you can answer its interview question without the sliders. {algebraDone + calculusDone} of {lessons.length} marked.
        </p>
      </div>
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <Track part="algebra" title="Algebra" detail="Lists, tables, and the one number a pair of lists can make." done={done} count={algebraDone} onOpen={onOpen} />
        <Track part="calculus" title="Calculus" detail="How a loss moves when a weight moves, and how a network multiplies those moves." done={done} count={calculusDone} onOpen={onOpen} />
      </div>
    </main>
  );
}

function Track({
  part,
  title,
  detail,
  done,
  count,
  onOpen,
}: {
  part: Part;
  title: string;
  detail: string;
  done: Record<string, boolean>;
  count: number;
  onOpen: (id: string) => void;
}) {
  const items = lessonsIn(part);
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {count}/{items.length} marked
        </p>
      </div>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
      <ol className="mt-3 divide-y divide-slate-100">
        {items.map((lesson, index) => (
          <li key={lesson.id}>
            <button type="button" className="w-full py-3 text-left" onClick={() => onOpen(lesson.id)}>
              <div className="flex items-baseline gap-2">
                <span className="w-6 font-mono text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-semibold text-slate-900">{lesson.field}</span>
                {done[lesson.id] ? <span className="text-xs font-semibold text-emerald-700">ready</span> : null}
              </div>
              <p className="mt-1 pl-8 text-sm text-slate-600">{lesson.definition}</p>
              <p className="mt-1 pl-8 font-serif text-slate-800">{lesson.formula}</p>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LessonScreen({
  lesson,
  done,
  onToggle,
  onGo,
}: {
  lesson: LessonMeta;
  done: boolean;
  onToggle: () => void;
  onGo: (id: string) => void;
}) {
  const track = lessonsIn(lesson.part);
  const index = track.findIndex((item) => item.id === lesson.id);
  const Lab = labs[lesson.id as keyof typeof labs];
  const previous = index > 0 ? track[index - 1] : null;
  const next = index < track.length - 1 ? track[index + 1] : null;
  return (
    <main className="mx-auto max-w-5xl px-5 py-5" data-lesson={lesson.id}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {lesson.part === "algebra" ? "Algebra" : "Calculus"} · {index + 1} of {track.length} · {lesson.field}
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{lesson.title}</h2>
      <blockquote className="mt-3 border-l-4 border-[var(--accent)] bg-white px-4 py-3 text-sm leading-relaxed">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Interview question</p>
        <p className="mt-1 text-slate-900">{lesson.ask}</p>
        <p className="mt-2 text-slate-600">{lesson.skill}</p>
      </blockquote>
      <div className="mt-4">
        <Lab />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <button type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold" onClick={onToggle}>
          {done ? "Marked ready" : "I can answer this"}
        </button>
        <div className="flex gap-2">
          {previous ? (
            <button type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold" onClick={() => onGo(previous.id)}>
              {previous.field}
            </button>
          ) : null}
          {next ? (
            <button type="button" className="rounded-md bg-[#172554] px-3 py-2 text-sm font-semibold text-white" onClick={() => onGo(next.id)}>
              {next.field}
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
