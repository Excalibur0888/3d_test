class WorkZone extends HTMLElement {
    constructor() {
        super();
        this.polygons = [];
        this.polygonGenerator = null;
        
        // Параметры трансформации
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minScale = 0.1;
        this.maxScale = 10;
        
        // Параметры панорамирования
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        this.init();
    }

    init() {
        this.innerHTML = `
            <div class="work-zone-container drop-zone">
                <svg class="work-svg" width="100%" height="100%">
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#555" stroke-width="0.5" opacity="0.3"/>
                        </pattern>
                        <pattern id="major-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#777" stroke-width="1" opacity="0.5"/>
                        </pattern>
                    </defs>
                    
                    <g class="grid-group">
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        <rect width="100%" height="100%" fill="url(#major-grid)" />
                    </g>
                    
                    <g class="axes-group">
                        <!-- Оси будут добавлены динамически -->
                    </g>
                    
                    <g class="polygons-group">
                        <!-- Полигоны будут добавлены сюда -->
                    </g>
                    
                    <g class="labels-group">
                        <!-- Подписи осей будут добавлены сюда -->
                    </g>
                </svg>
            </div>
        `;

        this.container = this.querySelector('.work-zone-container');
        this.svg = this.querySelector('.work-svg');
        this.polygonsGroup = this.querySelector('.polygons-group');
        this.labelsGroup = this.querySelector('.labels-group');
        this.axesGroup = this.querySelector('.axes-group');
        
        this.setupEventListeners();
        this.updateTransform();
        this.drawAxes();
        
        // Инициализируем генератор
        if (window.PolygonGenerator) {
            this.polygonGenerator = new window.PolygonGenerator();
        } else {
            setTimeout(() => {
                this.polygonGenerator = new window.PolygonGenerator();
            }, 100);
        }
    }

    setupEventListeners() {
        // Зум колёсиком мыши
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));
            
            // Зум к точке мыши
            const scaleChange = newScale / this.scale;
            this.offsetX = mouseX - (mouseX - this.offsetX) * scaleChange;
            this.offsetY = mouseY - (mouseY - this.offsetY) * scaleChange;
            this.scale = newScale;
            
            this.updateTransform();
            this.drawAxes();
        });

        // Панорамирование - только при клике на фоне или с зажатым Ctrl
        this.container.addEventListener('mousedown', (e) => {
            if (e.button === 0 && (e.target === this.svg || e.target === this.container || e.ctrlKey)) {
                this.isPanning = true;
                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;
                this.container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const deltaX = e.clientX - this.lastPanX;
                const deltaY = e.clientY - this.lastPanY;
                
                this.offsetX += deltaX;
                this.offsetY += deltaY;
                
                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;
                
                this.updateTransform();
                this.drawAxes();
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.container.style.cursor = 'default';
            }
        });

        // Drag and Drop
        this.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.container.classList.add('drag-over');
        });

        this.addEventListener('dragleave', (e) => {
            if (!this.contains(e.relatedTarget)) {
                this.container.classList.remove('drag-over');
            }
        });

        this.addEventListener('drop', (e) => {
            e.preventDefault();
            this.container.classList.remove('drag-over');
            
            const polygonId = e.dataTransfer.getData('text/plain');
            const sourceZone = e.dataTransfer.getData('source');
            
            if (sourceZone === 'buffer-zone' && polygonId) {
                const rect = this.container.getBoundingClientRect();
                // Исправляем координаты с учетом масштаба и offset
                const dropX = (e.clientX - rect.left - this.offsetX) / this.scale;
                const dropY = (e.clientY - rect.top - this.offsetY) / this.scale;
                
                this.handlePolygonDrop(polygonId, dropX - 60, dropY - 60); // Центрируем полигон
            }
        });
    }

    handlePolygonDrop(polygonId, x, y) {
        const bufferZone = document.querySelector('buffer-zone');
        if (bufferZone) {
            const polygonData = bufferZone.removePolygon(polygonId);
            if (polygonData) {
                polygonData.x = x;
                polygonData.y = y;
                this.addPolygon(polygonData);
            }
        }
    }

    updateTransform() {
        const transform = `translate(${this.offsetX}, ${this.offsetY}) scale(${this.scale})`;
        this.polygonsGroup.setAttribute('transform', transform);
    }

    drawAxes() {
        // Очищаем старые оси и подписи
        this.axesGroup.innerHTML = '';
        this.labelsGroup.innerHTML = '';

        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Вычисляем шаг сетки в зависимости от масштаба
        let step = 50;
        while (step * this.scale < 30) step *= 2;
        while (step * this.scale > 100) step /= 2;

        // Рисуем оси X и Y
        this.drawAxis('x', width, height, step);
        this.drawAxis('y', width, height, step);
    }

    drawAxis(axis, width, height, step) {
        const isX = axis === 'x';
        const size = isX ? width : height;
        const offset = isX ? this.offsetX : this.offsetY;
        
        // Определяем диапазон видимых значений
        const start = Math.floor((-offset) / (step * this.scale)) * step;
        const end = Math.ceil((size - offset) / (step * this.scale)) * step;

        for (let value = start; value <= end; value += step) {
            const pos = value * this.scale + offset;
            
            if (pos >= 0 && pos <= size) {
                // Рисуем линию оси
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                
                if (isX) {
                    line.setAttribute('x1', pos);
                    line.setAttribute('y1', Math.max(0, Math.min(height, this.offsetY)));
                    line.setAttribute('x2', pos);
                    line.setAttribute('y2', Math.max(0, Math.min(height, this.offsetY + 10)));
                } else {
                    line.setAttribute('x1', Math.max(0, Math.min(width, this.offsetX)));
                    line.setAttribute('y1', pos);
                    line.setAttribute('x2', Math.max(0, Math.min(width, this.offsetX + 10)));
                    line.setAttribute('y2', pos);
                }
                
                line.setAttribute('stroke', '#aaa');
                line.setAttribute('stroke-width', '1');
                this.axesGroup.appendChild(line);

                // Добавляем подпись
                if (value !== 0) { // Не показываем подпись для 0
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.textContent = Math.round(value);
                    text.setAttribute('fill', '#aaa');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-family', 'Arial');
                    
                    if (isX) {
                        text.setAttribute('x', pos);
                        text.setAttribute('y', Math.max(20, Math.min(height - 5, this.offsetY + 20)));
                        text.setAttribute('text-anchor', 'middle');
                    } else {
                        text.setAttribute('x', Math.max(15, Math.min(width - 30, this.offsetX + 15)));
                        text.setAttribute('y', pos);
                        text.setAttribute('text-anchor', 'start');
                        text.setAttribute('dominant-baseline', 'middle');
                    }
                    
                    this.labelsGroup.appendChild(text);
                }
            }
        }
    }

    addPolygon(polygonData) {
        if (!this.polygonGenerator) {
            this.polygonGenerator = new window.PolygonGenerator();
        }
        
        this.polygons.push(polygonData);
        
        // Создаем группу для полигона
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'polygon');
        group.setAttribute('data-polygon-id', polygonData.id);
        group.setAttribute('transform', `translate(${polygonData.x}, ${polygonData.y})`);
        
        // Создаем полигон
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', this.polygonGenerator.pointsToString(polygonData.points));
        polygon.setAttribute('fill', polygonData.color);
        polygon.setAttribute('stroke', '#333');
        polygon.setAttribute('stroke-width', '1');
        
        group.appendChild(polygon);
        
        // Добавляем функциональность drag
        this.makeDraggable(group, polygonData);
        
        this.polygonsGroup.appendChild(group);
    }

    makeDraggable(element, polygonData) {
        element.setAttribute('draggable', 'true');
        element.style.cursor = 'move';
        
        // Переменные для внутреннего перетаскивания
        let isDragging = false;
        let startX, startY;
        let initialTransform = { x: polygonData.x, y: polygonData.y };
        
        // Drag & Drop между зонами
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', polygonData.id);
            e.dataTransfer.setData('source', 'work-zone');
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
        });
        
        // Внутреннее перетаскивание мышью
        element.addEventListener('mousedown', (e) => {
            // Предотвращаем conflict с панорамированием
            if (e.button === 0 && !e.ctrlKey) {
                e.stopPropagation(); // Останавливаем всплытие события
                isDragging = true;
                
                const rect = this.container.getBoundingClientRect();
                startX = (e.clientX - rect.left - this.offsetX) / this.scale;
                startY = (e.clientY - rect.top - this.offsetY) / this.scale;
                initialTransform = { x: polygonData.x, y: polygonData.y };
                
                element.style.opacity = '0.7';
                this.container.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                
                const rect = this.container.getBoundingClientRect();
                const currentX = (e.clientX - rect.left - this.offsetX) / this.scale;
                const currentY = (e.clientY - rect.top - this.offsetY) / this.scale;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                polygonData.x = initialTransform.x + deltaX;
                polygonData.y = initialTransform.y + deltaY;
                
                element.setAttribute('transform', `translate(${polygonData.x}, ${polygonData.y})`);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                element.style.opacity = '1';
                this.container.style.cursor = 'default';
            }
        });
    }

    removePolygon(polygonId) {
        const index = this.polygons.findIndex(p => p.id === polygonId);
        if (index !== -1) {
            const polygonData = this.polygons[index];
            this.polygons.splice(index, 1);
            
            const element = this.polygonsGroup.querySelector(`[data-polygon-id="${polygonId}"]`);
            if (element) {
                element.remove();
            }
            
            return polygonData;
        }
        return null;
    }

    getPolygons() {
        return [...this.polygons];
    }

    loadPolygons(polygons) {
        this.clear();
        polygons.forEach(polygon => this.addPolygon(polygon));
    }

    clear() {
        this.polygons = [];
        this.polygonsGroup.innerHTML = '';
    }
}

customElements.define('work-zone', WorkZone);