import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CarFront, Mail, Phone, Lock, Hash, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', vehicleNumber: '', phoneNumber: '', password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1 = form, 2 = otp
    const [otp, setOtp] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/register-user', formData);
            setStep(2); // Go to OTP verification step
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/verify-registration-otp', {
                email: formData.email,
                otp: otp
            });
            alert("Registration successful! Please login.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            await api.post('/api/auth/register-user', formData);
            alert("OTP has been resent to your email.");
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to resend OTP.");
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
                className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Visual Side */}
                <div className="md:w-1/3 bg-blue-600 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="z-10">
                        <UserPlus className="w-12 h-12 mb-4" />
                        <h2 className="text-3xl font-bold mb-2">Join Us</h2>
                        <p className="text-blue-100/80">Monitor your traffic history and stay compliant.</p>
                    </div>
                    <div className="mt-8 z-10">
                        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm font-medium hover:underline opacity-80 hover:opacity-100 transition-opacity">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </button>
                    </div>
                    {/* Abstract Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                </div>

                {/* Form Side */}
                <div className="md:w-2/3 p-8">
                    <h3 className="text-2xl font-semibold text-white mb-6">User Registration</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form key="form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">First Name</label>
                                    <input
                                        name="firstName" type="text" placeholder="John"
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        onChange={handleChange} required value={formData.firstName}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Last Name</label>
                                    <input
                                        name="lastName" type="text" placeholder="Doe"
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        onChange={handleChange} required value={formData.lastName}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-slate-400 font-medium">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            name="email" type="email" placeholder="john@example.com"
                                            className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            onChange={handleChange} required value={formData.email}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Vehicle Number</label>
                                    <div className="relative">
                                        <CarFront className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            name="vehicleNumber" type="text" placeholder="MH12AB1234"
                                            className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                            onChange={handleChange} required value={formData.vehicleNumber}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            name="phoneNumber" type="tel" placeholder="9876543210"
                                            className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            onChange={handleChange} required value={formData.phoneNumber}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-slate-400 font-medium">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            name="password" type="password" placeholder="••••••••"
                                            className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            onChange={handleChange} required value={formData.password}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 mt-4">
                                    <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {loading ? 'Initiating Registration...' : 'Register Account'}
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form key="otp" onSubmit={handleVerifyOtp} className="flex flex-col gap-4"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <p className="text-slate-300 text-sm mb-2">
                                    Enter OTP sent to your email <strong>{formData.email}</strong>
                                </p>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">6-Digit OTP</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text" maxLength={6} placeholder="123456"
                                            className="w-full pl-9 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-center"
                                            onChange={(e) => { setOtp(e.target.value); setError(null); }} required value={otp}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <button type="submit" disabled={loading || otp.length < 6} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Verify Email
                                    </button>
                                    <button type="button" onClick={handleResendOtp} disabled={loading} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors">
                                        Resend OTP
                                    </button>
                                    <button type="button" onClick={() => setStep(1)} disabled={loading} className="w-full py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-medium rounded-lg transition-colors text-sm underline">
                                        Change Email
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
