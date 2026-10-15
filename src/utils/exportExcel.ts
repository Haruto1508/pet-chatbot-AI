import ExcelJS from 'exceljs';
import { SystemStats, TopVisitedPage, TopUserAction } from '../types';

// ─────────────────────────────────────────────────────────────
// CANVAS CHART GENERATION UTILITIES (High-Resolution 2X Retina)
// ─────────────────────────────────────────────────────────────

/**
 * Tạo canvas độ phân giải cao và context 2D
 */
function createHiDPICanvas(w: number, h: number, ratio = 2): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);
  return { canvas, ctx };
}

/**
 * 1. Biểu đồ Phễu & Cơ Cấu Người Dùng (Executive Summary KPI Chart)
 */
function renderExecutiveKpiChart(stats: SystemStats): string {
  const W = 880;
  const H = 380;
  const { canvas, ctx } = createHiDPICanvas(W, H);

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Border & Header Bar
  ctx.fillStyle = '#1B365D';
  ctx.fillRect(0, 0, W, 48);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BIEU DO CO CAU LUU LUONG & PHEU CHUYEN DOI NGUOI DUNG', 24, 24);

  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'right';
  ctx.fillText('Nguon: Vethic Analytics Engine', W - 24, 24);

  // Data Items for Bar Chart
  const items = [
    { label: 'Website Visitors', value: stats.websiteVisitors || 0, color: '#2563EB', sub: 'Tong truy cap' },
    { label: 'Unique Visitors', value: stats.uniqueVisitors || 0, color: '#3B82F6', sub: 'Thiet bi doc lap' },
    { label: 'Active Users', value: stats.activeUsers || 0, color: '#0EA5E9', sub: 'Tuong tac thuc' },
    { label: 'Chat Users', value: stats.chatUsers || 0, color: '#059669', sub: 'Hoi benh AI' },
    { label: 'Guest Users', value: stats.guestChatUsers || 0, color: '#D97706', sub: 'Khach dung thu' },
    { label: 'Registered', value: stats.registeredUsers || 0, color: '#7C3AED', sub: 'Tai khoan chinh thuc' }
  ];

  const maxVal = Math.max(...items.map(i => i.value), 1);
  const chartLeft = 70;
  const chartTop = 80;
  const chartWidth = W - 140;
  const chartHeight = 220;
  const barWidth = Math.min(65, (chartWidth / items.length) - 30);
  const step = chartWidth / items.length;

  // Gridlines & Y-Axis
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748B';
  ctx.font = '10px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = Math.round((maxVal / yTicks) * i);
    const yPos = chartTop + chartHeight - (chartHeight / yTicks) * i;

    ctx.beginPath();
    ctx.moveTo(chartLeft, yPos);
    ctx.lineTo(chartLeft + chartWidth, yPos);
    ctx.stroke();

    ctx.fillText(yVal.toLocaleString(), chartLeft - 12, yPos);
  }

  // Draw Bars
  items.forEach((item, idx) => {
    const x = chartLeft + idx * step + (step - barWidth) / 2;
    const h = (item.value / maxVal) * chartHeight;
    const y = chartTop + chartHeight - h;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, chartTop + chartHeight);
    grad.addColorStop(0, item.color);
    grad.addColorStop(1, `${item.color}CC`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, h, [6, 6, 0, 0]);
    ctx.fill();

    // Value on top
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.value.toLocaleString(), x + barWidth / 2, y - 8);

    // Label on bottom
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10.5px "Segoe UI", Arial, sans-serif';
    ctx.fillText(item.label, x + barWidth / 2, chartTop + chartHeight + 20);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px "Segoe UI", Arial, sans-serif';
    ctx.fillText(item.sub, x + barWidth / 2, chartTop + chartHeight + 35);
  });

  // Footer Note
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, H - 32, W, 32);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(0, H - 32, W, 32);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 10px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Chi so phan tich the hien ty le giu chan va chuyen doi tu khach vang lai sang nguoi dung trung thanh', W / 2, H - 16);

  return canvas.toDataURL('image/png');
}

/**
 * 2. Biểu đồ Đa Tuyến Xu Hướng 30 Ngày (Multi-Series Area/Line Trend Chart)
 */
function renderDailyTrendChart(history: Array<{ date: string; visitors: number; chatUsers: number; chats: number; messages: number }>): string {
  const W = 960;
  const H = 420;
  const { canvas, ctx } = createHiDPICanvas(W, H);

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Header Bar
  ctx.fillStyle = '#1B365D';
  ctx.fillRect(0, 0, W, 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BIEU DO DIEN BIEN XU HUONG TRUY CAP & HOI BENH THEO NGAY', 24, 25);

  // Legend on Header
  const legends = [
    { label: 'Truy Cap (Visitors)', color: '#2563EB' },
    { label: 'Nguoi Chat (Users)', color: '#059669' },
    { label: 'Tin Nhan Y Te (Messages)', color: '#7C3AED' }
  ];

  let legX = W - 24;
  ctx.font = '10.5px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  for (let i = legends.length - 1; i >= 0; i--) {
    const leg = legends[i];
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(leg.label, legX, 25);
    const textW = ctx.measureText(leg.label).width;
    legX -= (textW + 8);

    ctx.fillStyle = leg.color;
    ctx.beginPath();
    ctx.arc(legX, 25, 4.5, 0, Math.PI * 2);
    ctx.fill();
    legX -= 18;
  }

  const list = history.length > 0 ? history : [
    { date: '01/09', visitors: 10, chatUsers: 4, chats: 4, messages: 18 }
  ];

  const chartLeft = 65;
  const chartTop = 85;
  const chartWidth = W - 100;
  const chartHeight = 250;

  const maxVal = Math.max(
    ...list.map(d => Math.max(d.visitors || 0, d.messages || 0, d.chatUsers || 0)),
    10
  );

  // Gridlines & Y-Axis
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748B';
  ctx.font = '10px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = Math.round((maxVal / yTicks) * i);
    const yPos = chartTop + chartHeight - (chartHeight / yTicks) * i;

    ctx.beginPath();
    ctx.moveTo(chartLeft, yPos);
    ctx.lineTo(chartLeft + chartWidth, yPos);
    ctx.stroke();

    ctx.fillText(yVal.toLocaleString(), chartLeft - 10, yPos);
  }

  // Draw Series Function
  const drawSeries = (dataKey: 'visitors' | 'chatUsers' | 'messages', strokeColor: string, fillColor: string, drawArea = false) => {
    if (list.length === 0) return;
    const stepX = chartWidth / Math.max(list.length - 1, 1);

    const points: Array<{ x: number; y: number }> = list.map((d, idx) => ({
      x: chartLeft + idx * stepX,
      y: chartTop + chartHeight - ((d[dataKey] || 0) / maxVal) * chartHeight
    }));

    if (drawArea && points.length > 1) {
      const areaGrad = ctx.createLinearGradient(0, chartTop, 0, chartTop + chartHeight);
      areaGrad.addColorStop(0, fillColor);
      areaGrad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, chartTop + chartHeight);
      points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(points[points.length - 1].x, chartTop + chartHeight);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Data points (if list <= 15 items draw circles)
    if (list.length <= 16) {
      points.forEach(pt => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  };

  // Draw from back to front
  drawSeries('visitors', '#2563EB', 'rgba(37, 99, 235, 0.15)', true);
  drawSeries('messages', '#7C3AED', 'rgba(124, 58, 237, 0.10)', true);
  drawSeries('chatUsers', '#059669', 'rgba(5, 150, 105, 0.15)', true);

  // X-Axis Labels
  ctx.fillStyle = '#475569';
  ctx.font = '9px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const stepX = chartWidth / Math.max(list.length - 1, 1);
  const skipLabel = list.length > 15 ? 2 : 1;

  list.forEach((d, idx) => {
    if (idx % skipLabel === 0 || idx === list.length - 1) {
      const x = chartLeft + idx * stepX;
      // Show short date e.g. 05/09
      const shortDate = d.date.length >= 5 ? d.date.substring(0, 5) : d.date;
      ctx.fillText(shortDate, x, chartTop + chartHeight + 8);
    }
  });

  // Footer
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, H - 32, W, 32);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(0, H - 32, W, 32);

  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 10px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('He thong giam sat chuoi thoi gian (Time-series Analysis) danh gia do on dinh va luu luong hoi dap truc tuyen', W / 2, H - 16);

  return canvas.toDataURL('image/png');
}

/**
 * 3. Biểu đồ Thanh Ngang Tỷ Trọng Trang Truy Cập (Horizontal Bar Chart)
 */
function renderPageShareChart(pages: TopVisitedPage[]): string {
  const W = 880;
  const H = 340;
  const { canvas, ctx } = createHiDPICanvas(W, H);

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#1B365D';
  ctx.fillRect(0, 0, W, 46);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TY TRONG LUU LUONG TRUY CAP THEO TRANG / CHUC NANG', 24, 23);

  const list = pages.slice(0, 5);
  const maxViews = Math.max(...list.map(p => p.views || 0), 1);

  const startY = 75;
  const rowH = 46;
  const barLeft = 240;
  const maxBarW = W - barLeft - 140;

  list.forEach((p, idx) => {
    const y = startY + idx * rowH;
    const barW = ((p.views || 0) / maxViews) * maxBarW;

    // Rank & Title
    ctx.fillStyle = '#1B365D';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${idx + 1}. ${p.pageName}`, 24, y + 10);

    ctx.fillStyle = '#64748B';
    ctx.font = '9px Consolas, monospace';
    ctx.fillText(p.path, 24, y + 26);

    // Background bar track
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(barLeft, y + 8, maxBarW, 18, 4);
    ctx.fill();

    // Actual bar
    const barGrad = ctx.createLinearGradient(barLeft, 0, barLeft + barW, 0);
    barGrad.addColorStop(0, '#2563EB');
    barGrad.addColorStop(1, '#60A5FA');

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barLeft, y + 8, Math.max(barW, 6), 18, 4);
    ctx.fill();

    // Value & Pct
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${(p.views || 0).toLocaleString()} views (${p.percentage || 0}%)`, barLeft + barW + 12, y + 17);
  });

  return canvas.toDataURL('image/png');
}

/**
 * 4. Biểu đồ Top Thao Tác / Sự Kiện Người Dùng (Horizontal Action Ranking)
 */
function renderActionShareChart(actions: TopUserAction[]): string {
  const W = 880;
  const H = 360;
  const { canvas, ctx } = createHiDPICanvas(W, H);

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#1B365D';
  ctx.fillRect(0, 0, W, 46);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOP HANH VI & THAO TAC NGUOI DUNG TUONG TAC NHIEU NHAT', 24, 23);

  const list = actions.slice(0, 6);
  const maxClicks = Math.max(...list.map(a => a.count || 0), 1);

  const startY = 70;
  const rowH = 42;
  const barLeft = 280;
  const maxBarW = W - barLeft - 130;

  list.forEach((act, idx) => {
    const y = startY + idx * rowH;
    const barW = ((act.count || 0) / maxClicks) * maxBarW;

    // Action Name
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${idx + 1}. ${act.actionName}`, 24, y + 10);

    ctx.fillStyle = '#64748B';
    ctx.font = '9px Consolas, monospace';
    ctx.fillText(`[${act.category}] ${act.actionType}`, 24, y + 24);

    // Bar Track
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(barLeft, y + 6, maxBarW, 16, 4);
    ctx.fill();

    // Actual Bar
    const barGrad = ctx.createLinearGradient(barLeft, 0, barLeft + barW, 0);
    barGrad.addColorStop(0, '#7C3AED');
    barGrad.addColorStop(1, '#A78BFA');

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barLeft, y + 6, Math.max(barW, 6), 16, 4);
    ctx.fill();

    // Value
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${(act.count || 0).toLocaleString()} clicks (${act.percentage || 0}%)`, barLeft + barW + 10, y + 14);
  });

  return canvas.toDataURL('image/png');
}

// ─────────────────────────────────────────────────────────────
// EXPORT EXCEL MAIN FUNCTION
// ─────────────────────────────────────────────────────────────

export async function exportDashboardStatsToExcel(stats: SystemStats, timeRange: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vethic AI Analytics Engine';
  workbook.lastModifiedBy = 'Data Analyst - Vethic System';
  workbook.created = new Date();

  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');
  const timeStr = now.toLocaleTimeString('vi-VN');
  const rangeLabel = timeRange === '30days' ? '30 Ngay Gan Nhat' : '7 Ngay Gan Nhat';

  const FONT_FAMILY = 'Segoe UI';

  const brandNavyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B365D' }
  };

  const tableHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2C3E50' }
  };

  const subHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF34495E' }
  };

  const totalRowFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEAECEE' }
  };

  const zebraRowFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  const totalBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'double', color: { argb: 'FF1E293B' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  const getDayOfWeekVN = (dStr: string): string => {
    try {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const days = ['CN', 'Thu 2', 'Thu 3', 'Thu 4', 'Thu 5', 'Thu 6', 'Thu 7'];
        return days[d.getDay()] || '';
      }
    } catch {
      return '';
    }
    return '';
  };

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: Executive_Summary
  // ─────────────────────────────────────────────────────────────
  const wsSummary = workbook.addWorksheet('Executive_Summary', {
    views: [{ showGridLines: true }]
  });

  wsSummary.columns = [
    { width: 4 },   // A
    { width: 14 },  // B: Code
    { width: 38 },  // C: Metric Name
    { width: 22 },  // D: Value
    { width: 18 },  // E: Unit
    { width: 48 }   // F: Description
  ];

  // Title Block
  wsSummary.mergeCells('B2:F2');
  const titleCell = wsSummary.getCell('B2');
  titleCell.value = 'BAO CAO THONG KE & HIEU SUAT HE THONG - VETHIC AI';
  titleCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = brandNavyFill;
  wsSummary.getRow(2).height = 36;

  // Metadata Block
  wsSummary.mergeCells('B3:F3');
  const metaCell = wsSummary.getCell('B3');
  metaCell.value = `Pham vi: ${rangeLabel} | Thoi gian xuat: ${dateStr} ${timeStr} | Moi truong: Production Telemetry`;
  metaCell.font = { name: FONT_FAMILY, size: 9.5, italic: true, color: { argb: 'FF475569' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(3).height = 20;

  // Section 1: Core KPIs
  let curRow = 5;
  wsSummary.getCell(`B${curRow}`).value = '1. CHI SO HOAT DONG COT LOI (CORE KPIS)';
  wsSummary.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF1B365D' } };
  curRow++;

  const kpiHeaders = ['Ma Chi So', 'Ten Chi So Thong Ke', 'Gia Tri', 'Don Vi Tinh', 'Dinh Nghia & Y Nghia'];
  const kpiHeaderRow = wsSummary.getRow(curRow);
  kpiHeaders.forEach((h, idx) => {
    const cell = kpiHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = tableHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 2 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  kpiHeaderRow.height = 24;
  curRow++;

  const coreKpiData = [
    ['MET_VISITORS', 'Tong Luot Ghe Tham (Website Visitors)', stats.websiteVisitors || 0, 'Luot truy cap', 'Tong so luot truy cap toan bo he thong web'],
    ['MET_UNIQUE_VISITORS', 'Nguoi Dung Doc Lap (Unique Visitors)', stats.uniqueVisitors || 0, 'Nguoi dung (IP/Device)', 'So luong thiet bi / dia chi IP truy cap duy nhat'],
    ['MET_PAGE_VIEWS', 'Tong Luot Xem Trang (Page Views)', stats.pageViews || 0, 'Luot xem', 'Tong so luot xem cac trang chuc nang'],
    ['MET_ACTIVE_USERS', 'Nguoi Dung Tuong Tac (Active Users)', stats.activeUsers || 0, 'Nguoi dung', 'Nguoi dung co hanh vi bam nut hoac gui tin nhan'],
    ['MET_CHAT_USERS', 'Nguoi Su Dung Chatbot (Chat Users)', stats.chatUsers || 0, 'Nguoi dung', 'Nguoi dung da khoi tao tu van y te voi AI'],
    ['MET_GUEST_USERS', 'Khach Vang Lai (Guest Users)', stats.guestChatUsers || 0, 'Khach dung thu', 'Nguoi dung chua dang nhap (gioi han 8 tin nhan)'],
    ['MET_REGISTERED_USERS', 'Tai Khoan Chinh Thuc (Registered Users)', stats.registeredUsers || 0, 'Tai khoan', 'Nguoi dung da dang ky va xac thuc tai khoan'],
    ['MET_CHAT_SESSIONS', 'Tong So Phien Hoi Thoai (Chat Sessions)', stats.chatSessions || 0, 'Phien hoi thoai', 'So cuoc tro chuyen chan doan y te duoc tao'],
    ['MET_TOTAL_MESSAGES', 'Tong So Tin Nhan Y Te (Total Messages)', stats.totalMessages || 0, 'Tin nhan', 'So tin nhan trao doi 2 chieu giua user va AI']
  ];

  coreKpiData.forEach((row, rIdx) => {
    const rObj = wsSummary.getRow(curRow);
    row.forEach((val, cIdx) => {
      const cell = rObj.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
        cell.alignment = { horizontal: 'left' };
      } else if (cIdx === 1) {
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 2) {
        cell.numFmt = '#,##0';
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'right' };
      }

      if (rIdx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });
    rObj.height = 20;
    curRow++;
  });

  // Section 2: Conversion & Performance Rates
  curRow += 2;
  wsSummary.getCell(`B${curRow}`).value = '2. HIEU SUAT CHUYEN DOI & TUONG TAC (CONVERSION & EFFICIENCY)';
  wsSummary.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF1B365D' } };
  curRow++;

  const rateHeaderRow = wsSummary.getRow(curRow);
  kpiHeaders.forEach((h, idx) => {
    const cell = rateHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = subHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 2 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  rateHeaderRow.height = 24;
  curRow++;

  const conversionData = [
    ['RATE_VISITOR_TO_CHAT', 'Ty Le Chuyen Doi Truy Cap Sang Chat', (stats.visitorToChatRate || 0) / 100, '% Chuyen doi', 'Ty le giua so nguoi chat tren tong so luot truy cap'],
    ['RATE_GUEST_TO_REGISTER', 'Ty Le Chuyen Doi Khach Sang Tai Khoan', (stats.guestToRegisteredRate || 0) / 100, '% Dang ky', 'Ty le khach dung thu chuyen doi tao tai khoan chinh thuc'],
    ['AVG_MESSAGES_PER_SESSION', 'Do Sau Hoi Thoai Trung Binh (Depth)', Number(stats.avgMessagesPerSession) || 0, 'Tin nhan / Phien', 'So luong tin nhan trung binh trong mot phien hoi benh'],
    ['RATE_USER_GROWTH', 'Toc Do Tang Truong Nguoi Dung (Growth)', (stats.userGrowth || 0) / 100, '% Tang truong', 'Toc do tang truong tai khoan so voi ky truoc']
  ];

  conversionData.forEach((row, rIdx) => {
    const rObj = wsSummary.getRow(curRow);
    row.forEach((val, cIdx) => {
      const cell = rObj.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
        cell.alignment = { horizontal: 'left' };
      } else if (cIdx === 1) {
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 2) {
        if (typeof val === 'number' && (rIdx === 0 || rIdx === 1 || rIdx === 3)) {
          cell.numFmt = '0.0%';
        } else {
          cell.numFmt = '#,##0.0';
        }
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF1B365D' } };
        cell.alignment = { horizontal: 'right' };
      }

      if (rIdx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });
    rObj.height = 20;
    curRow++;
  });

  // Section 3: User Funnel Drop-off Analysis Table
  curRow += 2;
  wsSummary.getCell(`B${curRow}`).value = '3. PHAN TICH PHIEU NGUOI DUNG & DROP-OFF (USER FUNNEL ANALYSIS)';
  wsSummary.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF1B365D' } };
  curRow++;

  const funnelHeaders = ['Tang Phieu (Funnel Step)', 'Doi Tuong', 'So Luong', 'Ty Le Giu Chan (% Retention)', 'Dinh Huong Toi Uu Hoa'];
  const funnelHeaderRow = wsSummary.getRow(curRow);
  funnelHeaders.forEach((h, idx) => {
    const cell = funnelHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = tableHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 2 || idx === 3 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  funnelHeaderRow.height = 24;
  curRow++;

  const totalVisitors = Math.max(stats.websiteVisitors || 1, 1);
  const funnelData = [
    ['Tang 1: Awareness', 'Website Visitors (Nguoi truy cap)', stats.websiteVisitors || 0, 1.0, 'Duy tri SEO & bai viet truyen thong thu hut luu luong'],
    ['Tang 2: Engagement', 'Active Users (Nguoi tuong tac)', stats.activeUsers || 0, (stats.activeUsers || 0) / totalVisitors, 'Toi uu toc do tai trang va giao dien thu hut nut bam'],
    ['Tang 3: Consideration', 'Chat Users (Hoi dap bac si AI)', stats.chatUsers || 0, (stats.chatUsers || 0) / totalVisitors, 'Goi y cau hoi mau chuan y khoa ngay tai trang chu'],
    ['Tang 4: Conversion', 'Registered Users (Tai khoan chinh thuc)', stats.registeredUsers || 0, (stats.registeredUsers || 0) / totalVisitors, 'Thong bao loi ich khi tao tai khoan de luu lich su']
  ];

  funnelData.forEach((row, rIdx) => {
    const rObj = wsSummary.getRow(curRow);
    row.forEach((val, cIdx) => {
      const cell = rObj.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF1B365D' } };
      } else if (cIdx === 2) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 3) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF059669' } };
      }

      if (rIdx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });
    rObj.height = 20;
    curRow++;
  });

  // Embed Executive KPI Chart
  curRow += 2;
  try {
    const kpiChartBase64 = renderExecutiveKpiChart(stats);
    const kpiImgId = workbook.addImage({
      base64: kpiChartBase64.replace(/^data:image\/png;base64,/, ''),
      extension: 'png'
    });
    wsSummary.addImage(kpiImgId, {
      tl: { col: 1, row: curRow - 1 },
      ext: { width: 780, height: 340 }
    });
    // Reserve rows for the image
    curRow += 18;
  } catch (err) {
    console.error('Error rendering KPI chart:', err);
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: Daily_Traffic_Trends
  // ─────────────────────────────────────────────────────────────
  const wsTrends = workbook.addWorksheet('Daily_Traffic_Trends', {
    views: [{ showGridLines: true }]
  });

  wsTrends.columns = [
    { width: 4 },   // A
    { width: 8 },   // B: STT
    { width: 14 },  // C: Ngay
    { width: 12 },  // D: Thu
    { width: 18 },  // E: Visitors
    { width: 18 },  // F: Chat Users
    { width: 18 },  // G: Sessions
    { width: 18 },  // H: Messages
    { width: 18 },  // I: Registrations
    { width: 18 },  // J: Conversion Rate %
    { width: 18 }   // K: Msg/Session
  ];

  // Title
  wsTrends.mergeCells('B2:K2');
  const tTitle = wsTrends.getCell('B2');
  tTitle.value = 'CHUOI DU LIEU XU HUONG TRUY CAP & TUONG TAC THEO NGAY';
  tTitle.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  tTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  tTitle.fill = brandNavyFill;
  wsTrends.getRow(2).height = 32;

  // Metadata
  wsTrends.mergeCells('B3:K3');
  const tMeta = wsTrends.getCell('B3');
  tMeta.value = `Chu ky: ${rangeLabel} | Nguon: Log Telemetry Database | Dinh dang: Phuc vu phan tich BI & Data Science`;
  tMeta.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: 'FF64748B' } };
  tMeta.alignment = { vertical: 'middle', horizontal: 'center' };
  wsTrends.getRow(3).height = 18;

  const trendCols = [
    'STT',
    'Ngay (Date)',
    'Thu',
    'Truy Cap (Visitors)',
    'Nguoi Chat (Users)',
    'Phien Chat (Sessions)',
    'Tin Nhan (Messages)',
    'Dang Ky (Signups)',
    'Ty Le Chat/Visitor',
    'Tin Nhan/Phien'
  ];

  const trendHeaderRow = wsTrends.getRow(5);
  trendCols.forEach((colName, idx) => {
    const cell = trendHeaderRow.getCell(idx + 2);
    cell.value = colName;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = tableHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx <= 2 ? 'center' : 'right' };
    cell.border = thinBorder;
  });
  trendHeaderRow.height = 24;

  let trendRowIdx = 6;
  const historyList = stats.history || [];

  historyList.forEach((h, idx) => {
    const r = wsTrends.getRow(trendRowIdx);
    const dayOfWeek = getDayOfWeekVN(h.date);
    const convRate = h.visitors > 0 ? (h.chatUsers / h.visitors) : 0;
    const avgMsg = h.chats > 0 ? (h.messages / h.chats) : 0;

    const rowVals = [
      idx + 1,
      h.date,
      dayOfWeek,
      h.visitors || 0,
      h.chatUsers || 0,
      h.chats || 0,
      h.messages || 0,
      h.users || 0,
      convRate,
      avgMsg
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0 || cIdx === 2) {
        cell.alignment = { horizontal: 'center' };
      } else if (cIdx === 1) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 8) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, color: { argb: 'FF1B365D' } };
      } else if (cIdx === 9) {
        cell.numFmt = '#,##0.0';
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      }

      if (idx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });

    r.height = 20;
    trendRowIdx++;
  });

  // Summary Rows: SUM, AVERAGE, MAX
  if (historyList.length > 0) {
    const startR = 6;
    const endR = trendRowIdx - 1;

    // 1. TONG CONG (SUM)
    const sumRow = wsTrends.getRow(trendRowIdx);
    wsTrends.mergeCells(`B${trendRowIdx}:D${trendRowIdx}`);
    const sumLabel = sumRow.getCell(2);
    sumLabel.value = 'TONG CONG (SUM)';
    sumLabel.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    sumLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    ['B', 'C', 'D'].forEach(c => {
      sumRow.getCell(c).fill = totalRowFill;
      sumRow.getCell(c).border = thinBorder;
    });

    ['E', 'F', 'G', 'H', 'I'].forEach((colLetter, cIdx) => {
      const cell = sumRow.getCell(cIdx + 5);
      cell.value = { formula: `SUM(${colLetter}${startR}:${colLetter}${endR})` };
      cell.numFmt = '#,##0';
      cell.font = { name: FONT_FAMILY, size: 10, bold: true };
      cell.alignment = { horizontal: 'right' };
      cell.fill = totalRowFill;
      cell.border = thinBorder;
    });

    const convCell = sumRow.getCell(10);
    convCell.value = { formula: `F${trendRowIdx}/E${trendRowIdx}` };
    convCell.numFmt = '0.0%';
    convCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    convCell.alignment = { horizontal: 'right' };
    convCell.fill = totalRowFill;
    convCell.border = thinBorder;

    const msgDepthCell = sumRow.getCell(11);
    msgDepthCell.value = { formula: `H${trendRowIdx}/G${trendRowIdx}` };
    msgDepthCell.numFmt = '#,##0.0';
    msgDepthCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    msgDepthCell.alignment = { horizontal: 'right' };
    msgDepthCell.fill = totalRowFill;
    msgDepthCell.border = thinBorder;

    sumRow.height = 22;
    trendRowIdx++;

    // 2. TRUNG BINH NGAY (AVERAGE)
    const avgRow = wsTrends.getRow(trendRowIdx);
    wsTrends.mergeCells(`B${trendRowIdx}:D${trendRowIdx}`);
    const avgLabel = avgRow.getCell(2);
    avgLabel.value = 'TRUNG BINH NGAY (AVERAGE)';
    avgLabel.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF334155' } };
    avgLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    ['B', 'C', 'D'].forEach(c => {
      avgRow.getCell(c).fill = totalRowFill;
      avgRow.getCell(c).border = thinBorder;
    });

    ['E', 'F', 'G', 'H', 'I'].forEach((colLetter, cIdx) => {
      const cell = avgRow.getCell(cIdx + 5);
      cell.value = { formula: `AVERAGE(${colLetter}${startR}:${colLetter}${endR})` };
      cell.numFmt = '#,##0.0';
      cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      cell.alignment = { horizontal: 'right' };
      cell.fill = totalRowFill;
      cell.border = thinBorder;
    });

    const avgConv = avgRow.getCell(10);
    avgConv.value = { formula: `AVERAGE(J${startR}:J${endR})` };
    avgConv.numFmt = '0.0%';
    avgConv.font = { name: FONT_FAMILY, size: 9.5, bold: true };
    avgConv.alignment = { horizontal: 'right' };
    avgConv.fill = totalRowFill;
    avgConv.border = thinBorder;

    const avgDepth = avgRow.getCell(11);
    avgDepth.value = { formula: `AVERAGE(K${startR}:K${endR})` };
    avgDepth.numFmt = '#,##0.0';
    avgDepth.font = { name: FONT_FAMILY, size: 9.5, bold: true };
    avgDepth.alignment = { horizontal: 'right' };
    avgDepth.fill = totalRowFill;
    avgDepth.border = thinBorder;

    avgRow.height = 20;
    trendRowIdx++;

    // 3. CAO NHAT (MAX)
    const maxRow = wsTrends.getRow(trendRowIdx);
    wsTrends.mergeCells(`B${trendRowIdx}:D${trendRowIdx}`);
    const maxLabel = maxRow.getCell(2);
    maxLabel.value = 'CAO NHAT TRONG KY (MAX)';
    maxLabel.font = { name: FONT_FAMILY, size: 9.5, color: { argb: 'FF64748B' } };
    maxLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    ['B', 'C', 'D'].forEach(c => {
      maxRow.getCell(c).border = totalBorder;
    });

    ['E', 'F', 'G', 'H', 'I'].forEach((colLetter, cIdx) => {
      const cell = maxRow.getCell(cIdx + 5);
      cell.value = { formula: `MAX(${colLetter}${startR}:${colLetter}${endR})` };
      cell.numFmt = '#,##0';
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.alignment = { horizontal: 'right' };
      cell.border = totalBorder;
    });

    const maxConv = maxRow.getCell(10);
    maxConv.value = { formula: `MAX(J${startR}:J${endR})` };
    maxConv.numFmt = '0.0%';
    maxConv.alignment = { horizontal: 'right' };
    maxConv.border = totalBorder;

    const maxDepth = maxRow.getCell(11);
    maxDepth.value = { formula: `MAX(K${startR}:K${endR})` };
    maxDepth.numFmt = '#,##0.0';
    maxDepth.alignment = { horizontal: 'right' };
    maxDepth.border = totalBorder;

    maxRow.height = 20;
    trendRowIdx += 2;
  }

  // Embed 30-Day Multi-Series Trend Chart
  try {
    const trendChartBase64 = renderDailyTrendChart(historyList);
    const trendImgId = workbook.addImage({
      base64: trendChartBase64.replace(/^data:image\/png;base64,/, ''),
      extension: 'png'
    });
    wsTrends.addImage(trendImgId, {
      tl: { col: 1, row: trendRowIdx },
      ext: { width: 880, height: 380 }
    });
  } catch (err) {
    console.error('Error rendering Trend chart:', err);
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: Page_Analytics
  // ─────────────────────────────────────────────────────────────
  const wsPages = workbook.addWorksheet('Page_Analytics', {
    views: [{ showGridLines: true }]
  });

  wsPages.columns = [
    { width: 4 },   // A
    { width: 12 },  // B: Rank
    { width: 32 },  // C: Page Name
    { width: 24 },  // D: Route
    { width: 20 },  // E: Page Views
    { width: 22 },  // F: Unique Visitors
    { width: 20 },  // G: Traffic Share %
    { width: 20 }   // H: Cumulative Share %
  ];

  // Title
  wsPages.mergeCells('B2:H2');
  const pTitle = wsPages.getCell('B2');
  pTitle.value = 'PHAN TICH LUU LUONG & HIEN THI TRANG TRUY CAP';
  pTitle.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  pTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  pTitle.fill = brandNavyFill;
  wsPages.getRow(2).height = 32;

  // Metadata
  wsPages.mergeCells('B3:H3');
  const pMeta = wsPages.getCell('B3');
  pMeta.value = `Ghi chu: Chi thong ke cac module dang hoat dong thuc te tren he thong | Chu ky: ${rangeLabel}`;
  pMeta.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: 'FF64748B' } };
  pMeta.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPages.getRow(3).height = 18;

  const pageCols = [
    'Xep Hang',
    'Ten Trang / Chuc Nang',
    'Duong Dan (Route)',
    'Luot Xem (Pageviews)',
    'Khach Doc Lap (Unique)',
    'Ty Trong Luu Luong (%)',
    'Ty Trong Luy Ke (%)'
  ];

  const pageHeaderRow = wsPages.getRow(5);
  pageCols.forEach((colName, idx) => {
    const cell = pageHeaderRow.getCell(idx + 2);
    cell.value = colName;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = tableHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx <= 2 ? 'left' : 'right' };
    if (idx === 0) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  pageHeaderRow.height = 24;

  let pageRowIdx = 6;
  const topPagesList = stats.topPages || [];
  let cumulativeShare = 0;

  topPagesList.forEach((p, idx) => {
    const r = wsPages.getRow(pageRowIdx);
    const pShare = (p.percentage || 0) / 100;
    cumulativeShare += pShare;

    const rowVals = [
      `Top ${idx + 1}`,
      p.pageName,
      p.path,
      p.views || 0,
      p.uniqueVisitors || 0,
      pShare,
      Math.min(1, cumulativeShare)
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF1B365D' } };
      } else if (cIdx === 1) {
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 2) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
      } else if (cIdx === 3 || cIdx === 4) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (cIdx === 5 || cIdx === 6) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: cIdx === 5 };
      }

      if (idx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });

    r.height = 20;
    pageRowIdx++;
  });

  // Pages Total Row
  if (topPagesList.length > 0) {
    const pSumRow = wsPages.getRow(pageRowIdx);
    wsPages.mergeCells(`B${pageRowIdx}:D${pageRowIdx}`);
    const pSumLabel = pSumRow.getCell(2);
    pSumLabel.value = 'TONG CONG';
    pSumLabel.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    pSumLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    ['B', 'C', 'D'].forEach(c => {
      pSumRow.getCell(c).fill = totalRowFill;
      pSumRow.getCell(c).border = totalBorder;
    });

    const startPR = 6;
    const endPR = pageRowIdx - 1;

    const sumViewsCell = pSumRow.getCell(5);
    sumViewsCell.value = { formula: `SUM(E${startPR}:E${endPR})` };
    sumViewsCell.numFmt = '#,##0';
    sumViewsCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumViewsCell.alignment = { horizontal: 'right' };
    sumViewsCell.fill = totalRowFill;
    sumViewsCell.border = totalBorder;

    const sumUniqCell = pSumRow.getCell(6);
    sumUniqCell.value = { formula: `SUM(F${startPR}:F${endPR})` };
    sumUniqCell.numFmt = '#,##0';
    sumUniqCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumUniqCell.alignment = { horizontal: 'right' };
    sumUniqCell.fill = totalRowFill;
    sumUniqCell.border = totalBorder;

    const sumShareCell = pSumRow.getCell(7);
    sumShareCell.value = { formula: `SUM(G${startPR}:G${endPR})` };
    sumShareCell.numFmt = '0.0%';
    sumShareCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    sumShareCell.alignment = { horizontal: 'right' };
    sumShareCell.fill = totalRowFill;
    sumShareCell.border = totalBorder;

    const cumLastCell = pSumRow.getCell(8);
    cumLastCell.value = 1.0;
    cumLastCell.numFmt = '0.0%';
    cumLastCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    cumLastCell.alignment = { horizontal: 'right' };
    cumLastCell.fill = totalRowFill;
    cumLastCell.border = totalBorder;

    pSumRow.height = 22;
    pageRowIdx += 2;
  }

  // Embed Page Share Chart
  try {
    const pageChartBase64 = renderPageShareChart(topPagesList);
    const pageImgId = workbook.addImage({
      base64: pageChartBase64.replace(/^data:image\/png;base64,/, ''),
      extension: 'png'
    });
    wsPages.addImage(pageImgId, {
      tl: { col: 1, row: pageRowIdx },
      ext: { width: 780, height: 300 }
    });
  } catch (err) {
    console.error('Error rendering Page chart:', err);
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 4: User_Interaction_Events
  // ─────────────────────────────────────────────────────────────
  const wsActions = workbook.addWorksheet('User_Interaction_Events', {
    views: [{ showGridLines: true }]
  });

  wsActions.columns = [
    { width: 4 },   // A
    { width: 12 },  // B: Rank
    { width: 36 },  // C: Action Name
    { width: 22 },  // D: Category
    { width: 28 },  // E: Event Key
    { width: 20 },  // F: Count
    { width: 20 },  // G: Unique Users
    { width: 18 },  // H: Share %
    { width: 18 }   // I: Frequency per User
  ];

  // Title
  wsActions.mergeCells('B2:I2');
  const aTitle = wsActions.getCell('B2');
  aTitle.value = 'THONG KE SU KIEN & TUONG TAC NGUOI DUNG (FEATURE INTERACTIONS)';
  aTitle.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  aTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  aTitle.fill = brandNavyFill;
  wsActions.getRow(2).height = 32;

  // Metadata
  wsActions.mergeCells('B3:I3');
  const aMeta = wsActions.getCell('B3');
  aMeta.value = `Giam sat cac nut bam, hanh vi dieu huong, tim kiem va tra cuu truc tuyen tren nen tang`;
  aMeta.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: 'FF64748B' } };
  aMeta.alignment = { vertical: 'middle', horizontal: 'center' };
  wsActions.getRow(3).height = 18;

  const actionCols = [
    'Xep Hang',
    'Ten Hanh Vi / Thao Tac',
    'Nhom Nghiep Vu',
    'Ma Su Kien Telemetry',
    'Tong Luot Bam (Clicks)',
    'Nguoi Thuc Hien (Users)',
    'Ty Trong (%)',
    'Tan Suat/Nguoi'
  ];

  const actionHeaderRow = wsActions.getRow(5);
  actionCols.forEach((colName, idx) => {
    const cell = actionHeaderRow.getCell(idx + 2);
    cell.value = colName;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = tableHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx <= 3 ? 'left' : 'right' };
    if (idx === 0) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  actionHeaderRow.height = 24;

  let actRowIdx = 6;
  const topActionsList = stats.topActions || [];

  topActionsList.forEach((act, idx) => {
    const r = wsActions.getRow(actRowIdx);
    const uCount = act.uniqueUsers || 1;
    const avgFreq = act.count ? (act.count / uCount) : 0;

    const rowVals = [
      `Top ${idx + 1}`,
      act.actionName,
      act.category,
      act.actionType,
      act.count || 0,
      act.uniqueUsers || 0,
      (act.percentage || 0) / 100,
      avgFreq
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF1B365D' } };
      } else if (cIdx === 1) {
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 2) {
        cell.alignment = { horizontal: 'left' };
        cell.font = { name: FONT_FAMILY, size: 9.5, color: { argb: 'FF334155' } };
      } else if (cIdx === 3) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
      } else if (cIdx === 4 || cIdx === 5) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (cIdx === 6) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF1B365D' } };
      } else if (cIdx === 7) {
        cell.numFmt = '#,##0.0';
        cell.alignment = { horizontal: 'right' };
      }

      if (idx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });

    r.height = 20;
    actRowIdx++;
  });

  // Actions Total Row
  if (topActionsList.length > 0) {
    const aSumRow = wsActions.getRow(actRowIdx);
    wsActions.mergeCells(`B${actRowIdx}:E${actRowIdx}`);
    const aSumLabel = aSumRow.getCell(2);
    aSumLabel.value = 'TONG CONG SU KIEN';
    aSumLabel.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    aSumLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    ['B', 'C', 'D', 'E'].forEach(c => {
      aSumRow.getCell(c).fill = totalRowFill;
      aSumRow.getCell(c).border = totalBorder;
    });

    const startAR = 6;
    const endAR = actRowIdx - 1;

    const sumClicksCell = aSumRow.getCell(6);
    sumClicksCell.value = { formula: `SUM(F${startAR}:F${endAR})` };
    sumClicksCell.numFmt = '#,##0';
    sumClicksCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumClicksCell.alignment = { horizontal: 'right' };
    sumClicksCell.fill = totalRowFill;
    sumClicksCell.border = totalBorder;

    const sumUsersCell = aSumRow.getCell(7);
    sumUsersCell.value = { formula: `SUM(G${startAR}:G${endAR})` };
    sumUsersCell.numFmt = '#,##0';
    sumUsersCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumUsersCell.alignment = { horizontal: 'right' };
    sumUsersCell.fill = totalRowFill;
    sumUsersCell.border = totalBorder;

    const sumShareCell = aSumRow.getCell(8);
    sumShareCell.value = { formula: `SUM(H${startAR}:H${endAR})` };
    sumShareCell.numFmt = '0.0%';
    sumShareCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    sumShareCell.alignment = { horizontal: 'right' };
    sumShareCell.fill = totalRowFill;
    sumShareCell.border = totalBorder;

    const avgFreqCell = aSumRow.getCell(9);
    avgFreqCell.value = { formula: `F${actRowIdx}/G${actRowIdx}` };
    avgFreqCell.numFmt = '#,##0.0';
    avgFreqCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    avgFreqCell.alignment = { horizontal: 'right' };
    avgFreqCell.fill = totalRowFill;
    avgFreqCell.border = totalBorder;

    aSumRow.height = 22;
    actRowIdx += 2;
  }

  // Embed Action Share Chart
  try {
    const actChartBase64 = renderActionShareChart(topActionsList);
    const actImgId = workbook.addImage({
      base64: actChartBase64.replace(/^data:image\/png;base64,/, ''),
      extension: 'png'
    });
    wsActions.addImage(actImgId, {
      tl: { col: 1, row: actRowIdx },
      ext: { width: 780, height: 320 }
    });
  } catch (err) {
    console.error('Error rendering Action chart:', err);
  }

  // ─────────────────────────────────────────────────────────────
  // GENERATE BLOB & TRIGGER BROWSER DOWNLOAD
  // ─────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const filenameDate = new Date().toISOString().split('T')[0];
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Vethic_System_Analytics_Report_${timeRange}_${filenameDate}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
