console.log("🔥 CORRECT SERVER FILE RUNNING");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

const app = express();

/* ============================
CORS
============================ */
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());

/* ============================
DATABASE CONNECTION (IMPORTANT)
============================ */

const DATABASE_URL = process.env.DATABASE_URL;

if(!DATABASE_URL){
  console.log("❌ DATABASE_URL NOT FOUND IN ENV");
  process.exit(1);
}

const db = mysql.createConnection(DATABASE_URL);

db.connect((err)=>{
  if(err){
    console.error("❌ MySQL connection failed:", err);
    return;
  }
  console.log("✅ MySQL CONNECTED SUCCESSFULLY");
});

/* ============================
JWT
============================ */
const JWT_SECRET = "super-secret-key-123";

/* ============================
REGISTER
============================ */
app.post("/api/auth/register",(req,res)=>{
  const { username,email,password } = req.body;

  const query = `
    INSERT INTO users (username,email,password_hash)
    VALUES (?,?,?)
  `;

  db.query(query,[username,email,password],(err,results)=>{
    if(err) return res.status(500).json({error:err.message});

    const userId = results.insertId;

    db.query(
      `INSERT INTO workspaces (name,description,owner_id)
       VALUES (?,?,?)`,
      [`${username} Workspace`,"Default workspace",userId],
      (err2,wsResults)=>{

        if(wsResults){
          const wsId = wsResults.insertId;

          db.query(
            `INSERT INTO workspace_members (workspace_id,user_id,role)
             VALUES (?,?,?)`,
            [wsId,userId,"owner"]
          );

          db.query(
            `INSERT INTO projects (name,description,workspace_id)
             VALUES (?,?,?)`,
            ["My First Project","Default project",wsId]
          );
        }

        const token = jwt.sign({ id:userId,username,email },JWT_SECRET);

        res.json({
          token,
          user:{ id:userId,username,email }
        });
      });
  });
});

/* ============================
LOGIN
============================ */
app.post("/api/auth/login",(req,res)=>{
  const { email,password } = req.body;

  db.query(
    `SELECT * FROM users WHERE email=?`,
    [email],
    (err,results)=>{
      if(err) return res.status(500).json({error:err.message});
      if(results.length===0)
        return res.status(401).json({error:"No account found"});

      const user = results[0];

      if(user.password_hash!==password)
        return res.status(401).json({error:"Wrong password"});

      const token = jwt.sign(
        { id:user.id,username:user.username,email:user.email },
        JWT_SECRET
      );

      res.json({
        token,
        user:{ id:user.id,username:user.username,email:user.email }
      });
    }
  );
});

/* ============================
CURRENT USER
============================ */
app.get("/api/auth/me",(req,res)=>{
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({error:"No token"});

  try{
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token,JWT_SECRET);

    db.query(
      "SELECT id,username,email FROM users WHERE id=?",
      [decoded.id],
      (err,results)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json(results[0]);
      }
    );
  }catch{
    res.status(401).json({error:"Invalid token"});
  }
});

/* ============================
WORKSPACES
============================ */
app.get("/api/workspaces",(req,res)=>{
  let userId = 1;

  try{
    const token = req.headers.authorization?.split(" ")[1];
    if(token) userId = jwt.verify(token,JWT_SECRET).id;
  }catch{}

  db.query(
    `SELECT w.*,wm.role
     FROM workspaces w
     JOIN workspace_members wm ON w.id=wm.workspace_id
     WHERE wm.user_id=?`,
    [userId],
    (err,results)=>{
      if(err) return res.status(500).json({error:"DB error"});
      res.json(results);
    }
  );
});

/* ============================
PROJECTS
============================ */
app.get("/api/projects/workspace/:workspaceId",(req,res)=>{
  db.query(
    `SELECT * FROM projects WHERE workspace_id=?`,
    [req.params.workspaceId],
    (err,results)=>{
      if(err) return res.status(500).json({error:"DB error"});
      res.json(results);
    }
  );
});

app.post("/api/projects",(req,res)=>{
  const { name,description,color,workspaceId } = req.body;

  db.query(
    `INSERT INTO projects (name,description,color,workspace_id)
     VALUES (?,?,?,?)`,
    [name,description,color||"#3B82F6",workspaceId],
    (err,results)=>{
      if(err) return res.status(500).json({error:err.message});
      res.json({ id:results.insertId,name,description,color });
    }
  );
});

/* ============================
SERVER START
============================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
  console.log("🚀 SERVER RUNNING ON PORT",PORT);
});
