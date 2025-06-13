"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { jsPDF } from "jspdf";

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

// Helper function to download summary as PDF
const downloadSummaryAsPDF = (summary) => {
    const doc = new jsPDF();
    
    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(12);
    
    // Add title
    doc.setFontSize(16);
    doc.text("Document Summary", 20, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add summary text
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(summary, 170); // 170 is the max width
    doc.text(splitText, 20, 40);
    
    // Save the PDF
    doc.save("document-summary.pdf");
};

export function PdfUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('Loading...');
    const [error, setError] = useState(null);
    const [processingTime, setProcessingTime] = useState(null);
    const [phiVerification, setPhiVerification] = useState(null);
    const [summary, setSummary] = useState(null);
    const [isPhiExpanded, setIsPhiExpanded] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [processingStep, setProcessingStep] = useState('Loading...');
    const phiContentRef = useRef(null);
    const summaryContentRef = useRef(null);
    const { getAuthHeader } = useAuth();

    // Timer effect
    useEffect(() => {
        let timer;
        if (uploadStatus === 'uploading') {
            timer = setInterval(() => {
                setProcessingTime(prev => (prev === null ? 1 : prev + 1));
            }, 1000);
        } else if (uploadStatus === 'complete' || uploadStatus === 'error') {
            // Stop timer, keep the last value
            clearInterval(timer);
        } else {
            setProcessingTime(null);
        }
        return () => clearInterval(timer);
    }, [uploadStatus]);

    const handleFileUpload = async (file) => {
        if (!file) return;

        try {
            setUploadStatus('preparing');
            setError(null);
            setProcessingStep('Preparing');

            // Read file as base64
            const reader = new FileReader();
            const fileData = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(',')[1]); // Get base64 data without prefix
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            setUploadStatus('uploading');
            setProcessingStep('Uploading');

            // Get auth header
            const authHeader = getAuthHeader();
            if (!authHeader) {
                throw new Error('No authentication token found');
            }

            // Upload the file with streaming progress
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    file_data: fileData
                })
            });

            if (!response.body) {
                throw new Error('No response body');
            }

            const readerStream = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let done = false;
            let finalSummary = null;
            let finalPhi = null;
            while (!done) {
                const { value, done: streamDone } = await readerStream.read();
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    let lines = buffer.split('\n');
                    buffer = lines.pop(); // last line may be incomplete
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const data = JSON.parse(line);
                            setProcessingStep(data.progress);
                            if (data.error) {
                                setError(data.progress);
                                setUploadStatus('error');
                                done = true;
                                break;
                            }
                            if (data.done) {
                                finalSummary = data.summary;
                                finalPhi = data.phi_verification;
                                setUploadStatus('complete');
                                done = true;
                                break;
                            }
                        } catch (e) {
                            // Ignore JSON parse errors for incomplete lines
                        }
                    }
                }
                if (streamDone) break;
            }
            if (finalSummary) setSummary(finalSummary);
            if (finalPhi) setPhiVerification(finalPhi);
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message || 'Failed to upload file');
            setUploadStatus('error');
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
        <div className="w-full max-w-2xl mx-auto p-6">
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-all hover:scale-105"
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                }}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => handleFileSelect(e)}
                />
                    <div className="space-y-4 flex flex-col items-center justify-center">
                    <img className="w-1/4 h-1/4" src="/pdf.png" alt="pdf" />
                    <div className="text-xl font-semibold text-gray-700">
                        {uploadStatus === 'Loading...' && 'Drag and drop your files here or click on this to select'}
                        {uploadStatus === 'uploading' && 'Uploading...'}
                        {uploadStatus === 'complete' && 'Upload complete!'}
                        {uploadStatus === 'error' && 'Upload failed'}
                    </div>
                    {error && (
                        <div className="text-red-500 mt-2">
                            {error}
                        </div>
                    )}
                    {((uploadStatus === 'uploading' || uploadStatus === 'complete') && processingTime !== null) && (
                        <div className="text-sm text-gray-500">
                            Processing time: {processingTime} seconds
                        </div>
                    )}
                </div>
            </div>
            

            <div className="mt-6 bg-white text-black p-4 border rounded-lg text-center hover:bg-gray-50 font-bold">
                <div className="text-xl font-bold text-center flex items-center justify-center min-h-[2.5rem]">
                  {(uploadStatus === 'uploading' || uploadStatus === 'preparing') && (
                    <svg className="animate-spin h-6 w-6 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  )}
                  <span>{processingStep || 'Loading...'}</span>
                </div>
            </div>
            {/*phiVerification && (
                <div className="mt-6">
                    <div 
                        className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setIsPhiExpanded(!isPhiExpanded)}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg text-black font-semibold">
                                <span className="text-gray-500 mr-2"></span>
                                PHI Verification Results
                            </h3>
                            <span className="text-gray-500 transition-transform duration-300 ease-in-out transform">
                                {isPhiExpanded ? '▼' : '▶'}
                            </span>
                        </div>
                        <div 
                            ref={phiContentRef}
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isPhiExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="mt-4 space-y-2">
                                {Object.entries(phiVerification).map(([key, value]) => (
                                    <div key={key} className="flex items-center">
                                        <span className="w-32 text-black font-bold">{parseBoldText(key.replace('_', ' '))}:</span>
                                        <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                                            {value ? '✓ Match' : '✗ No match'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )*/}

            {summary && (
                <div className="mt-6">
                    <div 
                        className="p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg text-black font-semibold">
                                <span className="text-gray-500 mr-2"></span>
                                Document Summary
                            </h3>
                            <span className="text-gray-500 transition-transform duration-300 ease-in-out transform">
                                {isSummaryExpanded ? '▼' : '▶'}
                            </span>
                        </div>
                        <div 
                            ref={summaryContentRef}
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isSummaryExpanded ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="mt-4">
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadSummaryAsPDF(summary);
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                                    >
                                        <svg 
                                            className="w-5 h-5 mr-2" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                            />
                                        </svg>
                                        Download as PDF
                                    </button>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{parseBoldText(summary)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}