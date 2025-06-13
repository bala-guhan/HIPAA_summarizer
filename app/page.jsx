"use client";

import { PdfUpload } from "./components/pdfpload";
import Login from "./components/Login";
import { useAuth } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import Logout from "./components/logout";

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
        <div className="bg-transparent">
            <div className="bg-transparent text-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">HIPAA-Compliant Document Upload</h1>
                        </div>
                        <div className="flex items-center">
                            <Logout username={user?.username} email={user?.email} logout={logout} />
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