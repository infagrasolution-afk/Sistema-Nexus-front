import { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Grid } from '@mui/material';
import { TrendingUp, AttachMoney, Inventory, WarningAmber } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now, later we can connect to real endpoints
    setTimeout(() => {
      setData({
        total_sales: 15420.50,
        total_orders: 84,
        active_products: 245,
        low_stock_items: 12,
        sales_chart: [
          {"name": t("Mon"), "ventas": 4000},
          {"name": t("Tue"), "ventas": 3000},
          {"name": t("Wed"), "ventas": 2000},
          {"name": t("Thu"), "ventas": 2780},
          {"name": t("Fri"), "ventas": 1890},
          {"name": t("Sat"), "ventas": 2390},
          {"name": t("Sun"), "ventas": 3490},
        ]
      });
      setLoading(false);
    }, 800);
  }, [t]);

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt: 10 }}><CircularProgress /></Box>;

  const stats = [
    { title: t("Total Sales"), value: `$${data.total_sales.toFixed(2)}`, icon: <AttachMoney fontSize="large" color="primary" />, color: 'primary.main' },
    { title: t("Orders"), value: data.total_orders, icon: <TrendingUp fontSize="large" color="success" />, color: 'success.main' },
    { title: t("Products"), value: data.active_products, icon: <Inventory fontSize="large" color="info" />, color: 'info.main' },
    { title: t("Stock Alerts"), value: data.low_stock_items, icon: <WarningAmber fontSize="large" color="error" />, color: 'error.main' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, letterSpacing: '-1px' }}>
        {t("Welcome")}, Administrador
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{stat.value}</Typography>
              </Box>
              <Box sx={{ bgcolor: `${stat.color}15`, p: 1.5, borderRadius: 3 }}>
                {stat.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 4 }}>{t("Sales Last 7 Days")}</Typography>
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sales_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(val) => `$${val}`} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }} 
              />
              <Bar dataKey="ventas" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
