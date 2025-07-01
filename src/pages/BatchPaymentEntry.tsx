
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

const BatchPaymentEntry = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Batch Payment Entry</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bulk Payment Processing</CardTitle>
          <CardDescription>
            Process multiple payments at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Batch payment processing will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchPaymentEntry;
