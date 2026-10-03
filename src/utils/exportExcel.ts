import ExcelJS from 'exceljs';
import { SystemStats } from '../types';

/**
 * Xuất toàn bộ báo cáo thống kê & telemetry chuẩn Data Analyst sang file Excel (.xlsx).
 * Không sử dụng icon/emoji trong nội dung và sheet name.
 * Định dạng chuẩn Corporate BI: font chữ Segoe UI, bảng số liệu rõ ràng, đầy đủ công thức SUM/AVERAGE/MAX/MIN,
 * phân tích tỷ trọng, lũy kế và phân cấp định dạng chuyên nghiệp.
 */
export async function exportDashboardStatsToExcel(stats: SystemStats, timeRange: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vethic AI Analytics Engine';
  workbook.lastModifiedBy = 'Data Analyst - Vethic System';
  workbook.created = new Date();

  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');
  const timeStr = now.toLocaleTimeString('vi-VN');
  const rangeLabel = timeRange === '30days' ? '30 Ngay Gan Nhat' : '7 Ngay Gan Nhat';

  // ─────────────────────────────────────────────────────────────
  // 1. CORPORATE DESIGN SYSTEM & PALETTE (Classic Navy / Steel Blue)
  // ─────────────────────────────────────────────────────────────
  const FONT_FAMILY = 'Segoe UI';

  const brandNavyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B365D' } // Deep Corporate Navy
  };

  const tableHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2C3E50' } // Slate Navy
  };

  const subHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF34495E' } // Steel Gray
  };

  const totalRowFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEAECEE' } // Light Cool Gray
  };

  const zebraRowFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' } // Soft Off-White
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

  // Helper for Vietnamese Day of Week
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
  // SHEET 1: Executive_Summary (Tong Quan & Chi So Dieu Hanh)
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
    { width: 45 }   // F: Description
  ];

  // Report Title Block
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

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: Daily_Traffic_Trends (Xu Huong Luu Luong Theo Ngay)
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

  // Summary Rows: SUM, AVERAGE, MAX, MIN
  if (historyList.length > 0) {
    const startR = 6;
    const endR = trendRowIdx - 1;

    // 1. TONG CONG (SUM)
    const sumRow = wsTrends.getRow(trendRowIdx);
    sumRow.getCell(2).value = '';
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

    // Conv Rate Overall
    const convCell = sumRow.getCell(10);
    convCell.value = { formula: `F${trendRowIdx}/E${trendRowIdx}` };
    convCell.numFmt = '0.0%';
    convCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    convCell.alignment = { horizontal: 'right' };
    convCell.fill = totalRowFill;
    convCell.border = thinBorder;

    // Msg / Session Overall
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
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: Page_Analytics (Phan Tich Trang & Luu Luong Tuyet Doi)
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

    // Sum Views
    const sumViewsCell = pSumRow.getCell(5);
    sumViewsCell.value = { formula: `SUM(E${startPR}:E${endPR})` };
    sumViewsCell.numFmt = '#,##0';
    sumViewsCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumViewsCell.alignment = { horizontal: 'right' };
    sumViewsCell.fill = totalRowFill;
    sumViewsCell.border = totalBorder;

    // Sum Uniques
    const sumUniqCell = pSumRow.getCell(6);
    sumUniqCell.value = { formula: `SUM(F${startPR}:F${endPR})` };
    sumUniqCell.numFmt = '#,##0';
    sumUniqCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumUniqCell.alignment = { horizontal: 'right' };
    sumUniqCell.fill = totalRowFill;
    sumUniqCell.border = totalBorder;

    // Sum Share
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
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 4: User_Interaction_Events (Phan Tich Hanh Vi & Su Kien)
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

    // Total clicks
    const sumClicksCell = aSumRow.getCell(6);
    sumClicksCell.value = { formula: `SUM(F${startAR}:F${endAR})` };
    sumClicksCell.numFmt = '#,##0';
    sumClicksCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumClicksCell.alignment = { horizontal: 'right' };
    sumClicksCell.fill = totalRowFill;
    sumClicksCell.border = totalBorder;

    // Total unique users
    const sumUsersCell = aSumRow.getCell(7);
    sumUsersCell.value = { formula: `SUM(G${startAR}:G${endAR})` };
    sumUsersCell.numFmt = '#,##0';
    sumUsersCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    sumUsersCell.alignment = { horizontal: 'right' };
    sumUsersCell.fill = totalRowFill;
    sumUsersCell.border = totalBorder;

    // Total share %
    const sumShareCell = aSumRow.getCell(8);
    sumShareCell.value = { formula: `SUM(H${startAR}:H${endAR})` };
    sumShareCell.numFmt = '0.0%';
    sumShareCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
    sumShareCell.alignment = { horizontal: 'right' };
    sumShareCell.fill = totalRowFill;
    sumShareCell.border = totalBorder;

    // Avg Frequency
    const avgFreqCell = aSumRow.getCell(9);
    avgFreqCell.value = { formula: `F${actRowIdx}/G${actRowIdx}` };
    avgFreqCell.numFmt = '#,##0.0';
    avgFreqCell.font = { name: FONT_FAMILY, size: 10, bold: true };
    avgFreqCell.alignment = { horizontal: 'right' };
    avgFreqCell.fill = totalRowFill;
    avgFreqCell.border = totalBorder;

    aSumRow.height = 22;
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 5: Clinical_Triage_Analysis (Phan Tich Phan Loai Lam Sang)
  // ─────────────────────────────────────────────────────────────
  const wsTriage = workbook.addWorksheet('Clinical_Triage_Analysis', {
    views: [{ showGridLines: true }]
  });

  wsTriage.columns = [
    { width: 4 },   // A
    { width: 18 },  // B: Triage Code
    { width: 34 },  // C: Level Name
    { width: 18 },  // D: Case Count
    { width: 18 },  // E: Percentage
    { width: 22 },  // F: SLA / Response Target
    { width: 48 }   // G: Clinical Protocol
  ];

  // Title
  wsTriage.mergeCells('B2:G2');
  const trTitle = wsTriage.getCell('B2');
  trTitle.value = 'PHAN TICH PHAN LOAI MUC DO CAP CUU LAM SANG (TRIAGE CLASSIFICATION)';
  trTitle.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  trTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  trTitle.fill = brandNavyFill;
  wsTriage.getRow(2).height = 32;

  // Metadata
  wsTriage.mergeCells('B3:G3');
  const trMeta = wsTriage.getCell('B3');
  trMeta.value = `Tieu chuan phan luong y te theo phac do hoi benh thu y tu dong hoa bang AI`;
  trMeta.font = { name: FONT_FAMILY, size: 9, italic: true, color: { argb: 'FF64748B' } };
  trMeta.alignment = { vertical: 'middle', horizontal: 'center' };
  wsTriage.getRow(3).height = 18;

  const totalTriage = (stats.triageRedCount || 0) + (stats.triageYellowCount || 0) + (stats.triageGreenCount || 0) || 1;

  const triageHeaders = [
    'Ma Phan Loai',
    'Muc Do Lam Sang (Level)',
    'So Ca Ghi Nhan (Cases)',
    'Ty Trong (%)',
    'Thoi Gian Dap Ung Muc Tieu',
    'Quy Trinh Xu Tri Khuyen Nghi'
  ];

  const triageHeaderRow = wsTriage.getRow(5);
  triageHeaders.forEach((h, idx) => {
    const cell = triageHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = tableHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 2 || idx === 3 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  triageHeaderRow.height = 24;

  const triageData = [
    [
      'TRIAGE_L1_RED',
      'Cap Do 1 - Canh Bao Do (Cap Bach)',
      stats.triageRedCount || 0,
      (stats.triageRedCount || 0) / totalTriage,
      '< 15 phut',
      'Chi dinh cap cuu khot cap ngay lap tuc tai phong kham gan nhat'
    ],
    [
      'TRIAGE_L2_YELLOW',
      'Cap Do 2 - Canh Bao Vang (Nguy Co)',
      stats.triageYellowCount || 0,
      (stats.triageYellowCount || 0) / totalTriage,
      '< 24 gio',
      'Theo doi sat sao cac dau hieu lam sang va dat lich hen tham kham'
    ],
    [
      'TRIAGE_L3_GREEN',
      'Cap Do 3 - Khung Xanh (Tieu Chuan)',
      stats.triageGreenCount || 0,
      (stats.triageGreenCount || 0) / totalTriage,
      'Tieu chuan cham soc',
      'Tu van dinh duong, cham soc hang ngay va phong ngua benh thuong gap'
    ]
  ];

  triageData.forEach((row, rIdx) => {
    const r = wsTriage.getRow(rIdx + 6);
    row.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: FONT_FAMILY, size: 9.5 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
      } else if (cIdx === 1) {
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true };
      } else if (cIdx === 2) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      } else if (cIdx === 3) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: 'FF1B365D' } };
      }

      if (rIdx % 2 === 1) {
        cell.fill = zebraRowFill;
      }
    });
    r.height = 22;
  });

  // Triage Summary Row
  const trSumRow = wsTriage.getRow(9);
  wsTriage.mergeCells('B9:C9');
  const trSumLabel = trSumRow.getCell(2);
  trSumLabel.value = 'TONG SO CA HOI BENH';
  trSumLabel.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
  trSumLabel.alignment = { horizontal: 'center', vertical: 'middle' };

  ['B', 'C'].forEach(c => {
    trSumRow.getCell(c).fill = totalRowFill;
    trSumRow.getCell(c).border = totalBorder;
  });

  const sumCasesCell = trSumRow.getCell(4);
  sumCasesCell.value = { formula: 'SUM(D6:D8)' };
  sumCasesCell.numFmt = '#,##0';
  sumCasesCell.font = { name: FONT_FAMILY, size: 10, bold: true };
  sumCasesCell.alignment = { horizontal: 'right' };
  sumCasesCell.fill = totalRowFill;
  sumCasesCell.border = totalBorder;

  const sumPctCell = trSumRow.getCell(5);
  sumPctCell.value = { formula: 'SUM(E6:E8)' };
  sumPctCell.numFmt = '0.0%';
  sumPctCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF1B365D' } };
  sumPctCell.alignment = { horizontal: 'right' };
  sumPctCell.fill = totalRowFill;
  sumPctCell.border = totalBorder;

  ['F', 'G'].forEach(c => {
    const emptyC = trSumRow.getCell(c);
    emptyC.value = '';
    emptyC.fill = totalRowFill;
    emptyC.border = totalBorder;
  });
  trSumRow.height = 22;

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
