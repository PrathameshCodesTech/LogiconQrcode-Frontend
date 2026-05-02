import { useEffect, useState } from 'react';
import { Download, LayoutGrid, QrCode } from 'lucide-react';
import { downloadQRCode, getCampaigns } from '../../api/admin';
import type { AdminCampaign } from '../../types/admin';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-1 w-full bg-slate-200 dark:bg-slate-700" />
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex gap-2">
              <div className="h-7 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-7 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-700 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <QrCode className="h-7 w-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No campaigns found</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">No campaigns match the selected filter</p>
    </div>
  );
}

const STATUS_TABS = [
  { value: 'all' as const,      label: 'All' },
  { value: 'active' as const,   label: 'Active' },
  { value: 'inactive' as const, label: 'Inactive' },
];

interface CardProps {
  campaign: AdminCampaign;
  downloading: boolean;
  onDownload: () => void;
}

function CampaignCard({ campaign: c, downloading, onDownload }: CardProps) {
  const flags = [
    c.requires_otp      && 'OTP Required',
    c.shuffle_fields    && 'Shuffle Fields',
    c.allow_duplicates  && 'Allow Duplicates',
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Status colour strip */}
      <div className={`h-1 w-full ${c.is_active ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Title + status badge */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-gray-900 dark:text-gray-100">{c.title}</h3>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-normal ring-1 ${
            c.is_active
              ? 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50'
              : 'bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/50'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
            {c.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Token */}
        <p className="mb-4 break-all font-mono text-xs text-slate-400 dark:text-slate-500">{c.token}</p>

        {/* Date range */}
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800">{formatDate(c.starts_at)}</span>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800">{formatDate(c.ends_at)}</span>
        </div>

        {/* Feature flag pills */}
        {flags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {flags.map((flag) => (
              <span key={flag} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800/40">
                {flag}
              </span>
            ))}
          </div>
        )}

        {/* Download button */}
        <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-800 dark:hover:bg-blue-700"
          >
            {downloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download QR Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    getCampaigns()
      .then((res) => setCampaigns(res.results))
      .catch(() => setError('Failed to load campaigns.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (campaign: AdminCampaign) => {
    setDownloading(campaign.id);
    try {
      const { blob, filename } = await downloadQRCode(campaign.id, campaign.token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download QR code.');
    } finally {
      setDownloading(null);
    }
  };

  const filtered = campaigns.filter((c) => {
    if (statusFilter === 'active') return c.is_active;
    if (statusFilter === 'inactive') return !c.is_active;
    return true;
  });

  const countFor = (v: typeof statusFilter) =>
    v === 'all' ? campaigns.length
    : v === 'active' ? campaigns.filter((c) => c.is_active).length
    : campaigns.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campaigns</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage QR campaigns and track applications</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 dark:bg-blue-900/20">
            <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{campaigns.length} total</span>
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-md dark:bg-blue-800'
                  : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-blue-300 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
              }`}
            >
              {tab.label}
              {!loading && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                }`}>
                  {countFor(tab.value)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <EmptyState />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              downloading={downloading === c.id}
              onDownload={() => handleDownload(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
