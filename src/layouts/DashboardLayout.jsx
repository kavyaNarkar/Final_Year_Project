import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Camera, AlertTriangle, FileText, BarChart2, LogOut, User, LifeBuoy, CreditCard, Menu } from 'lucide-react';
import clsx from 'clsx';

import './DashboardLayout.css';

const DashboardLayout = ({ children, role }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const adminLinks = [
        { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Cameras', path: '/admin/cameras', icon: Camera },
        { name: 'Violations', path: '/admin/violations', icon: AlertTriangle },
        { name: 'Challans', path: '/admin/challans', icon: FileText },
        { name: 'Reports', path: '/admin/reports', icon: FileText },
        { name: 'Statistics', path: '/admin/stats', icon: BarChart2 },
    ];

    const userLinks = [
        { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
        { name: 'My Challans', path: '/user/challans', icon: FileText },
        { name: 'Payment History', path: '/user/payments', icon: CreditCard },
        { name: 'Profile', path: '/user/profile', icon: User },
        { name: 'Support', path: '/user/support', icon: LifeBuoy },
    ];

    const links = role === 'admin' ? adminLinks : userLinks;

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">
                        <span className="brand-initials">TS</span>
                    </div>
                    <span className="logo-text">TrafficSentinel</span>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname.startsWith(link.path);
                            return (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className={clsx(
                                            "nav-link",
                                            isActive ? "active" : "inactive"
                                        )}
                                    >
                                        <Icon className="nav-icon" />
                                        <span className="link-text">{link.name}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="user-profile-section">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <p className="user-name">{user?.name || 'User'}</p>
                            <p className="user-role">{user?.role || 'Role'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content-wrapper">
                <header className="mobile-header">
                    <div className="mobile-logo">
                        <div className="logo-icon" style={{ width: '2rem', height: '2rem' }}>
                            <span className="brand-initials-mobile">TS</span>
                        </div>
                        <span className="logo-text">Sentinel</span>
                    </div>
                    <button onClick={handleLogout} className="logout-icon-mobile"><LogOut className="w-5 h-5" /></button>
                </header>

                <main className="content-area">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
