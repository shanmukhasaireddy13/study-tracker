// Timezone utility for Indian Standard Time (IST)
export const getIndianTime = () => {
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60; // 5.5 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (istOffset * 60000));
    return ist;
};

export const getIndianDateString = (date = null) => {
    const targetDate = date || getIndianTime();
    return targetDate.toISOString().split('T')[0];
};

export const getIndianDateStartOfDay = (date = null) => {
    const targetDate = date || getIndianTime();
    const istDate = new Date(targetDate);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
};

export const getIndianDateEndOfDay = (date = null) => {
    const targetDate = date || getIndianTime();
    const istDate = new Date(targetDate);
    istDate.setHours(23, 59, 59, 999);
    return istDate;
};

export const formatIndianDateTime = (date) => {
    if (!date) return null;
    const istDate = new Date(date);
    return istDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const formatIndianDate = (date) => {
    if (!date) return null;
    const istDate = new Date(date);
    return istDate.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};
