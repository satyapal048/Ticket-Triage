import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const MAX_CHARS = 2000;

export default function TicketForm({ onComplete, apiUrl, onError }) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const charCount = message.length;
    const isOverLimit = charCount > MAX_CHARS;
    const isEmpty = charCount === 0 || !message.trim();
    const submitDisabled = isEmpty || isOverLimit || isSubmitting;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitDisabled) return;

        setIsSubmitting(true);
        onError(null);

        try {
            const res = await fetch(`${apiUrl}/tickets/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to analyze ticket');
            }

            onComplete(data);
            setMessage(''); // clear form on success
        } catch (err) {
            onError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-panel p-6 flex flex-col h-full animate-fade-in relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mb-6 z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-400 rounded-full"></div>
                    Submit New Ticket
                </h2>
                <p className="text-sm text-slate-400 mt-1">Describe your issue or request below for automatic AI triage.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col z-10">
                <div className="relative flex-1 min-h-[160px]">
                    <textarea
                        className="w-full h-full p-4 bg-slate-900/50 border border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm placeholder-slate-500"
                        placeholder="Describe your issue in detail..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className={`text-xs font-medium px-2 py-1 rounded-md ${isOverLimit ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-slate-800'}`}>
                        {charCount}/{MAX_CHARS}
                    </div>

                    <button
                        type="submit"
                        disabled={submitDisabled}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>

                        <span className="relative z-10 flex items-center gap-2">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    Submit Ticket
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}
