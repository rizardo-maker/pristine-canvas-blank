
import React from 'react';
import StatCard from '@/components/ui/StatCard';
import { Customer } from '@/context/FinanceContext';
import { Users, DollarSign, TrendingUp, AlertCircle, Percent } from 'lucide-react';

interface CustomerStatsCardsProps {
  customers: Customer[];
}

const CustomerStatsCards: React.FC<CustomerStatsCardsProps> = ({ customers }) => {
  const stats = React.useMemo(() => {
    const totalCustomers = customers.length;
    const totalAmountOnCustomers = customers.reduce((sum, customer) => sum + customer.totalAmountToBePaid, 0);
    const totalAmountPaid = customers.reduce((sum, customer) => sum + customer.totalPaid, 0);
    const remainingAmount = totalAmountOnCustomers - totalAmountPaid;
    const totalInterestAmount = customers.reduce((sum, customer) => sum + (customer.interestAmount || 0), 0);

    return {
      totalCustomers,
      totalAmountOnCustomers,
      totalAmountPaid,
      remainingAmount,
      totalInterestAmount
    };
  }, [customers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      <StatCard
        title="Total Customers"
        value={stats.totalCustomers}
        icon={<Users className="h-6 w-6 text-blue-600" />}
        description="Active customer accounts"
        className="border-blue-200"
      />
      
      <StatCard
        title="Total Amount on Customers"
        value={`₹${stats.totalAmountOnCustomers.toLocaleString()}`}
        icon={<DollarSign className="h-6 w-6 text-green-600" />}
        description="Total receivable amount"
        className="border-green-200"
      />
      
      <StatCard
        title="Amount Paid by Customers"
        value={`₹${stats.totalAmountPaid.toLocaleString()}`}
        icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
        description="Total payments received"
        className="border-teal-200"
      />
      
      <StatCard
        title="Total Interest Amount"
        value={`₹${stats.totalInterestAmount.toLocaleString()}`}
        icon={<Percent className="h-6 w-6 text-purple-600" />}
        description="Total interest on all customers"
        className="border-purple-200"
      />
      
      <StatCard
        title="Remaining Amount"
        value={`₹${stats.remainingAmount.toLocaleString()}`}
        icon={<AlertCircle className="h-6 w-6 text-orange-600" />}
        description="Outstanding balance"
        className="border-orange-200"
      />
    </div>
  );
};

export default CustomerStatsCards;
