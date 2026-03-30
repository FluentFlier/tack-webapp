"use client"

import React from "react";

type Props = {
    src: string;
    alt?: string;
};

export const PdfImageLine: React.FC<Props> = ({ src, alt = "PDF image" }) => {
    return (
        <div className="my-4 flex justify-center">
            <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded border border-gray-200"
            />
        </div>
    );
};

export default PdfImageLine;
