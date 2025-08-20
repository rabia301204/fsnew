
const { GoogleGenerativeAI } = require("@google/generative-ai");
var express=require("express");
var fileuploader=require("express-fileupload");
var app=express();


 const genAI = new GoogleGenerativeAI("AIzaSyC7aogaEG4Lh5rhIJG2nfjtq3cBxt5bp9M");
 const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

var cloudinary=require("cloudinary").v2;
var mysql2=require("mysql2");
app.use(fileuploader());//recieve from client nd send to server


app.use(express.urlencoded({extended:true}));
app.listen(2006,function(){
    console.log("Server Started at Port no: 2006")
})
app.use(express.static("public"));
app.get("/",function(req,res){
     console.log(__dirname);
    console.log(__filename);

    let path=__dirname+"/public/index.html";
    res.sendFile(path);


});
app.use(express.urlencoded(true));//convert post data to json object
 cloudinary.config({ 
            cloud_name: 'dpchefmxg', 
            api_key: '794761316383974', 
            api_secret: 'Ey69c5UQZ2FCEI4_SlCq3nvWMnY' // Click 'View API Keys' above to copy your API secret
        });
let dbConfig = "mysql://avnadmin:AVNS_qyYLzawHU9nJQm6ms21@mysql-3aa3ded2-rabiadabra-4da4.c.aivencloud.com:10417/defaultdb";
let mySqlVen = mysql2.createConnection(dbConfig);
mySqlVen.connect(function (errKuch) {
    if (errKuch==null) {
        console.log("Succesffully aiven connected");
    } else {
        console.log(errKuch.message)
    }
});

app.get("/signup-one", function (req, res) {
    let emailid = req.query.txtEmail;
    let pwd = req.query.txtPwd;
    let usertype = req.query.usertype;

    mySqlVen.query(
        "INSERT INTO users (emailid, pwd, usertype, status, dos) VALUES (?, ?, ?, 1, CURRENT_DATE())",
        [emailid, pwd, usertype],
        function (errKuch) {
            if (errKuch == null){
                res.send("Record Saved Successfully.");}
            else{
            
                res.send("Server error " + errKuch.message);}
        }
    );
});
app.get("/do-login", function (req, res) {
    let emailid = req.query.loginEmail;
    let pwd = req.query.loginPass;

    let query = "SELECT * FROM users WHERE emailid = ? AND pwd = ?";

    mySqlVen.query(query, [emailid, pwd], function (err, allRecords) {

        if (allRecords.length == 0) {
           res.send("Invalid");
        }


        else if(allRecords[0].status==1){
            res.send(allRecords[0].usertype);}

        else {
            res.send("Blocked");
        }

    });
});
// oranization details
//for puc uploading
app.post("/org_form", async function(req,res){
    
    let picurl="";

    if(req.files!=null){
       let fName=req.files.profilepic.name;
        let fullpath=__dirname+"/public/pics/"+fName;
        req.files.profilepic.mv(fullpath);
        await cloudinary.uploader.upload(fullpath).then(function(picUrlResult){
            picurl=picUrlResult.url;
            console.log(picurl);
        });
    }
    else
        picurl="nopic.jpg";
       
    let orgemail=req.body.orgemail;
    let orgname=req.body.orgname;

     let regno=req.body.regno;
    //  if (regno.trim() === "") {
    //     regno = null; // or regno = 0;
    // } else {
    //     regno = parseInt(regno);
    // }
    let address=req.body.address;
    let city=req.body.city;
    let sports=req.body.sports;
    let website=req.body.website;
    let insta=req.body.insta;
    let head=req.body.head;
    let contact=req.body.contact;
   



 
// let query = `INSERT INTO orgdetails 
//         (orgemail,orgname, regno, address, city, sports, website, insta, head, contact, fileName) 
//         VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

//     let values = [orgemail,orgname, regno, address, city, sports, website, insta, head, contact, fileName];

//     mySqlVen.query(query, values, function(err, result) {
//        if(err==null){
//         res.send("record saved succesfully");
//        }
//        else{
//         res.send(err.message);

//        }
//     });
// });
mySqlVen.query("INSERT into orgdetails values(?,?,?,?,?,?,?,?,?,?,?)",[orgemail,orgname, regno, address, city, sports, website, insta, head, contact, picurl],function(err){
    if(err==null){
        res.send(" organisation record successfully saved!!");
    }
    else{
        res.send(err);
    }
});

});
//modify org form
app.post("/modify_form",async function(req,res){
    let picurl= "";
    if(req.files!=null){
        let fName=req.files.profilepic.name;
        let fullpath=__dirname+"/public/pics/"+fName;
        req.files.profilepic.mv(fullpath);
        await cloudinary.uploader.upload(fullpath).then (function(picUrlResult){
            picurl=picUrlResult.url;
            console.log(picurl);
        });
    }
    else
    picurl=req.body.hdn;

    let orgemail=req.body.orgemail;
    let orgname=req.body.orgname;

    let regno=req.body.regno;
    let address=req.body.address;
    let city=req.body.city;
    let sports=req.body.sports;
    let website=req.body.website;
    let insta=req.body.insta;
    let head=req.body.head;
    let contact=req.body.contact;

    mySqlVen.query("update orgdetails set orgname=?,regno=?,address=?,city=?,sports=?, website=?,insta=?,head=?,contact=? ,picurl=? where orgemail=?",[orgname,regno,address,city,sports,website,insta,head,contact,picurl,orgemail],function(errkuch,result)
    {
        if(errkuch == null)
        {
            if(result.affectedRows==1){
                res.send("updated successfully");}
                else {
                    res.send("invalid email id");
                
            }}
            else{
                res.send(errkuch.message)}

            
});

    });
    //search
    app.get("/get_one",function(req,res)
{
        mySqlVen.query("select * from orgdetails where orgemail=?",[req.query.orgemail],function(err,allRecords)
        {
            if(allRecords.length==0)
                res.send("No Record Found");
            else
                res.json(allRecords);
        })
})

    






// post_event
app.get("/post_event", function (req, res) {
    //sql=req.query.name
    let eventEmail = req.query.eventEmail;
    let eventTitle = req.query.eventTitle;
    let eventDate = req.query.eventDate;
    let eventCity=req.query.eventCity;
    let eventTime=req.query.eventTime;
    let eventAdd=req.query.eventAdd;
    let eventSport=req.query.eventSport;
    let eventmin=req.query.eventmin;
    let eventmax=req.query.eventmax;
    let eventlast=req.query.eventlast;
    let eventfee=req.query.eventfee;
    let eventmoney=req.query.eventmoney;
    let eventcnt=req.query.eventcnt;


    mySqlVen.query(
        "INSERT INTO postevent (rid,eventEmail,eventTitle,eventDate,eventCity,eventTime,eventAdd,eventSport,eventmin,eventmax,eventlast,eventfee,eventmoney,eventcnt) VALUES (null, ?, ?, ?,?,?,?,?,?,?,?,?,?,?) ",
        [eventEmail,eventTitle,eventDate,eventCity,eventTime,eventAdd,eventSport,eventmin,eventmax,eventlast,eventfee,eventmoney,eventcnt],
        function (er) {
            if (er== null){
                res.send("Record Saved Successfully.");}
            else{
            
                res.send("Server error " + er.message);}
        }
    );
});
//manage ur  on specific emial id tournamnet 
app.get("/delete-one",function(req,res)
{
    console.log(req.query)
    let rid=req.query.rid;
    

    mySqlVen.query("delete from postevent where rid=? ",[rid,],function(errKuch,result)
    {
        if(errKuch==null)
                {
                    if(result.affectedRows==1)
                        res.send(rid+" Deleted Successfulllyyyy...");
                    else
                        res.send("Invalid  rid");
                }
                else
                res.send(errKuch);

    })
}) 

    

//user_console
app.get("/get-all-users", function(req, res) {
  mySqlVen.query("SELECT * FROM users", function(err, result) {
    if (err) res.status(500).send(err);
    else res.send(result);
  });
});

app.post("/change-user-status", function(req, res) {
    console.log("received",req.body);
  let emailid = req.body.emailid;
  let status = parseInt(req.body.status); // make sure status is a number

  let query = "UPDATE users SET status = ? WHERE emailid = ?";
  mySqlVen.query(query, [status, emailid], function(err, result) {
    if (err) res.status(500).send("Database error: " + err.message);
    else res.send("Status updated successfully");
  });
});

//displaying all organisation details
app.get("/do-fetch-all-org",function(req,resp)
{
        mySqlVen.query("select * from orgdetails",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
app.get("/do-fetch-all-players",function(req,resp)
{
        mySqlVen.query("select * from players",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
   //displaying all tournmanets 
app.get("/do-fetch-all-tour",function(req,resp)
{
        mySqlVen.query("select * from postevent",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
app.get("/do-fetch-all-cities",function(req,resp)
{
        mySqlVen.query("select distinct eventCity from postevent",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
app.get("/do-fetch-all-tournaments",function(req,resp)
{
  console.log(req.query)
        mySqlVen.query("select * from postevent where eventCity=? and eventSport=?",[req.query.kuchCity,req.query.kuchGame],function(err,allRecords)
        {
          console.log(allRecords)
                    resp.send(allRecords);
        })
})
app.get("/update-password", function (req, res) {
    let emailid = req.query.emailid;
    let pwd = req.query.pwd;
    let pwdsetnew=req.query.pwdsetnew;
    

    mySqlVen.query(
        "update users set pwd=? where emailid=? and pwd=? ",
        [pwdsetnew,emailid,pwd],
        function (errKuch) {
            if (errKuch == null){
                res.send("updated Saved Successfully.");}
            else{
            
                res.send("Server error " + errKuch.message);}
        }
    );
});
//manage ur tournamnet 
app.get("/delete-one",function(req,res)
{
    console.log(req.query)
    let rid=req.query.rid;
    

    mySqlVen.query("delete from postevent where rid=? ",[rid,],function(errKuch,result)
    {
        if(errKuch==null)
                {
                    if(result.affectedRows==1)
                        res.send(rid+" Deleted Successfulllyyyy...");
                    else
                        res.send("Invalid  rid");
                }
                else
                res.send(errKuch);

    })
}) 
app.get("/do-fetch-all-users",function(req,res)
{
let emailid=req.query.emailid
        mySqlVen.query("select * from postevent where eventEmail = ?",[emailid],function(err,allRecords)
        {
                    res.send(allRecords);
        })
})
//ai




  
async function RajeshBansalKaChirag(imgurl) {
    const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string.";
    const imageResp = await fetch(imgurl).then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);

    const cleaned = result.response.text().replace(/json|/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    return jsonData;
}
app.post("/profile-player", async function(req,res){
    
    let adharpic="";
    let jsonData={};


    if(req.files!=null){
       let fName=req.files.adharpic.name;
        let fullpath=__dirname+"/public/pics/"+fName;
        req.files.adharpic.mv(fullpath);
        await cloudinary.uploader.upload(fullpath).then(function(picUrlResult){
            adharpic=picUrlResult.url;
            console.log(adharpic);
            
        });
    }
    else
        adharpic="nopic.jpg";

    let profilepic="";
    if (req.files != null) {
        let fName = req.files.profilepic.name;
        let fullPath = __dirname + "/public/pics/" + fName;
        req.files.profilepic.mv(fullPath);

       try{
        await cloudinary.uploader.upload(fullPath).then(async function (picUrlResult) {
                
            let jsonData=await RajeshBansalKaChirag( picUrlResult.url);
            
            res.send(jsonData);

        });

        //var respp=await run("https://res.cloudinary.com/dfyxjh3ff/image/upload/v1747073555/ed7qdfnr6hez2dxoqxzf.jpg", myprompt);
        // resp.send(respp);
        // console.log(typeof(respp));
        }
        catch(err)
        {
            res.send(err.message)
        }}
       

    
    else {
        profilepic = "nopic.jpg";
    }



       
    let emailid=req.body.emailid;
    //let name=req.body.name;

     
    let address=req.body.address;
   
    let contact=req.body.contact;
    let game=req.body.game;
    let otherinfo=req.body.otherinfo;
   



 

mySqlVen.query("INSERT into players values(?,?,?,?,?,?,?,?,?,?)",[emailid,adharpic,profilepic, jsonData.name, jsonData.dob,jsonData.gender,address,contact,game,otherinfo],function(err){
    if(err==null){
        res.send("players record successfully saved!!");
    }
    else{
        res.send(err);
    }
});

});
app.post("/update-player",async function(req,res){
    let adharpic= "";
    if(req.files!=null){
        let fName=req.files.adharpic.name;
        let fullpath=__dirname+"/public/pics/"+fName;
        req.files.adharpic.mv(fullpath);
        await cloudinary.uploader.upload(fullpath).then (function(picUrlResult){
            adharpic=picUrlResult.url;
            console.log(adharpic);
        });
    }
    else
    adharpic=req.body.hdn;

 let profilepic= "";
    if(req.files!=null){
        let fName=req.files.profilepic.name;
        let fullpath=__dirname+"/public/pics/"+fName;
        req.files.profilepic.mv(fullpath);
        await cloudinary.uploader.upload(fullpath).then (function(picUrlResult){
            profilepic=picUrlResult.url;
            console.log(profilepic);
        });
    }
    else
    profilepic=req.body.hdn2;

    let emailid=req.body.emailid;
    //let name=req.body.name;

     
    let address=req.body.address;
   
    let contact=req.body.contact;
    let game=req.body.game;
    let otherinfo=req.body.otherinfo;

    mySqlVen.query("update players set emailid=?,address=?,contact=?,game=?,otherinfo=? where emailid=?",[adharpic,profilepic,name,dob,gender,addresss,contact,game,otherinfo,emailid],function(errkuch,result)
    {
        if(errkuch == null)
        {
            if(result.affectedRows==1){
                res.send("updated successfully");}
                else {
                    res.send("invalid email id");
                
            }}
            else{
                res.send(errkuch.message)}

            
});

    });
app.get("/fetch-player-details", function (req, resp) {
    mySqlVen.query("select * from players where emailid=?", [req.query.orgEmail], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else
            resp.json(allRecords);
    })
})
