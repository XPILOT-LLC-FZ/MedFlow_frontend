export interface CheckedService {
  id: string;
  name: string;
  dept: string;
  code: string;
  qty: number;
  amount: number;
  checked: boolean;
}

export function calculatePaymentTotals(
  services: CheckedService[], 
  discountPercent: number = 0,
  applyInsurance: boolean = true,
  addRate: number = 0,
  insuranceFlatAmount: number = 0,
  specialDiscount: number = 0
) {
  const subtotal = services
    .filter((s) => s.checked)
    .reduce((sum, s) => sum + s.amount * s.qty, 0);
  
  const insuranceCoverage = insuranceFlatAmount || (applyInsurance 
    ? Math.round(subtotal * (discountPercent / 100))
    : 0);
    
  const totalDue = Math.max(0, subtotal - insuranceCoverage - specialDiscount + addRate);

  return { subtotal, insuranceCoverage, totalDue, specialDiscount };
}
