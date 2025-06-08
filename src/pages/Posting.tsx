
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const Posting: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageTitle title="Posting" description="Manage financial postings and transactions" />
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No postings available.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Posting;
