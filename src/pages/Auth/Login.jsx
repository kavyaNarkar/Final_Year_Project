import React, { useState } from 'react';
import { motion } from 'framer-motion';
import bgImage from '../../assets/bg-image.png';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        
        if (!formData.identifier || !formData.password) {
            setError("Please enter your credentials");
            return;
        }

        const isEmail = emailRegex.test(formData.identifier);
        const isUsername = usernameRegex.test(formData.identifier);

        if (!isEmail && !isUsername) {
            setError("Please enter a valid email or username format");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await login(formData.identifier, formData.password);

            if (result && result.success) {
                if (result.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/user/dashboard');
                }
            } else {
                setError(result.message || 'Invalid Credentials');
            }
        } catch (err) {
            if (!err.response) {
                setError('Server Error – Backend Not Connected');
            } else {
                setError('Invalid Credentials');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-cover bg-center filter opacity-20 pointer-events-none" style={{ backgroundImage: `url(${bgImage})` }}></div>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="z-10 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-600 rounded-full shadow-lg">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
                <p className="text-slate-300 text-center mb-8">Secure Access Portal</p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Username / Email</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="text"
                                name="identifier"
                                placeholder="Enter your credential"
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-light"
                                value={formData.identifier}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-light"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-semibold text-lg hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Authenticating...
                            </>
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center space-y-2">
                    <p className="text-slate-300 text-sm">Don't have an account?</p>
                    <div className="space-x-4">
                        <button onClick={() => navigate('/signup')} className="text-blue-300 hover:text-blue-200 font-medium transition-colors text-sm">Create Account</button>
                        <span className="text-slate-500">|</span>
                        <button onClick={() => navigate('/admin-signup')} className="text-emerald-300 hover:text-emerald-200 font-medium transition-colors text-sm">Admin Access</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
