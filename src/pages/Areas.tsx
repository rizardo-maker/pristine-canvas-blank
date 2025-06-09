
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

const Areas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Areas</h1>
        <p className="text-muted-foreground">
          Manage your service areas and regions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Service Areas
          </CardTitle>
          <CardDescription>
            Organize customers by geographical areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Areas management feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Areas;
