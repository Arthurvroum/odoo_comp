// Utilisation de l'API Odoo avec Vue.js
const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        const records = ref([]);
        const newRecord = ref({ name: '', description: '', date: '' });
        const loading = ref(false);
        
        // Fonction pour appeler l'API JSON-RPC d'Odoo
        const callOdooApi = async (endpoint, params = {}) => {
            const response = await fetch('/web/dataset/call_kw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        model: 'my_module.my_model',
                        method: endpoint,
                        args: [],
                        kwargs: params,
                    },
                    id: Math.floor(Math.random() * 1000000),
                }),
            });
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error.message);
            }
            return result.result;
        };
        
        // Fonction pour appeler nos endpoints personnalisés
        const callCustomApi = async (endpoint, params = {}) => {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    params: params,
                    id: Math.floor(Math.random() * 1000000),
                }),
            });
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error.message);
            }
            return result.result;
        };
        
        // Charger les enregistrements
        const loadRecords = async () => {
            loading.value = true;
            try {
                records.value = await callCustomApi('/api/my_module/records');
            } catch (error) {
                console.error('Error loading records:', error);
            } finally {
                loading.value = false;
            }
        };
        
        // Créer un enregistrement
        const createRecord = async () => {
            if (!newRecord.value.name) {
                alert('Le nom est requis!');
                return;
            }
            
            loading.value = true;
            try {
                await callCustomApi('/api/my_module/records/create', newRecord.value);
                newRecord.value = { name: '', description: '', date: '' };
                await loadRecords();
            } catch (error) {
                console.error('Error creating record:', error);
            } finally {
                loading.value = false;
            }
        };
        
        // Charger les données au démarrage
        onMounted(loadRecords);
        
        return {
            records,
            newRecord,
            loading,
            createRecord
        };
    }
});

app.mount('#vue-app');