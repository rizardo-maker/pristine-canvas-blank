
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import AdvancedCustomerLists from '@/components/customers/AdvancedCustomerLists';
import CustomerStatsCards from '@/components/customers/CustomerStatsCards';
import { useFinance } from '@/context/FinanceContext';

const CustomerManagement = () => {
  const { customers } = useFinance();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Customer Management</h1>
      </div>
      
      <CustomerStatsCards customers={customers} />
      <AdvancedCustomerLists />
    </div>
  );
};

export default CustomerManagement;
