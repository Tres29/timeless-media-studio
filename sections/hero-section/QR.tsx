"use client";

import React from 'react'
import { useQRCode } from 'next-qrcode'

const QR = () => {
    const { Canvas } = useQRCode();

    return (
        <div className="flex flex-col gap-8 justify-center items-center py-16 mt-8 w-full h-fit border border-white/60 rounded-md  shadow-lg shadow-gray-500">
            <Canvas 
                text={`https://timeless.dreamplanfix.com/upload`}
                options={{
                    type:"image/jpeg",
                    quality: 0.3,
                    errorCorrectionLevel: 'M',
                    margin: 3,
                    scale: 4,
                    width: 360,
                }}
            />
            <p>Shared your photo</p>
        </div>
    );
}

export default QR;