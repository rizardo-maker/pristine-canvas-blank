
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance, Area } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Calendar, MapPin, Users, ArrowRight, Plus, Trash2, Edit } from 'lucide-react';

const Areas = () => {
  const { areas, addArea, deleteArea, setCurrentAreaId, getAreaCustomers, getAreaPayments } = useFinance();
  const navigate = useNavigate();

  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDescription, setNewAreaDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddArea = () => {
    if (!newAreaName.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    // Add area and store the returned area object
    const newArea = addArea({
      name: newAreaName.trim(),
      description: newAreaDescription.trim() || undefined
    });
    
    setIsOpen(false);
    setNewAreaName('');
    setNewAreaDescription('');
    
    // Show success message
    toast.success(`Area "${newAreaName}" created successfully`);
    
    // Navigate to the dashboard with the new area
    if (newArea && newArea.id) {
      setCurrentAreaId(newArea.id);
      navigate('/');
    }
  };

  const handleSelectArea = (area: Area) => {
    setCurrentAreaId(area.id);
    navigate('/');
  };

  const handleDeleteArea = (id: string) => {
    deleteArea(id);
    toast.success('Area deleted successfully');
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title="Finance Areas" 
        subtitle="Manage your separate finance areas"
      >
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Finance Area</DialogTitle>
              <DialogDescription>
                Create a new finance area to organize your customers and collections.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="areaName">Area Name</Label>
                <Input 
                  id="areaName" 
                  placeholder="Enter area name" 
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  placeholder="Enter area description" 
                  value={newAreaDescription}
                  onChange={(e) => setNewAreaDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddArea}
                className="bg-finance-blue hover:bg-finance-blue/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Area
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTitle>
      
      {areas.length === 0 ? (
        <Card className="shadow-card border-none text-center">
          <CardHeader>
            <CardTitle>No Finance Areas</CardTitle>
            <CardDescription>
              Create your first finance area to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {areas.map((area) => {
            const customers = getAreaCustomers(area.id);
            const payments = getAreaPayments(area.id);
            const totalCollection = payments.reduce((sum, payment) => sum + payment.amount, 0);
            
            return (
              <Card key={area.id} className="shadow-card border-none">
                <CardHeader>
                  <CardTitle>{area.name}</CardTitle>
                  <CardDescription>
                    {area.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Created</span>
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {formatDate(area.createdAt)}
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Customers</span>
                        <Users className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {customers.length}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Collection</span>
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1 text-sm font-medium">
                      ₹{totalCollection.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t p-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Area</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the area "{area.name}"? 
                          This will not delete customers or payments, but they will no longer be associated with this area.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteArea(area.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button
                    onClick={() => handleSelectArea(area)}
                    className="bg-finance-blue hover:bg-finance-blue/90"
                  >
                    Select
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {areas.length > 0 && (
        <Card className="shadow-card border-none mt-8">
          <CardHeader>
            <CardTitle>All Finance Areas</CardTitle>
            <CardDescription>
              Overview of all your finance areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Total Collection</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area) => {
                    const customers = getAreaCustomers(area.id);
                    const payments = getAreaPayments(area.id);
                    const totalCollection = payments.reduce((sum, payment) => sum + payment.amount, 0);
                    
                    return (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell>{customers.length}</TableCell>
                        <TableCell>₹{totalCollection.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(area.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSelectArea(area)}
                              className="h-8 w-8"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Area</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the area "{area.name}"?
                                    This will not delete customers or payments, but they will no longer be associated with this area.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteArea(area.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Areas;
