const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImageData = null;
let isDrawing = false;
let brushColor = '#00ffff';
let brushSize = 5;
let tintColor = '#ff00ff';

// Cargar imagen
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      originalImageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// Filtros básicos
function getImgData() { return ctx.getImageData(0,0,canvas.width,canvas.height); }
function putImgData(d){ ctx.putImageData(d,0,0); }

document.getElementById('btnGray').onclick = () => {
  const id = getImgData(); const d = id.data;
  for(let i=0;i<d.length;i+=4){
    const v = 0.3*d[i] + 0.59*d[i+1] + 0.11*d[i+2];
    d[i]=d[i+1]=d[i+2]=v;
  }
  putImgData(id);
};

document.getElementById('btnInvert').onclick = () => {
  const id = getImgData(); const d = id.data;
  for(let i=0;i<d.length;i+=4){
    d[i]=255-d[i]; d[i+1]=255-d[i+1]; d[i+2]=255-d[i+2];
  }
  putImgData(id);
};

document.getElementById('btnSepia').onclick = () => {
  const id = getImgData(); const d = id.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i], g=d[i+1], b=d[i+2];
    d[i] = 0.393*r + 0.769*g + 0.189*b;
    d[i+1] = 0.349*r + 0.686*g + 0.168*b;
    d[i+2] = 0.272*r + 0.534*g + 0.131*b;
  }
  putImgData(id);
};

document.getElementById('btnBlur').onclick = () => {
  ctx.filter = 'blur(2px)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
};

document.getElementById('btnPixel').onclick = () => {
  const scale = 0.1;
  const temp = document.createElement('canvas');
  temp.width = canvas.width * scale;
  temp.height = canvas.height * scale;
  const tctx = temp.getContext('2d');
  tctx.drawImage(canvas, 0, 0, temp.width, temp.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
};

// Brillo y contraste
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
document.getElementById('btnApplyBC').onclick = () => {
  const b = parseInt(brightness.value);
  const c = parseInt(contrast.value);
  const id = getImgData(); const d = id.data;
  const factor = (259 * (c + 255)) / (255 * (259 - c));
  for(let i=0;i<d.length;i+=4){
    d[i] = factor*(d[i]-128)+128 + b;
    d[i+1] = factor*(d[i+1]-128)+128 + b;
    d[i+2] = factor*(d[i+2]-128)+128 + b;
  }
  putImgData(id);
};

// Dibujo
const brushVal = document.getElementById('brushVal');
document.getElementById('brushSize').oninput = e => {
  brushSize = e.target.value;
  brushVal.textContent = brushSize;
};

function startDraw(e){
  isDrawing = true;
  draw(e);
}
function draw(e){
  if(!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.fillStyle = brushColor;
  ctx.beginPath();
  ctx.arc(x, y, brushSize, 0, Math.PI*2);
  ctx.fill();
}
function endDraw(){ isDrawing = false; }

document.getElementById('btnDraw').onclick = () => {
  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  canvas.onmouseup = endDraw;
  canvas.onmouseleave = endDraw;
};

document.getElementById('btnErase').onclick = () => {
  ctx.fillStyle = '#111';
  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  canvas.onmouseup = endDraw;
  canvas.onmouseleave = endDraw;
};

// Paletas
const colors = ['#00ffff','#ff00ff','#ff0077','#00ff55','#ffaa00','#ffffff','#999999','#000000','#6600ff','#00aaff'];
const tints = ['#00ffff','#ff00ff','#ff0077','#ffaa00','#00ff55','#00aaff','#ff3300','#9900ff','#ffcc00','#33ffcc'];

const palette = document.getElementById('palette');
colors.forEach(c=>{
  const div = document.createElement('div');
  div.style.background = c;
  div.onclick = ()=>brushColor=c;
  palette.appendChild(div);
});

const tintPalette = document.getElementById('tintPalette');
tints.forEach(c=>{
  const div = document.createElement('div');
  div.style.background = c;
  div.onclick = ()=>tintColor=c;
  tintPalette.appendChild(div);
});

document.getElementById('btnTint').onclick = () => {
  const id = getImgData(); const d = id.data;
  const tint = hexToRgb(tintColor);
  for(let i=0;i<d.length;i+=4){
    d[i] = (d[i] + tint.r) / 2;
    d[i+1] = (d[i+1] + tint.g) / 2;
    d[i+2] = (d[i+2] + tint.b) / 2;
  }
  putImgData(id);
};

function hexToRgb(hex){
  const n = parseInt(hex.slice(1), 16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

// Reset y descarga
document.getElementById('btnReset').onclick = () => {
  if (originalImageData) putImgData(originalImageData);
};

document.getElementById('btnDownload').onclick = () => {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'imagen_editada.png';
    a.click();
  });
};
