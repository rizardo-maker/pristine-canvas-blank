
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

export async function displaySyncStatus(userId: string): Promise<string> {
  const lastSync = localStorage.getItem(`last_sync_${userId}`);
  if (lastSync) {
    const syncDate = new Date(lastSync);
    return `Last sync: ${syncDate.toLocaleDateString()}`;
  }
  return 'Never synced';
}
