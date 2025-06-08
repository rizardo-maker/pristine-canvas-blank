
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const DailyCollections: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageTitle title="Daily Collections" description="Track daily payment collections" />
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No collections recorded for today.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCollections;
