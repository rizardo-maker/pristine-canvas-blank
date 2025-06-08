
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/ui/PageTitle';

const PostingDetails: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  
  return (
    <div className="space-y-6">
      <PageTitle title="Posting Details" description={`Details for ${date}`} />
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Posting details will be displayed here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostingDetails;
