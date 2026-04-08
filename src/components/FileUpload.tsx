"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FileUploadProps {
  title: string;
  description: string;
  onFileLoaded: (content: string) => void;
  loaded: boolean;
  rowCount?: number;
}

export function FileUpload({
  title,
  description,
  onFileLoaded,
  loaded,
  rowCount,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileLoaded(text);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card
      className={`transition-all ${dragOver ? "ring-2 ring-blue-500 bg-blue-50" : ""} ${loaded ? "border-green-300 bg-green-50/50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {loaded && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {rowCount} rows
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv";
            input.onchange = (ev) => {
              const file = (ev.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
          }}
        >
          {loaded ? (
            <div>
              <p className="text-sm font-medium text-green-700">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click or drag to replace
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drop CSV file or click to browse
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
