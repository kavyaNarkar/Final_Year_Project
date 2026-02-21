import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageSquare, Send, Calendar, Clock, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ subject: '', description: '', challan_id: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ticketsRes, challansRes] = await Promise.all([
                api.get('/api/user/support'),
                api.get('/api/user/challans')
            ]);
            setTickets(ticketsRes.data);
            setChallans(challansRes.data);
        } catch (err) {
            console.error("Failed to fetch support data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/user/support', formData);
            setMessage({ type: 'success', text: 'Support request submitted successfully!' });
            setFormData({ subject: '', description: '', challan_id: '' });
            fetchData();
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to submit request.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Support & Feedback</h1>
                <p className="text-slate-500">Need help with a challan? Raise a ticket and we'll get back to you.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" /> New Support Ticket
                        </h3>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                            >
                                {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {message.text}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Related Challan (Optional)</label>
                                <div className="relative">
                                    <select
                                        value={formData.challan_id}
                                        onChange={(e) => setFormData({ ...formData, challan_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                                    >
                                        <option value="">General Support</option>
                                        {challans.map(c => (
                                            <option key={c.id} value={c.id}>Challan #{c.id} - {c.type}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Subject</label>
                                <input
                                    required
                                    placeholder="Brief summary of your issue"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Detailed Description</label>
                                <textarea
                                    required
                                    placeholder="Explain your problem in detail..."
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Ticket</>}
                            </button>
                        </form>
                    </div>

                    <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 rounded-3xl text-white">
                        <HelpCircle className="w-8 h-8 mb-4 text-blue-300" />
                        <h4 className="font-bold text-lg mb-2">Need Immediate Help?</h4>
                        <p className="text-blue-100 text-sm leading-relaxed mb-4">
                            Check our FAQ section for instant answers to common questions about traffic rules and payments.
                        </p>
                        <button className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                            Browse Help Center
                        </button>
                    </div>
                </div>

                {/* History Section */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                            Your Recent Tickets
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p>You haven't raised any support tickets yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map((t, idx) => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{t.subject}</h4>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{t.description}</p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t.date}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Ticket #{t.id}</span>
                                            {t.challan_id && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded italic">Ref: Challan #{t.challan_id}</span>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
