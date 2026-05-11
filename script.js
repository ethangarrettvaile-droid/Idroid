// Use the URL from your Data API settings
const PROJECT_URL = 'https://upxkuvcwrpmafroqgmuf.supabase.co'; 
// Use the 'sb_publishable' key you found
const ANON_KEY = 'sb_publishable_ZnFA_cJpNDy8DomvLcvWag_ZnCxPSUh'; 

const _supabase = supabase.createClient(PROJECT_URL, ANON_KEY);

async function loadMissions(typeFilter) {
    const board = document.getElementById('mission-board');
    board.innerHTML = 'RETRIEVING INTEL...';

    // Fetch all missions
    const { data: missions, error } = await _supabase
        .from('missions')
        .select('*');

    if (error) {
        console.error("Database Error:", error);
        board.innerHTML = 'CONNECTION ERROR';
        return;
    }

    const completedIds = missions.filter(m => m.is_completed).map(m => m.id);

    board.innerHTML = missions
        .filter(m => m.type === typeFilter)
        .map(mission => {
            // Logic: Is mission unlocked?
            const isUnlocked = mission.requirements.every(reqId => completedIds.includes(reqId));
            
            return `
                <div class="mission-card ${isUnlocked ? '' : 'locked'}">
                    <h3>${isUnlocked ? mission.title : '?? [LOCKED] ??'}</h3>
                    <p>${isUnlocked ? mission.description : 'Complete prerequisite missions to unlock data.'}</p>
                    <small>Deadline: ${mission.deadline || 'NONE'}</small>
                </div>
            `;
        }).join('');
}

// Initial Load
loadMissions('main');

// Simple Clock Logic
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

function toggleCreator() {
    const creator = document.getElementById('mission-creator');
    const btn = document.getElementById('toggle-creator');
    creator.classList.toggle('hidden');
    btn.innerText = creator.classList.contains('hidden') ? '+ OPEN COMMS' : '- CLOSE COMMS';
}

async function deployMission() {
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const type = document.getElementById('task-type').value;
    const deadline = document.getElementById('task-deadline').value;
    const subtasksRaw = document.getElementById('task-subtasks').value;
    const prereq = document.getElementById('task-prereq').value;

    // Convert comma-separated string into structured subtask objects
    const subtaskList = subtasksRaw.split(',')
        .map(s => s.trim())
        .filter(s => s !== "")
        .map(text => ({ text, completed: false }));

    const { data, error } = await _supabase
        .from('missions')
        .insert([
            { 
                title, 
                description: desc, 
                type, 
                deadline,
                subtasks: subtaskList, 
                prerequisite_id: prereq || null 
            }
        ]);

    if (error) {
        console.error("MISSION ABORTED:", error.message);
    } else {
        toggleCreator(); // Hide menu on success
        loadMissions(type);
    }
}

async function deployMission() {
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const type = document.getElementById('task-type').value;
    const deadline = document.getElementById('task-deadline').value;

    if (!title) return alert("MISSION TITLE REQUIRED");

    // This sends the data to Supabase
    const { data, error } = await _supabase
        .from('missions')
        .insert([
            { 
                title: title, 
                description: desc, 
                type: type, 
                deadline: deadline || null,
                is_completed: false,
                requirements: [] // Starts with no requirements
            }
        ]);

    if (error) {
        console.error("Deployment Failed:", error);
        alert("UPLOAD FAILED: " + error.message);
    } else {
        console.log("Mission Logged.");
        // Clear the form
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        // Refresh the list automatically
        // Remove the lone loadMissions('main') line and replace it with this:
window.onload = () => {
    console.log("iDroid initialized. Checking for board...");
    const board = document.getElementById('mission-board');
    
    if (board) {
        loadMissions('main');
    } else {
        console.error("MISSION-BOARD NOT FOUND IN HTML. Visual output disabled.");
    }
};
    }
}
