class BufferZone extends HTMLElement {
    constructor() {
        super();
        this.polygons = [];
        this.polygonGenerator = null;
        this.init();
    }

    init() {
        this.innerHTML = `
            <div class="buffer-zone-container drop-zone">
                <div class="polygons-container"></div>
            </div>
        `;

        this.container = this.querySelector('.polygons-container');
        this.dropZone = this.querySelector('.drop-zone');
        
        this.setupDragAndDrop();
        
        // Инициализируем генератор после загрузки DOM
        if (window.PolygonGenerator) {
            this.polygonGenerator = new window.PolygonGenerator();
        } else {
            // Ждем загрузки генератора
            setTimeout(() => {
                this.polygonGenerator = new window.PolygonGenerator();
            }, 100);
        }
    }

    setupDragAndDrop() {
        // Обработчики для зоны drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            if (!this.dropZone.contains(e.relatedTarget)) {
                this.dropZone.classList.remove('drag-over');
            }
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            
            const polygonId = e.dataTransfer.getData('text/plain');
            const sourceZone = e.dataTransfer.getData('source');
            
            if (sourceZone === 'work-zone' && polygonId) {
                this.handlePolygonDrop(polygonId);
            }
        });
    }

    handlePolygonDrop(polygonId) {
        const workZone = document.querySelector('work-zone');
        if (workZone) {
            const polygonData = workZone.removePolygon(polygonId);
            if (polygonData) {
                this.addPolygon(polygonData);
            }
        }
    }

    addPolygons(polygons) {
        polygons.forEach(polygon => this.addPolygon(polygon));
    }

    addPolygon(polygonData) {
        if (!this.polygonGenerator) {
            this.polygonGenerator = new window.PolygonGenerator();
        }
        
        this.polygons.push(polygonData);
        
        // Создаем обёртку для drag & drop
        const wrapper = document.createElement('div');
        wrapper.className = 'polygon-wrapper';
        wrapper.setAttribute('data-polygon-id', polygonData.id);
        wrapper.style.cssText = `
            display: inline-block;
            cursor: move;
            margin: 5px;
            user-select: none;
        `;
        
        const svgElement = this.polygonGenerator.createSVGPolygon(polygonData);
        svgElement.style.display = 'block';
        
        wrapper.appendChild(svgElement);
        
        // Добавляем функциональность drag к обёртке
        this.makeDraggable(wrapper, polygonData);
        
        this.container.appendChild(wrapper);
    }

    makeDraggable(element, polygonData) {
        element.setAttribute('draggable', 'true');
        
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', polygonData.id);
            e.dataTransfer.setData('source', 'buffer-zone');
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
        });
    }

    removePolygon(polygonId) {
        const index = this.polygons.findIndex(p => p.id === polygonId);
        if (index !== -1) {
            const polygonData = this.polygons[index];
            this.polygons.splice(index, 1);
            
            const wrapper = this.container.querySelector(`[data-polygon-id="${polygonId}"]`);
            if (wrapper) {
                wrapper.remove();
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
        this.container.innerHTML = '';
    }
}

customElements.define('buffer-zone', BufferZone);