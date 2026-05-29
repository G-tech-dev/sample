import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiAward, FiAlertCircle, FiDownload, FiFilter, FiRefreshCw, 
  FiBarChart2, FiCheckCircle, FiXCircle, FiPrinter, FiX,
  FiUser, FiFileText
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

const Report = () => {
  const [reportData, setReportData] = useState({ competent: [], notYetCompetent: [], summary: {} });
  const [trades, setTrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [filters, setFilters] = useState({ trade_id: '', module_id: '' });
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Individual student report
  const [allTrainees, setAllTrainees] = useState([]);
  const [selectedPrintTrade, setSelectedPrintTrade] = useState('');
  const [selectedPrintStudent, setSelectedPrintStudent] = useState('');
  const [studentsInTrade, setStudentsInTrade] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      await fetchFiltersData();
      await fetchAllTrainees();
      await fetchReport();
    };
    loadAll();
  }, []);

  const fetchFiltersData = async () => {
    try {
      const [tradesRes, modulesRes] = await Promise.all([
        api.get('/trades'),
        api.get('/modules')
      ]);
      setTrades(tradesRes.data || []);
      setModules(modulesRes.data || []);
    } catch (err) {
      console.error('Failed to load filters', err);
      toast.error('Could not load trades/modules');
    }
  };

  const fetchAllTrainees = async () => {
    try {
      const res = await api.get('/trainees');
      setAllTrainees(res.data || []);
    } catch (err) {
      console.error('Failed to load trainees', err);
      toast.error('Could not load trainees list');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.trade_id) params.trade_id = filters.trade_id;
      if (filters.module_id) params.module_id = filters.module_id;
      const response = await api.get('/reports/competency', { params });
      const rawData = response.data;
      
      const allEnrollments = [...(rawData.competent || []), ...(rawData.notYetCompetent || [])];
      
      if (filters.module_id) {
        const traineeMap = new Map();
        allEnrollments.forEach(enrollment => {
          const id = enrollment.trainee_id;
          if (!traineeMap.has(id)) {
            traineeMap.set(id, {
              trainee_id: id,
              name: enrollment.name,
              trade: enrollment.trade,
              module: enrollment.module,
              module_code: enrollment.module_code,
              total_marks: enrollment.total_marks,
              formative: enrollment.formative,
              summative: enrollment.summative
            });
          }
        });
        const competent = [];
        const notYet = [];
        for (const trainee of traineeMap.values()) {
          const score = trainee.total_marks;
          if (score === null || score === undefined) continue;
          const output = {
            trainee_id: trainee.trainee_id,
            name: trainee.name,
            trade: trainee.trade,
            average_marks: score,
            modules_count: 1,
            module_name: trainee.module,
            module_code: trainee.module_code,
            formative: trainee.formative,
            summative: trainee.summative
          };
          if (score >= 70) competent.push(output);
          else notYet.push(output);
        }
        competent.sort((a,b) => b.average_marks - a.average_marks);
        notYet.sort((a,b) => b.average_marks - a.average_marks);
        setReportData({
          competent,
          notYetCompetent: notYet,
          summary: {
            total_assessed: competent.length + notYet.length,
            total_competent: competent.length,
            total_not_yet_competent: notYet.length
          }
        });
      } else {
        const traineeMap = new Map();
        allEnrollments.forEach(enrollment => {
          const id = enrollment.trainee_id;
          if (!traineeMap.has(id)) {
            traineeMap.set(id, {
              trainee_id: id,
              name: enrollment.name,
              trade: enrollment.trade,
              enrollments: []
            });
          }
          traineeMap.get(id).enrollments.push(enrollment.total_marks);
        });
        const competent = [];
        const notYet = [];
        for (const trainee of traineeMap.values()) {
          const grades = trainee.enrollments.filter(g => g !== null && g !== undefined);
          if (grades.length === 0) continue;
          const avg = grades.reduce((a,b) => a + b, 0) / grades.length;
          const output = {
            trainee_id: trainee.trainee_id,
            name: trainee.name,
            trade: trainee.trade,
            average_marks: avg.toFixed(1),
            modules_count: grades.length
          };
          if (avg >= 70) competent.push(output);
          else notYet.push(output);
        }
        competent.sort((a,b) => parseFloat(b.average_marks) - parseFloat(a.average_marks));
        notYet.sort((a,b) => parseFloat(b.average_marks) - parseFloat(a.average_marks));
        setReportData({
          competent,
          notYetCompetent: notYet,
          summary: {
            total_assessed: competent.length + notYet.length,
            total_competent: competent.length,
            total_not_yet_competent: notYet.length
          }
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchReport();
  };

  const resetFilters = () => {
    setFilters({ trade_id: '', module_id: '' });
    setTimeout(fetchReport, 100);
  };

  const exportToCSV = (data, filename, isModuleFiltered) => {
    if (!data.length) return toast.error('No data to export');
    let headers, rows;
    if (isModuleFiltered) {
      headers = ['Trainee Name', 'Trade', 'Module', 'Module Code', 'Score (%)', 'Competency Status'];
      rows = data.map(item => [
        item.name,
        item.trade,
        item.module_name,
        item.module_code,
        item.average_marks,
        item.average_marks >= 70 ? 'Competent' : 'Not Yet Competent'
      ]);
    } else {
      headers = ['Trainee Name', 'Trade', 'Average Marks (%)', 'Modules Assessed', 'Competency Status'];
      rows = data.map(item => [
        item.name,
        item.trade,
        item.average_marks,
        item.modules_count,
        item.average_marks >= 70 ? 'Competent' : 'Not Yet Competent'
      ]);
    }
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== INDIVIDUAL STUDENT REPORT ==========
  const handlePrintTradeChange = (tradeId) => {
    setSelectedPrintTrade(tradeId);
    setSelectedPrintStudent('');
    if (tradeId) {
      const filtered = allTrainees.filter(t => {
        const tTradeId = t.trade_id?._id || t.trade_id;
        return tTradeId === tradeId;
      });
      setStudentsInTrade(filtered);
    } else {
      setStudentsInTrade([]);
    }
  };

  const printStudentReport = (student) => {
    if (!student) {
      toast.error('Please select a student');
      return;
    }

    const studentTradeId = student.trade_id?._id || student.trade_id;
    const studentTradeName = student.trade_id?.trade_name || 'N/A';

    const sameTradeTrainees = allTrainees.filter(t => {
      const tTradeId = t.trade_id?._id || t.trade_id;
      return tTradeId === studentTradeId;
    });

    const computeAvg = (t) => {
      const graded = (t.enrollments || []).filter(e => e.total_marks !== null && e.total_marks !== undefined);
      if (graded.length === 0) return null;
      const sum = graded.reduce((a, e) => a + e.total_marks, 0);
      return sum / graded.length;
    };

    const ranks = sameTradeTrainees
      .map(t => ({ trainee: t, avg: computeAvg(t) }))
      .filter(r => r.avg !== null)
      .sort((a, b) => b.avg - a.avg);

    const currentAvg = computeAvg(student);
    let position = null;
    if (currentAvg !== null) {
      const idx = ranks.findIndex(r => r.trainee._id === student._id);
      position = idx !== -1 ? idx + 1 : null;
    }

    const enrollmentsList = (student.enrollments || []).map(enr => ({
      moduleName: enr.module_id?.module_name || 'Unknown',
      moduleCode: enr.module_id?.module_code || 'N/A',
      enrollmentDate: new Date(enr.enrollment_date).toLocaleDateString(),
      formative: enr.formative !== null ? enr.formative : '—',
      summative: enr.summative !== null ? enr.summative : '—',
      total: enr.total_marks !== null ? `${enr.total_marks}%` : '—',
      competent: enr.total_marks !== null ? (enr.total_marks >= 70 ? 'Yes' : 'No') : '—'
    }));

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report - ${student.firstnames} ${student.lastnames}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 2rem; background: white; }
          .header { text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 2rem; }
          .header h1 { color: #fbbf24; }
          .info-grid { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(2,1fr); gap: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #111827; color: #fbbf24; }
          .competent { color: #15803d; font-weight: bold; }
          .nyc { color: #b45309; font-weight: bold; }
          .footer { margin-top: 2rem; text-align: center; font-size: 0.7rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem; }
          @media print { body { padding: 0.5in; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>XWISDOM Training</h1>
          <p>Individual Progress Report</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="info-grid">
          <div><strong>Name:</strong> ${student.firstnames} ${student.lastnames}</div>
          <div><strong>Gender:</strong> ${student.gender === 'male' ? 'Male' : 'Female'}</div>
          <div><strong>Trade:</strong> ${studentTradeName}</div>
          <div><strong>Overall Average:</strong> ${currentAvg !== null ? currentAvg.toFixed(1) + '%' : 'No graded modules'}</div>
          ${position ? `<div><strong>Rank in Trade:</strong> ${position} / ${ranks.length}</div>` : ''}
          <div><strong>Competency:</strong> ${currentAvg !== null ? (currentAvg >= 70 ? ' Competent' : ' Not Yet Competent') : 'Not Assessed'}</div>
        </div>
        <h3>Module Performance</h3>
        <table>
          <thead><tr><th>Module</th><th>Code</th><th>Enrolled</th><th>Formative</th><th>Summative</th><th>Total</th><th>Competent?</th></tr></thead>
          <tbody>
            ${enrollmentsList.map(e => `
              <tr>
                <td>${e.moduleName}</td>
                <td>${e.moduleCode}</td>
                <td>${e.enrollmentDate}</td>
                <td>${e.formative}</td>
                <td>${e.summative}</td>
                <td class="${e.total !== '—' && parseFloat(e.total) >= 70 ? 'competent' : 'nyc'}">${e.total}</td>
                <td>${e.competent}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>This report is computer generated.</p>
          <p>XWISDOM – Empowering Excellence</p>
        </div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print(); setTimeout(() => window.close(), 1000)" style="background:#f59e0b; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">🖨️ Print / PDF</button>
          <button onclick="window.close()" style="background:#6b7280; color:white; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; margin-left:10px;">Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ========== DETAILED TRADE REPORT (ALL TRAINEES IN SELECTED TRADE) ==========
  const printDetailedTradeReport = () => {
    const tradeId = filters.trade_id;
    const moduleId = filters.module_id;

    if (!tradeId) {
      toast.error('Please select a trade from the bulk report filter');
      return;
    }

    // Filter trainees by selected trade
    let traineesToPrint = allTrainees.filter(t => {
      const tTradeId = t.trade_id?._id || t.trade_id;
      return tTradeId === tradeId;
    });

    if (moduleId) {
      // Further filter by enrollment in the selected module
      traineesToPrint = traineesToPrint.filter(t =>
        (t.enrollments || []).some(enr => (enr.module_id?._id || enr.module_id) === moduleId)
      );
    }

    if (traineesToPrint.length === 0) {
      toast.error('No trainees found for the selected filters');
      return;
    }

    // Compute average for each trainee
    const computeAvgForTrainee = (trainee) => {
      if (moduleId) {
        // Use only the specific module's marks
        const enrollment = (trainee.enrollments || []).find(enr => (enr.module_id?._id || enr.module_id) === moduleId);
        return enrollment?.total_marks ?? null;
      } else {
        // Average all graded modules
        const graded = (trainee.enrollments || []).filter(e => e.total_marks !== null && e.total_marks !== undefined);
        if (graded.length === 0) return null;
        const sum = graded.reduce((a, e) => a + e.total_marks, 0);
        return sum / graded.length;
      }
    };

    // Attach average to each trainee and sort descending
    const traineesWithAvg = traineesToPrint.map(t => ({
      ...t,
      avg: computeAvgForTrainee(t)
    })).filter(t => t.avg !== null).sort((a,b) => b.avg - a.avg);

    if (traineesWithAvg.length === 0) {
      toast.error('No graded modules found for these trainees');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups.');
      return;
    }

    // Get trade name for header
    const tradeName = trades.find(t => t._id === tradeId)?.trade_name || 'Selected Trade';
    const moduleName = moduleId ? modules.find(m => m._id === moduleId)?.module_name || 'Selected Module' : 'All Modules';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detailed Trade Report - ${tradeName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 2rem; background: white; }
          .main-header { text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 2rem; }
          .main-header h1 { color: #fbbf24; }
          .filters-info { background: #f3f4f6; padding: 0.75rem; border-radius: 8px; margin-bottom: 2rem; text-align: center; }
          .student-section { page-break-after: always; margin-bottom: 2rem; }
          .student-section:last-child { page-break-after: auto; }
          .info-grid { background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(2,1fr); gap: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #111827; color: #fbbf24; }
          .competent { color: #15803d; font-weight: bold; }
          .nyc { color: #b45309; font-weight: bold; }
          .footer { text-align: center; font-size: 0.7rem; color: #6b7280; margin-top: 1rem; }
          @media print { body { padding: 0.5in; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="main-header">
          <h1>XWISDOM Training – Detailed Trade Report</h1>
          <p>Trade: ${tradeName} | ${moduleId ? `Module: ${moduleName}` : 'All Modules'}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Trainees sorted by ${moduleId ? 'module score' : 'overall average'} (highest to lowest)</p>
        </div>
        <div class="filters-info">
          <strong>Filters applied:</strong> Trade: ${tradeName} | Module: ${moduleName || 'All'} | Total trainees: ${traineesWithAvg.length}
        </div>
    `);

    // Helper to generate a full student report section
    const renderStudentSection = (student, rank) => {
      const studentTradeId = student.trade_id?._id || student.trade_id;
      const studentTradeName = student.trade_id?.trade_name || 'N/A';
      const sameTradeTrainees = traineesWithAvg.map(t => ({ trainee: t, avg: t.avg }));
      const currentAvg = student.avg;
      const position = sameTradeTrainees.findIndex(r => r.trainee._id === student._id) + 1;
      const totalInTrade = sameTradeTrainees.length;

      const enrollmentsList = (student.enrollments || []).map(enr => ({
        moduleName: enr.module_id?.module_name || 'Unknown',
        moduleCode: enr.module_id?.module_code || 'N/A',
        enrollmentDate: new Date(enr.enrollment_date).toLocaleDateString(),
        formative: enr.formative !== null ? enr.formative : '—',
        summative: enr.summative !== null ? enr.summative : '—',
        total: enr.total_marks !== null ? `${enr.total_marks}%` : '—',
        competent: enr.total_marks !== null ? (enr.total_marks >= 70 ? 'Yes' : 'No') : '—'
      }));

      printWindow.document.write(`
        <div class="student-section">
          <div class="info-grid">
            <div><strong>Name:</strong> ${student.firstnames} ${student.lastnames}</div>
            <div><strong>Gender:</strong> ${student.gender === 'male' ? 'Male' : 'Female'}</div>
            <div><strong>Trade:</strong> ${studentTradeName}</div>
            <div><strong>${moduleId ? 'Module Score' : 'Overall Average'}:</strong> ${currentAvg !== null ? currentAvg.toFixed(1) + '%' : 'No graded modules'}</div>
            <div><strong>Rank in Report:</strong> ${position} / ${totalInTrade}</div>
            <div><strong>Competency:</strong> ${currentAvg !== null ? (currentAvg >= 70 ? ' Competent' : ' Not Yet Competent') : 'Not Assessed'}</div>
          </div>
          <h3>Module Performance</h3>
          <table>
            <thead><tr><th>Module</th><th>Code</th><th>Enrolled</th><th>Formative</th><th>Summative</th><th>Total</th><th>Competent?</th></tr></thead>
            <tbody>
              ${enrollmentsList.map(e => `
                <tr>
                  <td>${e.moduleName}</td>
                  <td>${e.moduleCode}</td>
                  <td>${e.enrollmentDate}</td>
                  <td>${e.formative}</td>
                  <td>${e.summative}</td>
                  <td class="${e.total !== '—' && parseFloat(e.total) >= 70 ? 'competent' : 'nyc'}">${e.total}</td>
                  <td>${e.competent}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Page break – continue next student</div>
        </div>
      `);
    };

    traineesWithAvg.forEach((student, index) => {
      renderStudentSection(student, index + 1);
    });

    printWindow.document.write(`
        <div class="footer no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print(); setTimeout(() => window.close(), 1000)" style="background:#f59e0b; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; margin-right:10px;">🖨️ Print / PDF</button>
          <button onclick="window.close()" style="background:#6b7280; color:white; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">Close</button>
        </div>
      </body></html>
    `);
    printWindow.document.close();
  };

  // ========== BULK PRINT MODAL (UPDATED WITH FOURTH OPTION) ==========
  const openPrintModal = () => setShowPrintModal(true);
  const closePrintModal = () => setShowPrintModal(false);

  const generatePrintWindow = (type) => {
    let title = '';
    let competentData = reportData.competent || [];
    let notYetData = reportData.notYetCompetent || [];
    const isModuleFiltered = !!filters.module_id;

    let tradeName = 'All';
    if (filters.trade_id) {
      const found = trades.find(t => t._id === filters.trade_id);
      tradeName = found ? found.trade_name : 'Selected';
    }
    let moduleName = 'All';
    if (filters.module_id) {
      const found = modules.find(m => m._id === filters.module_id);
      moduleName = found ? found.module_name : 'Selected';
    }

    if (type === 'competent') title = 'Competent Trainees Report';
    else if (type === 'notYet') title = 'Not Yet Competent Trainees Report';
    else title = 'Complete Competency Report';

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - XWISDOM</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 2rem; background: white; color: black; }
          .header { text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 2rem; }
          .header h1 { color: #fbbf24; }
          .filters-info { background: #1f2937; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.5rem; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th { background: #111827; color: #fbbf24; border: 1px solid #374151; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px 10px; }
          .competent-badge { background: #065f46; color: #a7f3d0; padding: 2px 8px; border-radius: 20px; display: inline-block; }
          .nyc-badge { background: #78350f; color: black; padding: 2px 8px; border-radius: 20px; display: inline-block; }
          .footer { margin-top: 2rem; text-align: center; font-size: 0.7rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem; }
          @media print { body { padding: 0.5in; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header"><h1>XWISDOM Training System</h1><p>${title}</p><p>${new Date().toLocaleString()}</p></div>
        <div class="filters-info"><strong>Filters:</strong> Trade: ${tradeName} | Module: ${moduleName}</div>
    `);

    const renderTable = (data, tableTitle, isCompetentGroup) => {
      if (!data.length) {
        printWindow.document.write(`<p><em>No ${tableTitle.toLowerCase()} records found.</em></p>`);
        return;
      }
      printWindow.document.write(`<h3>${tableTitle} (${data.length})</h3><table><thead><tr><th>Trainee</th><th>Trade</th>${isModuleFiltered ? '<th>Module</th><th>Code</th>' : ''}<th>${isModuleFiltered ? 'Score (%)' : 'Avg. (%)'}</th>${!isModuleFiltered ? '<th>Modules</th>' : ''}<th>Competency</th></tr></thead><tbody>`);
      data.forEach(item => {
        printWindow.document.write(`<tr><td>${item.name}</td>
          <td>${item.trade || '—'}</td>
          ${isModuleFiltered ? `<td>${item.module_name || '—'}</td><td>${item.module_code || '—'}</td>` : ''}
          <td><strong>${item.average_marks}%</strong></td>
          ${!isModuleFiltered ? `<td>${item.modules_count}</td>` : ''}
          <td><span class="${isCompetentGroup ? 'competent-badge' : 'nyc-badge'}">${isCompetentGroup ? 'Competent' : 'Not Yet Competent'}</span></td>
        `);
      });
      printWindow.document.write(`</tbody></table>`);
    };

    if (type === 'competent') renderTable(competentData, 'Competent Trainees', true);
    else if (type === 'notYet') renderTable(notYetData, 'Not Yet Competent Trainees', false);
    else {
      renderTable(competentData, 'Competent Trainees', true);
      renderTable(notYetData, 'Not Yet Competent Trainees', false);
    }

    printWindow.document.write(`
        <div class="footer"><p>This report is computer generated.</p><p>XWISDOM – Empowering Excellence</p></div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print(); setTimeout(() => window.close(), 1000)" style="background:#f59e0b; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; margin-right:10px;">🖨️ Print / PDF</button>
          <button onclick="window.close()" style="background:#6b7280; color:white; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">Close</button>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    closePrintModal();
  };

  const TraineeTable = ({ title, data, icon, color, isModuleFiltered }) => (
    <div className="bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden mb-8 border border-gray-700">
      <div className={`p-5 border-b flex flex-wrap justify-between items-center gap-3 ${color}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-gray-100">{title}</h2>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-900/50 text-amber-400 text-xs font-semibold ml-1">{data.length}</span>
        </div>
        <div className="flex gap-2">
          {data.length > 0 && (
            <button onClick={() => exportToCSV(data, title.replace(/\s/g, '_'), isModuleFiltered)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-xl text-sm transition shadow-sm">
              <FiDownload size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
          <FiBarChart2 size={48} className="text-gray-600" />
          <p>No records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-amber-400 uppercase tracking-wider">Trainee</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-amber-400 uppercase tracking-wider">Trade</th>
                {isModuleFiltered && (<><th className="px-5 py-3 text-left text-xs font-semibold text-amber-400 uppercase tracking-wider">Module</th><th className="px-5 py-3 text-left text-xs font-semibold text-amber-400 uppercase tracking-wider">Code</th></>)}
                <th className="px-5 py-3 text-center text-xs font-semibold text-amber-400 uppercase tracking-wider">{isModuleFiltered ? 'Score (%)' : 'Avg. Marks (%)'}</th>
                {!isModuleFiltered && <th className="px-5 py-3 text-center text-xs font-semibold text-amber-400 uppercase tracking-wider">Modules Graded</th>}
                <th className="px-5 py-3 text-center text-xs font-semibold text-amber-400 uppercase tracking-wider">Competency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.map((item, idx) => {
                const isCompetent = parseFloat(item.average_marks) >= 70;
                return (
                  <tr key={idx} className="hover:bg-gray-700 transition">
                    <td className="px-5 py-3 text-sm font-medium text-gray-100">{item.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{item.trade || '—'}</td>
                    {isModuleFiltered && (<><td className="px-5 py-3 text-sm text-gray-400">{item.module_name || '—'}</td><td className="px-5 py-3 text-sm text-gray-400">{item.module_code || '—'}</td></>)}
                    <td className={`px-5 py-3 text-sm text-center font-bold ${isCompetent ? 'text-green-400' : 'text-amber-400'}`}>{item.average_marks}%</td>
                    {!isModuleFiltered && <td className="px-5 py-3 text-sm text-center text-gray-400">{item.modules_count}</td>}
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isCompetent ? 'bg-green-900/50 text-green-300' : 'bg-amber-900/50 text-amber-300'}`}>
                        {isCompetent ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                        {isCompetent ? 'Competent' : 'Not Yet Competent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const isModuleFiltered = !!filters.module_id;

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">Competency Report</h1>
              <p className="text-gray-400 mt-1 flex items-center gap-1">
                <FiBarChart2 size={14} />
                {isModuleFiltered ? 'Trainees sorted by module score (highest to lowest)' : 'Trainees sorted by overall average score (highest to lowest)'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchReport} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl font-medium">
                <FiRefreshCw size={16} /> Refresh
              </button>
              <button onClick={openPrintModal} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl border border-gray-700">
                <FiPrinter size={16} /> Print Options
              </button>
            </div>
          </div>
        </div>

        {/* Individual Student Report Section (unchanged) */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-5 mb-8 border border-gray-700">
          <div className="flex items-center gap-2 mb-4"><FiUser className="text-amber-400" size={20} /><h2 className="text-lg font-semibold text-amber-400">Print Individual Student Report</h2></div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-amber-400 mb-1">Select Trade</label>
              <select value={selectedPrintTrade} onChange={(e) => handlePrintTradeChange(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200">
                <option value="">-- Choose Trade --</option>
                {trades.map(t => <option key={t._id} value={t._id}>{t.trade_name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-amber-400 mb-1">Select Student</label>
              <select value={selectedPrintStudent} onChange={(e) => setSelectedPrintStudent(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200" disabled={!selectedPrintTrade}>
                <option value="">-- Choose Student --</option>
                {studentsInTrade.map(s => <option key={s._id} value={s._id}>{s.firstnames} {s.lastnames}</option>)}
              </select>
            </div>
            <button onClick={() => {
              const student = allTrainees.find(s => s._id === selectedPrintStudent);
              if (student) printStudentReport(student);
              else toast.error('Please select a student');
            }} disabled={!selectedPrintStudent} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black px-5 py-2.5 rounded-xl font-medium">
              <FiPrinter size={16} /> Print Student Report
            </button>
          </div>
        </div>

        {/* Bulk Report Filters */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-5 mb-8 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-amber-400 mb-1">Trade (for bulk & detailed reports)</label>
              <select name="trade_id" value={filters.trade_id} onChange={handleFilterChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200">
                <option value="">All Trades</option>
                {trades.map(t => <option key={t._id} value={t._id}>{t.trade_name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-amber-400 mb-1">Module</label>
              <select name="module_id" value={filters.module_id} onChange={handleFilterChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200">
                <option value="">All Modules</option>
                {modules.map(m => <option key={m._id} value={m._id}>{m.module_name} ({m.module_code})</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl font-medium">
                <FiFilter size={16} /> Apply
              </button>
              <button onClick={resetFilters} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-5 py-2.5 rounded-xl font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-gray-800 rounded-2xl shadow-sm border border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-2xl shadow-md p-5 border-l-4 border-amber-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm font-medium">Total Assessed</p><p className="text-3xl font-bold text-amber-400">{reportData.summary.total_assessed || 0}</p></div>
                  <div className="w-12 h-12 bg-amber-900/30 rounded-xl flex items-center justify-center"><FiBarChart2 className="text-amber-400" size={24} /></div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-2xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm font-medium">Competent</p><p className="text-3xl font-bold text-green-400">{reportData.summary.total_competent || 0}</p></div>
                  <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center"><FiAward className="text-green-400" size={24} /></div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-2xl shadow-md p-5 border-l-4 border-orange-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-400 text-sm font-medium">Not Yet Competent</p><p className="text-3xl font-bold text-orange-400">{reportData.summary.total_not_yet_competent || 0}</p></div>
                  <div className="w-12 h-12 bg-orange-900/30 rounded-xl flex items-center justify-center"><FiAlertCircle className="text-orange-400" size={24} /></div>
                </div>
              </div>
            </div>

            <TraineeTable title="Competent Trainees" data={reportData.competent} icon={<FiAward className="text-green-400" size={22} />} color="bg-gradient-to-r from-gray-800 to-gray-800" isModuleFiltered={isModuleFiltered} />
            <TraineeTable title="Not Yet Competent Trainees" data={reportData.notYetCompetent} icon={<FiAlertCircle className="text-orange-400" size={22} />} color="bg-gradient-to-r from-gray-800 to-gray-800" isModuleFiltered={isModuleFiltered} />
          </>
        )}
      </div>

      {/* Print Modal with FOUR options */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h2 className="text-xl font-bold text-amber-400">Print Options</h2>
              <button onClick={closePrintModal} className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">Select report type</p>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => generatePrintWindow('competent')} className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-amber-500 hover:bg-gray-700 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center"><FiAward className="text-green-400" size={20} /></div>
                    <div className="text-left"><p className="font-semibold text-gray-100">Competent Only</p><p className="text-xs text-gray-400">Summary table (competent trainees)</p></div>
                  </div>
                  <span className="text-amber-400 group-hover:translate-x-1 transition">→</span>
                </button>
                <button onClick={() => generatePrintWindow('notYet')} className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-amber-500 hover:bg-gray-700 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-900/30 rounded-full flex items-center justify-center"><FiAlertCircle className="text-orange-400" size={20} /></div>
                    <div className="text-left"><p className="font-semibold text-gray-100">Not Yet Competent Only</p><p className="text-xs text-gray-400">Summary table (not yet competent)</p></div>
                  </div>
                  <span className="text-amber-400 group-hover:translate-x-1 transition">→</span>
                </button>
                <button onClick={() => generatePrintWindow('all')} className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-amber-500 hover:bg-gray-700 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-900/30 rounded-full flex items-center justify-center"><FiBarChart2 className="text-amber-400" size={20} /></div>
                    <div className="text-left"><p className="font-semibold text-gray-100">All Trainees (Summary)</p><p className="text-xs text-gray-400">Both tables combined</p></div>
                  </div>
                  <span className="text-amber-400 group-hover:translate-x-1 transition">→</span>
                </button>
                {/* NEW: Detailed Trade Report */}
                <button onClick={() => { closePrintModal(); printDetailedTradeReport(); }} className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-amber-500 hover:bg-gray-700 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center"><FiFileText className="text-blue-400" size={20} /></div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-100">All Trainees (Detailed per Student)</p>
                      <p className="text-xs text-gray-400">Full individual reports for selected trade, sorted highest to lowest</p>
                    </div>
                  </div>
                  <span className="text-amber-400 group-hover:translate-x-1 transition">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;