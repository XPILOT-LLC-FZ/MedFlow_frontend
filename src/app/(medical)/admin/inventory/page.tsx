"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Package, Edit3, Trash2, AlertTriangle, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useInventoryStore } from "@/stores/useInventoryStore";
import { useToastStore } from "@/stores/useToastStore";
import { clinicService } from "@/services/clinicService";
import { cn } from "@/lib/utils";
import type { ApiBranch, ApiInventoryItem, InventoryCategory } from "@/types";

const statusVariant: Record<ApiInventoryItem["status"], "success" | "warning" | "destructive" | "secondary"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
  EXPIRED: "secondary",
};

const inventoryCategories: InventoryCategory[] = [
  "MEDICAL_SUPPLY",
  "COSMETIC",
  "EQUIPMENT",
  "PHARMACEUTICAL",
  "CONSUMABLE",
  "OTHER",
];

const emptyForm = {
  name: "",
  category: "MEDICAL_SUPPLY" as InventoryCategory,
  quantity: "0",
  minQuantity: "5",
  unitPrice: "0",
  supplierName: "",
  expiryDate: "",
  branchId: "",
};

function getDefaultBranchId(branches: ApiBranch[]): string {
  return branches.find((branch) => branch.isMain)?.id || branches[0]?.id || "";
}

export default function InventoryPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const {
    items,
    lowStockItems,
    isLoading,
    fetchItems,
    fetchLowStock,
    createItem,
    updateItem,
    deleteItem,
    createRestockRequest,
  } = useInventoryStore();
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadBranches = useCallback(async (): Promise<ApiBranch[]> => {
    setIsLoadingBranches(true);
    try {
      const data = await clinicService.getBranches();
      setBranches(data);
      return data;
    } catch {
      setBranches([]);
      return [];
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    const results = await Promise.all([
      fetchItems(),
      fetchLowStock(),
      loadBranches(),
    ]);

    const loadedBranches = results[2];
    if (loadedBranches.length > 0) {
      setForm((prev) => {
        if (prev.branchId) return prev;
        return { ...prev, branchId: getDefaultBranchId(loadedBranches) };
      });
    }
  }, [fetchItems, fetchLowStock, loadBranches]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const categories = [
    "All",
    ...new Set([...inventoryCategories, ...items.map((i) => i.category)]),
  ];

  const filtered = items.filter((item) => {
    const supplier = item.supplierName || "";
    const matchSearch =
      !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const inStockCount = items.filter((i) => i.status === "IN_STOCK").length;
  const lowCount = items.filter((i) => i.status === "LOW_STOCK").length;
  const outCount = items.filter((i) => i.status === "OUT_OF_STOCK").length;

  const toast = useToastStore();

  const handleOpenCreateDialog = async () => {
    const loadedBranches = await loadBranches();
    setEditId(null);
    setForm({
      ...emptyForm,
      branchId: getDefaultBranchId(loadedBranches),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) {
      toast.error(locale === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }

    if (!form.branchId) {
      if (branches.length === 0) {
        toast.error(
          locale === "ar"
            ? "لا توجد فروع متاحة. أضف فرعاً أولاً من صفحة العيادة."
            : "No branches available. Create a branch first from the Clinic page."
        );
      } else {
        toast.error(locale === "ar" ? "يرجى اختيار الفرع" : "Please select a branch");
      }
      return;
    }

    const quantity = parseInt(form.quantity) || 0;
    const minQuantity = parseInt(form.minQuantity) || 0;
    const unitPrice = parseFloat(form.unitPrice) || 0;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity,
      minQuantity,
      unitPrice,
      supplierName: form.supplierName.trim() || undefined,
      expiryDate: form.expiryDate || undefined,
      branchId: form.branchId,
    };

    try {
      if (editId) {
        await updateItem(editId, payload);
        toast.success(locale === "ar" ? "تم تحديث العنصر" : "Item updated successfully");
      } else {
        await createItem(payload);
        toast.success(locale === "ar" ? "تم إضافة العنصر" : "Item added successfully");
      }

      setForm(emptyForm);
      setEditId(null);
      setDialogOpen(false);
      await fetchLowStock();
    } catch {
      toast.error(locale === "ar" ? "فشل حفظ العنصر" : "Failed to save item");
    }
  };

  const openEdit = async (item: ApiInventoryItem) => {
    const loadedBranches = await loadBranches();
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
      unitPrice: String(item.unitPrice),
      supplierName: item.supplierName || "",
      expiryDate: item.expiryDate || "",
      branchId: item.branchId || getDefaultBranchId(loadedBranches),
    });
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success(locale === "ar" ? "تم حذف العنصر" : "Item deleted");
      await fetchLowStock();
    } catch {
      toast.error(locale === "ar" ? "فشل حذف العنصر" : "Failed to delete item");
    }
  };

  const handleRequestRestock = async (item: ApiInventoryItem) => {
    if (item.quantity > item.minQuantity) {
      toast.info(
        locale === "ar"
          ? "العنصر أعلى من الحد الأدنى، لا حاجة لطلب توريد الآن"
          : "Item is above minimum stock, no restock needed now",
      );
      return;
    }

    const baseNeed = Math.max(item.minQuantity - item.quantity, 1);
    const targetNeed = Math.max(item.minQuantity * 2 - item.quantity, baseNeed);
    const packSize = item.category === "EQUIPMENT" ? 1 : 5;
    const requestedQuantity = Math.ceil(targetNeed / packSize) * packSize;
    const estimatedTotal = requestedQuantity * item.unitPrice;

    const confirmed = window.confirm(
      locale === "ar"
        ? `كمية مقترحة للتوريد: ${requestedQuantity}\nالتكلفة التقديرية: $${estimatedTotal.toFixed(2)}\nهل تريد إنشاء طلب التوريد؟`
        : `Suggested restock quantity: ${requestedQuantity}\nEstimated cost: $${estimatedTotal.toFixed(2)}\nCreate restock request?`,
    );

    if (!confirmed) return;

    try {
      await createRestockRequest(item.id, {
        requestedQuantity,
        supplierName: item.supplierName || undefined,
      });
      toast.success(locale === "ar" ? "تم إرسال طلب إعادة التوريد" : "Restock request submitted");
    } catch {
      toast.error(locale === "ar" ? "فشل إرسال طلب التوريد" : "Failed to submit restock request");
    }
  };

  const getStatusLabel = (status: ApiInventoryItem["status"]) => {
    if (status === "IN_STOCK") return t("inStock");
    if (status === "LOW_STOCK") return t("lowStock");
    if (status === "OUT_OF_STOCK") return t("outOfStock");
    return locale === "ar" ? "منتهي الصلاحية" : "Expired";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("inventoryManagement")}
        description={locale === "ar" ? "تتبع وإدارة مخزون العيادة" : "Track and manage clinic inventory"}
        action={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setEditId(null); } }}>
            <Button className="gap-2" onClick={() => void handleOpenCreateDialog()}>
              <Plus className="h-4 w-4" /> {t("addItem")}
            </Button>
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
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  {inventoryCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  disabled={isLoadingBranches || branches.length === 0}
                >
                  <option value="">
                    {isLoadingBranches
                      ? (locale === "ar" ? "جارٍ تحميل الفروع..." : "Loading branches...")
                      : branches.length === 0
                        ? (locale === "ar" ? "لا توجد فروع" : "No branches available")
                        : "Select branch"}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                {branches.length === 0 && !isLoadingBranches && (
                  <div className="rounded-md border border-amber-300/60 bg-amber-50/60 p-2 text-xs text-amber-800 space-y-2">
                    <p>
                      {locale === "ar"
                        ? "لإنشاء عنصر مخزون، أضف فرعاً أولاً من صفحة العيادة."
                        : "To create an inventory item, add a branch first from the Clinic page."}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => void loadBranches()}>
                        {locale === "ar" ? "تحديث" : "Refresh"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setDialogOpen(false);
                          router.push("/admin/clinic");
                        }}
                      >
                        {locale === "ar" ? "الذهاب إلى العيادة" : "Go to Clinic"}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder={t("stock")} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  <Input type="number" placeholder={t("minStock")} value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
                </div>
                <Input placeholder={t("supplier")} value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                <Input type="number" placeholder={t("price")} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                <Input type="date" placeholder="Expiry date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                <Button className="w-full" onClick={handleSave} disabled={isLoadingBranches || (!form.branchId && branches.length === 0)}>
                  {t("save")}
                </Button>
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
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium min-w-[3ch] text-center", item.quantity <= item.minQuantity && "text-destructive")}>
                        {item.quantity}
                      </span>
                      <span className="text-muted-foreground text-xs">/ {item.minQuantity}</span>
                      {item.quantity <= item.minQuantity && (
                        <Badge variant="warning" className="text-[10px]">
                          {locale === "ar" ? "توريد مقترح" : "Restock suggested"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[item.status]}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{item.supplierName || "-"}</TableCell>
                  <TableCell className="font-medium">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
                      {(item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-600"
                          onClick={() => void handleRequestRestock(item)}
                          title={locale === "ar" ? "طلب توريد ذكي" : "Smart restock request"}
                        >
                          <Truck className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void openEdit(item)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => void handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "Loading inventory..." : t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {lowStockItems.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {locale === "ar"
            ? `عدد العناصر منخفضة المخزون: ${lowStockItems.length}`
            : `Low-stock alerts: ${lowStockItems.length}`}
        </p>
      )}
    </div>
  );
}
