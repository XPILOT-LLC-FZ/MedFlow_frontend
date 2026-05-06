import { calculatePaymentTotals } from './utils';

describe('calculatePaymentTotals', () => {
  const mockServices = [
    { id: '1', name: 'Consultation', dept: 'General', code: '101', qty: 1, amount: 100, checked: true },
    { id: '2', name: 'Blood Test', dept: 'Lab', code: '201', qty: 2, amount: 50, checked: true },
    { id: '3', name: 'X-Ray', dept: 'Radiology', code: '301', qty: 1, amount: 150, checked: false },
  ];

  it('calculates totals correctly without insurance', () => {
    const { subtotal, insuranceCoverage, totalDue } = calculatePaymentTotals(mockServices, 0);
    
    // Subtotal should be 100 + (2 * 50) = 200. X-Ray is unchecked.
    expect(subtotal).toBe(200);
    expect(insuranceCoverage).toBe(0);
    expect(totalDue).toBe(200);
  });

  it('calculates totals correctly with 20% insurance', () => {
    const { subtotal, insuranceCoverage, totalDue } = calculatePaymentTotals(mockServices, 20);
    
    expect(subtotal).toBe(200);
    // 20% of 200 is 40
    expect(insuranceCoverage).toBe(40);
    expect(totalDue).toBe(160);
  });

  it('rounds insurance coverage correctly', () => {
    const serviceWithCents = [
      { id: '1', name: 'Service', dept: 'Dept', code: 'C', qty: 1, amount: 99.99, checked: true }
    ];
    const { insuranceCoverage } = calculatePaymentTotals(serviceWithCents, 15);
    
    // 99.99 * 0.15 = 14.9985 -> Math.round -> 15
    expect(insuranceCoverage).toBe(15);
  });

  it('returns zero for empty services', () => {
    const { subtotal, totalDue } = calculatePaymentTotals([], 50);
    expect(subtotal).toBe(0);
    expect(totalDue).toBe(0);
  });
});
