
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { PaymentEntry } from '@/utils/paymentBatchProcessor';

interface PaymentEntriesTableProps {
  entries: PaymentEntry[];
  onRemoveEntry: (id: string) => void;
  isProcessing: boolean;
  isMobile: boolean;
}

const PaymentEntriesTable: React.FC<PaymentEntriesTableProps> = ({
  entries,
  onRemoveEntry,
  isProcessing,
  isMobile,
}) => {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serial #</TableHead>
            <TableHead>Customer Name</TableHead>
            {!isMobile && <TableHead>Agent</TableHead>}
            <TableHead className="text-right">Amount (₹)</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.serialNumber}</TableCell>
                <TableCell>{entry.customerName}</TableCell>
                {!isMobile && <TableCell>{entry.agentName}</TableCell>}
                <TableCell className="text-right">{entry.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveEntry(entry.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isMobile ? 4 : 5} className="text-center py-6 text-muted-foreground">
                No entries added yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentEntriesTable;
