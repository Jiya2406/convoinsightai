import {
  PrismaClient,
  RoleName,
  ProviderKey,
  DocumentType,
  GovernanceRuleType,
  GovernanceAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "../src/lib/auth/rbac";

const prisma = new PrismaClient();

/**
 * Seed script — idempotent (uses upsert) so it can be re-run safely.
 * Creates roles, demo users (one per role), providers, and a sample HR
 * assistant with a versioned knowledge base and a governance rule.
 */
async function main() {
  console.log("🌱 Seeding ConvoInsight AI...");

  // ── Roles ──────────────────────────────────────────────────────
  const roles = await Promise.all(
    (Object.keys(ROLE_PERMISSIONS) as RoleName[]).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: { permissions: ROLE_PERMISSIONS[name] },
        create: {
          name,
          description: `${name} role`,
          permissions: ROLE_PERMISSIONS[name],
        },
      }),
    ),
  );
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));
  console.log(`  ✓ ${roles.length} roles`);

  // ── Demo users (password: Passw0rd! for all) ────────────────────
  const passwordHash = await bcrypt.hash("Passw0rd!", 10);
  const demoUsers: Array<{ email: string; name: string; role: RoleName }> = [
    { email: "admin@convoinsight.ai", name: "Ava Admin", role: RoleName.ADMIN },
    { email: "reviewer@convoinsight.ai", name: "Rey Reviewer", role: RoleName.REVIEWER },
    { email: "analyst@convoinsight.ai", name: "Ana Analyst", role: RoleName.ANALYST },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, roleId: roleByName[u.role].id },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        roleId: roleByName[u.role].id,
      },
    });
  }
  console.log(`  ✓ ${demoUsers.length} users (password: Passw0rd!)`);

  // ── Providers ───────────────────────────────────────────────────
  const providerSeed: Array<{
    key: ProviderKey;
    name: string;
    isActive: boolean;
    isScaffold: boolean;
  }> = [
    { key: ProviderKey.MOCK, name: "Mock AI", isActive: true, isScaffold: false },
    { key: ProviderKey.GEMINI, name: "Google Gemini", isActive: true, isScaffold: false },
    { key: ProviderKey.OPENAI, name: "OpenAI", isActive: false, isScaffold: true },
    { key: ProviderKey.CLAUDE, name: "Anthropic Claude", isActive: false, isScaffold: true },
    { key: ProviderKey.DEEPSEEK, name: "DeepSeek", isActive: false, isScaffold: true },
    { key: ProviderKey.LLAMA, name: "Llama", isActive: false, isScaffold: true },
    { key: ProviderKey.AZURE_OPENAI, name: "Azure OpenAI", isActive: false, isScaffold: true },
  ];

  const providers = await Promise.all(
    providerSeed.map((p) =>
      prisma.provider.upsert({
        where: { key: p.key },
        update: { name: p.name, isActive: p.isActive, isScaffold: p.isScaffold },
        create: p,
      }),
    ),
  );
  const mock = providers.find((p) => p.key === ProviderKey.MOCK)!;
  console.log(`  ✓ ${providers.length} providers`);

  // ── Sample HR Assistant ─────────────────────────────────────────
  const hr = await prisma.assistant.upsert({
    where: { id: "seed-hr-assistant" },
    update: {},
    create: {
      id: "seed-hr-assistant",
      name: "HR Helpdesk",
      domain: "HR",
      description: "Answers employee HR policy questions.",
      systemPrompt:
        "You are an HR assistant. Answer only using the provided company policy knowledge. Always cite the policy source. If unsure, say you don't know.",
      providerId: mock.id,
      model: "mock-1",
      temperature: 0.4,
    },
  });

  const knowledge = await prisma.knowledge.upsert({
    where: { assistantId_version: { assistantId: hr.id, version: 1 } },
    update: {},
    create: {
      id: "seed-hr-knowledge-v1",
      assistantId: hr.id,
      name: "HR Policy Handbook",
      version: 1,
      isActive: true,
    },
  });

  const docs: Array<{ id: string; title: string; content: string }> = [
    {
      id: "seed-doc-pto",
      title: "Paid Time Off Policy",
      content:
        "Full-time employees accrue 20 paid vacation days per year plus 10 public holidays. Unused days carry over up to 5 days into the next year.",
    },
    {
      id: "seed-doc-remote",
      title: "Remote Work Policy",
      content:
        "Employees may work remotely up to 3 days per week with manager approval. A home-office stipend of $200 is provided annually.",
    },
    {
      id: "seed-doc-benefits",
      title: "Benefits Overview",
      content:
        "The company offers health, dental, and vision insurance. A 401(k) plan matches contributions up to 5% of salary.",
    },
  ];

  for (const d of docs) {
    await prisma.document.upsert({
      where: { id: d.id },
      update: { title: d.title, content: d.content },
      create: {
        id: d.id,
        knowledgeId: knowledge.id,
        type: DocumentType.TEXT,
        title: d.title,
        content: d.content,
      },
    });
  }
  console.log(`  ✓ HR assistant + knowledge (${docs.length} documents)`);

  // ── Governance rule: grounding required ─────────────────────────
  await prisma.governanceRule.upsert({
    where: { id: "seed-rule-grounding" },
    update: {},
    create: {
      id: "seed-rule-grounding",
      assistantId: hr.id,
      name: "Answers must be grounded in a source",
      type: GovernanceRuleType.GROUNDING,
      config: { requireGroundedSource: true },
      action: GovernanceAction.FLAG,
    },
  });

  await prisma.governanceRule.upsert({
    where: { id: "seed-rule-hallucination" },
    update: {},
    create: {
      id: "seed-rule-hallucination",
      assistantId: hr.id,
      name: "Block high hallucination risk",
      type: GovernanceRuleType.THRESHOLD,
      config: { maxHallucinationRisk: 60 },
      action: GovernanceAction.BLOCK,
    },
  });
  console.log("  ✓ 2 governance rules");

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
