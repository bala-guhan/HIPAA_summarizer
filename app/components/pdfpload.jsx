"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Helper function to parse text with bold markers
const parseBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Remove the ** markers and make the text bold
            const boldText = part.slice(2, -2);
            return <strong key={index}>{boldText}</strong>;
        }
        return part;
    });
};

// Helper function to format time
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function PdfUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [summary, setSummary] = useState('');
    const [processingTime, setProcessingTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [finalProcessingTime, setFinalProcessingTime] = useState(null);
    const { getAuthHeader } = useAuth();

    // Timer effect
    useEffect(() => {
        let timer;
        if (isProcessing) {
            timer = setInterval(() => {
                setProcessingTime(prev => prev + 1);
            }, 1000);
        } else {
            setProcessingTime(0);
        }
        return () => clearInterval(timer);
    }, [isProcessing]);

    const handleFileUpload = async (file) => {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploadStatus('processing');
            setIsProcessing(true);
            setProcessingTime(0);
            setFinalProcessingTime(null);
            
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setUploadStatus('success');
            setSummary(data);
            setIsProcessing(false);
            setFinalProcessingTime(processingTime);
            console.log('Upload successful:', data);
        } catch (error) {
            setUploadStatus('error');
            setIsProcessing(false);
            console.error('Upload error:', error);
            alert('Failed to upload file. Please try again.');
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-center text-5xl font-bold mt-70 mx-auto">
                Document Upload
            </div>
            <p className="flex items-center justify-center">
                HIPAA/PHI compliance authorized
            </p>

            <label className="cursor-pointer">
                <div 
                    className={`flex flex-col items-center justify-center w-120 h-100 mx-auto mt-10 border-2 rounded-[50px] border-dashed transition-all duration-300 hover:scale-110 transform transition duration-200 ${
                        isDragging ? 'border-blue-500 bg-gray-500' : 'border-gray-400'
                    } ${uploadStatus === 'success' ? 'border-green-500 bg-green-300' : ''} ${uploadStatus === 'error' ? 'border-red-500 bg-red-100' : ''}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                >
                    <Image 
                        src="/pdf.png"
                        alt="PDF Upload Icon"
                        width={150}
                        height={150}
                        className="opacity-100"
                    />
                    <p className="text-xl mt-10 font-bold">
                        {uploadStatus === 'processing' ? 'Processing...' : 
                         uploadStatus === 'success' ? 'Upload Successful!' :
                         uploadStatus === 'error' ? 'Upload Failed' :
                         'Drop your PDF here'}
                    </p>
                    <p className="mt-2 text-gray-500 hover:text-blue-700">
                        or Click here to select
                    </p>
                </div>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </label>

            {/* Processing Status */}
            {isProcessing && (
                <div className="mt-4 text-center">
                    <div className="inline-block px-4 py-2 bg-blue-100 rounded-lg">
                        <p className="text-blue-700 font-semibold">
                            Processing your document...
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                            Time elapsed: {formatTime(processingTime)}
                        </p>
                    </div>
                </div>
            )}

            {/* Final Processing Time */}
            {finalProcessingTime !== null && (
                <div className="mt-4 text-center">
                    <div className="inline-block px-4 py-2 bg-green-100 rounded-lg">
                        <p className="text-green-700 font-semibold">
                            Processing completed in {formatTime(finalProcessingTime)}
                        </p>
                    </div>
                </div>
            )}

            {/* Display Summary */}
            {summary && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl text-black text-center font-bold mb-4">REPORT SUMMARY</h2>
                    <div className="prose max-w-none text-black">
                        {summary.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-4">
                                {parseBoldText(paragraph)}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}