import './globals.css';

export const metadata = {
  title: 'منظومة مصنع الكوت للأسمنت | ERP System',
  description: 'نظام إدارة المشاريع قيد التنفيذ والعهد المالية لمصنع الأسمنت',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}