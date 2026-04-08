"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { onboardingService, type OnboardingQuestion } from "@/services/onboardingService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, locale } = useTranslation();
  const { success, error } = useToastStore();
  
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const loadQuestions = async () => {
      try {
        const data = await onboardingService.getQuestions(user.role);
        setQuestions(data.sort((a, b) => a.order - b.order));
      } catch (err) {
        console.error("Failed to load onboarding questions", err);
        error("Failed to load onboarding");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [user, router]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isLastStep = currentIndex === questions.length - 1;
  const canSkip = user?.role !== "PATIENT"; // Patients must complete onboarding

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    const dashboardPath = user?.role === "ADMIN" ? "/admin/dashboard" : 
                          user?.role === "STAFF" ? "/reception/dashboard" : 
                          user?.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard";
    router.push(dashboardPath);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onboardingService.submitAnswers(answers);
      success("Welcome aboard!");
      handleSkip(); // Reuse skip logic for redirect
    } catch (err) {
      error("Failed to save onboarding data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAnswer = (val: unknown) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <p className="text-sm text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to MedFlow</CardTitle>
            <CardDescription>We&apos;re setting up your account. No extra information needed right now.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleSkip} className="w-full">Go to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500/10 via-background to-purple-500/10">
      <div className="w-full max-w-2xl relative">
        {/* Decorative background blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

        <Card className="relative overflow-hidden border-none shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
          <div className="h-1.5 w-full bg-muted">
             <motion.div 
               className="h-full bg-primary" 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
             />
          </div>

          <CardHeader className="pt-8 px-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Step {currentIndex + 1} of {questions.length}
              </span>
              {canSkip && (
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
                  Skip for now
                </Button>
              )}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 py-10 min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentQuestion.type === "TEXT" && (
                  <Input 
                    placeholder="Type your answer here..."
                    className="h-14 text-lg"
                    value={(answers[currentQuestion.id] as string) || ""}
                    onChange={(e) => updateAnswer(e.target.value)}
                    autoFocus
                  />
                )}

                {currentQuestion.type === "SELECT" && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => updateAnswer(option)}
                        className={`text-left p-4 rounded-xl border-2 transition-all hover:border-primary/50 flex items-center justify-between ${
                          answers[currentQuestion.id] === option 
                            ? "border-primary bg-primary/5" 
                            : "border-muted bg-background/50"
                        }`}
                      >
                        <span className="font-medium">{option}</span>
                        {answers[currentQuestion.id] === option && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "BOOLEAN" && (
                   <div className="flex gap-4">
                     <Button 
                        variant={answers[currentQuestion.id] === true ? "default" : "outline"} 
                        className="flex-1 h-14 text-lg"
                        onClick={() => updateAnswer(true)}
                     >
                        Yes
                     </Button>
                     <Button 
                        variant={answers[currentQuestion.id] === false ? "default" : "outline"} 
                        className="flex-1 h-14 text-lg"
                        onClick={() => updateAnswer(false)}
                     >
                        No
                     </Button>
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-0 flex justify-between gap-4">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={currentIndex === 0 || isSubmitting}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            
            <Button 
              onClick={handleNext} 
              disabled={isSubmitting || (currentQuestion.required && !answers[currentQuestion.id])}
              className="px-8 gap-2"
            >
              {isLastStep ? (isSubmitting ? "Completing..." : "Complete Setup") : (
                <>Next <ChevronRight className="h-4 w-4" /></>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
           <Info className="h-4 w-4" />
           <p>Your information is stored securely following medical data standards.</p>
        </div>
      </div>
    </div>
  );
}
