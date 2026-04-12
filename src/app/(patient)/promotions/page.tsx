"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Calendar, Copy, CheckCircle2, Search, Gift, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { promotionsService } from "@/services/promotionsService";
import type { ApiPromotion } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";

export default function PatientPromotionsPage() {
  const { t, locale } = useTranslation();
  const { success, error } = useToastStore();
  const [promotions, setPromotions] = useState<ApiPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const data = await promotionsService.getApplicable();
        setPromotions(data);
      } catch (err) {
        error("Failed to load promotions");
      } finally {
        setIsLoading(false);
      }
    };
    loadPromotions();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    success(`Code "${code}" copied to clipboard!`);
  };

  const filteredPromotions = promotions.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader 
        title={locale === "ar" ? "العروض والخصومات" : "Offers & Promotions"}
        description={locale === "ar" ? "وفر أكثر على صحتك مع عروضنا الحصرية" : "Save more on your health with our exclusive offers."}
      />

      {/* Hero Search Section */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input 
          placeholder={locale === "ar" ? "ابحث عن عرض..." : "Search for a promotion..."}
          className="pl-12 h-14 bg-background/50 backdrop-blur-sm border-2 rounded-2xl focus-visible:ring-primary shadow-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : filteredPromotions.length > 0 ? (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPromotions.map((promo) => (
            <motion.div key={promo.id} variants={item}>
              <Card className="h-full group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                
                <CardHeader className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                      <Tag className="h-6 w-6" />
                    </div>
                    <Badge variant={promo.type === "PERCENTAGE" ? "info" : "success"} className="rounded-full px-3 py-1 font-bold">
                       {promo.type === "PERCENTAGE" ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight">
                    {promo.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {promo.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <Clock className="h-3.5 w-3.5" />
                      Expires: {new Date(promo.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <div 
                    onClick={() => copyToClipboard(promo.code)}
                    className="w-full relative cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-primary/5 rounded-xl border-2 border-dashed border-primary/20 transition-all hover:bg-primary/10 hover:border-primary/40" />
                    <div className="relative flex items-center justify-between p-4 px-6 overflow-hidden">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Promo Code</span>
                        <span className="font-mono text-lg font-black tracking-tighter decoration-primary decoration-4 underline-offset-4 decoration-skip-ink-none">
                          {promo.code}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                        <Copy className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-background/50 rounded-3xl border-2 border-dashed">
          <div className="p-6 bg-muted/50 rounded-full mb-6 italic">
            <Gift className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold mb-2">No promotions found</h3>
          <p className="text-muted-foreground">Try searching for something else or check back later.</p>
        </div>
      )}
    </div>
  );
}
