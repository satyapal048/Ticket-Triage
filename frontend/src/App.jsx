import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, AlertTriangle } from 'lucide-react';
import TicketForm from './components/TicketForm';
import ResultPanel from './components/ResultPanel';
import TicketTable from './components/TicketTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      const res = await fetch(`${API_URL}/tickets`);
      if (!res.ok) throw new Error('Failed to fetch ticket history');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    // Refresh the ticket list since a new ticket was processed and saved
    fetchTickets();
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <header className="flex items-center space-x-4 mb-10 pb-6 border-b border-slate-700/50">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <TicketIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              AI Ticket Triage
            </h1>
            <p className="text-slate-400 font-medium tracking-wide mt-1">Local NLP-powered support ticket classifier</p>
          </div>
        </header>

        {/* Global Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 animate-slide-up">
            <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Section */}
          <div className="lg:col-span-5 space-y-6">
            <TicketForm
              onComplete={handleAnalysisComplete}
              apiUrl={API_URL}
              onError={setError}
            />
          </div>

          {/* Result Section */}
          <div className="lg:col-span-7">
            {analysisResult ? (
              <ResultPanel result={analysisResult} />
            ) : (
              <div className="glass-panel p-10 h-full flex flex-col items-center justify-center text-center text-slate-500 border-dashed border-2 border-slate-700/50 min-h-[300px]">
                <TicketIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium text-slate-400">Awaiting Submissions</p>
                <p className="text-sm mt-2 max-w-sm mx-auto">
                  Submit a ticket using the form to see the AI classification and prioritization heuristics in action.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Table Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200">
            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
            Recent Submissions
          </h2>
          <TicketTable tickets={tickets} loading={loadingHistory} />
        </div>

      </div>
    </div>
  );
}

export default App;
