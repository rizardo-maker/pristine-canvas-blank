
import React, { useState, useEffect } from 'react';
import { ref, set, onValue, push } from 'firebase/database';
import { realtimeDb } from '@/config/firebase';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FirebaseConnectionTest: React.FC = () => {
  const { firebaseUser } = useFirebaseAuth();
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
    if (!firebaseUser) {
      addTestResult('❌ No Firebase user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const testData = {
        timestamp: new Date().toISOString(),
        message: "Test write from Firebase Connection Test",
        userId: firebaseUser.uid
      };

      await set(ref(realtimeDb, `test/basicWrite/${firebaseUser.uid}`), testData);
      addTestResult('✅ Basic write successful');
      addTestResult(`ℹ️ User ID: ${firebaseUser.uid}`);
    } catch (error) {
      addTestResult(`❌ Basic write failed: ${error}`);
      console.error('Basic write error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testBasicRead = async () => {
    if (!firebaseUser) {
      addTestResult('❌ No Firebase user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const testRef = ref(realtimeDb, `test/basicWrite/${firebaseUser.uid}`);
      onValue(testRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          addTestResult('✅ Basic read successful - Data found');
          addTestResult(`ℹ️ Data: ${JSON.stringify(data, null, 2)}`);
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
    if (!firebaseUser) {
      addTestResult('❌ No Firebase user authenticated');
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
        userId: firebaseUser.uid
      };

      const customersRef = ref(realtimeDb, `users/${firebaseUser.uid}/customers`);
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, testCustomer);
      
      addTestResult('✅ User data write successful');
      addTestResult(`ℹ️ Written to: users/${firebaseUser.uid}/customers/${newCustomerRef.key}`);
      console.log('Test customer created with ID:', newCustomerRef.key);
    } catch (error) {
      addTestResult(`❌ User data write failed: ${error}`);
      console.error('User data write error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testUserDataRead = async () => {
    if (!firebaseUser) {
      addTestResult('❌ No Firebase user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const customersRef = ref(realtimeDb, `users/${firebaseUser.uid}/customers`);
      onValue(customersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const customerCount = Object.keys(data).length;
          addTestResult(`✅ User data read successful - Found ${customerCount} customers`);
          addTestResult(`ℹ️ Reading from: users/${firebaseUser.uid}/customers`);
          console.log('User customers data:', data);
        } else {
          addTestResult('⚠️ User data read successful - No customers found');
          addTestResult(`ℹ️ Reading from: users/${firebaseUser.uid}/customers`);
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

  const testMultiDeviceSync = async () => {
    if (!firebaseUser) {
      addTestResult('❌ No Firebase user authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Write sync test data
      const syncTestData = {
        deviceId: `device_${Math.random().toString(36).substring(2, 15)}`,
        timestamp: new Date().toISOString(),
        message: "Multi-device sync test",
        userId: firebaseUser.uid
      };

      await set(ref(realtimeDb, `users/${firebaseUser.uid}/syncTest`), syncTestData);
      addTestResult('✅ Multi-device sync test data written');
      addTestResult(`ℹ️ Device ID: ${syncTestData.deviceId}`);
      
      // Set up listener for real-time updates
      const syncRef = ref(realtimeDb, `users/${firebaseUser.uid}/syncTest`);
      onValue(syncRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          addTestResult(`🔄 Real-time update detected: ${data.message} from ${data.deviceId}`);
        }
      });
      
      addTestResult('ℹ️ Login with the same account on another device to test real-time sync');
    } catch (error) {
      addTestResult(`❌ Multi-device sync test failed: ${error}`);
      console.error('Multi-device sync test error:', error);
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
          Firebase Real-time Sync Test
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {firebaseUser && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm"><strong>Firebase User:</strong> {firebaseUser.email}</p>
            <p className="text-sm"><strong>User ID:</strong> {firebaseUser.uid}</p>
          </div>
        )}

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
          <Button onClick={testMultiDeviceSync} disabled={isLoading}>
            Test Multi-Device Sync
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
          <p><strong>Real-time Sync Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure you're signed in with a Firebase account</li>
            <li>Run "Test User Data Write" to create test data</li>
            <li>Run "Test Multi-Device Sync" to test real-time synchronization</li>
            <li>Login with the same account on another device/tab to see real-time updates</li>
            <li>Data is stored under users/[your-user-id]/ in Firebase Realtime Database</li>
            <li>Check the browser console for detailed logs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FirebaseConnectionTest;
