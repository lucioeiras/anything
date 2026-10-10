import { FilePdfIcon } from 'phosphor-react-native';

type PdfPreviewProps = {
  uri: string;
};

export function PdfPreview({ uri }: PdfPreviewProps) {
  // Browser-native PDF embedding is inconsistent for local file URIs.
  void uri;
  return <FilePdfIcon size={36} color="#ef4444" weight="duotone" />;
}
