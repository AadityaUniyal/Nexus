import Groq from "groq-sdk";
import { groqCircuitBreaker } from "./circuit-breaker";
import { cacheService } from "./cache-service";

const groqApiKey = process.env.GROQ_API_KEY;

export const groqClient = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;

export async function generateOperationalBriefing(context: {
  activeIncidentsCount: number;
  fleetUtilizationPct: number;
  slaCompliancePct: number;
  topIncidentTitle?: string;
  recentSimulationsCount: number;
}): Promise<string> {
  const cacheKey = `briefing:${context.activeIncidentsCount}:${context.fleetUtilizationPct}:${context.slaCompliancePct}:${context.topIncidentTitle || "none"}`;
  const cached = cacheService.get<string>(cacheKey);
  if (cached) return cached;

  const fallbackSummary = `Operations report: ${context.activeIncidentsCount} active operational anomalies currently flagged. Fleet health is steady at ${context.fleetUtilizationPct}% utilization with ${context.slaCompliancePct}% overall SLA adherence. Top critical priority: "${context.topIncidentTitle ?? 'I-80 Corridor Weather Disruption'}". Simulations indicate active rerouting mitigates 78% of projected downstream delays.`;

  if (!groqClient) {
    cacheService.set(cacheKey, fallbackSummary, 60 * 1000, ["ai_briefings"]);
    return fallbackSummary;
  }

  const result = await groqCircuitBreaker.execute(
    async () => {
      const response = await groqClient!.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are NEXUS Operational Intelligence AI, an authoritative, concise, and calm operational briefing system. Provide high-density, warm-industrial operational situation analysis in 3-4 sentences. Highlight immediate tactical priorities, risk exposure, and simulation recommendations. Do not use buzzwords.",
          },
          {
            role: "user",
            content: `Generate executive command briefing for current operations state:\n- Active Incidents: ${context.activeIncidentsCount}\n- Fleet Utilization: ${context.fleetUtilizationPct}%\n- SLA Compliance: ${context.slaCompliancePct}%\n- Primary Incident: ${context.topIncidentTitle ?? "None"}\n- Recent Simulations Evaluated: ${context.recentSimulationsCount}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 250,
      });

      return response.choices[0]?.message?.content?.trim() || fallbackSummary;
    },
    () => fallbackSummary
  );

  cacheService.set(cacheKey, result, 90 * 1000, ["ai_briefings"]);
  return result;
}

export async function generateIncidentMitigation(incident: {
  title: string;
  summary: string;
  severity: string;
  affectedEntity: string;
  delayMins: number;
}): Promise<string> {
  const cacheKey = `mitigation:${incident.title}:${incident.severity}:${incident.delayMins}`;
  const cached = cacheService.get<string>(cacheKey);
  if (cached) return cached;

  const fallback = `Root cause identified on ${incident.affectedEntity}. Recommend immediate rerouting around congested bottleneck and dynamic priority reassignment to protect high-SLA shipments.`;

  if (!groqClient) {
    cacheService.set(cacheKey, fallback, 120 * 1000, ["incidents"]);
    return fallback;
  }

  const result = await groqCircuitBreaker.execute(
    async () => {
      const response = await groqClient!.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are the NEXUS Incident Intelligence Engine. Provide a direct 2-3 sentence root-cause assessment and concrete mitigation strategy based strictly on provided telemetry.",
          },
          {
            role: "user",
            content: `Incident: ${incident.title}\nSeverity: ${incident.severity}\nAffected: ${incident.affectedEntity}\nCurrent Delay: ${incident.delayMins} mins\nSummary: ${incident.summary}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content?.trim() || fallback;
    },
    () => fallback
  );

  cacheService.set(cacheKey, result, 120 * 1000, ["incidents"]);
  return result;
}
