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

const defaultBaseURL = 'http://localhost:5000/api';
const baseURL = normalizeBaseURL(import.meta.env.VITE_API_URL || '') || normalizeBaseURL(defaultBaseURL);

export default axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});
