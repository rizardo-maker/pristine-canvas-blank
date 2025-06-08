
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="space-y-6">
      <PageTitle title={`Customer Details`} description={`Customer ID: ${id}`} />
      
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Customer details will be displayed here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
