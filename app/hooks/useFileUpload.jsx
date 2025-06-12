'use client';

import { useState } from 'react';
import { encryptPDF, arrayBufferToBase64 } from '@/app/utils/encryption';

export function useFileUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file, authToken) => {
        try {
            setIsUploading(true);
            setError(null);
            setProgress(0);

            // Step 1: Encrypt the file
            setProgress(10);
            const { encryptedData, iv, key } = await encryptPDF(file);
            
            // Convert to base64 for transmission
            setProgress(30);
            const encryptedBase64 = arrayBufferToBase64(encryptedData);
            const ivBase64 = arrayBufferToBase64(iv);
            const keyBase64 = arrayBufferToBase64(await window.crypto.subtle.exportKey('raw', key));

            // Step 2: Send to backend
            setProgress(50);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    encrypted_data: encryptedBase64,
                    iv: ivBase64,
                    key: keyBase64
                })
            });

            setProgress(80);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const result = await response.json();
            setProgress(100);
            return result;

        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading,
        error,
        progress
    };
} 