const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 800;

const SIZE = 75;
const SQRT3 = Math.sqrt(3);

// --- Recursos y colores (se guarda copia original para reinicio) ---
const RESOURCES = {
    wood: { color: '#2E8B57', name: 'Bosque' },
    wheat: { color: '#FFD700', name: 'Campo' },
    sheep: { color: '#90EE90', name: 'Pasto' },
    brick: { color: '#CD5C5C', name: 'Arcilla' },
    ore: { color: '#696969', name: 'Montaña' },
    desert: { color: '#F4E4C1', name: 'Desierto' }
};

// Guardamos colores originales para reinicio
const DEFAULT_COLORS = {};
for (const key in RESOURCES) {
    DEFAULT_COLORS[key] = RESOURCES[key].color;
}

// --- Datos del tablero original (se usará para reiniciar) ---
const DEFAULT_HEXAGONS = [
    { q: 0, r: -2, resource: 'wood', number: 10 },
    { q: 1, r: -2, resource: 'wheat', number: 2 },
    { q: 2, r: -2, resource: 'sheep', number: 6 },
    { q: -1, r: -1, resource: 'sheep', number: 9 },
    { q: 0, r: -1, resource: 'wood', number: 12 },
    { q: 1, r: -1, resource: 'brick', number: 11 },
    { q: 2, r: -1, resource: 'ore', number: 4 },
    { q: -2, r: 0, resource: 'ore', number: 5 },
    { q: -1, r: 0, resource: 'wheat', number: 3 },
    { q: 0, r: 0, resource: 'desert', number: null },
    { q: 1, r: 0, resource: 'sheep', number: 8 },
    { q: 2, r: 0, resource: 'brick', number: 10 },
    { q: -2, r: 1, resource: 'wood', number: 6 },
    { q: -1, r: 1, resource: 'sheep', number: 4 },
    { q: 0, r: 1, resource: 'ore', number: 9 },
    { q: 1, r: 1, resource: 'wheat', number: 3 },
    { q: -2, r: 2, resource: 'brick', number: 8 },
    { q: -1, r: 2, resource: 'wood', number: 11 },
    { q: 0, r: 2, resource: 'wheat', number: 5 }
];

// Estado actual del tablero
let hexagons = JSON.parse(JSON.stringify(DEFAULT_HEXAGONS));

// --- Conversión de coordenadas ---
function axialToPixel(q, r) {
    return {
        px: SIZE * SQRT3 * (q + r / 2),
        py: SIZE * 1.5 * r
    };
}

// --- Centrar el tablero ---
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

// --- Calcular coordenadas de pantalla y vértices ---
function calculateHexCoords(hex) {
    const { px, py } = axialToPixel(hex.q, hex.r);
    hex.cx = px + offsetX;
    hex.cy = py + offsetY;
    hex.vertices = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        hex.vertices.push({
            x: hex.cx + SIZE * Math.cos(angle),
            y: hex.cy + SIZE * Math.sin(angle)
        });
    }
}

hexagons.forEach(h => calculateHexCoords(h));

// --- Dibujar un hexágono ---
function drawHex(hex) {
    const { cx, cy, vertices, resource, number } = hex;
    const color = RESOURCES[resource].color;

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

    if (number !== null && number !== undefined) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(cx, cy - 5, 22, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, cx, cy - 5);

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
        ctx.fillStyle = '#8a7a60';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏜️', cx, cy);
    }
}

// --- Dibujar todo ---
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(h => drawHex(h));
}

// --- Detectar clic en hexágono (Raycasting) ---
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

// --- Obtener el hexágono en una posición (mouse) ---
function getHexAt(mx, my) {
    for (let hex of hexagons) {
        if (isPointInHex(mx, my, hex.vertices)) {
            return hex;
        }
    }
    return null;
}

// --- Evento: Clic izquierdo → cambiar número ---
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const hex = getHexAt(mouseX, mouseY);
    if (!hex) return;

    if (hex.resource === 'desert') {
        alert('El desierto no tiene número.');
        return;
    }

    const currentNumber = hex.number;
    const newNumber = prompt(
        `Ingresa un número del 2 al 12 para el ${RESOURCES[hex.resource].name}:`,
        currentNumber
    );
    if (newNumber === null) return;
    const num = parseInt(newNumber);
    if (!isNaN(num) && num >= 2 && num <= 12 && num !== 7) {
        hex.number = num;
        drawBoard();
    } else {
        alert('❌ Número inválido. Debe ser del 2 al 12, excluyendo el 7.');
    }
});

// --- Evento: Clic derecho → cambiar recurso ---
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Evitar menú contextual del navegador

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const hex = getHexAt(mouseX, mouseY);
    if (!hex) return;

    // Mostrar opciones de recursos (usamos prompt con números)
    const options = Object.keys(RESOURCES).map((key, idx) => 
        `${idx+1}. ${RESOURCES[key].name}`
    ).join('\n');
    
    const choice = prompt(
        `Elige el nuevo recurso para este hexágono:\n${options}\n\n(Introduce el número)`,
        '1'
    );
    if (choice === null) return;

    const idx = parseInt(choice) - 1;
    const keys = Object.keys(RESOURCES);
    if (isNaN(idx) || idx < 0 || idx >= keys.length) {
        alert('❌ Opción inválida.');
        return;
    }

    const newResource = keys[idx];
    const oldResource = hex.resource;

    // Si el nuevo recurso es desierto, eliminar número
    if (newResource === 'desert') {
        hex.number = null;
    } else {
        // Si antes era desierto y ahora no, pedir un número
        if (oldResource === 'desert' || hex.number === null) {
            const numPrompt = prompt(
                `Ingresa un número del 2 al 12 para el nuevo ${RESOURCES[newResource].name}:`,
                '8'
            );
            if (numPrompt === null) return; // cancela, no cambia
            const num = parseInt(numPrompt);
            if (!isNaN(num) && num >= 2 && num <= 12 && num !== 7) {
                hex.number = num;
            } else {
                alert('❌ Número inválido. No se cambiará el recurso.');
                return;
            }
        }
        // Si ya tenía número, lo conservamos
    }

    // Cambiar el recurso
    hex.resource = newResource;
    drawBoard();
});

// --- Generar la leyenda con selectores de color ---
function updateLegend() {
    const container = document.getElementById('legendContainer');
    container.innerHTML = '';

    for (const [key, value] of Object.entries(RESOURCES)) {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = value.color;
        colorInput.dataset.resource = key;

        colorInput.addEventListener('input', (e) => {
            const resourceKey = e.target.dataset.resource;
            RESOURCES[resourceKey].color = e.target.value;
            drawBoard();
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = value.name;

        item.appendChild(colorInput);
        item.appendChild(nameSpan);
        container.appendChild(item);
    }
}

// --- Reiniciar completamente el tablero ---
function resetBoard() {
    // 1. Restaurar recursos y números originales
    hexagons = JSON.parse(JSON.stringify(DEFAULT_HEXAGONS));
    hexagons.forEach(h => calculateHexCoords(h));

    // 2. Restaurar colores originales
    for (const key in DEFAULT_COLORS) {
        RESOURCES[key].color = DEFAULT_COLORS[key];
    }

    // 3. Actualizar la leyenda visual
    updateLegend();

    // 4. Redibujar
    drawBoard();
}

document.getElementById('resetButton').addEventListener('click', resetBoard);

// --- Inicializar ---
updateLegend();
drawBoard();
