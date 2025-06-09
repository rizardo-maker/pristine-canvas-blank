
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const PostingDetails = () => {
  const { date } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Posting Details</h1>
        <p className="text-muted-foreground">
          Transaction details for {date}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transactions for {date}
          </CardTitle>
          <CardDescription>
            Detailed posting information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Posting details feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostingDetails;
