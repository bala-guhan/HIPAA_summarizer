import { useState, useRef, useEffect } from 'react';

export default function Logout({ username, email, logout }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 focus:outline-none shadow hover:scale-105 transition-transform"
                onClick={() => setOpen((v) => !v)}
                aria-label="User menu"
            >
                {username ? username[0].toUpperCase() : '?'}
            </button>
            <div
                className={`absolute right-0 mt-2 w-56 z-50 flex flex-col items-stretch p-4 border border-gray-200 rounded-lg shadow-lg bg-white transition-all duration-200 origin-top-right
                ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                style={{ willChange: 'transform, opacity' }}
            >
                <div className="text-black font-bold text-base mb-1">{username}</div>
                <div className="font-normal text-xs text-gray-600 mb-3">{email}</div>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    onClick={logout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
