// Supabase 配置
const SUPABASE_URL = 'https://xoiigexoteorphfcexjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWlnZXhvdGVvcnBoZmNleGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDQ0NzYsImV4cCI6MjA4MTc4MDQ3Nn0.lGQlVM6Q8stDOybxGBSVHcpL_9CtuRl6QRbkn5ekfgI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 全局状态
let dataCache = {};
let currentUser = null;
let isSignUpMode = false;
let isDomReady = false;
let mainChart = null;
let currentChartType = 'cards';
