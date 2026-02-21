import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Car, Edit2, Save, X, Shield, CheckCircle2, LogOut, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ phoneNumber: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/user/profile');
            setProfile(response.data);
            setFormData({
                phoneNumber: response.data.phoneNumber,
                email: response.data.email
            });
        } catch (err) {
            console.error("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/api/user/profile', formData);
            setProfile({ ...profile, ...formData });
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 animate-pulse font-medium">Loading your profile...</p>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="p-6 max-w-4xl mx-auto py-20 text-center">
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 inline-block shadow-xl shadow-red-100/20">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-slate-900">Session Invalid</h2>
                <p className="text-slate-500 mb-6 max-w-xs mx-auto">Your portal session has expired or your user account was not found. Please log in again.</p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                        Retry Connection
                    </button>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Go to Login
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
                    <p className="text-slate-500">Manage your personal information and preferences</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-700 font-medium"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            </header>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                >
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {message.text}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Overview Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=0D8ABC&color=fff&size=128`} alt="Avatar" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h2>
                        <p className="text-sm text-slate-500 mb-4 capitalize">Registered Citizen</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                            <Shield className="w-3 h-3" /> Account Verified
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <Car className="w-8 h-8 text-blue-400 mb-4" />
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Assigned Vehicle</p>
                            <p className="text-2xl font-mono font-bold tracking-tight">{profile.vehicleNumber}</p>
                            <p className="text-xs text-blue-300/60 mt-4 leading-relaxed italic">
                                Note: Vehicle number changes require manual verified submission at RTO.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                    </div>
                </div>

                {/* Details Card */}
                <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Details</h3>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                                <input readOnly value={profile.firstName} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                                <input readOnly value={profile.lastName} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 outline-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    readOnly={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${isEditing ? 'bg-white border-blue-200 focus:ring-2 focus:ring-blue-100' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    name="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    readOnly={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${isEditing ? 'bg-white border-blue-200 focus:ring-2 focus:ring-blue-100' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setFormData({ email: profile.email, phoneNumber: profile.phoneNumber }); }}
                                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
