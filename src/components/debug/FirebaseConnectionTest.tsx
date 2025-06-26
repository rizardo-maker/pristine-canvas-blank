
import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push } from 'firebase/database';
import { realtimeDb } from '@/config/firebase';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FirebaseConnectionTest: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Monitor connection status
    const connectedRef = ref(realtimeDb, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      addTestResult(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    });

    return () => unsubscribe();
  }, []);

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testBasicWrite = async () => {
    if (!user) {
      addTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        timestamp: new Date().toISOString(),
        message: "Test write from Firebase Connection Test",
        userId: user.id
      };

      await set(ref(realtimeDb, `test/basicWrite/${user.id}`), testData);
      addTestResult('✅ Basic write successful');
    } catch (error) {
      addTestResult(`❌ Basic write failed: ${error}`);
      console.error('Basic write error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testBasicRead = async () => {
    if (!user) {
      addTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const testRef = ref(realtimeDb, `test/basicWrite/${user.id}`);
      onValue(testRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          addTestResult('✅ Basic read successful - Data found');
          console.log('Read test data:', data);
        } else {
          addTestResult('⚠️ Basic read successful - No data found');
        }
      }, (error) => {
        addTestResult(`❌ Basic read failed: ${error}`);
        console.error('Basic read error:', error);
      });
    } catch (error) {
      addTestResult(`❌ Basic read setup failed: ${error}`);
      console.error('Basic read setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserDataWrite = async () => {
    if (!user) {
      addTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const testCustomer = {
        name: "Test Customer",
        area: "Test Area",
        mobile: "1234567890",
        loanAmount: 10000,
        installmentAmount: 1000,
        collectionType: "daily" as const,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        address: "Test Address",
        guarantor: "Test Guarantor",
        guarantorMobile: "0987654321",
        totalInstallments: 10,
        paidInstallments: 0,
        balanceAmount: 10000,
        status: "active" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      };

      const customersRef = ref(realtimeDb, `users/${user.id}/customers`);
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, testCustomer);
      
      addTestResult('✅ User data write successful');
      console.log('Test customer created with ID:', newCustomerRef.key);
    } catch (error) {
      addTestResult(`❌ User data write failed: ${error}`);
      console.error('User data write error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserDataRead = async () => {
    if (!user) {
      addTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const customersRef = ref(realtimeDb, `users/${user.id}/customers`);
      onValue(customersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const customerCount = Object.keys(data).length;
          addTestResult(`✅ User data read successful - Found ${customerCount} customers`);
          console.log('User customers data:', data);
        } else {
          addTestResult('⚠️ User data read successful - No customers found');
        }
      }, (error) => {
        addTestResult(`❌ User data read failed: ${error}`);
        console.error('User data read error:', error);
      });
    } catch (error) {
      addTestResult(`❌ User data read setup failed: ${error}`);
      console.error('User data read setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Firebase Connection Test
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testBasicWrite} disabled={isLoading}>
            Test Basic Write
          </Button>
          <Button onClick={testBasicRead} disabled={isLoading}>
            Test Basic Read
          </Button>
          <Button onClick={testUserDataWrite} disabled={isLoading}>
            Test User Data Write
          </Button>
          <Button onClick={testUserDataRead} disabled={isLoading}>
            Test User Data Read
          </Button>
          <Button onClick={clearTestResults} variant="outline">
            Clear Results
          </Button>
        </div>

        <div className="border rounded-lg p-4 bg-muted max-h-96 overflow-y-auto">
          <h4 className="font-semibold mb-2">Test Results:</h4>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">No test results yet. Run a test to see results.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure you're signed in with a Firebase user</li>
            <li>Run "Test Basic Write" first to write simple test data</li>
            <li>Run "Test Basic Read" to verify you can read the test data</li>
            <li>Run "Test User Data Write" to create a test customer</li>
            <li>Run "Test User Data Read" to verify you can read user-specific data</li>
            <li>Check the browser console for detailed logs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FirebaseConnectionTest;
