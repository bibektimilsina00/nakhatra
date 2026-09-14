import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPdf(element: HTMLElement, fileName: string): Promise<void> {
  if (!element) return;

  // Temporarily make hidden element visible for capture
  const originalDisplay = element.style.display;
  const originalPosition = element.style.position;
  const originalLeft = element.style.left;
  const originalTop = element.style.top;
  const originalZIndex = element.style.zIndex;

  element.style.display = "block";
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.top = "0px";
  element.style.zIndex = "-100";

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      // This literal must be manually kept in sync with globals.css's light --t-cream since a PWA manifest / export-lib config is read outside any rendered DOM and can't reference a CSS custom property.
      backgroundColor: "#ede3d3",
      logging: false,
      windowWidth: 1200,
    } as any);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
  } finally {
    element.style.display = originalDisplay;
    element.style.position = originalPosition;
    element.style.left = originalLeft;
    element.style.top = originalTop;
    element.style.zIndex = originalZIndex;
  }
}
