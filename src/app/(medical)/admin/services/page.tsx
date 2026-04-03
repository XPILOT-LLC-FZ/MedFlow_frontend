"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Clock, DollarSign, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { services } from "@/data/services";

export default function ServicesPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title={t("manageServices")}
        description={locale === "ar" ? "إدارة خدمات العيادة" : "Manage clinic services and pricing"}
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> {locale === "ar" ? "إضافة خدمة" : "Add Service"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{locale === "ar" ? "إضافة خدمة جديدة" : "Add New Service"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder={locale === "ar" ? "اسم الخدمة" : "Service Name"} />
                <Input placeholder={t("category")} />
                <Input type="number" placeholder={t("price")} />
                <Input type="number" placeholder={locale === "ar" ? "المدة (دقيقة)" : "Duration (min)"} />
                <Button className="w-full">{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc, i) => (
          <motion.div key={svc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{locale === "ar" ? svc.nameAr : svc.name}</h3>
                    <Badge variant="outline" className="mt-1 text-xs">{svc.category}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? svc.descriptionAr : svc.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {svc.price}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {svc.duration} min
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
