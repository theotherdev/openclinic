'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, Edit, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { InventoryService } from '@/lib/services/inventory.service';
import { useAuth } from '@/lib/hooks/use-auth';
import { Medicine } from '@/lib/types';

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [restockAmount, setRestockAmount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    stock: 0,
    threshold: 0,
    unit: '',
    expiryDate: '',
    price: 0,
    batchNo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Listen for real-time medicine updates
    const unsubscribe = InventoryService.getAllMedicines((medicines) => {
      setMedicines(medicines);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredMedicines = medicines.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.medicineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock: number, threshold: number) => {
    const percentage = (stock / threshold) * 100;
    if (percentage <= 25) return { status: "critical", color: "text-red-600", variant: "destructive" as const };
    if (percentage <= 50) return { status: "low", color: "text-orange-600", variant: "default" as const };
    if (percentage <= 100) return { status: "medium", color: "text-yellow-600", variant: "secondary" as const };
    return { status: "good", color: "text-green-600", variant: "outline" as const };
  };

  const lowStockCount = medicines.filter(item => item.stock < item.threshold).length;
  const criticalStockCount = medicines.filter(item => (item.stock / item.threshold) * 100 <= 25).length;
  const totalValue = medicines.reduce((sum, item) => sum + (item.stock * item.price), 0);

  const handleAddMedicine = async () => {
    if (!user) {
      toast.error('You must be logged in to add medicine');
      return;
    }

    setIsSubmitting(true);
    try {
      const medicineId = await InventoryService.generateMedicineId();
      await InventoryService.createMedicine({
        ...formData,
        medicineId,
        expiryDate: new Date(formData.expiryDate),
        stock: Number(formData.stock),
        threshold: Number(formData.threshold),
        price: Number(formData.price),
      });

      setIsAddMedicineOpen(false);
      setFormData({
        name: '',
        category: '',
        manufacturer: '',
        stock: 0,
        threshold: 0,
        unit: '',
        expiryDate: '',
        price: 0,
        batchNo: '',
      });
      toast.success('Medicine added successfully');
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedMedicine || !user) return;

    setIsSubmitting(true);
    try {
      await InventoryService.restockMedicine(
        selectedMedicine.id,
        selectedMedicine.medicineId,
        selectedMedicine.name,
        restockAmount,
        user.id,
        user.displayName
      );

      setIsRestockDialogOpen(false);
      setRestockAmount(0);
      toast.success(`Stock increased by ${restockAmount}`);
    } catch (error) {
      console.error('Error restocking medicine:', error);
      toast.error('Failed to restock medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
        <div className="text-center py-10">Loading medicines...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Manage medicines stock and inventory levels</p>
        </div>
        <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
              <DialogDescription>
                Enter medicine details to add to inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="medicineName">Medicine Name</Label>
                <Input
                  id="medicineName"
                  placeholder="e.g., Paracetamol 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                    <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                    <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
                    <SelectItem value="Antihistamines">Antihistamines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="Manufacturer name"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNo">Batch Number</Label>
                <Input
                  id="batchNo"
                  placeholder="BATCH2024X"
                  value={formData.batchNo}
                  onChange={(e) => setFormData({...formData, batchNo: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Initial Stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Minimum Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  placeholder="50"
                  value={formData.threshold || ''}
                  onChange={(e) => setFormData({...formData, threshold: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablets">Tablets</SelectItem>
                    <SelectItem value="Capsules">Capsules</SelectItem>
                    <SelectItem value="Bottles">Bottles</SelectItem>
                    <SelectItem value="Vials">Vials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Unit Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMedicineOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMedicine} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add to Inventory'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{medicines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique medicines in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Below threshold level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{criticalStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicines Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medicine name, ID, or category..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                <SelectItem value="Diabetes">Diabetes</SelectItem>
                <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Batch No.</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.threshold);
                  const stockPercentage = Math.min((item.stock / item.threshold) * 100, 100);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.medicineId}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{item.manufacturer}</TableCell>
                      <TableCell>
                        <div className="space-y-2 min-w-[150px]">
                          <div className="flex justify-between items-center">
                            <span className={stockStatus.color}>
                              {item.stock} {item.unit}
                            </span>
                            {item.stock < item.threshold && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                          <Progress value={stockPercentage} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            Threshold: {item.threshold} {item.unit}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.batchNo}</TableCell>
                      <TableCell>{item.expiryDate.toLocaleDateString()}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicine(item);
                              setIsRestockDialogOpen(true);
                            }}
                          >
                            Restock
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredMedicines.length} of {medicines.length} items
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Medicine</DialogTitle>
            <DialogDescription>
              Add stock for {selectedMedicine?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="restockAmount">Quantity to Add</Label>
              <Input
                id="restockAmount"
                type="number"
                placeholder="Enter quantity"
                value={restockAmount || ''}
                onChange={(e) => setRestockAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRestock} disabled={isSubmitting || restockAmount <= 0}>
              {isSubmitting ? 'Restocking...' : 'Restock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
