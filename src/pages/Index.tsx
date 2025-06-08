
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, PiggyBank } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
      title: "Dashboard Overview",
      description: "Get a comprehensive view of your financial collections and performance metrics."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Customer Management",
      description: "Manage your customer database with detailed profiles and payment history."
    },
    {
      icon: <PiggyBank className="h-8 w-8 text-primary" />,
      title: "Collection Tracking",
      description: "Track daily, weekly, and monthly collections with detailed reporting."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Collectify Manager
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A comprehensive financial management system for tracking collections, managing customers, and generating reports.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Start Managing Your Collections?</CardTitle>
              <CardDescription>
                Sign in to access your dashboard and start tracking your financial data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/auth')} 
                variant="outline"
                className="mr-4"
              >
                Sign In
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
