export const metadata = {
  title: 'منظومة إدارة العهدة المالية والمرتبات',
  description: 'مصنع الأسمنت - إدارة العهد والمصروفات المباشرة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
