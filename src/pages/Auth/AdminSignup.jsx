import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Mail, User, Lock, BadgeCheck, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const AdminSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '', username: '', email: '', password: '', phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/register-admin', formData);
            alert("Admin Registration Pending Approval! Please Login.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row-reverse"
            >
                {/* Visual Side */}
                <div className="md:w-1/3 bg-emerald-700 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="z-10">
                        <ShieldAlert className="w-12 h-12 mb-4" />
                        <h2 className="text-3xl font-bold mb-2">Admin Portal</h2>
                        <p className="text-emerald-100/80">Authorized personnel only. Secure registration.</p>
                    </div>
                    <div className="mt-8 z-10">
                        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm font-medium hover:underline opacity-80 hover:opacity-100 transition-opacity">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </button>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:w-2/3 p-8">
                    <h3 className="text-2xl font-semibold text-white mb-6">Administrator Registration</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">Full Name</label>
                            <div className="relative">
                                <BadgeCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    name="fullName"
                                    type="text"
                                    placeholder="Officer Name"
                                    className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    name="username"
                                    type="text"
                                    placeholder="admin_officer"
                                    className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onChange={handleChange} required
                                    pattern="^[a-zA-Z0-9_]{3,}$"
                                    title="Username must be at least 3 characters and only contain letters, numbers, and underscores (no spaces)."
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">Official Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="officer@dept.gov.in"
                                    className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">Mobile Number</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    name="phoneNumber"
                                    type="tel"
                                    placeholder="9876543210"
                                    className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onChange={handleChange} required
                                    pattern="[0-9]{10}"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Registering...' : 'Register as Admin'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminSignup;
