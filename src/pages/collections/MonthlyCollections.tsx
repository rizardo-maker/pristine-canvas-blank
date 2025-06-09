
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const MonthlyCollections = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monthly Collections</h1>
        <p className="text-muted-foreground">
          Manage monthly payment collections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Month's Collections
          </CardTitle>
          <CardDescription>
            Track and record monthly payments from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Monthly collections feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCollections;
