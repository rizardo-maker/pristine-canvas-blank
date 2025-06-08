
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageTitle title="Reports" />
      
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No reports available yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
