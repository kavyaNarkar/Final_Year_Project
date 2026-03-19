import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, FileText, ArrowRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import api from '../../utils/api';
import './Dashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = React.useState({
        total: 0,
        active: 0,
        paid: 0,
        recent_activity: []
    });
    const [notification, setNotification] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/user/statistics');
                setStatsData(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching user stats:', error);
                setError("Unable to load dashboard data. Please check server connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();

        // Socket logic for real-time notifications
        const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
        
        socket.on('new_violation', (data) => {
            const userVehicle = localStorage.getItem('userVehicle');
            if (data.vehicle === userVehicle) {
                setNotification(data);
                fetchStats(); // Refresh stats when new violation arrives
            }
        });

        return () => socket.disconnect();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Your Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                    <h2 className="text-xl font-bold mb-2">Connection Error</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const stats = [
        { title: 'Total Violations', value: statsData.total, color: 'blue', icon: FileText },
        { title: 'Active Challans', value: statsData.active, color: 'red', icon: AlertTriangle },
        { title: 'Paid Challans', value: statsData.paid, color: 'emerald', icon: CheckCircle },
    ];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-header">
                <h1 className="dashboard-title">My Overview</h1>
                <p className="dashboard-subtitle">Welcome back, check your traffic compliance status.</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`stat-card ${stat.color}`}
                    >
                        <div className="stat-bg-icon">
                            <stat.icon />
                        </div>
                        <div className="stat-content">
                            <div className={`stat-icon-wrapper`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <h3 className="stat-label">{stat.title}</h3>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Real-time Notification Overlay / Card */}
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white p-4 rounded-xl shadow-2xl border-2 border-white flex items-center gap-4 max-w-md w-full"
                >
                    <div className="bg-white/20 p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold">⚠ New Traffic Violation Detected</h4>
                        <p className="text-sm">Vehicle: {notification.vehicle}</p>
                        <p className="text-sm">Violation: {notification.violation} | Fine: {notification.fine}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">✕</button>
                </motion.div>
            )}

            {/* Active Challan Alert */}
            {statsData.active > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="alert-card"
                >
                    <div className="alert-content">
                        <div className="alert-icon-circle">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="alert-text-group">
                            <h3>Pending Violation(s) Detected</h3>
                            <p>
                                You have <span className="alert-text-highlight">{statsData.active}</span> pending challan(s). 
                                Please pay immediately to avoid penalties.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/user/challans')}
                        className="pay-now-btn"
                    >
                        <CreditCard className="w-4 h-4" /> Pay Now
                    </button>
                </motion.div>
            )}

            {/* Recent History */}
            <div>
                <h2 className="recent-header">Recent Activity</h2>
                <div className="recent-list-container">
                    {statsData.recent_activity.length > 0 ? (
                        statsData.recent_activity.map((activity) => (
                            <div key={activity.id} className="recent-item">
                                <div className="recent-item-left">
                                    <div className={`recent-icon-wrapper ${activity.status === 'pending' ? 'red' : 'emerald'}`}>
                                        {activity.status === 'pending' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="recent-details">
                                        <p className="title">{activity.type}</p>
                                        <p className="meta">{activity.timestamp}</p>
                                    </div>
                                </div>
                                <div className="recent-item-right">
                                    <p className="amount">₹ {activity.amount}</p>
                                    <p className={`status ${activity.status === 'pending' ? 'pending' : 'success'}`}>
                                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-slate-400">No recent activity</p>
                    )}
                    <div className="view-all-wrapper">
                        <button onClick={() => navigate('/user/challans')} className="view-all-btn">
                            View All History <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
