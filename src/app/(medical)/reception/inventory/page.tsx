"use client";

import React, { useState } from "react";
import {
  Search, Plus, History, ShoppingCart, Filter, MoreVertical,
  Calendar, ArrowUpRight, Minus, RefreshCw, Box, AlertCircle,
  Clock, Package, ChevronRight, ChevronLeft, Users, Dot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";

export default function ReceptionInventoryPage() {
  const { isRTL } = useTranslation();
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isRecordUsageOpen, setIsRecordUsageOpen] = useState(false);
  const [isRestockRequestOpen, setIsRestockRequestOpen] = useState(false);
  
  // Inventory Data State
  const [inventoryItems, setInventoryItems] = useState([
    {
      id: "1",
      name: "Surgical Gloves Nitrile Medium",
      sku: "GLV-NT-M",
      category: "Consumables",
      availability: "Available",
      quantity: 320,
      unit: "Boxes",
      capacity: 80,
      status: "Safe",
      statusDate: "30 Dec 2025",
      photo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop"
    },
    {
      id: "2",
      name: "Normal Saline 0.9% 500ml",
      sku: "SLN-NT-M",
      category: "IV & Fluids",
      availability: "Available",
      quantity: 180,
      unit: "Bottles",
      capacity: 70,
      status: "Safe",
      statusDate: "30 Dec 2025",
      photo: "https://images.unsplash.com/photo-1579165466541-7483eaaad0cf?w=100&h=100&fit=crop"
    },
    {
      id: "3",
      name: "Paracetamol 500mg Tablets",
      sku: "PRC-NT-M",
      category: "Medications",
      availability: "Low",
      quantity: 24,
      unit: "boxes",
      capacity: 15,
      status: "Near Expiry",
      statusDate: "30 Dec 2025",
      photo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop"
    },
    {
      id: "4",
      name: "Rapid COVID-19 Antigen Kit",
      sku: "COV-NT-M",
      category: "Laboratory Supplies",
      availability: "Out of stock",
      quantity: 0,
      unit: "packs",
      capacity: 0,
      status: "Expired",
      statusDate: "30 Dec 2025",
      photo: "https://images.unsplash.com/photo-1614948152366-a3305a3945a0?w=100&h=100&fit=crop"
    }
  ]);

  // Activity Log State
  const [activities, setActivities] = useState([
    { type: "add", title: "10x Gauze added", subtitle: "Receptionist: Sarah Jenkins", time: "5m ago", icon: Plus, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
    { type: "use", title: "3x Gloves used", subtitle: "Dr. Aris Thorne (Room 04)", time: "20m ago", icon: Minus, iconColor: "text-rose-600", bgColor: "bg-rose-50" },
    { type: "request", title: "Restock Requested", subtitle: "Saline Solution (Bulk)", time: "2h ago", icon: RefreshCw, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
    { type: "create", title: "New SKU Created", subtitle: "Organic Cotton Swabs", time: "4h ago", icon: Box, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" }
  ]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All states");
  const [availabilityFilter, setAvailabilityFilter] = useState("All availability");
  const [categoryFilter, setCategoryFilter] = useState("All category");

  // Modal form state
  const [purchaseItem, setPurchaseItem] = useState("Saline Solution (500ml)");
  const [quantity, setQuantity] = useState(0);
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [supplier, setSupplier] = useState("");

  const estimatedTotal = quantity * costPerUnit;

  // Usage Modal form state
  const [usageItem, setUsageItem] = useState("");
  const [usageQty, setUsageQty] = useState(0);
  const [department, setDepartment] = useState("");
  const [linkedPatient, setLinkedPatient] = useState("");

  // Restock Modal form state
  const [restockItem, setRestockItem] = useState("");
  const [restockQty, setRestockQty] = useState(0);
  const [restockUnit, setRestockUnit] = useState("Boxes");
  const [restockNote, setRestockNote] = useState("");

  // Logic: Filtered Items
  const filteredItems = React.useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All states" || item.status === statusFilter;
      const matchesAvailability = availabilityFilter === "All availability" || item.availability === availabilityFilter;
      const matchesCategory = categoryFilter === "All category" || item.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesAvailability && matchesCategory;
    });
  }, [inventoryItems, searchQuery, statusFilter, availabilityFilter, categoryFilter]);

  // Logic: Summary Calculations
  const lowStockCount = inventoryItems.filter(i => i.availability === "Low" || i.availability === "Out of stock").length;
  const expiringSoonCount = inventoryItems.filter(i => i.status === "Near Expiry" || i.status === "Expired").length;

  // Logic: Actions
  const handleAddPurchase = () => {
    if (quantity <= 0) return;
    setInventoryItems(prev => prev.map(item => {
      if (item.name === purchaseItem) {
        const newQty = item.quantity + quantity;
        return { 
          ...item, 
          quantity: newQty, 
          availability: newQty > 50 ? "Available" : newQty > 0 ? "Low" : "Out of stock" 
        };
      }
      return item;
    }));
    setActivities(prev => [{
      type: "add",
      title: `${quantity}x ${purchaseItem} added`,
      subtitle: `Supplier: ${supplier || "Direct Purchase"}`,
      time: "Just now",
      icon: Plus,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }, ...prev]);
    setIsAddPurchaseOpen(false);
    setQuantity(0);
  };

  const handleRecordUsage = () => {
    if (usageQty <= 0) return;
    setInventoryItems(prev => prev.map(item => {
      if (item.name === usageItem) {
        const newQty = Math.max(0, item.quantity - usageQty);
        return { 
          ...item, 
          quantity: newQty, 
          availability: newQty > 50 ? "Available" : newQty > 0 ? "Low" : "Out of stock" 
        };
      }
      return item;
    }));
    setActivities(prev => [{
      type: "use",
      title: `${usageQty}x ${usageItem} used`,
      subtitle: `Dept: ${department} ${linkedPatient ? `(Patient: ${linkedPatient})` : ""}`,
      time: "Just now",
      icon: Minus,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50"
    }, ...prev]);
    setIsRecordUsageOpen(false);
    setUsageQty(0);
  };

  const handleRestockRequest = () => {
    setActivities(prev => [{
      type: "request",
      title: `Restock Requested: ${restockQty} ${restockUnit} of ${restockItem}`,
      subtitle: `Reason: ${restockNote.substring(0, 30)}...`,
      time: "Just now",
      icon: RefreshCw,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50"
    }, ...prev]);
    setIsRestockRequestOpen(false);
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 bg-slate-50 min-h-screen font-sans -m-4 md:-m-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
          <h1 className="text-2xl font-bold text-slate-900">{isRTL ? "لوحة تحكم المخزون" : "Inventory Dashboard"}</h1>
          <p className="text-slate-500 text-sm font-medium">
            {isRTL ? "إدارة المستلزمات الطبية، تتبع الحركات، ومراقبة مدة الصلاحية." : "Manage medical supplies, track movements, and monitor shelf life."}
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            {isRTL ? "الأثنين، 24 أكتوبر 2026" : "Monday, Oct 24th, 2026"}
          </span>
          <MoreVertical className="h-4 w-4 text-slate-400 cursor-pointer" />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className={cn("grid grid-cols-1 sm:flex sm:flex-wrap gap-4 mb-8", isRTL ? "flex-row-reverse" : "flex-row")}>
        <Button 
          onClick={() => setIsAddPurchaseOpen(true)}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center sm:justify-start gap-2 shadow-lg shadow-blue-500/10 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> {isRTL ? "إضافة شراء" : "Add Purchase"}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setIsRecordUsageOpen(true)}
          className="h-12 px-6 bg-white border-blue-100 text-blue-600 hover:bg-blue-50 rounded-xl font-bold flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"
        >
          <History className="h-4 w-4" /> {isRTL ? "تسجيل استخدام" : "Record Usage"}
        </Button>
        <Button 
          onClick={() => setIsRestockRequestOpen(true)}
          className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center sm:justify-start gap-2 shadow-lg shadow-indigo-500/10 w-full sm:w-auto"
        >
          <ShoppingCart className="h-4 w-4" /> {isRTL ? "طلب إعادة توريد" : "Request Restock"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50 relative overflow-hidden group">
          <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <div className={cn("space-y-4 w-full", isRTL ? "text-right" : "text-left")}>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "عناصر منخفضة المخزون" : "Low Stock Items"}</p>
                <h2 className="text-4xl font-black text-slate-900 mt-1">{lowStockCount}</h2>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  {isRTL ? "العناصر الحرجة التالية أقل من الحد الأدنى." : "The following critical items are below their minimum threshold."}
                </p>
              </div>
              <div className={cn("flex flex-wrap gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                {["Nitrile Gloves (M)", "Saline Solution", "Surgical Masks"].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50 relative overflow-hidden group">
          <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div className={cn("space-y-4 w-full", isRTL ? "text-right" : "text-left")}>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "تنتهي صلاحيتها قريباً" : "Expiring Soon"}</p>
                <h2 className="text-4xl font-black text-slate-900 mt-1">{expiringSoonCount}</h2>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  {isRTL ? "المستلزمات الطبية التي تقترب من تاريخ انتهاء الصلاحية خلال الـ 30 يوماً القادمة." : "Medical supplies reaching expiration within the next 30 days."}
                </p>
              </div>
              <div className={cn("flex flex-wrap gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                {["Lidocaine HCl", "Adhesive Tape", "+5 more"].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory Card */}
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 overflow-hidden mb-8">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[18px] font-bold text-slate-900">{isRTL ? "المخزون" : "Inventory"}</h3>
            <button className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-1 relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-300", isRTL ? "right-4" : "left-4")} />
              <Input 
                placeholder={isRTL ? "بحث..." : "Search...."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("h-12 bg-slate-50 border-none rounded-2xl font-bold placeholder:text-slate-300 text-sm", isRTL ? "pr-12" : "pl-12")}
              />
            </div>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 w-full px-5 bg-slate-50 border-none rounded-2xl font-bold text-sm cursor-pointer appearance-none outline-none text-slate-500 focus:ring-0"
              >
                <option>{isRTL ? "كل الحالات" : "All states"}</option>
                <option value="Safe">{isRTL ? "آمن" : "Safe"}</option>
                <option value="Near Expiry">{isRTL ? "قرب الانتهاء" : "Near Expiry"}</option>
                <option value="Expired">{isRTL ? "منتهي" : "Expired"}</option>
              </select>
              <Filter className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
            </div>
            <div className="relative">
              <select 
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="h-12 w-full px-5 bg-slate-50 border-none rounded-2xl font-bold text-sm cursor-pointer appearance-none outline-none text-slate-500 focus:ring-0"
              >
                <option>{isRTL ? "كل التوفر" : "All availability"}</option>
                <option value="Available">{isRTL ? "متوفر" : "Available"}</option>
                <option value="Low">{isRTL ? "منخفض" : "Low"}</option>
                <option value="Out of stock">{isRTL ? "نفذ" : "Out of stock"}</option>
              </select>
              <Filter className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
            </div>
            <div className="relative">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 w-full px-5 bg-slate-50 border-none rounded-2xl font-bold text-sm cursor-pointer appearance-none outline-none text-slate-500 focus:ring-0"
              >
                <option>{isRTL ? "كل الفئات" : "All category"}</option>
                <option value="Consumables">{isRTL ? "مستهلكات" : "Consumables"}</option>
                <option value="IV & Fluids">{isRTL ? "سوائل ووريدية" : "IV & Fluids"}</option>
                <option value="Medications">{isRTL ? "أدوية" : "Medications"}</option>
                <option value="Laboratory Supplies">{isRTL ? "مستلزمات مختبر" : "Laboratory Supplies"}</option>
              </select>
              <Filter className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5 w-4"><input type="checkbox" className="rounded-md border-slate-300" /></th>
                <th className="px-6 py-5">{isRTL ? "الصورة" : "PHOTO"}</th>
                <th className="px-6 py-5">{isRTL ? "العنصر" : "ITEM"}</th>
                <th className="px-6 py-5">{isRTL ? "الفئة" : "CATEGORY"}</th>
                <th className="px-6 py-5">{isRTL ? "التوفر" : "AVAILABILITY"}</th>
                <th className="px-6 py-5">{isRTL ? "الكمية بالمخزن" : "QUANTITY IN STOCK"}</th>
                <th className="px-6 py-5">{isRTL ? "الحالة" : "STATUS"}</th>
                <th className="px-6 py-5 text-center">{isRTL ? "الإجراء" : "ACTION"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6"><input type="checkbox" className="rounded-md border-slate-200" /></td>
                  <td className="px-6 py-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden shadow-sm ring-4 ring-white relative">
                      <Image src={item.photo} alt={item.name} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1 min-w-[200px]">
                      <p className="text-[14px] font-bold text-slate-900 leading-snug">{item.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU: {item.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-[13px] font-bold text-slate-600">{item.category}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-bold",
                      item.availability === "Available" ? "bg-emerald-50 text-emerald-600" :
                      item.availability === "Low" ? "bg-orange-50 text-orange-600" :
                      "bg-rose-50 text-rose-600"
                    )}>
                      {isRTL ? (item.availability === "Available" ? "متوفر" : item.availability === "Low" ? "منخفض" : "نفذ") : item.availability}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-[14px] font-black text-slate-900">{item.quantity} {item.unit}</p>
                      <p className="text-[11px] font-bold text-slate-400">{item.capacity}% of capacity</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-slate-800">{item.statusDate}</p>
                      <p className={cn(
                        "text-[11px] font-bold",
                        item.status === "Safe" ? "text-emerald-600" :
                        item.status === "Near Expiry" ? "text-orange-500" :
                        "text-rose-500"
                      )}>{isRTL ? (item.status === "Safe" ? "آمن" : item.status === "Near Expiry" ? "قرب الانتهاء" : "منتهي") : item.status}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          setPurchaseItem(item.name);
                          setIsAddPurchaseOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setUsageItem(item.name);
                          setIsRecordUsageOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setRestockItem(item.name);
                          setIsRestockRequestOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-8 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] font-bold text-slate-400">
            {isRTL ? `عرض ${filteredItems.length} من أصل ${inventoryItems.length} عنصر` : `Showing ${filteredItems.length} of ${inventoryItems.length} items`}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50">
              <ChevronLeft size={18} />
            </button>
            <button className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200">1</button>
            <button className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm hover:bg-slate-50">2</button>
            <button className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm hover:bg-slate-50">3</button>
            <button className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inventory Activities */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "أنشطة المخزون" : "Inventory Activities"}</h3>
            <button className="text-[12px] font-bold text-blue-600 hover:underline">{isRTL ? "عرض الكل" : "View All"}</button>
          </div>
          <div className="space-y-6">
            {activities.map((act, idx) => (
              <div key={idx} className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", act.bgColor)}>
                  <act.icon className={cn("h-5 w-5", act.iconColor)} />
                </div>
                <div className={cn("flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
                  <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <p className="text-[14px] font-bold text-slate-800">{act.title}</p>
                    <span className="text-[11px] font-bold text-slate-400">{act.time}</span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-400 mt-0.5">{act.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Status */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex flex-col justify-between">
           <div>
             <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                 <Package className="h-5 w-5 text-blue-600" />
               </div>
               <h3 className="text-[16px] font-bold text-slate-900">{isRTL ? "حالة التخزين" : "Storage Status"}</h3>
             </div>

             <div className="space-y-4 mb-8">
               <div className="flex items-center justify-between">
                 <span className="text-[28px] font-black text-slate-900">82%</span>
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg uppercase">{isRTL ? "مثالي" : "Optimal"}</span>
               </div>
               <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-600 rounded-full w-[82%]" />
               </div>
             </div>
           </div>

           <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
             <p className="text-[11px] font-bold text-blue-600 leading-relaxed">
               {isRTL ? "يحافظ التخزين الحالي على قدرة كافية للتسليمات الجراحية الكبيرة القادمة." : "Current storage maintains sufficient capacity for upcoming large surgical deliveries."}
             </p>
           </div>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {isAddPurchaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={cn(
              "bg-white rounded-[28px] w-full max-w-[500px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {/* Modal Header */}
            <div className={cn("p-6 border-b border-slate-50 flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <h2 className="text-[18px] font-bold text-slate-900">{isRTL ? "إضافة شراء جديد" : "Add New Purchase"}</h2>
              <button 
                onClick={() => setIsAddPurchaseOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
              >
                <Plus className="rotate-45 h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Searchable Item */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700">{isRTL ? "عنصر قابل للبحث" : "Searchable Item"}</label>
                <div className="relative">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400", isRTL ? "right-4" : "left-4")} />
                  <div className={cn(
                    "h-12 w-full bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors",
                    isRTL ? "pr-10 pl-4 flex-row-reverse" : "pl-10 pr-4"
                  )}>
                    <span className="text-[14px] font-medium text-slate-900">{purchaseItem}</span>
                    <ChevronLeft className="-rotate-90 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Quantity & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">{isRTL ? "الكمية" : "Quantity"}</label>
                  <Input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">{isRTL ? "التكلفة لكل وحدة" : "Cost per unit"}</label>
                  <div className="relative">
                    <span className={cn("absolute top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400", isRTL ? "right-4" : "left-4")}>$</span>
                    <Input 
                      type="number"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(Number(e.target.value))}
                      className={cn("h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500", isRTL ? "pr-8" : "pl-8")}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700">{isRTL ? "اسم المورد" : "Supplier name"}</label>
                <select 
                   value={supplier}
                   onChange={(e) => setSupplier(e.target.value)}
                   className={cn(
                     "h-12 w-full bg-white border border-slate-200 rounded-xl px-10 cursor-pointer hover:border-blue-200 transition-colors outline-none text-[14px] font-medium appearance-none",
                     isRTL ? "text-right" : "text-left"
                   )}
                >
                  <option value="">{isRTL ? "اختر مورداً" : "Select a supplier"}</option>
                  <option value="MedGlobal Supplies">MedGlobal Supplies</option>
                  <option value="PharmaLink Inc.">PharmaLink Inc.</option>
                  <option value="Stellar Medical">Stellar Medical</option>
                </select>
                <Package className={cn("absolute bottom-[14px] h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "right-4" : "left-4")} />
                <ChevronLeft className={cn("absolute bottom-[14px] -rotate-90 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
              </div>

              {/* Estimated Total */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
                <span className="text-[14px] font-bold text-blue-900">{isRTL ? "الإجمالي التقديري" : "Estimated Total"}</span>
                <span className="text-[24px] font-black text-blue-900">${estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={cn("p-6 bg-slate-50 flex items-center gap-3", isRTL ? "flex-row-reverse" : "justify-end")}>
              <Button 
                variant="outline" 
                onClick={() => setIsAddPurchaseOpen(false)}
                className="h-12 px-8 bg-white border-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
                onClick={handleAddPurchase}
              >
                {isRTL ? "تأكيد الشراء" : "Confirm Purchase"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Record Usage Modal */}
      {isRecordUsageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={cn(
              "bg-white rounded-[28px] w-full max-w-[500px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {/* Modal Header */}
            <div className={cn("p-6 border-b border-slate-50 flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className="space-y-1">
                <h2 className="text-[18px] font-bold text-slate-900">{isRTL ? "تسجيل استخدام المستلزمات" : "Record Supply Usage"}</h2>
                <p className="text-[12px] font-medium text-slate-400">{isRTL ? "أدخل تفاصيل استهلاك المخزون لسجلات التدقيق." : "Enter stock consumption details for audit logs."}</p>
              </div>
              <button 
                onClick={() => setIsRecordUsageOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
              >
                <Plus className="rotate-45 h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Item Selector */}
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "محدد العناصر" : "ITEM SELECTOR"}</p>
                <div className="relative">
                  <Box className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400", isRTL ? "right-4" : "left-4")} />
                  <Input 
                    placeholder={isRTL ? "بحث عن اسم العنصر أو SKU..." : "Search item name or SKU..."}
                    value={usageItem}
                    onChange={(e) => setUsageItem(e.target.value)}
                    className={cn("h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500", isRTL ? "pr-12" : "pl-12")}
                  />
                  {!isRTL && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-400">
                      CMD + K
                    </div>
                  )}
                </div>
              </div>

              {/* Qty & Dept */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "الكمية المستخدمة" : "QUANTITY USED"}</p>
                  <div className="relative">
                    <Input 
                      type="number"
                      value={usageQty}
                      onChange={(e) => setUsageQty(Number(e.target.value))}
                      className={cn("h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500", isRTL ? "pl-12" : "pr-12")}
                      placeholder="0"
                    />
                    <span className={cn("absolute top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400", isRTL ? "left-4" : "right-4")}>
                      {isRTL ? "وحدات" : "Units"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "القسم" : "DEPARTMENT"}</p>
                  <div className="relative">
                    <select 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={cn(
                        "h-12 w-full bg-white border border-slate-200 rounded-xl px-4 cursor-pointer hover:border-blue-200 transition-colors outline-none text-[14px] font-medium appearance-none",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <option value="">{isRTL ? "اختر القسم..." : "Select Dept..."}</option>
                      <option value="Emergency">{isRTL ? "الطوارئ" : "Emergency"}</option>
                      <option value="Surgical">{isRTL ? "الجراحة" : "Surgical"}</option>
                      <option value="Pediatrics">{isRTL ? "الأطفال" : "Pediatrics"}</option>
                    </select>
                    <ChevronLeft className={cn("absolute top-1/2 -translate-y-1/2 -rotate-90 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
                  </div>
                </div>
              </div>

              {/* Linked Patient */}
              <div className="space-y-2">
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "المريض المرتبط" : "LINKED PATIENT"}</p>
                  <span className="text-[11px] font-bold text-slate-300 italic">{isRTL ? "اختياري" : "Optional"}</span>
                </div>
                <div className="relative">
                  <Avatar className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5", isRTL ? "right-4" : "left-4")}>
                    <AvatarFallback className="bg-transparent text-slate-400"><Users className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <Input 
                    placeholder={isRTL ? "معرف المريض أو الاسم..." : "Patient ID or Name..."}
                    value={linkedPatient}
                    onChange={(e) => setLinkedPatient(e.target.value)}
                    className={cn("h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500", isRTL ? "pr-12" : "pl-12")}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className={cn("bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                 <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                   <AlertCircle className="h-4 w-4 text-blue-600" />
                 </div>
                 <p className={cn("text-[12px] font-medium text-blue-700 leading-relaxed", isRTL ? "text-right" : "text-left")}>
                   {isRTL 
                     ? "سيؤدي تسجيل هذا الاستخدام إلى تحديث مستويات المخزون تلقائيًا وإطلاق تنبيهات نقص المخزون لفريق المشتريات إذا تم الوصول إلى الحدود." 
                     : "Recording this usage will automatically update the inventory levels and trigger low-stock alerts for the procurement team if thresholds are met."}
                 </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={cn("p-6 border-t border-slate-50 flex items-center gap-3", isRTL ? "flex-row-reverse" : "justify-end")}>
              <Button 
                variant="ghost" 
                onClick={() => setIsRecordUsageOpen(false)}
                className="h-12 px-8 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
                onClick={handleRecordUsage}
              >
                {isRTL ? "تسجيل الاستخدام" : "Record Usage"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Restock Request Modal */}
      {isRestockRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={cn(
              "bg-white rounded-[28px] w-full max-w-[550px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {/* Modal Header */}
            <div className={cn("p-6 border-b border-slate-50 flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                   <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-[18px] font-bold text-slate-900">{isRTL ? "طلب توريد جديد" : "New Restock Request"}</h2>
              </div>
              <button 
                onClick={() => setIsRestockRequestOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
              >
                <Plus className="rotate-45 h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1">
                 <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
                   {isRTL 
                     ? "أرسل هذا الطلب إلى مدير العيادة للموافقة عليه. تأكد من أن الكميات تتماشى مع الحصص الشهرية." 
                     : "Submit this request to the clinic administrator for approval. Ensure quantities align with monthly quotas."}
                 </p>
              </div>

              {/* Banner Area */}
              <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <Image 
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=300&fit=crop" 
                  alt="Storage Room" 
                  fill
                  className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                <div className={cn("absolute bottom-4 font-black text-white text-[11px] uppercase tracking-[3px]", isRTL ? "right-5" : "left-5")}>
                  {isRTL ? "عقدة المخزون: غرفة توريد B-12" : "INVENTORY NODE: B-12 SUPPLY ROOM"}
                </div>
              </div>

              {/* Item Name */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700">{isRTL ? "اسم العنصر" : "Item Name"}</label>
                <div className="relative">
                  <Input 
                    placeholder={isRTL ? "بحث عن المستلزمات الطبية..." : "Search medical supplies..."}
                    value={restockItem}
                    onChange={(e) => setRestockItem(e.target.value)}
                    className="h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500"
                  />
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300", isRTL ? "left-4" : "right-4")} />
                </div>
              </div>

              {/* Qty & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">{isRTL ? "الكمية المطلوبة" : "Requested Quantity"}</label>
                  <Input 
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="h-12 bg-white border-slate-200 rounded-xl font-medium focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">{isRTL ? "الوحدة" : "Unit"}</label>
                  <div className="relative">
                    <select 
                      value={restockUnit}
                      onChange={(e) => setRestockUnit(e.target.value)}
                      className={cn(
                        "h-12 w-full bg-white border border-slate-200 rounded-xl px-4 cursor-pointer hover:border-blue-200 transition-colors outline-none text-[14px] font-medium appearance-none",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <option value="Boxes">{isRTL ? "صناديق" : "Boxes"}</option>
                      <option value="Packs">{isRTL ? "عبوات" : "Packs"}</option>
                      <option value="Units">{isRTL ? "وحدات" : "Units"}</option>
                    </select>
                    <ChevronLeft className={cn("absolute top-1/2 -translate-y-1/2 -rotate-90 h-4 w-4 text-slate-400 pointer-events-none", isRTL ? "left-4" : "right-4")} />
                  </div>
                </div>
              </div>

              {/* Note/Reason */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700">{isRTL ? "ملاحظة / السبب" : "Note/Reason"}</label>
                <textarea 
                  rows={4}
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder={isRTL ? "اشرح بإيجاز الحاجة لهذا التوريد (مثال: زيادة عدد المرضى، إجراء متخصص قادم)..." : "Briefly explain the need for this restock (e.g., higher patient volume, upcoming specialized procedure)..."}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-[14px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Badges Actions */}
              <div className={cn("flex flex-wrap gap-3 pt-2", isRTL && "flex-row-reverse")}>
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                  <Dot className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-[11px] font-bold text-blue-700 tracking-wide uppercase">{isRTL ? "أولوية عادية" : "Normal Priority"}</span>
                </div>
                <button className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2 text-slate-500 hover:bg-slate-100 transition-colors">
                  <Package className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">{isRTL ? "إضافة مستند" : "Add Document"}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={cn("p-6 bg-slate-50/50 border-t border-slate-50 flex items-center gap-3", isRTL ? "flex-row-reverse" : "justify-end")}>
              <Button 
                variant="ghost" 
                onClick={() => setIsRestockRequestOpen(false)}
                className="h-12 px-8 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
                onClick={handleRestockRequest}
              >
                <ArrowUpRight className="h-4 w-4" />
                {isRTL ? "إرسال الطلب" : "Send Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
