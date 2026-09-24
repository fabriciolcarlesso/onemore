import { Fragment } from "react";

export function RichDescription({ text, className = "text-sm leading-6 text-slate-500" }: { text: string; className?: string }) {
  return <p className={className}>{text.replace(/\r\n?/g, "\n").split("\n").map((line, lineIndex) => <Fragment key={`line-${lineIndex}`}>{lineIndex > 0 ? <br /> : null}{line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => part.startsWith("**") && part.endsWith("**") ? <strong key={`part-${partIndex}`} className="font-semibold text-slate-700">{part.slice(2, -2)}</strong> : <Fragment key={`part-${partIndex}`}>{part}</Fragment>)}</Fragment>)}</p>;
}
