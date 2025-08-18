export const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('pt-BR');
};
