import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit,
  Filter,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  X,
  Shield,
  Search,
  PieChart,
  Tag,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { exportPresupuestoToExcel } from '../services/officeExportUtils';

// Datos iniciales de demostración corporativa COARC
const INITIAL_BUDGET = [
  {
    id: 1,
    fecha: '2026-08-01',
    tipo: 'INGRESO',
    concepto: 'Cobro por Arbitraje - Torneo Valores Sub-15',
    categoria: 'Derechos de Arbitraje',
    monto: 1200000,
    estado: 'COBRADO',
    notas: 'Factura #045 - Pago completo recibido de la liga'
  },
  {
    id: 2,
    fecha: '2026-08-01',
    tipo: 'EGRESO',
    concepto: 'Pago de Honorarios Arbitrales - Jornada Sábado 01 Agosto',
    categoria: 'Honorarios Árbitros',
    monto: 850000,
    estado: 'PAGADO',
    notas: 'Transferencia a 12 árbitros designados'
  },
  {
    id: 3,
    fecha: '2026-08-02',
    tipo: 'EGRESO',
    concepto: 'Auxilio de Transporte y Viáticos - Desplazamiento a Cereté',
    categoria: 'Transporte y Viáticos',
    monto: 140000,
    estado: 'PAGADO',
    notas: 'Terna arbitral Cancha Villa Olímpica'
  },
  {
    id: 4,
    fecha: '2026-08-03',
    tipo: 'INGRESO',
    concepto: 'Cuotas Ordinarias de Afiliación Arbitral (Mes de Agosto)',
    categoria: 'Cuotas Ordinarias',
    monto: 450000,
    estado: 'COBRADO',
    notas: 'Recaudo de 18 árbitros activos'
  },
  {
    id: 5,
    fecha: '2026-08-04',
    tipo: 'INGRESO',
    concepto: 'Cobro Arbitraje - Torneo Veteranos Cereté',
    categoria: 'Derechos de Arbitraje',
    monto: 600000,
    estado: 'PENDIENTE',
    notas: 'Pendiente desembolso por parte del comité organizador'
  },
  {
    id: 6,
    fecha: '2026-08-04',
    tipo: 'EGRESO',
    concepto: 'Mantenimiento de Uniformes y Tarjetas Arbitrales',
    categoria: 'Uniformes e Indumentaria',
    monto: 180000,
    estado: 'PENDIENTE',
    notas: 'Dotación de planillas y silbatos de repuesto'
  }
];

export const PresupuestoModal = ({ isOpen, onClose }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('coarc_presupuesto');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET;
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    localStorage.setItem('coarc_presupuesto', JSON.stringify(items));
  }, [items]);

  // Estados de Formulario y Filtros
  const [filterTipo, setFilterTipo] = useState('TODOS'); // TODOS, INGRESO, EGRESO
  const [filterEstado, setFilterEstado] = useState('TODOS'); // TODOS, PAGADO, COBRADO, PENDIENTE
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'INGRESO',
    concepto: '',
    categoria: 'Derechos de Arbitraje',
    monto: '',
    estado: 'COBRADO',
    notas: ''
  });

  // TODOS LOS HOOKS DEBEN EJECUTARSE INCONDICIONALMENTE (Regla de Hooks de React)
  const resumen = useMemo(() => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let ingresosPendientes = 0;
    let egresosPendientes = 0;

    items.forEach(item => {
      const val = Number(item.monto) || 0;
      if (item.tipo === 'INGRESO') {
        totalIngresos += val;
        if (item.estado === 'PENDIENTE') ingresosPendientes += val;
      } else {
        totalEgresos += val;
        if (item.estado === 'PENDIENTE') egresosPendientes += val;
      }
    });

    const balance = totalIngresos - totalEgresos;

    return {
      totalIngresos,
      totalEgresos,
      balance,
      ingresosPendientes,
      egresosPendientes
    };
  }, [items]);

  // Filtrado de partidas
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterTipo !== 'TODOS' && item.tipo !== filterTipo) return false;
      if (filterEstado !== 'TODOS' && item.estado !== filterEstado) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchConcepto = (item.concepto || '').toLowerCase().includes(query);
        const matchCategoria = (item.categoria || '').toLowerCase().includes(query);
        const matchNotas = (item.notas || '').toLowerCase().includes(query);
        return matchConcepto || matchCategoria || matchNotas;
      }
      return true;
    });
  }, [items, filterTipo, filterEstado, searchQuery]);

  // AHORA SÍ: Retorno temprano si no está abierto (después de ejecutar todos los hooks)
  if (!isOpen) return null;

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.concepto || !formData.monto) return;

    if (editingId) {
      setItems(prev => prev.map(item => item.id === editingId ? { ...formData, id: editingId, monto: Number(formData.monto) } : item));
      setEditingId(null);
    } else {
      const newItem = {
        ...formData,
        id: Date.now(),
        monto: Number(formData.monto)
      };
      setItems(prev => [newItem, ...prev]);
    }

    setFormData({
      fecha: new Date().toISOString().slice(0, 10),
      tipo: 'INGRESO',
      concepto: '',
      categoria: 'Derechos de Arbitraje',
      monto: '',
      estado: 'COBRADO',
      notas: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (item) => {
    setFormData({
      fecha: item.fecha,
      tipo: item.tipo,
      concepto: item.concepto,
      categoria: item.categoria,
      monto: item.monto,
      estado: item.estado,
      notas: item.notas || ''
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta partida del presupuesto corporativo?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleToggleEstado = (item) => {
    const nextEstado = item.tipo === 'INGRESO'
      ? (item.estado === 'COBRADO' ? 'PENDIENTE' : 'COBRADO')
      : (item.estado === 'PAGADO' ? 'PENDIENTE' : 'PAGADO');

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, estado: nextEstado } : i));
  };

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header Corporativo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Presupuesto Corporativo y Control Financiero</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  COARC
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de ingresos por arbitraje, cuotas y egresos de honorarios a árbitros
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPresupuestoToExcel(items, resumen)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition"
              title="Exportar Presupuesto a Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas de Resumen Financiero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
          
          {/* Total Ingresos */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
              <span>Total Ingresos</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {formatCOP(resumen.totalIngresos)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Por cobrar: {formatCOP(resumen.ingresosPendientes)}</span>
            </div>
          </div>

          {/* Total Egresos */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">
              <span>Total Egresos</span>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {formatCOP(resumen.totalEgresos)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Por pagar: {formatCOP(resumen.egresosPendientes)}</span>
            </div>
          </div>

          {/* Balance Neto */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">
              <span>Balance Neto</span>
              <PieChart className="w-4 h-4" />
            </div>
            <div className={`text-base sm:text-lg font-black ${resumen.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCOP(resumen.balance)}
            </div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">
              {resumen.balance >= 0 ? 'Superávit Financiero' : 'Déficit Financiero'}
            </div>
          </div>

          {/* Registros Totales */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">
              <span>Registros en Libro</span>
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {filteredItems.length} Partidas
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Filtro activo
            </div>
          </div>

        </div>

        {/* Barra de Herramientas y Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Buscador */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar concepto o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Filtro Tipo */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="INGRESO">Solo Ingresos</option>
              <option value="EGRESO">Solo Egresos</option>
            </select>

            {/* Filtro Estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="COBRADO">Cobrado / Pagado</option>
              <option value="PENDIENTE">Pendientes</option>
            </select>
          </div>

          {/* Botón Nueva Partida */}
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                fecha: new Date().toISOString().slice(0, 10),
                tipo: 'INGRESO',
                concepto: '',
                categoria: 'Derechos de Arbitraje',
                monto: '',
                estado: 'COBRADO',
                notas: ''
              });
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancelar' : 'Registrar Partida'}</span>
          </button>

        </div>

        {/* Formulario de Adición / Edición */}
        {showAddForm && (
          <form onSubmit={handleSaveItem} className="p-4 bg-blue-50/60 dark:bg-slate-950/90 border-b border-blue-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Tipo de Partida:</label>
              <select
                value={formData.tipo}
                onChange={(e) => {
                  const newTipo = e.target.value;
                  setFormData({
                    ...formData,
                    tipo: newTipo,
                    estado: newTipo === 'INGRESO' ? 'COBRADO' : 'PAGADO',
                    categoria: newTipo === 'INGRESO' ? 'Derechos de Arbitraje' : 'Honorarios Árbitros'
                  });
                }}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="INGRESO">INGRESO (Entrada de dinero)</option>
                <option value="EGRESO">EGRESO (Salida / Gasto)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Concepto / Descripción:</label>
              <input
                type="text"
                required
                placeholder="ej: Pago de arbitrajes Torneo Local"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Categoría:</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              >
                {formData.tipo === 'INGRESO' ? (
                  <>
                    <option value="Derechos de Arbitraje">Derechos de Arbitraje</option>
                    <option value="Cuotas Ordinarias">Cuotas Ordinarias Afiliados</option>
                    <option value="Patrocinios">Patrocinios y Convenios</option>
                    <option value="Inscripciones">Inscripciones y Sanciones</option>
                    <option value="Otros Ingresos">Otros Ingresos</option>
                  </>
                ) : (
                  <>
                    <option value="Honorarios Árbitros">Honorarios a Árbitros</option>
                    <option value="Transporte y Viáticos">Transporte y Viáticos</option>
                    <option value="Uniformes e Indumentaria">Uniformes e Indumentaria</option>
                    <option value="Gastos Administrativos">Gastos Administrativos</option>
                    <option value="Alquiler y Campo">Alquiler y Escenarios</option>
                    <option value="Otros Egresos">Otros Egresos</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Monto (COP):</label>
              <input
                type="number"
                required
                min="0"
                placeholder="ej: 150000"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Fecha Registro:</label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Estado Transacción:</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                {formData.tipo === 'INGRESO' ? (
                  <>
                    <option value="COBRADO">COBRADO (Efectivo / Recibido)</option>
                    <option value="PENDIENTE">PENDIENTE DE COBRO</option>
                  </>
                ) : (
                  <>
                    <option value="PAGADO">PAGADO (Liquidado)</option>
                    <option value="PENDIENTE">PENDIENTE DE PAGO</option>
                  </>
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">Notas / Observaciones:</label>
              <input
                type="text"
                placeholder="Detalles adicionales, número de recibo o transferencia"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{editingId ? 'Guardar Cambios' : 'Registrar Partida'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tabla de Partidas */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-bold">No se encontraron partidas financieras con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredItems.map(item => {
                    const isIngreso = item.tipo === 'INGRESO';
                    const isCompletado = item.estado === 'COBRADO' || item.estado === 'PAGADO';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition">
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {item.fecha}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isIngreso
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300'
                          }`}>
                            {isIngreso ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{item.tipo}</span>
                          </span>
                        </td>

                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                          <div>{item.concepto}</div>
                          {item.notas && (
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.notas}</div>
                          )}
                        </td>

                        <td className="p-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {item.categoria}
                          </span>
                        </td>

                        <td className={`p-3 text-right font-black font-mono whitespace-nowrap text-sm ${
                          isIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isIngreso ? '+' : '-'}{formatCOP(item.monto)}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleEstado(item)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition flex items-center justify-center gap-1 mx-auto ${
                              isCompletado
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                            }`}
                            title="Haz clic para cambiar estado"
                          >
                            {isCompletado ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                            <span>{item.estado}</span>
                          </button>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-semibold">
            Corporación de Árbitros COARC - Módulo Financiero
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
