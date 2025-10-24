// Frontend timezone utility for Indian Standard Time (IST)
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

export const formatIndianTime = (date) => {
  if (!date) return null;
  const istDate = new Date(date);
  return istDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getIndianDateString = (date = null) => {
  const targetDate = date || new Date();
  const istDate = new Date(targetDate);
  return istDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const isTodayIndian = (date) => {
  if (!date) return false;
  const today = new Date();
  const targetDate = new Date(date);
  
  const todayIST = today.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const targetIST = targetDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  return todayIST === targetIST;
};

export const isYesterdayIndian = (date) => {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date);
  
  const yesterdayIST = yesterday.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const targetIST = targetDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  return yesterdayIST === targetIST;
};
