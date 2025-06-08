
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const MonthlyCollections: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageTitle title="Monthly Collections" description="Track monthly payment collections" />
      
      <Card>
        <CardHeader>
          <CardTitle>This Month's Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No collections recorded for this month.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCollections;
