import axios from 'axios';

const normalizeBaseURL = (value) => {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.pathname = `${url.pathname.replace(/\/+$/, '').replace(/\/api$/i, '')}/api`;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const isDevelopment = import.meta.env.DEV;
const configuredBaseURL = normalizeBaseURL(import.meta.env.VITE_API_URL || '');
const configuredIsLocal = configuredBaseURL && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(new URL(configuredBaseURL).hostname);
const defaultBaseURL = isDevelopment
  ? 'http://localhost:5000/api'
  : 'https://cc-1-n9al.onrender.com/api';
const baseURL = (isDevelopment || !configuredIsLocal) && configuredBaseURL
  ? configuredBaseURL
  : normalizeBaseURL(defaultBaseURL);

export default axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});
