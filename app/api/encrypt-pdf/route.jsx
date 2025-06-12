import { NextResponse } from 'next/server';
import { encryptPDF, arrayBufferToBase64, base64ToArrayBuffer } from '@/app/utils/encryption';

export async function POST(request) {
    try {
        const { file } = await request.json();
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert base64 to ArrayBuffer
        const fileBuffer = base64ToArrayBuffer(file);
        const pdfFile = new File([fileBuffer], 'document.pdf', { type: 'application/pdf' });

        // Encrypt the PDF
        const { encryptedData, iv, key } = await encryptPDF(pdfFile);

        // Convert encrypted data to base64 for transmission
        const encryptedBase64 = arrayBufferToBase64(encryptedData);
        const ivBase64 = arrayBufferToBase64(iv);
        const keyBase64 = arrayBufferToBase64(await window.crypto.subtle.exportKey('raw', key));

        return NextResponse.json({
            encryptedData: encryptedBase64,
            iv: ivBase64,
            key: keyBase64
        });
    } catch (error) {
        console.error('Encryption error:', error);
        return NextResponse.json(
            { error: 'Failed to encrypt PDF' },
            { status: 500 }
        );
    }
} 