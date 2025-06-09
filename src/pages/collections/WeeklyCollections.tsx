
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const WeeklyCollections = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Collections</h1>
        <p className="text-muted-foreground">
          Manage weekly payment collections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Collections
          </CardTitle>
          <CardDescription>
            Track and record weekly payments from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Weekly collections feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyCollections;
