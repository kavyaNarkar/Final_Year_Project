import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">404</h1>
                <p className="text-2xl mt-4 font-light text-slate-300">Page Not Found</p>
                <p className="text-slate-500 mt-2 mb-8">The route you requested does not exist.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                >
                    Go Back
                </button>
            </motion.div>
        </div>
    );
};

export default NotFound;
