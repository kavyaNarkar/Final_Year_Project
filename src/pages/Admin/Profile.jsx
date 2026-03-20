import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Phone, Edit2, Save, X, LogOut, Verified } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // We will simulate edit for UI since backend /api/admin/profile is not explicitly defined yet
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: user?.phoneNumber || '9876543210',
        email: user?.email || 'admin@example.com'
    });

    const handleSave = (e) => {
        e.preventDefault();
        // Since no real API endpoint is defined, simulate success
        setIsEditing(false);
        alert('Profile details updated successfully (Simulation).');
    };

    if (!user) return null;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Administrator Profile</h1>
                    <p className="text-slate-400">Manage your administrative credentials</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors shadow-sm text-slate-200 font-medium"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Admin Overview Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl text-center">
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-700 shadow-lg overflow-hidden relative">
                            <Shield className="absolute inset-0 m-auto text-indigo-400 opacity-20 w-16 h-16" />
                            <img src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=4f46e5&color=fff&size=128`} alt="Avatar" className="z-10" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{user.firstName} {user.lastName}</h2>
                        <p className="text-sm text-indigo-400 mb-4 capitalize font-semibold shadow-indigo-900 drop-shadow-md">System Administrator</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                            <Verified className="w-3 h-3" /> Root Access Enabled
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className="md:col-span-2 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-4 relative z-10">Administrative Details</h3>

                    <form onSubmit={handleSave} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                                <input readOnly value={user.firstName} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 outline-none cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                                <input readOnly value={user.lastName} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 outline-none cursor-not-allowed" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Secure Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    readOnly={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${isEditing ? 'bg-slate-700 border-indigo-500 text-white focus:ring-2 focus:ring-indigo-500/50' : 'bg-slate-900/50 border-slate-700 text-slate-300'}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Contact</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    name="phoneNumber"
                                    type="text"
                                    value={formData.phoneNumber}
                                    readOnly={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${isEditing ? 'bg-slate-700 border-indigo-500 text-white focus:ring-2 focus:ring-indigo-500/50' : 'bg-slate-900/50 border-slate-700 text-slate-300'}`}
                                />
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" /> Save Configuration
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setFormData({ email: user.email, phoneNumber: formData.phoneNumber }); }}
                                    className="px-6 py-3 bg-slate-700 border border-slate-600 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="pt-8 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => { logout(); navigate('/login'); }}
                                    className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" /> Terminate Session
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
