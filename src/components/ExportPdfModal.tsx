import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  Building2,
  Calendar,
  Users,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LocationData, WorkerItem, TimesheetDB } from '../types';
import { calculateDatesForStart } from '../utils/calculations';
import { DAY_KEYS } from '../data/initialData';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  currentDate: string;
  locData?: LocationData;
  locationsList: string[];
  timesheetDB: TimesheetDB;
  roleBales?: Record<string, number>;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  currentDate,
  locData,
  locationsList,
  timesheetDB,
}) => {
  // If currentLocation is VIEW_ALL, default to ALL_SITES
  const initialSite =
    currentLocation === 'VIEW_ALL'
      ? 'ALL_SITES'
      : currentLocation;

  const [selectedSite, setSelectedSite] = useState<string>(initialSite);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Synchronize site selection when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentLocation === 'VIEW_ALL') {
        setSelectedSite('ALL_SITES');
      } else if (locationsList.includes(currentLocation)) {
        setSelectedSite(currentLocation);
      } else if (selectedSite !== 'ALL_SITES' && !locationsList.includes(selectedSite)) {
        setSelectedSite('ALL_SITES');
      }
    }
  }, [isOpen, currentLocation, locationsList]);

  const isAllSites = selectedSite === 'ALL_SITES';

  // Retrieve data for any site
  const getSiteData = (siteName: string): LocationData | undefined => {
    if (siteName === currentLocation && locData) {
      return locData;
    }
    const dayData = timesheetDB[currentDate];
    return dayData?.locations ? dayData.locations[siteName] : undefined;
  };

  const datesList = useMemo(() => calculateDatesForStart(currentDate), [currentDate]);

  const periodLabel = useMemo(() => {
    if (datesList.length < 2) return currentDate;
    const start = datesList[0].fullDateStr;
    const end = datesList[datesList.length - 1].fullDateStr;
    return `${start} – ${end} (${currentDate.slice(0, 4)})`;
  }, [datesList, currentDate]);

  // Aggregate stats for all sites in locationsList
  const allSitesData = useMemo(() => {
    return locationsList.map((siteName) => {
      const sData = getSiteData(siteName);
      const siteWorkers: WorkerItem[] = sData?.workers || [];
      let totalDays = 0;
      let totalOT = 0;
      let totalFull = 0;
      let totalHalf = 0;
      let totalAbsent = 0;

      siteWorkers.forEach((w) => {
        DAY_KEYS.forEach((k) => {
          const val = w.attendance[k] || '';
          const isFullOrHalf = val === '1.0' || val === '0.5';
          const ot = isFullOrHalf ? parseFloat(String(w.ot[k])) || 0 : 0;

          if (val === '1.0') {
            totalDays += 1.0;
            totalFull++;
          } else if (val === '0.5') {
            totalDays += 0.5;
            totalHalf++;
          } else if (val === '1h') {
            totalOT += 1;
          } else if (val === '2h') {
            totalOT += 2;
          } else if (val === 'absent') {
            totalAbsent++;
          }
          totalOT += ot;
        });
      });

      const siteBale = sData?.baleValue || 0;

      return {
        siteName,
        siteData: sData,
        workers: siteWorkers,
        workerCount: siteWorkers.length,
        totalDays,
        totalOT,
        siteBale,
        totalFull,
        totalHalf,
        totalAbsent,
        isDone: !!sData?.isDone,
        remarks: sData?.siteRemarksHistory || [],
      };
    });
  }, [locationsList, currentLocation, locData, timesheetDB, currentDate]);

  // Grand totals across all sites
  const grandTotals = useMemo(() => {
    let totalWorkers = 0;
    let totalDays = 0;
    let totalOT = 0;
    let totalBale = 0;
    let activeSites = 0;
    let completedSites = 0;

    allSitesData.forEach((s) => {
      totalWorkers += s.workerCount;
      totalDays += s.totalDays;
      totalOT += s.totalOT;
      totalBale += s.siteBale;
      if (s.isDone) completedSites++;
      else activeSites++;
    });

    return {
      totalWorkers,
      totalDays,
      totalOT,
      totalBale,
      activeSites,
      completedSites,
      siteCount: allSitesData.length,
    };
  }, [allSitesData]);

  // Data for single site mode
  const singleSiteData = useMemo(() => {
    if (isAllSites) return undefined;
    return getSiteData(selectedSite);
  }, [isAllSites, selectedSite, currentLocation, locData, timesheetDB, currentDate]);

  const singleSiteWorkers = useMemo(() => {
    return singleSiteData?.workers || [];
  }, [singleSiteData]);

  const singleSiteTotals = useMemo(() => {
    let totalDays = 0;
    let totalOT = 0;
    let totalFull = 0;
    let totalHalf = 0;
    let totalAbsent = 0;

    singleSiteWorkers.forEach((w) => {
      DAY_KEYS.forEach((k) => {
        const val = w.attendance[k] || '';
        const isFullOrHalf = val === '1.0' || val === '0.5';
        const ot = isFullOrHalf ? parseFloat(String(w.ot[k])) || 0 : 0;

        if (val === '1.0') {
          totalDays += 1.0;
          totalFull++;
        } else if (val === '0.5') {
          totalDays += 0.5;
          totalHalf++;
        } else if (val === '1h') {
          totalOT += 1;
        } else if (val === '2h') {
          totalOT += 2;
        } else if (val === 'absent') {
          totalAbsent++;
        }
        totalOT += ot;
      });
    });

    const siteBale = singleSiteData?.baleValue || 0;

    return {
      workerCount: singleSiteWorkers.length,
      totalDays,
      totalOT,
      siteBale,
      totalFull,
      totalHalf,
      totalAbsent,
    };
  }, [singleSiteWorkers, singleSiteData]);

  if (!isOpen) return null;

  // Header helper for PDF
  const drawTopHeader = (doc: jsPDF, subtitle: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(13, 13, 13);
    doc.rect(0, 0, pageWidth, 55, 'F');
    doc.setFillColor(209, 26, 42); // #d11a2a
    doc.rect(0, 52, pageWidth, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ARCDESIGN', 30, 30);

    doc.setFontSize(9);
    doc.setTextColor(209, 26, 42);
    doc.text('CONSTRUCTION', 150, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(subtitle, 30, 44);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, pageWidth - 30, 28, {
      align: 'right',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 180, 180);
    doc.text('SECURITY CONFIDENTIAL', pageWidth - 30, 42, { align: 'right' });
  };

  // Signatures helper for PDF
  const drawSignaturesBlock = (doc: jsPDF, startY: number, pageWidth: number) => {
    let finalY = startY;
    if (finalY + 70 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      finalY = 50;
    } else {
      finalY += 24;
    }

    const sigWidth = (pageWidth - 60 - 60) / 3;
    const sigs = [
      { role: 'PREPARED BY', title: 'Site Timekeeper / Lead' },
      { role: 'VERIFIED BY', title: 'Project Engineer / Foreman' },
      { role: 'APPROVED BY', title: 'ARCDESIGN Operations Manager' },
    ];

    sigs.forEach((s, idx) => {
      const sX = 30 + idx * (sigWidth + 30);
      doc.setDrawColor(180, 180, 180);
      doc.line(sX, finalY + 28, sX + sigWidth, finalY + 28);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(s.role, sX + sigWidth / 2, finalY + 40, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(s.title, sX + sigWidth / 2, finalY + 50, { align: 'center' });
    });
  };

  // Render a site's attendance report page
  const renderSiteAttendancePage = (
    doc: jsPDF,
    siteInfo: {
      siteName: string;
      siteData?: LocationData;
      workers: WorkerItem[];
      totalDays: number;
      totalOT: number;
      siteBale: number;
      isDone: boolean;
      remarks: Array<{ text: string; date?: string; timestamp?: string }>;
    }
  ) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    drawTopHeader(doc, 'Official Site Attendance & Timesheet Report');

    let curY = 75;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(30, curY, pageWidth - 60, 48, 4, 4, 'F');
    doc.setDrawColor(222, 226, 230);
    doc.roundedRect(30, curY, pageWidth - 60, 48, 4, 4, 'S');

    doc.setFillColor(209, 26, 42);
    doc.rect(30, curY, 4, 48, 'F');

    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`PROJECT LOCATION: ${siteInfo.siteName.toUpperCase()}`, 45, curY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(108, 117, 125);
    const baleText =
      siteInfo.siteBale > 0 ? ` • Site Bale: PHP ${siteInfo.siteBale.toLocaleString()}` : '';
    doc.text(`Work Week: ${periodLabel}${baleText}`, 45, curY + 36);

    // Status pill
    if (siteInfo.isDone) {
      doc.setFillColor(25, 135, 84);
      doc.roundedRect(pageWidth - 140, curY + 12, 100, 24, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('COMPLETED', pageWidth - 90, curY + 27, { align: 'center' });
    } else {
      doc.setFillColor(13, 110, 253);
      doc.roundedRect(pageWidth - 130, curY + 12, 90, 24, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ACTIVE SITE', pageWidth - 85, curY + 27, { align: 'center' });
    }

    // 4 metric cards
    curY += 60;
    const cardWidth = (pageWidth - 60 - 30) / 4;
    const cardHeight = 36;

    const summaryMetrics = [
      { label: 'HEADCOUNT', val: `${siteInfo.workers.length} Workers`, color: [33, 37, 41] },
      { label: 'TOTAL DAYS WORKED', val: `${siteInfo.totalDays.toFixed(1)} Days`, color: [25, 135, 84] },
      { label: 'TOTAL OVERTIME', val: `${siteInfo.totalOT} Hours`, color: [209, 26, 42] },
      {
        label: 'SITE BALE (CASH ADVANCE)',
        val: siteInfo.siteBale > 0 ? `PHP ${siteInfo.siteBale.toLocaleString()}` : 'None',
        color: [180, 83, 9],
      },
    ];

    summaryMetrics.forEach((m, idx) => {
      const xPos = 30 + idx * (cardWidth + 10);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 224, 230);
      doc.roundedRect(xPos, curY, cardWidth, cardHeight, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(108, 117, 125);
      doc.text(m.label, xPos + 8, curY + 13);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.text(m.val, xPos + 8, curY + 28);
    });

    curY += cardHeight + 16;

    // Worker Table: without worker bale column
    const tableHeaders = [
      '#',
      'Worker Name',
      'Role',
      ...datesList.map((d) => `${d.monthStr} ${d.dayNum}`),
      'Days',
      'OT (Hrs)',
    ];

    const tableRows = siteInfo.workers.map((w, idx) => {
      let wDays = 0;
      let wOT = 0;
      const dayCols = DAY_KEYS.map((k) => {
        const val = w.attendance[k] || '-';
        const isFullOrHalf = val === '1.0' || val === '0.5';
        const ot = isFullOrHalf ? parseFloat(String(w.ot[k])) || 0 : 0;

        if (val === '1.0') wDays += 1.0;
        else if (val === '0.5') wDays += 0.5;

        const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
        wOT += ot + attHours;

        if (ot > 0 && isFullOrHalf) {
          return `${val} (+${ot}h)`;
        }
        return val;
      });

      return [
        String(idx + 1),
        w.name,
        w.role,
        ...dayCols,
        wDays.toFixed(1),
        wOT > 0 ? `${wOT}h` : '-',
      ];
    });

    autoTable(doc, {
      startY: curY,
      head: [tableHeaders],
      body:
        tableRows.length > 0
          ? tableRows
          : [['-', 'No workers recorded for this site yet', '-', ...datesList.map(() => '-'), '-', '-']],
      foot: [
        [
          '',
          'TOTALS',
          `${siteInfo.workers.length} workers`,
          ...datesList.map(() => ''),
          `${siteInfo.totalDays.toFixed(1)}d`,
          siteInfo.totalOT > 0 ? `${siteInfo.totalOT}h` : '-',
        ],
      ],
      footStyles: {
        fillColor: [240, 242, 245],
        textColor: [33, 37, 41],
        fontStyle: 'bold',
        halign: 'center',
      },
      margin: { left: 30, right: 30 },
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 4.5,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [13, 13, 13],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 24 },
        1: { halign: 'left', fontStyle: 'bold', cellWidth: orientation === 'portrait' ? 105 : 140 },
        2: { halign: 'center', cellWidth: orientation === 'portrait' ? 60 : 75 },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'center' },
        9: { halign: 'center', fontStyle: 'bold', textColor: [25, 135, 84] },
        10: { halign: 'center', fontStyle: 'bold', textColor: [209, 26, 42] },
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalY = (doc as any).lastAutoTable?.finalY || curY + 120;

    // Site Remarks
    if (includeNotes && siteInfo.remarks && siteInfo.remarks.length > 0) {
      if (finalY + 65 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        finalY = 40;
      }

      finalY += 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(33, 37, 41);
      doc.text('SITE ANNOUNCEMENTS & FIELD NOTES:', 30, finalY);

      finalY += 12;
      siteInfo.remarks.slice(-3).forEach((rem) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const dateStr = rem.timestamp || rem.date ? `[${rem.timestamp || rem.date}] ` : '';
        doc.text(`• ${dateStr}${rem.text}`, 35, finalY);
        finalY += 11;
      });
    }

    // Signatures
    if (includeSignatures) {
      drawSignaturesBlock(doc, finalY, pageWidth);
    }
  };

  // Generate vector PDF using jsPDF + autoTable
  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      if (isAllSites) {
        // ==========================================
        // ALL SITES CONSOLIDATED REPORT
        // ==========================================
        // Page 1: Consolidated Multi-Site Executive Overview
        drawTopHeader(doc, 'Official All-Sites Consolidated Attendance & Timesheet Report');

        let curY = 75;
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(30, curY, pageWidth - 60, 48, 4, 4, 'F');
        doc.setDrawColor(222, 226, 230);
        doc.roundedRect(30, curY, pageWidth - 60, 48, 4, 4, 'S');

        // Red accent line
        doc.setFillColor(209, 26, 42);
        doc.rect(30, curY, 4, 48, 'F');

        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(
          `CONSOLIDATED REPORT: ALL PROJECT SITES (${allSitesData.length} SITES)`,
          45,
          curY + 20
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(108, 117, 125);
        const balePart =
          grandTotals.totalBale > 0
            ? ` • Total Site Cash Advances: PHP ${grandTotals.totalBale.toLocaleString()}`
            : '';
        doc.text(
          `Work Week: ${periodLabel} • ${grandTotals.activeSites} Active Sites, ${grandTotals.completedSites} Completed Sites${balePart}`,
          45,
          curY + 36
        );

        // Status Badge
        doc.setFillColor(13, 13, 13);
        doc.roundedRect(pageWidth - 150, curY + 12, 110, 24, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('ALL SITES COMPILED', pageWidth - 95, curY + 27, { align: 'center' });

        // Overview KPI Cards
        curY += 60;
        const cardWidth = (pageWidth - 60 - 30) / 4;
        const cardHeight = 36;

        const overviewMetrics = [
          {
            label: 'TOTAL HEADCOUNT',
            val: `${grandTotals.totalWorkers} Workers`,
            color: [33, 37, 41],
          },
          {
            label: 'TOTAL DAYS WORKED',
            val: `${grandTotals.totalDays.toFixed(1)} Days`,
            color: [25, 135, 84],
          },
          {
            label: 'TOTAL OVERTIME',
            val: `${grandTotals.totalOT} Hours`,
            color: [209, 26, 42],
          },
          {
            label: 'TOTAL SITE ADVANCES (BALE)',
            val: grandTotals.totalBale > 0 ? `PHP ${grandTotals.totalBale.toLocaleString()}` : 'None',
            color: [180, 83, 9],
          },
        ];

        overviewMetrics.forEach((m, idx) => {
          const xPos = 30 + idx * (cardWidth + 10);
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(220, 224, 230);
          doc.roundedRect(xPos, curY, cardWidth, cardHeight, 3, 3, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(108, 117, 125);
          doc.text(m.label, xPos + 8, curY + 13);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(m.color[0], m.color[1], m.color[2]);
          doc.text(m.val, xPos + 8, curY + 28);
        });

        curY += cardHeight + 16;

        // All Sites Summary Table
        const siteSummaryHeaders = [
          '#',
          'Project Site Location',
          'Status',
          'Workers Count',
          'Total Days Worked',
          'Total Overtime',
          'Site Bale (Advance)',
        ];

        const siteSummaryRows = allSitesData.map((s, idx) => [
          String(idx + 1),
          s.siteName,
          s.isDone ? 'Completed' : 'Active Site',
          `${s.workerCount} workers`,
          `${s.totalDays.toFixed(1)} days`,
          s.totalOT > 0 ? `${s.totalOT} hrs` : '-',
          s.siteBale > 0 ? `PHP ${s.siteBale.toLocaleString()}` : '-',
        ]);

        autoTable(doc, {
          startY: curY,
          head: [siteSummaryHeaders],
          body: siteSummaryRows,
          foot: [
            [
              '',
              'GRAND TOTALS (ALL SITES)',
              `${grandTotals.siteCount} Sites`,
              `${grandTotals.totalWorkers} workers`,
              `${grandTotals.totalDays.toFixed(1)} days`,
              `${grandTotals.totalOT > 0 ? `${grandTotals.totalOT} hrs` : '-'}`,
              grandTotals.totalBale > 0 ? `PHP ${grandTotals.totalBale.toLocaleString()}` : '-',
            ],
          ],
          footStyles: {
            fillColor: [240, 242, 245],
            textColor: [33, 37, 41],
            fontStyle: 'bold',
            halign: 'center',
          },
          margin: { left: 30, right: 30 },
          theme: 'striped',
          styles: {
            fontSize: 9,
            cellPadding: 6,
            valign: 'middle',
          },
          headStyles: {
            fillColor: [13, 13, 13],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 28 },
            1: { halign: 'left', fontStyle: 'bold' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center', fontStyle: 'bold', textColor: [25, 135, 84] },
            5: { halign: 'center', fontStyle: 'bold', textColor: [209, 26, 42] },
            6: { halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summaryFinalY = (doc as any).lastAutoTable?.finalY || curY + 120;
        if (includeSignatures) {
          drawSignaturesBlock(doc, summaryFinalY, pageWidth);
        }

        // Subsequent Pages: Full detailed timesheet for each site
        allSitesData.forEach((site) => {
          doc.addPage();
          renderSiteAttendancePage(doc, site);
        });

        // Page Numbering for all pages
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `ARCDESIGN Construction Timesheet Tracker • Consolidated All Sites • Page ${i} of ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 15,
            { align: 'center' }
          );
        }

        doc.save(`ARCDESIGN_All_Sites_Timesheet_${currentDate}.pdf`);
      } else {
        // ==========================================
        // SINGLE SITE EXPORT
        // ==========================================
        renderSiteAttendancePage(doc, {
          siteName: selectedSite,
          siteData: singleSiteData,
          workers: singleSiteWorkers,
          totalDays: singleSiteTotals.totalDays,
          totalOT: singleSiteTotals.totalOT,
          siteBale: singleSiteTotals.siteBale,
          isDone: !!singleSiteData?.isDone,
          remarks: singleSiteData?.siteRemarksHistory || [],
        });

        // Page Numbering
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `ARCDESIGN Construction Timesheet Tracker • Page ${i} of ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 15,
            { align: 'center' }
          );
        }

        const safeLoc = selectedSite.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`ARCDESIGN_${safeLoc}_Timesheet_${currentDate}.pdf`);
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate PDF. Please check your browser settings or try printing.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Browser Print option for direct print-to-PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="exportPdfModalOverlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="exportPdfModalContainer"
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-300 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-[#0d0d0d] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#d11a2a]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#d11a2a]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>EXPORT SITE TIMESHEET PDF</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#d11a2a] text-white font-bold">
                  {isAllSites ? 'ALL SITES COMPILED' : 'PDF REPORT'}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Generate formatted PDF report for project documentation and payroll sign-off
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="bg-neutral-50 px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Site Selector with ALL SITES option */}
          <div className="flex items-center gap-2">
            <label htmlFor="pdfSiteSelect" className="font-bold text-gray-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#d11a2a]" />
              <span>Report Target:</span>
            </label>
            <select
              id="pdfSiteSelect"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded font-bold text-gray-900 focus:outline-none focus:border-[#d11a2a]"
            >
              <option value="ALL_SITES" className="font-black text-[#d11a2a]">
                ★ All Sites (Combined Multi-Site Report)
              </option>
              <optgroup label="Individual Project Sites">
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Orientation & Format Options */}
          <div className="flex items-center flex-wrap gap-4 font-semibold text-gray-700">
            <div className="flex items-center gap-1.5">
              <span>Layout:</span>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  orientation === 'landscape'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Landscape
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  orientation === 'portrait'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Portrait
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded text-[#d11a2a] focus:ring-0"
              />
              <span>Field Notes</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded text-[#d11a2a] focus:ring-0"
              />
              <span>Signature Block</span>
            </label>
          </div>
        </div>

        {/* Live Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-200/60">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 max-w-4xl mx-auto p-6 text-gray-900 space-y-6">
            {/* Header Document Brand */}
            <div className="border-b-2 border-[#d11a2a] pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    ARCDESIGN
                  </h1>
                  <span className="text-xs font-bold text-[#d11a2a] tracking-widest uppercase">
                    CONSTRUCTION
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {isAllSites
                    ? 'Official All-Sites Consolidated Attendance & Timesheet Report'
                    : 'Official Site Attendance & Timesheet Report'}
                </p>
              </div>

              <div className="text-right text-[11px]">
                <div className="font-bold text-gray-800">
                  GENERATED: {new Date().toLocaleDateString()}
                </div>
                <div className="text-gray-500">PERIOD: {periodLabel}</div>
              </div>
            </div>

            {/* PREVIEW CONTENT: ALL SITES vs SINGLE SITE */}
            {isAllSites ? (
              <div className="space-y-6">
                {/* Consolidated All-Sites Banner */}
                <div className="bg-neutral-50 rounded-lg border-l-4 border-l-[#d11a2a] border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#d11a2a]" />
                      <span>Consolidated Report Scope</span>
                    </div>
                    <div className="text-lg font-black text-gray-900 flex items-center flex-wrap gap-2 mt-0.5">
                      <span>ALL PROJECT SITES ({allSitesData.length} Locations)</span>
                      {grandTotals.totalBale > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                          Total Advances: ₱{grandTotals.totalBale.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {grandTotals.activeSites} active sites • {grandTotals.completedSites} completed sites
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-neutral-900 text-white rounded text-xs font-bold uppercase tracking-wider">
                    Full Compilation
                  </span>
                </div>

                {/* Overall KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-neutral-50 rounded border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Total Headcount</span>
                    <span className="text-lg font-black text-gray-900 block">{grandTotals.totalWorkers}</span>
                    <span className="text-[10px] text-gray-500 font-medium">Workers Across Sites</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">Total Days</span>
                    <span className="text-lg font-black text-emerald-950 block">
                      {grandTotals.totalDays.toFixed(1)}d
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Worked Shifts</span>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded border border-red-200">
                    <span className="text-[10px] font-bold text-red-800 block uppercase">Total Overtime</span>
                    <span className="text-lg font-black text-red-950 block">{grandTotals.totalOT}h</span>
                    <span className="text-[10px] text-red-700 font-medium">Extra Hours</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase">Total Advances</span>
                    <span className="text-lg font-black text-amber-950 block">
                      {grandTotals.totalBale > 0 ? `₱${grandTotals.totalBale.toLocaleString()}` : 'None'}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Site Bale</span>
                  </div>
                </div>

                {/* All Sites Summary Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-900 text-white px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                    <span>Multi-Site Executive Overview</span>
                    <span className="text-[10px] text-gray-400 font-normal">Page 1 in PDF</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 text-center">#</th>
                        <th className="p-2.5">Site Location</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center">Workers</th>
                        <th className="p-2.5 text-center">Days</th>
                        <th className="p-2.5 text-center">OT (Hrs)</th>
                        <th className="p-2.5 text-right">Site Bale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allSitesData.map((s, idx) => (
                        <tr key={s.siteName} className="hover:bg-neutral-50">
                          <td className="p-2.5 text-center font-bold text-gray-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-gray-900">{s.siteName}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                s.isDone
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {s.isDone ? 'Completed' : 'Active'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">{s.workerCount}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-800">
                            {s.totalDays.toFixed(1)}d
                          </td>
                          <td className="p-2.5 text-center font-bold text-red-700">
                            {s.totalOT > 0 ? `${s.totalOT}h` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-amber-900">
                            {s.siteBale > 0 ? `₱${s.siteBale.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-100 font-bold border-t-2 border-gray-300 text-xs">
                        <td colSpan={3} className="p-2.5 text-gray-900 uppercase">
                          Grand Totals ({allSitesData.length} Locations)
                        </td>
                        <td className="p-2.5 text-center text-gray-900">{grandTotals.totalWorkers}</td>
                        <td className="p-2.5 text-center text-emerald-800">{grandTotals.totalDays.toFixed(1)}d</td>
                        <td className="p-2.5 text-center text-red-700">
                          {grandTotals.totalOT > 0 ? `${grandTotals.totalOT}h` : '-'}
                        </td>
                        <td className="p-2.5 text-right text-amber-900">
                          {grandTotals.totalBale > 0 ? `₱${grandTotals.totalBale.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Individual Site Previews */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-black uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1">
                    Individual Site Detailed Timesheets (Pages 2 to {allSitesData.length + 1} in PDF)
                  </div>
                  {allSitesData.map((s) => (
                    <div key={s.siteName} className="border border-gray-200 rounded-lg overflow-hidden p-3 bg-neutral-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#d11a2a]" />
                          <span className="font-black text-sm text-gray-900">{s.siteName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                              s.isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {s.isDone ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 font-semibold">
                          {s.workers.length} workers • {s.totalDays.toFixed(1)}d total • {s.totalOT}h OT
                          {s.siteBale > 0 && ` • Bale: ₱${s.siteBale.toLocaleString()}`}
                        </div>
                      </div>

                      {s.workers.length > 0 ? (
                        <div className="overflow-x-auto bg-white rounded border border-gray-200">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-neutral-800 text-white">
                              <tr>
                                <th className="p-1.5 text-center">#</th>
                                <th className="p-1.5">Worker Name</th>
                                <th className="p-1.5 text-center">Role</th>
                                {datesList.map((d) => (
                                  <th key={d.key} className="p-1.5 text-center">
                                    {d.dayNum}
                                  </th>
                                ))}
                                <th className="p-1.5 text-center text-emerald-300">Days</th>
                                <th className="p-1.5 text-center text-red-300">OT</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {s.workers.map((w, idx) => {
                                let wDays = 0;
                                let wOT = 0;
                                return (
                                  <tr key={w.id} className="hover:bg-neutral-50">
                                    <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                                    <td className="p-1.5 font-bold text-gray-900">{w.name}</td>
                                    <td className="p-1.5 text-center text-gray-600">{w.role}</td>
                                    {DAY_KEYS.map((k) => {
                                      const val = w.attendance[k] || '-';
                                      const isFullOrHalf = val === '1.0' || val === '0.5';
                                      const ot = isFullOrHalf ? parseFloat(String(w.ot[k])) || 0 : 0;
                                      if (val === '1.0') wDays += 1.0;
                                      else if (val === '0.5') wDays += 0.5;
                                      const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
                                      wOT += ot + attHours;

                                      return (
                                        <td key={k} className="p-1.5 text-center">
                                          {val}
                                          {ot > 0 && isFullOrHalf && (
                                            <span className="text-[9px] text-red-600 block">+{ot}h</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="p-1.5 text-center font-bold text-emerald-800">
                                      {wDays.toFixed(1)}
                                    </td>
                                    <td className="p-1.5 text-center font-bold text-red-700">
                                      {wOT > 0 ? `${wOT}h` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic p-2 bg-white rounded border border-gray-200 text-center">
                          No workers recorded for this location yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Single Site Summary Location Banner */}
                <div className="bg-neutral-50 rounded-lg border-l-4 border-l-[#d11a2a] border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Project Site Location
                    </div>
                    <div className="text-lg font-black text-gray-900 flex items-center flex-wrap gap-2">
                      <span>{selectedSite}</span>
                      {singleSiteTotals.siteBale > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                          Site Bale: ₱{singleSiteTotals.siteBale.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      singleSiteData?.isDone
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {singleSiteData?.isDone ? 'Completed' : 'Active Site'}
                  </span>
                </div>

                {/* Single Site Summary Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-neutral-50 rounded border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Headcount</span>
                    <span className="text-lg font-black text-gray-900 block">{singleSiteTotals.workerCount}</span>
                    <span className="text-[10px] text-gray-500 font-medium">Registered Workers</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">Days Worked</span>
                    <span className="text-lg font-black text-emerald-950 block">
                      {singleSiteTotals.totalDays.toFixed(1)}d
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Accumulated Shifts</span>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded border border-red-200">
                    <span className="text-[10px] font-bold text-red-800 block uppercase">Overtime</span>
                    <span className="text-lg font-black text-red-950 block">{singleSiteTotals.totalOT}h</span>
                    <span className="text-[10px] text-red-700 font-medium">Extra Hours</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase">Site Bale</span>
                    <span className="text-lg font-black text-amber-950 block">
                      {singleSiteTotals.siteBale > 0 ? `₱${singleSiteTotals.siteBale.toLocaleString()}` : 'None'}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Cash Advance</span>
                  </div>
                </div>

                {/* Single Site Attendance Table Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0d0d0d] text-white">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">Worker Name</th>
                        <th className="p-2 text-center">Role</th>
                        {datesList.map((d) => (
                          <th key={d.key} className="p-2 text-center">
                            <span className="block text-[10px] text-gray-400">{d.monthStr}</span>
                            <span>{d.dayNum}</span>
                          </th>
                        ))}
                        <th className="p-2 text-center text-emerald-300">Days</th>
                        <th className="p-2 text-center text-red-300">OT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {singleSiteWorkers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="p-6 text-center text-gray-500 font-medium italic"
                          >
                            No workers recorded for this location yet.
                          </td>
                        </tr>
                      ) : (
                        singleSiteWorkers.map((w, idx) => {
                          let wDays = 0;
                          let wOT = 0;

                          return (
                            <tr key={w.id} className="hover:bg-neutral-50">
                              <td className="p-2 text-center font-bold text-gray-500">{idx + 1}</td>
                              <td className="p-2 font-black text-gray-900">{w.name}</td>
                              <td className="p-2 text-center">
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                                  {w.role}
                                </span>
                              </td>
                              {DAY_KEYS.map((k) => {
                                const val = w.attendance[k] || '-';
                                const isFullOrHalf = val === '1.0' || val === '0.5';
                                const ot = isFullOrHalf ? parseFloat(String(w.ot[k])) || 0 : 0;

                                if (val === '1.0') wDays += 1.0;
                                else if (val === '0.5') wDays += 0.5;

                                const attHours = val === '1h' ? 1 : val === '2h' ? 2 : 0;
                                wOT += ot + attHours;

                                return (
                                  <td key={k} className="p-2 text-center text-gray-700">
                                    <span
                                      className={`font-semibold ${
                                        val === '1.0'
                                          ? 'text-emerald-800'
                                          : val === '0.5'
                                          ? 'text-amber-800'
                                          : val === 'absent'
                                          ? 'text-red-600 font-bold'
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      {val}
                                    </span>
                                    {ot > 0 && isFullOrHalf && (
                                      <span className="text-[9px] text-red-600 font-bold block">
                                        +{ot}h
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="p-2 text-center font-bold text-emerald-800">
                                {wDays.toFixed(1)}
                              </td>
                              <td className="p-2 text-center font-bold text-red-700">
                                {wOT > 0 ? `${wOT}h` : '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {singleSiteWorkers.length > 0 && (
                      <tfoot>
                        <tr className="bg-neutral-100 font-bold border-t-2 border-gray-300 text-[11px]">
                          <td colSpan={3} className="p-2 text-gray-700 uppercase">
                            Totals ({singleSiteWorkers.length} Workers)
                          </td>
                          <td colSpan={6} className="p-2 text-center text-gray-400">
                            —
                          </td>
                          <td className="p-2 text-center text-emerald-800">
                            {singleSiteTotals.totalDays.toFixed(1)}d
                          </td>
                          <td className="p-2 text-center text-red-700">
                            {singleSiteTotals.totalOT > 0 ? `${singleSiteTotals.totalOT}h` : '-'}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Single Site Remarks */}
                {includeNotes && singleSiteData?.siteRemarksHistory && singleSiteData.siteRemarksHistory.length > 0 && (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-gray-200">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Site Announcements & Field Notes
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {singleSiteData.siteRemarksHistory.slice(-3).map((rem, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#d11a2a] font-bold">•</span>
                          <div>
                            {rem.timestamp && (
                              <span className="text-[10px] text-gray-400 font-bold mr-1.5">
                                [{rem.timestamp}]
                              </span>
                            )}
                            <span>{rem.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Verification Signatures Preview */}
            {includeSignatures && (
              <div className="pt-6 border-t border-gray-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <div className="border-b border-gray-400 pb-8 mb-1"></div>
                    <div className="font-bold text-gray-800 uppercase text-[11px]">Prepared By</div>
                    <div className="text-[10px] text-gray-500">Site Timekeeper / Lead</div>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 pb-8 mb-1"></div>
                    <div className="font-bold text-gray-800 uppercase text-[11px]">Verified By</div>
                    <div className="text-[10px] text-gray-500">Project Engineer / Foreman</div>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 pb-8 mb-1"></div>
                    <div className="font-bold text-gray-800 uppercase text-[11px]">Approved By</div>
                    <div className="text-[10px] text-gray-500">ARCDESIGN Operations Manager</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="bg-white px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium">
            Format: <span className="font-bold text-gray-800">{orientation.toUpperCase()} PDF</span>{' '}
            (ISO A4 standard, high-resolution vector)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print via Browser</span>
            </button>

            <button
              id="downloadPdfButton"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 bg-[#d11a2a] hover:bg-red-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'Generating PDF...'
                  : isAllSites
                  ? 'Download All-Sites PDF Report'
                  : 'Download Formatted PDF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
