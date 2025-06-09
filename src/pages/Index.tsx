
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, PiggyBank, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Line Manager
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your finance collections, track customer payments, and generate reports with ease.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 border border-input text-base font-medium rounded-md text-foreground bg-background hover:bg-accent transition-colors"
            >
              View Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
              <p className="text-muted-foreground">
                Track customer information, payment schedules, and outstanding balances.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <PiggyBank className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Collections</h3>
              <p className="text-muted-foreground">
                Manage daily, weekly, and monthly payment collections efficiently.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reports & Analytics</h3>
              <p className="text-muted-foreground">
                Generate comprehensive reports and track business performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
