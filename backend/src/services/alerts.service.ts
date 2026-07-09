import { Alert, type AlertDirection } from '../models/Alert';
import { NotFoundError } from '../lib/errors';

export async function getAlerts(userId: string, onlyActive = false) {
    const query = onlyActive
        ? { userId, triggered: false }
        : { userId };
    return Alert.find(query).sort({ createdAt: -1 }).lean();
}

export async function createAlert(
    userId: string,
    coinId: string,
    coinName: string,
    coinSymbol: string,
    targetPrice: number,
    direction: AlertDirection,
) {
    const alert = await Alert.create({
        userId,
        coinId,
        coinName,
        coinSymbol,
        targetPrice,
        direction,
    });
    return alert.toObject();
}

export async function deleteAlert(userId: string, alertId: string) {
    const result = await Alert.findOneAndDelete({ _id: alertId, userId });
    if (!result) throw new NotFoundError('Alert');
    return { deleted: true, alertId };
}

export async function markAlertTriggered(alertId: string) {
    return Alert.findByIdAndUpdate(
        alertId,
        { triggered: true, triggeredAt: new Date() },
        { new: true },
    ).lean();
}

/**
 * Check all active alerts for a given coin against its current price.
 * Returns the alerts that were just triggered.
 */
export async function checkAlerts(coinId: string, currentPrice: number) {
    const activeAlerts = await Alert.find({ coinId, triggered: false });

    const triggered = activeAlerts.filter((alert) => {
        if (alert.direction === 'above') return currentPrice >= alert.targetPrice;
        if (alert.direction === 'below') return currentPrice <= alert.targetPrice;
        return false;
    });

    if (triggered.length > 0) {
        const ids = triggered.map((a) => a._id);
        await Alert.updateMany(
            { _id: { $in: ids } },
            { triggered: true, triggeredAt: new Date() },
        );
    }

    return triggered.map((a) => a.toObject());
}
