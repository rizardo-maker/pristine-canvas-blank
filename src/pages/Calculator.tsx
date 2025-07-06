import React, { useState } from 'react';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Delete, Calculator as CalculatorIcon } from 'lucide-react';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      if (isNaN(newValue) || !isFinite(newValue)) {
        toast.error('Invalid calculation');
        clear();
        return;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : NaN;
      case '%':
        return firstValue % secondValue;
      default:
        return secondValue;
    }
  };

  const performEquals = () => {
    if (operation && previousValue !== null) {
      performOperation('=');
      setOperation(null);
      setPreviousValue(null);
      setWaitingForNewValue(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const deleteLastDigit = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const formatDisplay = (value: string) => {
    // Limit decimal places for display
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // If it's a whole number, show without decimals
    if (num % 1 === 0) return num.toLocaleString();
    
    // Otherwise, show with appropriate decimal places
    return num.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 animate-fade-up">
      <PageTitle 
        title="Calculator" 
        subtitle="Perform calculations with a modern interface"
      />
      
      <div className="max-w-md mx-auto">
        <Card className="shadow-card border-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-center justify-center">
              <CalculatorIcon className="h-5 w-5" />
              Calculator
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Display */}
            <div className="relative">
              <div className="bg-muted/30 rounded-lg p-4 text-right">
                <div className="text-2xl font-mono font-semibold text-foreground min-h-[2rem] break-all">
                  {formatDisplay(display)}
                </div>
                {operation && previousValue !== null && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {previousValue.toLocaleString()} {operation}
                  </div>
                )}
              </div>
              
              <div className="absolute top-2 left-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={deleteLastDigit}
                >
                  <Delete className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 */}
              <Button
                variant="outline"
                className="h-12 text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={clear}
              >
                AC
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => performOperation('%')}
              >
                %
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={deleteLastDigit}
              >
                ⌫
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                onClick={() => performOperation('÷')}
              >
                ÷
              </Button>

              {/* Row 2 */}
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('7')}
              >
                7
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('8')}
              >
                8
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('9')}
              >
                9
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                onClick={() => performOperation('×')}
              >
                ×
              </Button>

              {/* Row 3 */}
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('4')}
              >
                4
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('5')}
              >
                5
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('6')}
              >
                6
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                onClick={() => performOperation('-')}
              >
                -
              </Button>

              {/* Row 4 */}
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('1')}
              >
                1
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('2')}
              >
                2
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('3')}
              >
                3
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                onClick={() => performOperation('+')}
              >
                +
              </Button>

              {/* Row 5 */}
              <Button
                variant="outline"
                className="h-12 col-span-2 bg-muted/20 hover:bg-muted/40"
                onClick={() => inputNumber('0')}
              >
                0
              </Button>
              <Button
                variant="outline"
                className="h-12 bg-muted/20 hover:bg-muted/40"
                onClick={inputDecimal}
              >
                .
              </Button>
              <Button
                className="h-12 bg-finance-blue hover:bg-finance-blue/90 text-white"
                onClick={performEquals}
              >
                =
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card className="shadow-card border-none mt-4">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Copy result:</span>
                <span className="font-mono">Copy button</span>
              </div>
              <div className="flex justify-between">
                <span>Delete digit:</span>
                <span className="font-mono">⌫ or Delete button</span>
              </div>
              <div className="flex justify-between">
                <span>Clear all:</span>
                <span className="font-mono">AC button</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculator;
