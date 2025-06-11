"use client";

import { PdfUpload } from "./components/pdfpload";
import { Login } from "./components/Login";
import { useAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";

function MainContent() {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div>
            <div className="bg-black shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">HIPAA-Compliant Document Upload</h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={logout}
                                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <PdfUpload />
        </div>
    );
}

export default function Home() {
    return (
        <AuthProvider>
            <MainContent />
        </AuthProvider>
    );
}