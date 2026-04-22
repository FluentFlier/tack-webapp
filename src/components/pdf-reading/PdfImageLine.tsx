"use client"
//This component written by Github Copilot as a basic component to show images in the pdf reader

import React from "react";
import Image from "next/image";

type Props = {
    src: string;
    alt?: string;
};

export const PdfImageLine: React.FC<Props> = ({ src, alt = "PDF image" }) => {
    return (
        <div className="my-4 flex justify-center">
            <Image
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded border border-gray-200"
            />
        </div>
    );
};

export default PdfImageLine;
