import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { equipment, exerciseAttributes, exerciseDiscomfort, exerciseDocuments, exerciseEquipment, exerciseHealthRules, exerciseJoints, exerciseMuscleGroups, exerciseMuscleVolume, exercisePhases, exercisePrimaryMuscles, exercisePriorities, exercises, healthConditions, joints, muscleGroups } from "@/db/schema";
import { extractPdfAnatomy, normalizeText, type MuscleRole } from "@/lib/exercise-pdf-anatomy";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-6-luna";
const OPENAI_TIMEOUT_MS = 240_000;
// Na Vercel o corpo das requisições é limitado a 4,5 MB.
export const MAX_EXERCISE_PDF_SIZE = 4 * 1024 * 1024;

type Tag = { catalogSlug: string | null; label: string; slug: string | null };

export type OrganizedExercise = {
  isExerciseDocument: boolean;
  exerciseCount: number;
  name: string;
  englishName: string | null;
  summary: string | null;
  phases: { name: string; description: string }[];
  muscles: { catalogName: string | null; name: string; role: MuscleRole; importanceOrder: number | null; slug: string | null; description: string; notes: string | null }[];
  joints: { catalogName: string | null; name: string; region: string | null; role: "Principal" | "Secundária" | "Estabilização" | null; movement: string | null; description: string }[];
  equipment: { catalogName: string | null; name: string; description: string; notes: string | null }[];
  equipmentCategory: string | null;
  classification: {
    type: Tag | null;
    laterality: Tag | null;
    kineticChain: Tag | null;
    movementPattern: Tag | null;
    plane: Tag | null;
    stabilityDemand: Tag | null;
    loadProgression: Tag | null;
    resistanceCurve: string | null;
    machineAdjustments: string | null;
  };
  discomfort: { region: string; score: number; label: string | null; notes: string | null }[];
  workoutData: {
    muscleVolume: { muscle: string; slug: string | null; value: number; kind: string | null }[];
    sessionRole: Tag | null;
    systemicFatigue: number | null;
    technicalComplexity: number | null;
    safeToFailure: boolean | null;
    setupSeconds: number | null;
    secondsPerSet: number | null;
    unilateral: boolean | null;
    position: Tag | null;
    impact: Tag | null;
    axialLoad: Tag | null;
    goesToFloor: boolean | null;
  };
  rules: {
    minimumLevel: Tag | null;
    healthConditions: { catalogSlug: string | null; label: string; slug: string | null; action: "excluir" | "permitido" | "adaptar" }[];
    priorityGoals: Tag[];
    priorityLevels: Tag[];
    priorityProfiles: Tag[];
    priorityConditions: Tag[];
  };
  sources: string[];
};

const nullableString = { type: ["string", "null"] };
const nullableInteger = { type: ["integer", "null"] };
const nullableBoolean = { type: ["boolean", "null"] };

function object(properties: Record<string, unknown>) {
  return { type: "object", additionalProperties: false, required: Object.keys(properties), properties };
}

function array(items: unknown) {
  return { type: "array", items };
}

// Com strict mode, o enum obriga a IA a escolher um nome já cadastrado ou
// devolver null, evitando duplicatas como "Peitoral maior" e "Peitoral Maior".
function catalogField(names: string[]) {
  return names.length ? { anyOf: [{ type: "string", enum: names }, { type: "null" }] } : { type: "null" };
}

const ATTRIBUTE_TAG_KEYS = ["type", "laterality", "kineticChain", "movementPattern", "plane", "stabilityDemand", "loadProgression", "sessionRole", "position", "impact", "axialLoad", "minimumLevel"] as const;
const PRIORITY_KINDS = ["objetivo", "nivel", "perfil", "condicao"] as const;
type TagKey = (typeof ATTRIBUTE_TAG_KEYS)[number] | (typeof PRIORITY_KINDS)[number];

type Catalogs = { groups: string[]; joints: string[]; equipment: string[]; healthConditions: string[]; tags: Record<TagKey, string[]> };

// Os slugs já usados viram vocabulário: um PDF que diz "compound" reaproveita
// "multiarticular" em vez de criar "composto" e quebrar os filtros.
function tagField(values: string[]) {
  return object({ catalogSlug: catalogField(values), label: { type: "string" }, slug: nullableString });
}

function nullableTagField(values: string[]) {
  return { anyOf: [tagField(values), { type: "null" }] };
}

const buildOrganizedExerciseSchema = (catalogs: Catalogs) => object({
  isExerciseDocument: { type: "boolean" },
  exerciseCount: { type: "integer" },
  name: { type: "string" },
  englishName: nullableString,
  summary: nullableString,
  phases: array(object({ name: { type: "string" }, description: { type: "string" } })),
  muscles: array(object({ catalogName: catalogField(catalogs.groups), name: { type: "string" }, role: { type: "string", enum: ["principal", "auxiliar", "sinergista", "estabilizador"] }, importanceOrder: nullableInteger, slug: nullableString, description: { type: "string" }, notes: nullableString })),
  joints: array(object({ catalogName: catalogField(catalogs.joints), name: { type: "string" }, region: nullableString, role: { anyOf: [{ type: "string", enum: ["Principal", "Secundária", "Estabilização"] }, { type: "null" }] }, movement: nullableString, description: { type: "string" } })),
  equipment: array(object({ catalogName: catalogField(catalogs.equipment), name: { type: "string" }, description: { type: "string" }, notes: nullableString })),
  equipmentCategory: nullableString,
  classification: object({ type: nullableTagField(catalogs.tags.type), laterality: nullableTagField(catalogs.tags.laterality), kineticChain: nullableTagField(catalogs.tags.kineticChain), movementPattern: nullableTagField(catalogs.tags.movementPattern), plane: nullableTagField(catalogs.tags.plane), stabilityDemand: nullableTagField(catalogs.tags.stabilityDemand), loadProgression: nullableTagField(catalogs.tags.loadProgression), resistanceCurve: nullableString, machineAdjustments: nullableString }),
  discomfort: array(object({ region: { type: "string" }, score: { type: "integer" }, label: nullableString, notes: nullableString })),
  workoutData: object({
    muscleVolume: array(object({ muscle: { type: "string" }, slug: nullableString, value: { type: "number" }, kind: nullableString })),
    sessionRole: nullableTagField(catalogs.tags.sessionRole),
    systemicFatigue: nullableInteger,
    technicalComplexity: nullableInteger,
    safeToFailure: nullableBoolean,
    setupSeconds: nullableInteger,
    secondsPerSet: nullableInteger,
    unilateral: nullableBoolean,
    position: nullableTagField(catalogs.tags.position),
    impact: nullableTagField(catalogs.tags.impact),
    axialLoad: nullableTagField(catalogs.tags.axialLoad),
    goesToFloor: nullableBoolean,
  }),
  rules: object({
    minimumLevel: nullableTagField(catalogs.tags.minimumLevel),
    healthConditions: array(object({ catalogSlug: catalogField(catalogs.healthConditions), label: { type: "string" }, slug: nullableString, action: { type: "string", enum: ["excluir", "permitido", "adaptar"] } })),
    priorityGoals: array(tagField(catalogs.tags.objetivo)),
    priorityLevels: array(tagField(catalogs.tags.nivel)),
    priorityProfiles: array(tagField(catalogs.tags.perfil)),
    priorityConditions: array(tagField(catalogs.tags.condicao)),
  }),
  sources: array({ type: "string" }),
});

const instructions = `Você organiza fichas técnicas de exercícios de musculação para um app de treino.
Leia o PDF enviado e devolva os dados no schema JSON pedido.
Regras:
- "isExerciseDocument" é false quando o documento não descreve um exercício físico. "exerciseCount" é quantos exercícios distintos o documento descreve.
- Todo texto livre (nomes, descrições, rótulos, equipamentos, regiões) deve estar em português do Brasil, mesmo que o documento esteja em outro idioma. "name" é o nome do exercício em português; o nome em inglês, se houver, vai em "englishName".
- Use apenas informações presentes no documento. Quando um campo não existir, use null ou lista vazia; não invente.
- Preserve os identificadores técnicos (slugs como "empurrar_horizontal" ou "dor_lombar") exatamente como aparecem no documento.
- "phases" segue a ordem de execução, com nomes em formato de título (ex.: Início, Meio, Fim) e a descrição completa de cada fase.
- "muscles": um item por músculo, sem repetir. Use o papel principal, sinergista ou estabilizador conforme o documento ("auxiliar" só quando o papel não for especificado). "importanceOrder" vem da ordem de importância; músculos fora dela ficam com null.
- "joints": um item por articulação, com o papel e o movimento resumido em até 120 caracteres.
- O catálogo tem itens gerais e específicos (ex.: "Quadríceps" e "Vasto intermédio, lateral e medial"; "Ombro" e "Glenoumeral"). Use o mesmo nível de detalhe do documento: se ele cita o grupo, use o item geral; se cita as partes, use o item específico.
- Em músculos, articulações e equipamentos, "name" é o nome como aparece no documento. Preencha "catalogName" com o item equivalente do catálogo; use null apenas quando nenhum item do catálogo corresponder. Nesse caso, "name" deve ser o nome anatômico canônico em português, iniciando com maiúscula e sem observações entre parênteses (ex.: "Isquiotibiais"), e "description" deve trazer uma descrição curta, didática e genérica do item, que sirva para qualquer exercício (não descreva o uso neste exercício).
- Campos com "catalogSlug" (classificações, posição, nível, prioridades e condições de saúde): preencha com o valor já cadastrado que tenha o mesmo significado, mesmo que o documento use outra palavra ou idioma; use null só quando nenhum valor corresponder.
- "sources" lista apenas referências bibliográficas citadas no documento; sem referências, use lista vazia.
- "discomfort.score" e as escalas de fadiga e complexidade vão de 1 a 5.`;

function readOutputText(response: { status?: string; incomplete_details?: { reason?: string } | null; output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[] }) {
  if (response.status === "incomplete") throw new Error(`OPENAI_INCOMPLETE: ${response.incomplete_details?.reason ?? "desconhecido"}`);
  const content = response.output?.find((item) => item.type === "message")?.content ?? [];
  const refusal = content.find((item) => item.type === "refusal")?.refusal;
  if (refusal) throw new Error(`OPENAI_REFUSAL: ${refusal}`);
  const text = content.find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("OPENAI_EMPTY_RESPONSE");
  return text;
}

async function loadCatalogs(): Promise<Catalogs> {
  const [groupRows, jointRows, equipmentRows, conditionRows, attributeRows, priorityRows] = await Promise.all([
    db.select({ name: muscleGroups.name }).from(muscleGroups),
    db.select({ name: joints.name }).from(joints),
    db.select({ name: equipment.name }).from(equipment),
    db.select({ slug: healthConditions.slug }).from(healthConditions),
    db.select().from(exerciseAttributes),
    db.select({ kind: exercisePriorities.kind, slug: exercisePriorities.slug }).from(exercisePriorities),
  ]);
  const tags = Object.fromEntries([...ATTRIBUTE_TAG_KEYS, ...PRIORITY_KINDS].map((key) => [key, new Set<string>()])) as Record<TagKey, Set<string>>;
  for (const row of attributeRows) for (const key of ATTRIBUTE_TAG_KEYS) if (row[key]) tags[key].add(row[key]);
  for (const row of priorityRows) tags[row.kind].add(row.slug);
  // Nível mínimo e prioridade por nível usam a mesma escala.
  for (const slug of tags.minimumLevel) tags.nivel.add(slug);
  for (const slug of tags.nivel) tags.minimumLevel.add(slug);
  return { groups: groupRows.map((row) => row.name), joints: jointRows.map((row) => row.name), equipment: equipmentRows.map((row) => row.name), healthConditions: conditionRows.map((row) => row.slug), tags: Object.fromEntries(Object.entries(tags).map(([key, values]) => [key, [...values]])) as Record<TagKey, string[]> };
}

export async function requestOrganizedExercise({ content, fileName, catalogs }: { content: Buffer; fileName: string; catalogs: Catalogs }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_NOT_CONFIGURED");

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      instructions,
      input: [{
        role: "user",
        content: [
          { type: "input_file", filename: fileName, file_data: `data:application/pdf;base64,${content.toString("base64")}` },
        ],
      }],
      text: { format: { type: "json_schema", name: "organized_exercise", strict: true, schema: buildOrganizedExerciseSchema(catalogs) } },
    }),
  });

  if (!response.ok) throw new Error(`OPENAI_REQUEST_FAILED: ${response.status} ${(await response.text()).slice(0, 300)}`);
  return JSON.parse(readOutputText(await response.json())) as OrganizedExercise;
}

async function findOrCreateByName<T extends { id: string; name: string }>(catalog: T[], name: string, create: () => Promise<T | undefined>, findExisting: () => Promise<T | undefined>) {
  const normalized = normalizeText(name);
  const existing = catalog.find((item) => normalizeText(item.name) === normalized);
  if (existing) return existing;
  const created = (await create()) ?? (await findExisting());
  if (created) catalog.push(created);
  return created;
}

function slugify(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
}

function tagSlug(tag: Tag | null) {
  return tag ? (tag.catalogSlug ?? slugify(tag.slug || tag.label)).slice(0, 60) || null : null;
}

function normalizeExerciseName(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function capitalize(value: string) {
  const trimmed = value.trim();
  return trimmed.charAt(0).toLocaleUpperCase("pt-BR") + trimmed.slice(1);
}

export function describeOrganizedExercise(organized: OrganizedExercise) {
  const phases = organized.phases.map((phase) => `**${phase.name}**\n${phase.description}`).join("\n\n");
  return phases || organized.summary || "Exercício organizado a partir do PDF. Revise antes de usar no treino.";
}

export async function saveOrganizedExercise(exerciseId: string, organized: OrganizedExercise) {
  const [groupCatalog, jointCatalog, equipmentCatalog] = await Promise.all([
    db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups),
    db.select({ id: joints.id, name: joints.name }).from(joints),
    db.select({ id: equipment.id, name: equipment.name }).from(equipment),
  ]);

  const muscleValues: { exerciseId: string; muscleGroupId: string; role: MuscleRole; importanceOrder: number; notes: string | null }[] = [];
  for (const muscle of organized.muscles) {
    const name = capitalize(muscle.catalogName ?? muscle.name).slice(0, 80);
    if (!name) continue;
    const group = await findOrCreateByName(
      groupCatalog,
      name,
      async () => (await db.insert(muscleGroups).values({ name, description: muscle.description || "Grupo muscular identificado no documento do exercício." }).onConflictDoNothing().returning({ id: muscleGroups.id, name: muscleGroups.name }))[0],
      async () => (await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).where(eq(muscleGroups.name, name)).limit(1))[0],
    );
    if (group && !muscleValues.some((value) => value.muscleGroupId === group.id)) muscleValues.push({ exerciseId, muscleGroupId: group.id, role: muscle.role, importanceOrder: muscle.importanceOrder ?? 0, notes: muscle.notes });
  }
  if (muscleValues.length) await db.insert(exerciseMuscleGroups).values(muscleValues).onConflictDoNothing();
  const primaryValues = muscleValues.filter((value) => value.role === "principal").map(({ muscleGroupId }) => ({ exerciseId, muscleGroupId }));
  if (primaryValues.length) await db.insert(exercisePrimaryMuscles).values(primaryValues).onConflictDoNothing();

  const phaseValues = organized.phases.filter((phase) => phase.description.trim()).map((phase, orderIndex) => ({ exerciseId, name: phase.name.trim().slice(0, 80), description: phase.description.trim(), orderIndex }));
  if (phaseValues.length) await db.insert(exercisePhases).values(phaseValues);

  const jointValues: { exerciseId: string; jointId: string; movement: string | null; role: string | null; orderIndex: number }[] = [];
  for (const [orderIndex, item] of organized.joints.entries()) {
    const name = capitalize(item.catalogName ?? item.name).slice(0, 100);
    if (!name) continue;
    const joint = await findOrCreateByName(
      jointCatalog,
      name,
      async () => (await db.insert(joints).values({ name, region: item.region?.slice(0, 80) ?? null, description: item.description || null }).onConflictDoNothing().returning({ id: joints.id, name: joints.name }))[0],
      async () => (await db.select({ id: joints.id, name: joints.name }).from(joints).where(eq(joints.name, name)).limit(1))[0],
    );
    if (joint && !jointValues.some((value) => value.jointId === joint.id)) jointValues.push({ exerciseId, jointId: joint.id, movement: item.movement?.slice(0, 120) ?? null, role: item.role?.slice(0, 80) ?? null, orderIndex: orderIndex + 1 });
  }
  if (jointValues.length) await db.insert(exerciseJoints).values(jointValues).onConflictDoNothing();

  const equipmentValues: { exerciseId: string; equipmentId: string; notes: string | null }[] = [];
  for (const item of organized.equipment) {
    const name = capitalize(item.catalogName ?? item.name).slice(0, 100);
    if (!name) continue;
    const found = await findOrCreateByName(
      equipmentCatalog,
      name,
      async () => (await db.insert(equipment).values({ name, description: item.description || null }).onConflictDoNothing().returning({ id: equipment.id, name: equipment.name }))[0],
      async () => (await db.select({ id: equipment.id, name: equipment.name }).from(equipment).where(eq(equipment.name, name)).limit(1))[0],
    );
    if (found && !equipmentValues.some((value) => value.equipmentId === found.id)) equipmentValues.push({ exerciseId, equipmentId: found.id, notes: item.notes });
  }
  if (equipmentValues.length) await db.insert(exerciseEquipment).values(equipmentValues).onConflictDoNothing();

  const { classification, workoutData, rules } = organized;
  await db.insert(exerciseAttributes).values({
    exerciseId,
    type: tagSlug(classification.type),
    laterality: tagSlug(classification.laterality),
    kineticChain: tagSlug(classification.kineticChain),
    movementPattern: tagSlug(classification.movementPattern),
    plane: tagSlug(classification.plane),
    stabilityDemand: tagSlug(classification.stabilityDemand),
    loadProgression: tagSlug(classification.loadProgression),
    resistanceCurve: classification.resistanceCurve,
    machineAdjustments: classification.machineAdjustments,
    equipmentCategory: organized.equipmentCategory?.slice(0, 80) ?? null,
    sessionRole: tagSlug(workoutData.sessionRole),
    systemicFatigue: workoutData.systemicFatigue,
    technicalComplexity: workoutData.technicalComplexity,
    safeToFailure: workoutData.safeToFailure,
    setupSeconds: workoutData.setupSeconds,
    secondsPerSet: workoutData.secondsPerSet,
    unilateral: workoutData.unilateral,
    position: tagSlug(workoutData.position),
    impact: tagSlug(workoutData.impact),
    axialLoad: tagSlug(workoutData.axialLoad),
    goesToFloor: workoutData.goesToFloor,
    minimumLevel: tagSlug(rules.minimumLevel),
    sources: organized.sources,
  });

  const discomfortValues = organized.discomfort.map((item) => ({ exerciseId, region: item.region.slice(0, 80), score: item.score, label: item.label?.slice(0, 60) ?? null, notes: item.notes }));
  if (discomfortValues.length) await db.insert(exerciseDiscomfort).values(discomfortValues);

  const volumeValues: { exerciseId: string; slug: string; label: string; value: string; kind: string | null }[] = [];
  for (const item of workoutData.muscleVolume) {
    const slug = slugify(item.slug || item.muscle);
    if (slug && !volumeValues.some((value) => value.slug === slug)) volumeValues.push({ exerciseId, slug, label: item.muscle.slice(0, 80), value: String(item.value), kind: item.kind?.slice(0, 40) ?? null });
  }
  if (volumeValues.length) await db.insert(exerciseMuscleVolume).values(volumeValues);

  const healthRuleValues: { exerciseId: string; healthConditionId: string; action: "excluir" | "permitido" | "adaptar" }[] = [];
  for (const item of rules.healthConditions) {
    const slug = item.catalogSlug ?? slugify(item.slug || item.label);
    if (!slug) continue;
    const condition = (await db.insert(healthConditions).values({ slug, name: item.label.slice(0, 160) }).onConflictDoNothing().returning({ id: healthConditions.id }))[0]
      ?? (await db.select({ id: healthConditions.id }).from(healthConditions).where(eq(healthConditions.slug, slug)).limit(1))[0];
    if (condition && !healthRuleValues.some((value) => value.healthConditionId === condition.id)) healthRuleValues.push({ exerciseId, healthConditionId: condition.id, action: item.action });
  }
  if (healthRuleValues.length) await db.insert(exerciseHealthRules).values(healthRuleValues);

  const priorityValues: { exerciseId: string; kind: "objetivo" | "nivel" | "perfil" | "condicao"; slug: string; label: string }[] = [];
  for (const [kind, tags] of [["objetivo", rules.priorityGoals], ["nivel", rules.priorityLevels], ["perfil", rules.priorityProfiles], ["condicao", rules.priorityConditions]] as const) {
    for (const tag of tags) {
      const slug = tagSlug(tag);
      if (slug && !priorityValues.some((value) => value.kind === kind && value.slug === slug)) priorityValues.push({ exerciseId, kind, slug, label: tag.label.slice(0, 120) });
    }
  }
  if (priorityValues.length) await db.insert(exercisePriorities).values(priorityValues);

  return { muscleCount: muscleValues.length, primaryMuscleCount: primaryValues.length, phaseCount: phaseValues.length, jointCount: jointValues.length, equipmentCount: equipmentValues.length, discomfortCount: discomfortValues.length, healthRuleCount: healthRuleValues.length, priorityCount: priorityValues.length };
}

export type ImportExercisePdfResult =
  | { ok: true; exercise: { id: string; name: string }; counts: Awaited<ReturnType<typeof saveOrganizedExercise>>; organized: OrganizedExercise }
  | { ok: false; status: number; message: string; exerciseId?: string };

async function findExerciseByName(name: string) {
  const normalized = normalizeExerciseName(name);
  const rows = await db.select({ id: exercises.id, name: exercises.name }).from(exercises);
  return rows.find((row) => normalizeExerciseName(row.name) === normalized);
}

export async function importExercisePdf({ file, requestedName, userId }: { file: unknown; requestedName: string; userId: string }): Promise<ImportExercisePdfResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, status: 400, message: "Selecione um arquivo PDF." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return { ok: false, status: 400, message: "Envie um arquivo PDF válido." };
  if (file.size > MAX_EXERCISE_PDF_SIZE) return { ok: false, status: 413, message: "O PDF deve ter no máximo 4 MB." };
  if (requestedName && (requestedName.length < 2 || requestedName.length > 120)) return { ok: false, status: 400, message: "Informe um nome de exercício válido." };

  const content = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(content).digest("hex");
  const [duplicateDocument] = await db.select({ exerciseId: exerciseDocuments.exerciseId }).from(exerciseDocuments).where(eq(exerciseDocuments.checksum, checksum)).limit(1);
  if (duplicateDocument) return { ok: false, status: 409, message: "Este PDF já foi importado.", exerciseId: duplicateDocument.exerciseId };
  const requestedDuplicate = requestedName ? await findExerciseByName(requestedName) : undefined;
  if (requestedDuplicate) return { ok: false, status: 409, message: `Já existe o exercício “${requestedDuplicate.name}”.`, exerciseId: requestedDuplicate.id };

  let organized: OrganizedExercise;
  try {
    organized = await requestOrganizedExercise({ content, fileName: file.name, catalogs: await loadCatalogs() });
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_NOT_CONFIGURED") return { ok: false, status: 503, message: "A integração com a OpenAI não está configurada." };
    console.error("Falha ao organizar o PDF com a OpenAI", error);
    return { ok: false, status: 502, message: "Não foi possível organizar o exercício com a IA. Tente novamente." };
  }
  if (!organized.isExerciseDocument) return { ok: false, status: 422, message: "O PDF não descreve um exercício." };
  if (organized.exerciseCount !== 1) return { ok: false, status: 422, message: `O PDF descreve ${organized.exerciseCount} exercícios. Envie um exercício por arquivo.` };

  const name = (requestedName || organized.name.trim() || file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim()).slice(0, 120);
  const duplicate = requestedName ? undefined : await findExerciseByName(name);
  if (duplicate) return { ok: false, status: 409, message: `Já existe o exercício “${duplicate.name}”.`, exerciseId: duplicate.id };

  let extractedText: string | null = null;
  try {
    extractedText = await extractPdfAnatomy(content);
  } catch {
    // O texto extraído é apenas referência; a organização já veio da IA.
  }

  let createdExerciseId: string | undefined;
  try {
    // O driver HTTP do Neon não oferece transações interativas; em caso de
    // falha o exercício é removido e os vínculos caem em cascata.
    const [createdExercise] = await db.insert(exercises).values({
      name,
      englishName: organized.englishName?.slice(0, 160) ?? null,
      description: describeOrganizedExercise(organized),
      reviewStatus: "pendente",
      createdBy: userId,
    }).returning({ id: exercises.id, name: exercises.name });
    createdExerciseId = createdExercise.id;
    await db.insert(exerciseDocuments).values({
      exerciseId: createdExercise.id,
      originalName: file.name.slice(0, 255),
      mimeType: "application/pdf",
      fileSize: file.size,
      checksum,
      content: content.toString("base64"),
      createdBy: userId,
      extractedText,
      structuredData: organized,
      status: "ready",
    });
    const counts = await saveOrganizedExercise(createdExercise.id, organized);
    return { ok: true, exercise: createdExercise, counts, organized };
  } catch (error) {
    if (createdExerciseId) await db.delete(exercises).where(eq(exercises.id, createdExerciseId));
    console.error("Falha ao salvar o exercício organizado", error);
    return { ok: false, status: 500, message: "Não foi possível salvar o exercício. Tente novamente." };
  }
}
