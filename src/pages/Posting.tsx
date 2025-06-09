
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const Posting = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Posting</h1>
        <p className="text-muted-foreground">
          Review and post transaction entries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transaction Posting
          </CardTitle>
          <CardDescription>
            Manage and post financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Posting feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Posting;
