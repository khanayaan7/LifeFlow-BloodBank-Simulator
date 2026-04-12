export default function AllocationResult({ units }) {
  if (!units || units.length === 0) {
    return <p className="text-body-md text-on-surface-variant">No units allocated.</p>;
  }

  return (
    <div className="rounded-lg bg-surface shadow-ambient p-6">
      <h3 className="mb-4 font-display text-xl font-bold text-on-surface">Allocation Result</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-body-md">
          <thead className="bg-surface-container-low border-b border-surface-container-high">
            <tr className="text-left">
              <th className="px-6 py-3 text-label-md font-semibold text-on-surface-variant">Unit</th>
              <th className="px-6 py-3 text-label-md font-semibold text-on-surface-variant">Expiry</th>
              <th className="px-6 py-3 text-label-md font-semibold text-on-surface-variant">Score</th>
              <th className="px-6 py-3 text-label-md font-semibold text-on-surface-variant">Cold Chain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {units.map((u) => (
              <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-3 font-medium text-on-surface">{u.blood_unit_id || u.unit_code}</td>
                <td className="px-6 py-3 text-on-surface-variant">{u.expiry_date ? new Date(u.expiry_date).toLocaleDateString() : "—"}</td>
                <td className="px-6 py-3 text-on-surface font-semibold">{u.allocation_score?.toFixed ? u.allocation_score.toFixed(2) : "—"}</td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${u.cold_chain_ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {u.cold_chain_ok ? "✓ OK" : "✗ Alert"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
