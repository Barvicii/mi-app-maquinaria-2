'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Wrench, Droplets, Filter, CircleDot, Clock, Calendar,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  ClipboardCheck, Settings, Loader2, Truck, Receipt
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────
function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NZ', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function statusBadge(status) {
  const map = {
    'Completado': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    'En Progreso': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'Pendiente': { color: 'bg-blue-100 text-blue-800', icon: Clock },
    'Cancelado': { color: 'bg-red-100 text-red-800', icon: XCircle },
  };
  const s = map[status] || map['Pendiente'];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
}

function serviceTypeBadge(type) {
  const map = {
    'Preventivo': 'bg-emerald-100 text-emerald-700',
    'Correctivo': 'bg-orange-100 text-orange-700',
    'Emergencia': 'bg-red-100 text-red-700',
    'Mantenimiento': 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  );
}

function maintenanceIndicator(lastService, nextService) {
  if (!nextService) return null;
  const next = parseInt(nextService);
  const last = parseInt(lastService) || 0;
  if (isNaN(next)) return null;
  const diff = next - last;
  if (diff <= 0) return { label: 'Service overdue', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle };
  if (diff <= 50) return { label: 'Service upcoming', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle };
  return { label: 'On schedule', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 };
}

function prestartCheckIcon(value) {
  return value
    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
    : <XCircle className="w-4 h-4 text-red-500" />;
}

// ─── Section Component ─────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

// ─── Oil Card ──────────────────────────────────────────────
function OilCard({ label, oil }) {
  if (!oil || (!oil.type && !oil.capacity && !oil.brand)) return null;
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-600 mb-2">{label}</h4>
      <div className="space-y-1 text-sm">
        {oil.type && <p><span className="text-gray-500">Type:</span> <span className="font-medium">{oil.type}</span></p>}
        {oil.capacity && <p><span className="text-gray-500">Capacity:</span> <span className="font-medium">{oil.capacity}</span></p>}
        {oil.brand && <p><span className="text-gray-500">Brand:</span> <span className="font-medium">{oil.brand}</span></p>}
      </div>
    </div>
  );
}

// ─── Filter Row ────────────────────────────────────────────
function FilterRow({ label, part, brand }) {
  if (!part && !brand) return null;
  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-2 pr-4 text-sm text-gray-500">{label}</td>
      <td className="py-2 pr-4 text-sm font-medium">{part || '—'}</td>
      <td className="py-2 text-sm text-gray-600">{brand || '—'}</td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════
export default function PublicMachinePage() {
  const params = useParams();
  const id = params.id;

  const [machine, setMachine] = useState(null);
  const [services, setServices] = useState([]);
  const [prestart, setPrestart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servicePage, setServicePage] = useState(1);
  const [servicePagination, setServicePagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [invoiceSummary, setInvoiceSummary] = useState(null);

  // ─── Fetch machine data ───────────────────────────────
  useEffect(() => {
    if (!id) return;

    async function fetchAll() {
      try {
        setLoading(true);
        const [machineRes, servicesRes, prestartRes, invoiceRes] = await Promise.all([
          fetch(`/api/public/machines/${id}`),
          fetch(`/api/public/machines/${id}/services?limit=5`),
          fetch(`/api/public/machines/${id}/prestart`),
          fetch(`/api/public/machines/${id}/invoices`)
        ]);

        if (!machineRes.ok) throw new Error('Machine not found');

        const machineData = await machineRes.json();
        setMachine(machineData);

        if (servicesRes.ok) {
          const sData = await servicesRes.json();
          setServices(sData.services || []);
          setServicePagination(sData.pagination || null);
        }

        if (prestartRes.ok) {
          const pData = await prestartRes.json();
          setPrestart(pData.prestart || null);
        }

        if (invoiceRes.ok) {
          const invData = await invoiceRes.json();
          setInvoiceSummary(invData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  // ─── Load more services ──────────────────────────────
  async function loadMoreServices() {
    if (!servicePagination || servicePage >= servicePagination.totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = servicePage + 1;
      const res = await fetch(`/api/public/machines/${id}/services?page=${nextPage}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setServices(prev => [...prev, ...(data.services || [])]);
        setServicePagination(data.pagination);
        setServicePage(nextPage);
      }
    } catch { /* ignore */ } finally {
      setLoadingMore(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-500">Loading machine data…</p>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (error || !machine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Machine Not Found</h1>
          <p className="text-gray-500">{error || 'The machine you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  // ─── Data derived ─────────────────────────────────────
  const maint = maintenanceIndicator(machine.lastService || machine.currentHours, machine.nextService);
  const MaintIcon = maint?.icon;
  const hasOils = machine.engineOil || machine.hydraulicOil || machine.transmissionOil;
  const hasFilters = machine.filters && Object.values(machine.filters).some(Boolean);
  const hasTires = machine.tires && (machine.tires.front || machine.tires.rear);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* ─── Header ────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-emerald-200 text-sm font-medium tracking-wide uppercase mb-1">
            Orchard Services
          </p>
          <div className="flex items-start gap-3">
            <div className="bg-white/20 rounded-lg p-2.5 mt-0.5">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {machine.brand} {machine.model || machine.modelo}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-emerald-100">
                {machine.machineId && <span>ID: {machine.machineId}</span>}
                {machine.serialNumber && <span>S/N: {machine.serialNumber}</span>}
                {machine.year && <span>Year: {machine.year}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* ─── Quick stats ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Current Hours</p>
            <p className="text-lg font-bold text-gray-800">
              {machine.currentHours || machine.horasActuales || '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Wrench className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Next Service</p>
            <p className="text-lg font-bold text-gray-800">
              {machine.nextService || machine.proximoService || '—'}
            </p>
          </div>
          {maint && (
            <div className={`col-span-2 sm:col-span-1 rounded-xl shadow-sm border p-4 text-center ${maint.bg}`}>
              <MaintIcon className={`w-5 h-5 mx-auto mb-1 ${maint.color}`} />
              <p className={`text-xs ${maint.color}`}>{maint.label}</p>
            </div>
          )}
        </div>

        {/* ─── Oils ──────────────────────────────────── */}
        {hasOils && (
          <Section title="Oils" icon={Droplets}>
            <div className="grid sm:grid-cols-3 gap-3">
              <OilCard label="Engine Oil" oil={machine.engineOil} />
              <OilCard label="Hydraulic Oil" oil={machine.hydraulicOil} />
              <OilCard label="Transmission Oil" oil={machine.transmissionOil} />
            </div>
          </Section>
        )}

        {/* ─── Filters ──────────────────────────────── */}
        {hasFilters && (
          <Section title="Filters" icon={Filter}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-xs text-gray-500 font-medium">Filter</th>
                    <th className="pb-2 text-xs text-gray-500 font-medium">Part #</th>
                    <th className="pb-2 text-xs text-gray-500 font-medium">Brand</th>
                  </tr>
                </thead>
                <tbody>
                  <FilterRow label="Engine" part={machine.filters.engine} brand={machine.filters.engineBrand} />
                  <FilterRow label="Transmission" part={machine.filters.transmission} brand={machine.filters.transmissionBrand} />
                  <FilterRow label="Fuel" part={machine.filters.fuel} brand={machine.filters.fuelBrand} />
                  <FilterRow label="Air" part={machine.filters.air} brand={machine.filters.airBrand} />
                  <FilterRow label="Carbon" part={machine.filters.carbon} brand={machine.filters.carbonBrand} />
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ─── Tires ─────────────────────────────────── */}
        {hasTires && (
          <Section title="Tires" icon={CircleDot}>
            <div className="grid sm:grid-cols-2 gap-3">
              {machine.tires.front && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Front</h4>
                  <div className="space-y-1 text-sm">
                    {machine.tires.front.size && <p><span className="text-gray-500">Size:</span> <span className="font-medium">{machine.tires.front.size}</span></p>}
                    {machine.tires.front.pressure && <p><span className="text-gray-500">Pressure:</span> <span className="font-medium">{machine.tires.front.pressure}</span></p>}
                    {machine.tires.front.brand && <p><span className="text-gray-500">Brand:</span> <span className="font-medium">{machine.tires.front.brand}</span></p>}
                  </div>
                </div>
              )}
              {machine.tires.rear && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Rear</h4>
                  <div className="space-y-1 text-sm">
                    {machine.tires.rear.size && <p><span className="text-gray-500">Size:</span> <span className="font-medium">{machine.tires.rear.size}</span></p>}
                    {machine.tires.rear.pressure && <p><span className="text-gray-500">Pressure:</span> <span className="font-medium">{machine.tires.rear.pressure}</span></p>}
                    {machine.tires.rear.brand && <p><span className="text-gray-500">Brand:</span> <span className="font-medium">{machine.tires.rear.brand}</span></p>}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ─── Last Pre-Start ────────────────────────── */}
        {prestart && (
          <Section title="Last Pre-Start Check" icon={ClipboardCheck} defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Date: {fmt(prestart.fecha || prestart.createdAt)}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  prestart.estado === 'OK' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {prestart.estado === 'OK' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {prestart.estado || 'N/A'}
                </span>
              </div>
              {prestart.horasMaquina && (
                <p className="text-sm text-gray-600">Hours at check: <span className="font-medium">{prestart.horasMaquina}</span></p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {[
                  { label: 'Oil', value: prestart.aceite },
                  { label: 'Water', value: prestart.agua },
                  { label: 'Tyres', value: prestart.neumaticos },
                  { label: 'Fuel Level', value: prestart.nivelCombustible },
                  { label: 'Lights & Alarms', value: prestart.lucesYAlarmas },
                  { label: 'Brakes', value: prestart.frenos },
                  { label: 'Extinguishers', value: prestart.extintores },
                  { label: 'Seatbelt', value: prestart.cinturonSeguridad },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-sm">
                    {prestartCheckIcon(item.value)}
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ─── Service History ───────────────────────── */}
        <Section title="Service History" icon={Settings} defaultOpen={services.length > 0}>
          {services.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No service records yet.</p>
          ) : (
            <div className="space-y-3">
              {services.map((svc, i) => (
                <div key={i} className="relative pl-6 pb-3 border-l-2 border-emerald-200 last:border-transparent">
                  <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{fmt(svc.fechaInicio)}</span>
                    {serviceTypeBadge(svc.serviceType)}
                    {statusBadge(svc.status)}
                  </div>
                  <p className="text-sm text-gray-600">{svc.description}</p>
                  {(svc.horasIniciales || svc.horasFinales) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Hours: {svc.horasIniciales ?? '—'} → {svc.horasFinales ?? '—'}
                    </p>
                  )}
                </div>
              ))}

              {/* Load more button */}
              {servicePagination && servicePage < servicePagination.totalPages && (
                <button
                  onClick={loadMoreServices}
                  disabled={loadingMore}
                  className="w-full py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {loadingMore ? 'Loading…' : `Load more (${servicePagination.total - services.length} remaining)`}
                </button>
              )}
            </div>
          )}
        </Section>

        {/* ─── Invoice / Cost Summary ────────────────── */}
        {invoiceSummary && invoiceSummary.totalServiceRecords > 0 && (
          <Section title="Cost Records" icon={Receipt} defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{invoiceSummary.totalServiceRecords}</span> confirmed invoice{invoiceSummary.totalServiceRecords !== 1 ? 's' : ''} on file
              </p>

              {invoiceSummary.categoryBreakdown?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {invoiceSummary.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between items-center">
                      <span className="text-sm text-gray-600">{cat.category}</span>
                      <span className="text-sm font-semibold text-gray-800">{cat.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {invoiceSummary.recentActivity?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {invoiceSummary.recentActivity.map((act, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <span className="font-medium text-gray-700">{act.vendor}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-500">{act.category}</span>
                        </div>
                        <span className="text-xs text-gray-400">{fmt(act.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ─── Action Buttons ────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <a
            href={`/service/${id}?public=true`}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Wrench className="w-4 h-4" />
            Register Service
          </a>
          <a
            href={`/prestart/${id}?public=true`}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-700 border-2 border-emerald-600 rounded-xl font-medium hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4" />
            Do Pre-Start
          </a>
        </div>

        {/* ─── Footer ────────────────────────────────── */}
        <footer className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-500">Orchard Services</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
