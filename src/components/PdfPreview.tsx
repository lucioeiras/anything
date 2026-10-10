import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { FilePdfIcon } from 'phosphor-react-native';
import type { PdfProps } from 'react-native-pdf';

type PdfPreviewProps = {
  uri: string;
};

export function PdfPreview({ uri }: PdfPreviewProps) {
  const [Pdf, setPdf] = useState<ComponentType<PdfProps> | null>(null);

  useEffect(() => {
    let active = true;

    import('react-native-pdf')
      .then((module) => {
        if (active) setPdf(() => module.default);
      })
      .catch((error: unknown) => {
        console.warn('PDF preview is unavailable in this app build:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!Pdf) {
    return <FilePdfIcon size={36} color="#ef4444" weight="duotone" />;
  }

  return (
    <Pdf
      key={uri}
      source={{ uri, cache: false }}
      singlePage
      scrollEnabled={false}
      enablePaging={false}
      fitPolicy={0}
      style={{ width: 80, height: 96 }}
    />
  );
}
