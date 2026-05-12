const FULL_ANGLE = 2 * Math.PI;

const drawRoundObject = (position, radius, graph) => {
    graph.beginPath();
    graph.arc(position.x, position.y, radius, 0, FULL_ANGLE);
    graph.closePath();
    graph.fill();
    graph.stroke();
}

const drawFood = (position, food, graph) => {
    graph.fillStyle = 'hsl(' + food.hue + ', 100%, 50%)';
    graph.strokeStyle = 'hsl(' + food.hue + ', 100%, 45%)';
    graph.lineWidth = 0;
    drawRoundObject(position, food.radius, graph);
};

const drawVirus = (position, virus, graph) => {
    graph.strokeStyle = virus.stroke;
    graph.fillStyle = virus.fill;
    graph.lineWidth = virus.strokeWidth;
    let theta = 0;
    let sides = 20;

    graph.beginPath();
    for (let theta = 0; theta < FULL_ANGLE; theta += FULL_ANGLE / sides) {
        let point = circlePoint(position, virus.radius, theta);
        graph.lineTo(point.x, point.y);
    }
    graph.closePath();
    graph.stroke();
    graph.fill();
};

const drawFireFood = (position, mass, playerConfig, graph) => {
    graph.strokeStyle = 'hsl(' + mass.hue + ', 100%, 45%)';
    graph.fillStyle = 'hsl(' + mass.hue + ', 100%, 50%)';
    graph.lineWidth = playerConfig.border + 2;
    drawRoundObject(position, mass.radius - 1, graph);
};

const valueInRange = (min, max, value) => Math.min(max, Math.max(min, value))

const circlePoint = (origo, radius, theta) => ({
    x: origo.x + radius * Math.cos(theta),
    y: origo.y + radius * Math.sin(theta)
});

/** משך ועוצמת "הדף" קוסמטי בגבול העולם (רק ציור לקוח) */
const BORDER_BOUNCE_MS = 125;
const BORDER_BOUNCE_PX = 6;

/** מפתח → מצב אנימציית bounce (לכל תא בנפרד) */
const borderBounceStates = new Map();

/** האם התא נוגע בגבול המפה + כיוון פנימה (מנורמל) */
const borderTouchInwardNormal = (cell, borders) => {
    if (!borders) {
        return { touching: false, nx: 0, ny: 0 };
    }
    var r = cell.radius;
    var minX = borders.left + r;
    var maxX = borders.right - r;
    var minY = borders.top + r;
    var maxY = borders.bottom - r;
    if (maxX < minX || maxY < minY) {
        return { touching: false, nx: 0, ny: 0 };
    }
    var eps = 1;
    var nx = 0;
    var ny = 0;
    if (cell.x <= minX + eps) {
        nx += 1;
    }
    if (cell.x >= maxX - eps) {
        nx -= 1;
    }
    if (cell.y <= minY + eps) {
        ny += 1;
    }
    if (cell.y >= maxY - eps) {
        ny -= 1;
    }
    if (nx === 0 && ny === 0) {
        return { touching: false, nx: 0, ny: 0 };
    }
    var len = Math.hypot(nx, ny);
    return { touching: true, nx: nx / len, ny: ny / len };
};

const getBorderBounceOffset = (key, touchInfo, nowMs) => {
    var st = borderBounceStates.get(key);
    if (!st) {
        st = { prevTouch: false, startMs: 0, nx: 0, ny: 0 };
        borderBounceStates.set(key, st);
    }
    if (!touchInfo.touching) {
        st.prevTouch = false;
        return { ox: 0, oy: 0 };
    }
    if (!st.prevTouch) {
        st.startMs = nowMs;
        st.nx = touchInfo.nx;
        st.ny = touchInfo.ny;
    }
    st.prevTouch = true;
    var elapsed = nowMs - st.startMs;
    if (elapsed >= BORDER_BOUNCE_MS || elapsed < 0) {
        return { ox: 0, oy: 0 };
    }
    var t = elapsed / BORDER_BOUNCE_MS;
    var mag = BORDER_BOUNCE_PX * (1 - t) * (1 - t);
    return { ox: st.nx * mag, oy: st.ny * mag };
};

/** מרכז ציור התא — מגביל כך שהעיגול המלא נשאר בתוך גבול המפה (בלי "לשטח" על הקיר) */
const clampCellDrawCenter = (cell, borders) => {
    if (!borders) {
        return { x: cell.x, y: cell.y };
    }
    var minX = borders.left + cell.radius;
    var maxX = borders.right - cell.radius;
    var minY = borders.top + cell.radius;
    var maxY = borders.bottom - cell.radius;
    if (maxX < minX || maxY < minY) {
        return { x: cell.x, y: cell.y };
    }
    return {
        x: valueInRange(minX, maxX, cell.x),
        y: valueInRange(minY, maxY, cell.y)
    };
};

const drawCells = (cells, playerConfig, toggleMassState, borders, graph) => {
    var nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var seenKeys = new Set();

    for (let cell of cells) {
        var key = cell._bounceKey != null ? String(cell._bounceKey) : ('_' + Math.round(cell.x) + '_' + Math.round(cell.y) + '_' + cell.radius);
        seenKeys.add(key);

        var touchN = borderTouchInwardNormal(cell, borders);
        var bounce = getBorderBounceOffset(key, touchN, nowMs);
        var clamped = clampCellDrawCenter(cell, borders);
        var pos = {
            x: clamped.x + bounce.ox,
            y: clamped.y + bounce.oy
        };

        graph.fillStyle = cell.color;
        graph.strokeStyle = cell.borderColor;
        graph.lineWidth = 6;
        drawRoundObject(pos, cell.radius, graph);

        // Draw the name of the player
        let fontSize = Math.max(cell.radius / 3, 12);
        graph.lineWidth = playerConfig.textBorderSize;
        graph.fillStyle = playerConfig.textColor;
        graph.strokeStyle = playerConfig.textBorder;
        graph.miterLimit = 1;
        graph.lineJoin = 'round';
        graph.textAlign = 'center';
        graph.textBaseline = 'middle';
        graph.font = 'bold ' + fontSize + 'px sans-serif';
        var nameTextDirection = graph.direction;
        graph.direction = 'rtl';
        graph.strokeText(cell.name, pos.x, pos.y);
        graph.fillText(cell.name, pos.x, pos.y);
        graph.direction = nameTextDirection || 'ltr';

        // Draw the mass (if enabled)
        if (toggleMassState === 1) {
            graph.font = 'bold ' + Math.max(fontSize / 3 * 2, 10) + 'px sans-serif';
            if (cell.name.length === 0) fontSize = 0;
            graph.strokeText(Math.round(cell.mass), pos.x, pos.y + fontSize);
            graph.fillText(Math.round(cell.mass), pos.x, pos.y + fontSize);
        }
    }

    for (const k of borderBounceStates.keys()) {
        if (!seenKeys.has(k)) {
            borderBounceStates.delete(k);
        }
    }
};

const drawGrid = (global, player, screen, graph) => {
    graph.lineWidth = 1;
    graph.strokeStyle = global.lineColor;
    graph.globalAlpha = 0.15;
    graph.beginPath();

    for (let x = -player.x; x < screen.width; x += screen.height / 18) {
        graph.moveTo(x, 0);
        graph.lineTo(x, screen.height);
    }

    for (let y = -player.y; y < screen.height; y += screen.height / 18) {
        graph.moveTo(0, y);
        graph.lineTo(screen.width, y);
    }

    graph.stroke();
    graph.globalAlpha = 1;
};

const drawBorder = (borders, graph) => {
    graph.lineWidth = 1;
    graph.strokeStyle = '#000000'
    graph.beginPath()
    graph.moveTo(borders.left, borders.top);
    graph.lineTo(borders.right, borders.top);
    graph.lineTo(borders.right, borders.bottom);
    graph.lineTo(borders.left, borders.bottom);
    graph.closePath()
    graph.stroke();
};

const drawErrorMessage = (message, graph, screen) => {
    graph.fillStyle = '#333333';
    graph.fillRect(0, 0, screen.width, screen.height);
    graph.textAlign = 'center';
    graph.fillStyle = '#FFFFFF';
    graph.font = 'bold 30px sans-serif';
    var errTextDirection = graph.direction;
    graph.direction = 'rtl';
    graph.fillText(message, screen.width / 2, screen.height / 2);
    graph.direction = errTextDirection || 'ltr';
}

module.exports = {
    drawFood,
    drawVirus,
    drawFireFood,
    drawCells,
    drawErrorMessage,
    drawGrid,
    drawBorder
};