

var express=require("express");
var fileuploader=require("express-fileupload");
var app=express();


const nodemailer = require("nodemailer");
const otpStore = {}; // temporary in-memory store

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_USER || "a2d10e001@smtp-brevo.com",
        pass: process.env.BREVO_PASS || "bsksPqEZBZ8yaJX"
    }
});
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
    let pwd     = req.query.txtPwd;
    let usertype= req.query.usertype;

    let otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[emailid] = {
        otp: otp,
        pwd: pwd,
        usertype: usertype,
        expires: Date.now() + 5 * 60 * 1000  // 5 minutes
    };

    let mailOptions = {
        from: "rabiadabra@gmail.com",
        to: emailid,
        subject: "Your OTP for Signup",
        html: `
        <div style="font-family:Arial;max-width:480px;margin:auto;padding:30px;
                    border:1px solid #ddd;border-radius:12px;">
          <h2 style="color:#0d6efd;">Email Verification</h2>
          <p>Your OTP is valid for 5 minutes:</p>
          <div style="font-size:38px;font-weight:bold;letter-spacing:12px;
                      color:#0d6efd;margin:24px 0;text-align:center;">${otp}</div>
          <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>`
    };
    

    transporter.sendMail(mailOptions, function (err) {
        if (err) { 
            console.log("MAIL ERROR:", err.message);
            res.send("Email send failed"); 
        }
        else { res.send("OTP_SENT"); }
    });
});
// verify OTP — saves to DB on success
app.get("/verify-otp", function (req, res) {
    let email  = req.query.email;
    let otp    = req.query.otp;
    let record = otpStore[email];

    if (!record) return res.send("OTP Expired. Signup again.");
    if (Date.now() > record.expires) {
        delete otpStore[email];
        return res.send("OTP Expired. Signup again.");
    }
    if (record.otp !== otp) return res.send("Wrong OTP. Try again.");

    // OTP correct — now save to your existing DB
    mySqlVen.query(
        "INSERT INTO users (emailid, pwd, usertype, status, dos) VALUES (?, ?, ?, 1, CURRENT_DATE())",
        [email, record.pwd, record.usertype],
        function (errKuch) {
            delete otpStore[email];
            if (errKuch == null) { res.send("SUCCESS"); }
            else { res.send("Server error " + errKuch.message); }
        }
    );
});

// resend OTP
app.get("/resend-otp", function (req, res) {
    let email  = req.query.email;
    let record = otpStore[email];

    if (!record) return res.send("Session expired. Signup again.");

    let newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email].otp     = newOtp;
    otpStore[email].expires = Date.now() + 5 * 60 * 1000;

    let mailOptions = {
        from:"rabiadabra@gmail.com",
        to: email,
        subject: "Resend OTP - Signup",
        html: `
        <div style="font-family:Arial;max-width:480px;margin:auto;padding:30px;
                    border:1px solid #ddd;border-radius:12px;">
          <h2 style="color:#0d6efd;">New OTP</h2>
          <div style="font-size:38px;font-weight:bold;letter-spacing:12px;
                      color:#0d6efd;margin:24px 0;text-align:center;">${newOtp}</div>
        </div>`
    };

    transporter.sendMail(mailOptions, function (err) {
        if (err) { res.send("Resend failed."); }
        else      { res.send("New OTP sent!"); }
    });
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
app.get("/do-fetch-all-users", function(req, res) {
    mySqlVen.query("SELECT * FROM postevent", function(err, allRecords) {
        if (err) {
            console.error(err);
            return res.status(500).send("DB error");
        }
        res.send(allRecords);
    });
});
//ai




  
app.post("/profile-player", async function(req, res) {

    let adharpic = "";
    let profilepic = "";

    try {
        // Handle Aadhaar pic
        if (req.files && req.files.adharpic) {
            let fName = req.files.adharpic.name;
            let fullpath = __dirname + "/public/pics/" + fName;
            await req.files.adharpic.mv(fullpath);
            const picUrlResult = await cloudinary.uploader.upload(fullpath);
            adharpic = picUrlResult.url;
            console.log("Aadhaar pic uploaded:", adharpic);
        } else {
            adharpic = "nopic.jpg";
        }

        // Handle Profile pic
        if (req.files && req.files.profilepic) {
            let fName = req.files.profilepic.name;
            let fullpath = __dirname + "/public/pics/" + fName;
            await req.files.profilepic.mv(fullpath);
            const picUrlResult = await cloudinary.uploader.upload(fullpath);
            profilepic = picUrlResult.url;
            console.log("Profile pic uploaded:", profilepic);
        } else {
            profilepic = "nopic.jpg";
        }

        // Get all form fields manually
        let emailid   = req.body.emailid;
        let name      = req.body.name;
        let dob       = req.body.dob;
        let gender    = req.body.gender;
        let address   = req.body.address;
        let contact   = req.body.contact;
        let game      = req.body.game;
        let otherinfo = req.body.otherinfo;

        // Save to MySQL
        mySqlVen.query(
            "INSERT INTO players VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [emailid, adharpic, profilepic, name, dob, gender, address, contact, game, otherinfo],
            function (err) {
                if (err == null) {
                    res.send("Player record successfully saved!");
                } else {
                    res.send(err.message);
                }
            }
        );

    } catch (err) {
        console.error(err);
        res.send("Error: " + err.message);
    }
});


app.post("/update-player", async function(req, res) {

    let adharpic = "";
    let profilepic = "";

    try {
        // Handle Aadhaar pic
        if (req.files && req.files.adharpic) {
            let fName = req.files.adharpic.name;
            let fullpath = __dirname + "/public/pics/" + fName;
            await req.files.adharpic.mv(fullpath);
            const picUrlResult = await cloudinary.uploader.upload(fullpath);
            adharpic = picUrlResult.url;
        } else {
            adharpic = req.body.hdn;
        }

        // Handle Profile pic
        if (req.files && req.files.profilepic) {
            let fName = req.files.profilepic.name;
            let fullpath = __dirname + "/public/pics/" + fName;
            await req.files.profilepic.mv(fullpath);
            const picUrlResult = await cloudinary.uploader.upload(fullpath);
            profilepic = picUrlResult.url;
        } else {
            profilepic = req.body.hdn2;
        }

        // Get all form fields manually
        let emailid   = req.body.emailid;
        let name      = req.body.name;
        let dob       = req.body.dob;
        let gender    = req.body.gender;
        let address   = req.body.address;
        let contact   = req.body.contact;
        let game      = req.body.game;
        let otherinfo = req.body.otherinfo;

        // Update MySQL
        mySqlVen.query(
            "UPDATE players SET adharpic=?, profilepic=?, name=?, dob=?, gender=?, address=?, contact=?, game=?, otherinfo=? WHERE emailid=?",
            [adharpic, profilepic, name, dob, gender, address, contact, game, otherinfo, emailid],
            function (err, result) {
                if (err == null) {
                    if (result.affectedRows == 1) {
                        res.send("Updated successfully");
                    } else {
                        res.send("Invalid email id");
                    }
                } else {
                    res.send(err.message);
                }
            }
        );

    } catch (err) {
        console.error(err);
        res.send("Error: " + err.message);
    }
});


app.get("/do-fetch-players", function (req, resp) {
    mySqlVen.query("select * from players", function (err, allRecords) {
        console.log(req.query);
        resp.send(allRecords); //aise error pta lga skte h(localhost:2004/do-fetch-all-users)
    })
})
//save contact
app.get("/save-contact", function (req, res) {

    let name = req.query.name;
    let email = req.query.email;
    let msg = req.query.msg;

    let sql = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";

    mySqlVen.query(sql, [name, email, msg], function (err) {
        if (err) {
            console.log(err);
            res.send("DB Error");
        } else {
            res.send("Message Saved Successfully");
        }
    });

});
