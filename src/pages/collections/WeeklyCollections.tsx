
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const WeeklyCollections: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageTitle title="Weekly Collections" description="Track weekly payment collections" />
      
      <Card>
        <CardHeader>
          <CardTitle>This Week's Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No collections recorded for this week.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyCollections;
