"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RichDescription } from "@/app/exercicios/rich-description";

export function ExerciseInfo({ name, description, gender }: { name: string; description: string | null; gender: "masculino" | "feminino" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const instructions = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    modal?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { modal?.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);

  function scrollBehavior(): ScrollBehavior {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  return <>
    <button type="button" aria-label={`Ver imagens e instruções de ${name}`} aria-haspopup="dialog" onClick={() => { setActiveImage(0); setOpen(true); }} className="block w-full rounded text-left text-sm font-semibold leading-4 [overflow-wrap:anywhere] hover:text-slate-600 hover:underline focus-visible:outline-2 focus-visible:outline-slate-950">{name}</button>
    <dialog ref={dialog} aria-label={`Como fazer ${name}`} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain border-0 bg-white p-0 text-slate-950 backdrop:bg-black">
      {open ? <>
        <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Fechar instruções" className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-20 flex size-11 items-center justify-center rounded-full bg-slate-950/75 text-2xl text-white backdrop-blur">×</button>
        <section aria-label="Imagens do exercício" className="relative h-dvh bg-slate-100">
          <div ref={gallery} onScroll={(event) => { const element = event.currentTarget; if (element.clientWidth) setActiveImage(Math.round(element.scrollLeft / element.clientWidth)); }} className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[0, 1, 2].map((index) => <div key={index} className="relative h-full w-full shrink-0 snap-center">
              {failedImages.includes(index) ? <p className="flex h-full items-center justify-center text-sm text-slate-500">Imagem indisponível</p> : <Image src={`/images/exercises/${slug}-${gender}-${index + 1}.png`} alt={`${name}, demonstração ${index + 1} de 3`} fill sizes="100vw" className="object-cover object-center" loading={index === 0 ? "eager" : "lazy"} onError={() => setFailedImages((current) => [...current, index])} />}
            </div>)}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-5 pt-16 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-white">
            <h2 className="text-xl font-semibold">{name}</h2>
            <div className="pointer-events-auto mt-2 flex justify-center">{[0, 1, 2].map((index) => <button type="button" key={index} aria-label={`Ver imagem ${index + 1}`} aria-pressed={activeImage === index} onClick={() => gallery.current?.scrollTo({ left: index * gallery.current.clientWidth, behavior: scrollBehavior() })} className="flex size-9 items-center justify-center"><span className={`h-1.5 rounded-full ${activeImage === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} /></button>)}</div>
            <button type="button" aria-label="Deslizar para a descrição" onClick={() => instructions.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" })} className="pointer-events-auto mx-auto mt-1 flex size-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-6-6 6 6 6-6" /></svg></button>
          </div>
        </section>
        <section ref={instructions} className="min-h-dvh px-6 pt-20 pb-[max(2rem,env(safe-area-inset-bottom))]"><div className="mx-auto max-w-xl"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Como fazer</p><h2 className="mt-2 mb-5 text-2xl font-semibold">{name}</h2>{description ? <RichDescription text={description} /> : <p className="text-sm text-slate-500">Este exercício ainda não possui descrição.</p>}</div></section>
      </> : null}
    </dialog>
  </>;
}
