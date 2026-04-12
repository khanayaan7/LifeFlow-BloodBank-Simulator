const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "available":
      return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    case "allocated":
      return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    case "expired":
      return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    default:
      return "bg-surface-container-low dark:bg-gray-700 text-on-surface dark:text-gray-300";
  }
};

export default function BloodUnitTable({ units }) {
  return (
    <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-body-md">
          <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Unit Code</th>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Blood Group</th>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Component</th>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Volume</th>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Expiry</th>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Cold Chain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
            {units.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <p className="text-body-md text-on-surface-variant dark:text-gray-400">No blood units found</p>
                </td>
              </tr>
            ) : (
              units.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 font-medium text-on-surface dark:text-gray-200">{u.unit_code}</td>
                  <td className="px-6 py-4 text-on-surface dark:text-gray-200">{u.blood_group}</td>
                  <td className="px-6 py-4 text-on-surface dark:text-gray-200">{u.component}</td>
                  <td className="px-6 py-4 text-on-surface dark:text-gray-200">{u.volume_ml} ml</td>
                  <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">{new Date(u.expiry_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold capitalize ${getStatusColor(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${u.cold_chain_ok ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                      {u.cold_chain_ok ? "✓ OK" : "✗ Alert"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
