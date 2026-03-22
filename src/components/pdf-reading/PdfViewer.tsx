"use client";

// note this file is from https://www.embedpdf.com/docs/react/headless/getting-started under the MIT license (2026-3-22) then modified

import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { useEffect, useMemo, useState } from 'react';

// Import the essential plugins
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';
import {
  DocumentContent,
  DocumentManagerPluginPackage,
} from '@embedpdf/plugin-document-manager/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';

type PDFViewerProps = {
  url?: string;
  file?: File;
  height?: number | string;
};

export const PDFViewer = ({ url, file, height = 500 }: PDFViewerProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      return;
    }

    const nextFileUrl = URL.createObjectURL(file);
    setFileUrl(nextFileUrl);

    return () => {
      URL.revokeObjectURL(nextFileUrl);
    };
  }, [file]);

  const documentUrl = (fileUrl ?? url ?? '').trim();

  const plugins = useMemo(
    () => [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: [{ url: documentUrl }],
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(ScrollPluginPackage),
      createPluginRegistration(RenderPluginPackage),
    ],
    [documentUrl]
  );

  // Initialize the engine with the React hook
  const { engine, isLoading } = usePdfiumEngine();

  if (isLoading || !engine) {
    return <div>Loading PDF Engine...</div>;
  }

  if (!documentUrl) {
    return <div>No PDF source provided.</div>;
  }

  // Wrap your UI with the <EmbedPDF> provider
  return (
    <div style={{ height }}>
      <EmbedPDF key={documentUrl} engine={engine} plugins={plugins}>
        {({ activeDocumentId }) =>
          activeDocumentId && (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded }) =>
                isLoaded && (
                  <Viewport
                    documentId={activeDocumentId}
                    style={{
                      backgroundColor: '#f1f3f5',
                    }}
                  >
                    <Scroller
                      documentId={activeDocumentId}
                      renderPage={({ width, height, pageIndex }) => (
                        <div style={{ width, height }}>
                          {/* The RenderLayer is responsible for drawing the page */}
                          <RenderLayer
                            documentId={activeDocumentId}
                            pageIndex={pageIndex}
                          />
                        </div>
                      )}
                    />
                  </Viewport>
                )
              }
            </DocumentContent>
          )
        }
      </EmbedPDF>
    </div>
  );
};