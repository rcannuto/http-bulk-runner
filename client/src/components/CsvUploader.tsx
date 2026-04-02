import { useRef, useState } from 'react';
import { CsvPreview } from '../types';

interface Props {
  onFileChange: (file: File | null) => void;
  onPreview: (preview: CsvPreview | null) => void;
}

export default function CsvUploader({ onFileChange, onPreview }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setError(null);
    setLoading(true);
    onFileChange(file);

    const formData = new FormData();
    formData.append('csv', file);

    try {
      const res = await fetch('/api/preview', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json() as { error: string };
        setError(body.error);
        onPreview(null);
      } else {
        const data = await res.json() as CsvPreview;
        onPreview(data);
      }
    } catch {
      setError('Falha ao enviar arquivo');
      onPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Arquivo CSV</h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : fileName ? (
          <p className="text-sm text-gray-300">
            <span className="text-green-400">✓</span> {fileName}
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Arraste um arquivo CSV ou <span className="text-blue-400 underline">clique para selecionar</span>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}
