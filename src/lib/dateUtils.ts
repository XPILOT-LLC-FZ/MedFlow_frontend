export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isDateBefore = (candidate: Date, floor: Date): boolean =>
  startOfLocalDay(candidate).getTime() < startOfLocalDay(floor).getTime();

export const isPastDate = (date: Date): boolean => {
  const today = startOfLocalDay(new Date());
  return startOfLocalDay(date).getTime() < today.getTime();
};
