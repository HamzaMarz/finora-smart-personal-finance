/**
 * Calculates profit/loss for an investment
 * @param currentValue - Current value per unit
 * @param buyPrice - Purchase price per unit
 * @param quantity - Quantity owned
 * @returns Profit or loss amount
 */
export const calculateProfitLoss = (
    currentValue: number,
    buyPrice: number,
    quantity: number
): number => {
    return (currentValue - buyPrice) * quantity;
};

/**
 * Calculates ROI (Return on Investment) percentage
 * @param profitLoss - Profit or loss amount
 * @param initialInvestment - Initial investment amount
 * @returns ROI percentage
 */
export const calculateROI = (
    profitLoss: number,
    initialInvestment: number
): number => {
    if (initialInvestment === 0) return 0;
    return (profitLoss / initialInvestment) * 100;
};

/**
 * Calculates total invested capital
 * @param investments - Array of investments
 * @returns Total invested amount
 */
export const calculateTotalInvested = (
    investments: Array<{ initialAmount: number; status: string }>
): number => {
    return investments
        .filter(inv => inv.status === 'active')
        .reduce((sum, inv) => sum + inv.initialAmount, 0);
};

/**
 * Calculates current market value of investments
 * @param investments - Array of investments
 * @returns Current market value
 */
export const calculateMarketValue = (
    investments: Array<{ currentValue: number; quantity: number; status: string }>
): number => {
    return investments
        .filter(inv => inv.status === 'active')
        .reduce((sum, inv) => sum + (inv.currentValue * inv.quantity), 0);
};
