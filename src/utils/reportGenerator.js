import { jsPDF } from 'jspdf';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return d.toLocaleDateString();
};

const createSection = (doc, title, lines, startY) => {
  const lineHeight = 14;
  const sectionGap = 14;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 24;
  const maxWidth = pageWidth - margin * 2;

  doc.setFontSize(14);
  doc.setTextColor('#1f2937');
  doc.text(title, margin, startY);
  let y = startY + lineHeight;

  doc.setFontSize(10);
  doc.setTextColor('#4b5563');

  const wrappedLines = [];
  lines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    wrappedLines.push(...wrapped);
  });

  wrappedLines.forEach((line) => {
    if (y + lineHeight > pageHeight - 40) {
      doc.addPage();
      y = 40;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  return y + sectionGap;
};

export const generateProjectReportPdf = async ({ project, tasks, workload }) => {
  const doc = new jsPDF({ format: 'a4', unit: 'pt' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(`Project Report: ${project?.name || 'Untitled'}`, 16, 40);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  let cursorY = 60;

  // Project details
  cursorY = createSection(doc, 'Overview', [
    `Name: ${project?.name || 'N/A'}`,
    `Status: ${project?.status || 'N/A'}`,
    `Start date: ${formatDate(project?.startDate)}`,
    `End date: ${formatDate(project?.endDate)}`,
    `Description: ${project?.description || 'N/A'}`
  ], cursorY);

  // AI insights summary
  if (project?.aiPlan?.summary) {
    cursorY = createSection(doc, 'AI Summary', [project.aiPlan.summary], cursorY);
  }

  // Tasks summary
  const taskCount = tasks?.length || 0;
  const statusCounts = (tasks || []).reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const taskLines = [
    `Total tasks: ${taskCount}`,
    ...Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`),
  ];

  cursorY = createSection(doc, 'Backlog Snapshot', taskLines, cursorY);

  // Workload
  if (workload?.members) {
    const memberLines = workload.members.slice(0, 10).map((m) => {
      return `${m.name}: ${m.tasks} tasks, ${m.points} points (${m.status})`;
    });

    cursorY = createSection(doc, 'Team Load (top members)', memberLines, cursorY);
  }

  // Ensure we don't overflow page
  if (cursorY > 740) {
    doc.addPage();
    cursorY = 40;
  }

  // Include top 5 tasks as quick reference
  const topTasks = (tasks || []).slice(0, 5);
  if (topTasks.length) {
    const taskLines = topTasks.map((t) => `• [${t.status}] ${t.title} (${t.points ?? 'n/a'} pts)`);
    cursorY = createSection(doc, 'Sample Tasks', taskLines, cursorY);
  }

  const filename = `${project?.name?.replace(/\s+/g, '_') || 'project'}_report.pdf`;
  doc.save(filename);
};
