console.log("🔥 CORRECT SERVER FILE RUNNING");

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const app = express();

/* ============================
🔥 FIXED CORS (IMPORTANT)
============================ */
app.use(cors({
origin: "*",   // allow all (fast fix)
methods: ["GET","POST","PUT","DELETE"],
allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());

/* ============================
DATABASE CONNECTION
============================ */
const JWT_SECRET = 'super-secret-key-123';

const fluxNexusHandler = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME
});

fluxNexusHandler.connect((err) => {
if (err) {
console.error('Error connecting to taskNexus:', err);
return;
}
console.log('✅ MySQL connected');
});

/* ============================
AUTH ROUTES
============================ */
app.post('/api/auth/register', (req, res) => {
const { username, email, password } = req.body;

```
const query = `INSERT INTO users (username,email,password_hash)
               VALUES ('${username}','${email}','${password}')`;

fluxNexusHandler.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const wsQuery =
    `INSERT INTO workspaces (name,description,owner_id)
     VALUES ('${username} Workspace','Default workspace',${results.insertId})`;

    fluxNexusHandler.query(wsQuery, (err2, wsResults) => {

        if (wsResults) {
            fluxNexusHandler.query(
                `INSERT INTO workspace_members 
                 (workspace_id,user_id,role) 
                 VALUES (${wsResults.insertId},${results.insertId},'owner')`
            );

            fluxNexusHandler.query(
                `INSERT INTO projects 
                 (name,description,workspace_id)
                 VALUES ('My First Project','Default project',${wsResults.insertId})`
            );
        }

        const token = jwt.sign(
            { id: results.insertId, username, email },
            JWT_SECRET
        );

        res.json({
            token,
            user:{ id:results.insertId, username, email }
        });
    });
});
```

});

app.post('/api/auth/login', (req,res)=>{
const { email,password } = req.body;

```
fluxNexusHandler.query(
    `SELECT * FROM users WHERE email='${email}'`,
    (err,results)=>{
        if(err) return res.status(500).json({error:err.message});
        if(results.length===0)
            return res.status(401).json({error:'No account found'});

        const user = results[0];
        if(user.password_hash!==password)
            return res.status(401).json({error:'Wrong password'});

        const token = jwt.sign(
            { id:user.id, username:user.username, email:user.email },
            JWT_SECRET
        );

        res.json({
            token,
            user:{ id:user.id, username:user.username, email:user.email }
        });
    }
);
```

});

app.get('/api/auth/me',(req,res)=>{
const authHeader = req.headers.authorization;
if(!authHeader) return res.status(401).json({error:'No token'});

```
try{
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token,JWT_SECRET);

    fluxNexusHandler.query(
        'SELECT id,username,email FROM users WHERE id=?',
        [decoded.id],
        (err,results)=>{
            if(err) throw err;
            res.json(results[0]);
        }
    );
}catch{
    res.status(401).json({error:'Invalid token'});
}
```

});

/* ============================
WORKSPACES
============================ */
app.get('/api/workspaces',(req,res)=>{
let userId = 1;
try{
const token = req.headers.authorization?.split(' ')[1];
if(token) userId = jwt.verify(token,JWT_SECRET).id;
}catch{}

```
fluxNexusHandler.query(
`SELECT w.*,wm.role
 FROM workspaces w
 JOIN workspace_members wm ON w.id=wm.workspace_id
 WHERE wm.user_id=?
 ORDER BY w.created_at DESC`,
[userId],
(err,results)=>{
    if(err) return res.status(500).send('error');
    res.json(results);
});
```

});

app.get('/api/workspaces/:id',(req,res)=>{
fluxNexusHandler.query(
'SELECT * FROM workspaces WHERE id=?',
[req.params.id],
(err,results)=>res.json(results[0])
);
});

app.post('/api/workspaces',(req,res)=>{
const { name,description } = req.body;

```
let userId = 1;
try{
    const token = req.headers.authorization?.split(' ')[1];
    if(token) userId = jwt.verify(token,JWT_SECRET).id;
}catch{}

const query =
`INSERT INTO workspaces (name,description,owner_id)
 VALUES ('${name}','${description}',${userId})`;

fluxNexusHandler.query(query,(err,results)=>{
    if(err) return res.status(500).json({error:err.message});

    fluxNexusHandler.query(
        `INSERT INTO workspace_members
         (workspace_id,user_id,role)
         VALUES (${results.insertId},${userId},'owner')`
    );

    res.json({
        id:results.insertId,name,description,owner_id:userId,role:'owner'
    });
});
```

});

app.delete('/api/workspaces/:id',(req,res)=>{
fluxNexusHandler.query(
'DELETE FROM workspaces WHERE id=?',
[req.params.id],
()=>res.json({message:'deleted'})
);
});

/* ============================
PROJECTS
============================ */
app.get('/api/projects/workspace/:workspaceId',(req,res)=>{
fluxNexusHandler.query(
'SELECT * FROM projects WHERE workspace_id=? ORDER BY created_at DESC',
[req.params.workspaceId],
(err,projects)=>{
if(err) return res.status(500).send('error');
res.json(projects||[]);
});
});

app.post('/api/projects',(req,res)=>{
const { name,description,color,workspaceId } = req.body;

```
const query =
`INSERT INTO projects (name,description,color,workspace_id)
 VALUES ('${name}','${description}','${color||"#3B82F6"}',${workspaceId})`;

fluxNexusHandler.query(query,(err,results)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json({
        id:results.insertId,name,description,color,workspace_id:workspaceId
    });
});
```

});

app.delete('/api/projects/:id',(req,res)=>{
fluxNexusHandler.query(
'DELETE FROM projects WHERE id=?',
[req.params.id],
()=>res.json({message:'deleted'})
);
});

/* ============================
SERVER START
============================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
console.log("🚀 SERVER RUNNING ON PORT",PORT);
});
