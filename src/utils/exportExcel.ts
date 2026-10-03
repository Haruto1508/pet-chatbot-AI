import ExcelJS from 'exceljs';
import { SystemStats } from '../types';

/**
 * Xuất toàn bộ báo cáo thống kê chuyên nghiệp sang file Excel (.xlsx)
 * Đầy đủ format màu sắc, border, font chữ, độ rộng cột và công thức tính toán.
 */
export async function exportDashboardStatsToExcel(stats: SystemStats, timeRange: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vethic AI Veterinary Healthcare';
  workbook.lastModifiedBy = 'Admin Vethic AI';
  workbook.created = new Date();

  const nowStr = new Date().toLocaleString('vi-VN');
  const rangeLabel = timeRange === '30days' ? '30 Ngày Qua' : '7 Ngày Qua';

  // ─────────────────────────────────────────────────────────────
  // 1. STYLES & COLOR PALETTES
  // ─────────────────────────────────────────────────────────────
  const primaryHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate 800
  };

  const blueHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Blue 600
  };

  const emeraldHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' } // Emerald 600
  };

  const purpleHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7C3AED' } // Violet 600
  };

  const tableSubHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' } // Slate 100
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: 📊 TỔNG QUAN & KPI (OVERVIEW)
  // ─────────────────────────────────────────────────────────────
  const wsOverview = workbook.addWorksheet('📊 Tổng Quan & KPI', {
    views: [{ showGridLines: true }]
  });

  wsOverview.columns = [
    { width: 6 },   // A
    { width: 36 },  // B: Metric Name
    { width: 22 },  // C: Value
    { width: 16 },  // D: Unit
    { width: 45 }   // E: Description
  ];

  // Banner Title
  wsOverview.mergeCells('B2:E2');
  const titleCell = wsOverview.getCell('B2');
  titleCell.value = 'BÁO CÁO THỐNG KÊ & PHÂN TÍCH HỆ THỐNG VETHIC AI';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = primaryHeaderFill;
  wsOverview.getRow(2).height = 36;

  // Metadata Sub-banner
  wsOverview.mergeCells('B3:E3');
  const metaCell = wsOverview.getCell('B3');
  metaCell.value = `Thời gian xuất: ${nowStr} | Phạm vi thống kê: ${rangeLabel} | Trạng thái: Dữ liệu thực tế Live Telemetry`;
  metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsOverview.getRow(3).height = 22;

  // Section 1: Top KPIs
  wsOverview.getCell('B5').value = '1. CÁC CHỈ SỐ ĐIỀU HÀNH CỐT LÕI (CORE KPIS)';
  wsOverview.getCell('B5').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };

  const kpiHeaders = ['Chỉ Số Thống Kê', 'Giá Trị', 'Đơn Vị', 'Diễn Giải Chi Tiết'];
  const kpiHeaderRow = wsOverview.getRow(6);
  kpiHeaders.forEach((h, idx) => {
    const cell = kpiHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = blueHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  kpiHeaderRow.height = 24;

  const kpiRowsData = [
    ['Tổng Lượt Ghé Thăm (Website Visitors)', stats.websiteVisitors || 0, 'Lượt', 'Tổng lưu lượng truy cập toàn hệ thống'],
    ['Khách Độc Lập (Unique Visitors)', stats.uniqueVisitors || 0, 'Khách (IP/Device)', 'Số người dùng độc lập theo thiết bị'],
    ['Tổng Lượt Xem Trang (Page Views)', stats.pageViews || 0, 'Lượt xem', 'Tổng số lần tải trang trên các route'],
    ['Người Dùng Tương Tác Thực (Active Users)', stats.activeUsers || 0, 'Người dùng', 'Người dùng có thao tác bấm hoặc gửi tin nhắn'],
    ['Người Hỏi Bệnh Chatbot (Chat Users)', stats.chatUsers || 0, 'Người chat', 'Đã đặt câu hỏi chẩn đoán triệu chứng thú cưng'],
    ['Khách Vãng Lai (Guest Chat Users)', stats.guestChatUsers || 0, 'Khách guest', 'Sử dụng bản dùng thử miễn phí 8 tin'],
    ['Tài Khoản Đăng Ký (Registered Users)', stats.registeredUsers || 0, 'Tài khoản', 'Người dùng chính thức đã kích hoạt'],
    ['Tổng Số Cuộc Chat AI (Chat Sessions)', stats.chatSessions || 0, 'Cuộc hội thoại', 'Phiên hỏi đáp y tế lâm sàng được khởi tạo'],
    ['Tổng Số Tin Nhắn Y Tế (Total Messages)', stats.totalMessages || 0, 'Tin nhắn', 'Số tin nhắn trao đổi 2 chiều giữa User và Bác sĩ AI'],
    ['Tổng Số Thú Cưng Đang Quản Lý', stats.totalPets || 0, 'Bé cưng', 'Hồ sơ thú cưng đã đăng ký trên hệ thống']
  ];

  let curRow = 7;
  kpiRowsData.forEach((row, rIdx) => {
    const rowObj = wsOverview.getRow(curRow);
    row.forEach((val, cIdx) => {
      const cell = rowObj.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      if (cIdx === 1) {
        cell.numFmt = '#,##0';
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'right' };
      }
      if (rIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      cell.border = thinBorder;
    });
    rowObj.height = 20;
    curRow++;
  });

  // Section 2: Conversion & Performance Rates
  curRow += 1;
  wsOverview.getCell(`B${curRow}`).value = '2. HIỆU SUẤT & TỈ LỆ CHUYỂN ĐỔI (CONVERSION & ENGAGEMENT)';
  wsOverview.getCell(`B${curRow}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  curRow++;

  const rateHeaderRow = wsOverview.getRow(curRow);
  kpiHeaders.forEach((h, idx) => {
    const cell = rateHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = emeraldHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  rateHeaderRow.height = 24;
  curRow++;

  const rateRowsData = [
    ['Tỉ Lệ Chuyển Đổi Vào Web ➔ Chatbot', (stats.visitorToChatRate || 0) / 100, '% Chuyển đổi', 'Tỉ lệ khách ghé thăm website sử dụng tư vấn AI'],
    ['Tỉ Lệ Chuyển Đổi Khách Guest ➔ Đăng Ký', (stats.guestToRegisteredRate || 0) / 100, '% Tạo tài khoản', 'Tỉ lệ khách vãng lai đăng ký tài khoản chính thức'],
    ['Độ Sâu Cuộc Hội Thoại Trung Bình', Number(stats.avgMessagesPerSession) || 0, 'Tin / Phiên', 'Mức độ tương tác chi tiết giữa người dùng và AI'],
    ['Tốc Độ Tăng Trưởng Người Dùng', (stats.userGrowth || 0) / 100, '% Tăng trưởng', 'So sánh lượng đăng ký mới với chu kỳ trước']
  ];

  rateRowsData.forEach((row, rIdx) => {
    const rowObj = wsOverview.getRow(curRow);
    row.forEach((val, cIdx) => {
      const cell = rowObj.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      if (cIdx === 1) {
        if (typeof val === 'number' && (rIdx === 0 || rIdx === 1 || rIdx === 3)) {
          cell.numFmt = '0.0%';
        } else {
          cell.numFmt = '#,##0.0';
        }
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
        cell.alignment = { horizontal: 'right' };
      }
      if (rIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      }
      cell.border = thinBorder;
    });
    rowObj.height = 20;
    curRow++;
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: 📈 XU HƯỚNG THEO NGÀY (TRENDS)
  // ─────────────────────────────────────────────────────────────
  const wsTrends = workbook.addWorksheet('📈 Xu Hướng Theo Ngày', {
    views: [{ showGridLines: true }]
  });

  wsTrends.columns = [
    { width: 6 },   // A
    { width: 16 },  // B: Date
    { width: 18 },  // C: Visitors
    { width: 18 },  // D: Chat Users
    { width: 18 },  // E: Sessions
    { width: 18 },  // F: Messages
    { width: 18 },  // G: New Users
    { width: 22 }   // H: Conversion %
  ];

  wsTrends.mergeCells('B2:H2');
  const tTitle = wsTrends.getCell('B2');
  tTitle.value = 'BẢNG DỮ LIỆU XU HƯỚNG THEO NGÀY (DAILY ENGAGEMENT & RETENTION)';
  tTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  tTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  tTitle.fill = blueHeaderFill;
  wsTrends.getRow(2).height = 32;

  const trendCols = [
    'Ngày (Date)',
    'Lượng Vào Web (Visitors)',
    'Người Chat (Chat Users)',
    'Số Cuộc Chat (Chats)',
    'Tổng Tin Nhắn (Messages)',
    'Tài Khoản Mới (Users)',
    'Tỉ Lệ Chat / Visitors'
  ];

  const trendHeaderRow = wsTrends.getRow(4);
  trendCols.forEach((colName, idx) => {
    const cell = trendHeaderRow.getCell(idx + 2);
    cell.value = colName;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = primaryHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'center' : 'right' };
    cell.border = thinBorder;
  });
  trendHeaderRow.height = 24;

  let trendRowIdx = 5;
  const historyList = stats.history || [];

  historyList.forEach((h, idx) => {
    const r = wsTrends.getRow(trendRowIdx);
    const convRate = h.visitors > 0 ? (h.chatUsers / h.visitors) : 0;

    const rowVals = [
      h.date,
      h.visitors || 0,
      h.chatUsers || 0,
      h.chats || 0,
      h.messages || 0,
      h.users || 0,
      convRate
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Arial', size: 10, bold: true };
      } else if (cIdx === 6) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF059669' } };
      } else {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      }

      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });

    r.height = 20;
    trendRowIdx++;
  });

  // Total Summary Row
  if (historyList.length > 0) {
    const sumRow = wsTrends.getRow(trendRowIdx);
    sumRow.getCell(2).value = 'TỔNG CỘNG / TB';
    sumRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
    sumRow.getCell(2).alignment = { horizontal: 'center' };
    sumRow.getCell(2).fill = tableSubHeaderFill;
    sumRow.getCell(2).border = thinBorder;

    // Formulas
    const startR = 5;
    const endR = trendRowIdx - 1;

    // Sum cols C, D, E, F, G
    ['C', 'D', 'E', 'F', 'G'].forEach((colLetter, cIdx) => {
      const cell = sumRow.getCell(cIdx + 3);
      cell.value = { formula: `SUM(${colLetter}${startR}:${colLetter}${endR})` };
      cell.numFmt = '#,##0';
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.alignment = { horizontal: 'right' };
      cell.fill = tableSubHeaderFill;
      cell.border = thinBorder;
    });

    // Average Conversion Rate col H
    const avgCell = sumRow.getCell(8);
    avgCell.value = { formula: `AVERAGE(H${startR}:H${endR})` };
    avgCell.numFmt = '0.0%';
    avgCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF059669' } };
    avgCell.alignment = { horizontal: 'right' };
    avgCell.fill = tableSubHeaderFill;
    avgCell.border = thinBorder;

    sumRow.height = 22;
  }

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: 🌐 TRANG ĐƯỢC TRUY CẬP (TOP PAGES)
  // ─────────────────────────────────────────────────────────────
  const wsPages = workbook.addWorksheet('🌐 Trang Truy Cập (Pages)', {
    views: [{ showGridLines: true }]
  });

  wsPages.columns = [
    { width: 6 },   // A
    { width: 12 },  // B: Rank
    { width: 32 },  // C: Page Name
    { width: 24 },  // D: Route Path
    { width: 18 },  // E: Page Views
    { width: 20 },  // F: Unique Visitors
    { width: 20 }   // G: Traffic Share %
  ];

  wsPages.mergeCells('B2:G2');
  const pTitle = wsPages.getCell('B2');
  pTitle.value = 'BẢNG XẾP HẠNG TRANG & TUYẾN ĐƯỜNG ĐƯỢC XEM NHIỀU NHẤT';
  pTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  pTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  pTitle.fill = blueHeaderFill;
  wsPages.getRow(2).height = 32;

  const pageCols = [
    'Xếp Hạng',
    'Tên Trang Hiển Thị',
    'Đường Dẫn Tuyến Đường',
    'Lượt Xem (Pageviews)',
    'Khách Độc Lập (Unique)',
    'Tỉ Trọng Lưu Lượng (%)'
  ];

  const pageHeaderRow = wsPages.getRow(4);
  pageCols.forEach((colName, idx) => {
    const cell = pageHeaderRow.getCell(idx + 2);
    cell.value = colName;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = primaryHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx <= 2 ? 'left' : 'right' };
    if (idx === 0) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  pageHeaderRow.height = 24;

  let pageRowIdx = 5;
  const topPagesList = stats.topPages || [];

  topPagesList.forEach((p, idx) => {
    const r = wsPages.getRow(pageRowIdx);
    const rowVals = [
      `#${idx + 1}`,
      p.pageName,
      p.path,
      p.views || 0,
      p.uniqueVisitors || 0,
      (p.percentage || 0) / 100
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2563EB' } };
      } else if (cIdx === 1) {
        cell.font = { name: 'Arial', size: 10, bold: true };
      } else if (cIdx === 2) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
      } else if (cIdx === 3 || cIdx === 4) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (cIdx === 5) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
      }

      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });

    r.height = 20;
    pageRowIdx++;
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 4: 🖱️ THAO TÁC NGƯỜI DÙNG (TOP ACTIONS)
  // ─────────────────────────────────────────────────────────────
  const wsActions = workbook.addWorksheet('🖱️ Thao Tác (Actions)', {
    views: [{ showGridLines: true }]
  });

  wsActions.columns = [
    { width: 6 },   // A
    { width: 12 },  // B: Rank
    { width: 36 },  // C: Action Name
    { width: 20 },  // D: Category
    { width: 28 },  // E: Event Key
    { width: 20 },  // F: Count
    { width: 20 },  // G: Unique Users
    { width: 20 }   // H: Share %
  ];

  wsActions.mergeCells('B2:H2');
  const aTitle = wsActions.getCell('B2');
  aTitle.value = 'BẢNG THỐNG KÊ HÀNH VI & THAO TÁC NGƯỜI DÙNG BẤM NHIỀU NHẤT';
  aTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  aTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  aTitle.fill = purpleHeaderFill;
  wsActions.getRow(2).height = 32;

  const actionCols = [
    'Xếp Hạng',
    'Tên Hành Vi / Thao Tác',
    'Nhóm Nghiệp Vụ',
    'Mã Sự Kiện Telemetry',
    'Số Lần Bấm (Clicks)',
    'Số Người Thực Hiện',
    'Tỉ Trọng Hành Vi (%)'
  ];

  const actionHeaderRow = wsActions.getRow(4);
  actionCols.forEach((colName, idx) => {
    const cell = actionHeaderRow.getCell(idx + 2);
    cell.value = colName;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = primaryHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx <= 3 ? 'left' : 'right' };
    if (idx === 0) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  actionHeaderRow.height = 24;

  let actRowIdx = 5;
  const topActionsList = stats.topActions || [];

  topActionsList.forEach((act, idx) => {
    const r = wsActions.getRow(actRowIdx);
    const rowVals = [
      `#${idx + 1}`,
      act.actionName,
      act.category,
      act.actionType,
      act.count || 0,
      act.uniqueUsers || 0,
      (act.percentage || 0) / 100
    ];

    rowVals.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF7C3AED' } };
      } else if (cIdx === 1) {
        cell.font = { name: 'Arial', size: 10, bold: true };
      } else if (cIdx === 2) {
        cell.alignment = { horizontal: 'left' };
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
      } else if (cIdx === 3) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
      } else if (cIdx === 4 || cIdx === 5) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (cIdx === 6) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF7C3AED' } };
      }

      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });

    r.height = 20;
    actRowIdx++;
  });

  // ─────────────────────────────────────────────────────────────
  // SHEET 5: 🏥 LÂM SÀNG & TRIAGE (CLINICAL TRIAGE)
  // ─────────────────────────────────────────────────────────────
  const wsTriage = workbook.addWorksheet('🏥 Lâm Sàng & Triage', {
    views: [{ showGridLines: true }]
  });

  wsTriage.columns = [
    { width: 6 },   // A
    { width: 28 },  // B: Level
    { width: 18 },  // C: Cases
    { width: 18 },  // D: Percentage
    { width: 45 }   // E: Guide
  ];

  wsTriage.mergeCells('B2:E2');
  const trTitle = wsTriage.getCell('B2');
  trTitle.value = 'BÁO CÁO PHÂN LOẠI MỨC ĐỘ NGUY HIỂM LÂM SÀNG (TRIAGE ANALYSIS)';
  trTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  trTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  trTitle.fill = emeraldHeaderFill;
  wsTriage.getRow(2).height = 32;

  const totalTriage = (stats.triageRedCount || 0) + (stats.triageYellowCount || 0) + (stats.triageGreenCount || 0) || 1;

  const triageHeaders = ['Mức Độ Nguy Hiểm (Triage Level)', 'Số Ca Ghi Nhận', 'Tỉ Lệ (%)', 'Quy Trình Xử Trí Y Tế Khuyến Nghị'];
  const triageHeaderRow = wsTriage.getRow(4);
  triageHeaders.forEach((h, idx) => {
    const cell = triageHeaderRow.getCell(idx + 2);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = primaryHeaderFill;
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 || idx === 2 ? 'right' : 'left' };
    cell.border = thinBorder;
  });
  triageHeaderRow.height = 24;

  const triageData = [
    ['🔴 Cảnh Báo Đỏ (Cấp Bách)', stats.triageRedCount || 0, (stats.triageRedCount || 0) / totalTriage, 'Chỉ định cấp cứu khẩn cấp trong vòng 1 giờ'],
    ['🟡 Cảnh Báo Vàng (Theo Dõi)', stats.triageYellowCount || 0, (stats.triageYellowCount || 0) / totalTriage, 'Theo dõi triệu chứng trong 24h và đặt hẹn khám thú y'],
    ['🟢 Khung Xanh (An Toàn)', stats.triageGreenCount || 0, (stats.triageGreenCount || 0) / totalTriage, 'Tư vấn dinh dưỡng, phòng bệnh và chăm sóc chuẩn y khoa']
  ];

  triageData.forEach((row, rIdx) => {
    const r = wsTriage.getRow(rIdx + 5);
    row.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 2);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10 };
      cell.border = thinBorder;

      if (cIdx === 0) {
        cell.font = { name: 'Arial', size: 10, bold: true };
      } else if (cIdx === 1) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, bold: true };
      } else if (cIdx === 2) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, bold: true };
      }
    });
    r.height = 22;
  });

  // ─────────────────────────────────────────────────────────────
  // GENERATE BLOB & TRIGGER BROWSER DOWNLOAD
  // ─────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Vethic_AI_Bao_Cao_Thong_Ke_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
