import { Activity, Tag, Flag, AlertOctagon, TrendingUp, Key } from 'lucide-react';

const priorityConfig = {
    P0: { color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: AlertOctagon },
    P1: { color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: Flag },
    P2: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: Activity },
    P3: { color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: TrendingUp },
};

const categoryConfig = {
    'Billing': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    'Technical': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    'Account': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    'Feature Request': 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    'Other': 'text-slate-400 border-slate-400/30 bg-slate-400/10',
};

export default function ResultPanel({ result }) {
    const pConfig = priorityConfig[result.priority] || priorityConfig.P3;
    const cConfig = categoryConfig[result.category] || categoryConfig.Other;
    const PriorityIcon = pConfig.icon;
    const confPercent = Math.round((result.confidence || 0) * 100);
    const isSecurity = result.signals?.some(s => s.type === 'ESCALATION' || (typeof s === 'string' && s.includes('Security escalation')));

    return (
        <div className="glass-panel p-6 animate-slide-up relative overflow-hidden h-full">
            {/* Background glow based on priority */}
            <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${result.priority === 'P0' ? 'bg-red-500' :
                result.priority === 'P1' ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>

            <div className="flex items-center justify-between mb-6 z-10 relative border-b border-slate-700/50 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-cyan-400 rounded-full"></div>
                    Analysis Result
                </h2>
                <span className="text-xs font-mono text-slate-500">Ticket #{result.id || 'NEW'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 z-10 relative">

                {/* Category Badge */}
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-center items-start">
                    <span className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Category</span>
                    <div className={`badge ${cConfig} px-3 py-1 text-sm`}>
                        {result.category}
                    </div>
                </div>

                {/* Priority Badge */}
                <div className={`bg-slate-900/40 border rounded-xl p-4 flex flex-col justify-center items-start ${isSecurity ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/50'}`}>
                    <span className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider flex items-center gap-1">
                        Priority {isSecurity && <AlertOctagon className="w-3 h-3 text-red-500 animate-pulse" />}
                    </span>
                    <div className={`badge ${pConfig.color} px-3 py-1 text-sm gap-1`}>
                        <PriorityIcon className="w-3.5 h-3.5" />
                        {result.priority}
                    </div>
                </div>

                {/* Urgency Badge */}
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-center items-start">
                    <span className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Urgent</span>
                    {result.urgency ? (
                        <div className="badge text-red-300 bg-red-400/20 border-red-500/30 px-3 py-1 text-sm">Yes</div>
                    ) : (
                        <div className="badge text-slate-400 bg-slate-800 border-slate-700 px-3 py-1 text-sm">No</div>
                    )}
                </div>

                {/* Confidence Bar */}
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Confidence</span>
                        <span className="text-xs font-mono text-indigo-300">{confPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000 ease-out relative"
                            style={{ width: `${confPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 z-10 relative">
                {/* Keywords */}
                {result.keywords && result.keywords.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Detected Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {result.keywords.map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Signals */}
                {result.signals && result.signals.length > 0 && (
                    <div className="pt-2">
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" /> Heuristic Signals
                        </h4>
                        <ul className="space-y-2">
                            {result.signals.map((sig, i) => {
                                const message = sig?.message || sig;
                                const isAlert = sig?.type === 'ESCALATION' || (typeof sig === 'string' && sig.includes('Security escalation'));
                                const isWarning = sig?.type === 'WARNING';
                                return (
                                    <li key={i} className={`text-sm flex items-start gap-2 ${isAlert ? 'text-red-300 font-medium' : isWarning ? 'text-orange-300' : 'text-slate-300'}`}>
                                        <span className="mt-1 flex-shrink-0">
                                            {isAlert ? <AlertOctagon className="w-4 h-4 text-red-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5" />}
                                        </span>
                                        {message}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

        </div>
    );
}
