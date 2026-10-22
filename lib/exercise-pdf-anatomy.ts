import { PDFParse } from "pdf-parse";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exerciseJoints, exerciseMuscleGroups, exercisePhases, exercisePrimaryMuscles, joints, muscleGroups } from "@/db/schema";

PDFParse.setWorker(path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"));

export type MuscleRole = "principal" | "auxiliar" | "sinergista" | "estabilizador";

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function extractPdfAnatomy(content: Buffer) {
  const parser = new PDFParse({ data: content });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function saveExtractedAnatomy(exerciseId: string, extractedText: string) {
  const groups = await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups);
  const normalized = normalizeText(extractedText);
  const targets: { aliases: string[]; role: MuscleRole; order: number; groupName?: string; groupDescription?: string }[] = [
    { aliases: ["peitoral maior", "peitoral (principal)"], role: "principal", order: 1 },
    { aliases: ["deltoide anterior"], role: "sinergista", order: 2 },
    { aliases: ["coracobraquial"], role: "sinergista", order: 3 },
    { aliases: ["serrátil anterior", "serratal anterior"], role: "estabilizador", order: 4 },
    { aliases: ["trapézio médio", "trapézio inferior", "trapézio"], role: "estabilizador", order: 5 },
    { aliases: ["romboides", "romboide"], role: "estabilizador", order: 6 },
    { aliases: ["manguito rotador"], role: "estabilizador", order: 7, groupName: "Manguito rotador", groupDescription: "Conjunto de músculos que estabiliza e gira a articulação do ombro." },
    { aliases: ["bíceps braquial"], role: "estabilizador", order: 8 },
    { aliases: ["flexores do punho"], role: "estabilizador", order: 9, groupName: "Flexores do punho", groupDescription: "Músculos do antebraço que mantêm a posição do punho e da mão." },
  ];
  const values: { exerciseId: string; muscleGroupId: string; role: MuscleRole; importanceOrder: number; notes: string | null }[] = [];
  for (const target of targets) {
    const alias = target.aliases.find((value) => normalized.includes(normalizeText(value)));
    if (!alias) continue;
    const aliasNormalized = normalizeText(alias);
    let group = groups.filter((item) => {
      const groupName = normalizeText(item.name);
      if (aliasNormalized.includes("romboide")) return groupName.includes("romboide");
      return groupName.includes(aliasNormalized) || aliasNormalized.includes(groupName);
    }).sort((a, b) => b.name.length - a.name.length)[0];
    if (!group && target.groupName) {
      const [createdGroup] = await db.insert(muscleGroups).values({ name: target.groupName, description: target.groupDescription ?? "Grupo muscular identificado no documento do exercício." }).onConflictDoNothing().returning({ id: muscleGroups.id, name: muscleGroups.name });
      group = createdGroup ?? (await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).where(eq(muscleGroups.name, target.groupName)).limit(1))[0];
    }
    if (group && !values.some((value) => value.muscleGroupId === group.id)) values.push({ exerciseId, muscleGroupId: group.id, role: target.role, importanceOrder: target.order, notes: null });
  }
  await db.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, exerciseId));
  if (values.length) await db.insert(exerciseMuscleGroups).values(values).onConflictDoNothing();
  const primaryGroups = groups.filter((group) => {
    const name = normalizeText(group.name);
    return normalized.includes("principal peitoral maior") && name === "peitoral maior";
  });
  await db.delete(exercisePrimaryMuscles).where(eq(exercisePrimaryMuscles.exerciseId, exerciseId));
  if (primaryGroups.length) await db.insert(exercisePrimaryMuscles).values(primaryGroups.map((group) => ({ exerciseId, muscleGroupId: group.id }))).onConflictDoNothing();

  const phaseBlock = extractedText.match(/1 · INÍCIO\s*2 · MEIO\s*3 · FIM([\s\S]*?)Músculos envolvidos/i)?.[1] ?? "";
  const phaseLines = phaseBlock.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const phaseSize = Math.ceil(phaseLines.length / 3);
  const phaseValues = ["Início", "Meio", "Fim"].map((name, orderIndex) => ({ exerciseId, name, description: phaseLines.slice(orderIndex * phaseSize, (orderIndex + 1) * phaseSize).join(" ").trim(), orderIndex })).filter((phase) => phase.description);
  if (phaseValues.length) {
    await db.delete(exercisePhases).where(eq(exercisePhases.exerciseId, exerciseId));
    await db.insert(exercisePhases).values(phaseValues).onConflictDoNothing();
  }
  const jointTargets: { aliases: string[]; name: string; region: string; movement: string; role: string; order: number }[] = [
    { aliases: ["ombro (glenoumeral)"], name: "Glenoumeral", region: "Membro superior", movement: "Adução horizontal", role: "Principal", order: 1 },
    { aliases: ["escapulotorácica"], name: "Escapulotorácica", region: "Cintura escapular", movement: "Estabilização", role: "Estabilização", order: 2 },
    { aliases: ["cotovelo"], name: "Cotovelo", region: "Membro superior", movement: "Leve flexão mantida", role: "Estabilização", order: 3 },
  ];
  await db.delete(exerciseJoints).where(eq(exerciseJoints.exerciseId, exerciseId));
  const jointValues: { exerciseId: string; jointId: string; movement: string; role: string; orderIndex: number }[] = [];
  for (const target of jointTargets) {
    if (!target.aliases.some((alias) => normalized.includes(normalizeText(alias)))) continue;
    let joint = (await db.select({ id: joints.id }).from(joints).where(eq(joints.name, target.name)).limit(1))[0];
    if (!joint) {
      const [created] = await db.insert(joints).values({ name: target.name, region: target.region, description: `Articulação envolvida na execução do exercício (${target.movement.toLowerCase()}).` }).returning({ id: joints.id });
      joint = created;
    }
    jointValues.push({ exerciseId, jointId: joint.id, movement: target.movement, role: target.role, orderIndex: target.order });
  }
  if (jointValues.length) await db.insert(exerciseJoints).values(jointValues).onConflictDoNothing();
  const description = phaseValues.map((phase) => `**${phase.name}**\n${phase.description}`).join("\n\n");
  return { muscleCount: values.length, primaryMuscleCount: primaryGroups.length, phaseCount: phaseValues.length, jointCount: jointValues.length, description };
}
