import * as THREE from 'three';
import type { ProjectBook } from '../types/book';

/**
 * Creates high-resolution procedural canvas textures for the 3D book components:
 * - Front Cover (embossed leather, gold filigree border, title, emblem)
 * - Spine (raised bands, vertical gilded typography, shelf call number)
 * - Back Cover (blurb, tech stack, library barcode)
 * - Paper Edge Block (layered paper leaf striations with gold leaf edging)
 */

function addLeatherGrain(ctx: CanvasRenderingContext2D, width: number, height: number, baseColor: string) {
  // Base fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Micro leather grain noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Radial vignette / antiquing around edges
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.35,
    width / 2, height / 2, width * 0.8
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export function createFrontCoverTexture(book: ProjectBook): THREE.CanvasTexture {
  const width = 1024;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  addLeatherGrain(ctx, width, height, book.coverColor);

  const foil = book.accentColor || '#d4af37';

  // Outer Gilded Ornamental Border
  ctx.strokeStyle = foil;
  ctx.lineWidth = 6;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.lineWidth = 2;
  ctx.strokeRect(66, 66, width - 132, height - 132);

  // Corner filigree accents
  const corners = [
    [50, 50], [width - 50, 50],
    [50, height - 50], [width - 50, height - 50]
  ];
  ctx.fillStyle = foil;
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top Archive Classification Header
  ctx.textAlign = 'center';
  ctx.font = '500 24px "Cinzel", "Times New Roman", serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('ATHENAEUM ARCHIVES • VOL. XXIV', width / 2, 130);

  ctx.font = '400 20px "JetBrains Mono", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText(book.edition.toUpperCase(), width / 2, 170);

  // Decorative Central Divider Line
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, 220);
  ctx.lineTo(width / 2 + 120, 220);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Central Emblem / Astrolabe Graphic
  const cy = 420;
  ctx.save();
  ctx.translate(width / 2, cy);
  ctx.strokeStyle = foil;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 75, 0, Math.PI * 2);
  ctx.stroke();

  // 8-point geometric star
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r1 = 85;
    const r2 = 35;
    const x1 = Math.cos(angle) * r1;
    const y1 = Math.sin(angle) * r1;
    const x2 = Math.cos(angle + Math.PI / 8) * r2;
    const y2 = Math.sin(angle + Math.PI / 8) * r2;
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fillStyle = foil;
  ctx.globalAlpha = 0.25;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.stroke();
  ctx.restore();

  // Book Title (Majestic Serif with embossed shadow)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.font = '700 68px "Cinzel", "Cormorant Garamond", serif';
  ctx.letterSpacing = '4px';

  // Wrap title if needed
  const words = book.title.split(' ');
  if (words.length > 2) {
    const line1 = words.slice(0, 2).join(' ');
    const line2 = words.slice(2).join(' ');
    ctx.fillText(line1, width / 2, 680);
    ctx.fillText(line2, width / 2, 760);
  } else {
    ctx.fillText(book.title, width / 2, 720);
  }

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = '400 32px "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(`“${book.subtitle}”`, width / 2, 850);

  // Bottom Curator Info
  ctx.font = '600 24px "Cinzel", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('CURATED & CODED BY', width / 2, 1150);

  ctx.font = '700 36px "Cormorant Garamond", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(book.curator.toUpperCase(), width / 2, 1205);

  // Bottom Call Number Plate
  ctx.strokeRect(width / 2 - 190, 1260, 380, 48);
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(book.callNumber, width / 2, 1292);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSpineTexture(book: ProjectBook): THREE.CanvasTexture {
  const width = 220;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  addLeatherGrain(ctx, width, height, book.coverColor);

  const foil = book.accentColor || '#d4af37';

  // Bookbinding Raised Bands (Horizontal Ribs)
  const bandYPositions = [140, 360, 680, 1000, 1240];
  bandYPositions.forEach(y => {
    // Drop shadow under band
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, y + 8, width, 6);
    // Highlight above band
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, y - 6, width, 4);
    // Gold filigree band
    ctx.fillStyle = foil;
    ctx.fillRect(20, y, width - 40, 6);
  });

  // Top Shelf Classification
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(book.year, width / 2, 90);

  // Vertical Book Title
  ctx.save();
  ctx.translate(width / 2 + 10, 520);
  ctx.rotate(Math.PI / 2);
  ctx.font = '700 42px "Cinzel", serif';
  ctx.letterSpacing = '6px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText(book.title.toUpperCase(), 0, 0);
  ctx.restore();

  // Vertical Curator Name
  ctx.save();
  ctx.translate(width / 2 + 4, 840);
  ctx.rotate(Math.PI / 2);
  ctx.font = '500 22px "Cormorant Garamond", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(book.curator.toUpperCase(), 0, 0);
  ctx.restore();

  // Bottom Library Call Number
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.letterSpacing = '1px';
  const callParts = book.callNumber.split(' ');
  ctx.fillText(callParts[0] + ' ' + (callParts[1] || ''), width / 2, 1160);
  ctx.fillText(callParts.slice(2).join(' '), width / 2, 1185);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBackCoverTexture(book: ProjectBook): THREE.CanvasTexture {
  const width = 1024;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  addLeatherGrain(ctx, width, height, book.coverColor);

  // Mirror horizontal coordinates so the texture is oriented left-to-right when rotated 180 deg in 3D
  ctx.translate(width, 0);
  ctx.scale(-1, 1);

  const foil = book.accentColor || '#d4af37';

  // Outer Border
  ctx.strokeStyle = foil;
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Header
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.font = '600 28px "Cinzel", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('DISCOURSE & ARCHIVAL DIGEST', width / 2, 160);

  // Decorative divider
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, 200);
  ctx.lineTo(width / 2 + 140, 200);
  ctx.stroke();

  // Synopsis Paragraph
  ctx.textAlign = 'center';
  ctx.font = '400 26px/40px "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '1px';
  
  // Wrap synopsis text
  const words = book.fullSynopsis.split(' ');
  let line = '';
  let lineY = 280;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 260 && i > 0) {
      ctx.fillText(line, width / 2, lineY);
      line = words[i] + ' ';
      lineY += 44;
      if (lineY > 600) break; // keep within upper section
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, width / 2, lineY);

  // Key Technical Ingredients / Stamped Runes
  ctx.font = '700 22px "Cinzel", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('COMPOSITION & MATERIAL MEDIUM', width / 2, 740);

  const techList = book.techStack.join('  •  ');
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(techList, width / 2, 800);

  // Key Metrics Stamped in Gilded Boxes
  const boxW = 220;
  const boxH = 90;
  const startX = (width - (book.metrics.length * boxW + (book.metrics.length - 1) * 30)) / 2;
  book.metrics.forEach((m, idx) => {
    const bx = startX + idx * (boxW + 30);
    const by = 880;
    ctx.strokeStyle = foil;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.font = '400 15px "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(m.label.toUpperCase(), bx + boxW / 2, by + 34);

    ctx.font = '700 26px "Cinzel", serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(m.value, bx + boxW / 2, by + 70);
  });

  // Simulated Library Barcode at Bottom
  const barcodeY = 1140;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(width / 2 - 160, barcodeY, 320, 100);

  ctx.fillStyle = '#000000';
  for (let x = width / 2 - 140; x < width / 2 + 140; x += 4) {
    if (Math.random() > 0.35) {
      const barW = Math.random() > 0.5 ? 3 : 1.5;
      ctx.fillRect(x, barcodeY + 12, barW, 60);
    }
  }
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText(`ISBN 978-0-24-${book.year}`, width / 2, barcodeY + 88);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPaperEdgesTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Aged cream paper base
  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(0, 0, width, height);

  // Micro horizontal paper leaf striations
  for (let y = 0; y < height; y += 2) {
    const shade = Math.sin(y * 12.0) * 15 + (Math.random() - 0.5) * 20;
    const r = Math.min(255, Math.max(0, 235 + shade));
    const g = Math.min(255, Math.max(0, 220 + shade));
    const b = Math.min(255, Math.max(0, 195 + shade));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, width, 2);
  }

  // Golden edge dusting wash (gilding)
  const goldGradient = ctx.createLinearGradient(0, 0, width, 0);
  goldGradient.addColorStop(0, 'rgba(212, 175, 55, 0.45)');
  goldGradient.addColorStop(0.5, 'rgba(245, 225, 140, 0.15)');
  goldGradient.addColorStop(1, 'rgba(212, 175, 55, 0.45)');
  ctx.fillStyle = goldGradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}
