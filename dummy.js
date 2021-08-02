const express = require('express');

const app = express();
const session = require('express-session')

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }))

app.get('/',(req,res)=>{
    req.session.email="vasugarga@gmail.com";
    res.send(req.session)
})


app.get('/hello',(req,res)=>{

    res.send(req.session)
})

app.listen(3000,()=>{
    console.log("server is running on port 3000");
});