'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const STATUS_MESSAGE_MAP: Record<string, { message: string; type: 'success' | 'error' }> = {
  created: { message: '✅ Đã thêm món ăn thành công!', type: 'success' },
  updated: { message: '✅ Đã cập nhật món ăn thành công!', type: 'success' },
  deleted: { message: '🗑️ Đã xóa món ăn thành công!', type: 'success' },
  cat_created: { message: '✅ Đã thêm danh mục thành công!', type: 'success' },
  cat_updated: { message: '✅ Đã cập nhật danh mục thành công!', type: 'success' },
  cat_deleted: { message: '🗑️ Đã xóa danh mục thành công!', type: 'success' },
};

export default function AdminToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (status && STATUS_MESSAGE_MAP[status]) {
      setToast(STATUS_MESSAGE_MAP[status]);
      setVisible(true);
    } else if (error) {
      setToast({ message: `❌ Lỗi: ${decodeURIComponent(error)}`, type: 'error' });
      setVisible(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible || !toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        padding: '12px 20px',
        borderRadius: 12,
        backgroundColor: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
        border: `1px solid ${toast.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
        color: toast.type === 'success' ? '#065f46' : '#991b1b',
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        maxWidth: 360,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'slideIn 0.3s ease',
      }}
    >
      {toast.message}
      <button
        onClick={() => setVisible(false)}
        style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', opacity: 0.6 }}
      >
        ×
      </button>
    </div>
  );
}
