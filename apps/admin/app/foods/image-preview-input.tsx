'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

type FoodImagePreviewInputProps = {
  defaultUrl?: string;
  nameInputId: string;
};

type AutoImageResponse = {
  success?: boolean;
  data?: {
    url?: string;
  };
  message?: string;
};

export default function FoodImagePreviewInput({
  defaultUrl,
  nameInputId,
}: FoodImagePreviewInputProps) {
  const [urlValue, setUrlValue] = useState(defaultUrl ?? '');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | undefined>(undefined);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string | undefined>(undefined);
  const [autoInfo, setAutoInfo] = useState<string | undefined>(undefined);

  useEffect(() => {
    setUrlValue(defaultUrl ?? '');
    setAutoError(undefined);
    setAutoInfo(undefined);
    setFileInputKey((value) => value + 1);
    setFilePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return undefined;
    });
  }, [defaultUrl]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const previewUrl = useMemo(() => {
    if (filePreviewUrl) {
      return filePreviewUrl;
    }

    const normalized = urlValue.trim();
    return normalized || undefined;
  }, [filePreviewUrl, urlValue]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setAutoError(undefined);
    setAutoInfo(undefined);

    setFilePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      if (!selectedFile) {
        return undefined;
      }

      return URL.createObjectURL(selectedFile);
    });
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrlValue(event.target.value);
    setAutoError(undefined);
    setAutoInfo(undefined);

    setFilePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return undefined;
    });
    setFileInputKey((value) => value + 1);
  };

  const handleAutoFetch = async () => {
    setAutoError(undefined);
    setAutoInfo(undefined);

    const nameInput = document.getElementById(nameInputId);
    const dishName = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '';

    if (!dishName) {
      setAutoError('Nhập tên món ăn trước khi tự lấy ảnh.');
      return;
    }

    setAutoLoading(true);

    try {
      const response = await fetch(`/api/foods/auto-image?name=${encodeURIComponent(dishName)}`, {
        cache: 'no-store',
      });
      const body = (await response.json().catch(() => undefined)) as AutoImageResponse | undefined;

      if (!response.ok) {
        throw new Error(body?.message || `Không thể tự lấy ảnh (${response.status})`);
      }

      const autoUrl = body?.data?.url?.trim();
      if (!autoUrl) {
        setAutoError('Không tìm thấy ảnh phù hợp cho món này.');
        return;
      }

      setUrlValue(autoUrl);
      setFilePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return undefined;
      });
      setFileInputKey((value) => value + 1);
      setAutoInfo('Đã tự lấy ảnh. Bấm Lưu để cập nhật món ăn.');
    } catch (error) {
      setAutoError(error instanceof Error ? error.message : 'Không thể tự lấy ảnh ngay.');
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <input type="hidden" name="originalImageUrl" value={defaultUrl ?? ''} />
      <input
        name="imageUrl"
        value={urlValue}
        onChange={handleUrlChange}
        placeholder="Image URL"
        className="w-full rounded border p-2"
      />

      <button
        type="button"
        onClick={() => void handleAutoFetch()}
        disabled={autoLoading}
        className="rounded border border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700"
      >
        {autoLoading ? 'Đang tự lấy ảnh...' : 'Tự lấy ảnh ngay'}
      </button>

      <input
        key={fileInputKey}
        name="imageFile"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full rounded border p-2"
      />

      <p className="text-xs text-slate-500">
        Để trống cả link và file: hệ thống sẽ tự động thử lấy ảnh theo tên món khi bấm lưu.
      </p>

      {autoError ? <p className="text-xs text-red-700">{autoError}</p> : null}
      {autoInfo ? <p className="text-xs text-emerald-700">{autoInfo}</p> : null}

      {previewUrl ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600">Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="preview"
            className="h-36 w-56 rounded border border-slate-300 object-cover"
          />
        </div>
      ) : (
        <p className="text-xs text-slate-500">Chưa có preview ảnh.</p>
      )}
    </div>
  );
}
