import { formatDistanceToNow } from 'date-fns';

export default function TicketTable({ tickets, loading }) {

    if (loading) {
        return (
            <div className="glass-panel overflow-hidden border border-slate-700/50 rounded-xl">
                <div className="p-4 space-y-4 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-slate-800/50 rounded-lg w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!tickets || tickets.length === 0) {
        return (
            <div className="glass-panel p-8 text-center text-slate-500 rounded-xl border-dashed border-2 border-slate-700/50">
                <p>No tickets analyzed yet.</p>
                <p className="text-sm mt-1">Submit your first ticket using the form above.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel overflow-hidden rounded-xl border border-slate-700/50 relative">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            <th className="py-3 px-4 w-16">#</th>
                            <th className="py-3 px-4 min-w-[300px]">Message Preview</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Priority</th>
                            <th className="py-3 px-4">Urgent</th>
                            <th className="py-3 px-4">Conf.</th>
                            <th className="py-3 px-4">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30 text-sm">
                        {tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{t.id}</td>
                                <td className="py-3 px-4">
                                    <span className="text-slate-300 truncate block max-w-sm" title={t.message}>
                                        {t.message.length > 80 ? t.message.substring(0, 80) + '...' : t.message}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-xs font-medium text-slate-300">
                                        {t.category}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold font-mono ${t.priority === 'P0' ? 'text-red-400 bg-red-400/10' :
                                        t.priority === 'P1' ? 'text-orange-400 bg-orange-400/10' :
                                            t.priority === 'P2' ? 'text-yellow-400 bg-yellow-400/10' :
                                                'text-green-400 bg-green-400/10'
                                        }`}>
                                        {t.priority}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    {t.urgency ? (
                                        <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" title="Urgent"></span>
                                    ) : (
                                        <span className="inline-block w-2.5 h-2.5 bg-slate-600 rounded-full" title="Normal"></span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                                    {Math.round((t.confidence || 0) * 100)}%
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                                    {(() => {
                                        if (!t.createdAt) return 'just now';
                                        try {
                                            // Handle SQLite string or ISO string gracefully
                                            const normalizedDate = t.createdAt.includes('T') ? t.createdAt : t.createdAt.replace(' ', 'T') + 'Z';
                                            const d = new Date(normalizedDate);
                                            return isNaN(d.getTime()) ? t.createdAt : formatDistanceToNow(d, { addSuffix: true });
                                        } catch (e) {
                                            return t.createdAt;
                                        }
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
