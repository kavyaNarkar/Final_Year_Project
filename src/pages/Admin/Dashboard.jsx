import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Camera, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

import './Dashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = React.useState({
        total: 0,
        today: 0,
        paid: 0,
        pending_reports: 0,
        active_cameras: 0,
        recent_violations: []
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/admin/statistics');
                setStatsData(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                setError("Unable to load dashboard data. Please check server connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Dashboard Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 max-w-md">
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
        { title: 'Total Violations', value: statsData.total.toLocaleString(), subtext: 'Since system start', icon: AlertTriangle, color: 'blue', trend: 12 },
        { title: 'Today\'s Violations', value: statsData.today.toLocaleString(), subtext: 'Updated 2 mins ago', icon: AlertTriangle, color: 'orange', trend: 5 },
        { title: 'Paid Challans', value: statsData.paid.toLocaleString(), subtext: 'Total Collection', icon: CheckCircle, color: 'emerald', trend: 8 },
        { title: 'Pending Reports', value: statsData.pending_reports.toLocaleString(), subtext: 'Action Required', icon: AlertTriangle, color: 'red', trend: 2 },
    ];

    return (
        <div className="admin-dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">System Overview</h1>
                <div className="last-updated">
                    Last updated: <span>Just now</span>
                </div>
            </div>

            {/* Stats Grid */}
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
                            <stat.icon style={{ width: '6rem', height: '6rem', transform: 'rotate(12deg)' }} />
                        </div>

                        <div className="stat-card-content">
                            <div>
                                <div className="stat-header">
                                    <div className="stat-icon-box">
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    {stat.trend && (
                                        <div className={`trend-badge ${stat.trend > 0 ? 'up' : 'down'}`}>
                                            {stat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {Math.abs(stat.trend)}%
                                        </div>
                                    )}
                                </div>
                                <h3 className="stat-title">{stat.title}</h3>
                                <p className="stat-value">{stat.value}</p>
                            </div>
                            <p className="stat-subtext">{stat.subtext}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="dashboard-main-grid">
                {/* Recent Violations */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="recent-panel"
                >
                    <div className="panel-header">
                        <h2 className="panel-title">Recent Violations</h2>
                        <button onClick={() => navigate('/admin/challans')} className="view-all-link">View All</button>
                    </div>

                    <div className="table-container">
                        <table className="violations-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Vehicle No.</th>
                                    <th>Type</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statsData.recent_violations.length > 0 ? (
                                    statsData.recent_violations.map((violation) => (
                                        <tr key={violation.id}>
                                            <td className="text-white font-medium">{violation.display_id}</td>
                                            <td className="uppercase">{violation.vehicle_number}</td>
                                            <td><span className="violation-badge">{violation.type}</span></td>
                                            <td>{violation.timestamp}</td>
                                            <td>
                                                <span className={`status-badge-sm ${violation.status === 'pending' ? 'pending' : 'processed'}`}>
                                                    {violation.status.charAt(0).toUpperCase() + violation.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-slate-400">No violations detected</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* System Health / Camera Status */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="camera-panel"
                >
                    <h2 className="panel-title" style={{ marginBottom: '1.5rem' }}>Camera Feed Status</h2>
                    <div className="camera-list">
                        {[1, 2, 3, 4, 5].map((cam) => (
                            <div key={cam} className="camera-item" onClick={() => navigate('/admin/cameras')}>
                                <div className="camera-info">
                                    <div className={`status-dot ${cam === 3 ? 'error' : 'active'}`}></div>
                                    <div>
                                        <p className="camera-name">CAM-{100 + cam}</p>
                                        <p className="camera-loc">Sector {cam}, Main Road</p>
                                    </div>
                                </div>
                                <div className="live-badge">Live</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/admin/cameras')} className="manage-cameras-btn">
                        Manage Cameras
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
