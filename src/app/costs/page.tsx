import { db } from "@/db";
import { costTracking, projects } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatCost } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getCostData() {
  const [byAgent, byProvider, recent, total] = await Promise.all([
    db
      .select({
        agentName: costTracking.agentName,
        totalCost: sql<number>`sum(${costTracking.costUsd})`,
        count: sql<number>`count(*)`,
      })
      .from(costTracking)
      .groupBy(costTracking.agentName)
      .orderBy(desc(sql`sum(${costTracking.costUsd})`)),

    db
      .select({
        provider: costTracking.apiProvider,
        totalCost: sql<number>`sum(${costTracking.costUsd})`,
        count: sql<number>`count(*)`,
      })
      .from(costTracking)
      .groupBy(costTracking.apiProvider)
      .orderBy(desc(sql`sum(${costTracking.costUsd})`)),

    db
      .select({
        id: costTracking.id,
        agentName: costTracking.agentName,
        apiProvider: costTracking.apiProvider,
        operation: costTracking.operation,
        costUsd: costTracking.costUsd,
        units: costTracking.units,
        unitType: costTracking.unitType,
        createdAt: costTracking.createdAt,
        projectId: costTracking.projectId,
      })
      .from(costTracking)
      .orderBy(desc(costTracking.createdAt))
      .limit(50),

    db
      .select({ total: sql<number>`coalesce(sum(cost_usd), 0)` })
      .from(costTracking),
  ]);

  return { byAgent, byProvider, recent, total: total[0]?.total ?? 0 };
}

const PROVIDER_COLORS: Record<string, string> = {
  "OpenAI GPT-4o": "bg-emerald-500",
  "ElevenLabs": "bg-purple-500",
  "DALL-E 3": "bg-blue-500",
  "Pexels API": "bg-amber-500",
  "Epidemic Sound": "bg-pink-500",
  "YouTube": "bg-red-500",
};

export default async function CostsPage() {
  const { byAgent, byProvider, recent, total } = await getCostData();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Cost Tracker</h1>
        <p className="text-zinc-500 text-sm">Real-time API cost monitoring across all video production runs.</p>
      </div>

      {/* Total cost hero */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-zinc-700 rounded-2xl p-8 mb-8 text-center">
        <p className="text-zinc-400 text-sm mb-2">Total API Costs (All Time)</p>
        <p className="text-5xl font-bold text-white mb-2">{formatCost(total)}</p>
        <p className="text-zinc-500 text-xs">{recent.length} API calls logged</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Provider */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-100 mb-4">Cost by API Provider</h2>
          {byProvider.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byProvider.map((row) => {
                const pct = total > 0 ? (row.totalCost / total) * 100 : 0;
                return (
                  <div key={row.provider}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{row.provider}</span>
                      <span className="text-zinc-300 font-medium">{formatCost(row.totalCost)}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${PROVIDER_COLORS[row.provider] ?? "bg-zinc-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-600 mt-0.5">{pct.toFixed(1)}% · {row.count} calls</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Agent */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-100 mb-4">Cost by Agent</h2>
          {byAgent.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {byAgent.map((row) => {
                const pct = total > 0 ? (row.totalCost / total) * 100 : 0;
                return (
                  <div key={row.agentName}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{row.agentName.replace(/_/g, " ")}</span>
                      <span className="text-zinc-300 font-medium">{formatCost(row.totalCost)}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-600 mt-0.5">{pct.toFixed(1)}% · {row.count} operations</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Recent API Calls</h2>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-zinc-600">No API calls logged yet. Create a video to see costs.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-600 uppercase tracking-wide border-b border-zinc-800">
                <th className="px-5 py-3 text-left">Agent</th>
                <th className="px-5 py-3 text-left">Provider</th>
                <th className="px-5 py-3 text-left">Operation</th>
                <th className="px-5 py-3 text-right">Units</th>
                <th className="px-5 py-3 text-right">Cost</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recent.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30">
                  <td className="px-5 py-3 text-zinc-400 text-xs">{row.agentName.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-zinc-300 text-xs">{row.apiProvider}</td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">{row.operation}</td>
                  <td className="px-5 py-3 text-right text-zinc-500 text-xs">
                    {row.units ? `${row.units} ${row.unitType ?? ""}` : "-"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-emerald-400 text-xs font-semibold">
                    {formatCost(row.costUsd)}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-600 text-xs">
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
