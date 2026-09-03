"use client";

import Image from "next/image";
import { useState } from "react";

function ExerciseImageFrame({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Image src={src} alt={alt} fill onLoad={() => setLoaded(true)} className={`object-cover transition-opacity duration-300 ease-in-out ${loaded ? "opacity-100" : "opacity-0"}`} />
      {!loaded ? <span className="absolute inset-0 flex items-center justify-center bg-slate-100" role="status" aria-label="Carregando imagem"><span className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /></span> : null}
    </>
  );
}

export function ExerciseImage({ name, slug }: { name: string; slug: string }) {
  const [gender, setGender] = useState<"masculino" | "feminino">("masculino");
  const [imageNumber, setImageNumber] = useState(1);
  const genderLabel = gender === "masculino" ? "masculina" : "feminina";

  function changeImage(direction: -1 | 1) {
    setImageNumber((current) => ((current - 1 + direction + 3) % 3) + 1);
  }

  function changeGender() {
    setGender((current) => current === "masculino" ? "feminino" : "masculino");
    setImageNumber(1);
  }

  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
      <ExerciseImageFrame key={`${gender}-${imageNumber}`} src={`/images/exercises/${slug}-${gender}-${imageNumber}.png`} alt={`Demonstração ${genderLabel} de ${name}, imagem ${imageNumber} de 3`} />
      <button type="button" aria-label="Imagem anterior" onClick={() => changeImage(-1)} className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-center text-slate-700 opacity-0 transition-opacity duration-200 hover:bg-white/10 hover:opacity-100 focus-visible:bg-white/10 focus-visible:opacity-100 focus-visible:outline-none"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m14.5 5-7 7 7 7" /></svg></button>
      <button type="button" aria-label="Próxima imagem" onClick={() => changeImage(1)} className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center text-slate-700 opacity-0 transition-opacity duration-200 hover:bg-white/10 hover:opacity-100 focus-visible:bg-white/10 focus-visible:opacity-100 focus-visible:outline-none"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m9.5 5 7 7-7 7" /></svg></button>
      <button type="button" aria-label={`Ver demonstração ${gender === "masculino" ? "feminina" : "masculina"}`} onClick={changeGender} className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8.1 8.1 0 0 0-14.5-3.7L4 9m0 0V5m0 4h4M4 13a8.1 8.1 0 0 0 14.5 3.7L20 15m0 0v4m0-4h-4" /></svg></button>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/65 px-2.5 py-1 text-[11px] font-medium text-white">{imageNumber}/3</span>
    </div>
  );
}
