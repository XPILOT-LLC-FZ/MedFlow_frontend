export interface CheckedService {
  id: string;
  name: string;
  dept: string;
  code: string;
  qty: number;
  amount: number;
  checked: boolean;
}

export function calculatePaymentTotals(services: CheckedService[], discountPercent: number) {
  const subtotal = services
    .filter((s) => s.checked)
    .reduce((sum, s) => sum + s.amount * s.qty, 0);
  
  const insuranceCoverage = Math.round(subtotal * (discountPercent / 100));
  const totalDue = subtotal - insuranceCoverage;

  return { subtotal, insuranceCoverage, totalDue };
}
