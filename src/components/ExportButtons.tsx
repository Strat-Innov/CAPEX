import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv, exportToXlsx, exportToPdf, type ExportColumn } from "@/lib/exporters";

interface ExportButtonsProps {
  filename: string;
  sheetName: string;
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

export function ExportButtons({ filename, sheetName, title, columns, rows }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => exportToCsv(filename, columns, rows)}>
        <Download size={13} /> CSV
      </Button>
      <Button size="sm" variant="outline" onClick={() => exportToXlsx(filename, sheetName, columns, rows)}>
        <Download size={13} /> XLSX
      </Button>
      <Button size="sm" variant="outline" onClick={() => exportToPdf(filename, title, columns, rows)}>
        <Download size={13} /> PDF
      </Button>
    </div>
  );
}
