"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Package, Edit3, Trash2, AlertTriangle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useInventoryStore } from "@/stores/useInventoryStore";
import { useToastStore } from "@/stores/useToastStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "destructive"> = {
  "in-stock": "success",
  low: "warning",
  "out-of-stock": "destructive",
};

const emptyForm = { name: "", category: "", stock: "", minStock: "", unit: "", supplier: "", price: "" };

export default function InventoryPage() {
  const { t, locale } = useTranslation();
  const { items, addItem, updateItem, deleteItem, adjustStock } = useInventoryStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = ["All", ...new Set(items.map((i) => i.category))];

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const inStockCount = items.filter((i) => i.status === "in-stock").length;
  const lowCount = items.filter((i) => i.status === "low").length;
  const outCount = items.filter((i) => i.status === "out-of-stock").length;

  const toast = useToastStore();

  const handleSave = () => {
    if (!form.name || !form.category) {
      toast.error(locale === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }
    const stock = parseInt(form.stock) || 0;
    const minStock = parseInt(form.minStock) || 0;
    const price = parseFloat(form.price) || 0;

    if (editId) {
      updateItem(editId, {
        name: form.name, category: form.category, stock, minStock,
        unit: form.unit, supplier: form.supplier, price,
      });
      toast.success(locale === "ar" ? "تم تحديث العنصر" : "Item updated successfully");
    } else {
      addItem({
        name: form.name, category: form.category, stock, minStock,
        unit: form.unit || "units", supplier: form.supplier, price,
      });
      toast.success(locale === "ar" ? "تم إضافة العنصر" : "Item added successfully");
    }
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(false);
  };

  const openEdit = (item: typeof items[0]) => {
    setForm({
      name: item.name, category: item.category, stock: String(item.stock),
      minStock: String(item.minStock), unit: item.unit, supplier: item.supplier,
      price: String(item.price),
    });
    setEditId(item.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("inventoryManagement")}
        description={locale === "ar" ? "تتبع وإدارة مخزون العيادة" : "Track and manage clinic inventory"}
        action={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> {t("addItem")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? locale === "ar" ? "تعديل العنصر" : "Edit Item"
                    : t("addItem")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder={t("itemName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder={t("category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder={t("stock")} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  <Input placeholder={t("unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <Input type="number" placeholder={t("minStock")} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                <Input placeholder={t("supplier")} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                <Input type="number" placeholder={t("price")} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <Button className="w-full" onClick={handleSave}>{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title={t("inStock")} value={inStockCount} icon={<Package className="h-5 w-5" />} delay={0} />
        <StatsCard title={t("lowStock")} value={lowCount} icon={<AlertTriangle className="h-5 w-5" />} delay={0.1} />
        <StatsCard title={t("outOfStock")} value={outCount} icon={<Package className="h-5 w-5" />} delay={0.2} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={locale === "ar" ? "ابحث في المخزون..." : "Search inventory..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("itemName")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("stock")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("supplier")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustStock(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={cn("font-medium min-w-[3ch] text-center", item.stock <= item.minStock && "text-destructive")}>
                        {item.stock}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustStock(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-muted-foreground text-xs">/ {item.minStock} {item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[item.status]}>
                      {item.status === "in-stock" ? t("inStock") : item.status === "low" ? t("lowStock") : t("outOfStock")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.supplier}</TableCell>
                  <TableCell className="font-medium">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteItem(item.id); toast.success(locale === "ar" ? "تم حذف العنصر" : "Item deleted"); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
}
