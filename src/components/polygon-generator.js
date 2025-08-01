class PolygonGenerator {
    constructor() {
        this.colors = [
            '#B91C1C', '#DC2626', '#EF4444', '#F87171',
            '#7C2D12', '#EA580C', '#F97316', '#FB923C',
            '#065F46', '#059669', '#10B981', '#34D399',
            '#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD'
        ];
    }

    generatePolygons(count) {
        const polygons = [];
        
        for (let i = 0; i < count; i++) {
            const polygon = this.generateSinglePolygon();
            polygons.push(polygon);
        }
        
        return polygons;
    }

    generateSinglePolygon() {
        const vertexCount = Math.floor(Math.random() * 8) + 3; // 3-10 вершин
        const centerX = Math.random() * 80 + 10; // 10-90
        const centerY = Math.random() * 80 + 10; // 10-90
        const radius = Math.random() * 30 + 15; // 15-45
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        const points = this.generatePolygonPoints(centerX, centerY, radius, vertexCount);
        
        return {
            id: this.generateId(),
            points: points,
            color: color,
            x: 0,
            y: 0
        };
    }

    generatePolygonPoints(centerX, centerY, radius, vertexCount) {
        const points = [];
        const angleStep = (2 * Math.PI) / vertexCount;
        
        for (let i = 0; i < vertexCount; i++) {
            const angle = i * angleStep + Math.random() * 0.5 - 0.25; // небольшое случайное отклонение
            const currentRadius = radius * (0.7 + Math.random() * 0.6); // случайный радиус для неправильности
            
            const x = centerX + Math.cos(angle) * currentRadius;
            const y = centerY + Math.sin(angle) * currentRadius;
            
            points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
        }
        
        return points;
    }

    generateId() {
        return 'polygon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    pointsToString(points) {
        return points.map(p => `${p.x},${p.y}`).join(' ');
    }

    createSVGPolygon(polygonData) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '120');
        svg.setAttribute('height', '120');
        svg.setAttribute('viewBox', '0 0 120 120');
        svg.style.pointerEvents = 'none'; // Отключаем pointer events для SVG
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', this.pointsToString(polygonData.points));
        polygon.setAttribute('fill', polygonData.color);
        polygon.setAttribute('stroke', '#333');
        polygon.setAttribute('stroke-width', '1');
        
        svg.appendChild(polygon);
        
        return svg;
    }
}

// Экспортируем класс глобально
window.PolygonGenerator = PolygonGenerator;