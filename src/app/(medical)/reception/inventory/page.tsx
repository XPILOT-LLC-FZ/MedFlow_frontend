"use client";

import React, { useState } from "react";
import {
  Search, Plus, History, ShoppingCart, Filter, MoreVertical,
  Calendar, ArrowUpRight, Minus, RefreshCw, Box, AlertCircle,
  Clock, Package, CheckCircle2, ChevronRight, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ReceptionInventoryPage() {
  const { t, isRTL } = useTranslation();
  const [activePage, setActivePage] = useState(1);

  const inventoryItems = [
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
  ];

  const activities = [
    { type: "add", title: "10x Gauze added", subtitle: "Receptionist: Sarah Jenkins", time: "5m ago", icon: Plus, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
    { type: "use", title: "3x Gloves used", subtitle: "Dr. Aris Thorne (Room 04)", time: "20m ago", icon: Minus, iconColor: "text-rose-600", bgColor: "bg-rose-50" },
    { type: "request", title: "Restock Requested", subtitle: "Saline Solution (Bulk)", time: "2h ago", icon: RefreshCw, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
    { type: "create", title: "New SKU Created", subtitle: "Organic Cotton Swabs", time: "4h ago", icon: Box, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" }
  ];

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
      <div className={cn("flex flex-wrap gap-4 mb-8", isRTL ? "flex-row-reverse" : "flex-row")}>
        <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/10">
          <Plus className="h-4 w-4" /> {isRTL ? "إضافة شراء" : "Add Purchase"}
        </Button>
        <Button variant="outline" className="h-12 px-6 bg-white border-blue-100 text-blue-600 hover:bg-blue-50 rounded-xl font-bold flex items-center gap-2">
          <History className="h-4 w-4" /> {isRTL ? "تسجيل استخدام" : "Record Usage"}
        </Button>
        <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/10">
          <ShoppingCart className="h-4 w-4" /> {isRTL ? "طلب إعادة توريد" : "Request Restock"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50 relative overflow-hidden group">
          <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <div className={cn("space-y-4 w-full", isRTL ? "text-right" : "text-left")}>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "عناصر منخفضة المخزون" : "Low Stock Items"}</p>
                <h2 className="text-4xl font-black text-slate-900 mt-1">12</h2>
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
                <h2 className="text-4xl font-black text-slate-900 mt-1">8</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-300" />
              <Input 
                placeholder={isRTL ? "بحث..." : "Search...."} 
                className="h-12 pl-12 bg-slate-50 border-none rounded-2xl font-bold placeholder:text-slate-300 text-sm"
              />
            </div>
            <div className="relative">
              <Input readOnly placeholder={isRTL ? "كل الحالات" : "All states"} className="h-12 px-5 bg-slate-50 border-none rounded-2xl font-bold text-sm cursor-pointer" />
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <div className="relative">
              <Input readOnly placeholder={isRTL ? "كل التوفر" : "All availability"} className="h-12 px-5 bg-slate-50 border-none rounded-2xl font-bold text-sm cursor-pointer" />
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <div className="relative">
              <Input readOnly placeholder={isRTL ? "كل الفئات" : "All category"} className="h-12 px-5 bg-slate-50 border-none rounded-2xl font-bold text-sm cursor-pointer" />
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
              {inventoryItems.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6"><input type="checkbox" className="rounded-md border-slate-200" /></td>
                  <td className="px-6 py-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden shadow-sm ring-4 ring-white">
                      <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
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
                      <button className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <Plus size={16} />
                      </button>
                      <button className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <RefreshCw size={14} />
                      </button>
                      <button className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[13px] font-bold text-slate-400">
            {isRTL ? "عرض 5 من أصل 82 عنصر" : "Showing 5 of 82 items"}
          </p>
          <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
    </div>
  );
}
