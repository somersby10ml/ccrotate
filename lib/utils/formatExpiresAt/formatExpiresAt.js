/**
 * Format a timestamp to KST (Korean Standard Time) format
 * @param {string|number|null} timestamp - The timestamp to format
 * @returns {string} Formatted date string in KST (YYYY-MM-DD HH:mm:ss) or status string
 */
export function formatExpiresAt(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid';
    }
    
    // Convert to KST (UTC+9)
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');
    const hour = String(kstDate.getUTCHours()).padStart(2, '0');
    const minute = String(kstDate.getUTCMinutes()).padStart(2, '0');
    const second = String(kstDate.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  } catch (error) {
    return 'Invalid';
  }
}