import { C } from './data';

type ExportReportOptions = {
  title: string;
  subtitle: string;
  generatedAt: string;
  filename: string;
};

export async function exportSustainabilityReport(container: HTMLElement, options: ExportReportOptions) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 10;
  const headerTop = 12;
  const contentTop = 32;
  const contentBottom = 10;
  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = pageHeight - contentTop - contentBottom;
  const markedBlocks = Array.from(container.querySelectorAll<HTMLElement>('[data-export-block="true"]'));
  const blockElements = (markedBlocks.length ? markedBlocks : Array.from(container.children))
    .filter((child): child is HTMLElement => child instanceof HTMLElement);

  const logoPngDataUrl = await loadLogoPngDataUrl('/jetwing-logo.png');
  const logoImage = logoPngDataUrl ? await loadImage(logoPngDataUrl) : null;

  const drawHeader = () => {
    drawPageFrame();

    if (logoImage && logoPngDataUrl) {
      const logoHeight = 8;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      pdf.addImage(logoPngDataUrl, 'PNG', pageWidth - marginX - logoWidth, headerTop - 2, logoWidth, logoHeight);
    }

    const titleColor = hexToRgb(C.primaryDark);
    const subtextColor = hexToRgb(C.subtext);
    const borderColor = hexToRgb(C.border);

    pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(options.title, marginX, headerTop);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(subtextColor.r, subtextColor.g, subtextColor.b);
    pdf.text(options.subtitle, marginX, 17);
    pdf.text(options.generatedAt, marginX, 21);

    pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, 24.5, pageWidth - marginX, 24.5);
  };

  const drawPageFrame = () => {
    const frameColor = hexToRgb(C.softGreenBd);
    pdf.setDrawColor(frameColor.r, frameColor.g, frameColor.b);
    pdf.setLineWidth(0.4);
    pdf.rect(6, 6, pageWidth - 12, pageHeight - 12);
  };

  const captureBlock = async (element: HTMLElement) => {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      scrollY: -window.scrollY,
      onclone: (doc) => {
        const shadowed = doc.querySelectorAll<HTMLElement>('.shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl');
        shadowed.forEach(el => {
          el.style.boxShadow = 'none';
        });
      },
    });

    const naturalWidth = contentWidth;
    const naturalHeight = (canvas.height * naturalWidth) / canvas.width;
    const fitRatio = naturalHeight > contentHeight ? contentHeight / naturalHeight : 1;

    return {
      image: canvas.toDataURL('image/png', 1.0),
      width: naturalWidth * fitRatio,
      height: naturalHeight * fitRatio,
    };
  };

  drawHeader();
  let cursorY = contentTop;
  let firstBlockOnPage = true;

  for (const block of blockElements) {
    const renderedBlock = await captureBlock(block);

    if (!firstBlockOnPage && cursorY + renderedBlock.height > pageHeight - contentBottom) {
      pdf.addPage();
      drawHeader();
      cursorY = contentTop;
      firstBlockOnPage = true;
    }

    if (renderedBlock.height > contentHeight || cursorY + renderedBlock.height > pageHeight - contentBottom) {
      if (cursorY !== contentTop) {
        pdf.addPage();
        drawHeader();
        cursorY = contentTop;
      }
    }

    pdf.addImage(renderedBlock.image, 'PNG', marginX, cursorY, renderedBlock.width, renderedBlock.height);
    cursorY += renderedBlock.height + 6;
    firstBlockOnPage = false;
  }

  pdf.save(options.filename);
}

async function loadLogoPngDataUrl(path: string) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return null;
    }
    ctx.drawImage(img, 0, 0);
    const pngDataUrl = canvas.toDataURL('image/png');
    URL.revokeObjectURL(objectUrl);
    return pngDataUrl;
  } catch {
    return null;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

