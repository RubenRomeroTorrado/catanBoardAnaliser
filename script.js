const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');

// Tamaño interno fijo para el dibujo (siempre 800x800)
canvas.width = 800;
canvas.height = 800;

// Tamaño de cada hexágono (ajustado para que ocupe bien el ancho)
const SIZE = 75;
const SQRT3 = Math.sqrt(3);

// Mapa de colores y nombres de recursos
const RESOURCES = {
    wood: { color: '#2E8B57', name: 'Bosque' },
    wheat: { color: '#FFD700', name: 'Campo' },
    sheep: { color: '#90EE90', name: 'Pasto' },
    brick: { color: '#CD5C5C', name: 'Arcilla' },
    ore: { color: '#696969', name: 'Montaña' },
    desert: { color: '#F4E4C1', name: 'Desierto' }
};

// Datos del tablero estándar de Catan (19 hexágonos)
// q, r = coordenadas axiales (sistema de ejes para hexágonos)
let hexagons = [
    // Fila superior (r = -2)
    { q: 0, r: -2, resource: 'wood', number: 10 },
    { q: 1, r: -2, resource: 'wheat', number: 2 },
    { q: 2, r: -2, resource: 'sheep', number: 6 },
    // Fila r = -1
    { q: -1, r: -1, resource: 'sheep', number: 9 },
    { q: 0, r: -1, resource: 'wood', number: 12 },
    { q: 1, r: -1, resource: 'brick', number: 11 },
    { q: 2, r: -1, resource: 'ore', number: 4 },
    // Fila central (r = 0)
    { q: -2, r: 0, resource: 'ore', number: 5 },
    { q: -1, r: 0, resource: 'wheat', number: 3 },
    { q: 0, r: 0, resource: 'desert', number: null }, // Desierto
    { q: 1, r: 0, resource: 'sheep', number: 8 },
    { q: 2, r: 0, resource: 'brick', number: 10 },
    // Fila r = 1
    { q: -2, r: 1, resource: 'wood', number: 6 },
    { q: -1, r: 1, resource: 'sheep', number: 4 },
    { q: 0, r: 1, resource: 'ore', number: 9 },
    { q: 1, r: 1, resource: 'wheat', number: 3 },
    // Fila inferior (r = 2)
    { q: -2, r: 2, resource: 'brick', number: 8 },
    { q: -1, r: 2, resource: 'wood', number: 11 },
    { q: 0, r: 2, resource: 'wheat', number: 5 }
];

// --- Conversión de coordenadas axiales a píxeles ---
function axialToPixel(q, r) {
    const px = SIZE * SQRT3 * (q + r / 2);
    const py = SIZE * 1.5 * r;
    return { px, py };
}

// --- Calcular los límites del tablero para centrarlo ---
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
hexagons.forEach(h => {
    const { px, py } = axialToPixel(h.q, h.r);
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
});

const boardWidth = maxX - minX;
const boardHeight = maxY - minY;
const offsetX = (canvas.width - boardWidth) / 2 - minX;
const offsetY = (canvas.height - boardHeight) / 2 - minY;

// --- Precalcular las coordenadas de pantalla y los vértices de cada hexágono ---
hexagons.forEach(h => {
    const { px, py } = axialToPixel(h.q, h.r);
    h.cx = px + offsetX;
    h.cy = py + offsetY;

    // Calcular los 6 vértices del hexágono (punta arriba)
    h.vertices = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        const vx = h.cx + SIZE * Math.cos(angle);
        const vy = h.cy + SIZE * Math.sin(angle);
        h.vertices.push({ x: vx, y: vy });
    }
});

// --- Función para dibujar un hexágono ---
function drawHex(hex) {
    const { cx, cy, vertices, resource, number } = hex;
    const color = RESOURCES[resource].color;

    // 1. Dibujar el relleno y el borde
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Si tiene número, dibujar el círculo blanco y el número
    if (number !== null && number !== undefined) {
        // Sombra para destacar el número
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;

        // Círculo de fondo
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 22, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Número
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, cx, cy - 5);

        // 3. Dibujar los puntos de probabilidad (como en el Catan real)
        const dotMap = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
        const dots = dotMap[number] || 0;
        if (dots > 0) {
            const dotRadius = 4;
            const spacing = 12;
            const startX = cx - ((dots - 1) * spacing) / 2;
            const dotY = cy + 20;
            for (let i = 0; i < dots; i++) {
                ctx.beginPath();
                ctx.arc(startX + i * spacing, dotY, dotRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#1a1a1a';
                ctx.fill();
            }
        }
    } else {
        // Si es desierto, dibujar una pequeña "D" o dejarlo vacío (opcional)
        ctx.fillStyle = '#8a7a60';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏜️', cx, cy);
    }
}

// --- Dibujar todo el tablero ---
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(h => drawHex(h));
}

// --- Algoritmo de punto en polígono (Raycasting) para detectar clics ---
function isPointInHex(px, py, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        const intersect = ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// --- Manejar el clic del usuario para cambiar números ---
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Escalar la posición del mouse al tamaño interno del canvas (800x800)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Buscar en qué hexágono hizo clic
    for (let hex of hexagons) {
        if (isPointInHex(mouseX, mouseY, hex.vertices)) {
            // El desierto no tiene número
            if (hex.resource === 'desert') {
                alert('El desierto no tiene número.');
                return;
            }

            const currentNumber = hex.number;
            const newNumber = prompt(
                `Ingresa un número del 2 al 12 para el ${RESOURCES[hex.resource].name}:`,
                currentNumber
            );

            // Si el usuario cancela, no hacer nada
            if (newNumber === null) return;

            const num = parseInt(newNumber);
            if (!isNaN(num) && num >= 2 && num <= 12 && num !== 7) {
                hex.number = num;
                drawBoard(); // Redibujar todo el tablero
            } else {
                alert('❌ Número inválido. Debe ser del 2 al 12, excluyendo el 7.');
            }
            return;
        }
    }
});

// --- Iniciar el tablero ---
drawBoard();
