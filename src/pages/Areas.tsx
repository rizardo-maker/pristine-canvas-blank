
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';

const Areas: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Areas" description="Manage service areas and regions" />
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Area
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No areas configured. Add your first service area to get started.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Areas;
