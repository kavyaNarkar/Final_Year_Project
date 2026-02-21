import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ title }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const pageTitle = title || location.pathname.split('/').pop().replace(/-/g, ' ');

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-6 bg-slate-800 rounded-full mb-6 relative">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                <Construction className="w-16 h-16 text-blue-400 relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 capitalize">{pageTitle}</h1>
            <p className="text-slate-400 max-w-md mb-8">
                This module is currently under development for Stage 2 & 3 integration. check back later.
            </p>
            <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );
};

export default PlaceholderPage;
