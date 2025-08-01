import './styles.css';
import './components/buffer-zone.js';
import './components/work-zone.js';
import './components/polygon-generator.js';

class PolygonApp {
    constructor() {
        this.bufferZone = null;
        this.workZone = null;
        this.polygonGenerator = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.bufferZone = document.querySelector('buffer-zone');
            this.workZone = document.querySelector('work-zone');
            this.polygonGenerator = new PolygonGenerator();
            
            this.setupEventListeners();
            this.loadData();
        });
    }

    setupEventListeners() {
        const createBtn = document.getElementById('createBtn');
        const saveBtn = document.getElementById('saveBtn');
        const resetBtn = document.getElementById('resetBtn');

        createBtn.addEventListener('click', () => this.createPolygons());
        saveBtn.addEventListener('click', () => this.saveData());
        resetBtn.addEventListener('click', () => this.resetData());
    }

    createPolygons() {
        const count = Math.floor(Math.random() * 16) + 5; // 5-20 полигонов
        const polygons = this.polygonGenerator.generatePolygons(count);
        this.bufferZone.addPolygons(polygons);
    }

    saveData() {
        const bufferPolygons = this.bufferZone.getPolygons();
        const workPolygons = this.workZone.getPolygons();
        
        const data = {
            buffer: bufferPolygons,
            work: workPolygons,
            timestamp: Date.now()
        };

        localStorage.setItem('polygonEditorData', JSON.stringify(data));
        console.log('Данные сохранены');
    }

    loadData() {
        const savedData = localStorage.getItem('polygonEditorData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.buffer) {
                    this.bufferZone.loadPolygons(data.buffer);
                }
                if (data.work) {
                    this.workZone.loadPolygons(data.work);
                }
                console.log('Данные загружены');
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        }
    }

    resetData() {
        localStorage.removeItem('polygonEditorData');
        this.bufferZone.clear();
        this.workZone.clear();
        console.log('Данные сброшены');
    }
}

// Глобальный экземпляр приложения
window.polygonApp = new PolygonApp();