import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle, Camera, Users, ChevronRight, Activity } from 'lucide-react';
import api from '../../utils/api';

import './Statistics.css';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/admin/statistics');
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-spinner"></div>
                <p className="loading-text">Aggregating system data...</p>
            </div>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="stat-card group"
        >
            <div className="stat-card-bg-icon">
                <Icon className={`bg-icon-svg ${color}`} />
            </div>
            <div className="stat-content">
                <div>
                    <div className={`stat-icon-wrapper ${color}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="stat-title">{title}</h3>
                    <p className="stat-value">{value}</p>
                </div>
                <p className="stat-subtext">{subtext}</p>
            </div>
        </motion.div>
    );

    return (
        <div className="admin-statistics-container">
            <header className="statistics-header">
                <div className="header-title-group">
                    <h1>System Analytics</h1>
                    <p>Real-time monitoring and violation trends</p>
                </div>
                <button className="date-range-btn">
                    Last 30 Days <ChevronRight className="w-4 h-4" />
                </button>
            </header>

            {/* Top Grid */}
            <div className="stats-grid">
                <StatCard title="Total Violations" value={stats.total} icon={AlertTriangle} color="blue" subtext="Cumulative System Feed" />
                <StatCard title="Today's Active" value={stats.today} icon={TrendingUp} color="orange" subtext="Live session count" />
                <StatCard title="Revenue Collected" value={`₹${stats.paid * 500}+`} icon={CheckCircle} color="emerald" subtext="Confirmed Transactions" />
                <StatCard title="Network Health" value={`${stats.active_cameras}/6`} icon={Camera} color="indigo" subtext="Online Optical Nodes" />
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                {/* Daily Trend Line Chart (Simulated with SVG for premium feel without heavy d3) */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <h3>Violation Velocity</h3>
                            <p>Daily violation count for current week</p>
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item"><div className="legend-dot"></div><span className="legend-text">Trend</span></div>
                        </div>
                    </div>

                    <div className="bar-chart-container">
                        {stats.daily_violations.map((day, idx) => {
                            const height = Math.max((day.count / (stats.total || 1)) * 100, 10);
                            return (
                                <div key={idx} className="bar-group">
                                    <div className="bar-wrapper">
                                        <div className="bar-tooltip">
                                            {day.count}
                                        </div>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            className="bar"
                                        />
                                    </div>
                                    <span className="bar-label">{day.date}</span>
                                </div>
                            )
                        })}
                        {/* Static baseline */}
                        <div className="chart-baseline"></div>
                    </div>
                </div>

                {/* Status Breakdown Bar Chart */}
                <div className="chart-card">
                    <h3 className="text-lg font-bold text-white mb-8">Payment Status</h3>

                    <div className="progress-group">
                        <div className="progress-item">
                            <div className="progress-label">
                                <span className="label-left"><CheckCircle className="w-3 h-3 text-emerald-500" /> Paid</span>
                                <span className="label-right">{((stats.paid / (stats.total || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="progress-track">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats.paid / (stats.total || 1)) * 100}%` }}
                                    className="progress-bar emerald"
                                />
                            </div>
                        </div>

                        <div className="progress-item">
                            <div className="progress-label">
                                <span className="label-left"><AlertTriangle className="w-3 h-3 text-amber-500" /> Unpaid</span>
                                <span className="label-right">{((stats.unpaid / (stats.total || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="progress-track">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats.unpaid / (stats.total || 1)) * 100}%` }}
                                    className="progress-bar amber"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="status-footer">
                        <span>Success Rate</span>
                        <span className="footer-value">{((stats.paid / (stats.total || 1)) * 100).toFixed(0)}% OPTIMAL</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Vehicle Types */}
            <div className="vehicle-types-card group">
                <div className="section-header">
                    <div className="header-icon-box"><Activity className="w-5 h-5 text-indigo-400" /></div>
                    <h3 className="text-lg font-bold text-white">Violations by Vehicle Category</h3>
                </div>

                <div className="vehicle-stats-grid">
                    {stats.vehicle_type_stats && stats.vehicle_type_stats.length > 0 ? stats.vehicle_type_stats.map((item, idx) => (
                        <div key={idx} className="vehicle-stat-item">
                            <p className="vehicle-type-label">{item.type || item[0]}</p>
                            <p className="vehicle-count">{item.count || item[1]}</p>
                            <div className="vehicle-progress-track">
                                <div className="vehicle-progress-bar" style={{ width: `${((item.count || item[1]) / (stats.total || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    )) : (
                        <p className="no-data">No vehicle categorization data available yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistics;
