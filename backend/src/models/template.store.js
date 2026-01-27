const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/templates.json');

// Ensure DB file exists
const initDB = async () => {
    try {
        await fs.access(DB_PATH);
    } catch {
        // If not exists, create with empty array
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
    }
};

const getAll = async () => {
    await initDB();
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
};

const saveAll = async (templates) => {
    await fs.writeFile(DB_PATH, JSON.stringify(templates, null, 2));
};

const TemplateStore = {
    findAll: async (filters = {}) => {
        let templates = await getAll();
        
        return templates.filter(t => {
            if (filters.category && t.category !== filters.category) return false;
            // Add other filters as needed
            return true;
        });
    },

    findById: async (id) => {
        const templates = await getAll();
        return templates.find(t => String(t.id) === String(id)) || null;
    },

    create: async (data) => {
        const templates = await getAll();
        const newTemplate = {
            id: Date.now().toString(),
            ...data,
            usage_count: 0,
            created_at: new Date().toISOString()
        };
        templates.push(newTemplate);
        await saveAll(templates);
        return newTemplate;
    },

    delete: async (id) => {
        let templates = await getAll();
        const initialLen = templates.length;
        templates = templates.filter(t => String(t.id) !== String(id));
        if (templates.length !== initialLen) {
            await saveAll(templates);
            return true;
        }
        return false;
    }
};

module.exports = TemplateStore;
