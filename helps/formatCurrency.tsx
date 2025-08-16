export const formatCurrency = (amount: string) => {
  const numericAmount = parseFloat(amount)
  if (isNaN(numericAmount)) return "R$ 0,00"
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericAmount)
}