
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate comprehensive financial reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Financial Reports
          </CardTitle>
          <CardDescription>
            View detailed analytics and generate reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reports feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
